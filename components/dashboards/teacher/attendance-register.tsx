'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  UserCheck,
  Calendar,
  Save,
  Check,
  AlertCircle,
  Clock,
  UserX,
  Users,
  CircleDashed,
  Printer,
  ChevronLeft,
  ChevronRight,
  Lock,
  Keyboard,
  Search,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

const ATTENDANCE_CODES = [
  { code: 'Present', key: 'P', active: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs', print: 'P' },
  { code: 'Absent', key: 'A', active: 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs', print: 'A' },
  { code: 'Late', key: 'L', active: 'bg-amber-50 text-amber-700 border-amber-200 shadow-2xs', print: 'L' },
  { code: 'Excused', key: 'E', active: 'bg-sky-50 text-sky-700 border-sky-200 shadow-2xs', print: 'E' },
  { code: 'Sick', key: 'S', active: 'bg-violet-50 text-violet-700 border-violet-200 shadow-2xs', print: 'S' },
] as const

type AttendanceCode = (typeof ATTENDANCE_CODES)[number]['code']

const CODE_BY_KEY: Record<string, AttendanceCode> = Object.fromEntries(
  ATTENDANCE_CODES.map((item) => [item.key, item.code])
) as Record<string, AttendanceCode>

function statusTone(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "PRESENT":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "ABSENT":
      return "bg-rose-50 text-rose-700 border-rose-200"
    case "LATE":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "EXCUSED":
      return "bg-sky-50 text-sky-700 border-sky-200"
    case "SICK":
      return "bg-purple-50 text-purple-700 border-purple-200"
    default:
      return "bg-slate-50 text-slate-500 border-slate-200"
  }
}

function isMarkedStatus(status: string): status is AttendanceCode {
  return ATTENDANCE_CODES.some((item) => item.code === status)
}

function todaySchoolDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function addDays(dateKey: string, days: number): string {
  const utc = new Date(`${dateKey}T00:00:00.000Z`)
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10)
}

function formatLongDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

interface FormAllocation {
  classId: number
  className: string
  sectionId: number
  sectionName: string
  sessionId: number
}

interface RosterStudent {
  id: number
  roll: number
  registerNo: string | null
  firstName: string | null
  lastName: string | null
  gender: string | null
}

interface AttendanceRecord {
  status: string
  remark: string
}

interface RegisterMeta {
  id: number
  status: string
  version: number
  takenByTeacherName?: string | null
  submittedAt?: string | null
  canEdit?: boolean
}

interface WeekDay {
  dateKey: string
  weekdayShort: string
  isToday: boolean
  isFuture: boolean
  isHoliday?: boolean
  isSchoolDay?: boolean
  holidayTitle?: string | null
  canEdit: boolean
  register: RegisterMeta | null
  summary: { total: number; present: number; absent: number; late: number; excused: number; sick: number; unmarked: number }
}

interface AttendanceRegisterProps {
  formAllocations?: FormAllocation[]
  schoolName?: string
  teacherName?: string
}

function studentDisplayName(student: RosterStudent) {
  const last = student.lastName?.trim()
  const first = student.firstName?.trim()
  if (last && first) return `${last}, ${first}`
  return last || first || `Student #${student.id}`
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/50">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <span>Per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span>
          Showing <strong className="text-slate-900">{start}</strong>–<strong className="text-slate-900">{end}</strong> of{" "}
          <strong className="text-slate-900">{total}</strong> {noun}
        </span>
      </div>
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
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
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function recordsEqual(a: AttendanceRecord, b: AttendanceRecord) {
  return (a.status || '') === (b.status || '') && (a.remark || '') === (b.remark || '')
}

export default function AttendanceRegister({
  formAllocations = [],
  schoolName,
  teacherName,
}: AttendanceRegisterProps) {
  const [selectedFormIdx, setSelectedFormIdx] = useState(0)
  const [attendanceDate, setAttendanceDate] = useState(todaySchoolDateKey)
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, AttendanceRecord>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showUnmarkedOnly, setShowUnmarkedOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [registerMeta, setRegisterMeta] = useState<RegisterMeta | null>(null)
  const [canEdit, setCanEdit] = useState(true)
  const [calendar, setCalendar] = useState<{
    weekday: string
    isWeekend: boolean
    isFuture: boolean
    isToday: boolean
    isHoliday?: boolean
    isSchoolDay?: boolean
    holidayTitle?: string | null
  } | null>(null)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [focusedStudentId, setFocusedStudentId] = useState<number | null>(null)

  const lastSavedRef = useRef<Record<number, AttendanceRecord>>({})
  const dirtyRef = useRef(false)
  const loadGenRef = useRef(0)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightPatchRef = useRef<Promise<void> | null>(null)

  const activeForm = (formAllocations || [])[selectedFormIdx]
  const todayKey = todaySchoolDateKey()

  const summary = useMemo(() => {
    let present = 0
    let absent = 0
    let late = 0
    let excused = 0
    let sick = 0
    let unmarked = 0
    students.forEach((student) => {
      const status = attendanceRecords[student.id]?.status || ''
      if (status === 'Present') present += 1
      else if (status === 'Absent') absent += 1
      else if (status === 'Late') late += 1
      else if (status === 'Excused') excused += 1
      else if (status === 'Sick') sick += 1
      else unmarked += 1
    })
    return { total: students.length, present, absent, late, excused, sick, unmarked }
  }, [students, attendanceRecords])

  const dirty = useMemo(() => {
    return students.some((student) => {
      const current = attendanceRecords[student.id] || { status: '', remark: '' }
      const saved = lastSavedRef.current[student.id] || { status: '', remark: '' }
      return !recordsEqual(current, saved)
    })
  }, [students, attendanceRecords])

  dirtyRef.current = dirty

  const visibleStudents = useMemo(() => {
    let list = students
    if (showUnmarkedOnly) {
      list = list.filter((student) => !isMarkedStatus(attendanceRecords[student.id]?.status || ''))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((student) => {
        const name = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase()
        const roll = String(student.roll || '')
        const reg = (student.registerNo || '').toLowerCase()
        return name.includes(q) || roll.includes(q) || reg.includes(q)
      })
    }
    return list
  }, [students, attendanceRecords, showUnmarkedOnly, search])

  const totalPages = Math.max(1, Math.ceil(visibleStudents.length / pageSize))
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize
    return visibleStudents.slice(start, start + pageSize)
  }, [visibleStudents, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [search, showUnmarkedOnly, attendanceDate, selectedFormIdx])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const locked = !canEdit
  const statusLabel = registerMeta?.status || (calendar?.isFuture ? 'FUTURE' : locked ? 'LOCKED' : 'DRAFT')

  const collectDirtyEntries = useCallback(() => {
    return students
      .map((student) => {
        const current = attendanceRecords[student.id] || { status: '', remark: '' }
        const saved = lastSavedRef.current[student.id] || { status: '', remark: '' }
        if (recordsEqual(current, saved)) return null
        return { studentId: student.id, status: current.status, remark: current.remark }
      })
      .filter(Boolean) as Array<{ studentId: number; status: string; remark: string }>
  }, [students, attendanceRecords])

  const flushDraft = useCallback(async () => {
    if (!activeForm || !canEdit) return
    const entries = collectDirtyEntries()
    if (entries.length === 0) return
    if (inFlightPatchRef.current) await inFlightPatchRef.current

    const run = (async () => {
      setAutosaveState('saving')
      const res = await apiSlice.patch<{
        success: boolean
        register?: { id: number; status: string; version: number; takenByTeacherName?: string | null }
      }>(endpoints.teacher.attendanceRegisterEntries, {
        classId: activeForm.classId,
        sectionId: activeForm.sectionId,
        date: attendanceDate,
        entries,
      })
      if (res.register) {
        const nextMeta: RegisterMeta = {
          id: res.register.id,
          status: res.register.status,
          version: res.register.version,
          takenByTeacherName: res.register.takenByTeacherName ?? null,
          submittedAt: null,
          canEdit: res.register.status === 'DRAFT',
        }
        setRegisterMeta((prev) => ({
          ...nextMeta,
          takenByTeacherName: nextMeta.takenByTeacherName ?? prev?.takenByTeacherName ?? null,
          submittedAt: prev?.submittedAt ?? null,
        }))
        setWeekDays((days) =>
          days.map((day) => (day.dateKey === attendanceDate ? { ...day, register: nextMeta } : day))
        )
      }
      lastSavedRef.current = {
        ...lastSavedRef.current,
        ...Object.fromEntries(entries.map((entry) => [entry.studentId, { status: entry.status, remark: entry.remark }])),
      }
      setAutosaveState('saved')
      setError(null)
    })()

    inFlightPatchRef.current = run.finally(() => {
      inFlightPatchRef.current = null
    })
    try {
      await inFlightPatchRef.current
    } catch (err: any) {
      setAutosaveState('error')
      throw err
    }
  }, [activeForm, attendanceDate, attendanceRecords, canEdit, collectDirtyEntries])

  const loadRegister = useCallback(async (dateKey: string, formIdx: number) => {
    const form = (formAllocations || [])[formIdx]
    if (!form) return
    const gen = ++loadGenRef.current
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const [registerRes, weekRes] = await Promise.all([
        apiSlice.get<{
          success: boolean
          register: RegisterMeta | null
          roster: Array<{
            studentId: number
            roll: number
            registerNo: string | null
            firstName: string | null
            lastName: string | null
            gender: string | null
          }>
          entries: Array<{ studentId: number; status: string; remark: string | null }>
          summary: WeekDay['summary']
          calendar: {
            weekday: string
            isWeekend: boolean
            isFuture: boolean
            isToday: boolean
            isHoliday?: boolean
            isSchoolDay?: boolean
            holidayTitle?: string | null
          }
          canEdit: boolean
          today: string
        }>(
          `${endpoints.teacher.attendanceRegister}?classId=${form.classId}&sectionId=${form.sectionId}&date=${dateKey}`
        ),
        apiSlice.get<{ success: boolean; days: WeekDay[] }>(
          `${endpoints.teacher.attendanceWeek}?classId=${form.classId}&sectionId=${form.sectionId}&date=${dateKey}`
        ).catch(() => ({ success: false, days: [] as WeekDay[] })),
      ])

      if (gen !== loadGenRef.current) return

      const roster: RosterStudent[] = (registerRes.roster || []).map((row) => ({
        id: row.studentId,
        roll: row.roll,
        registerNo: row.registerNo,
        firstName: row.firstName,
        lastName: row.lastName,
        gender: row.gender,
      }))
      const initial: Record<number, AttendanceRecord> = {}
      roster.forEach((student) => {
        const found = registerRes.entries?.find((entry) => entry.studentId === student.id)
        const savedStatus = found?.status || ''
        initial[student.id] = {
          status: isMarkedStatus(savedStatus) ? savedStatus : '',
          remark: found?.remark || '',
        }
      })
      lastSavedRef.current = initial
      setStudents(roster)
      setAttendanceRecords(initial)
      setRegisterMeta(registerRes.register)
      setCanEdit(Boolean(registerRes.canEdit))
      setCalendar(registerRes.calendar)
      setWeekDays(weekRes.days || [])
      setFocusedStudentId(roster[0]?.id ?? null)
      setAutosaveState('idle')
    } catch (err: any) {
      if (gen !== loadGenRef.current) return
      setError(err.message || 'Failed to load attendance register.')
      setStudents([])
      setAttendanceRecords({})
      setRegisterMeta(null)
    } finally {
      if (gen === loadGenRef.current) setLoading(false)
    }
  }, [formAllocations])

  useEffect(() => {
    loadRegister(attendanceDate, selectedFormIdx)
  }, [attendanceDate, selectedFormIdx, loadRegister])

  useEffect(() => {
    if (!canEdit || !dirty) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      flushDraft().catch((err) => {
        setError(err.message || 'Draft autosave failed.')
      })
    }, 800)
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [attendanceRecords, canEdit, dirty, flushDraft])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const requestDateChange = async (nextDate: string) => {
    if (nextDate === attendanceDate) return
    if (canEdit && dirtyRef.current) {
      try {
        await flushDraft()
      } catch {
        const leave = window.confirm('The draft could not be saved. Change date anyway and lose unsaved marks?')
        if (!leave) return
      }
    }
    setAttendanceDate(nextDate)
  }

  const requestFormChange = async (nextIdx: number) => {
    if (nextIdx === selectedFormIdx) return
    if (canEdit && dirtyRef.current) {
      try {
        await flushDraft()
      } catch {
        const leave = window.confirm('The draft could not be saved. Switch class anyway?')
        if (!leave) return
      }
    }
    setSelectedFormIdx(nextIdx)
  }

  const setStudentStatus = (studentId: number, status: string) => {
    if (!canEdit) return
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status === status ? '' : status,
        remark: prev[studentId]?.remark || '',
      },
    }))
    setFocusedStudentId(studentId)
    setSuccess(null)
    setAutosaveState('idle')
  }

  const markRemainingPresent = () => {
    if (!canEdit) return
    setAttendanceRecords((prev) => {
      const next = { ...prev }
      students.forEach((student) => {
        const current = next[student.id] || { status: '', remark: '' }
        if (!isMarkedStatus(current.status)) {
          next[student.id] = { ...current, status: 'Present' }
        }
      })
      return next
    })
    setError(null)
    setSuccess(`Marked ${summary.unmarked} remaining student${summary.unmarked === 1 ? '' : 's'} as Present. Review, then submit.`)
  }

  const markAllPresent = () => {
    if (!canEdit) return
    setAttendanceRecords((prev) => {
      const next = { ...prev }
      students.forEach((student) => {
        next[student.id] = { status: 'Present', remark: next[student.id]?.remark || '' }
      })
      return next
    })
    setError(null)
    setSuccess('All students marked Present. Flip absentees and lates, then submit.')
  }

  const handleSubmit = async () => {
    if (!activeForm || !canEdit) return
    let markRemaining = false
    if (summary.unmarked > 0) {
      const confirmed = window.confirm(
        `This register still has ${summary.unmarked} unmarked student${summary.unmarked === 1 ? '' : 's'}. Mark remaining names Present and submit?`
      )
      if (!confirmed) {
        setError(`Submit stays locked until every student is coded, or you confirm marking the remaining ${summary.unmarked} present.`)
        return
      }
      markRemaining = true
      markRemainingPresent()
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
      await flushDraft().catch(() => null)

      const payload = students.map((student) => {
        const data = attendanceRecords[student.id] || { status: '', remark: '' }
        return { studentId: student.id, status: markRemaining && !isMarkedStatus(data.status) ? 'Present' : data.status, remark: data.remark }
      })

      const res = await apiSlice.post<{
        success: boolean
        message: string
        register?: { id: number; status: string; version: number }
      }>(endpoints.teacher.attendanceRegisterSubmit, {
        classId: activeForm.classId,
        sectionId: activeForm.sectionId,
        date: attendanceDate,
        registerId: registerMeta?.id,
        expectedVersion: registerMeta?.version,
        entries: payload,
        markRemainingPresent: markRemaining,
      })

      setSuccess('Register submitted and locked.')
      setCanEdit(false)
      if (res.register) {
        setRegisterMeta((prev) => ({
          id: res.register!.id,
          status: res.register!.status,
          version: res.register!.version,
          takenByTeacherName: prev?.takenByTeacherName ?? teacherName ?? null,
          submittedAt: new Date().toISOString(),
          canEdit: false,
        }))
      }
      lastSavedRef.current = {
        ...attendanceRecords,
        ...(markRemaining
          ? Object.fromEntries(
              students
                .filter((student) => !isMarkedStatus(attendanceRecords[student.id]?.status || ''))
                .map((student) => [student.id, { status: 'Present', remark: attendanceRecords[student.id]?.remark || '' }])
            )
          : {}),
      }
      if (markRemaining) {
        setAttendanceRecords((prev) => {
          const next = { ...prev }
          students.forEach((student) => {
            if (!isMarkedStatus(next[student.id]?.status || '')) {
              next[student.id] = { status: 'Present', remark: next[student.id]?.remark || '' }
            }
          })
          return next
        })
      }
      await loadRegister(attendanceDate, selectedFormIdx)
    } catch (err: any) {
      setError(err.message || 'Failed to submit attendance register.')
      if (String(err.message || '').toLowerCase().includes('updated elsewhere')) {
        await loadRegister(attendanceDate, selectedFormIdx)
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleTableKeyDown = (event: React.KeyboardEvent) => {
    if (!canEdit || students.length === 0) return
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return

    const currentIndex = Math.max(0, students.findIndex((student) => student.id === focusedStudentId))
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = students[Math.min(students.length - 1, currentIndex + 1)]
      setFocusedStudentId(next.id)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const next = students[Math.max(0, currentIndex - 1)]
      setFocusedStudentId(next.id)
      return
    }

    const code = CODE_BY_KEY[event.key.toUpperCase()]
    if (code) {
      event.preventDefault()
      const student = students[currentIndex] || students[0]
      setStudentStatus(student.id, code)
    }
  }

  if (!formAllocations.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm print:hidden">
        <UserCheck size={28} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-black text-slate-900">No class allocated</h3>
        <p className="text-xs font-semibold text-slate-400 mt-1 max-w-md mx-auto">
          Only the designated class teacher can take the daily class register. Ask your school admin to assign you as class teacher.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 flex-wrap">
              <UserCheck size={20} className="text-emerald-600" />
              Daily Class Register
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  statusLabel === "LOCKED" || statusLabel === "SUBMITTED"
                    ? "bg-slate-800 text-white"
                    : statusLabel === "FUTURE"
                      ? "bg-slate-100 text-slate-500"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {statusLabel === "SUBMITTED" ? "Submitted" : statusLabel}
              </span>
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {calendar?.weekday || "School day"} · {formatLongDate(attendanceDate)}
              {registerMeta?.takenByTeacherName ? ` · Taken by ${registerMeta.takenByTeacherName}` : ""}
            </p>
            <p className="hidden sm:flex text-[11px] font-semibold text-slate-400 mt-1 items-center gap-1.5">
              <Keyboard size={12} />
              Focus a row, then press P / A / L / E / S. Presence is never assumed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full xl:w-auto xl:flex-1 max-w-4xl">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Class arm</label>
              <select
                value={selectedFormIdx}
                onChange={(e) => requestFormChange(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              >
                {formAllocations.map((form, idx) => (
                  <option key={idx} value={idx}>
                    {form.className} ({form.sectionName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Attendance date</label>
              <div className="relative">
                <input
                  type="date"
                  value={attendanceDate}
                  max={todayKey}
                  onChange={(e) => requestDateChange(e.target.value)}
                  className="w-full px-3.5 py-2 pl-8 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
                <Calendar size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Search students</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, roll, admission no"
                  className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer size={13} />
                Print sheet
              </button>
            </div>
          </div>
        </div>

        {/* Week strip navigation (Mobile friendly horizontal scroll on phones, 5-col grid on sm+) */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => requestDateChange(addDays(attendanceDate, -7))}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer shrink-0"
            title="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 overflow-x-auto no-scrollbar flex sm:grid sm:grid-cols-5 gap-2 py-0.5">
            {weekDays.map((day) => {
              const selected = day.dateKey === attendanceDate
              const submitted = day.register?.status === "SUBMITTED" || day.register?.status === "LOCKED"
              const draft = day.register?.status === "DRAFT"
              const holiday = day.isHoliday && !day.isSchoolDay
              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => requestDateChange(day.dateKey)}
                  disabled={day.isFuture}
                  className={`min-w-[110px] sm:min-w-0 flex-1 rounded-xl border px-2.5 py-2 text-left transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 shrink-0 ${
                    selected
                      ? "border-blue-500 ring-2 ring-blue-100 bg-blue-50"
                      : holiday
                        ? "border-slate-200 bg-slate-100 opacity-70"
                        : submitted
                          ? "border-emerald-200 bg-emerald-50/70"
                          : draft
                            ? "border-amber-200 bg-amber-50/70"
                            : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {day.weekdayShort}
                    {day.isToday ? " · Today" : ""}
                  </div>
                  <div className="text-sm font-black text-slate-800">{formatShortDate(day.dateKey)}</div>
                  <div className={`mt-0.5 text-[10px] font-bold truncate ${
                    holiday
                      ? "text-slate-400"
                      : submitted
                        ? "text-emerald-700"
                        : draft
                          ? `${day.summary.unmarked} unmarked`
                          : day.isFuture
                            ? "Upcoming"
                            : "Not opened"
                  }`}>
                    {holiday
                      ? (day.holidayTitle || "Holiday")
                      : submitted
                        ? "Submitted"
                        : draft
                          ? `${day.summary.unmarked} unmarked`
                          : day.isFuture
                            ? "Upcoming"
                            : "Not opened"}
                  </div>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => requestDateChange(addDays(attendanceDate, 7))}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer shrink-0"
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary Metrics Badges matching Admin Attendance Manager */}
      <div className="print:hidden bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">{summary.total} on roll</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{summary.present} present</span>
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">{summary.absent} absent</span>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{summary.late} late</span>
          <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">{summary.excused} excused</span>
          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">{summary.sick} sick</span>
          <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">{summary.unmarked} unmarked</span>
          {summary.total > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 sm:ml-auto">
              {Math.round(((summary.present + summary.late) / summary.total) * 100)}% attendance rate
            </span>
          )}
        </div>
      </div>

      {/* Main Roster Container */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {error && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="m-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
            {success}
          </div>
        )}

        {locked && (
          <div className="m-4 p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 font-semibold flex items-center gap-2">
            <Lock size={14} className="text-amber-700 shrink-0" />
            {calendar?.isHoliday && !calendar.isSchoolDay
              ? "This date is marked as a holiday or non-school day on the academic calendar."
              : calendar?.isFuture
                ? "Future school days cannot be marked yet."
                : "This register is locked. Ask a school admin to unlock it with a reason if a correction is needed."}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent align-[-0.125em]" />
            <p className="text-sm font-bold text-slate-400 mt-3">Loading register roster...</p>
          </div>
        ) : students.length > 0 ? (
          <div>
            {/* Action Bar: Unmarked Only & Mark All Buttons */}
            <div className="px-4 sm:px-6 pt-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnmarkedOnly}
                    onChange={(e) => setShowUnmarkedOnly(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Unmarked only ({summary.unmarked})
                </label>
                {search && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({visibleStudents.length} of {students.length} matching)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={markAllPresent}
                  disabled={locked}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 transition cursor-pointer"
                >
                  Mark all present
                </button>
                <button
                  type="button"
                  onClick={markRemainingPresent}
                  disabled={locked || summary.unmarked === 0}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                >
                  Mark remaining present
                </button>
              </div>
            </div>

            {/* MOBILE CARD VIEW: Touch-friendly cards tailored for mobile phone screens */}
            <div className="md:hidden divide-y divide-slate-100" tabIndex={0} onKeyDown={handleTableKeyDown}>
              {visibleStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  No students match your filter criteria.
                </div>
              ) : (
                paginatedStudents.map((student) => {
                  const record = attendanceRecords[student.id] || { status: "", remark: "" }
                  const status = record.status
                  const unmarked = !isMarkedStatus(status)
                  const tone = statusTone(status)

                  return (
                    <div
                      key={student.id}
                      onClick={() => setFocusedStudentId(student.id)}
                      className={`p-4 transition ${
                        unmarked ? "bg-amber-50/20" : "bg-white"
                      }`}
                    >
                      {/* Student info & Current Status Pill */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {student.roll || "—"}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                              {studentDisplayName(student)}
                            </h4>
                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                              {student.registerNo || "No reg"}
                              {student.gender ? ` · ${student.gender}` : ""}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${tone}`}>
                          {status || "UNMARKED"}
                        </span>
                      </div>

                      {/* Touch-Friendly Quick Mark Action Strip */}
                      <div className="mt-3 flex gap-1.5">
                        {ATTENDANCE_CODES.map((item) => {
                          const isSelected = (status || "").toUpperCase() === item.code.toUpperCase()
                          return (
                            <button
                              key={item.code}
                              type="button"
                              disabled={locked}
                              onClick={(e) => {
                                e.stopPropagation()
                                setStudentStatus(student.id, item.code)
                              }}
                              className={`flex-1 py-2 text-xs font-bold rounded-xl border text-center transition cursor-pointer disabled:opacity-40 active:scale-95 ${
                                isSelected
                                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {item.code}
                            </button>
                          )
                        })}
                      </div>

                      {/* Remark Input Field */}
                      <div className="mt-2.5">
                        <input
                          type="text"
                          value={record.remark}
                          disabled={locked}
                          onChange={(e) => {
                            if (!canEdit) return
                            setAttendanceRecords((prev) => ({
                              ...prev,
                              [student.id]: { status: prev[student.id]?.status || "", remark: e.target.value },
                            }))
                            setAutosaveState("idle")
                          }}
                          placeholder="Add remark (optional)..."
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* DESKTOP TABLE VIEW: Clean table for tablets and desktop screens */}
            <div className="hidden md:block overflow-x-auto" tabIndex={0} onKeyDown={handleTableKeyDown}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[10.5px] uppercase tracking-wider">
                    <th className="px-4 py-3.5 w-16">Roll</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Student Name</th>
                    <th className="px-4 py-3.5 w-28">Admission No</th>
                    <th className="px-4 py-3.5 w-32">Status</th>
                    <th className="px-4 py-3.5">Quick Mark</th>
                    <th className="px-4 py-3.5 w-64">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-medium text-xs">
                        No students match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => {
                      const record = attendanceRecords[student.id] || { status: "", remark: "" }
                      const status = record.status
                      const unmarked = !isMarkedStatus(status)
                      const focused = focusedStudentId === student.id
                      const tone = statusTone(status)

                      return (
                        <tr
                          key={student.id}
                          onClick={() => setFocusedStudentId(student.id)}
                          className={`transition ${
                            focused ? "bg-blue-50/70" : unmarked ? "bg-slate-50/80" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <td className="px-4 py-3 text-xs font-bold text-slate-500 font-mono">{student.roll || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-extrabold text-slate-800">{studentDisplayName(student)}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">
                              {student.gender || "Student"}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{student.registerNo || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${tone}`}>
                              {status || "UNMARKED"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {ATTENDANCE_CODES.map((item) => (
                                <button
                                  type="button"
                                  key={item.code}
                                  disabled={locked}
                                  onClick={() => setStudentStatus(student.id, item.code)}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition ${
                                    (status || "").toUpperCase() === item.code.toUpperCase()
                                      ? "bg-slate-900 text-white"
                                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {item.code}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={record.remark}
                              disabled={locked}
                              onChange={(e) => {
                                if (!canEdit) return
                                setAttendanceRecords((prev) => ({
                                  ...prev,
                                  [student.id]: { status: prev[student.id]?.status || "", remark: e.target.value },
                                }))
                                setAutosaveState("idle")
                              }}
                              placeholder="Optional remark"
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {visibleStudents.length > 0 && (
              <PaginationBar
                page={page}
                pageSize={pageSize}
                total={visibleStudents.length}
                totalPages={totalPages}
                noun="students"
                onPage={setPage}
                onPageSize={(size) => {
                  setPageSize(size)
                  setPage(1)
                }}
              />
            )}

            {/* Bottom Sticky Action Bar */}
            <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white sticky bottom-0 z-10">
              <p className="text-[11px] font-semibold text-slate-500">
                {locked
                  ? "Locked register — print a copy for the office file."
                  : summary.unmarked > 0
                    ? `${summary.unmarked} unmarked · ${summary.present} present · ${summary.absent} absent · ${summary.late} late`
                    : "All students coded. You can submit and lock this register."}
                {canEdit && (
                  <span className="ml-2 font-bold">
                    {autosaveState === "saving" && <span className="text-blue-600">Saving draft…</span>}
                    {autosaveState === "saved" && <span className="text-emerald-600">✓ Draft saved</span>}
                    {autosaveState === "error" && <span className="text-rose-600">⚠ Draft save failed</span>}
                    {autosaveState === "idle" && dirty && <span className="text-amber-600">• Unsaved changes</span>}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  <Printer size={14} />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || locked}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                      Submitting…
                    </>
                  ) : locked ? (
                    <>
                      <Lock size={14} />
                      Locked
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Submit & lock
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 italic font-semibold">
            No students registered in this room.
          </div>
        )}
      </div>

      <div className="hidden print:block text-black">
        <div className="border-b-2 border-black pb-3 mb-4">
          <div className="text-xs uppercase tracking-widest font-bold">Daily class register</div>
          <div className="text-xl font-black">{schoolName || 'School'}</div>
          <div className="mt-1 text-sm font-semibold">
            {activeForm?.className} ({activeForm?.sectionName}) · {formatLongDate(attendanceDate)}
          </div>
          <div className="text-xs mt-1">
            Taken by: {registerMeta?.takenByTeacherName || teacherName || 'Class teacher'} · Status: {statusLabel}
          </div>
        </div>
        <div className="text-[11px] mb-3 font-semibold">
          Codes: P Present · A Absent · L Late · E Excused · S Sick · — Unmarked
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="border border-black px-2 py-1 text-left w-12">Roll</th>
              <th className="border border-black px-2 py-1 text-left">Name</th>
              <th className="border border-black px-2 py-1 text-left w-16">Gender</th>
              <th className="border border-black px-2 py-1 text-left w-14">Code</th>
              <th className="border border-black px-2 py-1 text-left">Remark</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const record = attendanceRecords[student.id] || { status: '', remark: '' }
              const code = ATTENDANCE_CODES.find((item) => item.code === record.status)?.print || '—'
              return (
                <tr key={student.id}>
                  <td className="border border-black px-2 py-1">{student.roll || ''}</td>
                  <td className="border border-black px-2 py-1">{studentDisplayName(student)}</td>
                  <td className="border border-black px-2 py-1">{student.gender || ''}</td>
                  <td className="border border-black px-2 py-1 font-bold">{code}</td>
                  <td className="border border-black px-2 py-1">{record.remark}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="mt-4 text-xs font-semibold">
          Present {summary.present} · Absent {summary.absent} · Late {summary.late} · Excused {summary.excused} · Sick {summary.sick} · Unmarked {summary.unmarked} · On roll {summary.total}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-16 text-sm">
          <div>
            <div className="border-b border-black h-10" />
            <div className="mt-1 text-xs">Class teacher signature</div>
          </div>
          <div>
            <div className="border-b border-black h-10" />
            <div className="mt-1 text-xs">Office / HOD signature</div>
          </div>
        </div>
      </div>
    </div>
  )
}
