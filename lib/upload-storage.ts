import type { SupabaseClient } from '@supabase/supabase-js'

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
}

export function extensionForMime(mime: string): string {
  return MIME_TO_EXT[mime] || 'bin'
}

export async function uploadToSupabaseStorage(
  admin: SupabaseClient,
  params: {
    bucket: string
    userId: string
    buffer: Buffer
    contentType: string
    filenameBase: string
  }
): Promise<{ storageKey: string } | { error: string }> {
  const ext = extensionForMime(params.contentType)
  const objectPath = `${params.userId}/${params.filenameBase}.${ext}`

  const { error } = await admin.storage.from(params.bucket).upload(objectPath, params.buffer, {
    contentType: params.contentType,
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    return { error: error.message }
  }

  return { storageKey: objectPath }
}
