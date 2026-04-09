import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Home, Search, User, Settings } from 'lucide-react'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2">
          <span className="text-xl">🏷️</span>
          <span className="font-bold text-brand-600 text-lg">TagTale</span>
        </Link>
        <div className="flex items-center gap-3">
          {session.user.isAdmin && (
            <Link href="/admin" className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium">
              Admin
            </Link>
          )}
          <Link href={`/profile/${session.userId}`}>
            <img
              src={session.user.avatarUrl || `https://api.dicebear.com/7.x/thumbs/svg?seed=${session.userId}`}
              alt="Profile"
              className="w-8 h-8 rounded-full border-2 border-brand-200"
            />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-4">
        <Link href="/feed" className="flex flex-col items-center gap-1 text-gray-500 hover:text-brand-600 transition-colors">
          <Home size={22} />
          <span className="text-xs">Feed</span>
        </Link>
        <Link href="/objects" className="flex flex-col items-center gap-1 text-gray-500 hover:text-brand-600 transition-colors">
          <Search size={22} />
          <span className="text-xs">Explore</span>
        </Link>
        <Link href={`/profile/${session.userId}`} className="flex flex-col items-center gap-1 text-gray-500 hover:text-brand-600 transition-colors">
          <User size={22} />
          <span className="text-xs">Profile</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1 text-gray-500 hover:text-brand-600 transition-colors">
          <Settings size={22} />
          <span className="text-xs">Settings</span>
        </Link>
      </nav>
    </div>
  )
}
