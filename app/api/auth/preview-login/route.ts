import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/auth'
import { log } from '@/lib/analytics'

const bodySchema = z.object({ secret: z.string().min(1) })

/**
 * Optional staging / demo: one shared secret signs you in as the first admin.
 * Set PREVIEW_LOGIN_SECRET in env (long random). Disable in real production.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.PREVIEW_LOGIN_SECRET
  if (!expected || expected.length < 16) {
    return NextResponse.json({ error: 'Not enabled' }, { status: 404 })
  }

  try {
    const { secret } = bodySchema.parse(await req.json())
    if (secret !== expected) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    const admin = await prisma.user.findFirst({ where: { isAdmin: true }, orderBy: { createdAt: 'asc' } })
    if (!admin) {
      return NextResponse.json({ error: 'No admin user in database' }, { status: 400 })
    }

    const sessionToken = await createSessionToken(admin.id)
    await setSessionCookie(sessionToken)
    await log('info', 'Preview login used', { userId: admin.id })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
