import { NextResponse } from 'next/server'
import { tryDevAutoLoginAsAdmin } from '@/lib/dev-auto-login'

/**
 * Development only: sign in as seeded admin without email (requires DB + seed).
 */
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }

  const result = await tryDevAutoLoginAsAdmin()
  if (!result.ok) {
    const msg =
      result.reason === 'db_unavailable'
        ? 'Database not reachable. Start Postgres and run prisma db push + db:seed.'
        : 'No admin user found. Run npm run db:seed.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
