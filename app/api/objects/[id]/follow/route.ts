import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { trackEvent } from '@/lib/analytics'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const objectId = params.id
    const body = await req.json().catch(() => ({}))
    const isFollowing = body.isFollowing !== false // default true

    // Sponsors can follow; check if user has scanned (unless admin)
    if (!session.user.isAdmin) {
      const hasScan = await prisma.scan.findFirst({ where: { objectId, userId: session.userId } })
      if (!hasScan) {
        return NextResponse.json({ error: 'Must scan object first to follow' }, { status: 403 })
      }
    }

    const follow = await prisma.objectFollow.upsert({
      where: { objectId_userId: { objectId, userId: session.userId } },
      create: { objectId, userId: session.userId, isFollowing },
      update: { isFollowing },
    })

    await trackEvent(isFollowing ? 'object_follow' : 'object_unfollow', {
      userId: session.userId,
      objectId,
    })

    return NextResponse.json({ isFollowing: follow.isFollowing })
  } catch {
    return NextResponse.json({ error: 'Failed to update follow' }, { status: 500 })
  }
}
