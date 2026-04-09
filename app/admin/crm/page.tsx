'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronRight, User, DollarSign, Phone, Mail, Loader2 } from 'lucide-react'

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const
type Stage = typeof STAGES[number]

interface Contact { id: string; name: string; email?: string; phone?: string; role?: string }
interface Deal { id: string; title: string; value?: number; stage: Stage; notes?: string; createdAt: string }
interface Sponsor {
  id: string; name: string; email?: string; logoUrl?: string
  contacts: Contact[]; deals: Deal[]
  _count: { objects: number; ads: number }
}

const stageColor: Record<Stage, string> = {
  lead:        'bg-surface-2 text-ink-3',
  qualified:   'bg-surface-2 text-ink-2',
  proposal:    'bg-surface-2 text-ink-2',
  negotiation: 'bg-surface-2 text-ink',
  won:         'bg-black text-white dark:bg-white dark:text-black',
  lost:        'bg-surface-2 text-ink-3 line-through',
}

export default function CrmPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [pipeline, setPipeline] = useState<{ stage: string; _count: { id: number }; _sum: { value: number | null } }[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Sponsor | null>(null)
  const [showNew, setShowNew]   = useState(false)
  const [newName, setNewName]   = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    fetch('/api/admin/crm').then(r => r.json()).then(d => {
      setSponsors(d.sponsors || [])
      setPipeline(d.pipeline || [])
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const createSponsor = async () => {
    if (!newName.trim()) return
    setSubmitting(true)
    await fetch('/api/admin/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sponsor', name: newName, email: newEmail || undefined }),
    })
    setShowNew(false); setNewName(''); setNewEmail('')
    setSubmitting(false); load()
  }

  const moveDeal = async (dealId: string, stage: Stage) => {
    await fetch('/api/admin/crm', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dealId, stage }),
    })
    load()
  }

  const pipelineValue = pipeline.reduce((s, p) => s + (p._sum.value ?? 0), 0)
  const wonValue = pipeline.find(p => p.stage === 'won')?._sum.value ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">CRM</h1>
          <p className="text-sm text-ink-3 mt-0.5">Sponsor relationships &amp; sales pipeline</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> Add sponsor
        </button>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Sponsors',       value: sponsors.length },
          { label: 'Pipeline value', value: `$${pipelineValue.toLocaleString()}` },
          { label: 'Won',            value: `$${wonValue.toLocaleString()}` },
          { label: 'Open deals',     value: pipeline.filter(p => !['won','lost'].includes(p.stage)).reduce((s,p) => s + p._count.id, 0) },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-ink-3">{s.label}</p>
            <p className="text-2xl font-bold text-ink mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-3" size={28} /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Sponsor list */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mb-3">Sponsors</h2>
            {sponsors.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`w-full card p-4 text-left flex items-center justify-between hover:bg-surface-2 transition-colors ${selected?.id === s.id ? 'ring-1 ring-ink' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {s.logoUrl
                    ? <img src={s.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain" />
                    : <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"><User size={14} className="text-ink-3" /></div>
                  }
                  <div>
                    <p className="font-semibold text-ink text-sm">{s.name}</p>
                    <p className="text-xs text-ink-3">{s._count.objects} objects · {s.deals.length} deals</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-3" />
              </button>
            ))}
          </div>

          {/* Selected sponsor detail */}
          {selected && (
            <div className="card p-5">
              <h2 className="font-bold text-ink text-lg mb-1">{selected.name}</h2>
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="text-xs text-ink-3 flex items-center gap-1 mb-3">
                  <Mail size={12} /> {selected.email}
                </a>
              )}

              {/* Contacts */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-2">Contacts</p>
                {selected.contacts.length === 0
                  ? <p className="text-xs text-ink-3">No contacts yet</p>
                  : selected.contacts.map(c => (
                    <div key={c.id} className="flex items-center gap-2 mb-1.5">
                      <User size={13} className="text-ink-3 shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-ink">{c.name}</span>
                        {c.role && <span className="text-xs text-ink-3 ml-1">· {c.role}</span>}
                        {c.email && <div className="text-xs text-ink-3">{c.email}</div>}
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Deals */}
              <div>
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-2">Deals</p>
                {selected.deals.length === 0
                  ? <p className="text-xs text-ink-3">No deals yet</p>
                  : selected.deals.map(d => (
                    <div key={d.id} className="border-b border-edge py-2 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ink">{d.title}</span>
                        {d.value && (
                          <span className="text-xs font-semibold text-ink flex items-center gap-0.5">
                            <DollarSign size={10} />{d.value.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {STAGES.map(st => (
                          <button
                            key={st}
                            onClick={() => moveDeal(d.id, st)}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${d.stage === st ? stageColor[st] : 'text-ink-3 hover:bg-surface-2'}`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* New sponsor modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm">
            <h3 className="font-bold text-ink mb-4">New sponsor</h3>
            <div className="space-y-3">
              <input className="input" placeholder="Company name" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
              <input className="input" placeholder="Email (optional)" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowNew(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={createSponsor} disabled={submitting || !newName.trim()} className="btn-primary flex-1 text-sm">
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
