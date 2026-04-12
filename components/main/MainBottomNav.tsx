'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

export type BottomNavItem = {
  href: string
  Icon: LucideIcon
  label: string
}

export function MainBottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname() || ''

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed'
    if (href.startsWith('/profile')) return pathname.startsWith('/profile')
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface/92 backdrop-blur-xl border-t border-edge flex items-center justify-around py-2.5 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.45)]"
      aria-label="Main navigation"
    >
      {items.map(({ href, Icon, label }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors ${
              active ? 'text-ink bg-surface-2 border border-edge' : 'text-ink-3 hover:text-ink'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} aria-hidden />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
