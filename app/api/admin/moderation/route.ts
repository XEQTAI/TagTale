import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireAdmin } from '@/lib/auth'
import { deepModeratePosts } from '@/lib/ai'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    // Get posts with reports, pending review
    const reportedPosts = await prisma.post.findMany({
      where: {
        deletedAt: null,
        reports: { some: {} },
      },
      include: {
        user: { select: { id: true, username: true } },
        object: { select: { id: true, name: true } },
        _count: { select: { reports: true, likes: true, comments: true } },
        reports: {
          select: { reason: true, details: true, createdAt: true },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ posts: reportedPosts })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch moderation queue'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const body = await req.json()
    const { postIds } = body

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'postIds array required' }, { status: 400 })
    }

    // Trigger deep moderation via Managed Agents (async)
    deepModeratePosts(postIds).catch(console.error)

    return NextResponse.json({ queued: true, count: postIds.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to queue moderation'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
