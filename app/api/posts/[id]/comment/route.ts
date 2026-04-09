import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { moderateContent } from '@/lib/ai'
import { trackEvent } from '@/lib/analytics'
import { z } from 'zod'

const schema = z.object({ content: z.string().min(1).max(1000) })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const postId = params.id
    const body = await req.json()
    const { content } = schema.parse(body)

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post || post.deletedAt) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Any past scanner can comment
    if (!session.user.isAdmin) {
      const hasScan = await prisma.scan.findFirst({
        where: { objectId: post.objectId, userId: session.userId },
      })
      if (!hasScan) {
        return NextResponse.json({ error: 'Must scan object to interact' }, { status: 403 })
      }
    }

    const moderation = await moderateContent({ text: content })
    if (!moderation.approved) {
      return NextResponse.json(
        { error: 'Comment rejected by content moderation', reason: moderation.reason },
        { status: 422 }
      )
    }

    const comment = await prisma.comment.create({
      data: { postId, userId: session.userId, content },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    })

    await trackEvent('comment_create', { userId: session.userId, postId })

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    const postId = params.id
    const { searchParams } = req.nextUrl
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post || post.deletedAt) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const hasScan = session.user.isAdmin || await prisma.scan.findFirst({
      where: { objectId: post.objectId, userId: session.userId },
    })
    if (!hasScan) return NextResponse.json({ error: 'Must scan object to view comments' }, { status: 403 })

    const comments = await prisma.comment.findMany({
      where: { postId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    })

    const hasMore = comments.length > limit
    const items = hasMore ? comments.slice(0, -1) : comments

    return NextResponse.json({
      comments: items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}
