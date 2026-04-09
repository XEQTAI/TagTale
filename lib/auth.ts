import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import type { User } from '@prisma/client'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production-immediately'
)

const SESSION_COOKIE = 'session'
const SESSION_DURATION_DAYS = 30

export type SessionUser = Pick<User, 'id' | 'email' | 'username' | 'avatarUrl' | 'isAdmin'>

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function getSession(req?: NextRequest): Promise<{ userId: string; user: SessionUser } | null> {
  let token: string | undefined

  if (req) {
    token = req.cookies.get(SESSION_COOKIE)?.value
  } else {
    token = (await cookies()).get(SESSION_COOKIE)?.value
  }

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.userId as string
    if (!userId) return null

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, avatarUrl: true, isAdmin: true },
    })

    if (!user) return null
    return { userId, user }
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
}

export function requireAuth(session: { userId: string; user: SessionUser } | null): asserts session is NonNullable<typeof session> {
  if (!session) {
    throw new Error('Unauthorized')
  }
}

export function requireAdmin(session: { userId: string; user: SessionUser } | null): asserts session is NonNullable<typeof session> {
  if (!session || !session.user.isAdmin) {
    throw new Error('Forbidden')
  }
}
