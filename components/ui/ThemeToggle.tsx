'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`p-2.5 rounded-xl transition-colors border border-edge bg-surface/90 hover:bg-surface-2 ${className}`}
    >
      {theme === 'dark'
        ? <Sun size={17} className="text-ink" />
        : <Moon size={17} className="text-ink" />
      }
    </button>
  )
}
