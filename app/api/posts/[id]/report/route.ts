import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { deepModeratePosts } from '@/lib/ai'
import { trackEvent } from '@/lib/analytics'
import { z } from 'zod'

const schema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'harassment', 'misinformation', 'other']),
  details: z.string().max(500).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const postId = params.id
    const body = await req.json()
    const { reason, details } = schema.parse(body)

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post || post.deletedAt) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Any past scanner can report
    if (!session.user.isAdmin) {
      const hasScan = await prisma.scan.findFirst({
        where: { objectId: post.objectId, userId: session.userId },
      })
      if (!hasScan) {
        return NextResponse.json({ error: 'Must scan object to report' }, { status: 403 })
      }
    }

    // Upsert report (one per user per post)
    await prisma.report.upsert({
      where: { postId_userId: { postId, userId: session.userId } },
      create: { postId, userId: session.userId, reason, details },
      update: { reason, details },
    })

    await trackEvent('post_report', { userId: session.userId, postId, reason })

    // Count total reports — trigger deep moderation at threshold
    const reportCount = await prisma.report.count({ where: { postId } })
    if (reportCount >= 3) {
      // Fire-and-forget deep moderation via Managed Agents
      deepModeratePosts([postId]).catch(console.error)
    }

    return NextResponse.json({ reported: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}
