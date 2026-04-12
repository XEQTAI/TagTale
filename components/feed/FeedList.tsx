'use client'

import { useState, useEffect, useCallback } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import PostCard from './PostCard'
import CreatePost from './CreatePost'
import { Loader2, Rss } from 'lucide-react'

interface FeedPost {
  id: string
  content: string | null
  mediaUrl: string | null
  mediaType: 'image' | 'video' | null
  createdAt: string
  views: number
  likedByMe: boolean
  user: { id: string; username: string; avatarUrl: string | null }
  object?: { id: string; name: string }
  _count: { likes: number; comments: number }
  ad?: { id: string; imageUrl: string; linkUrl: string; title: string } | null
}

interface FeedListProps {
  objectId?: string
  userId: string
}

export default function FeedList({ objectId, userId }: FeedListProps) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [canPost, setCanPost] = useState(false)
  const [error, setError] = useState('')

  const endpoint = objectId ? `/api/objects/${objectId}/feed` : '/api/feed'

  const fetchPosts = useCallback(
    async (nextCursor?: string | null) => {
      try {
        const params = new URLSearchParams({ limit: '10' })
        if (nextCursor) params.set('cursor', nextCursor)
        const res = await fetch(`${endpoint}?${params}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Failed to load feed')
          setLoading(false)
          return
        }
        const data = await res.json()
        setPosts((prev) => (nextCursor ? [...prev, ...data.posts] : data.posts))
        setHasMore(data.hasMore)
        setCursor(data.nextCursor)
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  useEffect(() => {
    fetchPosts()
    // Check admin status + post permission
    fetch('/api/objects' + (objectId ? `/${objectId}/scan` : ''))
      .then((r) => r.json())
      .then((d) => {
        setCanPost(d.canPost ?? false)
      })
      .catch(() => {})
  }, [fetchPosts, objectId])

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const handlePostCreated = (post: unknown) => {
    setPosts((prev) => [post as FeedPost, ...prev])
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-ink-2" size={32} />
      </div>
    )
  }

  if (error === 'Scan required to view feed' || error === 'Authentication required') {
    return (
      <div className="text-center py-16 px-4 card">
        <Rss size={28} className="mx-auto mb-3 text-ink-3" />
        <h3 className="font-semibold text-ink mb-1">Scan to unlock</h3>
        <p className="text-sm text-ink-2">
          Scan this object&apos;s QR code to see the community feed.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 text-ink-3">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div>
      {objectId && canPost && (
        <div className="px-4 py-3 card mb-3">
          <CreatePost objectId={objectId} onCreated={handlePostCreated} />
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16 text-ink-3">
          <Rss size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No posts yet</p>
          {canPost && (
            <p className="text-sm mt-1">Be the first to post!</p>
          )}
        </div>
      ) : (
        <InfiniteScroll
          dataLength={posts.length}
          next={() => fetchPosts(cursor)}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-ink-3" size={24} />
            </div>
          }
          endMessage={
            <p className="text-center text-xs text-ink-3 py-6">You&apos;ve seen everything</p>
          }
        >
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
        </InfiniteScroll>
      )}
    </div>
  )
}
