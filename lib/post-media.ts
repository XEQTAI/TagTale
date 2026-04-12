import { createSignedMediaUrl } from './media-sign'
import { FEED_SIGNED_URL_TTL_SEC } from './storage-signing'
import type { MediaStorageBackend } from './media-sign'

type WithMedia = {
  mediaUrl: string | null
  mediaStorageKey: string | null
  mediaStorageBackend?: string | null
}

/** Resolve DB fields to a single URL safe for `<img>` / `<video>` (signed when private). */
export async function resolvePostMediaForClient(post: WithMedia): Promise<string | null> {
  if (post.mediaStorageKey) {
    const backend = (post.mediaStorageBackend as MediaStorageBackend | null) ?? null
    return (
      (await createSignedMediaUrl(post.mediaStorageKey, backend, FEED_SIGNED_URL_TTL_SEC)) ??
      post.mediaUrl
    )
  }
  return post.mediaUrl
}

export async function signPostsForClient<T extends WithMedia & Record<string, unknown>>(
  posts: T[]
): Promise<Array<Omit<T, 'mediaStorageKey' | 'mediaStorageBackend'> & { mediaUrl: string | null }>> {
  return Promise.all(
    posts.map(async (p) => {
      const { mediaStorageKey: _k, mediaStorageBackend: _b, ...rest } = p
      const mediaUrl = await resolvePostMediaForClient(p)
      return { ...rest, mediaUrl } as Omit<T, 'mediaStorageKey' | 'mediaStorageBackend'> & {
        mediaUrl: string | null
      }
    })
  )
}
