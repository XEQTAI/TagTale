import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAdmin } from '@/lib/auth'
import { getScanLocations } from '@/lib/analytics'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const { searchParams } = req.nextUrl
    const objectId = searchParams.get('objectId') ?? undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 2000)

    const locations = await getScanLocations(objectId, limit)
    return NextResponse.json({ locations })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch map data'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
