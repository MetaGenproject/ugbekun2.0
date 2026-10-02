'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Loader2,
  BookOpen,
  Building2,
  UserCheck,
  AlertCircle,
  X,
  Check,
  School,
  Layers,
  Send,
  FileText,
  CheckCircle2,
  Info
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

interface HallData {
  id: number
  name: string
  code: string
  capacity: number
  location?: string | null
}

export interface ExamScheduleSlotData {
  id: number
  examDate: string
  startTime: string
  endTime: string
  instructions?: string | null
  isPublished: boolean
  classId: number
  sectionId?: number | null
  subjectId: number
  hallId?: number | null
  invigilatorId?: number | null
  class?: { id: number; name: string }
  section?: { id: number; name: string }
  subject?: { id: number; name: string; subjectCode?: string }
  hall?: { id: number; name: string; code: string; capacity?: number; location?: string }
  invigilator?: { id: number; name: string }
}

export interface TimetableSubjectRow {
  tempId: string
  subjectId: string
  examDate: string
  startTime: string
  endTime: string
  hallId: string
  invigilatorId: string
  instructions: string
}

export function ExamScheduleManager() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [teachers, setTeachers] = useState<TeacherData[]>([])
  const [halls, setHalls] = useState<HallData[]>([])

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

  const [slots, setSlots] = useState<ExamScheduleSlotData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Multi-subject Timetable Builder State
  const [subjectRows, setSubjectRows] = useState<TimetableSubjectRow[]>([])

  // Slot Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null)
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:30')
  const [subjectId, setSubjectId] = useState('')
  const [hallId, setHallId] = useState('')
  const [invigilatorId, setInvigilatorId] = useState('')
  const [instructions, setInstructions] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [isSavingSlot, setIsSavingSlot] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  useEffect(() => {
    loadSetupData()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      fetchExamSchedule()
    }
  }, [selectedClassId, selectedSectionId])

  const loadSetupData = async () => {
    try {
      const [classRes, subjectRes, staffRes, hallRes] = await Promise.all([
        apiSlice.get<{ success: boolean; classes: ClassData[] }>(endpoints.admin.classesSections),
        apiSlice.get<{ success: boolean; subjects: SubjectData[] }>(endpoints.admin.subjects),
        apiSlice.get<{ success: boolean; data: { teachers: TeacherData[] } }>(endpoints.admin.teachersStaff),
        apiSlice.get<{ success: boolean; halls: HallData[] }>(endpoints.admin.examHalls),
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

      if (hallRes.success && hallRes.halls) {
        setHalls(hallRes.halls)
      }
    } catch (err) {
      console.error('Failed to load setup data for exam schedule:', err)
    }
  }

  const fetchExamSchedule = async () => {
    if (!selectedClassId) return
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await apiSlice.get<{
        success: boolean
        slots: ExamScheduleSlotData[]
      }>(
        endpoints.admin.examSchedule(
          Number(selectedClassId),
          selectedSectionId ? Number(selectedSectionId) : undefined
        )
      )

      if (res.success && res.slots) {
        setSlots(res.slots)
      }
    } catch (err: any) {
      setErrorMsg('Failed to load exam schedule.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingSlotId(null)
    const defaultDate = new Date().toISOString().split('T')[0]
    const firstSubject = subjects.length > 0 ? String(subjects[0].id) : ''
    const firstHall = halls.length > 0 ? String(halls[0].id) : ''

    setSubjectRows([
      {
        tempId: `row_${Date.now()}_1`,
        subjectId: firstSubject,
        examDate: defaultDate,
        startTime: '09:00',
        endTime: '11:30',
        hallId: firstHall,
        invigilatorId: '',
        instructions: '',
      },
    ])
    setIsPublished(true)
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleAddSubjectRow = () => {
    const usedSubjectIds = new Set(subjectRows.map((r) => r.subjectId))
    const nextSubject = subjects.find((s) => !usedSubjectIds.has(String(s.id))) || subjects[0]
    const lastRow = subjectRows[subjectRows.length - 1]
    const defaultDate = lastRow ? lastRow.examDate : new Date().toISOString().split('T')[0]
    const defaultHall = lastRow ? lastRow.hallId : (halls.length > 0 ? String(halls[0].id) : '')

    setSubjectRows((prev) => [
      ...prev,
      {
        tempId: `row_${Date.now()}_${prev.length + 1}`,
        subjectId: nextSubject ? String(nextSubject.id) : '',
        examDate: defaultDate,
        startTime: '09:00',
        endTime: '11:30',
        hallId: defaultHall,
        invigilatorId: '',
        instructions: '',
      },
    ])
  }

  const handleRemoveSubjectRow = (tempId: string) => {
    if (subjectRows.length <= 1) return
    setSubjectRows((prev) => prev.filter((r) => r.tempId !== tempId))
  }

  const handleUpdateSubjectRow = (tempId: string, field: keyof TimetableSubjectRow, value: string) => {
    setSubjectRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, [field]: value } : r))
    )
  }

  const handleOpenEditModal = (slot: ExamScheduleSlotData) => {
    setEditingSlotId(slot.id)
    setExamDate(slot.examDate ? new Date(slot.examDate).toISOString().split('T')[0] : '')
    setStartTime(slot.startTime)
    setEndTime(slot.endTime)
    setSubjectId(slot.subjectId ? String(slot.subjectId) : '')
    setHallId(slot.hallId ? String(slot.hallId) : '')
    setInvigilatorId(slot.invigilatorId ? String(slot.invigilatorId) : '')
    setInstructions(slot.instructions || '')
    setIsPublished(slot.isPublished)
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId) {
      setModalError('Please select a class.')
      return
    }

    // 1. Single slot edit mode
    if (editingSlotId) {
      if (!subjectId) {
        setModalError('Please select a subject.')
        return
      }
      if (endTime <= startTime) {
        setModalError('End time must be after start time.')
        return
      }

      setIsSavingSlot(true)
      setModalError(null)

      try {
        const payload = {
          id: editingSlotId,
          classId: Number(selectedClassId),
          sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
          subjectId: Number(subjectId),
          examDate,
          startTime,
          endTime,
          hallId: hallId ? Number(hallId) : undefined,
          invigilatorId: invigilatorId ? Number(invigilatorId) : undefined,
          instructions: instructions.trim() || undefined,
          isPublished,
        }

        await apiSlice.post(endpoints.admin.examScheduleSlot, payload)
        await fetchExamSchedule()
        setIsModalOpen(false)
        setSuccessMsg('Exam timetable slot updated successfully.')
        setTimeout(() => setSuccessMsg(null), 3000)
      } catch (err: any) {
        setModalError(err instanceof Error ? err.message : 'Failed to save exam schedule slot.')
      } finally {
        setIsSavingSlot(false)
      }
      return
    }

    // 2. Multi-subject batch timetable creation
    if (subjectRows.length === 0) {
      setModalError('Please add at least one subject.')
      return
    }

    for (let i = 0; i < subjectRows.length; i++) {
      const row = subjectRows[i]
      if (!row.subjectId) {
        setModalError(`Subject #${i + 1}: Please select a subject.`)
        return
      }
      if (!row.examDate) {
        setModalError(`Subject #${i + 1}: Exam date is required.`)
        return
      }
      if (!row.startTime || !row.endTime) {
        setModalError(`Subject #${i + 1}: Start and end times are required.`)
        return
      }
      if (row.endTime <= row.startTime) {
        setModalError(`Subject #${i + 1}: End time must be after start time.`)
        return
      }
    }

    setIsSavingSlot(true)
    setModalError(null)

    try {
      const payload = {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        isPublished,
        slots: subjectRows.map((r) => ({
          classId: Number(selectedClassId),
          sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
          subjectId: Number(r.subjectId),
          examDate: r.examDate,
          startTime: r.startTime,
          endTime: r.endTime,
          hallId: r.hallId ? Number(r.hallId) : undefined,
          invigilatorId: r.invigilatorId ? Number(r.invigilatorId) : undefined,
          instructions: r.instructions?.trim() || undefined,
          isPublished,
        })),
      }

      const res: any = await apiSlice.post(endpoints.admin.examScheduleSlot, payload)
      await fetchExamSchedule()
      setIsModalOpen(false)
      setSuccessMsg(res?.message || `Successfully added ${subjectRows.length} subject(s) to the exam timetable.`)
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: any) {
      setModalError(err instanceof Error ? err.message : 'Failed to save exam timetable slots.')
    } finally {
      setIsSavingSlot(false)
    }
  }

  const handleDeleteSlot = async (id: number) => {
    try {
      await apiSlice.delete(endpoints.admin.deleteExamScheduleSlot(id))
      await fetchExamSchedule()
    } catch (err) {
      console.error('Failed to delete slot:', err)
    }
  }

  const handleTogglePublishState = async (publish: boolean) => {
    if (!selectedClassId) return
    try {
      await apiSlice.post(endpoints.admin.publishExamSchedule, {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        isPublished: publish,
      })
      await fetchExamSchedule()
      setSuccessMsg(
        publish
          ? 'Exam schedule published and distributed to class successfully!'
          : 'Exam schedule set to draft mode.'
      )
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err) {
      console.error('Failed to update publish state:', err)
    }
  }

  const handleClearSchedule = async () => {
    if (!selectedClassId) return
    if (!confirm('Are you sure you want to clear all exam timetable slots for this class?')) return

    try {
      await apiSlice.post(endpoints.admin.clearExamSchedule, {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
      })
      await fetchExamSchedule()
    } catch (err) {
      console.error('Failed to clear exam schedule:', err)
    }
  }

  const currentClass = classes.find((c) => String(c.id) === selectedClassId)
  const availableSections = currentClass?.sections || []

  // Group slots by Date string
  const groupedByDate: Record<string, ExamScheduleSlotData[]> = {}
  slots.forEach((s) => {
    const formattedDate = s.examDate
      ? new Date(s.examDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Unspecified Date'

    if (!groupedByDate[formattedDate]) {
      groupedByDate[formattedDate] = []
    }
    groupedByDate[formattedDate].push(s)
  })

  const isClassSchedulePublished = slots.length > 0 && slots.every((s) => s.isPublished)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0063a6] via-[#004d80] to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/15">
              <Calendar size={14} className="text-blue-300" /> Examination Timetable & Distribution
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Exam Schedule Manager</h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
              Create the timetable once, then change the date or time on the same slot if a sitting needs to move. You do not need a new exam.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleTogglePublishState(!isClassSchedulePublished)}
              className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                isClassSchedulePublished
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Send size={15} />
              {isClassSchedulePublished ? 'Set to Draft Mode' : 'Distribute Schedule to Class'}
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-white text-[#0063a6] hover:bg-blue-50 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus size={15} /> Add Subjects to Timetable
            </button>
            <button
              onClick={() => window.print()}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/15 cursor-pointer"
              title="Print Exam Timetable"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Class & Section Bar */}
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

        {/* Status Badge & Clear */}
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              isClassSchedulePublished
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isClassSchedulePublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {isClassSchedulePublished ? '📢 Live & Distributed to Class' : '📝 Draft Mode'}
          </span>

          <button
            onClick={handleClearSchedule}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            Clear Schedule
          </button>
        </div>
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

      {/* Schedule Timeline */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
          <Loader2 size={24} className="animate-spin text-[#0063a6] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading exam timetable...</p>
        </div>
      ) : Object.keys(groupedByDate).length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
          <Calendar size={32} className="text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Exam Slots Scheduled for this Classroom</p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            + Build Exam Timetable (Add Subjects)
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateLabel, dateSlots]) => (
            <div key={dateLabel} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center gap-2 px-1">
                <Calendar size={16} className="text-[#0063a6]" />
                <h3 className="font-black text-slate-900 text-sm">{dateLabel}</h3>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  ({dateSlots.length} {dateSlots.length === 1 ? 'exam' : 'exams'})
                </span>
              </div>

              {/* Date Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between space-y-4 group relative"
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Code & Time */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                          {slot.subject?.subjectCode || 'EXAM'}
                        </span>
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1 font-mono">
                          <Clock size={12} className="text-[#0063a6]" /> {slot.startTime} - {slot.endTime}
                        </span>
                      </div>

                      {/* Subject Name */}
                      <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                        {slot.subject?.name || 'Examination'}
                      </h4>

                      {/* Venue & Supervisor Badges */}
                      <div className="space-y-2 pt-1">
                        {slot.hall ? (
                          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60">
                            <Building2 size={15} className="text-purple-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">{slot.hall.name}</p>
                              {slot.hall.location && (
                                <p className="text-[10px] text-slate-400">{slot.hall.location}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No exam hall assigned</p>
                        )}

                        {slot.invigilator ? (
                          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60">
                            <UserCheck size={15} className="text-[#0063a6] shrink-0" />
                            <p className="text-xs font-bold text-slate-800">
                              Invigilator: {slot.invigilator.name}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No invigilator assigned</p>
                        )}
                      </div>

                      {/* Instructions */}
                      {slot.instructions && (
                        <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] font-semibold text-amber-900 leading-relaxed flex items-start gap-1.5">
                          <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
                          <span>{slot.instructions}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(slot)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Clock size={13} /> Change date & time
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Exam Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          {editingSlotId ? (
            /* Single Slot Edit Modal */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-[#0063a6] to-indigo-900 text-white">
                <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                  <Calendar size={18} /> Change Exam Date & Time
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg text-white/80 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSlot} className="p-6 space-y-4">
                {modalError && (
                  <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}
                <p className="text-xs text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                  This updates the date and time on this timetable slot.
                </p>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Subject <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0063a6]"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.subjectCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Times */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400">Exam Date</label>
                    <input
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    />
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

                {/* Assigned Hall */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Assigned Exam Hall / Venue</label>
                  <select
                    value={hallId}
                    onChange={(e) => setHallId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0063a6]"
                  >
                    <option value="">Select Exam Hall (Optional)</option>
                    {halls.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code} · {h.capacity} Seats)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Invigilator */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Chief Invigilator / Supervisor</label>
                  <select
                    value={invigilatorId}
                    onChange={(e) => setInvigilatorId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0063a6]"
                  >
                    <option value="">Select Teacher (Optional)</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Instructions */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Special Instructions / Rules</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Non-programmable scientific calculator permitted."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 outline-none focus:border-[#0063a6] resize-none"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSavingSlot}
                    className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSlot}
                    className="flex-1 px-4 py-2.5 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSavingSlot ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Multi-Subject Exam Timetable Builder Modal */
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 my-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
                    <Calendar size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                        Build Class Exam Timetable
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                        {subjectRows.length} {subjectRows.length === 1 ? 'Subject' : 'Subjects'} Added
                      </span>
                    </div>
                    <p className="text-xs text-blue-200/80">
                      Add and configure all subjects for <span className="font-bold text-white">{currentClass?.name || 'Class'}</span> before saving.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-xl text-white/80 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveSlot} className="flex flex-col flex-1 overflow-hidden">
                {modalError && (
                  <div className="mx-6 mt-4 p-3.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 shrink-0">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Scrollable Subjects Container */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  {subjectRows.map((row, idx) => (
                    <div
                      key={row.tempId}
                      className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition shadow-2xs relative group"
                    >
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0063a6] text-white flex items-center justify-center font-black text-xs">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">
                            Subject #{idx + 1}
                          </span>
                        </div>

                        {subjectRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectRow(row.tempId)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Remove this subject row"
                          >
                            <Trash2 size={14} /> Remove Subject
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                        {/* Subject Select */}
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">
                            Subject <span className="text-rose-500">*</span>
                          </label>
                          <select
                            required
                            value={row.subjectId}
                            onChange={(e) => handleUpdateSubjectRow(row.tempId, 'subjectId', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0063a6]"
                          >
                            <option value="">Select Subject</option>
                            {subjects.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.subjectCode})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Exam Date */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">
                            Exam Date <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={row.examDate}
                            onChange={(e) => handleUpdateSubjectRow(row.tempId, 'examDate', e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0063a6]"
                          />
                        </div>

                        {/* Start Time */}
                        <div className="md:col-span-2.5 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">
                            Start <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="time"
                            required
                            value={row.startTime}
                            onChange={(e) => handleUpdateSubjectRow(row.tempId, 'startTime', e.target.value)}
                            className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0063a6]"
                          />
                        </div>

                        {/* End Time */}
                        <div className="md:col-span-2.5 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">
                            End <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="time"
                            required
                            value={row.endTime}
                            onChange={(e) => handleUpdateSubjectRow(row.tempId, 'endTime', e.target.value)}
                            className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0063a6]"
                          />
                        </div>

                        {/* Venue / Hall */}
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[11px] font-bold text-slate-500">
                            Venue / Hall (Optional)
                          </label>
                          <select
                            value={row.hallId}
                            onChange={(e) => handleUpdateSubjectRow(row.tempId, 'hallId', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0063a6]"
                          >
                            <option value="">Select Exam Hall</option>
                            {halls.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name} ({h.code} · {h.capacity} seats)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Chief Invigilator */}
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[11px] font-bold text-slate-500">
                            Chief Invigilator (Optional)
                          </label>
                          <select
                            value={row.invigilatorId}
                            onChange={(e) => handleUpdateSubjectRow(row.tempId, 'invigilatorId', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0063a6]"
                          >
                            <option value="">Select Teacher</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Instructions */}
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[11px] font-bold text-slate-500">
                            Instructions / Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Non-programmable calculator permitted"
                            value={row.instructions}
                            onChange={(e) => handleUpdateSubjectRow(row.tempId, 'instructions', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-[#0063a6]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Another Subject Button */}
                  <button
                    type="button"
                    onClick={handleAddSubjectRow}
                    className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-[#0063a6]/40 hover:border-[#0063a6] bg-blue-50/50 hover:bg-blue-50 text-[#0063a6] font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
                  >
                    <Plus size={16} className="group-hover:scale-110 transition-transform" />
                    + Add Another Subject to Timetable
                  </button>
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded border-slate-300 text-[#0063a6] focus:ring-[#0063a6] h-4 w-4"
                    />
                    <span>Publish timetable to students & parent portal immediately</span>
                  </label>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSavingSlot}
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSlot}
                      className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#0063a6] hover:bg-[#003da5] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSavingSlot ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Check size={15} />
                      )}
                      Save Timetable ({subjectRows.length} {subjectRows.length === 1 ? 'Subject' : 'Subjects'})
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
