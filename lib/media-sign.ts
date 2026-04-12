import { createSignedR2Url } from './r2'
import { createSignedStorageUrl } from './storage-signing'

export type MediaStorageBackend = 'r2' | 'supabase'

/** Signed GET URL for private object storage (R2 or Supabase). `backend` null = legacy Supabase. */
export async function createSignedMediaUrl(
  objectKey: string,
  backend: MediaStorageBackend | null | undefined,
  expiresInSeconds: number
): Promise<string | null> {
  if (backend === 'r2') {
    return createSignedR2Url(objectKey, expiresInSeconds)
  }
  return createSignedStorageUrl(objectKey, expiresInSeconds)
}
