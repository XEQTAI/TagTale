import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/auth'
import { generateUsername, generateAvatarUrl } from '@/lib/utils'
import { generateAiUsername } from '@/lib/ai'
import { trackEvent, log } from '@/lib/analytics'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const next = url.searchParams.get('next') ?? '/feed'

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  try {
    let email: string | undefined

    if (token_hash && type) {
      // Magic link flow
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as 'email' })
      if (error || !data.user?.email) {
        return NextResponse.redirect(new URL('/login?error=invalid', req.url))
      }
      email = data.user.email
    } else if (code) {
      // OAuth / PKCE flow
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error || !data.user?.email) {
        return NextResponse.redirect(new URL('/login?error=invalid', req.url))
      }
      email = data.user.email
    } else {
      return NextResponse.redirect(new URL('/login?error=invalid', req.url))
    }

    // Find or create user in our DB
    let user = await prisma.user.findUnique({ where: { email } })
    let isNewUser = false

    if (!user) {
      isNewUser = true
      let username = await generateAiUsername()
      if (!username) username = generateUsername()

      let attempts = 0
      while (await prisma.user.findUnique({ where: { username } }) && attempts < 20) {
        username = generateUsername()
        attempts++
      }

      user = await prisma.user.create({
        data: {
          email,
          username,
          avatarUrl: generateAvatarUrl(username),
          isAdmin: email === process.env.ADMIN_EMAIL,
        },
      })

      await trackEvent('user_signup', { userId: user.id })
    } else {
      await trackEvent('user_login', { userId: user.id })
    }

    // Create our own session cookie
    const sessionToken = await createSessionToken(user.id)
    await setSessionCookie(sessionToken)

    await log('info', 'User authenticated via Supabase', { userId: user.id, isNewUser })

    if (isNewUser) {
      sendWelcomeEmail(user.email, user.username).catch(console.error)
    }

    return NextResponse.redirect(new URL(next, req.url))
  } catch (err) {
    await log('error', 'Auth callback failed', { error: String(err) }).catch(() => {})
    return NextResponse.redirect(new URL('/login?error=server', req.url))
  }
}
