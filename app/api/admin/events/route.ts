import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireAdmin } from '@/lib/auth'
import { httpStatusFromAuthError } from '@/lib/http-status'
import { z } from 'zod'

const eventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  imageUrl: z.string().url().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
})

const linkSchema = z.object({
  eventId: z.string(),
  objectId: z.string(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const events = await prisma.event.findMany({
      include: {
        objects: {
          include: { object: { select: { id: true, name: true, imageUrl: true } } },
        },
        _count: { select: { objects: true } },
      },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ events })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: httpStatusFromAuthError(msg) })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const body = await req.json()

    if (body.objectId && body.eventId) {
      // Link object to event
      const { eventId, objectId, notes } = linkSchema.parse(body)
      const link = await prisma.eventObject.upsert({
        where: { eventId_objectId: { eventId, objectId } },
        create: { eventId, objectId, notes },
        update: { notes },
      })
      return NextResponse.json(link, { status: 201 })
    }

    // Create event
    const { startDate, endDate, ...rest } = eventSchema.parse(body)
    const event = await prisma.event.create({
      data: {
        ...rest,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
      },
    })
    return NextResponse.json(event, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: httpStatusFromAuthError(msg) })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const { searchParams } = req.nextUrl
    const eventId  = searchParams.get('eventId')
    const objectId = searchParams.get('objectId')

    if (eventId && objectId) {
      await prisma.eventObject.delete({ where: { eventId_objectId: { eventId, objectId } } })
    } else if (eventId) {
      await prisma.event.delete({ where: { id: eventId } })
    } else {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    }

    return NextResponse.json({ deleted: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: httpStatusFromAuthError(msg) })
  }
}
