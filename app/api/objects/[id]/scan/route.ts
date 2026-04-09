import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { trackEvent, log } from '@/lib/analytics'
import { z } from 'zod'

const schema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: objectId } = params
    const body = await req.json().catch(() => ({}))
    const { latitude, longitude } = schema.parse(body)

    const object = await prisma.tagObject.findUnique({ where: { id: objectId } })
    if (!object) return NextResponse.json({ error: 'Object not found' }, { status: 404 })

    const scan = await prisma.scan.create({
      data: {
        objectId,
        userId: session.userId,
        latitude,
        longitude,
      },
    })

    // Auto-follow if not already following
    await prisma.objectFollow.upsert({
      where: { objectId_userId: { objectId, userId: session.userId } },
      create: { objectId, userId: session.userId, isFollowing: true },
      update: { isFollowing: true },
    })

    await trackEvent('scan', {
      userId: session.userId,
      objectId,
      metadata: { latitude, longitude },
    })

    // Return scan with canPost flag
    return NextResponse.json({
      scan,
      canPost: true, // Just scanned = 1 hour window starts now
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    await log('error', 'Scan failed', { objectId: params.id, error: String(err) })
    return NextResponse.json({ error: 'Failed to record scan' }, { status: 500 })
  }
}

// Check if current user can post to this object (scanned within last hour)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ canPost: false, hasScanned: false })

    const { id: objectId } = params
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const recentScan = await prisma.scan.findFirst({
      where: { objectId, userId: session.userId, scannedAt: { gte: oneHourAgo } },
      orderBy: { scannedAt: 'desc' },
    })

    const anyScan = await prisma.scan.findFirst({
      where: { objectId, userId: session.userId },
      orderBy: { scannedAt: 'desc' },
    })

    return NextResponse.json({
      canPost: !!recentScan,
      hasScanned: !!anyScan,
      expiresAt: recentScan ? new Date(recentScan.scannedAt.getTime() + 60 * 60 * 1000).toISOString() : null,
      lastScan: anyScan?.scannedAt ?? null,
    })
  } catch {
    return NextResponse.json({ canPost: false, hasScanned: false })
  }
}
