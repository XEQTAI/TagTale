/**
 * AI helpers — all backed by OpenRouter/Gemma 4 for maximum economy.
 * Deep moderation also runs via OpenRouter (batch), no Managed Agents cost.
 */
import { openrouterPrompt, openrouterVision } from './openrouter'
import { prisma } from './prisma'
import { createSignedMediaUrl } from './media-sign'
import { PREVIEW_SIGNED_URL_TTL_SEC } from './storage-signing'
import type { MediaStorageBackend } from './media-sign'

export type ModerationResult = {
  approved: boolean
  status: 'approved' | 'rejected' | 'flagged'
  reason?: string
  confidence: number
}

const MOD_SYSTEM = `You are a content moderator for TagTale, a social platform about physical objects.
Evaluate for: spam, illegal content, NSFW (unless mild), hate speech, harassment, violence.
Reply ONLY with valid JSON: {"approved":bool,"status":"approved"|"rejected"|"flagged","reason":string|null,"confidence":0-1}
Be permissive — only reject clear violations.`

/** Quick synchronous moderation via OpenRouter (economical). */
export async function moderateContent(params: {
  text?: string
  mediaUrl?: string
}): Promise<ModerationResult> {
  try {
    let raw: string

    if (params.mediaUrl) {
      // Vision-capable model for image analysis
      const context = params.text ? `Caption: "${params.text}"\n` : ''
      raw = await openrouterVision(
        params.mediaUrl,
        `${context}Moderate this post image. Reply ONLY with JSON: {"approved":bool,"status":"approved"|"rejected"|"flagged","reason":string|null,"confidence":0-1}`,
        { maxTokens: 128 }
      )
    } else {
      raw = await openrouterPrompt(
        `Moderate this post: "${params.text || ''}"`,
        MOD_SYSTEM,
        { maxTokens: 128 }
      )
    }

    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    return {
      approved:   json.approved   ?? true,
      status:     json.status     ?? 'approved',
      reason:     json.reason     ?? undefined,
      confidence: json.confidence ?? 0.9,
    }
  } catch {
    // Default approve on AI failure — never block posts for infra issues
    return { approved: true, status: 'approved', confidence: 0.5 }
  }
}

/**
 * Batch deep moderation — runs in background after ≥3 reports.
 * Uses OpenRouter instead of Claude Managed Agents to keep costs low.
 */
export async function deepModeratePosts(postIds: string[]): Promise<void> {
  try {
    const posts = await prisma.post.findMany({
      where: { id: { in: postIds }, deletedAt: null },
      include: { reports: { select: { reason: true } } },
    })

    for (const post of posts) {
      const reasons = post.reports.map((r) => r.reason).join(', ')
      const hasMedia = Boolean(post.mediaUrl || post.mediaStorageKey)
      const context = [
        post.content && `Content: "${post.content}"`,
        hasMedia && `Has ${post.mediaType || 'media'} attachment`,
        `Reported for: ${reasons}`,
      ]
        .filter(Boolean)
        .join('\n')

      const visionUrl =
        post.mediaUrl ||
        (post.mediaStorageKey
          ? await createSignedMediaUrl(
              post.mediaStorageKey,
              (post.mediaStorageBackend as MediaStorageBackend | null) ?? null,
              PREVIEW_SIGNED_URL_TTL_SEC
            )
          : null)

      let result: ModerationResult
      if (visionUrl) {
        const raw = await openrouterVision(
          visionUrl,
          `${context}\nShould this post be removed? JSON only: {"approved":bool,"status":"approved"|"rejected","reason":string}`,
          { maxTokens: 128 }
        ).catch(() => '{"approved":true,"status":"approved","reason":null}')
        const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
        result = { approved: json.approved ?? true, status: json.status ?? 'approved', reason: json.reason, confidence: 0.8 }
      } else {
        result = await moderateContent({ text: context })
      }

      if (!result.approved) {
        await prisma.post.update({
          where: { id: post.id },
          data: { moderationStatus: 'rejected', moderationNotes: result.reason ?? 'Deep moderation' },
        })
      } else {
        await prisma.post.update({
          where: { id: post.id },
          data: { moderationStatus: 'approved' },
        })
      }
    }
  } catch (err) {
    console.error('deepModeratePosts error:', err)
  }
}

/**
 * Analyze an object photo and extract/suggest a name + description.
 * Great for the "take a photo, auto-fill the form" UX.
 */
export async function analyzeObjectImage(imageUrl: string): Promise<{ name: string; description: string } | null> {
  try {
    const raw = await openrouterVision(
      imageUrl,
      'What physical object is in this photo? Reply ONLY with JSON: {"name":"short object name","description":"1-2 sentence interesting description for a social object tracker"}',
      { maxTokens: 128 }
    )
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    if (json.name) return json
    return null
  } catch {
    return null
  }
}

/** Generate a creative username (no numbers) via OpenRouter. */
export async function generateAiUsername(): Promise<string> {
  try {
    const text = await openrouterPrompt(
      'Generate one creative, memorable username for a social media app. Rules: lowercase only, no numbers, no spaces, no underscores, 10-20 chars total, sounds like a nature+personality mashup (e.g. "gentlestormcrest"). Output ONLY the username.',
      undefined,
      { maxTokens: 32, temperature: 0.9 }
    )
    const cleaned = text.trim().toLowerCase().replace(/[^a-z]/g, '')
    if (cleaned && /^[a-z]{8,25}$/.test(cleaned)) return cleaned
  } catch { /* fall through */ }
  return ''
}
