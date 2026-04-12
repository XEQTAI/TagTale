'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing you in…')

  useEffect(() => {
    const supabase = createSupabaseClient()

    // Supabase JS client automatically detects hash fragments (#access_token=...)
    // and PKCE codes (?code=...) in the URL and fires SIGNED_IN
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token && session.user?.email) {
        try {
          const res = await fetch('/api/auth/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: session.access_token }),
          })
          if (res.ok) {
            router.replace('/feed')
          } else {
            setStatus('Sign-in failed. Redirecting…')
            setTimeout(() => router.replace('/login?error=server'), 1500)
          }
        } catch {
          setStatus('Network error. Redirecting…')
          setTimeout(() => router.replace('/login?error=server'), 1500)
        }
      }
    })

    // Fallback: if no auth event fires within 5s, redirect to login
    const timeout = setTimeout(() => {
      router.replace('/login?error=expired')
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

  return (
    <main className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="card text-center px-10 py-9">
        <div className="w-10 h-10 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink-2 text-sm">{status}</p>
      </div>
    </main>
  )
}
