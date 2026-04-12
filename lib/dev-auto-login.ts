import { createSessionToken, setSessionCookie, type SessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type DevAutoLoginResult =
  | { ok: true; userId: string; user: SessionUser }
  | { ok: false; reason: 'not_dev' | 'no_admin' | 'db_unavailable' }

/**
 * In development only: load seeded admin and set session cookie. Swallows DB connection errors.
 */
export async function tryDevAutoLoginAsAdmin(): Promise<DevAutoLoginResult> {
  if (process.env.NODE_ENV !== 'development') {
    return { ok: false, reason: 'not_dev' }
  }
  try {
    const admin = await prisma.user.findFirst({ where: { isAdmin: true } })
    if (!admin) {
      return { ok: false, reason: 'no_admin' }
    }
    const token = await createSessionToken(admin.id)
    await setSessionCookie(token)
    return {
      ok: true,
      userId: admin.id,
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        avatarUrl: admin.avatarUrl,
        isAdmin: admin.isAdmin,
      },
    }
  } catch {
    return { ok: false, reason: 'db_unavailable' }
  }
}
