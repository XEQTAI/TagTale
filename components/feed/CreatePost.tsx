'use client'

import { useState, useRef } from 'react'
import { Image, Send, X } from 'lucide-react'

interface CreatePostProps {
  objectId: string
  onCreated: (post: unknown) => void
}

export default function CreatePost({ objectId, onCreated }: CreatePostProps) {
  const [content, setContent] = useState('')
  /** Public/legacy URL (local `/uploads/...` or full http URL) */
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaStorageKey, setMediaStorageKey] = useState<string | null>(null)
  const [mediaStorageBackend, setMediaStorageBackend] = useState<'r2' | 'supabase' | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      if (data.storageKey && data.previewUrl) {
        setMediaStorageKey(data.storageKey)
        setPreviewUrl(data.previewUrl)
        setMediaUrl(null)
        setMediaStorageBackend(data.storageBackend ?? 'supabase')
      } else if (data.url) {
        setMediaUrl(data.url)
        setPreviewUrl(data.url)
        setMediaStorageKey(null)
        setMediaStorageBackend(null)
      }
      setMediaType(data.mediaType)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !mediaUrl && !mediaStorageKey) return

    const backendBody =
      mediaStorageKey && mediaStorageBackend ? { mediaStorageBackend } : {}

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectId,
          content: content.trim() || undefined,
          mediaUrl: mediaUrl ?? undefined,
          mediaStorageKey: mediaStorageKey ?? undefined,
          ...backendBody,
          mediaType,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to post')
        return
      }
      setContent('')
      setMediaUrl(null)
      setMediaStorageKey(null)
      setMediaStorageBackend(null)
      setPreviewUrl(null)
      setMediaType(null)
      onCreated(data)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your experience with this object..."
        maxLength={2000}
        rows={3}
        className="input px-3 py-2 text-sm resize-none"
      />

      {previewUrl && (
        <div className="relative inline-block">
          {mediaType === 'video' ? (
            <video src={previewUrl} className="h-24 rounded-lg" />
          ) : (
            <img src={previewUrl} alt="Upload preview" className="h-24 rounded-lg object-cover" />
          )}
          <button
            type="button"
            onClick={() => {
              setMediaUrl(null)
              setMediaStorageKey(null)
              setMediaStorageBackend(null)
              setPreviewUrl(null)
              setMediaType(null)
            }}
            className="absolute -top-2 -right-2 bg-surface-2 text-ink rounded-full p-0.5 border border-edge"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error && <p className="text-rose-300 text-xs">{error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors"
        >
          <Image size={18} />
          <span>{uploading ? 'Uploading...' : 'Photo/Video'}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="submit"
          disabled={submitting || uploading || (!content.trim() && !mediaUrl && !mediaStorageKey)}
          className="btn-primary flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={15} />
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}
