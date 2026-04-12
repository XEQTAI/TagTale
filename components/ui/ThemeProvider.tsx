'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('tt-theme') as Theme | null
    const t = saved ?? 'dark'
    setTheme(t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    setMounted(true)
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('tt-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }

  // Prevent flash: hide until theme is resolved
  if (!mounted) return <div style={{ visibility: 'hidden' }}>{children}</div>

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
