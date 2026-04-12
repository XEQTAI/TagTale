'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Loader2, CircleCheck, CircleX } from 'lucide-react'

export default function ScanPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState<'scanning' | 'success' | 'error'>('scanning')
  const [message, setMessage] = useState('Recording your scan...')
  const router = useRouter()

  useEffect(() => {
    const doScan = async () => {
      try {
        let latitude: number | undefined
        let longitude: number | undefined

        // Try to get GPS location
        if ('geolocation' in navigator) {
          try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
              navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
            )
            latitude = pos.coords.latitude
            longitude = pos.coords.longitude
          } catch {
            // Location denied — proceed without it
          }
        }

        const res = await fetch(`/api/objects/${params.id}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude }),
        })

        if (res.status === 401) {
          router.push('/login')
          return
        }

        if (!res.ok) {
          const data = await res.json()
          setMessage(data.error || 'Failed to record scan')
          setStatus('error')
          return
        }

        const data = await res.json()
        setStatus('success')
        setMessage(`Scan recorded! You can post for the next hour.`)

        setTimeout(() => router.push(`/object/${params.id}`), 1500)
      } catch {
        setMessage('Network error. Please try again.')
        setStatus('error')
      }
    }

    doScan()
  }, [params.id, router])

  return (
    <div className="min-h-screen board-vignette flex items-center justify-center px-4">
      <div className="board-panel rounded-2xl p-8 max-w-sm w-full text-center">
        {status === 'scanning' && (
          <>
            <Loader2 className="mx-auto mb-4 text-ink animate-spin" size={48} />
            <h2 className="text-xl font-bold text-ink mb-2">Scanning...</h2>
            <p className="text-ink-2 text-sm">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CircleCheck size={48} className="mx-auto mb-4 text-emerald-300" />
            <h2 className="text-xl font-bold text-ink mb-2">Scanned!</h2>
            <p className="text-ink-2 text-sm">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <CircleX size={48} className="mx-auto mb-4 text-rose-300" />
            <h2 className="text-xl font-bold text-ink mb-2">Scan failed</h2>
            <p className="text-ink-2 text-sm mb-6">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-3 rounded-xl"
            >
              Try again
            </button>
          </>
        )}
        {status !== 'error' && (
          <div className="mt-4 flex items-center justify-center gap-1 text-xs text-ink-3">
            <MapPin size={12} />
            <span>Location used to map your scan</span>
          </div>
        )}
      </div>
    </div>
  )
}
