import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
import { generateUsername, generateAvatarUrl } from '@/lib/utils'
import { generateAiUsername } from '@/lib/ai'
import { trackEvent, log } from '@/lib/analytics'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid', req.url))
  }

  try {
    const magicLink = await prisma.magicLink.findUnique({ where: { token } })

    if (!magicLink) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid', req.url))
    }
    if (magicLink.usedAt) {
      return NextResponse.redirect(new URL('/auth/login?error=used', req.url))
    }
    if (magicLink.expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/auth/login?error=expired', req.url))
    }

    // Mark as used
    await prisma.magicLink.update({ where: { id: magicLink.id }, data: { usedAt: new Date() } })

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: magicLink.email } })
    let isNewUser = false

    if (!user) {
      isNewUser = true
      let username = await generateAiUsername()
      if (!username) username = generateUsername()

      // Ensure username uniqueness
      let attempts = 0
      let candidateUsername = username
      while (await prisma.user.findUnique({ where: { username: candidateUsername } }) && attempts < 20) {
        candidateUsername = generateUsername()
        attempts++
      }

      const avatarUrl = generateAvatarUrl(candidateUsername)
      const isAdmin = magicLink.email === process.env.ADMIN_EMAIL

      user = await prisma.user.create({
        data: {
          email: magicLink.email,
          username: candidateUsername,
          avatarUrl,
          isAdmin,
        },
      })

      await trackEvent('user_signup', { userId: user.id })
    } else {
      await trackEvent('user_login', { userId: user.id })
    }

    // Create session
    const sessionToken = await createSessionToken(user.id)
    await setSessionCookie(sessionToken)

    await log('info', 'User authenticated', { userId: user.id, isNewUser })

    // Send welcome email to new users
    if (isNewUser) {
      sendWelcomeEmail(user.email, user.username).catch(console.error)
    }

    return NextResponse.redirect(new URL('/feed', req.url))
  } catch (err) {
    await log('error', 'Auth verify failed', { error: String(err) })
    return NextResponse.redirect(new URL('/auth/login?error=server', req.url))
  }
}
