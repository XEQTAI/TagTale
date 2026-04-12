import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { extensionForMime, uploadToSupabaseStorage } from '@/lib/upload-storage'
import { createSignedStorageUrl, PREVIEW_SIGNED_URL_TTL_SEC } from '@/lib/storage-signing'
import { isR2Configured, uploadToR2, createSignedR2Url } from '@/lib/r2'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rlUser = checkRateLimit(`upload:user:${session.userId}`, 40, 60_000)
    if (!rlUser.ok) {
      return NextResponse.json(
        { error: 'Too many uploads' },
        { status: 429, headers: { 'Retry-After': String(rlUser.retryAfterSec) } }
      )
    }
    const rlIp = checkRateLimit(`upload:ip:${getClientIp(req)}`, 60, 60_000)
    if (!rlIp.ok) {
      return NextResponse.json(
        { error: 'Too many uploads' },
        { status: 429, headers: { 'Retry-After': String(rlIp.retryAfterSec) } }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'

    if (isR2Configured()) {
      const storageKey = `${session.userId}/${nanoid()}.${extensionForMime(file.type)}`
      const uploaded = await uploadToR2(storageKey, buffer, file.type)
      if (!uploaded.ok) {
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
      }
      const previewUrl = await createSignedR2Url(storageKey, PREVIEW_SIGNED_URL_TTL_SEC)
      if (!previewUrl) {
        console.error('[upload] R2 signed preview URL failed')
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
      }
      return NextResponse.json(
        { storageKey, previewUrl, mediaType, storageBackend: 'r2' as const },
        { status: 201 }
      )
    }

    const admin = createSupabaseAdmin()
    if (admin) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads'
      const result = await uploadToSupabaseStorage(admin, {
        bucket,
        userId: session.userId,
        buffer,
        contentType: file.type,
        filenameBase: nanoid(),
      })
      if ('error' in result) {
        console.error('[upload] Supabase Storage:', result.error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
      }
      const previewUrl = await createSignedStorageUrl(result.storageKey, PREVIEW_SIGNED_URL_TTL_SEC)
      if (!previewUrl) {
        console.error('[upload] Could not create signed preview URL')
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
      }
      return NextResponse.json(
        {
          storageKey: result.storageKey,
          previewUrl,
          mediaType,
          storageBackend: 'supabase' as const,
        },
        { status: 201 }
      )
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('[upload] Configure R2 or Supabase for production file storage')
      return NextResponse.json({ error: 'File storage is not configured' }, { status: 503 })
    }

    const ext = extensionForMime(file.type)
    const filename = `${nanoid()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    const url = `/uploads/${filename}`
    return NextResponse.json({ url, mediaType }, { status: 201 })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
