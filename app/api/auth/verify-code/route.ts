import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
import { completeEmailLogin } from '@/lib/email-login'
import { log } from '@/lib/analytics'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(16),
})

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`auth:verify-code:${getClientIp(req)}`, 30, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many attempts' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    )
  }

  try {
    const body = await req.json()
    const { email: rawEmail, code: rawCode } = bodySchema.parse(body)
    const email = rawEmail.trim().toLowerCase()
    const code = rawCode.replace(/\s/g, '')

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 })
    }

    const row = await prisma.magicLink.findFirst({
      where: {
        email,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!row) {
      return NextResponse.json({ error: 'Invalid or expired code. Request a new one.' }, { status: 400 })
    }

    await prisma.magicLink.update({ where: { id: row.id }, data: { usedAt: new Date() } })

    const { user, isNewUser } = await completeEmailLogin(email)

    const sessionToken = await createSessionToken(user.id)
    await setSessionCookie(sessionToken)

    await log('info', 'User authenticated (email code)', { userId: user.id, isNewUser })

    if (isNewUser && !user.isAdmin) {
      sendWelcomeEmail(user.email, user.username).catch(console.error)
    }

    const redirect = user.isAdmin ? '/admin' : '/feed'
    return NextResponse.json({ ok: true, redirect })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    await log('error', 'Verify code failed', { error: String(err) }).catch(() => {})
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
