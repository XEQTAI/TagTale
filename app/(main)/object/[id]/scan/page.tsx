'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Loader2 } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        {status === 'scanning' && (
          <>
            <Loader2 className="mx-auto mb-4 text-brand-600 animate-spin" size={48} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scanning...</h2>
            <p className="text-gray-500 text-sm">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scanned!</h2>
            <p className="text-gray-500 text-sm">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scan failed</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors"
            >
              Try again
            </button>
          </>
        )}
        {status !== 'error' && (
          <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-400">
            <MapPin size={12} />
            <span>Location used to map your scan</span>
          </div>
        )}
      </div>
    </div>
  )
}
