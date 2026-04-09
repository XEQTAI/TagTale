import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const { searchParams } = req.nextUrl
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Funnel: total users → scanned at least once → posted → following
    const [
      totalUsers,
      scannedUsers,
      postedUsers,
      followingUsers,
      newUsersInPeriod,
      scansInPeriod,
      postsInPeriod,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.scan.groupBy({ by: ['userId'] }).then((r) => r.length),
      prisma.post.groupBy({ by: ['userId'], where: { deletedAt: null } }).then((r) => r.length),
      prisma.objectFollow.groupBy({ by: ['userId'], where: { isFollowing: true } }).then((r) => r.length),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.scan.count({ where: { scannedAt: { gte: since } } }),
      prisma.post.count({ where: { createdAt: { gte: since }, deletedAt: null } }),
    ])

    // Daily new users (sparkline data)
    const dailySignups = await prisma.analyticsEvent.groupBy({
      by: ['createdAt'],
      where: { eventType: 'user_created', createdAt: { gte: since } },
      _count: { id: true },
    })

    // Top objects by scan rate
    const topObjects = await prisma.tagObject.findMany({
      take: 10,
      include: {
        _count: { select: { scans: true, posts: true, followers: true } },
        sponsor: { select: { name: true } },
      },
      orderBy: { scans: { _count: 'desc' } },
    })

    // Retention: users who scanned in last 7 days / total scanned users
    const recentScannedUsers = await prisma.scan.groupBy({
      by: ['userId'],
      where: { scannedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    })
    const retentionRate = scannedUsers > 0
      ? Math.round((recentScannedUsers.length / scannedUsers) * 100)
      : 0

    // Geographic: top countries / cities (from scan lat/lng — rough estimate)
    const scanLocations = await prisma.scan.findMany({
      where: { latitude: { not: null }, longitude: { not: null }, scannedAt: { gte: since } },
      select: { latitude: true, longitude: true },
      take: 500,
    })

    return NextResponse.json({
      funnel: {
        totalUsers,
        scannedUsers,
        postedUsers,
        followingUsers,
      },
      period: {
        days,
        newUsers:  newUsersInPeriod,
        scans:     scansInPeriod,
        posts:     postsInPeriod,
        retention: retentionRate,
      },
      topObjects: topObjects.map((o) => ({
        id: o.id,
        name: o.name,
        sponsor: o.sponsor?.name,
        scans:     o._count.scans,
        posts:     o._count.posts,
        followers: o._count.followers,
        engagement: o._count.scans > 0
          ? Math.round((o._count.posts / o._count.scans) * 100)
          : 0,
      })),
      locationCount: scanLocations.length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: msg.includes('Forbidden') ? 403 : 500 })
  }
}
