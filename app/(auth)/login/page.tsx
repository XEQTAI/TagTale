'use client'

import { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase'

const COOLDOWN = 60 // seconds

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  const startCooldown = () => {
    setCooldown(COOLDOWN)
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsed = z.string().email().safeParse(email)
    if (!parsed.success) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const supabase = createSupabaseClient()
      const { error: sbError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (sbError) {
        if (sbError.message.toLowerCase().includes('rate limit') || sbError.status === 429) {
          setError('Too many requests — please wait 60 seconds before trying again.')
          startCooldown()
        } else {
          setError(sbError.message)
        }
        return
      }
      startCooldown()
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-4">
            We sent a magic link to <strong>{email}</strong>.<br />
            Click it to sign in — expires in 15 minutes.
          </p>
          <button
            onClick={() => { setSubmitted(false); setError('') }}
            disabled={cooldown > 0}
            className="text-sm text-gray-400 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend link'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🏷️</div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to TagTale</h1>
          <p className="text-gray-500 text-sm mt-1">We&apos;ll email you a magic link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email || cooldown > 0}
            className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send magic link'}
          </button>
        </form>
      </div>
    </main>
  )
}
