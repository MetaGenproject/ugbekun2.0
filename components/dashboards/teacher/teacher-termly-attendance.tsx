'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Award,
  TrendingUp,
  Percent,
  Calendar,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

interface FormAllocation {
  classId: number
  className: string
  sectionId: number
  sectionName: string
}

interface StudentTermlyRecord {
  studentId: number
  roll: number
  name: string
  firstName: string
  lastName: string
  registerNo: string | null
  photo: string | null
  classId?: number | null
  className?: string
  sectionId?: number | null
  sectionName?: string
  presentDays: number
  absentDays: number
  lateDays: number
  totalDays: number
  percentage: number
  evaluation: 'Excellent' | 'Good' | 'Average' | 'Critical' | string
}

interface TermlyAttendanceData {
  success: boolean
  termId: number
  termLabel: string
  totalEnrolled: number
  totalSchoolDays: number
  summary: {
    averageClassRate: number
    totalPresent: number
    totalAbsent: number
    totalLate: number
    chronicAbsenteeCount: number
  }
  students: StudentTermlyRecord[]
}

interface TeacherTermlyAttendanceProps {
  formAllocations: FormAllocation[]
  selectedFormIdx: number
  onSelectFormIdx: (idx: number) => void
  currentTermId?: number
  onTermChange?: (termId: number) => void
  isAdmin?: boolean
}

export default function TeacherTermlyAttendance({
  formAllocations,
  selectedFormIdx,
  onSelectFormIdx,
  currentTermId = 1,
  onTermChange,
  isAdmin = false,
}: TeacherTermlyAttendanceProps) {
  const [selectedTerm, setSelectedTerm] = useState<number>(currentTermId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<TermlyAttendanceData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [evalFilter, setEvalFilter] = useState<'ALL' | 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'CRITICAL'>('ALL')

  const isAllClasses = isAdmin && selectedFormIdx === -1
  const activeForm = isAllClasses ? null : formAllocations[selectedFormIdx] || formAllocations[0]

  const handleTermChange = (t: number) => {
    setSelectedTerm(t)
    if (onTermChange) onTermChange(t)
  }

  const fetchTermlyReport = async () => {
    if (!isAllClasses && !activeForm) return
    setLoading(true)
    setError(null)

    try {
      const url = endpoints.teacher.attendanceTermlyReport(
        isAllClasses ? 'all' : activeForm!.classId,
        isAllClasses ? 'all' : activeForm!.sectionId,
        selectedTerm,
        isAllClasses ? undefined : (activeForm as any)?.sessionId
      )
      const res = await apiSlice.get<TermlyAttendanceData>(url)
      if (res.success) {
        setReportData(res)
      } else {
        setError('Failed to load termly attendance report.')
      }
    } catch (err: any) {
      console.error('[TEACHER_TERMLY_REPORT] fetch error:', err)
      setError(err?.message || 'Could not load termly report.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTermlyReport()
  }, [isAllClasses, activeForm?.classId, activeForm?.sectionId, selectedTerm])

  // Filter students based on search and evaluation filter
  const filteredStudents = useMemo(() => {
    if (!reportData?.students) return []
    let list = reportData.students

    if (evalFilter !== 'ALL') {
      list = list.filter((s) => s.evaluation.toUpperCase() === evalFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.registerNo && s.registerNo.toLowerCase().includes(q)) ||
          String(s.roll).includes(q) ||
          (s.className && s.className.toLowerCase().includes(q)) ||
          (s.sectionName && s.sectionName.toLowerCase().includes(q))
      )
    }

    return list
  }, [reportData?.students, searchQuery, evalFilter])

  // Export CSV Broadsheet
  const handleExportCSV = () => {
    if (!reportData || !reportData.students.length) return

    const headers = [
      'Roll',
      'Register No',
      'Student Name',
      ...(isAllClasses ? ['Class', 'Arm'] : []),
      'Total Days Held',
      'Present Days',
      'Absent Days',
      'Late Days',
      'Attendance Rate (%)',
      'Evaluation Status',
    ]

    const rows = filteredStudents.map((s) => [
      s.roll,
      s.registerNo || 'N/A',
      `"${s.name.replace(/"/g, '""')}"`,
      ...(isAllClasses ? [`"${s.className || ''}"`, `"${s.sectionName || ''}"`] : []),
      s.totalDays,
      s.presentDays,
      s.absentDays,
      s.lateDays,
      `${s.percentage}%`,
      s.evaluation,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Termly_Attendance_Broadsheet_${isAllClasses ? 'All_Classes' : `${activeForm?.className || 'Class'}_${activeForm?.sectionName || 'Arm'}`}_Term${selectedTerm}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const summary = reportData?.summary || {
    averageClassRate: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    chronicAbsenteeCount: 0,
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
              <span>{isAdmin ? 'Select Class / Arm:' : 'Assigned Form Class:'}</span>
            </div>

            {isAdmin || formAllocations.length > 1 ? (
              <select
                aria-label="Select Assigned Form Class"
                value={selectedFormIdx}
                onChange={(e) => onSelectFormIdx(Number(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                {isAdmin && <option value={-1}>All Classes (School-Wide)</option>}
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

          {/* Academic Term Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
            {[
              { id: 1, label: '1st Term' },
              { id: 2, label: '2nd Term' },
              { id: 3, label: '3rd Term' },
            ].map((term) => (
              <button
                key={term.id}
                onClick={() => handleTermChange(term.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedTerm === term.id
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {term.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!reportData?.students?.length}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
              title="Download Broadsheet CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Broadsheet</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportData?.students?.length}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
              title="Print Broadsheet"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={fetchTermlyReport}
              disabled={loading}
              className="p-2.5 text-sm font-semibold rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              title="Refresh Report"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, roll or register no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1 hidden sm:block" />
            {(['ALL', 'EXCELLENT', 'GOOD', 'AVERAGE', 'CRITICAL'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setEvalFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  evalFilter === filter
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {filter === 'ALL' ? 'All Records' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total School Days */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/20 border border-indigo-200/60 dark:border-indigo-700/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
              Days Held
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 dark:bg-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-700 dark:text-indigo-300 tracking-tight">
            {reportData?.totalSchoolDays || 0}
          </div>
          <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 font-medium mt-1">
            School days held in term
          </p>
        </div>

        {/* Average Class Rate */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 border border-blue-200/60 dark:border-blue-700/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Avg Attendance
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
            {summary.averageClassRate}%
          </div>
          <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 font-medium mt-1">
            Term cumulative average
          </p>
        </div>

        {/* Total Present Days */}
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
            Cumulative presences
          </p>
        </div>

        {/* Total Absences */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/20 border border-rose-200/60 dark:border-rose-700/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Total Absences
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 dark:bg-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
            {summary.totalAbsent}
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium mt-1">
            Missed student sessions
          </p>
        </div>

        {/* Chronic Absentee Risk */}
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Chronic Risk
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 dark:bg-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-700 dark:text-amber-300 tracking-tight">
            {summary.chronicAbsenteeCount}
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-1">
            Students with rate &lt; 75%
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Termly Broadsheet Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Termly Attendance Broadsheet — {reportData?.termLabel || `Term ${selectedTerm}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredStudents.length} enrolled student{filteredStudents.length !== 1 ? 's' : ''} •{' '}
              {reportData?.totalSchoolDays || 0} total school sessions recorded
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Evaluation:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold">
              ≥ 95% Excellent
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold">
              85-94% Good
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
              75-84% Average
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold">
              &lt; 75% Critical
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3 text-center font-bold w-14">Roll</th>
                <th className="px-4 py-3 font-bold">Student Name</th>
                {isAllClasses && <th className="px-4 py-3 font-bold">Class / Arm</th>}
                <th className="px-4 py-3 font-bold">Register No</th>
                <th className="px-3 py-3 text-center font-bold">Held Days</th>
                <th className="px-3 py-3 text-center font-bold text-emerald-700 dark:text-emerald-400">Present</th>
                <th className="px-3 py-3 text-center font-bold text-rose-700 dark:text-rose-400">Absent</th>
                <th className="px-3 py-3 text-center font-bold text-amber-700 dark:text-amber-400">Late</th>
                <th className="px-4 py-3 text-center font-bold min-w-[140px]">Attendance Rate</th>
                <th className="px-4 py-3 text-center font-bold">Evaluation</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={isAllClasses ? 10 : 9} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Loading termly attendance broadsheet...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isAllClasses ? 10 : 9} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No student records found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try clearing your search query.'
                        : 'No students enrolled or recorded for this term.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isPending = student.evaluation === 'Pending' || student.totalDays === 0
                  const isCritical = !isPending && student.evaluation === 'Critical'
                  const isExcellent = !isPending && student.evaluation === 'Excellent'
                  const isGood = !isPending && student.evaluation === 'Good'

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-center font-bold text-slate-500">
                        {student.roll}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                            {student.firstName?.[0] || 'S'}
                          </div>
                          <div>
                            <div className="font-semibold text-sm leading-tight text-slate-900 dark:text-slate-100">
                              {student.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID #{student.studentId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {isAllClasses && (
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                            {[student.className, student.sectionName].filter(Boolean).join(' • ') || '—'}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 text-xs">
                        {student.registerNo || '—'}
                      </td>

                      <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {student.totalDays}
                      </td>

                      <td className="px-3 py-3 text-center font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {student.presentDays}
                      </td>

                      <td className="px-3 py-3 text-center font-black text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                        {student.absentDays}
                      </td>

                      <td className="px-3 py-3 text-center font-black text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/10">
                        {student.lateDays}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                student.percentage >= 95
                                  ? 'bg-emerald-500'
                                  : student.percentage >= 85
                                  ? 'bg-blue-500'
                                  : student.percentage >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(student.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-black text-xs text-slate-800 dark:text-slate-200 min-w-[36px] text-right">
                            {student.percentage}%
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isPending
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              : isExcellent
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              : isGood
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                              : isCritical
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 animate-pulse'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                          }`}
                        >
                          {isExcellent && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                          {isCritical && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                          <span>{student.evaluation}</span>
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
