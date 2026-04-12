import { createSupabaseAdmin } from './supabase-admin'

const DEFAULT_BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET || 'uploads'

/** Default signed URL lifetime for feed/API (7 days — Supabase max is 604800s). */
export const FEED_SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 7

/** Short-lived URL for upload preview and moderation calls. */
export const PREVIEW_SIGNED_URL_TTL_SEC = 60 * 60

export async function createSignedStorageUrl(
  objectPath: string,
  expiresInSeconds = FEED_SIGNED_URL_TTL_SEC
): Promise<string | null> {
  const admin = createSupabaseAdmin()
  if (!admin) return null
  const { data, error } = await admin.storage
    .from(DEFAULT_BUCKET())
    .createSignedUrl(objectPath, expiresInSeconds)
  if (error || !data?.signedUrl) {
    console.error('[storage] createSignedUrl failed:', error?.message)
    return null
  }
  return data.signedUrl
}
