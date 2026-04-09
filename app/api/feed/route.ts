import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

const AD_FREQUENCY = 5 // inject an ad every N posts

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    // Get all objects this user has scanned
    const followedObjects = await prisma.objectFollow.findMany({
      where: { userId: session.userId, isFollowing: true },
      select: { objectId: true },
    })
    const objectIds = followedObjects.map((f) => f.objectId)

    if (objectIds.length === 0) {
      return NextResponse.json({ posts: [], ads: [], hasMore: false, nextCursor: null })
    }

    const posts = await prisma.post.findMany({
      where: {
        objectId: { in: objectIds },
        deletedAt: null,
        moderationStatus: { not: 'rejected' },
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        object: { select: { id: true, name: true, sponsor: { select: { name: true, logoUrl: true } } } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: session.userId }, take: 1 },
      },
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, -1) : posts

    // Fetch active ads to inject
    const ads = await prisma.ad.findMany({
      where: { isActive: true },
      take: Math.ceil(items.length / AD_FREQUENCY),
      orderBy: { createdAt: 'desc' },
    })

    // Track ad impressions
    if (ads.length > 0) {
      await prisma.adImpression.createMany({
        data: ads.map((ad) => ({ adId: ad.id, userId: session.userId })),
        skipDuplicates: true,
      })
    }

    const formattedPosts = items.map((p, i) => ({
      type: 'post' as const,
      ...p,
      likedByMe: (p.likes as { userId: string }[]).length > 0,
      likes: undefined,
      // Inject ad after every AD_FREQUENCY posts
      ad: (i + 1) % AD_FREQUENCY === 0 ? ads[Math.floor(i / AD_FREQUENCY)] ?? null : null,
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
