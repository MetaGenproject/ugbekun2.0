'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Printer,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  Percent,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

interface FormAllocation {
  classId: number
  className: string
  sectionId: number
  sectionName: string
}

interface DayItem {
  day: number
  dateKey: string
  isWeekend: boolean
  isSchoolDayHeld: boolean
  totals: {
    present: number
    absent: number
    late: number
    holiday: number
  }
}

interface StudentMonthlyRecord {
  studentId: number
  roll: number
  name: string
  firstName: string
  lastName: string
  registerNo: string | null
  photo: string | null
  days: Record<string, string> // "1" -> "P" | "A" | "L" | "H" | "—"
  presentCount: number
  absentCount: number
  lateCount: number
  percentage: number
}

interface MonthlyAttendanceData {
  success: boolean
  month: string
  monthLabel: string
  totalEnrolled: number
  schoolDaysCount: number
  days: DayItem[]
  summary: {
    totalPresent: number
    totalAbsent: number
    totalLate: number
    totalHoliday: number
    averageAttendanceRate: number
  }
  students: StudentMonthlyRecord[]
}

interface TeacherMonthlyAttendanceProps {
  formAllocations: FormAllocation[]
  selectedFormIdx: number
  onSelectFormIdx: (idx: number) => void
  currentMonth?: string // YYYY-MM
  onMonthChange?: (month: string) => void
}

export default function TeacherMonthlyAttendance({
  formAllocations,
  selectedFormIdx,
  onSelectFormIdx,
  currentMonth: propCurrentMonth,
  onMonthChange,
}: TeacherMonthlyAttendanceProps) {
  // Default to current year-month
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState<string>(propCurrentMonth || defaultMonth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<MonthlyAttendanceData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const activeForm = formAllocations[selectedFormIdx] || formAllocations[0]

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
    if (onMonthChange) onMonthChange(newMonth)
  }

  const navigateMonth = (delta: number) => {
    const [yearStr, monthStr] = selectedMonth.split('-')
    const y = parseInt(yearStr, 10)
    const m = parseInt(monthStr, 10) - 1
    const d = new Date(y, m + delta, 1)
    const nextMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    handleMonthChange(nextMonth)
  }

  const fetchMonthlyReport = async () => {
    if (!activeForm) return
    setLoading(true)
    setError(null)

    try {
      const url = endpoints.teacher.attendanceMonthlyReport(
        activeForm.classId,
        activeForm.sectionId,
        selectedMonth
      )
      const res = await apiSlice.get<MonthlyAttendanceData>(url)
      if (res.success) {
        setReportData(res)
      } else {
        setError('Failed to load monthly attendance report.')
      }
    } catch (err: any) {
      console.error('[TEACHER_MONTHLY_REPORT] fetch error:', err)
      setError(err?.message || 'Could not load monthly report.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonthlyReport()
  }, [activeForm?.classId, activeForm?.sectionId, selectedMonth])

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!reportData?.students) return []
    if (!searchQuery.trim()) return reportData.students

    const q = searchQuery.toLowerCase().trim()
    return reportData.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.registerNo && s.registerNo.toLowerCase().includes(q)) ||
        String(s.roll).includes(q)
    )
  }, [reportData?.students, searchQuery])

  // Day of week short label for each day item
  const getWeekdayShort = (dateKey: string) => {
    try {
      const parts = dateKey.split('-').map(Number)
      const dt = new Date(parts[0], parts[1] - 1, parts[2])
      return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dt.getDay()]
    } catch {
      return ''
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!reportData || !reportData.students.length) return

    const days = reportData.days || []
    const headerCols = [
      'Roll',
      'Register No',
      'Student Name',
      ...days.map((d) => `Day ${d.day} (${d.dateKey})`),
      'Total Present',
      'Total Absent',
      'Total Late',
      'Attendance Rate (%)',
    ]

    const rows = filteredStudents.map((s) => {
      const dayValues = days.map((d) => s.days[String(d.day)] || '—')
      return [
        s.roll,
        s.registerNo || 'N/A',
        `"${s.name.replace(/"/g, '""')}"`,
        ...dayValues,
        s.presentCount,
        s.absentCount,
        s.lateCount,
        `${s.percentage}%`,
      ]
    })

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headerCols.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Monthly_Attendance_${activeForm?.className || 'Class'}_${activeForm?.sectionName || 'Arm'}_${selectedMonth}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const summary = reportData?.summary || {
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    totalHoliday: 0,
    averageAttendanceRate: 0,
  }

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Class / Arm Selection */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-700 dark:text-blue-300 px-3.5 py-1.5 rounded-xl border border-blue-200/50 dark:border-blue-700/30 font-semibold text-sm">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Assigned Form Class:</span>
            </div>

            {formAllocations.length > 1 ? (
              <select
                aria-label="Select Assigned Form Class"
                value={selectedFormIdx}
                onChange={(e) => onSelectFormIdx(Number(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                {formAllocations.map((f, i) => (
                  <option key={`${f.classId}-${f.sectionId}`} value={i}>
                    {f.className} • {f.sectionName}
                  </option>
                ))}
              </select>
            ) : activeForm ? (
              <span className="font-bold text-slate-800 dark:text-slate-100 text-base bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                {activeForm.className} — {activeForm.sectionName}
              </span>
            ) : (
              <span className="text-sm text-slate-500">No form class assigned</span>
            )}
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1 font-bold text-sm text-slate-800 dark:text-slate-100">
                <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <input
                  type="month"
                  aria-label="Select Attendance Month"
                  value={selectedMonth}
                  onChange={(e) => e.target.value && handleMonthChange(e.target.value)}
                  className="bg-transparent border-none text-slate-900 dark:text-white text-sm font-semibold focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => handleMonthChange(defaultMonth)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              This Month
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!reportData?.students?.length}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportData?.students?.length}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
              title="Print Monthly Attendance Sheet"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={fetchMonthlyReport}
              disabled={loading}
              className="p-2.5 text-sm font-semibold rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              title="Refresh Report"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, roll number, or register number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Top Total Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Present */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 border border-emerald-200/60 dark:border-emerald-700/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Total Present
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
            {summary.totalPresent}
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-1">
            Student-day attendances
          </p>
        </div>

        {/* Total Absent */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/20 border border-rose-200/60 dark:border-rose-700/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Total Absent
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 dark:bg-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
            {summary.totalAbsent}
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium mt-1">
            Recorded absences
          </p>
        </div>

        {/* Total Late */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Total Late
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 dark:bg-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-700 dark:text-amber-300 tracking-tight">
            {summary.totalLate}
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-1">
            Tardiness records
          </p>
        </div>

        {/* Total Holiday / Weekend */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-500/20 border border-purple-200/60 dark:border-purple-700/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
              Holidays/Weekends
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 dark:bg-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
            {summary.totalHoliday}
          </div>
          <p className="text-[11px] text-purple-600/80 dark:text-purple-400/80 font-medium mt-1">
            Non-school days in month
          </p>
        </div>

        {/* Monthly Attendance Rate */}
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-500/20 border border-blue-200/60 dark:border-blue-700/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Avg Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
            {summary.averageAttendanceRate}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.averageAttendanceRate >= 90
                  ? 'bg-emerald-500'
                  : summary.averageAttendanceRate >= 75
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(summary.averageAttendanceRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Monthly Calendar Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header Details */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Monthly Attendance Sheet — {reportData?.monthLabel || selectedMonth}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} •{' '}
              {reportData?.schoolDaysCount || 0} active school days held
            </p>
          </div>

          {/* Status Color Legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Legend:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> P = Present
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> A = Absent
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> L = Late
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/20">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> H = Weekend/Holiday
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-400 font-bold border border-slate-500/20">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> — = No Session
            </span>
          </div>
        </div>

        {/* Scrollable Grid Container */}
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              {/* Row 1: Day Numbers (1..31) */}
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 select-none">
                <th className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-center font-bold w-12 border-r border-slate-200 dark:border-slate-700">
                  #
                </th>
                <th className="sticky left-12 z-20 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 font-bold min-w-[200px] border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                  Student Name
                </th>

                {/* Days 1..31 */}
                {reportData?.days.map((dayItem) => {
                  const weekdayShort = getWeekdayShort(dayItem.dateKey)
                  return (
                    <th
                      key={`th-day-${dayItem.day}`}
                      className={`text-center font-bold py-2 px-1 border-r border-slate-200/80 dark:border-slate-700/80 min-w-[38px] ${
                        dayItem.isWeekend
                          ? 'bg-purple-100/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300'
                          : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="text-[11px] font-black">{dayItem.day}</div>
                      <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase">
                        {weekdayShort}
                      </div>
                    </th>
                  )
                })}

                {/* Summary column headers */}
                <th className="px-2 py-2 text-center font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 min-w-[40px] border-r border-slate-200 dark:border-slate-700">
                  P
                </th>
                <th className="px-2 py-2 text-center font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 min-w-[40px] border-r border-slate-200 dark:border-slate-700">
                  A
                </th>
                <th className="px-2 py-2 text-center font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 min-w-[40px] border-r border-slate-200 dark:border-slate-700">
                  L
                </th>
                <th className="px-3 py-2 text-center font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 min-w-[55px]">
                  Rate
                </th>
              </tr>

              {/* Row 2: Total number of present, absent, late and holiday at the top of each day column */}
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-300 dark:border-slate-700 text-[10px] select-none">
                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/80 px-2 py-1.5 text-center text-slate-500 font-bold border-r border-slate-200 dark:border-slate-700">
                  TOT
                </th>
                <th className="sticky left-12 z-20 bg-slate-50 dark:bg-slate-800/80 px-4 py-1.5 font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                  Daily Class Summary
                </th>

                {/* Day column totals */}
                {reportData?.days.map((dayItem) => {
                  const t = dayItem.totals
                  const hasActivity = t.present > 0 || t.absent > 0 || t.late > 0

                  return (
                    <th
                      key={`th-total-${dayItem.day}`}
                      className={`text-center py-1.5 px-0.5 border-r border-slate-200 dark:border-slate-700 ${
                        dayItem.isWeekend
                          ? 'bg-purple-50/50 dark:bg-purple-950/20'
                          : ''
                      }`}
                    >
                      {dayItem.isWeekend ? (
                        <span className="inline-block text-[9px] font-bold text-purple-600 dark:text-purple-400">
                          HOL
                        </span>
                      ) : hasActivity ? (
                        <div className="flex flex-col gap-0.5 items-center font-bold text-[9px]">
                          <span className="text-emerald-600 dark:text-emerald-400" title={`Present: ${t.present}`}>
                            P:{t.present}
                          </span>
                          <span className="text-rose-600 dark:text-rose-400" title={`Absent: ${t.absent}`}>
                            A:{t.absent}
                          </span>
                          {t.late > 0 && (
                            <span className="text-amber-600 dark:text-amber-400" title={`Late: ${t.late}`}>
                              L:{t.late}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-[9px]">—</span>
                      )}
                    </th>
                  )
                })}

                {/* Total Summary Row End Headers */}
                <th className="px-2 py-1 text-center font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-700">
                  {summary.totalPresent}
                </th>
                <th className="px-2 py-1 text-center font-bold text-rose-700 dark:text-rose-400 border-r border-slate-200 dark:border-slate-700">
                  {summary.totalAbsent}
                </th>
                <th className="px-2 py-1 text-center font-bold text-amber-700 dark:text-amber-400 border-r border-slate-200 dark:border-slate-700">
                  {summary.totalLate}
                </th>
                <th className="px-2 py-1 text-center font-black text-blue-700 dark:text-blue-400">
                  {summary.averageAttendanceRate}%
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={37}
                    className="py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Loading monthly attendance register...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={37}
                    className="py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No student records found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try clearing your search query.'
                        : 'No students enrolled or assigned in this class section.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Roll */}
                      <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90 px-2 py-2 text-center font-bold text-slate-500 border-r border-slate-200 dark:border-slate-800">
                        {student.roll}
                      </td>

                      {/* Name & Reg */}
                      <td className="sticky left-12 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90 px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                            {student.firstName?.[0] || 'S'}
                          </div>
                          <div className="truncate">
                            <div className="truncate font-semibold text-xs leading-tight">
                              {student.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {student.registerNo || `ID: ${student.studentId}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Day Boxes (1..31) */}
                      {reportData?.days.map((dayItem) => {
                        const status = student.days[String(dayItem.day)] || '—'

                        return (
                          <td
                            key={`td-${student.studentId}-${dayItem.day}`}
                            className={`p-1 text-center border-r border-slate-100 dark:border-slate-800/80 ${
                              dayItem.isWeekend ? 'bg-purple-50/20 dark:bg-purple-950/10' : ''
                            }`}
                          >
                            {status === 'P' ? (
                              <div
                                className="w-6 h-6 mx-auto rounded-md bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs shadow-emerald-500/30 ring-1 ring-emerald-600/20 transition-transform group-hover:scale-105"
                                title={`Day ${dayItem.day} (${dayItem.dateKey}): Present`}
                              >
                                P
                              </div>
                            ) : status === 'A' ? (
                              <div
                                className="w-6 h-6 mx-auto rounded-md bg-rose-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs shadow-rose-500/30 ring-1 ring-rose-600/20 transition-transform group-hover:scale-105"
                                title={`Day ${dayItem.day} (${dayItem.dateKey}): Absent`}
                              >
                                A
                              </div>
                            ) : status === 'L' ? (
                              <div
                                className="w-6 h-6 mx-auto rounded-md bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs shadow-amber-500/30 ring-1 ring-amber-600/20 transition-transform group-hover:scale-105"
                                title={`Day ${dayItem.day} (${dayItem.dateKey}): Late`}
                              >
                                L
                              </div>
                            ) : status === 'H' ? (
                              <div
                                className="w-6 h-6 mx-auto rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center border border-purple-200 dark:border-purple-800/50"
                                title={`Day ${dayItem.day} (${dayItem.dateKey}): Weekend / Holiday`}
                              >
                                H
                              </div>
                            ) : (
                              <div
                                className="w-6 h-6 mx-auto rounded-md bg-slate-100/70 dark:bg-slate-800/50 text-slate-400 font-bold text-[10px] flex items-center justify-center"
                                title={`Day ${dayItem.day}: No record`}
                              >
                                —
                              </div>
                            )}
                          </td>
                        )
                      })}

                      {/* Row End Totals */}
                      <td className="px-2 py-2 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 border-r border-slate-100 dark:border-slate-800">
                        {student.presentCount}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10 border-r border-slate-100 dark:border-slate-800">
                        {student.absentCount}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/10 border-r border-slate-100 dark:border-slate-800">
                        {student.lateCount}
                      </td>
                      <td className="px-2 py-2 text-center font-bold">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black ${
                            student.percentage >= 90
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : student.percentage >= 75
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {student.percentage}%
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
