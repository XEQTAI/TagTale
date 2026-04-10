'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase'

const COOLDOWN = 60

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus()
  }, [step])

  const startCooldown = () => {
    setCooldown(COOLDOWN)
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')

    const parsed = z.string().email().safeParse(email)
    if (!parsed.success) { setError('Please enter a valid email address.'); return }

    setLoading(true)
    try {
      const supabase = createSupabaseClient()
      const { error: sbError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (sbError) {
        if (sbError.status === 429 || sbError.message.toLowerCase().includes('rate limit')) {
          setError('Too many attempts — please wait 60 seconds.')
          startCooldown()
        } else {
          setError(sbError.message)
        }
        return
      }
      startCooldown()
      setStep('code')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Enter the 6-digit code from your email.'); return }
    setError('')
    setVerifying(true)
    try {
      const supabase = createSupabaseClient()
      const { data, error: sbError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })
      if (sbError || !data.session?.access_token) {
        setError('Incorrect or expired code. Check your email and try again.')
        setCode('')
        return
      }
      // Exchange Supabase session for our custom JWT
      const res = await fetch('/api/auth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: data.session.access_token }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.detail || 'Sign-in failed. Please try again.')
        return
      }
      router.replace('/feed')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  // ── Step 1: Email ──────────────────────────────────────────────
  if (step === 'email') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🏷️</div>
            <h1 className="text-2xl font-bold text-gray-900">Sign in to TagTale</h1>
            <p className="text-gray-500 text-sm mt-1">We&apos;ll email you a 6-digit code</p>
          </div>

          <form onSubmit={sendCode} className="space-y-4">
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
              {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send code'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  // ── Step 2: Code ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📨</div>
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="text-gray-500 text-sm mt-1">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              6-digit code
            </label>
            <input
              ref={codeRef}
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-2xl font-mono text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              disabled={verifying}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? 'Verifying…' : 'Sign in'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              className="text-gray-400 hover:text-gray-600"
            >
              ← Wrong email?
            </button>
            <button
              type="button"
              onClick={() => sendCode()}
              disabled={cooldown > 0}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
