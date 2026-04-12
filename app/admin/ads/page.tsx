'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, ToggleLeft, ToggleRight, Loader2, ExternalLink } from 'lucide-react'

interface Ad {
  id: string; title: string; imageUrl?: string; linkUrl?: string; isActive: boolean; cpm?: number
  _count: { impressions: number }
}
interface Campaign {
  id: string; name: string; budget?: number; spent: number; cpm?: number; status: string
  sponsor?: { id: string; name: string }
  ads: Ad[]
}
interface Totals { impressions: number; activeAds: number }

const statusBadge: Record<string, string> = {
  draft:  'bg-surface-2 text-ink-3',
  active: 'bg-black text-white dark:bg-white dark:text-black',
  paused: 'bg-surface-2 text-ink-2',
  ended:  'bg-surface-2 text-ink-3',
}

export default function AdsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [totals, setTotals] = useState<Totals>({ impressions: 0, activeAds: 0 })
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newAd, setNewAd] = useState({ title: '', imageUrl: '', linkUrl: '', cpm: '' })

  const load = () => {
    fetch('/api/admin/ads').then(r => r.json()).then(d => {
      setCampaigns(d.campaigns || [])
      setTotals(d.totals || { impressions: 0, activeAds: 0 })
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleAd = async (adId: string, current: boolean) => {
    await fetch('/api/admin/ads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: adId, isActive: !current }),
    })
    load()
  }

  const setStatus = async (campaignId: string, status: string) => {
    await fetch('/api/admin/ads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: campaignId, status }),
    })
    load()
  }

  const createAd = async () => {
    await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ad',
        title: newAd.title,
        imageUrl: newAd.imageUrl || undefined,
        linkUrl: newAd.linkUrl || undefined,
        cpm: newAd.cpm ? parseFloat(newAd.cpm) : undefined,
      }),
    })
    setShowNew(false)
    setNewAd({ title: '', imageUrl: '', linkUrl: '', cpm: '' })
    load()
  }

  const totalImpressions = campaigns.reduce((s, c) => s + c.ads.reduce((ss, a) => ss + a._count.impressions, 0), 0)
  const revenue = campaigns.reduce((s, c) => s + (c.spent || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-wide uppercase">Ad Sales</h1>
          <p className="text-sm text-ink-3 mt-0.5">Campaigns, creatives &amp; performance</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> New ad
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total impressions', value: totalImpressions.toLocaleString() },
          { label: 'Active ads',        value: totals.activeAds },
          { label: 'Campaigns',         value: campaigns.length },
          { label: 'Est. revenue',      value: `$${revenue.toFixed(0)}` },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-ink-3">{s.label}</p>
            <p className="text-2xl font-bold text-ink mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-3" size={28} /></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-ink-3">No campaigns yet</div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(c => (
            <div key={c.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-ink">{c.name}</h3>
                  {c.sponsor && <p className="text-xs text-ink-3">{c.sponsor.name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {c.budget && (
                    <span className="text-xs text-ink-2">
                      ${c.spent.toFixed(0)} / ${c.budget.toFixed(0)}
                    </span>
                  )}
                  <select
                    value={c.status}
                    onChange={e => setStatus(c.id, e.target.value)}
                    className="text-xs border border-edge rounded-lg px-2 py-1 bg-surface text-ink"
                  >
                    {['draft','active','paused','ended'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {c.ads.map(ad => (
                  <div key={ad.id} className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl">
                    {ad.imageUrl && <img src={ad.imageUrl} alt="" className="w-12 h-8 object-cover rounded-lg" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{ad.title}</p>
                      <p className="text-xs text-ink-3 flex items-center gap-1">
                        <Eye size={10} /> {ad._count.impressions.toLocaleString()} impressions
                        {ad.cpm && <> · ${ad.cpm} CPM</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ad.linkUrl && (
                        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-ink">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button onClick={() => toggleAd(ad.id, ad.isActive)} className="text-ink-3 hover:text-ink">
                        {ad.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm space-y-3">
            <h3 className="font-bold text-ink">New ad creative</h3>
            <input className="input" placeholder="Ad title" value={newAd.title} onChange={e => setNewAd(p => ({...p, title: e.target.value}))} autoFocus />
            <input className="input" placeholder="Image URL (optional)" value={newAd.imageUrl} onChange={e => setNewAd(p => ({...p, imageUrl: e.target.value}))} />
            <input className="input" placeholder="Link URL (optional)" value={newAd.linkUrl} onChange={e => setNewAd(p => ({...p, linkUrl: e.target.value}))} />
            <input className="input" placeholder="CPM rate $ (optional)" value={newAd.cpm} onChange={e => setNewAd(p => ({...p, cpm: e.target.value}))} type="number" />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowNew(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={createAd} disabled={!newAd.title} className="btn-primary flex-1 text-sm">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
