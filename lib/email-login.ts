import { prisma } from '@/lib/prisma'
import { generateUsername, generateAvatarUrl } from '@/lib/utils'
import { generateAiUsername } from '@/lib/ai'
import { trackEvent } from '@/lib/analytics'

/** True when `email` matches `ADMIN_EMAIL` (gets admin role on first signup). */
export function isReservedAdminEmail(email: string): boolean {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!admin) return false
  return email.trim().toLowerCase() === admin
}

/**
 * After a magic link or email OTP is verified, find or create the user.
 * New accounts whose email matches `ADMIN_EMAIL` are created with `isAdmin: true`.
 */
export async function completeEmailLogin(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase()
  let user = await prisma.user.findUnique({ where: { email } })
  let isNewUser = false

  if (!user) {
    isNewUser = true
    let username = await generateAiUsername()
    if (!username) username = generateUsername()

    let attempts = 0
    let candidateUsername = username
    while (await prisma.user.findUnique({ where: { username: candidateUsername } }) && attempts < 20) {
      candidateUsername = generateUsername()
      attempts++
    }

    const avatarUrl = generateAvatarUrl(candidateUsername)
    const isAdmin = isReservedAdminEmail(email)

    user = await prisma.user.create({
      data: {
        email,
        username: candidateUsername,
        avatarUrl,
        isAdmin,
      },
    })

    await trackEvent('user_signup', { userId: user.id })
  } else {
    await trackEvent('user_login', { userId: user.id })
  }

  return { user, isNewUser }
}
