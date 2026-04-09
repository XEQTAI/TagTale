import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAdmin } from '@/lib/auth'
import { moderateContent } from '@/lib/ai'
import { z } from 'zod'

const schema = z.object({
  text: z.string().max(5000).optional(),
  mediaUrl: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const body = await req.json()
    const { text, mediaUrl } = schema.parse(body)

    if (!text && !mediaUrl) {
      return NextResponse.json({ error: 'Provide text or mediaUrl' }, { status: 400 })
    }

    const result = await moderateContent({ text, mediaUrl })
    return NextResponse.json(result)
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : 'Moderation failed'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
