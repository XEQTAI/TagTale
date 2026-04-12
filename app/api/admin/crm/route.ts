import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireAdmin } from '@/lib/auth'
import { httpStatusFromAuthError } from '@/lib/http-status'
import { z } from 'zod'

const sponsorSchema = z.object({
  type: z.literal('sponsor'),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
})

const contactSchema = z.object({
  type: z.literal('contact'),
  sponsorId: z.string(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  notes: z.string().optional(),
})

const dealSchema = z.object({
  type: z.literal('deal'),
  sponsorId: z.string(),
  title: z.string().min(1),
  value: z.number().optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  notes: z.string().optional(),
})

const patchDealSchema = z.object({
  id: z.string(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  notes: z.string().optional(),
  value: z.number().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const sponsors = await prisma.sponsor.findMany({
      include: {
        contacts: true,
        deals: { orderBy: { createdAt: 'desc' } },
        _count: { select: { objects: true, ads: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Pipeline summary
    const pipeline = await prisma.sponsorDeal.groupBy({
      by: ['stage'],
      _count: { id: true },
      _sum: { value: true },
    })

    return NextResponse.json({ sponsors, pipeline })
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

    if (body.type === 'sponsor') {
      const { type: _, ...data } = sponsorSchema.parse(body)
      const sponsor = await prisma.sponsor.create({ data })
      return NextResponse.json(sponsor, { status: 201 })
    }

    if (body.type === 'contact') {
      const { type: _, ...data } = contactSchema.parse(body)
      const contact = await prisma.sponsorContact.create({ data })
      return NextResponse.json(contact, { status: 201 })
    }

    if (body.type === 'deal') {
      const { type: _, ...data } = dealSchema.parse(body)
      const deal = await prisma.sponsorDeal.create({ data })
      return NextResponse.json(deal, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: httpStatusFromAuthError(msg) })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const body = await req.json()
    const { id, ...data } = patchDealSchema.parse(body)

    const deal = await prisma.sponsorDeal.update({
      where: { id },
      data: { ...data, closedAt: data.stage === 'won' || data.stage === 'lost' ? new Date() : undefined },
    })

    return NextResponse.json(deal)
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: httpStatusFromAuthError(msg) })
  }
}
