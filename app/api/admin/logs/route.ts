import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const { searchParams } = req.nextUrl
    const cursor = searchParams.get('cursor')
    const level = searchParams.get('level') // 'info' | 'warn' | 'error'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    const logs = await prisma.systemLog.findMany({
      where: level ? { level } : undefined,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    })

    const hasMore = logs.length > limit
    const items = hasMore ? logs.slice(0, -1) : logs

    return NextResponse.json({
      logs: items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch logs'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
