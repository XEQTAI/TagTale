import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireAdmin } from '@/lib/auth'
import { trackEvent } from '@/lib/analytics'
import { httpStatusFromAuthError } from '@/lib/http-status'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const postId = params.id

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    await prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    })

    await trackEvent('admin_post_delete', { userId: session!.userId, postId })

    return NextResponse.json({ deleted: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete post'
    const status = httpStatusFromAuthError(message)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const postId = params.id
    const body = await req.json()
    const { moderationStatus } = body

    if (!['approved', 'rejected', 'pending'].includes(moderationStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: { moderationStatus },
    })

    await trackEvent('admin_moderation_update', { userId: session!.userId, postId, metadata: { moderationStatus } })

    return NextResponse.json(post)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update post'
    const status = httpStatusFromAuthError(message)
    return NextResponse.json({ error: message }, { status })
  }
}
