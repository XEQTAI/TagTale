'use client'

import { useState, useRef } from 'react'
import { Image, Send, X } from 'lucide-react'

interface CreatePostProps {
  objectId: string
  onCreated: (post: unknown) => void
}

export default function CreatePost({ objectId, onCreated }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
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
      setMediaUrl(data.url)
      setMediaType(data.mediaType)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !mediaUrl) return

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId, content: content.trim() || undefined, mediaUrl, mediaType }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to post')
        return
      }
      setContent('')
      setMediaUrl(null)
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
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      {mediaUrl && (
        <div className="relative inline-block">
          {mediaType === 'video' ? (
            <video src={mediaUrl} className="h-24 rounded-lg" />
          ) : (
            <img src={mediaUrl} alt="Upload preview" className="h-24 rounded-lg object-cover" />
          )}
          <button
            type="button"
            onClick={() => { setMediaUrl(null); setMediaType(null) }}
            className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 transition-colors"
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
          disabled={submitting || uploading || (!content.trim() && !mediaUrl)}
          className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={15} />
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}
