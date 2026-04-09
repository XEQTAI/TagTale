'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, MapPin, Package, Trash2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface EventObject {
  objectId: string; addedAt: string
  object: { id: string; name: string; imageUrl?: string | null }
}
interface Event {
  id: string; name: string; description?: string; location?: string
  startDate: string; endDate?: string; imageUrl?: string
  objects: EventObject[]
  _count: { objects: number }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Event | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', location: '', startDate: '', endDate: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    fetch('/api/admin/events').then(r => r.json()).then(d => {
      setEvents(d.events || [])
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const create = async () => {
    if (!form.name || !form.startDate) return
    setSubmitting(true)
    await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowNew(false)
    setForm({ name: '', description: '', location: '', startDate: '', endDate: '' })
    setSubmitting(false)
    load()
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await fetch(`/api/admin/events?eventId=${id}`, { method: 'DELETE' })
    setSelected(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Events &amp; Projects</h1>
          <p className="text-sm text-ink-3 mt-0.5">Group objects by event, campaign, or journey</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> New event
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-3" size={28} /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={40} className="mx-auto text-ink-3 mb-3 opacity-40" />
          <p className="text-ink-3 text-sm">No events yet</p>
          <p className="text-xs text-ink-3 mt-1">Create events to group objects — a concert tour, a product launch, a hat&apos;s journey.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {events.map(ev => (
              <button
                key={ev.id}
                onClick={() => setSelected(ev)}
                className={`w-full card p-4 text-left hover:bg-surface-2 transition-colors ${selected?.id === ev.id ? 'ring-1 ring-ink' : ''}`}
              >
                {ev.imageUrl && (
                  <img src={ev.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-3" />
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink">{ev.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-ink-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {format(new Date(ev.startDate), 'MMM d, yyyy')}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-ink-3 flex items-center gap-1">
                    <Package size={10} /> {ev._count.objects}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-bold text-ink text-lg">{selected.name}</h2>
                <button onClick={() => deleteEvent(selected.id)} className="text-ink-3 hover:text-ink transition-colors p-1">
                  <Trash2 size={16} />
                </button>
              </div>
              {selected.description && <p className="text-sm text-ink-2 mb-3">{selected.description}</p>}
              <div className="flex gap-4 text-xs text-ink-3 mb-4">
                <span>{format(new Date(selected.startDate), 'MMM d, yyyy')}</span>
                {selected.location && <span className="flex items-center gap-1"><MapPin size={10} />{selected.location}</span>}
              </div>

              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-2">
                Objects ({selected._count.objects})
              </p>
              {selected.objects.length === 0 ? (
                <p className="text-xs text-ink-3">No objects linked yet</p>
              ) : (
                <div className="space-y-2">
                  {selected.objects.map(eo => (
                    <div key={eo.objectId} className="flex items-center gap-3 p-2 bg-surface-2 rounded-xl">
                      {eo.object.imageUrl
                        ? <img src={eo.object.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        : <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center"><Package size={13} className="text-ink-3" /></div>
                      }
                      <span className="text-sm text-ink font-medium">{eo.object.name}</span>
                      <span className="ml-auto text-xs text-ink-3">{format(new Date(eo.addedAt), 'MMM d')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm space-y-3">
            <h3 className="font-bold text-ink">New event</h3>
            <input className="input" placeholder="Event name *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} autoFocus />
            <input className="input" placeholder="Description" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
            <input className="input" placeholder="Location" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} />
            <div className="grid grid-cols-2 gap-2">
              <input className="input" type="date" value={form.startDate} onChange={e => setForm(p => ({...p, startDate: e.target.value}))} />
              <input className="input" type="date" placeholder="End date" value={form.endDate} onChange={e => setForm(p => ({...p, endDate: e.target.value}))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowNew(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={create} disabled={submitting || !form.name || !form.startDate} className="btn-primary flex-1 text-sm">
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
