'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Bell, Shield } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          <div className="flex items-center gap-3 px-4 py-4">
            <Bell className="text-gray-400" size={20} />
            <div>
              <p className="font-medium text-gray-900 text-sm">Notifications</p>
              <p className="text-xs text-gray-400">Coming soon</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <Shield className="text-gray-400" size={20} />
            <div>
              <p className="font-medium text-gray-900 text-sm">Privacy</p>
              <p className="text-xs text-gray-400">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-medium py-3 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">TagTale v0.1.0</p>
    </div>
  )
}
