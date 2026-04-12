'use client'

import { useState, useEffect } from 'react'
import { Download, Printer, RefreshCw } from 'lucide-react'

export default function QrPage({ params }: { params: { id: string } }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadQr = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/objects/${params.id}/qr`)
      if (!res.ok) throw new Error('Failed to load QR code')
      const data = await res.json()
      setQrUrl(data.qrCodeUrl)
    } catch {
      setError('Failed to load QR code')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadQr() }, [params.id])

  const handleDownload = () => {
    if (!qrUrl) return
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `tagtale-qr-${params.id}.png`
    a.click()
  }

  const handlePrint = () => {
    window.open(`/api/objects/${params.id}/qr?format=print`, '_blank')
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-ink mb-6 text-center tracking-wide uppercase">QR Code</h1>

      <div className="card p-6 text-center">
        {loading && (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="animate-spin text-ink-2" size={32} />
          </div>
        )}
        {error && <p className="text-rose-300 text-sm">{error}</p>}
        {qrUrl && !loading && (
          <img src={qrUrl} alt="QR Code" className="mx-auto w-64 h-64 rounded-xl" />
        )}
      </div>

      <div className="mt-4 space-y-3">
        <button
          onClick={handleDownload}
          disabled={!qrUrl}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-50"
        >
          <Download size={18} />
          Download PNG
        </button>
        <button
          onClick={handlePrint}
          className="btn-ghost w-full flex items-center justify-center gap-2 py-3 rounded-xl"
        >
          <Printer size={18} />
          Print card
        </button>
        <button
          onClick={loadQr}
          className="w-full flex items-center justify-center gap-2 text-ink-3 font-medium py-2 hover:text-ink transition-colors"
        >
          <RefreshCw size={16} />
          Regenerate
        </button>
      </div>
    </div>
  )
}
