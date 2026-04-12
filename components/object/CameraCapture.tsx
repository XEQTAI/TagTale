'use client'

import { useRef, useState } from 'react'
import { Camera, Upload, X, RefreshCw } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (url: string) => void
  currentUrl?: string | null
  label?: string
}

export default function CameraCapture({ onCapture, currentUrl, label = 'Object photo' }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setError('')
    setUploading(true)

    // Local preview
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      onCapture(data.previewUrl || data.url)
    } catch {
      setError('Upload failed — tap to retry')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full">
      <p className="text-xs font-medium text-ink-2 mb-2">{label}</p>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden bg-surface-2 aspect-square max-w-[200px]">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <RefreshCw className="animate-spin text-white" size={24} />
            </div>
          )}

          <button
            type="button"
            onClick={() => { setPreview(null); onCapture('') }}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
          >
            <X size={14} />
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5"
            title="Retake"
          >
            <Camera size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 w-full max-w-[200px] aspect-square border-2 border-dashed border-edge-2 rounded-xl text-ink-3 hover:border-ink hover:text-ink transition-colors"
        >
          <Camera size={28} />
          <span className="text-xs font-medium">Take photo</span>
          <span className="text-xs opacity-60">or tap to upload</span>
        </button>
      )}

      {error && <p className="text-xs text-rose-300 mt-1">{error}</p>}

      {/* On mobile: capture="environment" opens rear camera directly */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
