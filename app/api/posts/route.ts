import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { moderateContent } from '@/lib/ai'
import { trackEvent } from '@/lib/analytics'
import { createSignedMediaUrl } from '@/lib/media-sign'
import type { MediaStorageBackend } from '@/lib/media-sign'
import { PREVIEW_SIGNED_URL_TTL_SEC } from '@/lib/storage-signing'
import { resolvePostMediaForClient } from '@/lib/post-media'
import { z } from 'zod'

const schema = z
  .object({
    objectId: z.string().min(1),
    content: z.string().max(2000).optional(),
    mediaUrl: z.string().url().optional(),
    mediaStorageKey: z.string().min(1).optional(),
    mediaStorageBackend: z.enum(['r2', 'supabase']).optional(),
    mediaType: z.enum(['image', 'video']).optional(),
  })
  .refine((d) => Boolean(d.content?.trim()) || d.mediaUrl || d.mediaStorageKey, {
    message: 'Post must have content or media',
  })

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { objectId, content, mediaUrl, mediaStorageKey, mediaStorageBackend, mediaType } =
      schema.parse(body)

    if (mediaStorageKey) {
      if (!mediaStorageKey.startsWith(`${session.userId}/`)) {
        return NextResponse.json({ error: 'Invalid media' }, { status: 403 })
      }
    }

    // Check object exists
    const object = await prisma.tagObject.findUnique({ where: { id: objectId } })
    if (!object) return NextResponse.json({ error: 'Object not found' }, { status: 404 })

    // Admins bypass the scan requirement
    if (!session.user.isAdmin) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentScan = await prisma.scan.findFirst({
        where: { objectId, userId: session.userId, scannedAt: { gte: oneHourAgo } },
      })
      if (!recentScan) {
        return NextResponse.json(
          { error: 'Must scan within the last hour to post' },
          { status: 403 }
        )
      }
    }

    const backendForSign: MediaStorageBackend | null = mediaStorageKey
      ? mediaStorageBackend ?? 'supabase'
      : null

    let moderationMediaUrl: string | undefined
    if (mediaStorageKey) {
      moderationMediaUrl =
        (await createSignedMediaUrl(
          mediaStorageKey,
          backendForSign,
          PREVIEW_SIGNED_URL_TTL_SEC
        )) ?? undefined
    } else {
      moderationMediaUrl = mediaUrl
    }

    const moderation = await moderateContent({ text: content, mediaUrl: moderationMediaUrl })

    const post = await prisma.post.create({
      data: {
        objectId,
        userId: session.userId,
        content,
        mediaUrl: mediaStorageKey ? null : mediaUrl ?? null,
        mediaStorageKey: mediaStorageKey ?? null,
        mediaStorageBackend: mediaStorageKey ? backendForSign : null,
        mediaType,
        moderationStatus: moderation.approved ? 'approved' : 'rejected',
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    if (!moderation.approved) {
      return NextResponse.json(
        { error: 'Post rejected by content moderation', reason: moderation.reason },
        { status: 422 }
      )
    }

    await trackEvent('post_create', { userId: session.userId, objectId, postId: post.id })

    const mediaUrlOut = await resolvePostMediaForClient(post)
    const { mediaStorageKey: _sk, mediaStorageBackend: _sb, ...rest } = post

    return NextResponse.json({ ...rest, mediaUrl: mediaUrlOut, likedByMe: false }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
