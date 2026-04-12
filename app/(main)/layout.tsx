import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { tryDevAutoLoginAsAdmin } from '@/lib/dev-auto-login'
import Link from 'next/link'
import { Home, Search, User, Settings } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { MainBottomNav } from '@/components/main/MainBottomNav'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  let session = await getSession()

  // Dev auto-login: sign in as the seed admin without needing email (requires Postgres)
  if (!session && process.env.NODE_ENV === 'development') {
    const dev = await tryDevAutoLoginAsAdmin()
    if (dev.ok) {
      session = { userId: dev.userId, user: dev.user }
    } else if (dev.reason === 'db_unavailable' || dev.reason === 'no_admin') {
      redirect('/login')
    }
  }

  if (!session) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen bg-page">

      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-edge">
        <div className="tt-shell py-3 flex items-center justify-between">
          <Link href="/feed">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {session.user.isAdmin && (
              <Link
                href="/admin"
                className="text-xs border border-edge-2 text-ink-2 px-2.5 py-1 rounded-full font-medium hover:bg-surface-2 transition-colors"
              >
                Admin
              </Link>
            )}

            <Link href={`/profile/${session.userId}`}>
              {/* Avatar keeps its colour — CSS does not apply grayscale to img elements */}
              <img
                src={session.user.avatarUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-edge-2 object-cover"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24">{children}</main>

      <MainBottomNav
        items={[
          { href: '/feed', Icon: Home, label: 'Feed' },
          { href: '/objects', Icon: Search, label: 'Explore' },
          { href: `/profile/${session.userId}`, Icon: User, label: 'Profile' },
          { href: '/settings', Icon: Settings, label: 'Settings' },
        ]}
      />
    </div>
  )
}
