'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Calendar,
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Save,
  Loader2,
  AlertCircle,
  School,
  Layers,
  Search,
  UserX,
  FileCheck2,
  Briefcase,
  Check,
  Info
} from 'lucide-react'

interface ClassOption {
  id: number
  name: string
  sections: { section: { id: number; name: string } }[]
}

interface StudentItem {
  id: number
  name: string
  roll?: string | null
  registerNo?: string | null
  sectionName?: string
}

interface StudentAttendanceRecord {
  id?: number
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  remark?: string | null
}

interface TeacherItem {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  department?: string | null
}

interface StaffAttendanceRecord {
  id?: number
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE'
  clockIn?: string | null
  clockOut?: string | null
  remark?: string | null
}

export function AttendanceManager() {
  const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students')

  // Shared Config
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

  // Date Selection – use local date (not UTC) to avoid off-by-one timezone issue
  const todayLocal = (() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })()
  const [attendanceDate, setAttendanceDate] = useState<string>(todayLocal)

  // Student State
  const [students, setStudents] = useState<StudentItem[]>([])
  const [studentAttendanceMap, setStudentAttendanceMap] = useState<
    Record<number, StudentAttendanceRecord>
  >({})
  const [studentMetrics, setStudentMetrics] = useState({
    totalEnrolled: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    attendanceRate: 0,
  })
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Staff State
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [staffAttendanceMap, setStaffAttendanceMap] = useState<
    Record<number, StaffAttendanceRecord>
  >({})
  const [staffMetrics, setStaffMetrics] = useState({
    totalStaff: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    onLeaveCount: 0,
    attendanceRate: 0,
  })
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [staffSearchQuery, setStaffSearchQuery] = useState('')

  // Saving states & messages
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadClasses()
    fetchStaffAttendance()
  }, [])

  useEffect(() => {
    if (activeTab === 'students' && selectedClassId) {
      fetchStudentAttendance()
    } else if (activeTab === 'staff') {
      fetchStaffAttendance()
    }
  }, [activeTab, selectedClassId, selectedSectionId, attendanceDate])

  const loadClasses = async () => {
    try {
      const res = await apiSlice.get<{ success: boolean; classes: ClassOption[] }>(
        endpoints.admin.classesSections
      )
      if (res.success && res.classes) {
        setClasses(res.classes)
        if (res.classes.length > 0) {
          const firstCls = res.classes[0]
          setSelectedClassId(String(firstCls.id))
          if (firstCls.sections && firstCls.sections.length > 0) {
            setSelectedSectionId(String(firstCls.sections[0].section.id))
          }
        }
      }
    } catch (err) {
      console.error('Failed to load classes for attendance:', err)
    }
  }

  const fetchStudentAttendance = async () => {
    if (!selectedClassId) return
    setLoadingStudents(true)
    setErrorMsg(null)

    try {
      const res = await apiSlice.get<{
        success: boolean
        students: StudentItem[]
        attendanceMap: Record<number, StudentAttendanceRecord>
        metrics: typeof studentMetrics
      }>(
        endpoints.admin.studentAttendance(
          Number(selectedClassId),
          selectedSectionId ? Number(selectedSectionId) : undefined,
          attendanceDate
        )
      )

      if (res.success) {
        setStudents(res.students)

        // Initialize state for each student
        const map: Record<number, StudentAttendanceRecord> = {}
        res.students.forEach((stu) => {
          const existing = res.attendanceMap?.[stu.id]
          map[stu.id] = {
            id: existing?.id,
            status: existing?.status || 'PRESENT',
            remark: existing?.remark || '',
          }
        })
        setStudentAttendanceMap(map)
        setStudentMetrics(res.metrics)
      }
    } catch (err: any) {
      setErrorMsg('Failed to load student attendance register.')
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchStaffAttendance = async () => {
    setLoadingStaff(true)

    try {
      const res = await apiSlice.get<{
        success: boolean
        teachers: TeacherItem[]
        attendanceMap: Record<number, StaffAttendanceRecord>
        metrics: typeof staffMetrics
      }>(endpoints.admin.staffAttendance(attendanceDate))

      if (res.success) {
        setTeachers(res.teachers)

        const map: Record<number, StaffAttendanceRecord> = {}
        res.teachers.forEach((t) => {
          const existing = res.attendanceMap?.[t.id]
          map[t.id] = {
            id: existing?.id,
            status: existing?.status || 'PRESENT',
            clockIn: existing?.clockIn || '08:00',
            clockOut: existing?.clockOut || '16:00',
            remark: existing?.remark || '',
          }
        })
        setStaffAttendanceMap(map)
        setStaffMetrics(res.metrics)
      }
    } catch (err: any) {
      setErrorMsg('Failed to load staff attendance register.')
    } finally {
      setLoadingStaff(false)
    }
  }

  // --- Student Attendance Handlers ---
  const recalcStudentMetrics = (map: Record<number, StudentAttendanceRecord>, stuList: StudentItem[]) => {
    let presentCount = 0, absentCount = 0, lateCount = 0, excusedCount = 0
    stuList.forEach((stu) => {
      const st = (map[stu.id]?.status || 'PRESENT').toUpperCase()
      if (st === 'PRESENT') presentCount++
      else if (st === 'ABSENT') absentCount++
      else if (st === 'LATE') lateCount++
      else if (st === 'EXCUSED') excusedCount++
      else presentCount++
    })
    const totalEnrolled = stuList.length
    const attendanceRate = totalEnrolled > 0 ? Math.round(((presentCount + lateCount) / totalEnrolled) * 100) : 0
    setStudentMetrics({ totalEnrolled, presentCount, absentCount, lateCount, excusedCount, attendanceRate })
  }

  const handleStudentStatusChange = (studentId: number, status: StudentAttendanceRecord['status']) => {
    setStudentAttendanceMap((prev) => {
      const updated = { ...prev, [studentId]: { ...prev[studentId], status } }
      recalcStudentMetrics(updated, students)
      return updated
    })
  }

  const handleStudentRemarkChange = (studentId: number, remark: string) => {
    setStudentAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remark },
    }))
  }

  const handleMarkAllStudents = (status: 'PRESENT' | 'ABSENT') => {
    setStudentAttendanceMap((prev) => {
      const updated: Record<number, StudentAttendanceRecord> = {}
      students.forEach((stu) => {
        updated[stu.id] = { ...prev[stu.id], status }
      })
      recalcStudentMetrics(updated, students)
      return updated
    })
  }

  const handleSaveStudentAttendance = async () => {
    if (!selectedClassId) return
    setIsSaving(true)
    setErrorMsg(null)

    try {
      const attendanceList = students.map((stu) => ({
        studentId: stu.id,
        status: studentAttendanceMap[stu.id]?.status || 'PRESENT',
        remark: studentAttendanceMap[stu.id]?.remark || undefined,
      }))

      await apiSlice.post(endpoints.admin.saveStudentAttendanceBatch, {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        date: attendanceDate,
        attendance: attendanceList,
      })

      setSuccessMsg('Student attendance register saved successfully!')
      await fetchStudentAttendance()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg('Failed to save student attendance.')
    } finally {
      setIsSaving(false)
    }
  }

  // --- Staff Attendance Handlers ---
  const handleStaffStatusChange = (
    teacherId: number,
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE'
  ) => {
    setStaffAttendanceMap((prev) => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], status },
    }))
  }

  const handleStaffTimeChange = (
    teacherId: number,
    field: 'clockIn' | 'clockOut',
    value: string
  ) => {
    setStaffAttendanceMap((prev) => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], [field]: value },
    }))
  }

  const handleStaffRemarkChange = (teacherId: number, remark: string) => {
    setStaffAttendanceMap((prev) => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], remark },
    }))
  }

  const handleMarkAllStaff = (status: 'PRESENT' | 'ABSENT') => {
    setStaffAttendanceMap((prev) => {
      const updated: Record<number, StaffAttendanceRecord> = {}
      teachers.forEach((t) => {
        updated[t.id] = { ...prev[t.id], status }
      })
      return updated
    })
  }

  const handleSaveStaffAttendance = async () => {
    setIsSaving(true)
    setErrorMsg(null)

    try {
      const attendanceList = teachers.map((t) => ({
        teacherId: t.id,
        status: staffAttendanceMap[t.id]?.status || 'PRESENT',
        clockIn: staffAttendanceMap[t.id]?.clockIn || undefined,
        clockOut: staffAttendanceMap[t.id]?.clockOut || undefined,
        remark: staffAttendanceMap[t.id]?.remark || undefined,
      }))

      await apiSlice.post(endpoints.admin.saveStaffAttendanceBatch, {
        date: attendanceDate,
        attendance: attendanceList,
      })

      setSuccessMsg('Staff attendance register saved successfully!')
      await fetchStaffAttendance()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg('Failed to save staff attendance.')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      (t.department && t.department.toLowerCase().includes(staffSearchQuery.toLowerCase()))
  )

  const currentClass = classes.find((c) => String(c.id) === selectedClassId)
  const availableSections = currentClass?.sections || []

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 border border-white/15">
              <Calendar size={14} className="text-emerald-300" /> Attendance Register & Analytics
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Attendance Tracking Desk</h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              Track, record, and analyze daily attendance registers for both Students and Staff with clock-in times and rate analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={activeTab === 'students' ? handleSaveStudentAttendance : handleSaveStaffAttendance}
              disabled={isSaving}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Register
            </button>
            <button
              onClick={() => window.print()}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/15 cursor-pointer"
              title="Print Attendance Register"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'students'
              ? 'bg-[#0063a6] text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
          }`}
        >
          <UserCheck size={16} /> Student Attendance
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-[#0063a6] text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
          }`}
        >
          <Briefcase size={16} /> Staff & Teacher Attendance
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600" /> {errorMsg}
        </div>
      )}

      {/* TAB 1: Student Attendance */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Student Filter & Metrics Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                {/* Classroom */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Classroom</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
                    <School size={15} className="text-[#0063a6]" />
                    <select
                      value={selectedClassId}
                      onChange={(e) => {
                        setSelectedClassId(e.target.value)
                        const cls = classes.find((c) => String(c.id) === e.target.value)
                        if (cls && cls.sections && cls.sections.length > 0) {
                          setSelectedSectionId(String(cls.sections[0].section.id))
                        } else {
                          setSelectedSectionId('')
                        }
                      }}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none pr-4"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
                    <Layers size={15} className="text-purple-600" />
                    <select
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      disabled={availableSections.length === 0}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none pr-4 disabled:opacity-50"
                    >
                      {availableSections.map((s) => (
                        <option key={s.section.id} value={s.section.id}>
                          Section {s.section.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date Picker */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance Date</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
                    <Calendar size={15} className="text-emerald-600" />
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Mark All Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleMarkAllStudents('PRESENT')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ✓ Mark All Present
                </button>
                <button
                  onClick={() => handleMarkAllStudents('ABSENT')}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ✗ Mark All Absent
                </button>
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Enrolled</p>
                <p className="text-lg font-black text-slate-900">{studentMetrics.totalEnrolled}</p>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] font-extrabold text-emerald-600 uppercase">Present</p>
                <p className="text-lg font-black text-emerald-700">{studentMetrics.presentCount}</p>
              </div>
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100 text-center">
                <p className="text-[10px] font-extrabold text-rose-600 uppercase">Absent</p>
                <p className="text-lg font-black text-rose-700">{studentMetrics.absentCount}</p>
              </div>
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-center">
                <p className="text-[10px] font-extrabold text-amber-600 uppercase">Late</p>
                <p className="text-lg font-black text-amber-700">{studentMetrics.lateCount}</p>
              </div>
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-center col-span-2 sm:col-span-1">
                <p className="text-[10px] font-extrabold text-[#0063a6] uppercase">Attendance %</p>
                <p className="text-lg font-black text-[#0063a6]">{studentMetrics.attendanceRate}%</p>
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          {loadingStudents ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
              <Loader2 size={24} className="animate-spin text-[#0063a6] mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading student attendance roster...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
              <Users size={32} className="text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Enrolled Students Found for this Class & Section</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Roll / Reg No</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4 text-center">Attendance Status</th>
                      <th className="py-3.5 px-4">Remarks / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {students.map((stu) => {
                      const currentStatus = studentAttendanceMap[stu.id]?.status || 'PRESENT'
                      const currentRemark = studentAttendanceMap[stu.id]?.remark || ''

                      return (
                        <tr key={stu.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-mono text-slate-600 font-bold">
                            {stu.roll || stu.registerNo || `#${stu.id}`}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-900">
                            {stu.name}
                          </td>

                          {/* Status Pill Buttons */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                              {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((st) => {
                                const isSelected = currentStatus === st
                                const colorConfig = {
                                  PRESENT: 'bg-emerald-600 text-white',
                                  ABSENT: 'bg-rose-600 text-white',
                                  LATE: 'bg-amber-500 text-white',
                                  EXCUSED: 'bg-indigo-600 text-white',
                                }[st]

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStudentStatusChange(stu.id, st)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                                      isSelected
                                        ? `${colorConfig} shadow-xs`
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    {st === 'PRESENT' ? 'Present' : st === 'ABSENT' ? 'Absent' : st === 'LATE' ? 'Late' : 'Excused'}
                                  </button>
                                )
                              })}
                            </div>
                          </td>

                          {/* Remark Input */}
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              placeholder="Add optional note..."
                              value={currentRemark}
                              onChange={(e) => handleStudentRemarkChange(stu.id, e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 outline-none focus:border-[#0063a6]"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Staff & Teacher Attendance */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Staff Filter & Metrics Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search staff name or dept..."
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0063a6]"
                  />
                </div>

                {/* Date Picker */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance Date</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
                    <Calendar size={15} className="text-emerald-600" />
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Mark All Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleMarkAllStaff('PRESENT')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ✓ Mark All Present
                </button>
                <button
                  onClick={() => handleMarkAllStaff('ABSENT')}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ✗ Mark All Absent
                </button>
              </div>
            </div>

            {/* Staff Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Total Staff</p>
                <p className="text-lg font-black text-slate-900">{staffMetrics.totalStaff}</p>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] font-extrabold text-emerald-600 uppercase">Present</p>
                <p className="text-lg font-black text-emerald-700">{staffMetrics.presentCount}</p>
              </div>
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100 text-center">
                <p className="text-[10px] font-extrabold text-rose-600 uppercase">Absent</p>
                <p className="text-lg font-black text-rose-700">{staffMetrics.absentCount}</p>
              </div>
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-center">
                <p className="text-[10px] font-extrabold text-amber-600 uppercase">Late</p>
                <p className="text-lg font-black text-amber-700">{staffMetrics.lateCount}</p>
              </div>
              <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-100 text-center">
                <p className="text-[10px] font-extrabold text-purple-600 uppercase">On Leave</p>
                <p className="text-lg font-black text-purple-700">{staffMetrics.onLeaveCount}</p>
              </div>
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-center col-span-2 sm:col-span-1">
                <p className="text-[10px] font-extrabold text-[#0063a6] uppercase">Attendance %</p>
                <p className="text-lg font-black text-[#0063a6]">{staffMetrics.attendanceRate}%</p>
              </div>
            </div>
          </div>

          {/* Staff Roster Table */}
          {loadingStaff ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
              <Loader2 size={24} className="animate-spin text-[#0063a6] mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading staff attendance register...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
              <Briefcase size={32} className="text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Staff Members Found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Staff Member</th>
                      <th className="py-3.5 px-4">Department / Designation</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Clock-In</th>
                      <th className="py-3.5 px-4 text-center">Clock-Out</th>
                      <th className="py-3.5 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTeachers.map((t) => {
                      const currentRecord = staffAttendanceMap[t.id] || { status: 'PRESENT', clockIn: '08:00', clockOut: '16:00', remark: '' }

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4">
                            <p className="font-extrabold text-slate-900">{t.name}</p>
                            {t.email && <p className="text-[10px] text-slate-400">{t.email}</p>}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-600">
                            {t.department || 'Academic Staff'}
                          </td>

                          {/* Status Pill Buttons */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                              {(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'] as const).map((st) => {
                                const isSelected = currentRecord.status === st
                                const colorConfig = {
                                  PRESENT: 'bg-emerald-600 text-white',
                                  ABSENT: 'bg-rose-600 text-white',
                                  LATE: 'bg-amber-500 text-white',
                                  HALF_DAY: 'bg-blue-600 text-white',
                                  ON_LEAVE: 'bg-purple-600 text-white',
                                }[st]

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStaffStatusChange(t.id, st)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                                      isSelected
                                        ? `${colorConfig} shadow-xs`
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    {st === 'PRESENT' ? 'Present' : st === 'ABSENT' ? 'Absent' : st === 'LATE' ? 'Late' : st === 'HALF_DAY' ? 'Half Day' : 'On Leave'}
                                  </button>
                                )
                              })}
                            </div>
                          </td>

                          {/* Clock In */}
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="time"
                              disabled={currentRecord.status === 'ABSENT' || currentRecord.status === 'ON_LEAVE'}
                              value={currentRecord.clockIn || ''}
                              onChange={(e) => handleStaffTimeChange(t.id, 'clockIn', e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 disabled:opacity-40"
                            />
                          </td>

                          {/* Clock Out */}
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="time"
                              disabled={currentRecord.status === 'ABSENT' || currentRecord.status === 'ON_LEAVE'}
                              value={currentRecord.clockOut || ''}
                              onChange={(e) => handleStaffTimeChange(t.id, 'clockOut', e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 disabled:opacity-40"
                            />
                          </td>

                          {/* Remarks */}
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              placeholder="Note/reason..."
                              value={currentRecord.remark || ''}
                              onChange={(e) => handleStaffRemarkChange(t.id, e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 outline-none focus:border-[#0063a6]"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
