'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle,
  Terminal,
  Activity,
  Globe,
  RefreshCw,
  Search,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Clock,
  Filter,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

type LogTab = 'error' | 'client' | 'combined'

interface LogEntry {
  timestamp: string
  level: string
  context: string
  message: string
  route?: string
  error?: {
    name?: string
    message?: string
    stack?: string
  }
  stack?: string
  meta?: any
  user?: {
    id?: string | number
    role?: string
  }
  userAgent?: string
  raw?: string
}

interface LogResponse {
  success: boolean
  totalLines: number
  lines: LogEntry[]
  logFile: string
}

export function SystemLogsConsole() {
  const [activeTab, setActiveTab] = useState<LogTab>('error')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [logFile, setLogFile] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  const [linesLimit, setLinesLimit] = useState<number>(100)
  const [autoRefresh, setAutoRefresh] = useState<number>(0) // 0 = off, 5 = 5s, 10 = 10s
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [clearing, setClearing] = useState<boolean>(false)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiSlice.get<LogResponse>(
        endpoints.superadmin.systemLogs({
          type: activeTab,
          lines: linesLimit,
          search: search.trim() || undefined,
        })
      )
      if (res.success) {
        setLogs(res.lines || [])
        setTotalCount(res.totalLines || 0)
        setLogFile(res.logFile || '')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch logs from server.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, linesLimit, search])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefresh <= 0) return
    const interval = setInterval(() => {
      fetchLogs()
    }, autoRefresh * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchLogs])

  const handleClear = async () => {
    if (!confirm(`Are you sure you want to clear the ${activeTab}.log file on the server?`)) return
    try {
      setClearing(true)
      await apiSlice.delete(endpoints.superadmin.systemLogs({ type: activeTab }))
      fetchLogs()
    } catch (err: any) {
      alert(err?.message || 'Failed to clear log file.')
    } finally {
      setClearing(false)
    }
  }

  const handleCopy = (entry: LogEntry, index: number) => {
    const text = JSON.stringify(entry, null, 2)
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const getBadgeColor = (level: string) => {
    const upper = String(level || '').toUpperCase()
    if (upper.includes('ERROR') || upper.includes('FATAL')) {
      return 'bg-rose-100 text-rose-700 border-rose-200'
    }
    if (upper.includes('WARN')) {
      return 'bg-amber-100 text-amber-800 border-amber-200'
    }
    if (upper.includes('CLIENT')) {
      return 'bg-purple-100 text-purple-700 border-purple-200'
    }
    return 'bg-sky-100 text-sky-700 border-sky-200'
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-bold mb-2">
              <Terminal size={14} /> Server & Client Telemetry
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">System Logs & Live Error Console</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Inspect live backend error traces, unhandled exceptions, browser client errors, and HTTP network activity without checking the server locally.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <select
              value={autoRefresh}
              onChange={(e) => setAutoRefresh(Number(e.target.value))}
              className="px-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs font-bold focus:outline-hidden cursor-pointer"
            >
              <option value={0}>Auto: Off</option>
              <option value={5}>Auto: 5s</option>
              <option value={10}>Auto: 10s</option>
              <option value={30}>Auto: 30s</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => { setActiveTab('error'); setExpandedIndex(null) }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'error'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle size={15} />
          <span>Backend Errors (`error.log`)</span>
        </button>

        <button
          onClick={() => { setActiveTab('client'); setExpandedIndex(null) }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'client'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe size={15} />
          <span>Frontend Browser Errors (`client-errors.log`)</span>
        </button>

        <button
          onClick={() => { setActiveTab('combined'); setExpandedIndex(null) }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'combined'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity size={15} />
          <span>Server Access & Requests (`combined.log`)</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by keyword, endpoint, or error message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter size={13} />
            <select
              value={linesLimit}
              onChange={(e) => setLinesLimit(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value={50}>Last 50 entries</option>
              <option value={100}>Last 100 entries</option>
              <option value={250}>Last 250 entries</option>
              <option value={500}>Last 500 entries</option>
            </select>
          </div>

          <button
            onClick={handleClear}
            disabled={clearing || logs.length === 0}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Trash2 size={13} />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active file: <strong className="font-mono text-slate-800">{logFile || `${activeTab}.log`}</strong></span>
        </div>
        <div>
          Showing <strong>{logs.length}</strong> of <strong>{totalCount}</strong> recorded events
        </div>
      </div>

      {/* Error alert if fetch failed */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2 font-medium">
          <ShieldAlert size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <Check size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No {activeTab} logs found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search
              ? `No entries match "${search}". Try searching with another query or clear the filter.`
              : activeTab === 'error'
              ? 'Great news! There are currently no unhandled server crashes or error events recorded.'
              : 'Log file is currently empty or has been rotated.'}
          </p>
        </div>
      )}

      {/* Logs Feed */}
      <div className="space-y-2.5">
        {logs.map((entry, idx) => {
          const isExpanded = expandedIndex === idx
          const isError = String(entry.level).toUpperCase().includes('ERROR')
          const isClient = String(entry.level).toUpperCase().includes('CLIENT')

          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden shadow-2xs ${
                isError
                  ? 'border-rose-200/90 hover:border-rose-300'
                  : isClient
                  ? 'border-purple-200/90 hover:border-purple-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Row header */}
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="p-3.5 sm:p-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${getBadgeColor(
                        entry.level
                      )}`}
                    >
                      {entry.level || 'LOG'}
                    </span>

                    {entry.context && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {entry.context}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-slate-800 break-words line-clamp-2 sm:line-clamp-1">
                    {entry.message || entry.raw || 'No message provided'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-slate-400">
                  {entry.timestamp && (
                    <span className="text-[11px] font-mono text-slate-400 hidden md:inline-flex items-center gap-1">
                      <Clock size={11} /> {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(entry, idx)
                    }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer"
                    title="Copy JSON entry"
                  >
                    {copiedIndex === idx ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>

                  <span className="text-slate-400">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-950 text-slate-200 p-4 font-mono text-[11px] space-y-3 overflow-x-auto">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 border-b border-slate-800 pb-2">
                    <div>
                      <span>Timestamp: </span>
                      <strong className="text-slate-200">{entry.timestamp || 'N/A'}</strong>
                    </div>
                    {entry.route && (
                      <div>
                        <span>Route: </span>
                        <strong className="text-cyan-300">{entry.route}</strong>
                      </div>
                    )}
                    {entry.user && (
                      <div>
                        <span>User: </span>
                        <strong className="text-purple-300">
                          ID {entry.user.id || 'N/A'} ({entry.user.role || 'Guest'})
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Stack trace if present */}
                  {(entry.error?.stack || entry.stack) && (
                    <div>
                      <div className="text-rose-400 font-bold mb-1">Stack Trace:</div>
                      <pre className="text-rose-200/90 whitespace-pre-wrap leading-relaxed text-[10px] bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
                        {entry.error?.stack || entry.stack}
                      </pre>
                    </div>
                  )}

                  {/* Component Stack if present */}
                  {entry.componentStack && (
                    <div>
                      <div className="text-purple-400 font-bold mb-1">Component Tree:</div>
                      <pre className="text-purple-200/90 whitespace-pre-wrap leading-relaxed text-[10px] bg-purple-950/40 p-3 rounded-xl border border-purple-900/50">
                        {entry.componentStack}
                      </pre>
                    </div>
                  )}

                  {/* Full JSON metadata */}
                  <div>
                    <div className="text-slate-400 font-bold mb-1">Raw Payload:</div>
                    <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed text-[10px] bg-slate-900 p-3 rounded-xl border border-slate-800">
                      {JSON.stringify(entry, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SystemLogsConsole
