import { redirect } from 'next/navigation'
import { getSession, createSessionToken, setSessionCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Home, Search, User, Settings } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  let session = await getSession()

  // Dev auto-login: sign in as the seed admin without needing email
  if (!session && process.env.NODE_ENV === 'development') {
    const admin = await prisma.user.findFirst({ where: { isAdmin: true } })
    if (admin) {
      const token = await createSessionToken(admin.id)
      await setSessionCookie(token)
      session = { userId: admin.id, user: { id: admin.id, email: admin.email, username: admin.username, avatarUrl: admin.avatarUrl, isAdmin: admin.isAdmin } }
    } else {
      redirect('/login')
    }
  }

  if (!session) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen bg-page">

      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-surface border-b border-edge px-4 py-3 flex items-center justify-between">
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
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-edge flex items-center justify-around py-2 px-4">
        {[
          { href: '/feed',    Icon: Home,     label: 'Feed' },
          { href: '/objects', Icon: Search,   label: 'Explore' },
          { href: `/profile/${session.userId}`, Icon: User, label: 'Profile' },
          { href: '/settings', Icon: Settings, label: 'Settings' },
        ].map(({ href, Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 text-ink-3 hover:text-ink transition-colors"
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
