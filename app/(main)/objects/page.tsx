'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, QrCode } from 'lucide-react'

interface TagObject {
  id: string
  name: string
  description: string | null
  qrCodeUrl: string | null
  _count: { scans: number; posts: number }
  sponsor: { name: string; logoUrl: string | null } | null
}

export default function ObjectsPage() {
  const [objects, setObjects] = useState<TagObject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/objects')
      .then((r) => r.json())
      .then((d) => setObjects(d.objects || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = objects.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Explore Objects</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search objects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <QrCode size={48} className="mx-auto mb-3 opacity-40" />
          <p>No objects found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((obj) => (
            <Link
              key={obj.id}
              href={`/object/${obj.id}`}
              className="block bg-white rounded-xl p-4 border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900 truncate">{obj.name}</h2>
                    {obj.sponsor && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {obj.sponsor.name}
                      </span>
                    )}
                  </div>
                  {obj.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{obj.description}</p>
                  )}
                  <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                    <span>{obj._count.scans} scans</span>
                    <span>{obj._count.posts} posts</span>
                  </div>
                </div>
                <QrCode className="text-gray-300 flex-shrink-0 mt-0.5" size={24} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
