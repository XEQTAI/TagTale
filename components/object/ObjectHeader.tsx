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
        <Loader2 className="animate-spin text-ink-2" size={24} />
      </div>
    )
  }

  if (!obj) return null

  return (
    <div className="card px-4 py-4 mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-ink truncate">{obj.name}</h1>
          {obj.description && (
            <p className="text-sm text-ink-2 mt-0.5">{obj.description}</p>
          )}
          {obj.sponsor && (
            <div className="flex items-center gap-2 mt-1">
              {obj.sponsor.logoUrl && (
                <img src={obj.sponsor.logoUrl} alt={obj.sponsor.name} className="h-4 w-auto" />
              )}
              <span className="text-xs text-ink-2 font-medium">{obj.sponsor.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/object/${objectId}/qr`}
            className="p-2 text-ink-3 hover:text-ink hover:bg-surface-2 rounded-xl transition-colors border border-edge"
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
                  ? 'bg-surface-2 text-ink-2 border border-edge hover:text-ink'
                  : 'btn-primary'
              }`}
            >
              {obj.isFollowing ? <BellOff size={15} /> : <Bell size={15} />}
              {obj.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-3 text-sm text-ink-2">
        <span><strong className="text-ink">{obj._count.scans}</strong> scans</span>
        <span><strong className="text-ink">{obj._count.posts}</strong> posts</span>
        <span><strong className="text-ink">{obj._count.followers}</strong> followers</span>
      </div>

      {!obj.hasScanned && (
        <div className="mt-3 bg-surface-2 rounded-xl px-3 py-2.5 flex items-center gap-2 border border-edge">
          <span className="text-sm text-ink-2">
            Scan this object&apos;s QR code to join the community
          </span>
        </div>
      )}
    </div>
  )
}
