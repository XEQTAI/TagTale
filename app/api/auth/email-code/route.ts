import { randomInt } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmailLoginCode } from '@/lib/email'
import { log } from '@/lib/analytics'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { maybeDevDetail } from '@/lib/dev-error-detail'
import { isReservedAdminEmail } from '@/lib/email-login'

const schema = z.object({ email: z.string().email() })

/** Avoid sending OTP to the admin address if that inbox is a normal (non-admin) user. */
async function canSendCodeToEmail(email: string): Promise<boolean> {
  if (!isReservedAdminEmail(email)) return true
  const u = await prisma.user.findUnique({ where: { email } })
  if (!u) return true
  return u.isAdmin
}

function generateSixDigitCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rlIp = checkRateLimit(`auth:email-code:ip:${ip}`, 5, 15 * 60_000)
    if (!rlIp.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rlIp.retryAfterSec) } }
      )
    }

    const body = await req.json()
    const { email: rawEmail } = schema.parse(body)
    const email = rawEmail.trim().toLowerCase()

    if (!(await canSendCodeToEmail(email))) {
      return NextResponse.json(
        { error: 'Could not send a code for this email. Use the address registered for your account.' },
        { status: 400 }
      )
    }

    const rlEmail = checkRateLimit(`auth:email-code:email:${email}`, 3, 60 * 60_000)
    if (!rlEmail.ok) {
      return NextResponse.json(
        { error: 'Too many requests for this email' },
        { status: 429, headers: { 'Retry-After': String(rlEmail.retryAfterSec) } }
      )
    }

    await prisma.magicLink.deleteMany({
      where: { email, usedAt: null },
    })

    const token = nanoid(48)
    const code = generateSixDigitCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.magicLink.create({
      data: { email, token, code, expiresAt },
    })

    await sendEmailLoginCode(email, code)

    await log('info', 'Email sign-in code sent', { email })

    return NextResponse.json({ message: 'Sign-in code sent. Check your email.' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    const msg = String(err)
    await log('error', 'Email code send failed', { error: msg }).catch(() => {})

    if (msg.includes('RESEND_API_KEY')) {
      return NextResponse.json(
        {
          error:
            'Email delivery is not configured. Set RESEND_API_KEY (and EMAIL_FROM if needed) in your server environment.',
        },
        { status: 503 }
      )
    }

    if (
      msg.includes('Unknown arg `code`') ||
      (msg.includes('column') && msg.includes('code')) ||
      msg.includes('P2022')
    ) {
      return NextResponse.json(
        {
          error:
            'Database is missing the latest auth tables. On the server run: npx prisma migrate deploy (or prisma db push).',
          ...maybeDevDetail(err),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: 'Failed to send sign-in code', ...maybeDevDetail(err) }, { status: 500 })
  }
}
