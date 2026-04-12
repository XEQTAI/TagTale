import { redirect } from 'next/navigation'
import { CircleX, ShieldCheck } from 'lucide-react'

// The actual verification happens in /api/auth/verify which redirects to /feed
// This page is shown only if someone navigates here directly
export default function VerifyPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string }
}) {
  if (searchParams.token) {
    redirect(`/api/auth/verify?token=${searchParams.token}`)
  }

  return (
    <main className="min-h-screen board-vignette flex items-center justify-center px-4 py-10">
      <div className="board-panel rounded-2xl p-8 max-w-sm w-full text-center">
        {searchParams.error ? (
          <>
            <CircleX size={44} className="mx-auto mb-4 text-rose-300" />
            <h2 className="text-xl font-bold text-ink mb-2">Link expired or invalid</h2>
            <p className="text-ink-2 text-sm mb-6">
              Sign-in links expire after 15 minutes. Request a new code on the login page.
            </p>
            <a
              href="/login"
              className="btn-primary block w-full py-3 rounded-xl"
            >
              Back to login
            </a>
          </>
        ) : (
          <>
            <ShieldCheck size={44} className="mx-auto mb-4 text-ink-2" />
            <h2 className="text-xl font-bold text-ink mb-2">Verifying...</h2>
            <p className="text-ink-2 text-sm">Please wait while we sign you in.</p>
          </>
        )}
      </div>
    </main>
  )
}
