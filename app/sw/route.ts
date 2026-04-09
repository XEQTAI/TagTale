import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Serve service worker from /sw to set correct scope
export async function GET() {
  const swPath = join(process.cwd(), 'public', 'sw.js')
  const content = readFileSync(swPath, 'utf-8')
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
    },
  })
}
