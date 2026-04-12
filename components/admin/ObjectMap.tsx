'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ScanLocation {
  id: string
  latitude: number
  longitude: number
  scannedAt: string
  object: { id: string; name: string }
}

export default function ObjectMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [locations, setLocations] = useState<ScanLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/admin/map')
      .then((r) => r.json())
      .then((d) => setLocations(d.locations || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading || !mapRef.current || mapLoaded || locations.length === 0) return

    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      if (!mapRef.current) return

      const map = L.default.map(mapRef.current).setView([20, 0], 2)
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      const icon = L.default.divIcon({
        className: '',
        html: '<div style="width:10px;height:10px;background:#f2f5fa;border-radius:50%;border:2px solid #0f1217;box-shadow:0 1px 6px rgba(0,0,0,0.45)"></div>',
      })

      locations.forEach((loc) => {
        L.default.marker([loc.latitude, loc.longitude], { icon })
          .addTo(map)
          .bindPopup(`<strong>${loc.object.name}</strong><br>${new Date(loc.scannedAt).toLocaleDateString()}`)
      })

      setMapLoaded(true)
    })
  }, [loading, locations, mapLoaded])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-3">
          {loading ? 'Loading...' : `${locations.length} scan locations`}
        </p>
      </div>

      {loading ? (
        <div className="card h-96 flex items-center justify-center">
          <Loader2 className="animate-spin text-ink-2" size={32} />
        </div>
      ) : locations.length === 0 ? (
        <div className="card h-96 flex items-center justify-center text-ink-3">
          No scan data with GPS coordinates yet
        </div>
      ) : (
        <div className="card overflow-hidden">
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossOrigin=""
          />
          <div ref={mapRef} style={{ height: 480 }} />
        </div>
      )}
    </div>
  )
}
