import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Word lists for username generation (no numbers)
const ADJECTIVES = [
  'swift', 'calm', 'bold', 'bright', 'wise', 'kind', 'warm', 'cool', 'gentle', 'brave',
  'clear', 'free', 'pure', 'true', 'fair', 'soft', 'deep', 'wild', 'fresh', 'still',
  'silent', 'golden', 'silver', 'cosmic', 'velvet', 'ancient', 'mystic', 'serene',
  'electric', 'crystal', 'shadow', 'luminous', 'radiant', 'azure', 'ember', 'frost',
  'storm', 'dawn', 'dusk', 'jade', 'amber', 'coral', 'silver', 'copper', 'violet',
  'indigo', 'scarlet', 'ivory', 'onyx', 'cedar', 'maple', 'birch', 'pine', 'aspen',
]

const NOUNS = [
  'fox', 'wolf', 'bear', 'hawk', 'owl', 'deer', 'raven', 'lynx', 'hare', 'crane',
  'pine', 'cedar', 'maple', 'oak', 'birch', 'willow', 'fern', 'moss', 'sage', 'reed',
  'river', 'lake', 'creek', 'tide', 'wave', 'cliff', 'peak', 'vale', 'glen', 'cove',
  'storm', 'breeze', 'cloud', 'mist', 'frost', 'ember', 'flame', 'spark', 'glow',
  'stone', 'pebble', 'crystal', 'amber', 'jade', 'pearl', 'coral', 'topaz', 'quartz',
  'meadow', 'hollow', 'thicket', 'canopy', 'geyser', 'summit', 'cascade', 'fjord',
]

export function generateUsername(): string {
  const adj1 = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const adj2 = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  // Ensure no numbers appear
  return `${adj1}${noun}${adj2}`.replace(/[0-9]/g, '')
}

export function generateAvatarUrl(username: string): string {
  const styles = ['thumbs', 'adventurer', 'fun-emoji', 'bottts-neutral', 'identicon']
  const style = styles[Math.floor(Math.random() * styles.length)]
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Check if a scan grants posting rights (within 1 hour)
export function canPostAfterScan(scannedAt: Date): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  return scannedAt > oneHourAgo
}

export function generateQrScanUrl(baseUrl: string, objectId: string): string {
  return `${baseUrl}/object/${objectId}/scan`
}
