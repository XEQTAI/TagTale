import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

/**
 * Debug: whether the browser is sending a valid session cookie.
 * GET /api/auth/session — returns { authenticated, email?, isAdmin? } (no secrets).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ ok: true, authenticated: false })
    }
    return NextResponse.json({
      ok: true,
      authenticated: true,
      email: session.user.email,
      isAdmin: session.user.isAdmin,
    })
  } catch {
    return NextResponse.json({ ok: false, authenticated: false, error: 'session_read_failed' }, { status: 500 })
  }
}
