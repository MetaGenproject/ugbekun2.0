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
  status: string
  remark: string | null
  markedAt: string | null
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
  students: StudentDailyRecord[]
}

interface TeacherDailyAttendanceProps {
  formAllocations: FormAllocation[]
  selectedFormIdx: number
  onSelectFormIdx: (idx: number) => void
  currentDate: string
  onDateChange: (date: string) => void
}

export default function TeacherDailyAttendance({
  formAllocations,
  selectedFormIdx,
  onSelectFormIdx,
  currentDate,
  onDateChange,
}: TeacherDailyAttendanceProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<DailyAttendanceData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'LATE' | 'UNMARKED'>('ALL')

  const activeForm = formAllocations[selectedFormIdx] || formAllocations[0]

  const fetchDailyReport = async () => {
    if (!activeForm) return
    setLoading(true)
    setError(null)

    try {
      const url = endpoints.teacher.attendanceDailyReport(
        activeForm.classId,
        activeForm.sectionId,
        currentDate
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
  }, [activeForm?.classId, activeForm?.sectionId, currentDate])

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
        if (!matchName && !matchReg && !matchRoll) return false
      }
      return true
    })
  }, [reportData, statusFilter, searchQuery])

  // Export CSV
  const handleExportCSV = () => {
    if (!reportData?.students || reportData.students.length === 0) return
    const headers = ['Roll No', 'Student Name', 'Admission No', 'Gender', 'Status', 'Time Marked', 'Remarks']
    const rows = reportData.students.map((st) => [
      st.roll,
      `"${st.name}"`,
      st.registerNo || 'N/A',
      st.gender || 'N/A',
      st.status,
      st.markedAt ? new Date(st.markedAt).toLocaleTimeString() : 'N/A',
      `"${st.remark || ''}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Daily_Attendance_${activeForm?.className}_${activeForm?.sectionName}_${currentDate}.csv`)
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</p>
            <p className="text-2xl font-black text-slate-900">{summary.total}</p>
          </div>
        </div>

        {/* Total Present (Green Signal) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-emerald-200 p-4 shadow-sm relative overflow-hidden flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">Present</p>
            </div>
            <p className="text-2xl font-black text-emerald-700">{summary.present}</p>
          </div>
        </div>

        {/* Total Absent (Red Signal) */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent rounded-2xl border border-rose-200 p-4 shadow-sm relative overflow-hidden flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
            <XCircle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-[11px] font-black text-rose-800 uppercase tracking-wider">Absent</p>
            </div>
            <p className="text-2xl font-black text-rose-700">{summary.absent}</p>
          </div>
        </div>

        {/* Total Late (Amber Signal) */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-200 p-4 shadow-sm relative overflow-hidden flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
            <Clock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-[11px] font-black text-amber-800 uppercase tracking-wider">Late</p>
            </div>
            <p className="text-2xl font-black text-amber-700">{summary.late}</p>
          </div>
        </div>

        {/* Attendance Rate Gauge */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <span className="text-xs font-black">%</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Presence Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{summary.attendanceRate}%</span>
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
      <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, roll, or admission number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter size={12} />
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
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
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
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
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'LATE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Late ({summary.late})
          </button>
        </div>
      </div>

      {/* STUDENT DAILY BREAKDOWN TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {/* Printable Header */}
        <div className="hidden print:block p-6 border-b border-slate-200 text-center">
          <h2 className="text-xl font-black text-slate-900 uppercase">Daily Attendance Report</h2>
          <p className="text-sm font-semibold text-slate-600 mt-1">
            Class: {activeForm?.className} - {activeForm?.sectionName} | Date: {currentDate} ({reportData?.weekday})
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Total: {summary.total} | Present: {summary.present} | Absent: {summary.absent} | Late: {summary.late} | Rate: {summary.attendanceRate}%
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 pl-5 w-16 text-center">Roll</th>
                <th className="p-3.5">Student Details</th>
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
                  const isExcused = upperStatus === 'EXCUSED'

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
                  <td colSpan={5} className="p-10 text-center text-slate-400">
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
