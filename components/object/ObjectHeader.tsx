'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QrCode, Bell, BellOff, Loader2 } from 'lucide-react'

interface ObjectData {
  id: string
  name: string
  description: string | null
  qrCodeUrl: string | null
  isFollowing: boolean
  hasScanned: boolean
  _count: { scans: number; posts: number; followers: number }
  sponsor: { name: string; logoUrl: string | null } | null
}

export default function ObjectHeader({ objectId }: { objectId: string }) {
  const [obj, setObj] = useState<ObjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/objects/${objectId}`)
      .then((r) => r.json())
      .then(setObj)
      .finally(() => setLoading(false))
  }, [objectId])

  const handleFollow = async () => {
    if (!obj) return
    setFollowLoading(true)
    const next = !obj.isFollowing
    try {
      const res = await fetch(`/api/objects/${objectId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFollowing: next }),
      })
      if (res.ok) {
        setObj((o) => o ? { ...o, isFollowing: next } : o)
      }
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-brand-400" size={24} />
      </div>
    )
  }

  if (!obj) return null

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{obj.name}</h1>
          {obj.description && (
            <p className="text-sm text-gray-500 mt-0.5">{obj.description}</p>
          )}
          {obj.sponsor && (
            <div className="flex items-center gap-2 mt-1">
              {obj.sponsor.logoUrl && (
                <img src={obj.sponsor.logoUrl} alt={obj.sponsor.name} className="h-4 w-auto" />
              )}
              <span className="text-xs text-yellow-600 font-medium">{obj.sponsor.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/object/${objectId}/qr`}
            className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-colors"
            title="View QR code"
          >
            <QrCode size={20} />
          </Link>
          {obj.hasScanned && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors ${
                obj.isFollowing
                  ? 'bg-brand-100 text-brand-700 hover:bg-red-50 hover:text-red-600'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {obj.isFollowing ? <BellOff size={15} /> : <Bell size={15} />}
              {obj.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-3 text-sm text-gray-500">
        <span><strong className="text-gray-900">{obj._count.scans}</strong> scans</span>
        <span><strong className="text-gray-900">{obj._count.posts}</strong> posts</span>
        <span><strong className="text-gray-900">{obj._count.followers}</strong> followers</span>
      </div>

      {!obj.hasScanned && (
        <div className="mt-3 bg-brand-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <span className="text-sm text-brand-700">
            Scan this object&apos;s QR code to join the community
          </span>
        </div>
      )}
    </div>
  )
}
