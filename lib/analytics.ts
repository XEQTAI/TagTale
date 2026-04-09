import { prisma } from './prisma'

export type EventType =
  | 'scan'
  | 'post_create'
  | 'post_view'
  | 'post_like'
  | 'post_unlike'
  | 'post_comment'
  | 'post_report'
  | 'comment_create'
  | 'object_follow'
  | 'object_unfollow'
  | 'user_signup'
  | 'user_login'
  | 'qr_generate'
  | 'qr_print'
  | 'qr_pdf_download'
  | 'ad_impression'
  | 'admin_post_delete'
  | 'admin_moderation_update'

export async function trackEvent(
  eventType: EventType,
  params: {
    userId?: string
    objectId?: string
    postId?: string
    metadata?: Record<string, unknown>
  } = {}
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType,
        userId: params.userId,
        objectId: params.objectId,
        postId: params.postId,
        metadata: params.metadata ?? undefined,
      },
    })
  } catch (err) {
    console.error('Analytics tracking failed:', err)
  }
}

export async function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: { level, message, meta: context ?? undefined },
    })
  } catch {
    // Silently fail — don't let logging errors break the app
  }
  if (level === 'error') {
    console.error(`[${level.toUpperCase()}] ${message}`, context ?? '')
  }
}

export async function getAnalyticsSummary(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [
    totalScans,
    totalPosts,
    totalLikes,
    totalComments,
    newUsers,
    topObjects,
    eventsByDay,
  ] = await Promise.all([
    prisma.scan.count({ where: { scannedAt: { gte: since } } }),
    prisma.post.count({ where: { createdAt: { gte: since }, deletedAt: null } }),
    prisma.like.count({ where: { createdAt: { gte: since } } }),
    prisma.comment.count({ where: { createdAt: { gte: since }, deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.tagObject.findMany({
      take: 10,
      orderBy: { scans: { _count: 'desc' } },
      include: {
        _count: { select: { scans: true, posts: true, followers: true } },
        sponsor: { select: { name: true } },
      },
    }),
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${since}
      GROUP BY date
      ORDER BY date ASC
    `,
  ])

  return {
    totals: { scans: totalScans, posts: totalPosts, likes: totalLikes, comments: totalComments, newUsers },
    topObjects: topObjects.map((o) => ({
      id: o.id,
      name: o.name,
      scans: o._count.scans,
      posts: o._count.posts,
      followers: o._count.followers,
      sponsor: o.sponsor?.name,
    })),
    eventsByDay: eventsByDay.map((r) => ({
      date: r.date,
      count: Number(r.count),
    })),
  }
}

export async function getScanLocations(objectId?: string, limit = 1000) {
  const where = objectId ? { objectId } : {}
  return prisma.scan.findMany({
    where: { ...where, latitude: { not: null }, longitude: { not: null } },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      scannedAt: true,
      objectId: true,
      object: { select: { name: true } },
      user: { select: { username: true } },
    },
    orderBy: { scannedAt: 'desc' },
    take: limit,
  })
}
