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
    if (!showUnmarkedOnly) return students
    return students.filter((student) => !isMarkedStatus(attendanceRecords[student.id]?.status || ''))
  }, [students, attendanceRecords, showUnmarkedOnly])

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
        <h3 className="text-base font-black text-slate-900">No form class allocated</h3>
        <p className="text-xs font-semibold text-slate-400 mt-1 max-w-md mx-auto">
          Only the designated form teacher can take the daily class register. Ask your school admin to assign you as class teacher.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 flex-wrap">
              <UserCheck size={20} className="text-emerald-600" />
              Daily Class Register
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  statusLabel === 'LOCKED' || statusLabel === 'SUBMITTED'
                    ? 'bg-slate-800 text-white'
                    : statusLabel === 'FUTURE'
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-amber-100 text-amber-700'
                }`}
              >
                {statusLabel === 'SUBMITTED' ? 'Submitted' : statusLabel}
              </span>
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {calendar?.weekday || 'School day'} · {formatLongDate(attendanceDate)}
              {registerMeta?.takenByTeacherName ? ` · Taken by ${registerMeta.takenByTeacherName}` : ''}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
              <Keyboard size={12} />
              Focus a row, then press P / A / L / E / S. Presence is never assumed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Form class</label>
              <select
                value={selectedFormIdx}
                onChange={(e) => requestFormChange(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {formAllocations.map((form, idx) => (
                  <option key={idx} value={idx}>
                    {form.className} ({form.sectionName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={attendanceDate}
                  max={todayKey}
                  onChange={(e) => requestDateChange(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none pl-8"
                />
                <Calendar size={14} className="absolute left-2.5 top-2 text-slate-400" />
              </div>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="mt-5 px-3 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} />
              Print sheet
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => requestDateChange(addDays(attendanceDate, -7))}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
            title="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 grid grid-cols-5 gap-2">
            {weekDays.map((day) => {
              const selected = day.dateKey === attendanceDate
              const submitted = day.register?.status === 'SUBMITTED' || day.register?.status === 'LOCKED'
              const draft = day.register?.status === 'DRAFT'
              const holiday = day.isHoliday && !day.isSchoolDay
              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => requestDateChange(day.dateKey)}
                  disabled={day.isFuture}
                  className={`rounded-xl border px-2 py-2.5 text-left transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${
                    selected
                      ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50'
                      : holiday
                        ? 'border-slate-200 bg-slate-100 opacity-70'
                        : submitted
                          ? 'border-emerald-200 bg-emerald-50/70'
                          : draft
                            ? 'border-amber-200 bg-amber-50/70'
                            : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {day.weekdayShort}
                    {day.isToday ? ' · Today' : ''}
                  </div>
                  <div className="text-sm font-black text-slate-800">{formatShortDate(day.dateKey)}</div>
                  <div className={`mt-1 text-[10px] font-bold ${
                    holiday ? 'text-slate-400' : submitted ? 'text-emerald-700' : draft ? 'text-amber-700' : day.isFuture ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {holiday
                      ? (day.holidayTitle || 'Holiday')
                      : submitted
                        ? 'Submitted'
                        : draft
                          ? `${day.summary.unmarked} unmarked`
                          : day.isFuture
                            ? 'Upcoming'
                            : 'Not opened'}
                  </div>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => requestDateChange(addDays(attendanceDate, 7))}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="print:hidden grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'On roll', value: summary.total, icon: Users, tone: 'text-slate-600' },
          { label: 'Unmarked', value: summary.unmarked, icon: CircleDashed, tone: 'text-slate-500' },
          { label: 'Present', value: summary.present, icon: UserCheck, tone: 'text-emerald-600' },
          { label: 'Absent', value: summary.absent, icon: UserX, tone: 'text-rose-600' },
          { label: 'Late', value: summary.late, icon: Clock, tone: 'text-amber-600' },
          { label: 'Excused / sick', value: summary.excused + summary.sick, icon: Check, tone: 'text-sky-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <card.icon size={16} className={card.tone} />
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{card.label}</div>
              <div className="text-lg font-black text-slate-800">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="print:hidden bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {error && (
          <div className="m-6 mb-0 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="m-6 mb-0 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2.5">
            <Check size={16} />
            {success}
          </div>
        )}
        {locked && !loading && (
          <div className="m-6 mb-0 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold flex items-center gap-2.5">
            <Lock size={16} />
            {calendar?.isHoliday && !calendar.isSchoolDay
              ? `${calendar.holidayTitle || 'School holiday'} — no daily register.`
              : calendar?.isWeekend && !calendar.isSchoolDay
                ? 'Weekends are not school days unless marked as a special school day on the calendar.'
                : calendar?.isFuture
                  ? 'Future school days cannot be marked yet.'
                  : 'This register is locked. Ask a school admin to unlock it with a reason if a correction is needed.'}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent align-[-0.125em]" />
            <p className="text-sm font-bold text-slate-400 mt-3">Loading register roster...</p>
          </div>
        ) : students.length > 0 ? (
          <div>
            <div className="px-6 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-500">
                Paper-register workflow: mark all present, then flip absentees, lates, excused, and sick.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnmarkedOnly}
                    onChange={(e) => setShowUnmarkedOnly(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Unmarked only
                </label>
                <button
                  type="button"
                  onClick={markAllPresent}
                  disabled={locked}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 transition cursor-pointer"
                >
                  Mark all present
                </button>
                <button
                  type="button"
                  onClick={markRemainingPresent}
                  disabled={locked || summary.unmarked === 0}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                >
                  Mark remaining present
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-3" tabIndex={0} onKeyDown={handleTableKeyDown}>
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[10.5px] uppercase tracking-wider">
                    <th className="px-4 py-3.5 sticky left-0 bg-slate-50 z-10 w-16">Roll</th>
                    <th className="px-4 py-3.5 sticky left-16 bg-slate-50 z-10 min-w-[180px]">Student</th>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5 w-72">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleStudents.map((student) => {
                    const record = attendanceRecords[student.id] || { status: '', remark: '' }
                    const unmarked = !isMarkedStatus(record.status)
                    const focused = focusedStudentId === student.id
                    return (
                      <tr
                        key={student.id}
                        onClick={() => setFocusedStudentId(student.id)}
                        className={`transition ${
                          focused ? 'bg-blue-50/70' : unmarked ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="px-4 py-3 text-xs font-bold text-slate-500 sticky left-0 bg-inherit">{student.roll || '—'}</td>
                        <td className="px-4 py-3 sticky left-16 bg-inherit min-w-[180px]">
                          <div className="text-sm font-extrabold text-slate-800">{studentDisplayName(student)}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">
                            {student.registerNo || 'No reg'}
                            {student.gender ? ` · ${student.gender}` : ''}
                            {unmarked ? ' · Unmarked' : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {ATTENDANCE_CODES.map((item) => (
                              <button
                                type="button"
                                key={item.code}
                                disabled={locked}
                                onClick={() => setStudentStatus(student.id, item.code)}
                                className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg border transition disabled:opacity-50 ${
                                  record.status === item.code
                                    ? item.active
                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                }`}
                                title={`${item.code} (${item.key})`}
                              >
                                <span className="sm:hidden">{item.key}</span>
                                <span className="hidden sm:inline">{item.code}</span>
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
                                [student.id]: { status: prev[student.id]?.status || '', remark: e.target.value },
                              }))
                              setAutosaveState('idle')
                            }}
                            placeholder="Optional (sick, permission, minutes late)"
                            className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white sticky bottom-0">
              <p className="text-[11px] font-semibold text-slate-500">
                {locked
                  ? 'Locked register — print a copy for the office file.'
                  : summary.unmarked > 0
                    ? `${summary.unmarked} unmarked · ${summary.present} present · ${summary.absent} absent · ${summary.late} late`
                    : 'All students coded. You can submit and lock this register.'}
                {canEdit && (
                  <span className="ml-2 text-slate-400">
                    {autosaveState === 'saving' && 'Saving draft…'}
                    {autosaveState === 'saved' && 'Draft saved'}
                    {autosaveState === 'error' && 'Draft save failed'}
                    {autosaveState === 'idle' && dirty && 'Unsaved changes'}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  <Printer size={14} />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || locked}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 rounded-xl shadow-xs transition cursor-pointer"
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
            Taken by: {registerMeta?.takenByTeacherName || teacherName || 'Form teacher'} · Status: {statusLabel}
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
            <div className="mt-1 text-xs">Form teacher signature</div>
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
