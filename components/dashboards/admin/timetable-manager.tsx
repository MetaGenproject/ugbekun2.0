'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Loader2,
  BookOpen,
  Coffee,
  Sun,
  AlertCircle,
  X,
  Check,
  CheckCircle2,
  User,
  School,
  Layers,
  Wand2,
  UserCheck,
  Bot,
  FileText,
  Share2,
  Globe,
  Eye,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

interface AcademicSession {
  id: number
  name: string
}

interface ClassData {
  id: number
  name: string
  sections: { section: { id: number; name: string } }[]
}

interface SubjectData {
  id: number
  name: string
  subjectCode: string
}

interface TeacherData {
  id: number
  name: string
  email?: string
}

interface SubjectAssignData {
  id: number
  classId: number
  sectionId?: number | null
  subjectId: number
  teacherId: number
  sessionId?: number | null
  teacher?: { id: number; name: string; email?: string }
  subject?: { id: number; name: string; subjectCode?: string }
}

interface TimetableSlotData {
  id: number
  dayOfWeek: string
  startTime: string
  endTime: string
  type: 'SUBJECT' | 'ASSEMBLY' | 'BREAK'
  title?: string | null
  classId: number
  sectionId?: number | null
  subjectId?: number | null
  teacherId?: number | null
  sessionId?: number | null
  isPublished?: boolean
  class?: { id: number; name: string }
  section?: { id: number; name: string }
  subject?: { id: number; name: string; subjectCode?: string }
  teacher?: { id: number; name: string }
}

type TimetableTab = 'class-timetable' | 'teacher-timetable' | 'ai-generator'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
}

const COMMON_TIME_SLOTS = [
  { start: '08:00', end: '08:30', label: '08:00 - 08:30 (Assembly / Homeroom)' },
  { start: '08:30', end: '09:15', label: '08:30 - 09:15 (Period 1)' },
  { start: '09:15', end: '10:00', label: '09:15 - 10:00 (Period 2)' },
  { start: '10:00', end: '10:45', label: '10:00 - 10:45 (Period 3)' },
  { start: '10:45', end: '11:15', label: '10:45 - 11:15 (Recess / Break)' },
  { start: '11:15', end: '12:00', label: '11:15 - 12:00 (Period 4)' },
  { start: '12:00', end: '12:45', label: '12:00 - 12:45 (Period 5)' },
  { start: '12:45', end: '13:30', label: '12:45 - 13:30 (Period 6)' },
  { start: '13:30', end: '14:15', label: '13:30 - 14:15 (Period 7)' },
]

export function TimetableManager() {
  const [activeTab, setActiveTab] = useState<TimetableTab>('class-timetable')

  // Core Data
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [teachers, setTeachers] = useState<TeacherData[]>([])

  // Filter States
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  // Timetable State
  const [isPublished, setIsPublished] = useState<boolean>(false)
  const [slotsGrouped, setSlotsGrouped] = useState<Record<string, TimetableSlotData[]>>({
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
  })
  const [teacherSlotsGrouped, setTeacherSlotsGrouped] = useState<Record<string, TimetableSlotData[]>>({
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
  })

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // AI Generator State
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [aiAssemblyStart, setAiAssemblyStart] = useState('08:00')
  const [aiAssemblyEnd, setAiAssemblyEnd] = useState('08:30')
  const [aiBreakStart, setAiBreakStart] = useState('10:45')
  const [aiBreakEnd, setAiBreakEnd] = useState('11:15')
  const [aiPeriodDuration, setAiPeriodDuration] = useState('45')
  const [aiResultCount, setAiResultCount] = useState<number | null>(null)

  // Slot Create / Edit Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  const [slotModalMode, setSlotModalMode] = useState<'create' | 'edit'>('create')
  const [slotId, setSlotId] = useState<number | null>(null)
  const [modalClassId, setModalClassId] = useState<string>('')
  const [modalSectionId, setModalSectionId] = useState<string>('')
  const [dayOfWeek, setDayOfWeek] = useState<string>('MONDAY')
  const [startTime, setStartTime] = useState('08:30')
  const [endTime, setEndTime] = useState('09:15')
  const [slotType, setSlotType] = useState<'SUBJECT' | 'ASSEMBLY' | 'BREAK'>('SUBJECT')
  const [slotTitle, setSlotTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignData[]>([])
  const [showAllTeachers, setShowAllTeachers] = useState(false)
  const [isSavingSlot, setIsSavingSlot] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Teachers assigned to currently selected subject in modal
  const assignedTeachersForSubject = useMemo(() => {
    if (!subjectId) return []
    const numSubId = Number(subjectId)
    const targetClassId = Number(modalClassId || selectedClassId)

    // 1. Try matching class + subject
    const classMatches = subjectAssignments.filter(
      (a) => a.subjectId === numSubId && a.classId === targetClassId && a.teacher
    )
    if (classMatches.length > 0) {
      const map = new Map<number, TeacherData>()
      classMatches.forEach((a) => {
        if (a.teacher) map.set(a.teacher.id, { id: a.teacher.id, name: a.teacher.name })
      })
      return Array.from(map.values())
    }

    // 2. Fallback: match subject across any class in the school
    const anyMatches = subjectAssignments.filter((a) => a.subjectId === numSubId && a.teacher)
    if (anyMatches.length > 0) {
      const map = new Map<number, TeacherData>()
      anyMatches.forEach((a) => {
        if (a.teacher) map.set(a.teacher.id, { id: a.teacher.id, name: a.teacher.name })
      })
      return Array.from(map.values())
    }

    return []
  }, [subjectId, modalClassId, selectedClassId, subjectAssignments])

  // Subject change handler with automatic teacher selection
  const handleSubjectChange = (newSubId: string) => {
    setSubjectId(newSubId)
    setShowAllTeachers(false)

    if (!newSubId) return
    const numSubId = Number(newSubId)
    const targetClassId = Number(modalClassId || selectedClassId)

    const classMatches = subjectAssignments.filter(
      (a) => a.subjectId === numSubId && a.classId === targetClassId && a.teacher
    )
    if (classMatches.length > 0 && classMatches[0].teacher) {
      setTeacherId(String(classMatches[0].teacher.id))
      return
    }

    const anyMatches = subjectAssignments.filter((a) => a.subjectId === numSubId && a.teacher)
    if (anyMatches.length > 0 && anyMatches[0].teacher) {
      setTeacherId(String(anyMatches[0].teacher.id))
      return
    }

    // If no assigned teacher found, keep existing teacher or default to first teacher
    if (!teacherId && teachers.length > 0) {
      setTeacherId(String(teachers[0].id))
    }
  }

  // Initial Load
  useEffect(() => {
    loadSetupData()
  }, [])

  // Refetch when class/section/session changes
  useEffect(() => {
    if (selectedClassId) {
      fetchTimetable()
    }
  }, [selectedClassId, selectedSectionId, selectedSessionId])

  // Refetch teacher timetable when teacher/session changes
  useEffect(() => {
    if (selectedTeacherId && activeTab === 'teacher-timetable') {
      fetchTeacherTimetable()
    }
  }, [selectedTeacherId, selectedSessionId, activeTab])

  const loadSetupData = async () => {
    try {
      const [sessionRes, classRes, subjectRes, staffRes] = await Promise.all([
        apiSlice.get<{ success: boolean; sessions: AcademicSession[] }>(endpoints.admin.timetableSessions).catch(() => ({ success: false, sessions: [] })),
        apiSlice.get<{ success: boolean; classes: ClassData[] }>(endpoints.admin.classesSections),
        apiSlice.get<{ success: boolean; subjects: SubjectData[] }>(endpoints.admin.subjects),
        apiSlice.get<{ success: boolean; data: { teachers: TeacherData[] } }>(endpoints.admin.teachersStaff),
      ])

      // Sessions
      if (sessionRes.success && sessionRes.sessions && sessionRes.sessions.length > 0) {
        setSessions(sessionRes.sessions)
        setSelectedSessionId(String(sessionRes.sessions[0].id))
      } else {
        const defaultSessions: AcademicSession[] = [
          { id: 1, name: '2025/2026 Academic Session' },
          { id: 2, name: '2024/2025 Academic Session' },
        ]
        setSessions(defaultSessions)
        setSelectedSessionId(String(defaultSessions[0].id))
      }

      // Classes
      if (classRes.success && classRes.classes) {
        setClasses(classRes.classes)
        if (classRes.classes.length > 0) {
          const firstClass = classRes.classes[0]
          setSelectedClassId(String(firstClass.id))
          setModalClassId(String(firstClass.id))
          if (firstClass.sections && firstClass.sections.length > 0) {
            setSelectedSectionId(String(firstClass.sections[0].section.id))
            setModalSectionId(String(firstClass.sections[0].section.id))
          }
        }
      }

      // Subjects & Subject Assignments
      if (subjectRes.success && subjectRes.subjects) {
        setSubjects(subjectRes.subjects)
        if (subjectRes.subjects.length > 0) {
          setSubjectId(String(subjectRes.subjects[0].id))
        }
        if ((subjectRes as any).assignments && Array.isArray((subjectRes as any).assignments)) {
          setSubjectAssignments((subjectRes as any).assignments)
        }
      }

      // Teachers
      if (staffRes.success && staffRes.data?.teachers) {
        setTeachers(staffRes.data.teachers)
        if (staffRes.data.teachers.length > 0) {
          setSelectedTeacherId(String(staffRes.data.teachers[0].id))
          setTeacherId(String(staffRes.data.teachers[0].id))
        }
      }
    } catch (err) {
      console.error('Failed to load setup data for timetable:', err)
    }
  }

  const fetchTimetable = async () => {
    if (!selectedClassId) return
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const classIdNum = Number(selectedClassId)
      const sectionIdNum = selectedSectionId ? Number(selectedSectionId) : undefined
      const sessionIdNum = selectedSessionId ? Number(selectedSessionId) : undefined

      const res = await apiSlice.get<{
        success: boolean
        slots: TimetableSlotData[]
        grouped: Record<string, TimetableSlotData[]>
        isPublished?: boolean
        subjectAssignments?: SubjectAssignData[]
      }>(endpoints.admin.timetable(classIdNum, sectionIdNum, undefined, sessionIdNum))

      if (res.success) {
        setSlotsGrouped(res.grouped || { MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [], FRIDAY: [] })
        setIsPublished(Boolean(res.isPublished))
        if (res.subjectAssignments && res.subjectAssignments.length > 0) {
          setSubjectAssignments(res.subjectAssignments)
        }
      }
    } catch (err: any) {
      setErrorMsg('Failed to load timetable for selected classroom.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeacherTimetable = async () => {
    if (!selectedTeacherId) return
    setIsLoading(true)

    try {
      const teacherIdNum = Number(selectedTeacherId)
      const sessionIdNum = selectedSessionId ? Number(selectedSessionId) : undefined

      const res = await apiSlice.get<{
        success: boolean
        slots: TimetableSlotData[]
        grouped: Record<string, TimetableSlotData[]>
      }>(endpoints.admin.timetable(undefined, undefined, teacherIdNum, sessionIdNum))

      if (res.success) {
        setTeacherSlotsGrouped(res.grouped || { MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [], FRIDAY: [] })
      }
    } catch (err) {
      console.error('Failed to load teacher timetable:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Publish / Unpublish Action
  const handleTogglePublish = async () => {
    if (!selectedClassId) return
    setIsPublishing(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const newPublishedState = !isPublished
      const payload = {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        sessionId: selectedSessionId ? Number(selectedSessionId) : undefined,
        isPublished: newPublishedState,
      }

      const res = await apiSlice.post<{ success: boolean; isPublished: boolean; message: string; count: number }>(
        endpoints.admin.timetablePublish,
        payload
      )

      if (res.success) {
        setIsPublished(res.isPublished)
        setSuccessMsg(res.message)
        setTimeout(() => setSuccessMsg(null), 6000)
      } else {
        setErrorMsg('Failed to update timetable publication status.')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to publish timetable.')
    } finally {
      setIsPublishing(false)
    }
  }

  // AI Timetable Generator
  const handleRunAiTimetable = async () => {
    if (!selectedClassId) return
    setIsAiGenerating(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    setAiResultCount(null)

    try {
      const payload = {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        sessionId: selectedSessionId ? Number(selectedSessionId) : undefined,
        assemblyStartTime: aiAssemblyStart,
        assemblyEndTime: aiAssemblyEnd,
        breakStartTime: aiBreakStart,
        breakEndTime: aiBreakEnd,
        periodDuration: Number(aiPeriodDuration) || 45,
      }

      const res = await apiSlice.post<{
        success: boolean
        message: string
        slots: TimetableSlotData[]
        isPublished: boolean
      }>(endpoints.admin.timetableAiGenerate, payload)

      if (res.success) {
        setAiResultCount(res.slots?.length || 0)
        setIsPublished(false)
        setSuccessMsg(res.message)
        await fetchTimetable()
      } else {
        setErrorMsg(res.message || 'Failed to generate timetable.')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred during AI Timetable generation.')
    } finally {
      setIsAiGenerating(false)
    }
  }

  // Open Create Modal
  const openCreateModal = (day: string = 'MONDAY', defaultStart = '08:30', defaultEnd = '09:15') => {
    setSlotModalMode('create')
    setSlotId(null)
    setDayOfWeek(day)
    setStartTime(defaultStart)
    setEndTime(defaultEnd)
    setSlotType('SUBJECT')
    setSlotTitle('')
    setModalClassId(selectedClassId)
    setModalSectionId(selectedSectionId)
    setShowAllTeachers(false)

    const initialSubId = subjects.length > 0 ? String(subjects[0].id) : ''
    setSubjectId(initialSubId)

    if (initialSubId) {
      const numSubId = Number(initialSubId)
      const targetClassId = Number(selectedClassId)
      const classMatches = subjectAssignments.filter(
        (a) => a.subjectId === numSubId && a.classId === targetClassId && a.teacher
      )
      if (classMatches.length > 0 && classMatches[0].teacher) {
        setTeacherId(String(classMatches[0].teacher.id))
      } else {
        const anyMatches = subjectAssignments.filter((a) => a.subjectId === numSubId && a.teacher)
        if (anyMatches.length > 0 && anyMatches[0].teacher) {
          setTeacherId(String(anyMatches[0].teacher.id))
        } else if (teachers.length > 0) {
          setTeacherId(String(teachers[0].id))
        }
      }
    } else if (teachers.length > 0) {
      setTeacherId(String(teachers[0].id))
    }

    setModalError(null)
    setIsSlotModalOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (slot: TimetableSlotData) => {
    setSlotModalMode('edit')
    setSlotId(slot.id)
    setDayOfWeek(slot.dayOfWeek)
    setStartTime(slot.startTime)
    setEndTime(slot.endTime)
    setSlotType(slot.type)
    setSlotTitle(slot.title || '')
    setModalClassId(String(slot.classId))
    setModalSectionId(slot.sectionId ? String(slot.sectionId) : '')
    setSubjectId(slot.subjectId ? String(slot.subjectId) : (subjects[0] ? String(subjects[0].id) : ''))
    setTeacherId(slot.teacherId ? String(slot.teacherId) : (teachers[0] ? String(teachers[0].id) : ''))
    setShowAllTeachers(false)
    setModalError(null)
    setIsSlotModalOpen(true)
  }

  // Save Slot (Create / Update)
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSlot(true)
    setModalError(null)

    try {
      const payload = {
        id: slotId || undefined,
        classId: Number(modalClassId || selectedClassId),
        sectionId: modalSectionId ? Number(modalSectionId) : (selectedSectionId ? Number(selectedSectionId) : null),
        sessionId: selectedSessionId ? Number(selectedSessionId) : null,
        dayOfWeek,
        startTime,
        endTime,
        type: slotType,
        title: slotTitle || undefined,
        subjectId: slotType === 'SUBJECT' && subjectId ? Number(subjectId) : null,
        teacherId: slotType === 'SUBJECT' && teacherId ? Number(teacherId) : null,
        isPublished,
      }

      const res = await apiSlice.post<{ success: boolean; slot: TimetableSlotData; message?: string }>(
        endpoints.admin.timetableSlot,
        payload
      )

      if (res.success) {
        setIsSlotModalOpen(false)
        setSuccessMsg(slotModalMode === 'create' ? 'Timetable slot created successfully!' : 'Timetable slot updated successfully!')
        setTimeout(() => setSuccessMsg(null), 4000)
        await fetchTimetable()
        if (activeTab === 'teacher-timetable') {
          await fetchTeacherTimetable()
        }
      } else {
        setModalError(res.message || 'Failed to save timetable slot.')
      }
    } catch (err: any) {
      setModalError(err?.message || 'Error occurred while saving timetable slot.')
    } finally {
      setIsSavingSlot(false)
    }
  }

  // Delete Single Slot
  const handleDeleteSlot = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this timetable slot?')) return

    try {
      const res = await apiSlice.delete<{ success: boolean; message: string }>(
        endpoints.admin.deleteTimetableSlot(id)
      )

      if (res.success) {
        setSuccessMsg('Timetable slot removed.')
        setTimeout(() => setSuccessMsg(null), 3000)
        await fetchTimetable()
        if (activeTab === 'teacher-timetable') {
          await fetchTeacherTimetable()
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to remove slot.')
    }
  }

  // Clear Entire Timetable for Class
  const handleClearClassTimetable = async () => {
    if (!window.confirm('Are you sure you want to CLEAR all slots for this class and session? This cannot be undone.')) {
      return
    }

    try {
      const payload = {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        sessionId: selectedSessionId ? Number(selectedSessionId) : undefined,
      }

      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.timetableClear,
        payload
      )

      if (res.success) {
        setSuccessMsg('Class timetable cleared.')
        setTimeout(() => setSuccessMsg(null), 3000)
        await fetchTimetable()
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to clear timetable.')
    }
  }

  // Quick preset time selection helper
  const handlePresetSelect = (preset: { start: string; end: string }) => {
    setStartTime(preset.start)
    setEndTime(preset.end)
  }

  // Compute stats
  const totalClassSlots = Object.values(slotsGrouped).reduce((sum, slots) => sum + slots.length, 0)
  const totalTeacherSlots = Object.values(teacherSlotsGrouped).reduce((sum, slots) => sum + slots.length, 0)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-indigo-100/60 to-purple-100/40 rounded-full blur-3xl opacity-70" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Timetable & Period Scheduler
                </h1>
                <p className="text-slate-500 text-xs font-medium">
                  Class timetables, teacher schedules, AI generator, and instant multi-portal publishing to teachers, students & parents.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Publish Status */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Publication Status Pill */}
            {activeTab === 'class-timetable' && (
              <div className="flex items-center gap-2">
                {isPublished ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Published Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                    <Clock size={14} className="text-amber-600" />
                    Draft (Unpublished)
                  </span>
                )}

                <button
                  onClick={handleTogglePublish}
                  disabled={isPublishing || totalClassSlots === 0}
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPublished
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  }`}
                  title={
                    totalClassSlots === 0
                      ? 'Add slots first before publishing'
                      : isPublished
                      ? 'Revert timetable to draft'
                      : 'Publish timetable to students, parents, and teachers'
                  }
                >
                  {isPublishing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Globe size={14} />
                  )}
                  {isPublished ? 'Unpublish Timetable' : 'Publish Timetable'}
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveTab('ai-generator')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-400" /> AI Generator
            </button>
          </div>
        </div>
      </div>

      {/* Global Notification Banners */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Primary Filter Bar: Academic Session + Class Level + Arm/Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* 1. Academic Session Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-indigo-600" /> Academic Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 hover:bg-slate-100/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Class Level */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
              <School size={13} className="text-indigo-600" /> Class Level
            </label>
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
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 hover:bg-slate-100/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Arm / Section */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
              <Layers size={13} className="text-indigo-600" /> Section / Arm
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 hover:bg-slate-100/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="">All Class Arms</option>
              {classes
                .find((c) => String(c.id) === selectedClassId)
                ?.sections?.map((s) => (
                  <option key={s.section.id} value={s.section.id}>
                    {s.section.name}
                  </option>
                ))}
            </select>
          </div>

          {/* 4. Refresh & Quick Stats */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchTimetable()
                if (activeTab === 'teacher-timetable') fetchTeacherTimetable()
              }}
              disabled={isLoading}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('class-timetable')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'class-timetable' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar size={15} /> Class Timetable
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'class-timetable' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {totalClassSlots} slots
          </span>
        </button>

        <button
          onClick={() => setActiveTab('teacher-timetable')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'teacher-timetable' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck size={15} /> Teachers Timetable
          {selectedTeacherId && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'teacher-timetable' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {totalTeacherSlots} periods
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai-generator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'ai-generator' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bot size={15} className="text-amber-400" /> AI Timetable Generator
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CLASS TIMETABLE */}
      {/* ========================================================================= */}
      {activeTab === 'class-timetable' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <span>Weekly Schedule Grid</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({classes.find((c) => String(c.id) === selectedClassId)?.name || 'Class'}
                    {selectedSectionId ? ` • Arm ${classes.find((c) => String(c.id) === selectedClassId)?.sections.find((s) => String(s.section.id) === selectedSectionId)?.section.name || ''}` : ''})
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage class subject periods, morning assemblies, and mid-morning recesses.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => openCreateModal('MONDAY', '08:30', '09:15')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus size={14} /> Add Period Slot
                </button>

                {totalClassSlots > 0 && (
                  <button
                    onClick={handleClearClassTimetable}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200/80 transition cursor-pointer flex items-center gap-1.5"
                    title="Clear all slots for this class"
                  >
                    <Trash2 size={13} /> Clear Class
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>

            {/* Weekly Days List & Period Slots */}
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
                <span>Loading class schedule...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS.map((day) => {
                  const daySlots = slotsGrouped[day] || []
                  return (
                    <div key={day} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                            {DAY_LABELS[day]}
                          </h4>
                          <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {daySlots.length} {daySlots.length === 1 ? 'Period' : 'Periods'}
                          </span>
                        </div>

                        <button
                          onClick={() => openCreateModal(day)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-slate-200 hover:border-indigo-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Slot
                        </button>
                      </div>

                      {daySlots.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs font-medium bg-white rounded-lg border border-dashed border-slate-200">
                          No schedule slots added for {DAY_LABELS[day]}. Click "Add Slot" to add a subject period or break.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                          {daySlots.map((slot) => {
                            const isSpecial = slot.type === 'ASSEMBLY' || slot.type === 'BREAK'
                            return (
                              <div
                                key={slot.id}
                                className={`group relative p-3 rounded-xl border transition shadow-2xs hover:shadow-sm ${
                                  slot.type === 'ASSEMBLY'
                                    ? 'bg-amber-50/80 border-amber-200'
                                    : slot.type === 'BREAK'
                                    ? 'bg-emerald-50/80 border-emerald-200'
                                    : 'bg-white border-slate-200 hover:border-indigo-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-700">
                                    <Clock size={12} className="text-slate-400" />
                                    <span>
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                    <button
                                      onClick={() => openEditModal(slot)}
                                      className="p-1 rounded hover:bg-slate-200/60 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                                      title="Edit slot"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSlot(slot.id)}
                                      className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                      title="Delete slot"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  {isSpecial ? (
                                    <div className="flex items-center gap-1.5">
                                      {slot.type === 'ASSEMBLY' ? (
                                        <Sun size={14} className="text-amber-600 shrink-0" />
                                      ) : (
                                        <Coffee size={14} className="text-emerald-600 shrink-0" />
                                      )}
                                      <span className="font-extrabold text-xs text-slate-900">
                                        {slot.title || (slot.type === 'ASSEMBLY' ? 'Morning Assembly' : 'Break Time')}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <BookOpen size={13} className="text-indigo-600 shrink-0" />
                                        <span className="font-extrabold text-xs text-slate-900 line-clamp-1">
                                          {slot.subject?.name || slot.title || 'Subject Class'}
                                        </span>
                                      </div>
                                      {slot.subject?.subjectCode && (
                                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                          {slot.subject.subjectCode}
                                        </span>
                                      )}
                                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                        <User size={11} className="text-slate-400" />
                                        <span className="line-clamp-1 font-medium">
                                          {slot.teacher?.name || 'Unassigned Teacher'}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEACHERS TIMETABLE */}
      {/* ========================================================================= */}
      {activeTab === 'teacher-timetable' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            {/* Teacher Selection Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-indigo-600" /> Select Staff Member / Teacher
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 hover:bg-slate-100 focus:bg-white transition cursor-pointer min-w-[240px]"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Workload Stats Card */}
              <div className="flex items-center gap-3 bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-indigo-900">Total Allocated Teaching Workload</div>
                  <div className="text-sm font-black text-indigo-950">
                    {totalTeacherSlots} Teaching Periods / Week
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Day-by-Day View */}
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
                <span>Loading teacher schedule...</span>
              </div>
            ) : totalTeacherSlots === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No teaching periods scheduled for {teachers.find((t) => String(t.id) === selectedTeacherId)?.name || 'this teacher'} in the selected academic session.
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS.map((day) => {
                  const daySlots = teacherSlotsGrouped[day] || []
                  return (
                    <div key={day} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                            {DAY_LABELS[day]}
                          </h4>
                          <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {daySlots.length} Periods
                          </span>
                        </div>
                      </div>

                      {daySlots.length === 0 ? (
                        <div className="py-4 text-center text-slate-400 text-xs font-medium bg-white rounded-lg border border-dashed border-slate-200">
                          Free Day (No periods scheduled)
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                          {daySlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="p-3.5 rounded-xl border border-indigo-100 bg-white shadow-2xs hover:border-indigo-300 transition space-y-2"
                            >
                              <div className="flex items-center justify-between gap-1 text-[11px] font-black text-slate-700">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} className="text-slate-400" />
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditModal(slot)}
                                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 cursor-pointer"
                                    title="Edit slot"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                                    title="Delete slot"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <h5 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1">
                                  <BookOpen size={13} className="text-indigo-600 shrink-0" />
                                  {slot.subject?.name || slot.title || 'Subject Period'}
                                </h5>
                                <div className="text-[11px] text-slate-600 font-bold mt-1">
                                  {slot.class?.name || 'Class'} {slot.section?.name ? `(${slot.section.name})` : ''}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI TIMETABLE GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'ai-generator' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold mx-auto shadow-md">
              <Bot size={30} />
            </div>
            <h3 className="font-black text-xl text-slate-900">OSe AI Automated Timetable Engine</h3>
            <p className="text-xs text-slate-500 font-medium max-w-lg mx-auto">
              Auto-generate balanced, conflict-free school master schedules. OSe AI balances period distribution across the week, avoids teacher double-booking, and schedules breaks automatically.
            </p>
          </div>

          {/* AI Generator Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1.5">
                <Sun size={13} className="text-amber-500" /> Morning Assembly Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={aiAssemblyStart}
                  onChange={(e) => setAiAssemblyStart(e.target.value)}
                  placeholder="08:00"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
                <input
                  type="text"
                  value={aiAssemblyEnd}
                  onChange={(e) => setAiAssemblyEnd(e.target.value)}
                  placeholder="08:30"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1.5">
                <Coffee size={13} className="text-emerald-500" /> Mid-Morning Recess / Break
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={aiBreakStart}
                  onChange={(e) => setAiBreakStart(e.target.value)}
                  placeholder="10:45"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
                <input
                  type="text"
                  value={aiBreakEnd}
                  onChange={(e) => setAiBreakEnd(e.target.value)}
                  placeholder="11:15"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-600" /> Period Slot Duration (Minutes)
              </label>
              <input
                type="number"
                value={aiPeriodDuration}
                onChange={(e) => setAiPeriodDuration(e.target.value)}
                placeholder="45"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard Nigerian & British curriculum duration is 45 minutes per lesson period.
              </span>
            </div>
          </div>

          <div className="text-center space-y-3">
            <button
              onClick={handleRunAiTimetable}
              disabled={isAiGenerating || !selectedClassId}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer inline-flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {isAiGenerating ? (
                <Loader2 size={16} className="animate-spin text-amber-400" />
              ) : (
                <Sparkles size={16} className="text-amber-400" />
              )}
              {isAiGenerating ? 'Generating Conflict-Free Schedule...' : 'Generate Conflict-Free Timetable'}
            </button>

            {aiResultCount !== null && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold space-y-3">
                <p>✓ Timetable generated with {aiResultCount} conflict-free slots! Saved in draft status.</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('class-timetable')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    View Timetable Grid
                  </button>
                  <button
                    onClick={async () => {
                      await handleTogglePublish()
                      setActiveTab('class-timetable')
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Globe size={13} /> Publish Immediately
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLOT CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl max-w-lg w-full space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Calendar size={18} />
                </div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {slotModalMode === 'create' ? 'Add Timetable Slot' : 'Edit Timetable Slot'}
                </h3>
              </div>
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-4">
              {/* Day of Week & Slot Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {DAY_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Slot Type</label>
                  <select
                    value={slotType}
                    onChange={(e) => setSlotType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                  >
                    <option value="SUBJECT">Subject Class Period</option>
                    <option value="ASSEMBLY">Morning Assembly / Devotion</option>
                    <option value="BREAK">Recess / Break Time</option>
                  </select>
                </div>
              </div>

              {/* Start & End Times */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Time Schedule</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Start Time</span>
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="08:30"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">End Time</span>
                    <input
                      type="text"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="09:15"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                  {COMMON_TIME_SLOTS.slice(0, 4).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePresetSelect(p)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
                    >
                      {p.start}-{p.end}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject & Teacher (Only for SUBJECT type) */}
              {slotType === 'SUBJECT' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Subject</label>
                    <select
                      value={subjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} {sub.subjectCode ? `(${sub.subjectCode})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Assigned Teacher
                      </label>
                      {assignedTeachersForSubject.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllTeachers(!showAllTeachers)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                        >
                          {showAllTeachers ? 'Filter to subject teachers' : 'Show all teachers'}
                        </button>
                      )}
                    </div>

                    {/* Helpful indicator showing subject filtering state */}
                    {assignedTeachersForSubject.length > 0 && !showAllTeachers ? (
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>
                          Showing {assignedTeachersForSubject.length} teacher{assignedTeachersForSubject.length > 1 ? 's' : ''} assigned to this subject
                        </span>
                      </div>
                    ) : assignedTeachersForSubject.length === 0 ? (
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                        <AlertCircle size={13} className="text-amber-600 shrink-0" />
                        <span>No assigned teacher found in curriculum for this subject. Showing all teachers.</span>
                      </div>
                    ) : null}

                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- No Teacher Assigned --</option>
                      {(!showAllTeachers && assignedTeachersForSubject.length > 0
                        ? assignedTeachersForSubject
                        : teachers
                      ).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Event / Slot Title</label>
                  <input
                    type="text"
                    value={slotTitle}
                    onChange={(e) => setSlotTitle(e.target.value)}
                    placeholder={slotType === 'ASSEMBLY' ? 'Morning Assembly & Devotion' : 'Mid-Morning Break'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSlot}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingSlot ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {slotModalMode === 'create' ? 'Save Period Slot' : 'Update Period Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
