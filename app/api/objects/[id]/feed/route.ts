import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    const { id: objectId } = params
    const { searchParams } = req.nextUrl
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    // Verify object exists
    const object = await prisma.tagObject.findUnique({ where: { id: objectId } })
    if (!object) return NextResponse.json({ error: 'Object not found' }, { status: 404 })

    // Only users who have scanned can view the feed
    if (session) {
      const hasScan = await prisma.scan.findFirst({ where: { objectId, userId: session.userId } })
      if (!hasScan && !session.user.isAdmin) {
        return NextResponse.json({ error: 'Scan required to view feed' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const posts = await prisma.post.findMany({
      where: {
        objectId,
        deletedAt: null,
        moderationStatus: { not: 'rejected' },
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
        likes: session ? { where: { userId: session.userId }, take: 1 } : false,
      },
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, -1) : posts

    const formattedPosts = items.map((p) => ({
      ...p,
      likedByMe: session ? (p.likes as { userId: string }[]).length > 0 : false,
      likes: undefined,
    }))

    return NextResponse.json({
      posts: formattedPosts,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
