'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { z } from 'zod'
import Logo from '@/components/ui/Logo'
import BrandMark from '@/components/ui/BrandMark'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'

const errorMessages: Record<string, string> = {
  expired: 'This sign-in link has expired. Request a new code below.',
  invalid: 'This sign-in link is invalid.',
  used: 'This link was already used. Request a new code.',
  server: 'Something went wrong. Please try again.',
  ratelimit: 'Too many attempts. Wait a bit and try again.',
}

const previewEnabled = process.env.NEXT_PUBLIC_ENABLE_PREVIEW_LOGIN === 'true'

/** Matches landing “Get started” — light pill on dark canvas */
function LandingPrimaryButton({
  children,
  disabled,
  type = 'submit',
}: {
  children: React.ReactNode
  disabled?: boolean
  type?: 'submit' | 'button'
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="inline-flex items-center justify-center w-full min-h-[48px] px-8 rounded-full text-base font-medium bg-ink text-page hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
    >
      {children}
    </button>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [previewSecret, setPreviewSecret] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState(urlError && errorMessages[urlError] ? errorMessages[urlError] : '')

  const previewLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!previewSecret.trim()) return
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/auth/preview-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ secret: previewSecret }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Sign-in failed.')
        return
      }
      window.location.href = '/admin'
    } catch {
      setError('Network error.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsed = z.string().email().safeParse(email)
    if (!parsed.success) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; devCode?: string }
      if (!res.ok) {
        setError(data.error || 'Could not send a code. Try again.')
        return
      }
      setDevCode(typeof data.devCode === 'string' ? data.devCode : null)
      setStep('code')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const parsed = z.string().email().safeParse(email)
    if (!parsed.success) {
      setError('Please go back and enter your email.')
      return
    }
    const digits = code.replace(/\s/g, '')
    if (!/^\d{6}$/.test(digits)) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setVerifyLoading(true)
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code: digits }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; redirect?: string }
      if (!res.ok) {
        setError(data.error || 'Could not sign in. Check the code and try again.')
        return
      }
      const next = data.redirect === '/admin' || data.redirect === '/feed' ? data.redirect : '/feed'
      window.location.href = next
    } catch {
      setError('Network error.')
    } finally {
      setVerifyLoading(false)
    }
  }

  const backToEmail = () => {
    setStep('email')
    setCode('')
    setDevCode(null)
    setError('')
  }

  const AuthCard = ({ children }: { children: React.ReactNode }) => (
    <div className="board-panel overflow-hidden rounded-[1.25rem] shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
      <div
        className="h-1 w-full bg-gradient-to-r from-brand-700 via-brand-400 to-brand-300 opacity-90"
        aria-hidden
      />
      <div className="p-8 sm:p-9">{children}</div>
    </div>
  )

  if (step === 'code') {
    return (
      <main className="min-h-dvh board-vignette landing-hero-shell flex flex-col">
        <header className="tt-shell w-full max-w-lg mx-auto flex shrink-0 items-center justify-between gap-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 px-4 sm:px-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            <BrandMark size={36} className="text-ink-2 shrink-0" />
            <Logo size="md" />
          </Link>
          <button
            type="button"
            onClick={backToEmail}
            className="text-sm font-medium text-ink-2 hover:text-ink inline-flex items-center gap-1.5 min-h-[44px] px-2 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Email
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <div className="w-full max-w-md">
            <AuthCard>
              <div className="flex justify-center mb-6">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 border border-brand-400/25 text-brand-300 shadow-[0_0_32px_rgba(99,125,255,0.15)]">
                  <ShieldCheck className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                </div>
              </div>
              <p className="board-text text-[10px] text-ink-3 mb-3 text-center">Verify</p>
              <h2 className="text-2xl sm:text-[1.65rem] font-semibold tracking-tight text-ink text-center mb-2">
                Enter your code
              </h2>
              <p className="text-[0.9375rem] text-ink-2 leading-relaxed text-center mb-8">
                We sent a 6-digit code to <span className="text-ink font-medium">{email}</span>. It expires in 15
                minutes.
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-4 text-left">
                <div>
                  <label htmlFor="code" className="block text-xs font-medium text-ink-3 tracking-wide mb-2">
                    One-time code
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder="• • • • • •"
                    className="input px-4 py-3.5 text-lg tracking-[0.4em] text-center font-mono placeholder:tracking-normal placeholder:text-ink-3"
                    disabled={verifyLoading}
                    autoFocus
                  />
                </div>
                {error && <p className="text-rose-300/95 text-sm">{error}</p>}
                <LandingPrimaryButton disabled={verifyLoading || code.replace(/\s/g, '').length < 6}>
                  {verifyLoading ? 'Signing in…' : 'Continue'}
                </LandingPrimaryButton>
                <button
                  type="button"
                  onClick={backToEmail}
                  className="w-full min-h-[44px] rounded-full text-sm font-medium text-ink-2 hover:text-ink transition-colors"
                >
                  Use a different email
                </button>
              </form>

              {devCode ? (
                <div className="mt-8 rounded-xl border border-edge bg-surface-2/80 p-4 text-left">
                  <p className="text-xs font-medium text-ink-2 mb-2">Development — code (no email)</p>
                  <p className="text-lg font-mono font-semibold tracking-[0.25em] text-brand-300">{devCode}</p>
                </div>
              ) : null}
            </AuthCard>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh board-vignette landing-hero-shell flex flex-col">
      <header className="tt-shell w-full max-w-lg mx-auto flex shrink-0 items-center justify-between gap-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 px-4 sm:px-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <BrandMark size={36} className="text-ink-2 shrink-0" />
          <Logo size="md" />
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-ink-2 hover:text-ink min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
        <div className="w-full max-w-md">
          <AuthCard>
            <div className="flex justify-center mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 border border-brand-400/25 text-brand-300 shadow-[0_0_32px_rgba(99,125,255,0.15)]">
                <Mail className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </div>
            </div>

            <p className="board-text text-[10px] text-ink-3 mb-3 text-center">Sign in</p>
            <h1 className="text-2xl sm:text-[1.65rem] font-semibold tracking-tight text-ink text-center mb-3">
              Welcome back
            </h1>
            <p className="text-[0.9375rem] text-ink-2 leading-relaxed text-center mb-8">
              We&apos;ll send a one-time code to your email — quick and password-free.
            </p>

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-ink-3 tracking-wide mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input px-4 py-3.5 text-[0.9375rem]"
                  disabled={loading}
                />
              </div>

              {error && <p className="text-rose-300/95 text-sm">{error}</p>}

              <LandingPrimaryButton disabled={loading || !email}>
                {loading ? 'Sending…' : 'Send code'}
              </LandingPrimaryButton>
            </form>

            {previewEnabled ? (
              <form onSubmit={previewLogin} className="mt-6 border-t border-edge pt-5 space-y-3">
                <p className="text-xs text-ink-3 text-center leading-relaxed">
                  Staging: enter the preview secret from your host environment.
                </p>
                <input
                  type="password"
                  autoComplete="off"
                  value={previewSecret}
                  onChange={(e) => setPreviewSecret(e.target.value)}
                  placeholder="Preview secret"
                  className="input px-4 py-3 text-sm w-full"
                />
                <button
                  type="submit"
                  disabled={previewLoading || !previewSecret.trim()}
                  className="btn-ghost w-full py-3 rounded-xl text-sm disabled:opacity-50"
                >
                  {previewLoading ? 'Signing in…' : 'Sign in with preview secret'}
                </button>
              </form>
            ) : null}
          </AuthCard>
        </div>
      </div>
    </main>
  )
}

export function LoginContent() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh board-vignette landing-hero-shell flex items-center justify-center px-4 py-10">
          <div className="board-panel rounded-[1.25rem] p-8 max-w-md w-full text-center text-ink-2 text-sm border border-edge">
            Loading…
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
