'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, UserRound } from 'lucide-react'

interface Profile {
  id: string
  username: string
  avatarUrl: string | null
  isMe: boolean
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get profile from session-based objects endpoint
    fetch('/api/auth/verify', { method: 'HEAD' })
      .then(() => fetch(`/api/objects?userId=${params.id}`))
      .catch(() => {})
    setLoading(false)
  }, [params.id])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="card p-6 text-center">
        <img
          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${params.id}`}
          alt="Avatar"
          className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-edge-2"
        />
        <div className="flex items-center justify-center gap-2">
          <UserRound size={14} className="text-ink-3" />
          <p className="text-ink-2 text-sm">User profile</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-rose-950/40 text-rose-200 border border-rose-900/50 font-medium py-3 rounded-xl hover:bg-rose-950/60 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  )
}
