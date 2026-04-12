'use client'

import { useState } from 'react'
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase'
import Logo from '@/components/ui/Logo'
import BrandMark from '@/components/ui/BrandMark'
import { MailCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        setError(sbError.message)
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen board-vignette flex items-center justify-center px-4 py-10">
        <div className="board-panel rounded-2xl p-8 max-w-sm w-full text-center">
          <MailCheck size={42} className="mx-auto mb-4 text-ink-2" />
          <h2 className="text-2xl font-bold text-ink mb-2">Check your email</h2>
          <p className="text-ink-2 text-sm">
            We sent a magic link to <strong>{email}</strong>.<br />
            Click it to sign in — expires in 15 minutes.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen board-vignette flex items-center justify-center px-4 py-10">
      <div className="board-panel rounded-2xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <BrandMark size={44} className="mx-auto mb-3 text-ink" />
          <Logo size="lg" className="inline-block mb-4" />
          <h1 className="text-2xl font-bold text-ink">Sign in to TagTale</h1>
          <p className="text-ink-2 text-sm mt-1">We&apos;ll email you a magic link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-2 mb-1">
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
              className="input px-4 py-3 text-sm"
              disabled={loading}
            />
          </div>

          {error && <p className="text-rose-300 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email}
            className="btn-primary w-full py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>

        {process.env.NODE_ENV === 'development' ? (
          <p className="mt-6 text-center text-xs text-ink-3 leading-relaxed border-t border-edge pt-5">
            <strong className="text-ink-2 font-medium">Local dev:</strong> Magic links need Supabase in{' '}
            <code className="text-[11px] text-ink-2">.env</code>. To skip email login, open{' '}
            <a href="/feed" className="text-brand-400 underline underline-offset-2 hover:text-brand-300">
              /feed
            </a>{' '}
            or{' '}
            <a href="/admin" className="text-brand-400 underline underline-offset-2 hover:text-brand-300">
              /admin
            </a>{' '}
            — you&apos;ll be signed in as the seeded admin if the database is running.
          </p>
        ) : null}
      </div>
    </main>
  )
}
