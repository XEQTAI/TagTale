import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMagicLink, sendWelcomeEmail } from '@/lib/email'
import { generateUsername, generateAvatarUrl } from '@/lib/utils'
import { generateAiUsername } from '@/lib/ai'
import { log } from '@/lib/analytics'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    // Delete any existing unused magic links for this email
    await prisma.magicLink.deleteMany({
      where: { email, usedAt: null },
    })

    // Create magic link token
    const token = nanoid(48)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await prisma.magicLink.create({
      data: { email, token, expiresAt },
    })

    // Send magic link email
    await sendMagicLink(email, token)

    // Check if this is a new user (will be created on verify)
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (!existingUser) {
      // Pre-generate username for new user
      let username = await generateAiUsername()
      if (!username) username = generateUsername()

      // Ensure uniqueness
      let attempts = 0
      while (await prisma.user.findUnique({ where: { username } }) && attempts < 10) {
        username = generateUsername()
        attempts++
      }
    }

    await log('info', 'Magic link sent', { email })

    return NextResponse.json({ message: 'Magic link sent. Check your email.' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    await log('error', 'Magic link send failed', { error: String(err) })
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 })
  }
}
