import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/auth'
import { generateUsername, generateAvatarUrl } from '@/lib/utils'
import { generateAiUsername } from '@/lib/ai'
import { trackEvent, log } from '@/lib/analytics'
import { sendWelcomeEmail } from '@/lib/email'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { maybeDevDetail } from '@/lib/dev-error-detail'

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(`auth:exchange:${getClientIp(req)}`, 30, 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      )
    }

    const { accessToken } = await req.json()
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Verify the Supabase access token — only a real Supabase session will pass this
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const email = user.email

    // Find or create user in our database
    let dbUser = await prisma.user.findUnique({ where: { email } })
    let isNewUser = false

    if (!dbUser) {
      isNewUser = true
      let username = await generateAiUsername()
      if (!username) username = generateUsername()

      let attempts = 0
      while (await prisma.user.findUnique({ where: { username } }) && attempts < 20) {
        username = generateUsername()
        attempts++
      }

      dbUser = await prisma.user.create({
        data: {
          email,
          username,
          avatarUrl: generateAvatarUrl(username),
          isAdmin: email === process.env.ADMIN_EMAIL,
        },
      })

      await trackEvent('user_signup', { userId: dbUser.id })
    } else {
      await trackEvent('user_login', { userId: dbUser.id })
    }

    // Issue our own JWT session cookie
    const sessionToken = await createSessionToken(dbUser.id)
    await setSessionCookie(sessionToken)

    await log('info', 'User authenticated via Supabase', { userId: dbUser.id, isNewUser })

    if (isNewUser) {
      sendWelcomeEmail(dbUser.email, dbUser.username).catch(console.error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await log('error', 'Auth exchange failed', { error: String(err) }).catch(() => {})
    return NextResponse.json({ error: 'Server error', ...maybeDevDetail(err) }, { status: 500 })
  }
}
