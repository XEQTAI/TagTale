import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    const { id } = params

    const object = await prisma.tagObject.findUnique({
      where: { id },
      include: {
        sponsor: true,
        createdBy: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { scans: true, posts: true, followers: true } },
      },
    })

    if (!object) return NextResponse.json({ error: 'Object not found' }, { status: 404 })

    // Check if current user follows this object
    let isFollowing = false
    let hasScanned = false
    let lastScan: Date | null = null

    if (session) {
      const follow = await prisma.objectFollow.findUnique({
        where: { objectId_userId: { objectId: id, userId: session.userId } },
      })
      isFollowing = follow?.isFollowing ?? false

      const scan = await prisma.scan.findFirst({
        where: { objectId: id, userId: session.userId },
        orderBy: { scannedAt: 'desc' },
      })
      hasScanned = !!scan
      lastScan = scan?.scannedAt ?? null
    }

    return NextResponse.json({ ...object, isFollowing, hasScanned, lastScan })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch object' }, { status: 500 })
  }
}
