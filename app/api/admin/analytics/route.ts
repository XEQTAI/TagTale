import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAdmin } from '@/lib/auth'
import { getAnalyticsSummary } from '@/lib/analytics'
import { httpStatusFromAuthError } from '@/lib/http-status'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const { searchParams } = req.nextUrl
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90)

    const summary = await getAnalyticsSummary(days)
    return NextResponse.json(summary)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch analytics'
    const status = httpStatusFromAuthError(message)
    return NextResponse.json({ error: message }, { status })
  }
}
