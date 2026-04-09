/**
 * OpenRouter client — uses Gemma 4 (or any configured model) via the
 * OpenAI-compatible API. Dramatically cheaper than Claude for routine tasks.
 *
 * Set OPENROUTER_API_KEY and optionally OPENROUTER_MODEL in your .env.
 * Default model: google/gemma-3-27b-it  (update to google/gemma-4 when available)
 */

const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export type ORMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | { role: 'user'; content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> }

interface ChatOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

export async function openrouterChat(
  messages: ORMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

  const model = options.model ?? (process.env.OPENROUTER_MODEL || 'google/gemma-3-27b-it')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tagtale.app',
      'X-Title': 'TagTale',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.maxTokens ?? 512,
      temperature: options.temperature ?? 0.3,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

/** Convenience wrapper: single-turn prompt with optional system message */
export async function openrouterPrompt(
  userPrompt: string,
  systemPrompt?: string,
  options: ChatOptions = {}
): Promise<string> {
  const messages: ORMessage[] = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: userPrompt })
  return openrouterChat(messages, options)
}

/** Vision-capable call: analyze an image URL */
export async function openrouterVision(
  imageUrl: string,
  prompt: string,
  options: ChatOptions = {}
): Promise<string> {
  const messages: ORMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ]
  return openrouterChat(messages, { ...options, maxTokens: options.maxTokens ?? 256 })
}
