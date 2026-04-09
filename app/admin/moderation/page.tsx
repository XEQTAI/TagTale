'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, Shield } from 'lucide-react'

interface ReportedPost {
  id: string
  content: string | null
  mediaUrl: string | null
  moderationStatus: string
  user: { username: string }
  object: { name: string }
  _count: { reports: number; likes: number }
  reports: { reason: string; details: string | null }[]
}

export default function ModerationPage() {
  const [posts, setPosts] = useState<ReportedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/moderation')
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false))
  }, [])

  const handleAction = async (postId: string, status: 'approved' | 'rejected') => {
    setProcessing(postId)
    try {
      await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderationStatus: status }),
      })
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } finally {
      setProcessing(null)
    }
  }

  const handleDeepModerate = async () => {
    const postIds = posts.map((p) => p.id)
    await fetch('/api/admin/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postIds }),
    })
    alert(`Queued ${postIds.length} posts for AI deep moderation`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
        {posts.length > 0 && (
          <button
            onClick={handleDeepModerate}
            className="flex items-center gap-2 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
          >
            <Shield size={16} />
            AI Deep Moderate All
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-400" size={32} />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Shield size={48} className="mx-auto mb-3 opacity-40" />
          <p>No reported posts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="font-medium text-sm text-gray-900">@{post.user.username}</span>
                  <span className="text-gray-400 mx-2 text-xs">on</span>
                  <span className="text-sm text-gray-600">{post.object.name}</span>
                </div>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                  {post._count.reports} reports
                </span>
              </div>

              {post.content && (
                <p className="text-sm text-gray-700 mb-3 bg-gray-50 rounded-lg p-3">{post.content}</p>
              )}
              {post.mediaUrl && (
                <img src={post.mediaUrl} alt="" className="h-32 rounded-lg object-cover mb-3" />
              )}

              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Report reasons:</p>
                <div className="flex flex-wrap gap-1">
                  {post.reports.map((r, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                      {r.reason}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(post.id, 'approved')}
                  disabled={processing === post.id}
                  className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  onClick={() => handleAction(post.id, 'rejected')}
                  disabled={processing === post.id}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
