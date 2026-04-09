/**
 * One-time setup script for the Claude Managed Agents moderation agent.
 * Run once: npx ts-node scripts/setup-agent.ts
 * Copy the output into your .env file.
 */
import Anthropic from '@anthropic-ai/sdk'

async function main() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  console.log('Creating TagTale content moderation agent...')

  // @ts-expect-error — Managed Agents beta API
  const agent = await client.beta.agents.create({
    name: 'TagTale Content Moderator',
    model: 'claude-opus-4-6',
    system: `You are a content moderation agent for TagTale, a social platform where people post about physical objects they have scanned.

Your task is to review batches of reported posts and determine whether each should be APPROVED or REJECTED.

Reject posts that contain:
- Explicit sexual content
- Graphic violence or gore
- Hate speech or discrimination
- Harassment or personal attacks
- Spam or obvious commercial manipulation
- Illegal content

Approve posts that are:
- Genuine experiences with scanned objects
- Constructive community content
- Discussion that may be edgy but is within community norms

For each post, respond in this JSON format:
{"postId": "...", "decision": "approved" | "rejected", "reason": "brief explanation"}

Return a JSON array of decisions.`,
  })

  console.log('\n✅ Agent created!')
  console.log('\nAdd to your .env file:')
  console.log(`CLAUDE_AGENT_ID=${agent.id}`)
}

main().catch(console.error)
