'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

interface FormAllocation {
  classId: number
  className: string
  sectionId: number
  sectionName: string
  sessionId?: number
}

interface StudentDailyRecord {
  studentId: number
  roll: number
  name: string
  firstName: string
  lastName: string
  registerNo: string | null
  photo: string | null
  gender?: string | null
  classId?: number
  className?: string
  sectionId?: number
  sectionName?: string
  status: string
  remark: string | null
  markedAt: string | null
}

interface ClassBreakdownItem {
  classId: number
  className: string
  sectionId: number
  sectionName: string
  total: number
  present: number
  absent: number
  late: number
  excused?: number
  sick?: number
  unmarked: number
  attendanceRate: number
  registerStatus: string
  takenByTeacherName: string | null
}

interface DailyAttendanceData {
  success: boolean
  date: string
  weekday: string
  isWeekend: boolean
  isToday: boolean
  register: {
    id: number
    status: string
    version: number
    submittedAt: string | null
    notes: string | null
  } | null
  summary: {
    total: number
    present: number
    absent: number
    late: number
    excused: number
    sick: number
    unmarked: number
    attendanceRate: number
  }
  classBreakdown?: ClassBreakdownItem[]
  students: StudentDailyRecord[]
}

interface TeacherDailyAttendanceProps {
  formAllocations: FormAllocation[]
  selectedFormIdx: number
  onSelectFormIdx: (idx: number) => void
  currentDate: string
  onDateChange: (date: string) => void
  isAdmin?: boolean
}

export default function TeacherDailyAttendance({
  formAllocations,
  selectedFormIdx,
  onSelectFormIdx,
  currentDate,
  onDateChange,
  isAdmin = false,
}: TeacherDailyAttendanceProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<DailyAttendanceData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'LATE' | 'UNMARKED'>('ALL')

  const isAllClasses = isAdmin && selectedFormIdx === -1
  const activeForm = isAllClasses ? null : (formAllocations[selectedFormIdx] || formAllocations[0])

  const fetchDailyReport = async () => {
    if (!isAllClasses && !activeForm) return
    setLoading(true)
    setError(null)

    try {
      const url = isAllClasses
        ? endpoints.teacher.attendanceDailyReport('all', 'all', currentDate)
        : endpoints.teacher.attendanceDailyReport(
            activeForm!.classId,
            activeForm!.sectionId,
            currentDate,
            activeForm?.sessionId
          )
      const res = await apiSlice.get<DailyAttendanceData>(url)
      if (res.success) {
        setReportData(res)
      } else {
        setError('Failed to load daily attendance report.')
      }
    } catch (err: any) {
      console.error('[TEACHER_DAILY_REPORT] fetch error:', err)
      setError(err?.message || 'Could not load daily report.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDailyReport()
  }, [isAllClasses, activeForm?.classId, activeForm?.sectionId, currentDate])

  const handlePrevDay = () => {
    const cur = new Date(currentDate)
    cur.setDate(cur.getDate() - 1)
    onDateChange(cur.toISOString().slice(0, 10))
  }

  const handleNextDay = () => {
    const cur = new Date(currentDate)
    cur.setDate(cur.getDate() + 1)
    onDateChange(cur.toISOString().slice(0, 10))
  }

  const handleToday = () => {
    onDateChange(new Date().toISOString().slice(0, 10))
  }

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!reportData?.students) return []
    return reportData.students.filter((st) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL') {
        const upper = (st.status || '').toUpperCase()
        if (statusFilter === 'PRESENT' && upper !== 'PRESENT') return false
        if (statusFilter === 'ABSENT' && upper !== 'ABSENT') return false
        if (statusFilter === 'LATE' && upper !== 'LATE') return false
        if (statusFilter === 'UNMARKED' && upper !== 'UNMARKED' && upper !== '') return false
      }
      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = st.name.toLowerCase().includes(q)
        const matchReg = st.registerNo?.toLowerCase().includes(q)
        const matchRoll = String(st.roll).includes(q)
        const matchClass = `${st.className || ''} ${st.sectionName || ''}`.toLowerCase().includes(q)
        if (!matchName && !matchReg && !matchRoll && !matchClass) return false
      }
      return true
    })
  }, [reportData, statusFilter, searchQuery])

  // Export CSV
  const handleExportCSV = () => {
    if (!reportData?.students || reportData.students.length === 0) return
    const headers = isAllClasses
      ? ['Roll No', 'Class / Arm', 'Student Name', 'Admission No', 'Gender', 'Status', 'Time Marked', 'Remarks']
      : ['Roll No', 'Student Name', 'Admission No', 'Gender', 'Status', 'Time Marked', 'Remarks']
    const rows = reportData.students.map((st) =>
      isAllClasses
        ? [
            st.roll,
            `"${[st.className, st.sectionName].filter(Boolean).join(' - ')}"`,
            `"${st.name}"`,
            st.registerNo || 'N/A',
            st.gender || 'N/A',
            st.status,
            st.markedAt ? new Date(st.markedAt).toLocaleTimeString() : 'N/A',
            `"${st.remark || ''}"`,
          ]
        : [
            st.roll,
            `"${st.name}"`,
            st.registerNo || 'N/A',
            st.gender || 'N/A',
            st.status,
            st.markedAt ? new Date(st.markedAt).toLocaleTimeString() : 'N/A',
            `"${st.remark || ''}"`,
          ]
    )
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    const scopeName = isAllClasses ? 'All_Classes' : `${activeForm?.className}_${activeForm?.sectionName}`
    link.setAttribute('download', `Daily_Attendance_${scopeName}_${currentDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const summary = reportData?.summary || {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    sick: 0,
    unmarked: 0,
    attendanceRate: 0,
  }

  return (
    <div className="space-y-6">
      {/* FILTER CONTROLS & DATE NAVIGATOR */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Class & Arm Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-indigo-600" />
              Classroom:
            </span>
            {(isAdmin || formAllocations.length > 4) ? (
              <div className="flex flex-wrap items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onSelectFormIdx(-1)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedFormIdx === -1
                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    All Classes ({formAllocations.length})
                  </button>
                )}
                <select
                  aria-label="Select Class and Arm"
                  value={selectedFormIdx}
                  onChange={(e) => onSelectFormIdx(Number(e.target.value))}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {isAdmin && <option value={-1}>All Classes (School-Wide)</option>}
                  {formAllocations.map((form, idx) => (
                    <option key={`${form.classId}-${form.sectionId}`} value={idx}>
                      {form.className} ({form.sectionName})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {formAllocations.map((form, idx) => (
                  <button
                    key={`${form.classId}-${form.sectionId}`}
                    type="button"
                    onClick={() => onSelectFormIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedFormIdx === idx
                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>{form.className}</span>
                    <span className="text-[10px] opacity-80 font-normal">({form.sectionName})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Navigator Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-800">
                <Calendar size={14} className="text-indigo-600" />
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition cursor-pointer"
                title="Next Day"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Today
            </button>

            <button
              type="button"
              onClick={fetchDailyReport}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download size={13} className="text-emerald-600" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer size={13} className="text-indigo-600" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOP TOTAL RECORD METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-sm flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Users size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enrolled</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{summary.total}</p>
          </div>
        </div>

        {/* Total Present (Green Signal) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-emerald-200 p-3 sm:p-4 shadow-sm relative overflow-hidden flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
            <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] sm:text-[11px] font-black text-emerald-800 uppercase tracking-wider">Present</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-700">{summary.present}</p>
          </div>
        </div>

        {/* Total Absent (Red Signal) */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent rounded-2xl border border-rose-200 p-3 sm:p-4 shadow-sm relative overflow-hidden flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
            <XCircle size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-[10px] sm:text-[11px] font-black text-rose-800 uppercase tracking-wider">Absent</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-rose-700">{summary.absent}</p>
          </div>
        </div>

        {/* Total Late (Amber Signal) */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-200 p-3 sm:p-4 shadow-sm relative overflow-hidden flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
            <Clock size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-[10px] sm:text-[11px] font-black text-amber-800 uppercase tracking-wider">Late</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-700">{summary.late}</p>
          </div>
        </div>

        {/* Attendance Rate Gauge */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-sm flex items-center gap-2.5 sm:gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-black text-xs">
            %
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Presence Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{summary.attendanceRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  summary.attendanceRate >= 90
                    ? 'bg-emerald-500'
                    : summary.attendanceRate >= 75
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, summary.attendanceRate))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH AND STATUS FILTERS */}
      <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, roll, or admission..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        {/* Status Filter Badges (Scrollable horizontally on phones) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pb-1 sm:pb-0 sm:flex-wrap">
          <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter size={12} />
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({summary.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PRESENT')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 ${
              statusFilter === 'PRESENT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Present ({summary.present})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ABSENT')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 ${
              statusFilter === 'ABSENT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Absent ({summary.absent})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('LATE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 ${
              statusFilter === 'LATE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Late ({summary.late})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('UNMARKED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 ${
              statusFilter === 'UNMARKED'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Unmarked ({summary.unmarked})
          </button>
        </div>
      </div>

      {/* ALL-CLASSES BREAKDOWN FOR SCHOOL ADMIN */}
      {isAllClasses && reportData?.classBreakdown && reportData.classBreakdown.length > 0 && (
        <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Class-by-Class Attendance Status ({reportData.classBreakdown.length} Class Streams)
              </h4>
              <p className="text-[11px] text-slate-500">
                Click any class card below to filter and inspect that class directly.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {reportData.classBreakdown.map((cb) => {
              const targetIdx = formAllocations.findIndex(
                (f) => f.classId === cb.classId && f.sectionId === cb.sectionId
              )
              const isSubmitted = cb.registerStatus === 'SUBMITTED' || cb.registerStatus === 'LOCKED'
              const isDraft = cb.registerStatus === 'DRAFT'
              return (
                <button
                  key={`${cb.classId}-${cb.sectionId}`}
                  type="button"
                  onClick={() => {
                    if (targetIdx >= 0) onSelectFormIdx(targetIdx)
                  }}
                  className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition cursor-pointer flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-xs text-slate-900 truncate">
                      {cb.className} ({cb.sectionName})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        isSubmitted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDraft
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isSubmitted ? 'Submitted' : isDraft ? 'Draft' : 'Unmarked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>
                      P: <strong className="text-emerald-700">{cb.present}</strong> · A:{' '}
                      <strong className="text-rose-700">{cb.absent}</strong> · L:{' '}
                      <strong className="text-amber-700">{cb.late}</strong>
                    </span>
                    <span className="font-black text-indigo-700">{cb.attendanceRate}%</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* STUDENT DAILY BREAKDOWN TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {/* Printable Header */}
        <div className="hidden print:block p-6 border-b border-slate-200 text-center">
          <h2 className="text-xl font-black text-slate-900 uppercase">Daily Attendance Report</h2>
          <p className="text-sm font-semibold text-slate-600 mt-1">
            Class: {isAllClasses ? 'All Classes (School-Wide)' : `${activeForm?.className} - ${activeForm?.sectionName}`} | Date: {currentDate} ({reportData?.weekday})
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Total: {summary.total} | Present: {summary.present} | Absent: {summary.absent} | Late: {summary.late} | Rate: {summary.attendanceRate}%
          </p>
        </div>

        {/* MOBILE CARDS VIEW FOR SMARTPHONES (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const upperStatus = (student.status || '').toUpperCase()
              const isPresent = upperStatus === 'PRESENT'
              const isAbsent = upperStatus === 'ABSENT'
              const isLate = upperStatus === 'LATE'
              const isExcused = upperStatus === 'EXCUSED' || upperStatus === 'SICK'

              return (
                <div key={student.studentId} className="p-3.5 space-y-2 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                        {student.photo ? (
                          <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          student.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[11px] text-slate-500">#{student.roll}</span>
                          <h4 className="text-sm font-extrabold text-slate-900 leading-tight truncate">{student.name}</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {student.registerNo || 'No ID'}
                          {student.gender ? ` · ${student.gender}` : ''}
                          {isAllClasses && [student.className, student.sectionName].filter(Boolean).length > 0
                            ? ` · ${[student.className, student.sectionName].filter(Boolean).join(' - ')}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    {/* Attendance status badge */}
                    <div className="shrink-0">
                      {isPresent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Present</span>
                        </span>
                      )}
                      {isAbsent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-rose-50 text-rose-700 border border-rose-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span>Absent</span>
                        </span>
                      )}
                      {isLate && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-amber-50 text-amber-700 border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Late</span>
                        </span>
                      )}
                      {isExcused && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-sky-50 text-sky-700 border border-sky-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          <span>Excused</span>
                        </span>
                      )}
                      {!isPresent && !isAbsent && !isLate && !isExcused && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Unmarked</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {(student.markedAt || student.remark) && (
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-50 text-[11px]">
                      {student.markedAt ? (
                        <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                          <Clock size={11} className="text-slate-400" />
                          {new Date(student.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span />
                      )}
                      {student.remark && (
                        <span className="italic text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 max-w-full truncate text-[10.5px]">
                          &quot;{student.remark}&quot;
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-slate-400">
              <UserCheck size={24} className="mx-auto text-slate-300 mb-1.5" />
              <p className="font-bold text-xs text-slate-700">No attendance records found</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {searchQuery ? 'Try modifying your search criteria.' : 'No students match the selected filter.'}
              </p>
            </div>
          )}
        </div>

        {/* DESKTOP TABLE VIEW (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 pl-5 w-16 text-center">Roll</th>
                <th className="p-3.5">Student Details</th>
                {isAllClasses && <th className="p-3.5">Class / Arm</th>}
                <th className="p-3.5 text-center">Attendance Signal</th>
                <th className="p-3.5 text-center">Time Marked</th>
                <th className="p-3.5 pr-5">Remarks & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const upperStatus = (student.status || '').toUpperCase()
                  const isPresent = upperStatus === 'PRESENT'
                  const isAbsent = upperStatus === 'ABSENT'
                  const isLate = upperStatus === 'LATE'
                  const isExcused = upperStatus === 'EXCUSED' || upperStatus === 'SICK'

                  return (
                    <tr key={student.studentId} className="hover:bg-slate-50/60 transition">
                      {/* Roll Number */}
                      <td className="p-3.5 pl-5 text-center font-mono font-bold text-slate-600">
                        #{student.roll}
                      </td>

                      {/* Student Details */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                            {student.photo ? (
                              <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs leading-tight">{student.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {student.registerNo || 'No ID'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {isAllClasses && (
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {[student.className, student.sectionName].filter(Boolean).join(' • ') || '—'}
                          </span>
                        </td>
                      )}

                      {/* Highlighted Signal Box Beside Student */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center justify-center">
                          {isPresent && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs ring-1 ring-emerald-500/20">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Present</span>
                            </span>
                          )}
                          {isAbsent && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-300 shadow-xs ring-1 ring-rose-500/20">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                              <span>Absent</span>
                            </span>
                          )}
                          {isLate && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-300 shadow-xs ring-1 ring-amber-500/20">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              <span>Late</span>
                            </span>
                          )}
                          {isExcused && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-sky-50 text-sky-700 border border-sky-300 shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-sky-500" />
                              <span>Excused</span>
                            </span>
                          )}
                          {!isPresent && !isAbsent && !isLate && !isExcused && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Unmarked</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time Marked */}
                      <td className="p-3.5 text-center font-mono text-[11px] text-slate-500">
                        {student.markedAt ? (
                          <span className="flex items-center justify-center gap-1 text-slate-600 font-semibold">
                            <Clock size={11} className="text-slate-400" />
                            {new Date(student.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="p-3.5 pr-5">
                        {student.remark ? (
                          <span className="text-slate-700 font-medium italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 inline-block max-w-xs truncate">
                            &quot;{student.remark}&quot;
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={isAllClasses ? 6 : 5} className="p-10 text-center text-slate-400">
                    <UserCheck size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-700">No attendance records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchQuery
                        ? 'Try modifying your search criteria.'
                        : 'No students match the selected filter or register not marked yet.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
