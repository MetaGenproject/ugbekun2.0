'use client'

import { useId, useMemo, useRef, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Filter,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { getLagosDateKey } from '@/lib/dateUtils'

export interface StudentAttendanceLog {
  id: number
  attendanceDate: string
  status: string
  remark: string | null
  dateKey?: string
  monthKey?: string
  termId?: number
  termLabel?: string
}

export interface WeeklyAttendanceItem {
  weekStart: string
  weekEnd: string
  daysMarked: number
  present: number
  absent: number
  late: number
  excused: number
  sick: number
  inAttendance: number
  percentage: number
}

export interface MonthlyAttendanceItem {
  monthKey: string
  monthLabel: string
  termId: number
  termLabel: string
  daysMarked: number
  present: number
  absent: number
  late: number
  excused: number
  sick: number
  inAttendance: number
  percentage: number
}

export interface TermlyAttendanceItem {
  termId: number
  termLabel: string
  monthsRange: string
  isCurrentTerm: boolean
  daysMarked: number
  present: number
  absent: number
  late: number
  excused: number
  sick: number
  inAttendance: number
  percentage: number
  evaluation: string
}

export interface StudentAttendanceReportData {
  percentage: number
  totalDays: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount?: number
  sickCount?: number
  inAttendance?: number
  currentTerm?: string
  sessionName?: string | null
  logs: StudentAttendanceLog[]
  reports?: {
    daily?: StudentAttendanceLog[]
    weekly?: WeeklyAttendanceItem[]
    monthly?: MonthlyAttendanceItem[]
    termly?: TermlyAttendanceItem[]
  }
}

type ReportTab = 'daily' | 'weekly' | 'monthly' | 'termly'

const REPORT_TABS: Array<{ id: ReportTab; label: string }> = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'termly', label: 'Termly' },
]

const STATUS_FILTERS = ['ALL', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'SICK'] as const

const TERM_DEFINITIONS = [
  { termId: 1, termLabel: 'First Term', monthsRange: 'Sep – Dec', months: [8, 9, 10, 11] },
  { termId: 2, termLabel: 'Second Term', monthsRange: 'Jan – Apr', months: [0, 1, 2, 3] },
  { termId: 3, termLabel: 'Third Term', monthsRange: 'May – Aug', months: [4, 5, 6, 7] },
] as const

function toDateKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(value) && value.length === 10) return value
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) return getLagosDateKey(parsed)
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : ''
}

function formatUtcDateKey(dateKey: string, options: Intl.DateTimeFormatOptions): string {
  const parts = dateKey.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return dateKey
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    ...options,
  })
}

function weekStartKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d)
  const dow = new Date(utc).getUTCDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  return new Date(utc + mondayOffset * 86400000).toISOString().slice(0, 10)
}

function addDaysKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

function resolveTermForMonthIndex(monthZeroIdx: number) {
  return (
    TERM_DEFINITIONS.find((t) => (t.months as readonly number[]).includes(monthZeroIdx)) ||
    TERM_DEFINITIONS[0]
  )
}

function resolveTermIdFromLabel(raw?: string | null): number {
  const compact = String(raw || '').trim().toLowerCase().replace(/\s+/g, '')
  if (compact.includes('second') || compact.includes('2nd')) return 2
  if (compact.includes('third') || compact.includes('3rd')) return 3
  return 1
}

function summarizeGroup(rows: Array<{ status: string }>) {
  let present = 0
  let absent = 0
  let late = 0
  let excused = 0
  let sick = 0
  for (const row of rows) {
    const s = String(row.status || '').toUpperCase()
    if (s === 'PRESENT') present += 1
    else if (s === 'ABSENT') absent += 1
    else if (s === 'LATE') late += 1
    else if (s === 'EXCUSED') excused += 1
    else if (s === 'SICK') sick += 1
  }
  const daysMarked = present + absent + late + excused + sick
  const inAttendance = present + late
  const percentage = daysMarked > 0 ? Number(((inAttendance / daysMarked) * 100).toFixed(1)) : 0
  return { daysMarked, present, absent, late, excused, sick, inAttendance, percentage }
}

function evaluateRate(daysMarked: number, percentage: number): string {
  if (daysMarked === 0) return 'No Records'
  if (percentage >= 95) return 'Excellent'
  if (percentage >= 85) return 'Good'
  if (percentage >= 75) return 'Average'
  return 'Needs Attention'
}

function statusBadge(statusRaw: string) {
  const status = String(statusRaw || '').toUpperCase()
  if (status === 'PRESENT') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Present
      </span>
    )
  }
  if (status === 'LATE') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Late Arrival
      </span>
    )
  }
  if (status === 'ABSENT') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        Absent
      </span>
    )
  }
  if (status === 'EXCUSED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
        Excused
      </span>
    )
  }
  if (status === 'SICK') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
        Sick
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
      {statusRaw || 'Unmarked'}
    </span>
  )
}

function evaluationBadge(evaluation: string) {
  if (evaluation === 'Excellent') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (evaluation === 'Good') {
    return 'bg-sky-50 text-sky-700 border-sky-200'
  }
  if (evaluation === 'Average') {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }
  if (evaluation === 'Needs Attention') {
    return 'bg-rose-50 text-rose-700 border-rose-200'
  }
  return 'bg-slate-100 text-slate-500 border-slate-200'
}

function rateBarColor(percentage: number): string {
  if (percentage >= 90) return 'bg-emerald-500'
  if (percentage >= 75) return 'bg-amber-500'
  return 'bg-rose-500'
}

interface StudentAttendanceReportProps {
  data: StudentAttendanceReportData | null
  title?: string
  subtitle?: string
  studentName?: string
  loading?: boolean
}

export function StudentAttendanceReport({
  data,
  title = 'Attendance Reports & Roll Call',
  subtitle,
  studentName,
  loading = false,
}: StudentAttendanceReportProps) {
  const baseId = useId()
  const tabRefs = useRef<Record<ReportTab, HTMLButtonElement | null>>({
    daily: null,
    weekly: null,
    monthly: null,
    termly: null,
  })

  const [activeTab, setActiveTab] = useState<ReportTab>('daily')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [monthFilter, setMonthFilter] = useState<string>('ALL')
  const [termFilter, setTermFilter] = useState<string>('ALL')

  const dailyLogs = useMemo(() => {
    const raw = data?.reports?.daily?.length ? data.reports.daily : data?.logs || []
    return raw
      .map((row) => {
        const dateKey = row.dateKey || toDateKey(row.attendanceDate)
        const monthKey = row.monthKey || (dateKey ? dateKey.slice(0, 7) : '')
        const monthIdx = monthKey ? Number(monthKey.slice(5, 7)) - 1 : 8
        const termMeta = resolveTermForMonthIndex(monthIdx)
        return {
          ...row,
          dateKey,
          monthKey,
          termId: row.termId ?? termMeta.termId,
          termLabel: row.termLabel ?? termMeta.termLabel,
        }
      })
      .sort((a, b) => (b.dateKey || '').localeCompare(a.dateKey || ''))
  }, [data])

  const weeklyReport = useMemo<WeeklyAttendanceItem[]>(() => {
    if (data?.reports?.weekly?.length) return data.reports.weekly
    const groups = new Map<string, typeof dailyLogs>()
    for (const row of dailyLogs) {
      if (!row.dateKey) continue
      const start = weekStartKey(row.dateKey)
      const list = groups.get(start) || []
      list.push(row)
      groups.set(start, list)
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([weekStart, rows]) => {
        const s = summarizeGroup(rows)
        return {
          weekStart,
          weekEnd: addDaysKey(weekStart, 4),
          ...s,
        }
      })
  }, [data, dailyLogs])

  const monthlyReport = useMemo<MonthlyAttendanceItem[]>(() => {
    if (data?.reports?.monthly?.length) return data.reports.monthly
    const groups = new Map<string, typeof dailyLogs>()
    for (const row of dailyLogs) {
      if (!row.monthKey) continue
      const list = groups.get(row.monthKey) || []
      list.push(row)
      groups.set(row.monthKey, list)
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([monthKey, rows]) => {
        const monthIdx = Number(monthKey.slice(5, 7)) - 1
        const term = resolveTermForMonthIndex(monthIdx)
        const s = summarizeGroup(rows)
        return {
          monthKey,
          monthLabel: formatUtcDateKey(`${monthKey}-01`, { month: 'long', year: 'numeric' }),
          termId: term.termId,
          termLabel: term.termLabel,
          ...s,
        }
      })
  }, [data, dailyLogs])

  const termlyReport = useMemo<TermlyAttendanceItem[]>(() => {
    if (data?.reports?.termly?.length) return data.reports.termly
    const activeTermId = resolveTermIdFromLabel(data?.currentTerm)
    return TERM_DEFINITIONS.map((term) => {
      const rows = dailyLogs.filter((r) => r.termId === term.termId)
      const s = summarizeGroup(rows)
      return {
        termId: term.termId,
        termLabel: term.termLabel,
        monthsRange: term.monthsRange,
        isCurrentTerm: term.termId === activeTermId,
        ...s,
        evaluation: evaluateRate(s.daysMarked, s.percentage),
      }
    })
  }, [data, dailyLogs])

  const filteredDailyLogs = useMemo(() => {
    return dailyLogs.filter((log) => {
      if (statusFilter !== 'ALL' && String(log.status || '').toUpperCase() !== statusFilter) {
        return false
      }
      if (monthFilter !== 'ALL' && log.monthKey !== monthFilter) {
        return false
      }
      if (termFilter !== 'ALL' && String(log.termId) !== termFilter) {
        return false
      }
      return true
    })
  }, [dailyLogs, statusFilter, monthFilter, termFilter])

  const availableMonths = useMemo(() => {
    if (monthlyReport.length > 0) {
      return monthlyReport.map((m) => ({ key: m.monthKey, label: m.monthLabel }))
    }
    const keys = Array.from(new Set(dailyLogs.map((l) => l.monthKey).filter(Boolean))).sort((a, b) =>
      b.localeCompare(a)
    )
    return keys.map((key) => ({
      key,
      label: formatUtcDateKey(`${key}-01`, { month: 'long', year: 'numeric' }),
    }))
  }, [monthlyReport, dailyLogs])

  const totalDays = data?.totalDays ?? dailyLogs.length
  const presentCount = data?.presentCount ?? 0
  const lateCount = data?.lateCount ?? 0
  const absentCount = data?.absentCount ?? 0
  const excusedCount =
    data?.excusedCount ?? dailyLogs.filter((l) => String(l.status || '').toUpperCase() === 'EXCUSED').length
  const sickCount =
    data?.sickCount ?? dailyLogs.filter((l) => String(l.status || '').toUpperCase() === 'SICK').length
  const overallRate = data?.percentage ?? (totalDays > 0 ? Number((((presentCount + lateCount) / totalDays) * 100).toFixed(1)) : 100)
  const overallEval = evaluateRate(totalDays, overallRate)

  const hasActiveDailyFilters = statusFilter !== 'ALL' || monthFilter !== 'ALL' || termFilter !== 'ALL'

  const selectTab = (nextTab: ReportTab, shouldFocus = false) => {
    setActiveTab(nextTab)
    const btn = tabRefs.current[nextTab]
    if (btn) {
      if (shouldFocus) btn.focus()
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }

  const handleTabKeyDown = (event: React.KeyboardEvent, idx: number) => {
    let nextIdx: number | null = null
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % REPORT_TABS.length
    else if (event.key === 'ArrowLeft') nextIdx = (idx - 1 + REPORT_TABS.length) % REPORT_TABS.length
    else if (event.key === 'Home') nextIdx = 0
    else if (event.key === 'End') nextIdx = REPORT_TABS.length - 1
    if (nextIdx !== null) {
      event.preventDefault()
      selectTab(REPORT_TABS[nextIdx].id, true)
    }
  }

  const handleDrillDownToMonth = (monthKey: string) => {
    setTermFilter('ALL')
    setStatusFilter('ALL')
    setMonthFilter(monthKey)
    selectTab('daily')
  }

  const handleDrillDownToTerm = (termId: number) => {
    setMonthFilter('ALL')
    setStatusFilter('ALL')
    setTermFilter(String(termId))
    selectTab('daily')
  }

  const handleResetFilters = () => {
    setStatusFilter('ALL')
    setMonthFilter('ALL')
    setTermFilter('ALL')
  }

  const handleExportCsv = () => {
    const csvEscape = (v: unknown) => {
      const str = v == null ? '' : String(v)
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
    }

    let headers: string[] = []
    let rows: Array<Array<unknown>> = []

    if (activeTab === 'daily') {
      headers = ['Date', 'Term', 'Status', 'Remarks']
      rows = filteredDailyLogs.map((l) => [
        l.dateKey || l.attendanceDate,
        l.termLabel || '',
        l.status,
        l.remark || '',
      ])
    } else if (activeTab === 'weekly') {
      headers = ['Week Start', 'Week End', 'Days Marked', 'Present', 'Late', 'Absent', 'Excused', 'Sick', 'Rate (%)']
      rows = weeklyReport.map((w) => [
        w.weekStart,
        w.weekEnd,
        w.daysMarked,
        w.present,
        w.late,
        w.absent,
        w.excused,
        w.sick,
        w.percentage,
      ])
    } else if (activeTab === 'monthly') {
      headers = ['Month', 'Term', 'Days Marked', 'Present', 'Late', 'Absent', 'Excused', 'Sick', 'Rate (%)']
      rows = monthlyReport.map((m) => [
        m.monthLabel,
        m.termLabel,
        m.daysMarked,
        m.present,
        m.late,
        m.absent,
        m.excused,
        m.sick,
        m.percentage,
      ])
    } else {
      headers = ['Term', 'Period', 'Days Marked', 'Present', 'Late', 'Absent', 'Excused', 'Sick', 'Rate (%)', 'Standing']
      rows = termlyReport.map((t) => [
        t.termLabel,
        t.monthsRange,
        t.daysMarked,
        t.present,
        t.late,
        t.absent,
        t.excused,
        t.sick,
        t.percentage,
        t.evaluation,
      ])
    }

    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeName = (studentName || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    link.href = url
    link.download = `${safeName}-attendance-${activeTab}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* Header + Context Pills */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
              <span>{title}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {subtitle ||
                'Organized daily roll call, weekly, monthly, and termly attendance reports. Rate counts Present and Late arrivals.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {data?.sessionName && (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                Session: {data.sessionName}
              </span>
            )}
            {data?.currentTerm && (
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200">
                Active: {data.currentTerm}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${evaluationBadge(overallEval)}`}>
              {totalDays > 0 ? `${overallRate}% · ${overallEval}` : 'No Roll Call Recorded'}
            </span>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <Loader2 size={14} className="animate-spin text-emerald-600" />
                Syncing…
              </span>
            )}
          </div>
        </div>

        {/* Period Tabs (Single horizontal scroll row, accessible tablist) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
          <div
            role="tablist"
            aria-label="Attendance report periods"
            className="flex flex-nowrap items-center gap-1 overflow-x-auto pb-1 sm:pb-0"
          >
            {REPORT_TABS.map((tab, idx) => {
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${tab.id}`}
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => selectTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`relative shrink-0 px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                    isSelected
                      ? 'text-emerald-700 bg-emerald-50/70 after:content-[""] after:absolute after:inset-x-1 after:bottom-0 after:border-b-2 after:border-emerald-600'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label} Report
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={totalDays === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
          <div className="text-2xl font-black text-emerald-600">{totalDays > 0 ? `${overallRate}%` : '—'}</div>
          <p className="text-[11px] text-slate-500">{totalDays} school day{totalDays === 1 ? '' : 's'} marked</p>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present</span>
          <div className="text-2xl font-black text-slate-900">{presentCount}</div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck size={12} aria-hidden="true" /> On-time attendance
          </p>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Late</span>
          <div className="text-2xl font-black text-amber-600">{lateCount}</div>
          <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
            <Clock size={12} aria-hidden="true" /> Late arrivals
          </p>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</span>
          <div className="text-2xl font-black text-rose-600">{absentCount}</div>
          <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
            <AlertCircle size={12} aria-hidden="true" /> Missed days
          </p>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Excused / Sick</span>
          <div className="text-2xl font-black text-sky-600">{excusedCount + sickCount}</div>
          <p className="text-[11px] text-slate-500 font-medium">
            {excusedCount} excused · {sickCount} sick
          </p>
        </div>
      </div>

      {/* DAILY TAB PANEL */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-daily`}
        aria-labelledby={`${baseId}-tab-daily`}
        hidden={activeTab !== 'daily'}
        tabIndex={activeTab === 'daily' ? 0 : undefined}
      >
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 id={`${baseId}-daily-heading`} className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Calendar size={15} className="text-emerald-600" aria-hidden="true" />
                Daily Attendance Roll Call ({filteredDailyLogs.length} Record{filteredDailyLogs.length === 1 ? '' : 's'})
              </h3>
              {hasActiveDailyFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer self-start"
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  Reset Filters
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Status filter buttons */}
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter daily records by status">
                <span className="text-[11px] font-bold text-slate-400 mr-1 inline-flex items-center gap-1">
                  <Filter size={12} aria-hidden="true" /> Status:
                </span>
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={statusFilter === status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                      statusFilter === status
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Term & Month selectors */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label htmlFor={`${baseId}-term-select`} className="text-[11px] font-bold text-slate-500">
                    Term
                  </label>
                  <select
                    id={`${baseId}-term-select`}
                    value={termFilter}
                    onChange={(e) => {
                      setTermFilter(e.target.value)
                      setMonthFilter('ALL')
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="ALL">All Terms</option>
                    {TERM_DEFINITIONS.map((t) => (
                      <option key={t.termId} value={String(t.termId)}>
                        {t.termLabel} ({t.monthsRange})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <label htmlFor={`${baseId}-month-select`} className="text-[11px] font-bold text-slate-500">
                    Month
                  </label>
                  <select
                    id={`${baseId}-month-select`}
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="ALL">All Months</option>
                    {availableMonths.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {filteredDailyLogs.length > 0 ? (
            <div tabIndex={0} role="region" aria-labelledby={`${baseId}-daily-heading`} className="overflow-x-auto max-w-full">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <caption className="sr-only">Daily attendance roll call records</caption>
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th scope="col" className="p-4">Date</th>
                    <th scope="col" className="p-4">Term</th>
                    <th scope="col" className="p-4">Status</th>
                    <th scope="col" className="p-4">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <th scope="row" className="p-4 font-bold text-slate-900 whitespace-nowrap">
                        {log.dateKey
                          ? formatUtcDateKey(log.dateKey, {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : log.attendanceDate}
                      </th>
                      <td className="p-4 whitespace-nowrap text-slate-600 font-medium">
                        {log.termLabel}
                      </td>
                      <td className="p-4 whitespace-nowrap">{statusBadge(log.status)}</td>
                      <td className="p-4 text-slate-500">
                        {log.remark || 'Regular class roll call entry'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              {totalDays === 0
                ? 'No submitted daily roll call records yet for this academic session.'
                : 'No attendance records match the selected filters.'}
            </div>
          )}
        </div>
      </div>

      {/* WEEKLY TAB PANEL */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-weekly`}
        aria-labelledby={`${baseId}-tab-weekly`}
        hidden={activeTab !== 'weekly'}
        tabIndex={activeTab === 'weekly' ? 0 : undefined}
      >
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 id={`${baseId}-weekly-heading`} className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Weekly Attendance Summary ({weeklyReport.length} Week{weeklyReport.length === 1 ? '' : 's'})
            </h3>
          </div>

          {weeklyReport.length > 0 ? (
            <div tabIndex={0} role="region" aria-labelledby={`${baseId}-weekly-heading`} className="overflow-x-auto max-w-full">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <caption className="sr-only">Weekly attendance summary</caption>
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th scope="col" className="p-4">School Week</th>
                    <th scope="col" className="p-4">Days Marked</th>
                    <th scope="col" className="p-4">Present</th>
                    <th scope="col" className="p-4">Late</th>
                    <th scope="col" className="p-4">Absent</th>
                    <th scope="col" className="p-4">Excused / Sick</th>
                    <th scope="col" className="p-4">Presence Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyReport.map((week) => (
                    <tr key={week.weekStart} className="hover:bg-slate-50/80 transition">
                      <th scope="row" className="p-4 font-bold text-slate-900 whitespace-nowrap">
                        {formatUtcDateKey(week.weekStart, { day: 'numeric', month: 'short' })}
                        {' – '}
                        {formatUtcDateKey(week.weekEnd, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </th>
                      <td className="p-4 font-medium">{week.daysMarked}</td>
                      <td className="p-4 font-bold text-emerald-700">{week.present}</td>
                      <td className="p-4 font-bold text-amber-700">{week.late}</td>
                      <td className="p-4 font-bold text-rose-700">{week.absent}</td>
                      <td className="p-4 font-medium text-sky-700">{week.excused + week.sick}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rateBarColor(week.percentage)}`}
                              style={{ width: `${Math.min(100, week.percentage)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-900">{week.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              No weekly attendance summaries available yet.
            </div>
          )}
        </div>
      </div>

      {/* MONTHLY TAB PANEL */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-monthly`}
        aria-labelledby={`${baseId}-tab-monthly`}
        hidden={activeTab !== 'monthly'}
        tabIndex={activeTab === 'monthly' ? 0 : undefined}
      >
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 id={`${baseId}-monthly-heading`} className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Monthly Attendance Report ({monthlyReport.length} Month{monthlyReport.length === 1 ? '' : 's'})
            </h3>
          </div>

          {monthlyReport.length > 0 ? (
            <div tabIndex={0} role="region" aria-labelledby={`${baseId}-monthly-heading`} className="overflow-x-auto max-w-full">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <caption className="sr-only">Monthly attendance summary</caption>
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th scope="col" className="p-4">Month</th>
                    <th scope="col" className="p-4">Term</th>
                    <th scope="col" className="p-4">Days Marked</th>
                    <th scope="col" className="p-4">Present</th>
                    <th scope="col" className="p-4">Late</th>
                    <th scope="col" className="p-4">Absent</th>
                    <th scope="col" className="p-4">Excused / Sick</th>
                    <th scope="col" className="p-4">Presence Rate</th>
                    <th scope="col" className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyReport.map((month) => (
                    <tr key={month.monthKey} className="hover:bg-slate-50/80 transition">
                      <th scope="row" className="p-4 font-bold text-slate-900 whitespace-nowrap">
                        {month.monthLabel}
                      </th>
                      <td className="p-4 whitespace-nowrap text-slate-600">{month.termLabel}</td>
                      <td className="p-4 font-medium">{month.daysMarked}</td>
                      <td className="p-4 font-bold text-emerald-700">{month.present}</td>
                      <td className="p-4 font-bold text-amber-700">{month.late}</td>
                      <td className="p-4 font-bold text-rose-700">{month.absent}</td>
                      <td className="p-4 font-medium text-sky-700">{month.excused + month.sick}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rateBarColor(month.percentage)}`}
                              style={{ width: `${Math.min(100, month.percentage)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-900">{month.percentage}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDrillDownToMonth(month.monthKey)}
                          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          View Days
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              No monthly attendance summaries available yet.
            </div>
          )}
        </div>
      </div>

      {/* TERMLY TAB PANEL */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-termly`}
        aria-labelledby={`${baseId}-tab-termly`}
        hidden={activeTab !== 'termly'}
        tabIndex={activeTab === 'termly' ? 0 : undefined}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {termlyReport.map((term) => (
              <div
                key={term.termId}
                className={`bg-white rounded-3xl p-5 border shadow-xs space-y-4 ${
                  term.isCurrentTerm ? 'border-emerald-300 ring-1 ring-emerald-200/70' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">{term.termLabel}</h3>
                      {term.isCurrentTerm && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{term.monthsRange}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${evaluationBadge(term.evaluation)}`}>
                    {term.evaluation}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      {term.daysMarked > 0 ? `${term.percentage}%` : '—'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {term.daysMarked} day{term.daysMarked === 1 ? '' : 's'} recorded
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${term.daysMarked > 0 ? rateBarColor(term.percentage) : 'bg-slate-200'}`}
                      style={{ width: `${Math.min(100, term.percentage)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div>
                    <div className="text-xs font-extrabold text-emerald-700">{term.present}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Present</div>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-amber-700">{term.late}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Late</div>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-rose-700">{term.absent}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Absent</div>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-sky-700">{term.excused + term.sick}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Excused</div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={term.daysMarked === 0}
                  onClick={() => handleDrillDownToTerm(term.termId)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  View {term.termLabel} Daily Logs
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 id={`${baseId}-termly-heading`} className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Academic Session Termly Comparison
              </h3>
            </div>
            <div tabIndex={0} role="region" aria-labelledby={`${baseId}-termly-heading`} className="overflow-x-auto max-w-full">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <caption className="sr-only">Termly attendance comparison table</caption>
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th scope="col" className="p-4">Term</th>
                    <th scope="col" className="p-4">Months</th>
                    <th scope="col" className="p-4">Days Marked</th>
                    <th scope="col" className="p-4">Present</th>
                    <th scope="col" className="p-4">Late</th>
                    <th scope="col" className="p-4">Absent</th>
                    <th scope="col" className="p-4">Excused / Sick</th>
                    <th scope="col" className="p-4">Presence Rate</th>
                    <th scope="col" className="p-4">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {termlyReport.map((term) => (
                    <tr key={term.termId} className="hover:bg-slate-50/80 transition">
                      <th scope="row" className="p-4 font-bold text-slate-900 whitespace-nowrap">
                        {term.termLabel}
                        {term.isCurrentTerm && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            Active
                          </span>
                        )}
                      </th>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{term.monthsRange}</td>
                      <td className="p-4 font-medium">{term.daysMarked}</td>
                      <td className="p-4 font-bold text-emerald-700">{term.present}</td>
                      <td className="p-4 font-bold text-amber-700">{term.late}</td>
                      <td className="p-4 font-bold text-rose-700">{term.absent}</td>
                      <td className="p-4 font-medium text-sky-700">{term.excused + term.sick}</td>
                      <td className="p-4 font-bold text-slate-900">
                        {term.daysMarked > 0 ? `${term.percentage}%` : '—'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${evaluationBadge(term.evaluation)}`}>
                          {term.evaluation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

