import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { trackEvent } from '@/lib/analytics'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const postId = params.id

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post || post.deletedAt) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Any past scanner can like (not just within 1 hour)
    if (!session.user.isAdmin) {
      const hasScan = await prisma.scan.findFirst({
        where: { objectId: post.objectId, userId: session.userId },
      })
      if (!hasScan) {
        return NextResponse.json({ error: 'Must scan object to interact' }, { status: 403 })
      }
    }

    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId: session.userId } },
    })

    if (existing) {
      await prisma.like.delete({ where: { postId_userId: { postId, userId: session.userId } } })
      const count = await prisma.like.count({ where: { postId } })
      await trackEvent('post_unlike', { userId: session.userId, postId })
      return NextResponse.json({ liked: false, count })
    } else {
      await prisma.like.create({ data: { postId, userId: session.userId } })
      const count = await prisma.like.count({ where: { postId } })
      await trackEvent('post_like', { userId: session.userId, postId })
      return NextResponse.json({ liked: true, count })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
