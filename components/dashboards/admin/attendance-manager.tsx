'use client'

import React, { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  CheckSquare,
  CalendarDays,
  CalendarRange,
  FileSpreadsheet,
  Save,
  Loader2,
  AlertCircle,
  Search,
  Briefcase,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import AttendanceRegister from '@/components/dashboards/teacher/attendance-register'
import TeacherDailyAttendance from '@/components/dashboards/teacher/teacher-daily-attendance'
import TeacherMonthlyAttendance from '@/components/dashboards/teacher/teacher-monthly-attendance'
import TeacherTermlyAttendance from '@/components/dashboards/teacher/teacher-termly-attendance'
import { getLagosDateKey } from '@/lib/dateUtils'

export type AdminAttendanceTab = 'register' | 'daily' | 'monthly' | 'termly' | 'staff' | 'gate'

interface FormAllocation {
  classId: number
  className: string
  sectionId: number
  sectionName: string
  sessionId?: number
}

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

function todayLocalDateKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

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

interface AttendanceManagerProps {
  initialTab?: AdminAttendanceTab
  schoolName?: string
  adminName?: string
}

export function AttendanceManager({
  initialTab = 'register',
  schoolName,
  adminName,
}: AttendanceManagerProps = {}) {
  const [activeTab, setActiveTab] = useState<AdminAttendanceTab>(initialTab)
  const [formAllocations, setFormAllocations] = useState<FormAllocation[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  // For reports (daily, monthly, termly), -1 represents "All Classes (School-Wide)"
  // For Mark Roll Call (register), we clamp to >= 0 so a specific class register is loaded
  const [selectedFormIdx, setSelectedFormIdx] = useState<number>(0)
  const [gateLogs] = useState<GateLog[]>([])

  // Synchronize initialTab when sidebar navigation changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Common date states (identical to Teacher AttendanceHub)
  const [currentDate, setCurrentDate] = useState<string>(() => getLagosDateKey())
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const today = getLagosDateKey()
    return today.slice(0, 7) // 'YYYY-MM'
  })
  const [currentTermId, setCurrentTermId] = useState<number>(1)

  // Load all classes & arms for the school so Admin can inspect or mark any class
  useEffect(() => {
    let cancelled = false
    setLoadingClasses(true)
    apiSlice
      .get<{ success: boolean; classes: ClassOption[] }>(endpoints.admin.classesSections)
      .then((res) => {
        if (cancelled) return
        const list: FormAllocation[] = []
        for (const cls of res.classes || []) {
          const secs = cls.sections || []
          for (const s of secs) {
            if (s.section) {
              list.push({
                classId: cls.id,
                className: cls.name,
                sectionId: s.section.id,
                sectionName: s.section.name,
              })
            }
          }
        }
        setFormAllocations(list)
      })
      .catch((err) => {
        console.error('[ADMIN_ATTENDANCE_CLASSES] Failed to load classes:', err)
      })
      .finally(() => {
        if (!cancelled) setLoadingClasses(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const tabs: { id: AdminAttendanceTab; label: string; icon: React.ElementType; badge?: string }[] = [
    {
      id: 'register',
      label: 'Mark Roll Call',
      icon: CheckSquare,
      badge: 'Live',
    },
    {
      id: 'daily',
      label: 'Daily Report',
      icon: CalendarDays,
    },
    {
      id: 'monthly',
      label: 'Monthly Report',
      icon: CalendarRange,
    },
    {
      id: 'termly',
      label: 'Termly Broadsheet',
      icon: FileSpreadsheet,
    },
    {
      id: 'staff',
      label: 'Staff Attendance',
      icon: Briefcase,
    },
    {
      id: 'gate',
      label: 'Gate Scanner',
      icon: DoorOpen,
    },
  ]

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Sub-menu Navigation Bar (same layout & experience as Class Teacher AttendanceHub) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Attendance Intelligence &amp; Reports
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                All Classes Access
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              School-wide &amp; class-by-class roll call register, daily highlighted signals, monthly 1..31 calendar grid, termly broadsheets, and staff attendance.
            </p>
          </div>

          {/* Sub-menu Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {loadingClasses && (activeTab === 'register' || activeTab === 'daily' || activeTab === 'monthly' || activeTab === 'termly') ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading school classes &amp; attendance streams...</span>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: MARK ROLL CALL (Same as Class Teacher + Any Class Selector + Admin Unlock) */}
          {activeTab === 'register' && (
            <AttendanceRegister
              formAllocations={formAllocations}
              schoolName={schoolName}
              teacherName={adminName || 'School Administrator'}
              selectedFormIdx={selectedFormIdx >= 0 ? selectedFormIdx : 0}
              onSelectFormIdx={setSelectedFormIdx}
              isAdmin
            />
          )}

          {/* TAB 2: DAILY REPORT (Same as Class Teacher + All Classes or Any Class Selector) */}
          {activeTab === 'daily' && (
            <TeacherDailyAttendance
              formAllocations={formAllocations}
              selectedFormIdx={selectedFormIdx}
              onSelectFormIdx={setSelectedFormIdx}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              isAdmin
            />
          )}

          {/* TAB 3: MONTHLY REPORT (Same as Class Teacher + All Classes or Any Class Selector) */}
          {activeTab === 'monthly' && (
            <TeacherMonthlyAttendance
              formAllocations={formAllocations}
              selectedFormIdx={selectedFormIdx}
              onSelectFormIdx={setSelectedFormIdx}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              isAdmin
            />
          )}

          {/* TAB 4: TERMLY BROADSHEET (Same as Class Teacher + All Classes or Any Class Selector) */}
          {activeTab === 'termly' && (
            <TeacherTermlyAttendance
              formAllocations={formAllocations}
              selectedFormIdx={selectedFormIdx}
              onSelectFormIdx={setSelectedFormIdx}
              currentTermId={currentTermId}
              onTermChange={setCurrentTermId}
              isAdmin
            />
          )}
        </>
      )}

      {/* TAB 5: STAFF ATTENDANCE */}
      {activeTab === 'staff' && <StaffAttendancePanel />}

      {/* TAB 6: GATE MANAGER ATTENDANCE REPORT */}
      {activeTab === 'gate' && (
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
                <p className="text-xs text-slate-500 font-medium">Automated QR / NFC RFID student &amp; staff gate entry logs from school entrance turnstiles.</p>
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
