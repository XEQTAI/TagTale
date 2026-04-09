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
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">QR Code</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
        {loading && (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="animate-spin text-brand-400" size={32} />
          </div>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {qrUrl && !loading && (
          <img src={qrUrl} alt="QR Code" className="mx-auto w-64 h-64 rounded-xl" />
        )}
      </div>

      <div className="mt-4 space-y-3">
        <button
          onClick={handleDownload}
          disabled={!qrUrl}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          <Download size={18} />
          Download PNG
        </button>
        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 bg-white border border-brand-200 text-brand-700 font-semibold py-3 rounded-xl hover:bg-brand-50 transition-colors"
        >
          <Printer size={18} />
          Print card
        </button>
        <button
          onClick={loadQr}
          className="w-full flex items-center justify-center gap-2 text-gray-500 font-medium py-2 hover:text-gray-700 transition-colors"
        >
          <RefreshCw size={16} />
          Regenerate
        </button>
      </div>
    </div>
  )
}
