import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
import { completeEmailLogin } from '@/lib/email-login'
import { log } from '@/lib/analytics'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(`auth:verify:${getClientIp(req)}`, 40, 60_000)
  if (!rl.ok) {
    return NextResponse.redirect(new URL('/login?error=ratelimit', req.url))
  }

  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid', req.url))
  }

  try {
    const magicLink = await prisma.magicLink.findUnique({ where: { token } })

    if (!magicLink) {
      return NextResponse.redirect(new URL('/login?error=invalid', req.url))
    }
    if (magicLink.usedAt) {
      return NextResponse.redirect(new URL('/login?error=used', req.url))
    }
    if (magicLink.expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/login?error=expired', req.url))
    }

    const email = magicLink.email.trim().toLowerCase()

    await prisma.magicLink.update({ where: { id: magicLink.id }, data: { usedAt: new Date() } })

    const { user, isNewUser } = await completeEmailLogin(email)

    const sessionToken = await createSessionToken(user.id)
    await setSessionCookie(sessionToken)

    await log('info', 'User authenticated (legacy link)', { userId: user.id, isNewUser })

    if (isNewUser && !user.isAdmin) {
      sendWelcomeEmail(user.email, user.username).catch(console.error)
    }

    const next = user.isAdmin ? '/admin' : '/feed'
    return NextResponse.redirect(new URL(next, req.url))
  } catch (err) {
    await log('error', 'Auth verify failed', { error: String(err) })
    return NextResponse.redirect(new URL('/login?error=server', req.url))
  }
}
