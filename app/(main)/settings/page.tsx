'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-ink mb-6 tracking-wide uppercase">Settings</h1>

      <div className="card overflow-hidden">
        <div className="divide-y divide-edge">
          <div className="flex items-center gap-3 px-4 py-4">
            <Bell className="text-ink-3" size={20} />
            <div>
              <p className="font-medium text-ink text-sm">Notifications</p>
              <p className="text-xs text-ink-3">Coming soon</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <Shield className="text-ink-3" size={20} />
            <div>
              <p className="font-medium text-ink text-sm">Privacy</p>
              <p className="text-xs text-ink-3">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-rose-950/40 text-rose-200 border border-rose-900/50 font-medium py-3 rounded-xl hover:bg-rose-950/60 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>

      <p className="text-center text-xs text-ink-3 mt-8">TagTale v0.1.0</p>
    </div>
  )
}
