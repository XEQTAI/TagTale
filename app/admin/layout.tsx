import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { BarChart2, Map, Shield, FileText, Users, Megaphone, Calendar, TrendingUp, ArrowLeft } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'

const navItems = [
  { href: '/admin',            Icon: BarChart2,  label: 'Analytics' },
  { href: '/admin/map',        Icon: Map,        label: 'Scan Map' },
  { href: '/admin/moderation', Icon: Shield,     label: 'Moderation' },
  { href: '/admin/crm',        Icon: Users,      label: 'CRM' },
  { href: '/admin/ads',        Icon: Megaphone,  label: 'Ad Sales' },
  { href: '/admin/events',     Icon: Calendar,   label: 'Events' },
  { href: '/admin/growth',     Icon: TrendingUp, label: 'Growth' },
  { href: '/admin/logs',       Icon: FileText,   label: 'Logs' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) redirect('/login')
  if (!session.user.isAdmin) redirect('/feed')

  return (
    <div className="min-h-screen bg-page">
      <header className="bg-surface/90 backdrop-blur-xl border-b border-edge">
        <div className="tt-shell py-3 flex items-center gap-3">
          <Link href="/feed" className="text-ink-3 hover:text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Logo size="md" />
          <span className="ml-2 text-xs border border-edge-2 text-ink-2 px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
          <ThemeToggle className="ml-auto" />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 min-h-[calc(100vh-57px)] bg-surface/88 border-r border-edge hidden md:block backdrop-blur-xl">
          <nav className="p-3 space-y-0.5">
            {navItems.map(({ href, Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors"
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile nav strip */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/92 border-t border-edge flex overflow-x-auto gap-1 px-2 py-1.5 backdrop-blur-xl">
          {navItems.map(({ href, Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
            >
              <Icon size={16} />
              <span className="text-[9px] font-medium">{label}</span>
            </Link>
          ))}
        </div>

        <main className="flex-1 p-5 pb-20 md:pb-5">{children}</main>
      </div>
    </div>
  )
}
