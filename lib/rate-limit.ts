import type { NextRequest } from 'next/server'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let pruneTick = 0

function pruneExpired(now: number) {
  if (++pruneTick % 50 !== 0) return
  for (const [k, b] of Array.from(buckets.entries())) {
    if (now >= b.resetAt) buckets.delete(k)
  }
}

/**
 * Simple in-memory fixed-window limiter. OK for single-instance / dev.
 * For serverless or multiple instances, use Redis (e.g. Upstash) instead.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  pruneExpired(now)

  let b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs }
    buckets.set(key, b)
  }
  b.count++
  if (b.count <= limit) return { ok: true }
  const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000))
  return { ok: false, retryAfterSec }
}

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() || 'unknown'
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}
