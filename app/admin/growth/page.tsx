'use client'

import { useState, useEffect } from 'react'
import { Loader2, TrendingUp, Users, QrCode, FileText, Heart } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'

interface GrowthData {
  funnel: { totalUsers: number; scannedUsers: number; postedUsers: number; followingUsers: number }
  period: { days: number; newUsers: number; scans: number; posts: number; retention: number }
  topObjects: { id: string; name: string; sponsor?: string; scans: number; posts: number; followers: number; engagement: number }[]
  locationCount: number
}

function FunnelBar({ label, value, max, Icon }: { label: string; value: number; max: number; Icon: React.ElementType }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-ink flex items-center gap-1.5">
          <Icon size={14} className="text-ink-3" /> {label}
        </span>
        <span className="text-sm font-bold text-ink">{value.toLocaleString()} <span className="text-ink-3 font-normal text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div className="h-full bg-ink rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function GrowthPage() {
  const [data, setData] = useState<GrowthData | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/growth?days=${days}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [days])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-wide uppercase">Growth</h1>
          <p className="text-sm text-ink-3 mt-0.5">Acquisition, retention &amp; engagement</p>
        </div>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="input w-auto"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-3" size={28} /></div>
      ) : data ? (
        <div className="space-y-6">

          {/* Period KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: `New users (${data.period.days}d)`, value: data.period.newUsers,  Icon: Users },
              { label: 'Scans',                            value: data.period.scans,     Icon: QrCode },
              { label: 'Posts',                            value: data.period.posts,     Icon: FileText },
              { label: 'Retention (7d)',                   value: `${data.period.retention}%`, Icon: Heart },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className="text-ink-3" />
                  <p className="text-xs text-ink-3">{label}</p>
                </div>
                <p className="text-2xl font-bold text-ink">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> Activation funnel
            </h2>
            <FunnelBar label="Total users"     value={data.funnel.totalUsers}    max={data.funnel.totalUsers} Icon={Users}    />
            <FunnelBar label="Scanned once"    value={data.funnel.scannedUsers}  max={data.funnel.totalUsers} Icon={QrCode}   />
            <FunnelBar label="Posted"          value={data.funnel.postedUsers}   max={data.funnel.totalUsers} Icon={FileText} />
            <FunnelBar label="Following"       value={data.funnel.followingUsers} max={data.funnel.totalUsers} Icon={Heart}   />
          </div>

          {/* Top objects chart */}
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-4">Top objects by engagement</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topObjects.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--edge)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ink-3)' }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: 'var(--ink-2)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--edge)', borderRadius: 8, color: 'var(--ink)' }}
                  formatter={(v: number, n: string) => [v, n]}
                />
                <Bar dataKey="scans" name="Scans" radius={[0, 3, 3, 0]}>
                  {data.topObjects.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={`hsl(0,0%,${Math.max(15, 70 - i * 7)}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top objects table */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-edge">
                <tr>
                  {['Object', 'Scans', 'Posts', 'Followers', 'Engagement'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-ink-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.topObjects.map(obj => (
                  <tr key={obj.id} className="border-b border-edge last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{obj.name}</p>
                      {obj.sponsor && <p className="text-xs text-ink-3">{obj.sponsor}</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-2">{obj.scans.toLocaleString()}</td>
                    <td className="px-4 py-3 text-ink-2">{obj.posts.toLocaleString()}</td>
                    <td className="px-4 py-3 text-ink-2">{obj.followers.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{obj.engagement}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        <p className="text-ink-3 text-center py-8">Failed to load growth data</p>
      )}
    </div>
  )
}
