'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Flag, Trash2, MoreHorizontal } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { formatDistanceToNow } from 'date-fns'

interface PostUser {
  id: string
  username: string
  avatarUrl: string | null
}

interface Post {
  id: string
  content: string | null
  mediaUrl: string | null
  mediaType: 'image' | 'video' | null
  createdAt: string
  views: number
  likedByMe: boolean
  user: PostUser
  object?: { id: string; name: string }
  _count: { likes: number; comments: number }
  ad?: {
    id: string
    imageUrl: string
    linkUrl: string
    title: string
  } | null
}

interface PostCardProps {
  post: Post
  isAdmin?: boolean
  onDelete?: (id: string) => void
}

export default function PostCard({ post, isAdmin, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.likedByMe)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [reported, setReported] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    if (loading) return
    setLoading(true)
    const next = !liked
    setLiked(next)
    setLikeCount((c) => (next ? c + 1 : c - 1))
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
      if (!res.ok) {
        setLiked(!next)
        setLikeCount((c) => (next ? c - 1 : c + 1))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async () => {
    if (reported) return
    await fetch(`/api/posts/${post.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'inappropriate' }),
    })
    setReported(true)
    setShowMenu(false)
  }

  const handleDelete = async () => {
    if (!isAdmin) return
    await fetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' })
    onDelete?.(post.id)
    setShowMenu(false)
  }

  // View tracking on mount
  useState(() => {
    fetch(`/api/posts/${post.id}/view`, { method: 'POST' }).catch(() => {})
  })

  return (
    <article className="card post-card mb-3 overflow-hidden">
      {/* Ad injection */}
      {post.ad && (
        <a
          href={post.ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mx-4 mb-2 rounded-xl overflow-hidden border border-edge bg-surface-2"
        >
          {post.ad.imageUrl && (
            <img src={post.ad.imageUrl} alt={post.ad.title} className="w-full h-32 object-cover" />
          )}
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">{post.ad.title}</span>
            <span className="text-xs text-ink-3 bg-surface px-2 py-0.5 rounded-full border border-edge">Sponsored</span>
          </div>
        </a>
      )}

      {/* Post header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar username={post.user.username} avatarUrl={post.user.avatarUrl} size={36} />
          <div>
            <p className="font-semibold text-sm text-ink">{post.user.username}</p>
            {post.object && (
              <p className="text-xs text-ink-3">
                on {post.object.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-3">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-1 text-ink-3 hover:text-ink rounded-full hover:bg-surface-2 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-surface border border-edge rounded-xl shadow-lg py-1 z-10 min-w-36">
                {!reported && (
                  <button
                    onClick={handleReport}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-2 hover:bg-surface-2"
                  >
                    <Flag size={14} />
                    Report
                  </button>
                )}
                {reported && (
                  <p className="px-4 py-2 text-xs text-ink-3">Reported</p>
                )}
                {isAdmin && (
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-300 hover:bg-rose-950/30"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-sm text-ink leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Media */}
      {post.mediaUrl && (
        <div className="w-full bg-surface-2">
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              controls
              className="w-full max-h-96 object-contain"
              playsInline
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="w-full max-h-96 object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            liked ? 'text-rose-300' : 'text-ink-3 hover:text-ink'
          }`}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          <span>{likeCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink transition-colors">
          <MessageCircle size={18} />
          <span>{post._count.comments}</span>
        </button>
        <span className="ml-auto text-xs text-ink-3">{post.views} views</span>
      </div>

      <div className="border-b border-edge" />
    </article>
  )
}
