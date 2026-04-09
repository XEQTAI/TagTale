import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateQrCode } from '@/lib/qr'
import { trackEvent, log } from '@/lib/analytics'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sponsorId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    const { searchParams } = req.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const skip = (page - 1) * limit

    const [objects, total] = await Promise.all([
      prisma.tagObject.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sponsor: { select: { id: true, name: true, logoUrl: true } },
          createdBy: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { scans: true, posts: true, followers: true } },
        },
      }),
      prisma.tagObject.count(),
    ])

    return NextResponse.json({ objects, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch objects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { name, description, sponsorId } = createSchema.parse(body)

    const object = await prisma.tagObject.create({
      data: { name, description, sponsorId, createdById: session.userId },
    })

    // Generate QR code
    const qrDataUrl = await generateQrCode(object.id)
    const updatedObject = await prisma.tagObject.update({
      where: { id: object.id },
      data: { qrCodeUrl: qrDataUrl },
      include: {
        sponsor: { select: { id: true, name: true, logoUrl: true } },
        createdBy: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { scans: true, posts: true, followers: true } },
      },
    })

    await trackEvent('qr_generate', { userId: session.userId, objectId: object.id })
    await log('info', 'Object created', { objectId: object.id, name, userId: session.userId })

    return NextResponse.json(updatedObject, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create object' }, { status: 500 })
  }
}
