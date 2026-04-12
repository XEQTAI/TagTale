'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface LogEntry {
  id: string
  level: string
  message: string
  meta: Record<string, unknown> | null
  createdAt: string
}

const levelIcon = {
  info: <Info size={14} className="text-blue-400" />,
  warn: <AlertTriangle size={14} className="text-yellow-400" />,
  error: <AlertCircle size={14} className="text-red-400" />,
}

const levelBg = {
  info: 'bg-surface',
  warn: 'bg-surface',
  error: 'bg-surface',
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchLogs = async (nextCursor?: string | null, replace = false) => {
    const params = new URLSearchParams({ limit: '50' })
    if (level) params.set('level', level)
    if (nextCursor) params.set('cursor', nextCursor)

    const res = await fetch(`/api/admin/logs?${params}`)
    const data = await res.json()
    setLogs((prev) => (replace ? data.logs : [...prev, ...(data.logs || [])]))
    setHasMore(data.hasMore)
    setCursor(data.nextCursor)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    setLogs([])
    fetchLogs(null, true)
  }, [level])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink tracking-wide uppercase">System Logs</h1>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="input w-auto"
        >
          <option value="">All levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-ink-2" size={32} />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-ink-3">No logs found</div>
      ) : (
        <div className="space-y-2 font-mono text-xs">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`card rounded-xl p-3 ${levelBg[log.level as keyof typeof levelBg] || 'bg-surface'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {levelIcon[log.level as keyof typeof levelIcon]}
                <span className="font-semibold text-ink">{log.message}</span>
                <span className="ml-auto text-ink-3">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </span>
              </div>
              {log.meta && (
                <pre className="text-ink-2 overflow-x-auto text-xs mt-1">
                  {JSON.stringify(log.meta, null, 2)}
                </pre>
              )}
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => fetchLogs(cursor)}
              className="w-full py-3 text-ink-2 hover:text-ink font-medium text-sm"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  )
}
