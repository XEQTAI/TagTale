import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  )
}

let client: S3Client | null = null

function getR2Client(): S3Client {
  if (!client) {
    const accountId = process.env.R2_ACCOUNT_ID!
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return client
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    )
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[r2] upload failed:', msg)
    return { ok: false, error: msg }
  }
}

export async function createSignedR2Url(
  key: string,
  expiresInSeconds: number
): Promise<string | null> {
  try {
    const url = await getSignedUrl(
      getR2Client(),
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
      { expiresIn: expiresInSeconds }
    )
    return url
  } catch (e) {
    console.error('[r2] signed URL failed:', e instanceof Error ? e.message : e)
    return null
  }
}
