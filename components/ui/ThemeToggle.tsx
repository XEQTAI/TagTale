'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`p-2 rounded-xl transition-colors bg-surface-2 hover:opacity-80 ${className}`}
    >
      {theme === 'dark'
        ? <Sun  size={17} className="text-ink" />
        : <Moon size={17} className="text-ink" />
      }
    </button>
  )
}
