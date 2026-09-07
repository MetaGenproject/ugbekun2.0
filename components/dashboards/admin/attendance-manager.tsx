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
  Info,
  BarChart3,
  DoorOpen,
  QrCode,
  ShieldCheck,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

type AttendanceTab = 'class-registers' | 'student-attendance' | 'staff-attendance' | 'daily-report' | 'monthly-report' | 'gate-manager'

interface GateLog {
  id: string
  personName: string
  role: 'Student' | 'Staff'
  idNumber: string
  entryTime: string
  exitTime?: string
  gateLocation: string
  status: 'Verified Entry' | 'Exit Recorded' | 'Flagged Gate Entry'
}

interface ClassOption {
  id: number
  name: string
  sections: { section: { id: number; name: string } }[]
}

interface RegisterSnapshot {
  success: boolean
  message?: string
  register: {
    id: number
    status: string
    version: number
    takenByTeacherName?: string | null
    submittedAt?: string | null
    unlockedAt?: string | null
    unlockedReason?: string | null
  } | null
  roster: Array<{
    studentId: number
    roll: number
    registerNo: string | null
    firstName: string | null
    lastName: string | null
  }>
  entries: Array<{ studentId: number; status: string; remark: string | null }>
  summary: { total: number; present: number; absent: number; late: number; excused: number; sick: number; unmarked: number }
  calendar?: {
    weekday: string
    isWeekend: boolean
    isHoliday?: boolean
    isSchoolDay?: boolean
    holidayTitle?: string | null
  }
  canEdit?: boolean
  audits: Array<{
    id: number
    action: string
    fromCode: string | null
    toCode: string | null
    studentId: number | null
    reason: string | null
    createdAt: string
  }>
}

function todayLocalDateKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function monthlyAttendanceReportUrl(params?: {
  month?: string
  classId?: number | string
  sectionId?: number | string
  view?: 'streams' | 'students'
  page?: number
  pageSize?: number
  q?: string
  format?: 'csv'
}) {
  const search = new URLSearchParams()
  if (params?.month) search.set('month', params.month)
  if (params?.classId) search.set('classId', String(params.classId))
  if (params?.sectionId) search.set('sectionId', String(params.sectionId))
  if (params?.view) search.set('view', params.view)
  if (params?.page) search.set('page', String(params.page))
  if (params?.pageSize) search.set('pageSize', String(params.pageSize))
  if (params?.q) search.set('q', params.q)
  if (params?.format) search.set('format', params.format)
  const qs = search.toString()
  const base = endpoints.admin.attendanceRegister.replace(/\/register$/, '/monthly-report')
  return qs ? `${base}?${qs}` : base
}

function dailyAttendanceReportUrl(dateKey: string) {
  const base = endpoints.admin.attendanceRegister.replace(/\/register$/, '/daily-report')
  return `${base}?date=${encodeURIComponent(dateKey)}`
}

const STUDENT_CODES = ['Present', 'Absent', 'Late', 'Excused', 'Sick'] as const
const STAFF_CODES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'] as const

function toTimeInputValue(raw?: string | null) {
  const text = String(raw || '').trim()
  if (!text) return ''
  const match = text.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return ''
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

function statusTone(status: string) {
  const key = status.toUpperCase()
  if (key === 'PRESENT') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (key === 'LATE' || key === 'HALF_DAY') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (key === 'ABSENT') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (key === 'EXCUSED' || key === 'SICK' || key === 'ON_LEAVE') return 'bg-sky-50 text-sky-700 border-sky-200'
  return 'bg-slate-50 text-slate-500 border-slate-200'
}

function PaginationBar({
  page,
  pageSize,
  total,
  totalPages,
  noun,
  onPage,
  onPageSize,
}: {
  page: number
  pageSize: number
  total: number
  totalPages: number
  noun: string
  onPage: (page: number) => void
  onPageSize: (size: number) => void
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span>
          Showing <strong className="text-slate-900">{start}</strong>–<strong className="text-slate-900">{end}</strong> of{' '}
          <strong className="text-slate-900">{total}</strong> {noun}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <div className="px-3 py-1.5 text-xs font-black text-slate-800 bg-slate-100 rounded-xl">
          Page {page} of {totalPages}
        </div>
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function StudentAttendancePanel() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [dateKey, setDateKey] = useState(todayLocalDateKey)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [students, setStudents] = useState<Array<{ id: number; name: string; roll: string | null; registerNo: string | null; sectionName?: string }>>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<number, { status?: string; remark?: string | null }>>({})
  const [dirty, setDirty] = useState<Record<number, { status: string; remark: string }>>({})
  const [metrics, setMetrics] = useState<{ totalEnrolled: number; presentCount: number; absentCount: number; lateCount: number; unmarkedCount?: number; attendanceRate: number } | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedClass = classes.find((row) => row.id === Number(classId))
  const sections = selectedClass?.sections.map((row) => row.section) || []
  const dirtyCount = Object.keys(dirty).length

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    apiSlice
      .get<{ success: boolean; classes: ClassOption[] }>(endpoints.admin.classesSections)
      .then((res) => {
        const next = res.classes || []
        setClasses(next)
        if (next[0]) {
          setClassId(String(next[0].id))
          const firstSection = next[0].sections[0]?.section?.id
          if (firstSection) setSectionId(String(firstSection))
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load classes.'))
  }, [])

  useEffect(() => {
    setPage(1)
    setDirty({})
  }, [classId, sectionId, dateKey])

  useEffect(() => {
    setPage(1)
  }, [pageSize, debouncedSearch])

  useEffect(() => {
    if (!classId || !sectionId || !dateKey) return
    let cancelled = false
    setLoading(true)
    setError(null)
    apiSlice
      .get<{
        success: boolean
        students: Array<{ id: number; name: string; roll: string | null; registerNo: string | null; sectionName?: string }>
        attendanceMap: Record<number, { status?: string; remark?: string | null }>
        pagination?: { page: number; pageSize: number; total: number; totalPages: number }
        metrics?: { totalEnrolled: number; presentCount: number; absentCount: number; lateCount: number; unmarkedCount?: number; attendanceRate: number }
        message?: string
      }>(endpoints.admin.studentAttendance(Number(classId), Number(sectionId), dateKey, { page, pageSize, q: debouncedSearch || undefined }))
      .then((res) => {
        if (cancelled) return
        setStudents(res.students || [])
        setAttendanceMap(res.attendanceMap || {})
        setPagination(res.pagination || { page, pageSize, total: (res.students || []).length, totalPages: 1 })
        setMetrics(res.metrics || null)
      })
      .catch((err) => {
        if (cancelled) return
        setStudents([])
        setAttendanceMap({})
        setError(err?.message || 'Failed to load student attendance.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [classId, sectionId, dateKey, page, pageSize, debouncedSearch])

  const markStudent = (id: number, status: string) => {
    const current = dirty[id] || { status: attendanceMap[id]?.status || '', remark: attendanceMap[id]?.remark || '' }
    setDirty((prev) => ({ ...prev, [id]: { status, remark: current.remark || '' } }))
    setSuccess(null)
  }

  const handleSave = async () => {
    if (!classId || !sectionId) return
    const attendance = Object.entries(dirty).map(([studentId, row]) => ({
      studentId: Number(studentId),
      status: row.status,
      remark: row.remark || null,
    }))
    if (attendance.length === 0) {
      setError('Mark at least one student before saving.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiSlice.post<{ success: boolean; message?: string; savedCount?: number }>(
        endpoints.admin.saveStudentAttendanceBatch,
        { classId: Number(classId), sectionId: Number(sectionId), date: dateKey, attendance }
      )
      setSuccess(res.message || `Saved ${res.savedCount || attendance.length} student records.`)
      setDirty({})
      const refreshed = await apiSlice.get<{
        students: Array<{ id: number; name: string; roll: string | null; registerNo: string | null }>
        attendanceMap: Record<number, { status?: string; remark?: string | null }>
        pagination?: { page: number; pageSize: number; total: number; totalPages: number }
        metrics?: { totalEnrolled: number; presentCount: number; absentCount: number; lateCount: number; unmarkedCount?: number; attendanceRate: number }
      }>(endpoints.admin.studentAttendance(Number(classId), Number(sectionId), dateKey, { page, pageSize, q: debouncedSearch || undefined }))
      setStudents(refreshed.students || [])
      setAttendanceMap(refreshed.attendanceMap || {})
      setPagination(refreshed.pagination || pagination)
      setMetrics(refreshed.metrics || null)
    } catch (err: any) {
      setError(err?.message || 'Failed to save student attendance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Class stream</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                const next = classes.find((row) => row.id === Number(e.target.value))
                setSectionId(String(next?.sections[0]?.section?.id || ''))
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
            >
              {classes.length === 0 && <option value="">No classes found</option>}
              {classes.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Arm / section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
            >
              {sections.length === 0 && <option value="">No arms</option>}
              {sections.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Attendance date</label>
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Search students</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, roll, admission no"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || dirtyCount === 0}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
        </button>
      </div>

      {metrics && (
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">{metrics.totalEnrolled} on roll</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{metrics.presentCount} present</span>
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">{metrics.absentCount} absent</span>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{metrics.lateCount} late</span>
          {metrics.unmarkedCount != null && (
            <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">{metrics.unmarkedCount} unmarked</span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">{metrics.attendanceRate}% in attendance</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">{success}</div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Roll No</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>Admission No</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Quick Mark</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium text-xs">
                <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading class roster…</span>
              </TableCell>
            </TableRow>
          ) : students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium text-xs">
                {classes.length === 0
                  ? 'No classes have been set up for this school yet.'
                  : `No students enrolled in this class arm${debouncedSearch ? ' match that search' : ''}.`}
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => {
              const status = dirty[student.id]?.status || attendanceMap[student.id]?.status || ''
              return (
                <TableRow key={student.id}>
                  <TableCell className="font-mono font-bold text-slate-700">{student.roll || '—'}</TableCell>
                  <TableCell className="font-bold text-slate-900">{student.name}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{student.registerNo || '—'}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusTone(status)}`}>
                      {status || 'UNMARKED'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {STUDENT_CODES.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => markStudent(student.id, code)}
                        className={`px-2 py-1 font-bold text-[11px] rounded-lg cursor-pointer ${
                          status.toUpperCase() === code.toUpperCase()
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <PaginationBar
        page={pagination.page}
        pageSize={pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages}
        noun="students"
        onPage={setPage}
        onPageSize={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
    </div>
  )
}

function StaffAttendancePanel() {
  const [dateKey, setDateKey] = useState(todayLocalDateKey)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [teachers, setTeachers] = useState<Array<{ id: number; name: string; email?: string | null; department?: string | null }>>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<number, { status?: string; clockIn?: string; clockOut?: string; remark?: string }>>({})
  const [dirty, setDirty] = useState<Record<number, { status: string; clockIn: string; clockOut: string }>>({})
  const [metrics, setMetrics] = useState<{ totalStaff: number; presentCount: number; absentCount: number; lateCount: number; onLeaveCount: number; attendanceRate: number } | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const dirtyCount = Object.keys(dirty).length

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
    setDirty({})
  }, [dateKey])

  useEffect(() => {
    setPage(1)
  }, [pageSize, debouncedSearch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiSlice
      .get<{
        success: boolean
        teachers: Array<{ id: number; name: string; email?: string | null; department?: string | null }>
        attendanceMap: Record<number, { status?: string; clockIn?: string; clockOut?: string; remark?: string }>
        pagination?: { page: number; pageSize: number; total: number; totalPages: number }
        metrics?: { totalStaff: number; presentCount: number; absentCount: number; lateCount: number; onLeaveCount: number; attendanceRate: number }
      }>(endpoints.admin.staffAttendance(dateKey, { page, pageSize, q: debouncedSearch || undefined }))
      .then((res) => {
        if (cancelled) return
        setTeachers(res.teachers || [])
        setAttendanceMap(res.attendanceMap || {})
        setPagination(res.pagination || { page, pageSize, total: (res.teachers || []).length, totalPages: 1 })
        setMetrics(res.metrics || null)
      })
      .catch((err) => {
        if (cancelled) return
        setTeachers([])
        setError(err?.message || 'Failed to load staff attendance.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [dateKey, page, pageSize, debouncedSearch])

  const staffDraft = (id: number) => ({
    status: dirty[id]?.status ?? attendanceMap[id]?.status ?? '',
    clockIn: toTimeInputValue(dirty[id]?.clockIn ?? attendanceMap[id]?.clockIn),
    clockOut: toTimeInputValue(dirty[id]?.clockOut ?? attendanceMap[id]?.clockOut),
  })

  const markStaff = (id: number, status: string) => {
    const current = staffDraft(id)
    setDirty((prev) => ({ ...prev, [id]: { ...current, status } }))
    setSuccess(null)
  }

  const setClockIn = (id: number, clockIn: string) => {
    const current = staffDraft(id)
    setDirty((prev) => ({
      ...prev,
      [id]: { ...current, status: current.status || 'PRESENT', clockIn },
    }))
    setSuccess(null)
  }

  const setClockOut = (id: number, clockOut: string) => {
    const current = staffDraft(id)
    setDirty((prev) => ({
      ...prev,
      [id]: { ...current, status: current.status || 'PRESENT', clockOut },
    }))
    setSuccess(null)
  }

  const handleSave = async () => {
    const attendance = Object.entries(dirty).map(([teacherId, row]) => ({
      teacherId: Number(teacherId),
      status: row.status,
      clockIn: row.clockIn || null,
      clockOut: row.clockOut || null,
    }))
    if (attendance.length === 0) {
      setError('Mark at least one staff member before saving.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiSlice.post<{ success: boolean; message?: string; savedCount?: number }>(
        endpoints.admin.saveStaffAttendanceBatch,
        { date: dateKey, attendance }
      )
      setSuccess(res.message || `Saved ${res.savedCount || attendance.length} staff records.`)
      setDirty({})
      const refreshed = await apiSlice.get<{
        teachers: Array<{ id: number; name: string; email?: string | null; department?: string | null }>
        attendanceMap: Record<number, { status?: string; clockIn?: string; clockOut?: string }>
        pagination?: { page: number; pageSize: number; total: number; totalPages: number }
        metrics?: { totalStaff: number; presentCount: number; absentCount: number; lateCount: number; onLeaveCount: number; attendanceRate: number }
      }>(endpoints.admin.staffAttendance(dateKey, { page, pageSize, q: debouncedSearch || undefined }))
      setTeachers(refreshed.teachers || [])
      setAttendanceMap(refreshed.attendanceMap || {})
      setPagination(refreshed.pagination || pagination)
      setMetrics(refreshed.metrics || null)
    } catch (err: any) {
      setError(err?.message || 'Failed to save staff attendance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="grid sm:grid-cols-2 gap-3 flex-1">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Attendance date</label>
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Search staff</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, department"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || dirtyCount === 0}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
        </button>
      </div>

      {metrics && (
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">{metrics.totalStaff} staff</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{metrics.presentCount} present</span>
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">{metrics.absentCount} absent</span>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{metrics.lateCount} late</span>
          <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">{metrics.onLeaveCount} on leave</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">{metrics.attendanceRate}% in attendance</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">{success}</div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff Name</TableHead>
            <TableHead>Role / Department</TableHead>
            <TableHead>Clock-In</TableHead>
            <TableHead>Clock-Out</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Quick Mark</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-slate-400 font-medium text-xs">
                <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading staff roster…</span>
              </TableCell>
            </TableRow>
          ) : teachers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-slate-400 font-medium text-xs">
                {debouncedSearch ? 'No staff match that search.' : 'No active staff found for this school.'}
              </TableCell>
            </TableRow>
          ) : (
            teachers.map((staff) => {
              const draft = staffDraft(staff.id)
              const status = draft.status
              return (
                <TableRow key={staff.id}>
                  <TableCell className="font-bold text-slate-900">{staff.name}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">{staff.department || 'Staff'}</TableCell>
                  <TableCell>
                    <input
                      type="time"
                      value={draft.clockIn}
                      onChange={(e) => setClockIn(staff.id, e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="time"
                      value={draft.clockOut}
                      onChange={(e) => setClockOut(staff.id, e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50"
                    />
                  </TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusTone(status)}`}>
                      {status || 'UNMARKED'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {STAFF_CODES.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => markStaff(staff.id, code)}
                        className={`px-2 py-1 font-bold text-[11px] rounded-lg cursor-pointer ${
                          status.toUpperCase() === code
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                          {code.replaceAll('_', ' ')}
                      </button>
                    ))}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <PaginationBar
        page={pagination.page}
        pageSize={pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages}
        noun="staff"
        onPage={setPage}
        onPageSize={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
    </div>
  )
}

function ClassRegistersPanel() {
  const today = new Date().toISOString().split('T')[0]
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [dateKey, setDateKey] = useState(today)
  const [snapshot, setSnapshot] = useState<RegisterSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedClass = classes.find((row) => row.id === Number(classId))
  const sections = selectedClass?.sections.map((row) => row.section) || []

  useEffect(() => {
    apiSlice
      .get<{ success: boolean; classes: ClassOption[] }>(endpoints.admin.classesSections)
      .then((res) => {
        const next = res.classes || []
        setClasses(next)
        if (next[0]) {
          setClassId(String(next[0].id))
          const firstSection = next[0].sections[0]?.section?.id
          if (firstSection) setSectionId(String(firstSection))
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load classes.'))
  }, [])

  const loadRegister = async (nextClassId = classId, nextSectionId = sectionId, nextDate = dateKey) => {
    if (!nextClassId || !nextSectionId || !nextDate) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiSlice.get<RegisterSnapshot>(
        `${endpoints.admin.attendanceRegister}?classId=${nextClassId}&sectionId=${nextSectionId}&date=${nextDate}`
      )
      setSnapshot(res)
    } catch (err: any) {
      setSnapshot(null)
      setError(err?.message || 'Failed to load class register.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (classId && sectionId && dateKey) {
      loadRegister(classId, sectionId, dateKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, sectionId, dateKey])

  const handleUnlock = async () => {
    if (!snapshot?.register) return
    setUnlocking(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiSlice.post<{ success: boolean; message?: string }>(
        endpoints.admin.unlockAttendanceRegister,
        { registerId: snapshot.register.id, reason }
      )
      setSuccess(res.message || 'Register unlocked.')
      setReason('')
      await loadRegister()
    } catch (err: any) {
      setError(err?.message || 'Failed to unlock register.')
    } finally {
      setUnlocking(false)
    }
  }

  const locked = snapshot?.register?.status === 'SUBMITTED' || snapshot?.register?.status === 'LOCKED'
  const entryByStudent = new Map((snapshot?.entries || []).map((row) => [row.studentId, row]))

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="grid sm:grid-cols-3 gap-3 flex-1">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Class</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                const next = classes.find((row) => row.id === Number(e.target.value))
                setSectionId(String(next?.sections[0]?.section?.id || ''))
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
            >
              {classes.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Arm / section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
            >
              {sections.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Register date</label>
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
          {success}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm font-semibold flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading register…
        </div>
      ) : snapshot ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
              snapshot.register?.status === 'DRAFT'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : snapshot.register?.status === 'SUBMITTED' || snapshot.register?.status === 'LOCKED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {snapshot.register?.status || 'Not opened'}
            </span>
            {snapshot.calendar?.isHoliday && !snapshot.calendar.isSchoolDay && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                {snapshot.calendar.holidayTitle || 'Holiday'}
              </span>
            )}
            {snapshot.register?.takenByTeacherName && (
              <span className="text-[11px] font-semibold text-slate-500">Taken by {snapshot.register.takenByTeacherName}</span>
            )}
            <span className="text-[11px] font-semibold text-slate-400">
              {snapshot.summary?.present ?? 0} present · {snapshot.summary?.absent ?? 0} absent · {snapshot.summary?.unmarked ?? 0} unmarked
            </span>
          </div>

          {locked && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                <Lock size={14} /> Submitted registers are locked. Unlock with a reason so the form teacher can correct them. Later edits are audited.
              </p>
              {snapshot.register?.unlockedReason && (
                <p className="text-[11px] text-slate-500">Last unlock: {snapshot.register.unlockedReason}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (min. 3 characters)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                />
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={unlocking || reason.trim().length < 3}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {unlocking ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
                  Unlock register
                </button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(snapshot.roster || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No enrolled students for this class arm.
                  </TableCell>
                </TableRow>
              ) : (
                snapshot.roster.map((student) => {
                  const entry = entryByStudent.get(student.studentId)
                  return (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-mono font-bold text-slate-700">{student.roll}</TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {[student.firstName, student.lastName].filter(Boolean).join(' ') || student.registerNo}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-600">{entry?.status || 'Unmarked'}</TableCell>
                      <TableCell className="text-xs text-slate-500">{entry?.remark || '—'}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Audit trail</h4>
            {(snapshot.audits || []).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No unlocks or post-submit edits yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {snapshot.audits.map((audit) => (
                  <li key={audit.id} className="text-[11px] text-slate-600 font-medium">
                    <span className="font-extrabold text-slate-800">{audit.action}</span>
                    {audit.fromCode || audit.toCode ? ` ${audit.fromCode || '—'} → ${audit.toCode || '—'}` : ''}
                    {audit.reason ? ` · ${audit.reason}` : ''}
                    {' · '}
                    {new Date(audit.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

function todayMonthKey() {
  return todayLocalDateKey().slice(0, 7)
}

interface MonthlyStreamRow {
  classId: number
  sectionId: number
  className: string
  sectionName: string
  streamName: string
  enrolled: number
  codedDays: number
  averagePresenceRate: number
  chronicAbsenteeCount: number
}

interface MonthlyStudentRow {
  studentId: number
  name: string
  registerNo: string | null
  roll: number | null
  classId: number
  sectionId: number
  streamName: string
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  sickCount: number
  codedDays: number
  percentage: number
  chronic: boolean
}

function MonthlyAttendancePanel() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [month, setMonth] = useState(todayMonthKey)
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [view, setView] = useState<'streams' | 'students'>('streams')
  const [streams, setStreams] = useState<MonthlyStreamRow[]>([])
  const [students, setStudents] = useState<MonthlyStudentRow[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 1 })
  const [metrics, setMetrics] = useState<{
    enrolledStudents: number
    averagePresenceRate: number
    chronicAbsenteeCount: number
    codedDays: number
    staff?: { totalStaff: number; attendanceRate: number; markedCount: number }
  } | null>(null)
  const [monthLabel, setMonthLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedClass = classes.find((row) => row.id === Number(classId))
  const sections = selectedClass?.sections.map((row) => row.section) || []
  const showingStudents = view === 'students'

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    apiSlice
      .get<{ success: boolean; classes: ClassOption[] }>(endpoints.admin.classesSections)
      .then((res) => setClasses(res.classes || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load classes.'))
  }, [])

  useEffect(() => {
    setPage(1)
    setView(classId ? 'students' : 'streams')
  }, [classId, sectionId, month])

  useEffect(() => {
    setPage(1)
  }, [pageSize, debouncedSearch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiSlice
      .get<{
        success: boolean
        monthLabel?: string
        view?: 'streams' | 'students'
        streams?: MonthlyStreamRow[]
        students?: MonthlyStudentRow[]
        pagination?: { page: number; pageSize: number; total: number; totalPages: number }
        metrics?: {
          enrolledStudents: number
          averagePresenceRate: number
          chronicAbsenteeCount: number
          codedDays: number
          staff?: { totalStaff: number; attendanceRate: number; markedCount: number }
        }
        message?: string
      }>(
        monthlyAttendanceReportUrl({
          month,
          classId: classId || undefined,
          sectionId: sectionId || undefined,
          view: classId ? 'students' : 'streams',
          page,
          pageSize,
          q: debouncedSearch || undefined,
        })
      )
      .then((res) => {
        if (cancelled) return
        setView(res.view || (classId ? 'students' : 'streams'))
        setStreams(res.streams || [])
        setStudents(res.students || [])
        setPagination(res.pagination || { page, pageSize, total: 0, totalPages: 1 })
        setMetrics(res.metrics || null)
        setMonthLabel(res.monthLabel || month)
      })
      .catch((err) => {
        if (cancelled) return
        setStreams([])
        setStudents([])
        setMetrics(null)
        setError(err instanceof Error ? err.message : 'Failed to load monthly attendance report.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [month, classId, sectionId, page, pageSize, debouncedSearch])

  const openStream = (stream: MonthlyStreamRow) => {
    setClassId(String(stream.classId))
    setSectionId(String(stream.sectionId))
    setSearch('')
  }

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      await apiSlice.download(
        monthlyAttendanceReportUrl({
          month,
          classId: classId || undefined,
          sectionId: sectionId || undefined,
          view: showingStudents ? 'students' : 'streams',
          q: debouncedSearch || undefined,
          format: 'csv',
        }),
        `monthly-attendance-${month}.csv`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export monthly report.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-emerald-600" size={20} /> Cumulative Monthly Attendance Trends
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Submitted registers only for {monthLabel || month}. Presence is Present + Late over coded school days. Chronic absentees are below 80% with at least 4 marked days.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || loading}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Export CSV
        </button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Class stream</label>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value)
              setSectionId('')
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="">All classes</option>
            {classes.map((row) => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Arm / section</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 disabled:opacity-50"
          >
            <option value="">All arms</option>
            {sections.map((row) => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Search</label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={showingStudents ? 'Student, admission no, class' : 'Class stream'}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
            />
          </div>
        </div>
      </div>

      {metrics && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Students on roll</p>
            <p className="text-2xl font-black text-slate-950 mt-1">{metrics.enrolledStudents}</p>
          </div>
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
            <p className="text-[11px] font-bold text-emerald-700 uppercase">Average presence</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">{metrics.averagePresenceRate}%</p>
          </div>
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50">
            <p className="text-[11px] font-bold text-rose-700 uppercase">Chronic absentees</p>
            <p className="text-2xl font-black text-rose-950 mt-1">{metrics.chronicAbsenteeCount}</p>
          </div>
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
            <p className="text-[11px] font-bold text-amber-700 uppercase">Staff presence</p>
            <p className="text-2xl font-black text-amber-950 mt-1">{metrics.staff?.attendanceRate ?? 0}%</p>
            <p className="text-[11px] font-semibold text-amber-800 mt-1">
              {metrics.staff?.markedCount ?? 0} marked days · {metrics.staff?.totalStaff ?? 0} staff
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {showingStudents ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class stream</TableHead>
              <TableHead>Roll</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Admission no</TableHead>
              <TableHead>Present / Late</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Presence %</TableHead>
              <TableHead>Flag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400 font-medium text-xs">
                  <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading student totals…</span>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400 font-medium text-xs">
                  No enrolled students match this class stream for the selected month.
                </TableCell>
              </TableRow>
            ) : (
              students.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell className="font-bold text-slate-900">{row.streamName}</TableCell>
                  <TableCell className="font-mono text-xs">{row.roll ?? '—'}</TableCell>
                  <TableCell className="font-bold text-slate-800">{row.name}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">{row.registerNo || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{row.presentCount} / {row.lateCount}</TableCell>
                  <TableCell className="font-mono text-xs text-rose-700">{row.absentCount}</TableCell>
                  <TableCell className={`font-mono font-bold ${row.percentage < 80 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {row.percentage}%
                  </TableCell>
                  <TableCell>
                    {row.chronic ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">Chronic</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Stream</TableHead>
              <TableHead>Enrolled Students</TableHead>
              <TableHead>Average Presence Rate</TableHead>
              <TableHead>Chronic Absentee Count</TableHead>
              <TableHead className="text-right">Open roster</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium text-xs">
                  <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading class streams…</span>
                </TableCell>
              </TableRow>
            ) : streams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium text-xs">
                  No enrolled class streams for this school yet.
                </TableCell>
              </TableRow>
            ) : (
              streams.map((row) => (
                <TableRow key={`${row.classId}-${row.sectionId}`}>
                  <TableCell className="font-bold text-slate-900">{row.streamName}</TableCell>
                  <TableCell className="font-mono text-xs">{row.enrolled} Students</TableCell>
                  <TableCell className={`font-mono font-bold ${row.averagePresenceRate < 80 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {row.averagePresenceRate}%
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">{row.chronicAbsenteeCount} Student{row.chronicAbsenteeCount === 1 ? '' : 's'}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => openStream(row)}
                      className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      View students
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <PaginationBar
        page={pagination.page}
        pageSize={pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages}
        noun={showingStudents ? 'students' : 'class streams'}
        onPage={setPage}
        onPageSize={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
    </div>
  )
}

function DailyAttendancePanel() {
  const [dateKey, setDateKey] = useState(todayLocalDateKey)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weekday, setWeekday] = useState('')
  const [students, setStudents] = useState<{
    total: number
    present: number
    absent: number
    late: number
    excused: number
    sick: number
    unmarked: number
    coded: number
    inAttendance: number
    attendanceRate: number
  } | null>(null)
  const [staff, setStaff] = useState<{
    total: number
    present: number
    absent: number
    late: number
    halfDay: number
    onLeave: number
    unmarked: number
    inAttendance: number
    attendanceRate: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiSlice
      .get<{
        success: boolean
        weekday?: string
        students?: {
          total: number
          present: number
          absent: number
          late: number
          excused: number
          sick: number
          unmarked: number
          coded: number
          inAttendance: number
          attendanceRate: number
        }
        staff?: {
          total: number
          present: number
          absent: number
          late: number
          halfDay: number
          onLeave: number
          unmarked: number
          inAttendance: number
          attendanceRate: number
        }
        message?: string
      }>(dailyAttendanceReportUrl(dateKey))
      .then((res) => {
        if (cancelled) return
        setWeekday(res.weekday || '')
        setStudents(res.students || null)
        setStaff(res.staff || null)
      })
      .catch((err) => {
        if (cancelled) return
        setStudents(null)
        setStaff(null)
        setError(err instanceof Error ? err.message : 'Failed to load daily attendance report.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [dateKey])

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Calendar className="text-emerald-600" size={20} /> Daily Attendance Summary Report
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Submitted class registers and staff roll-call for {weekday ? `${weekday} · ` : ''}{dateKey}. Unmarked names are not counted as present.
          </p>
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Report date</label>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading && !students ? (
        <div className="py-16 text-center text-slate-400 text-sm font-semibold flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading daily totals…
        </div>
      ) : students && staff ? (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Students in attendance</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">
                {students.attendanceRate}% ({students.inAttendance.toLocaleString()} / {students.total.toLocaleString()})
              </p>
              <p className="text-[11px] font-semibold text-emerald-800 mt-1">
                Present {students.present} + Late {students.late} among {students.coded} marked
              </p>
            </div>
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Late arrivals</p>
              <p className="text-2xl font-black text-amber-950 mt-1">{students.late.toLocaleString()} Students</p>
            </div>
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50">
              <p className="text-[11px] font-bold text-sky-700 uppercase">Staff present</p>
              <p className="text-2xl font-black text-sky-950 mt-1">
                {staff.attendanceRate}% ({staff.inAttendance.toLocaleString()} / {staff.total.toLocaleString()} Staff)
              </p>
              <p className="text-[11px] font-semibold text-sky-800 mt-1">
                {staff.unmarked} unmarked · {staff.late} late · {staff.onLeave} on leave
              </p>
            </div>
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50">
              <p className="text-[11px] font-bold text-rose-700 uppercase">Absent students</p>
              <p className="text-2xl font-black text-rose-950 mt-1">{students.absent.toLocaleString()} Absent</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">{students.total} students on roll</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">{students.unmarked} unmarked</span>
            <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">{students.excused + students.sick} excused / sick</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">{staff.total} staff</span>
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">{staff.absent} staff absent</span>
          </div>
        </>
      ) : null}
    </div>
  )
}

export function AttendanceManager() {
  const [activeTab, setActiveTab] = useState<AttendanceTab>('student-attendance')
  const [gateLogs] = useState<GateLog[]>([])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="text-emerald-600" size={24} /> Attendance & Gate Manager Suite
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Student & staff roll-call, daily/monthly attendance reports, and MyEduRide automated gate scanner logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('gate-manager')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <DoorOpen size={15} className="text-amber-400" /> Gate Scanner Logs
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('class-registers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'class-registers' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 size={14} /> Class Registers
        </button>

        <button
          onClick={() => setActiveTab('student-attendance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'student-attendance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={14} /> Student Attendance
        </button>

        <button
          onClick={() => setActiveTab('staff-attendance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'staff-attendance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase size={14} /> Staff Attendance
        </button>

        <button
          onClick={() => setActiveTab('daily-report')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'daily-report' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar size={14} /> Daily Attendance Report
        </button>

        <button
          onClick={() => setActiveTab('monthly-report')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'monthly-report' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={14} /> Monthly Attendance Report
        </button>

        <button
          onClick={() => setActiveTab('gate-manager')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'gate-manager' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DoorOpen size={14} /> Gate Manager Report
        </button>
      </div>

      {activeTab === 'class-registers' && <ClassRegistersPanel />}
      {activeTab === 'student-attendance' && <StudentAttendancePanel />}
      {activeTab === 'staff-attendance' && <StaffAttendancePanel />}

      {activeTab === 'daily-report' && <DailyAttendancePanel />}

      {activeTab === 'monthly-report' && <MonthlyAttendancePanel />}

      {/* TAB 5: GATE MANAGER ATTENDANCE REPORT */}
      {activeTab === 'gate-manager' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <DoorOpen size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  MyEduRide Gate Scanner Logs <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded">Live Turnstile Feed</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Automated QR / NFC RFID student & staff gate entry logs from school entrance turnstiles.</p>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Log Ref</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>ID Credential</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Gate Location</TableHead>
                <TableHead className="text-right">Gate Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No automated gate entries logged for today. Turnstiles and scanners are listening on network channels.
                  </TableCell>
                </TableRow>
              ) : (
                gateLogs.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono font-bold text-slate-800">{g.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{g.personName}</TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.role === 'Student' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{g.role}</span></TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">{g.idNumber}</TableCell>
                    <TableCell className="font-mono font-bold text-slate-900">{g.entryTime}</TableCell>
                    <TableCell className="text-xs text-slate-600">{g.gateLocation}</TableCell>
                    <TableCell className="text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        g.status === 'Verified Entry' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {g.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
