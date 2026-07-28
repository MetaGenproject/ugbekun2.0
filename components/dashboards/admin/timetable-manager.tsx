'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Printer,
  Loader2,
  BookOpen,
  Coffee,
  Sun,
  AlertCircle,
  X,
  Check,
  User,
  School,
  Layers,
  Wand2
} from 'lucide-react'

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
  class?: { id: number; name: string }
  section?: { id: number; name: string }
  subject?: { id: number; name: string; subjectCode?: string }
  teacher?: { id: number; name: string }
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
}

export function TimetableManager() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [teachers, setTeachers] = useState<TeacherData[]>([])

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

  const [slotsGrouped, setSlotsGrouped] = useState<Record<string, TimetableSlotData[]>>({
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Manual Slot Modal States
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  const [slotId, setSlotId] = useState<number | null>(null)
  const [dayOfWeek, setDayOfWeek] = useState<string>('MONDAY')
  const [startTime, setStartTime] = useState('08:30')
  const [endTime, setEndTime] = useState('09:15')
  const [slotType, setSlotType] = useState<'SUBJECT' | 'ASSEMBLY' | 'BREAK'>('SUBJECT')
  const [slotTitle, setSlotTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [isSavingSlot, setIsSavingSlot] = useState(false)
  const [slotModalError, setSlotModalError] = useState<string | null>(null)

  // AI Generator Modal States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiAssemblyStart, setAiAssemblyStart] = useState('08:00')
  const [aiAssemblyEnd, setAiAssemblyEnd] = useState('08:30')
  const [aiBreakStart, setAiBreakStart] = useState('11:00')
  const [aiBreakEnd, setAiBreakEnd] = useState('11:30')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    loadSetupData()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      fetchTimetable()
    }
  }, [selectedClassId, selectedSectionId])

  const loadSetupData = async () => {
    try {
      const [classRes, subjectRes, staffRes] = await Promise.all([
        apiSlice.get<{ success: boolean; classes: ClassData[] }>(endpoints.admin.classesSections),
        apiSlice.get<{ success: boolean; subjects: SubjectData[] }>(endpoints.admin.subjects),
        apiSlice.get<{ success: boolean; data: { teachers: TeacherData[] } }>(endpoints.admin.teachersStaff),
      ])

      if (classRes.success && classRes.classes) {
        setClasses(classRes.classes)
        if (classRes.classes.length > 0) {
          const firstClass = classRes.classes[0]
          setSelectedClassId(String(firstClass.id))
          if (firstClass.sections && firstClass.sections.length > 0) {
            setSelectedSectionId(String(firstClass.sections[0].section.id))
          }
        }
      }

      if (subjectRes.success && subjectRes.subjects) {
        setSubjects(subjectRes.subjects)
      }

      if (staffRes.success && staffRes.data?.teachers) {
        setTeachers(staffRes.data.teachers)
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
      const res = await apiSlice.get<{
        success: boolean
        grouped: Record<string, TimetableSlotData[]>
      }>(endpoints.admin.timetable(Number(selectedClassId), selectedSectionId ? Number(selectedSectionId) : undefined))

      if (res.success && res.grouped) {
        setSlotsGrouped(res.grouped)
      }
    } catch (err: any) {
      setErrorMsg('Failed to load timetable for selected classroom.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAddSlotModal = (day = 'MONDAY', time = '08:30') => {
    setSlotId(null)
    setDayOfWeek(day)
    setStartTime(time)
    setEndTime('09:15')
    setSlotType('SUBJECT')
    setSlotTitle('')
    setSubjectId(subjects.length > 0 ? String(subjects[0].id) : '')
    setTeacherId(teachers.length > 0 ? String(teachers[0].id) : '')
    setSlotModalError(null)
    setIsSlotModalOpen(true)
  }

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId) {
      setSlotModalError('Please select a class.')
      return
    }

    setIsSavingSlot(true)
    setSlotModalError(null)

    try {
      const payload = {
        id: slotId || undefined,
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        dayOfWeek,
        startTime,
        endTime,
        type: slotType,
        title: slotTitle.trim() || undefined,
        subjectId: slotType === 'SUBJECT' && subjectId ? Number(subjectId) : undefined,
        teacherId: slotType === 'SUBJECT' && teacherId ? Number(teacherId) : undefined,
      }

      await apiSlice.post(endpoints.admin.timetableSlot, payload)
      await fetchTimetable()
      setIsSlotModalOpen(false)
      setSuccessMsg('Timetable slot saved successfully.')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setSlotModalError(err instanceof Error ? err.message : 'Failed to save timetable slot.')
    } finally {
      setIsSavingSlot(false)
    }
  }

  const handleDeleteSlot = async (id: number) => {
    try {
      await apiSlice.delete(endpoints.admin.deleteTimetableSlot(id))
      await fetchTimetable()
    } catch (err) {
      console.error('Failed to delete slot:', err)
    }
  }

  const handleClearTimetable = async () => {
    if (!selectedClassId) return
    if (!confirm('Are you sure you want to clear all timetable slots for this class?')) return

    try {
      await apiSlice.post(endpoints.admin.timetableClear, {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
      })
      await fetchTimetable()
    } catch (err) {
      console.error('Failed to clear timetable:', err)
    }
  }

  const handleRunAiGenerate = async () => {
    if (!selectedClassId) return
    setIsGeneratingAi(true)
    setAiError(null)

    try {
      const res = await apiSlice.post(endpoints.admin.timetableAiGenerate, {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        assemblyStartTime: aiAssemblyStart,
        assemblyEndTime: aiAssemblyEnd,
        breakStartTime: aiBreakStart,
        breakEndTime: aiBreakEnd,
      })

      if (res.success) {
        await fetchTimetable()
        setIsAiModalOpen(false)
        setSuccessMsg(res.message || 'AI Timetable generated successfully!')
        setTimeout(() => setSuccessMsg(null), 4000)
      }
    } catch (err: any) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate AI timetable.')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const currentClass = classes.find((c) => String(c.id) === selectedClassId)
  const availableSections = currentClass?.sections || []

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0063a6] via-[#004d80] to-[#003659] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/15">
              <Calendar size={14} className="text-blue-300" /> Academic Schedule & Timetables
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Class Timetable Planner</h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
              Configure Assembly Time, Break Time, and Subject Time slots manually or with AI Automation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setAiError(null)
                setIsAiModalOpen(true)
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Wand2 size={15} /> AI-Assisted Generator
            </button>
            <button
              onClick={() => handleOpenAddSlotModal()}
              className="px-4 py-2.5 bg-white text-[#0063a6] hover:bg-blue-50 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus size={15} /> Add Slot
            </button>
            <button
              onClick={() => window.print()}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/15 cursor-pointer"
              title="Print Timetable"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Class & Section Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {/* Class Select */}
          <div className="space-y-1 flex-1 sm:flex-none">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Classroom</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
              <School size={16} className="text-[#0063a6]" />
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

          {/* Section Select */}
          <div className="space-y-1 flex-1 sm:flex-none">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Section</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
              <Layers size={16} className="text-purple-600" />
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
        </div>

        {/* Clear Action */}
        <button
          onClick={handleClearTimetable}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 px-3.5 py-2 rounded-xl transition cursor-pointer self-end sm:self-auto"
        >
          Clear Class Schedule
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
          <Check size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Timetable Weekly Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
          <Loader2 size={24} className="animate-spin text-[#0063a6] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading timetable schedule...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {DAYS.map((day) => {
            const daySlots = slotsGrouped[day] || []
            return (
              <div key={day} className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-3 flex flex-col gap-3">
                {/* Day Header */}
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/60 shadow-sm">
                  <h3 className="font-extrabold text-slate-900 text-xs tracking-tight">{DAY_LABELS[day]}</h3>
                  <button
                    onClick={() => handleOpenAddSlotModal(day)}
                    className="p-1 text-slate-400 hover:text-[#0063a6] hover:bg-slate-100 rounded-lg transition"
                    title={`Add Slot for ${DAY_LABELS[day]}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Day Slots List */}
                <div className="space-y-2.5 flex-1 min-h-[300px]">
                  {daySlots.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      <Clock size={20} className="text-slate-300 mb-1" />
                      <p className="text-[11px] font-semibold text-slate-400">No periods scheduled</p>
                      <button
                        onClick={() => handleOpenAddSlotModal(day)}
                        className="mt-2 text-[10px] font-bold text-[#0063a6] hover:underline"
                      >
                        + Add Period
                      </button>
                    </div>
                  ) : (
                    daySlots.map((slot) => {
                      if (slot.type === 'ASSEMBLY') {
                        return (
                          <div
                            key={slot.id}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-3 shadow-sm relative group overflow-hidden"
                          >
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="absolute top-2 right-2 p-1 text-white/70 hover:text-white hover:bg-white/20 rounded-md opacity-0 group-hover:opacity-100 transition"
                            >
                              <X size={12} />
                            </button>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-100 mb-1">
                              <Sun size={12} /> ASSEMBLY TIME
                            </div>
                            <h4 className="font-extrabold text-xs leading-tight">
                              {slot.title || 'Morning Assembly'}
                            </h4>
                            <p className="text-[10px] text-blue-100/90 font-mono mt-1">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                        )
                      }

                      if (slot.type === 'BREAK') {
                        return (
                          <div
                            key={slot.id}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-3 shadow-sm relative group overflow-hidden"
                          >
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="absolute top-2 right-2 p-1 text-white/70 hover:text-white hover:bg-white/20 rounded-md opacity-0 group-hover:opacity-100 transition"
                            >
                              <X size={12} />
                            </button>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-100 mb-1">
                              <Coffee size={12} /> BREAK TIME
                            </div>
                            <h4 className="font-extrabold text-xs leading-tight">
                              {slot.title || 'Break Time'}
                            </h4>
                            <p className="text-[10px] text-amber-100/90 font-mono mt-1">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                        )
                      }

                      // SUBJECT TIME
                      return (
                        <div
                          key={slot.id}
                          className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-sm relative group hover:border-[#0063a6] transition"
                        >
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 size={12} />
                          </button>

                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>

                          <h4 className="font-black text-slate-900 text-xs">
                            {slot.subject?.name || slot.title || 'Subject'}
                          </h4>

                          {slot.teacher ? (
                            <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-1">
                              <User size={10} className="text-[#0063a6]" /> {slot.teacher.name}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic mt-1">No teacher assigned</p>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Manual Add / Edit Slot Modal */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="text-[#0063a6]" size={18} /> Configure Timetable Slot
              </h2>
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-6 space-y-4">
              {slotModalError && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{slotModalError}</span>
                </div>
              )}

              {/* Slot Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Slot Type <span className="text-rose-500">*</span></label>
                <select
                  value={slotType}
                  onChange={(e) => setSlotType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0063a6]"
                >
                  <option value="SUBJECT">📚 Subject Period</option>
                  <option value="ASSEMBLY">🌅 Assembly Time</option>
                  <option value="BREAK">☕ Break Time</option>
                </select>
              </div>

              {/* Day & Times Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Day</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {DAY_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Dynamic Inputs based on Slot Type */}
              {slotType === 'SUBJECT' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Subject <span className="text-rose-500">*</span></label>
                    <select
                      required
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.subjectCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Assigned Teacher</label>
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="">Select Teacher (Optional)</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Slot Title</label>
                  <input
                    type="text"
                    placeholder={slotType === 'ASSEMBLY' ? 'e.g. Morning Assembly & Devotion' : 'e.g. Mid-Day Recess'}
                    value={slotTitle}
                    onChange={(e) => setSlotTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 outline-none"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  disabled={isSavingSlot}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSlot}
                  className="flex-1 px-4 py-2.5 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {isSavingSlot ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Timetable Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white">
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <Wand2 size={18} /> AI-Assisted Timetable Generator
              </h2>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg text-white/80 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {aiError && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                The AI Timetable Generator will automatically analyze subjects assigned to <span className="text-[#0063a6] font-bold">{currentClass?.name || 'Selected Class'}</span>, resolve subject teachers, and optimize an even weekly schedule with Assembly and Break times.
              </p>

              {/* Bounds Settings */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sun size={14} className="text-blue-600" /> Morning Assembly Bounds
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={aiAssemblyStart}
                      onChange={(e) => setAiAssemblyStart(e.target.value)}
                      className="px-2 py-1 bg-white border rounded-lg text-xs font-bold"
                    />
                    <input
                      type="time"
                      value={aiAssemblyEnd}
                      onChange={(e) => setAiAssemblyEnd(e.target.value)}
                      className="px-2 py-1 bg-white border rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Coffee size={14} className="text-amber-600" /> Mid-Morning Break Bounds
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={aiBreakStart}
                      onChange={(e) => setAiBreakStart(e.target.value)}
                      className="px-2 py-1 bg-white border rounded-lg text-xs font-bold"
                    />
                    <input
                      type="time"
                      value={aiBreakEnd}
                      onChange={(e) => setAiBreakEnd(e.target.value)}
                      className="px-2 py-1 bg-white border rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  disabled={isGeneratingAi}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunAiGenerate}
                  disabled={isGeneratingAi}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Optimizing Schedule...
                    </>
                  ) : (
                    <>
                      <Wand2 size={15} /> Generate Timetable
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
