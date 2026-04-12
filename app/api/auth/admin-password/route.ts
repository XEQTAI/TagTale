import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { log } from '@/lib/analytics'

const bodySchema = z.object({ password: z.string().min(1).max(500) })

function safeEqualPassword(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(provided, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Optional: sign in as admin with ADMIN_PASSWORD (server env only).
 * Enable UI with NEXT_PUBLIC_ENABLE_ADMIN_PASSWORD_LOGIN=true.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD?.trim()
  if (!expected || expected.length < 8) {
    return NextResponse.json({ error: 'Admin password sign-in is not configured.' }, { status: 503 })
  }

  const rl = checkRateLimit(`auth:admin-pw:${getClientIp(req)}`, 10, 15 * 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many attempts' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    )
  }

  try {
    const { password } = bodySchema.parse(await req.json())
    if (!safeEqualPassword(password, expected)) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    let admin = adminEmail
      ? await prisma.user.findUnique({ where: { email: adminEmail } })
      : null
    if (!admin) {
      admin = await prisma.user.findFirst({ where: { isAdmin: true }, orderBy: { createdAt: 'asc' } })
    }
    if (!admin) {
      return NextResponse.json(
        { error: 'No admin user in the database. Run db:seed or create an admin user.' },
        { status: 400 }
      )
    }

    const sessionToken = await createSessionToken(admin.id)
    await setSessionCookie(sessionToken)
    await log('info', 'Admin password sign-in', { userId: admin.id })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const msg = err instanceof Error ? err.message : String(err)
    await log('error', 'Admin password sign-in failed', { message: msg }).catch(() => {})
    if (msg.includes('JWT_SECRET')) {
      return NextResponse.json(
        { error: 'Server misconfigured: set JWT_SECRET (≥32 chars) in environment variables.' },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
