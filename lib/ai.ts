import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ModerationResult = {
  approved: boolean
  status: 'approved' | 'rejected' | 'flagged'
  reason?: string
  confidence: number
}

// Quick synchronous moderation via Messages API
export async function moderateContent(params: {
  content?: string
  mediaUrl?: string
  mediaType?: string
  objectName?: string
}): Promise<ModerationResult> {
  try {
    const context = [
      params.objectName && `Object tagged: "${params.objectName}"`,
      params.content && `Post text: "${params.content}"`,
      params.mediaUrl && `Media: ${params.mediaType || 'image'} attached`,
    ]
      .filter(Boolean)
      .join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: `You are a content moderator for TagTale, a social media platform.
Evaluate posts for: spam, illegal content, NSFW (unless mild), hate speech, harassment, violence.
Respond ONLY with JSON: {"approved": bool, "status": "approved"|"rejected"|"flagged", "reason": string|null, "confidence": 0-1}
Be permissive for general social media content. Only reject clear violations.`,
      messages: [
        {
          role: 'user',
          content: `Moderate this post:\n${context || 'No content provided'}`,
        },
      ],
    })

    const text = response.content.find((b) => b.type === 'text')?.text ?? ''
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')

    return {
      approved: parsed.approved ?? true,
      status: parsed.status ?? 'approved',
      reason: parsed.reason ?? undefined,
      confidence: parsed.confidence ?? 0.9,
    }
  } catch (err) {
    console.error('Moderation error:', err)
    // Default to approved on error — don't block posts for AI failures
    return { approved: true, status: 'approved', confidence: 0.5 }
  }
}

// Async deep moderation using Claude Managed Agents
export async function deepModeratePosts(reportedPostIds: string[]): Promise<void> {
  const agentId = process.env.CLAUDE_AGENT_ID
  const environmentId = process.env.CLAUDE_ENVIRONMENT_ID

  if (!agentId || !environmentId) {
    console.warn('Claude Managed Agents not configured — skipping deep moderation')
    return
  }

  try {
    // Create a session for this batch moderation job
    const session = await client.beta.sessions.create({
      agent: { type: 'agent', id: agentId },
      environment_id: environmentId,
      title: `Moderation batch: ${reportedPostIds.length} posts`,
    })

    // Send the moderation task
    await client.beta.sessions.events.send(session.id, {
      events: [
        {
          type: 'user.message',
          content: [
            {
              type: 'text',
              text: `Review these reported post IDs for policy violations and output a JSON array of moderation decisions:
Post IDs: ${reportedPostIds.join(', ')}

For each post, decide: action ("actioned" = remove, "dismissed" = keep) and reason.
Output format: [{"postId": "...", "action": "actioned"|"dismissed", "reason": "..."}]`,
            },
          ],
        },
      ],
    })

    // Stream events to completion
    const stream = client.beta.sessions.stream(session.id)

    for await (const event of stream) {
      if (event.type === 'session.status_terminated') break
      if (
        event.type === 'session.status_idle' &&
        (event as { stop_reason?: { type: string } }).stop_reason?.type !== 'requires_action'
      ) break
    }

    // Archive the session when done
    await client.beta.sessions.archive(session.id)
  } catch (err) {
    console.error('Deep moderation agent error:', err)
  }
}

// Generate a creative username (no numbers) using Claude
export async function generateAiUsername(): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content:
            'Generate one creative, memorable username for a social media app. Rules: lowercase only, no numbers, no spaces, no underscores, 10-20 chars total, should sound like a nature+personality mashup (e.g. "gentlestormcrest"). Output ONLY the username, nothing else.',
        },
      ],
    })

    const text = response.content.find((b) => b.type === 'text')?.text?.trim() ?? ''
    // Validate: no numbers, reasonable length
    if (text && /^[a-z]{8,25}$/.test(text)) return text
  } catch {
    // Fall through to fallback
  }

  return '' // Caller falls back to generateUsername() from utils
}

// One-time setup: create the Claude Managed Agent for TagTale
export async function setupManagedAgent(): Promise<{ agentId: string; environmentId: string }> {
  // Create environment
  const environment = await client.beta.environments.create({
    name: 'tagtale-moderation',
    config: {
      type: 'cloud',
      networking: { type: 'unrestricted' },
    },
  })

  // Create the moderation agent
  const agent = await client.beta.agents.create({
    name: 'TagTale Content Moderator',
    model: 'claude-opus-4-6',
    system: `You are a content moderator for TagTale, a social media platform where users post about physical objects.
Your job is to review reported content and make moderation decisions.

Guidelines:
- Remove content that is: illegal, genuinely harmful, severe harassment, CSAM
- Keep content that is: mildly edgy, opinionated, funny, adult humor (no explicit nudity unless reported for age-gate)
- Consider context: a post on a lighter (weed lighter) can discuss cannabis; that's contextual
- Prioritize free expression; only remove clear violations
- Always provide a brief reason for your decision

You have access to bash and file tools if you need to analyze media files.`,
    tools: [
      { type: 'agent_toolset_20260401', default_config: { enabled: true } },
    ],
  })

  return { agentId: agent.id, environmentId: environment.id }
}
