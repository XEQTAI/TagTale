import { redirect } from 'next/navigation'

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
    <main className="min-h-screen bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        {searchParams.error ? (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Link expired or invalid</h2>
            <p className="text-gray-500 text-sm mb-6">
              Magic links expire after 15 minutes. Request a new one.
            </p>
            <a
              href="/login"
              className="block w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors"
            >
              Back to login
            </a>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">🔗</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying...</h2>
            <p className="text-gray-500 text-sm">Please wait while we sign you in.</p>
          </>
        )}
      </div>
    </main>
  )
}
