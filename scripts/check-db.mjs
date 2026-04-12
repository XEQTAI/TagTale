/**
 * Verify DATABASE_URL works (reads .env from project root, no extra deps).
 * Usage: node scripts/check-db.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

function loadDatabaseUrl() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) {
    console.error('No .env file found. Copy .env.example to .env and set DATABASE_URL.')
    process.exit(1)
  }
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    if (key !== 'DATABASE_URL') continue
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    return val
  }
  return null
}

const url = process.env.DATABASE_URL || loadDatabaseUrl()
if (!url) {
  console.error('DATABASE_URL is not set in .env')
  process.exit(1)
}

process.env.DATABASE_URL = url

function printFailureHints(msg) {
  const m = msg.toLowerCase()
  const isAuth =
    /authentication failed|credentials.*not valid|password authentication failed|p1000/i.test(msg)
  const isReach =
    /can't reach|could not connect|timed out|getaddrinfo|enotfound|econnrefused|p1001/i.test(m)

  if (isAuth) {
    console.error('\n── This error is login / password (the server was reached) ──\n')
    console.error('  1) Supabase Dashboard → **Project Settings → Database**.')
    console.error('     If you are not 100% sure of the DB password, use **Reset database password**,')
    console.error('     then copy a **fresh** connection string — do not reuse an old password.')
    console.error('  2) Open **Connect** and copy the **full** URI for the mode you use:')
    console.error('     **Session pooler** or **Transaction pooler** (not a hand-built URL).')
    console.error('     Transaction pooler often uses username **postgres.YOUR_PROJECT_REF**')
    console.error('     (not only `postgres`). The dashboard string includes the right user.')
    console.error('  3) If the password has special characters (@ # % etc.), the URI in .env must')
    console.error('     use **URL-encoded** password, or use the string exactly as Supabase copies it.')
    console.error('  4) One line in .env: DATABASE_URL="..." — no extra spaces; save the file.')
    console.error('  5) Retry: npm run db:check')
    return
  }

  if (isReach) {
    console.error('\n── What usually fixes “Can’t reach” on Supabase ──\n')
    console.error('  1) Dashboard → your project is not paused.')
    console.error('  2) Use a different connection string — many home networks block direct port 5432.')
    console.error('     In Supabase: click **Connect** (or **Database settings**).')
    console.error('     Copy the **Session pooler** or **Transaction pooler** URI (host ends in')
    console.error('     **.pooler.supabase.com**, port **6543**), not db.xxxxx.supabase.co:5432.')
    console.error('     For Prisma + Transaction pooler, Supabase’s UI often appends **pgbouncer=true**.')
    console.error('     Paste that as DATABASE_URL in .env and run db:check again.')
    console.error('  3) Windows DNS: set DNS to 1.1.1.1 / 8.8.8.8, then: ipconfig /flushdns')
    console.error('  4) Try phone hotspot to rule out ISP/router blocking.')
    console.error('  5) After connect works: npx prisma migrate deploy && npm run db:seed')
    return
  }

  console.error('\n── Next steps ──\n')
  console.error('  • Confirm DATABASE_URL in .env matches Supabase → Connect (full URI).')
  console.error('  • Run: npx prisma migrate deploy  (or db push)  then  npm run db:seed')
}

const prisma = new PrismaClient()

try {
  await prisma.$connect()
  await prisma.$queryRaw`SELECT 1`
  const users = await prisma.user.count()
  console.log('Database OK — connected and query works.')
  console.log(`  User rows: ${users}`)
  console.log('')
  console.log('If login still fails: run `npx prisma migrate deploy` (or `db push`) then `npm run db:seed`.')
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e)
  console.error('\nDatabase connection FAILED.\n')
  console.error(msg)
  printFailureHints(msg)
  console.error('')
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
