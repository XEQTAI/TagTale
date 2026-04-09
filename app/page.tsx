import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const session = await getSession()
  if (session) redirect('/feed')

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-600 via-brand-500 to-pink-500 flex flex-col items-center justify-center px-4 text-white">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🏷️</div>
        <h1 className="text-5xl font-bold mb-3 tracking-tight">TagTale</h1>
        <p className="text-xl text-brand-100 mb-8">
          Every object has a story.<br />Scan to discover it.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-white text-brand-600 font-semibold py-3 px-6 rounded-xl hover:bg-brand-50 transition-colors"
          >
            Get started
          </Link>
          <p className="text-sm text-brand-200">
            No password needed — just your email.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl mb-2">📷</div>
            <p className="text-sm text-brand-100">Scan QR codes on objects</p>
          </div>
          <div>
            <div className="text-3xl mb-2">✍️</div>
            <p className="text-sm text-brand-100">Post your experience</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🌍</div>
            <p className="text-sm text-brand-100">Follow the journey</p>
          </div>
        </div>
      </div>
    </main>
  )
}
