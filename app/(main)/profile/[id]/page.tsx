'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

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
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
        <img
          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${params.id}`}
          alt="Avatar"
          className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-brand-100"
        />
        <p className="text-gray-500 text-sm">User profile</p>
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-medium py-3 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  )
}
