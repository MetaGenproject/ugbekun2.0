'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  GraduationCap,
  BookOpen,
  UserCheck,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
  Users,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  BookMarked,
  Info,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

interface ClassInfo {
  id: number
  name: string
  nameNumeric?: string
  isEcd?: boolean
  sections: Array<{ id: number; name: string }>
  activeSectionId: number
  sessionId?: number
}

interface TeacherInfo {
  id: number
  name: string
  email?: string
  phone?: string
  photo?: string | null
}

interface SubjectOffered {
  assignmentId: number
  subjectId: number
  name: string
  subjectCode: string
  subjectType: string
  subjectAuthor?: string | null
  status: string
  assignedTeacherId: number | null
  assignedTeacher: TeacherInfo | null
  coverageType: 'SPECIFIC_TEACHER' | 'CLASS_TEACHER_AUTO' | 'UNASSIGNED'
  displayTeacherName: string
}

interface CurriculumSubject {
  id: number
  name: string
  subjectCode: string
  subjectType: string
}

interface ClassItemSimple {
  id: number
  name: string
}

interface ClassAcademicManagerProps {
  classId: number
  className: string
  allClasses?: ClassItemSimple[]
  onClose?: () => void
  onUpdated?: () => void
}

export function ClassAcademicManager({
  classId,
  className,
  allClasses = [],
  onClose,
  onUpdated,
}: ClassAcademicManagerProps) {
  const [loading, setLoading] = useState(true)
  const [classData, setClassData] = useState<ClassInfo | null>(null)
  const [classTeacher, setClassTeacher] = useState<TeacherInfo | null>(null)
  const [subjectsOffered, setSubjectsOffered] = useState<SubjectOffered[]>([])
  const [allCurriculumSubjects, setAllCurriculumSubjects] = useState<CurriculumSubject[]>([])
  const [staff, setStaff] = useState<TeacherInfo[]>([])
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null)

  // Notification state
  const [notify, setNotify] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)

  // Modal states
  const [showAssignClassTeacherModal, setShowAssignClassTeacherModal] = useState(false)
  const [selectedClassTeacherId, setSelectedClassTeacherId] = useState<string>('')
  const [isSubmittingClassTeacher, setIsSubmittingClassTeacher] = useState(false)

  const [showAllocateSubjectsModal, setShowAllocateSubjectsModal] = useState(false)
  const [selectedAllocateSubjectIds, setSelectedAllocateSubjectIds] = useState<number[]>([])
  const [subjectFilterQuery, setSubjectFilterQuery] = useState('')
  const [isSubmittingAllocate, setIsSubmittingAllocate] = useState(false)

  const [showAssignSubjectTeacherModal, setShowAssignSubjectTeacherModal] = useState(false)
  const [assignSubjTeacherSubjectId, setAssignSubjTeacherSubjectId] = useState<string>('')
  const [assignSubjTeacherTeacherId, setAssignSubjTeacherTeacherId] = useState<string>('')
  const [assignSubjTeacherClassIds, setAssignSubjTeacherClassIds] = useState<number[]>([classId])
  const [isSubmittingSubjTeacher, setIsSubmittingSubjTeacher] = useState(false)
  const [validationWarning, setValidationWarning] = useState<string | null>(null)

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotify({ type, message })
    setTimeout(() => setNotify(null), 5000)
  }

  const loadOverview = async (sectionId?: number) => {
    setLoading(true)
    try {
      const url = endpoints.admin.classAcademicOverview(classId, sectionId)
      const res = await apiSlice.get<{
        success: boolean
        class: ClassInfo
        classTeacher: TeacherInfo | null
        subjectsOffered: SubjectOffered[]
        allCurriculumSubjects: CurriculumSubject[]
        staff: TeacherInfo[]
        message?: string
      }>(url)

      if (res.success) {
        setClassData(res.class)
        setClassTeacher(res.classTeacher)
        setSubjectsOffered(res.subjectsOffered || [])
        setAllCurriculumSubjects(res.allCurriculumSubjects || [])
        setStaff(res.staff || [])
        setActiveSectionId(res.class?.activeSectionId || null)
        setSelectedAllocateSubjectIds((res.subjectsOffered || []).map((s) => s.subjectId))
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load class academic overview.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
  }, [classId])

  // Handle Section Change
  const handleSectionChange = (secId: number) => {
    setActiveSectionId(secId)
    loadOverview(secId)
  }

  // 1. Assign Class Teacher
  const handleSaveClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassTeacherId) {
      showNotification('error', 'Please select a teacher from the staff directory.')
      return
    }

    setIsSubmittingClassTeacher(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.assignClassTeacher(classId),
        {
          teacherId: Number(selectedClassTeacherId),
          sectionId: activeSectionId,
        }
      )

      if (res.success) {
        showNotification('success', res.message || 'Class teacher assigned successfully!')
        setShowAssignClassTeacherModal(false)
        setSelectedClassTeacherId('')
        await loadOverview(activeSectionId || undefined)
        onUpdated?.()
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to assign class teacher.')
    } finally {
      setIsSubmittingClassTeacher(false)
    }
  }

  // 2. Remove Class Teacher
  const handleRemoveClassTeacher = async () => {
    if (!confirm(`Are you sure you want to remove ${classTeacher?.name} as Class Teacher for ${className}?`)) {
      return
    }

    try {
      const res = await apiSlice.delete<{ success: boolean; message: string }>(
        endpoints.admin.removeClassTeacher(classId, activeSectionId || undefined)
      )

      if (res.success) {
        showNotification('success', res.message || 'Class teacher assignment removed.')
        await loadOverview(activeSectionId || undefined)
        onUpdated?.()
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to remove class teacher.')
    }
  }

  // 3. Allocate Subjects to Class (Step 3)
  const handleSaveAllocateSubjects = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingAllocate(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.allocateClassSubjects(classId),
        {
          subjectIds: selectedAllocateSubjectIds,
          sectionId: activeSectionId,
        }
      )

      if (res.success) {
        showNotification('success', res.message || 'Subjects allocated successfully!')
        setShowAllocateSubjectsModal(false)
        await loadOverview(activeSectionId || undefined)
        onUpdated?.()
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to allocate subjects to class.')
    } finally {
      setIsSubmittingAllocate(false)
    }
  }

  // 4. Assign Subject Teacher (Steps 6, 8, 14)
  const handleSaveSubjectTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignSubjTeacherSubjectId || !assignSubjTeacherTeacherId) {
      showNotification('error', 'Please select both Subject and Teacher.')
      return
    }

    if (assignSubjTeacherClassIds.length === 0) {
      showNotification('error', 'Please select at least one class.')
      return
    }

    // Step 14 Validation: Check if subject is offered in this class
    const selectedSubjId = Number(assignSubjTeacherSubjectId)
    const isOfferedHere = subjectsOffered.some((s) => s.subjectId === selectedSubjId)
    const selectedSubjObj = allCurriculumSubjects.find((s) => s.id === selectedSubjId)
    const subjName = selectedSubjObj?.name || 'Subject'

    if (!isOfferedHere && assignSubjTeacherClassIds.includes(classId)) {
      const msg = `${subjName} is not currently assigned to ${className}. Assign ${subjName} to this class first before assigning a ${subjName} teacher.`
      setValidationWarning(msg)
      showNotification('error', msg)
      return
    }

    setIsSubmittingSubjTeacher(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.assignSubjectTeacher(classId),
        {
          subjectId: selectedSubjId,
          teacherId: Number(assignSubjTeacherTeacherId),
          classIds: assignSubjTeacherClassIds,
          sectionId: activeSectionId,
        }
      )

      if (res.success) {
        showNotification('success', res.message || 'Subject teacher assigned successfully!')
        setShowAssignSubjectTeacherModal(false)
        setAssignSubjTeacherSubjectId('')
        setAssignSubjTeacherTeacherId('')
        setValidationWarning(null)
        await loadOverview(activeSectionId || undefined)
        onUpdated?.()
      }
    } catch (err: any) {
      // Backend Step 14 validation message
      const errorMsg = err.message || 'Failed to assign subject teacher.'
      setValidationWarning(errorMsg)
      showNotification('error', errorMsg)
    } finally {
      setIsSubmittingSubjTeacher(false)
    }
  }

  // 5. Remove Subject Teacher from Subject
  const handleRemoveSubjectTeacher = async (subjectId: number) => {
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.removeSubjectTeacher(classId),
        {
          subjectId,
          sectionId: activeSectionId,
        }
      )

      if (res.success) {
        showNotification('success', res.message || 'Subject teacher unlinked from this subject.')
        await loadOverview(activeSectionId || undefined)
        onUpdated?.()
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to remove subject teacher.')
    }
  }

  // Filtered curriculum subjects in allocation modal
  const filteredCurriculumSubjects = useMemo(() => {
    if (!subjectFilterQuery.trim()) return allCurriculumSubjects
    const q = subjectFilterQuery.toLowerCase()
    return allCurriculumSubjects.filter(
      (s) => s.name.toLowerCase().includes(q) || s.subjectCode.toLowerCase().includes(q)
    )
  }, [allCurriculumSubjects, subjectFilterQuery])

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notify && (
        <div
          className={`fixed bottom-5 right-5 z-50 rounded-2xl border px-4 py-3.5 shadow-2xl flex items-center gap-3 animate-slide-up font-semibold text-xs ${
            notify.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : notify.type === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              notify.type === 'success'
                ? 'bg-emerald-500'
                : notify.type === 'warning'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
          {notify.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <GraduationCap size={16} /> Academic Class Desk
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              {className}
              {classData?.isEcd && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  ECD / Montessori
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300 font-medium max-w-xl">
              Manage Class Teacher assignment, subjects offered by this class, and specific Subject Teachers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {classData?.sections && classData.sections.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <span className="text-slate-300 font-bold">Section:</span>
                <select
                  value={activeSectionId || ''}
                  onChange={(e) => handleSectionChange(Number(e.target.value))}
                  className="bg-transparent text-white font-extrabold focus:outline-none cursor-pointer"
                >
                  {classData.sections.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-900">
                      Section {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => loadOverview(activeSectionId || undefined)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-white font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <X size={14} /> Close
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-xs font-semibold text-slate-500">Loading academic structure for {className}...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: 1. Class Teacher Card */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <UserCheck size={18} className="text-blue-600" />
                  Class Teacher
                </div>
                {classTeacher && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Assigned
                  </span>
                )}
              </div>

              {classTeacher ? (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
                      {classTeacher.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-slate-900 text-sm truncate">{classTeacher.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium truncate">{classTeacher.email || 'Class Teacher'}</div>
                      {classTeacher.phone && <div className="text-[10px] text-slate-400 font-semibold">{classTeacher.phone}</div>}
                    </div>
                  </div>

                  {/* Informational callout explaining automatic access */}
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
                    <ShieldCheck size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px] font-medium">
                      <strong className="font-bold">{classTeacher.name}</strong> automatically has teaching, grading, and monitoring access to <strong>all {subjectsOffered.length} subjects</strong> offered by {className}. Individual subject assignments are not required.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAssignClassTeacherModal(true)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer text-center"
                    >
                      Change Teacher
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveClassTeacher}
                      className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                      title="Remove Class Teacher"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                    <Users size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-500">No Class Teacher currently assigned to {className}.</p>
                    <p className="text-[10px] text-slate-400">
                      Assigning a Class Teacher automatically grants full academic & score entry access to all subjects offered in this class.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAssignClassTeacherModal(true)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-blue-500/10"
                  >
                    <Plus size={15} /> Assign Class Teacher
                  </button>
                </div>
              )}
            </div>

            {/* Quick Summary Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Info size={14} className="text-slate-500" /> Academic Rules Summary
              </h3>
              <ul className="text-[11px] text-slate-600 space-y-2 font-medium leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Class Teacher:</strong> Assigned to class, automatically covers all subjects offered by this class.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span><strong>Subject Teacher:</strong> Assigned specifically to a subject in one or more classes. Has access ONLY to that subject.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>Validation:</strong> A subject must be allocated to {className} first before a subject teacher can be assigned.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: 2. Subjects Offered & Subject Teachers (Step 3 & Step 13) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Subjects Offered Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BookOpen size={17} className="text-indigo-600" />
                    Subjects Offered by {className}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Central curriculum subjects attached to this class.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAllocateSubjectIds(subjectsOffered.map((s) => s.subjectId))
                      setShowAllocateSubjectsModal(true)
                    }}
                    className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Plus size={14} /> Assign Subjects to Class
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignSubjectTeacherModal(true)
                      setAssignSubjTeacherClassIds([classId])
                    }}
                    className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Plus size={14} /> Assign Subject Teacher
                  </button>
                </div>
              </div>

              {subjectsOffered.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <BookMarked size={32} className="mx-auto text-slate-300" />
                  <p>No subjects allocated to {className} yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAllocateSubjectIds([])
                      setShowAllocateSubjectsModal(true)
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Allocate Curriculum Subjects
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="pb-3">Subject</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Assigned Teacher</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {subjectsOffered.map((subj) => {
                        const isSpecific = subj.coverageType === 'SPECIFIC_TEACHER'
                        const isClassTeacherCovered = subj.coverageType === 'CLASS_TEACHER_AUTO'

                        return (
                          <tr key={subj.assignmentId} className="hover:bg-slate-50/60 transition">
                            <td className="py-3">
                              <div className="font-extrabold text-slate-900 flex items-center gap-2">
                                {subj.name}
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                                  {subj.subjectCode}
                                </span>
                              </div>
                            </td>
                            <td className="py-3">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  subj.subjectType.toLowerCase() === 'mandatory' || subj.subjectType.toLowerCase() === 'core'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {subj.subjectType}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-max">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                              </span>
                            </td>
                            <td className="py-3">
                              {isSpecific ? (
                                <div className="space-y-0.5">
                                  <span className="text-slate-900 font-extrabold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                    {subj.assignedTeacher?.name}
                                  </span>
                                  <span className="text-[10px] text-indigo-600 font-bold block uppercase">
                                    Subject Teacher
                                  </span>
                                </div>
                              ) : isClassTeacherCovered ? (
                                <div className="space-y-0.5">
                                  <span className="text-slate-700 font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    {classTeacher?.name}
                                  </span>
                                  <span className="text-[10px] text-blue-600 font-bold block uppercase">
                                    Class Teacher Auto-Covered
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-semibold italic text-[11px]">
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssignSubjTeacherSubjectId(String(subj.subjectId))
                                    setAssignSubjTeacherTeacherId(subj.assignedTeacherId ? String(subj.assignedTeacherId) : '')
                                    setAssignSubjTeacherClassIds([classId])
                                    setShowAssignSubjectTeacherModal(true)
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                >
                                  {isSpecific ? 'Change Teacher' : 'Assign Teacher'}
                                </button>
                                {isSpecific && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubjectTeacher(subj.subjectId)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                    title="Unlink Subject Teacher"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Assign Class Teacher */}
      {showAssignClassTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserCheck size={18} className="text-blue-600" />
                Assign Class Teacher
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignClassTeacherModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveClassTeacher} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Target Class</label>
                <input
                  type="text"
                  value={className}
                  disabled
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Select Teacher from Staff Directory</label>
                <select
                  value={selectedClassTeacherId}
                  onChange={(e) => setSelectedClassTeacherId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 font-semibold"
                  required
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staff.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.phone ? `(${t.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" /> Automatic Permission Rule:
                </span>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Once assigned, this teacher automatically receives full teaching, student directory, attendance, score entry, and report card access for <strong>all subjects offered by {className}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignClassTeacherModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClassTeacher}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-500/10 disabled:opacity-50"
                >
                  {isSubmittingClassTeacher ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Assign Subjects to Class (Step 3: Curriculum Allocation Checklist) */}
      {showAllocateSubjectsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-600" />
                  Assign Subjects to {className}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Select which subjects {className} actually offers from the school curriculum.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllocateSubjectsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAllocateSubjects} className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search curriculum subjects..."
                    value={subjectFilterQuery}
                    onChange={(e) => setSubjectFilterQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allIds = allCurriculumSubjects.map((s) => s.id)
                    const allSelected = allIds.every((id) => selectedAllocateSubjectIds.includes(id))
                    if (allSelected) {
                      setSelectedAllocateSubjectIds([])
                    } else {
                      setSelectedAllocateSubjectIds(allIds)
                    }
                  }}
                  className="px-3 py-2 text-[10px] font-black uppercase rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Toggle All
                </button>
              </div>

              {/* Scrollable Checklist */}
              <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 pr-1">
                {filteredCurriculumSubjects.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs font-semibold">
                    No curriculum subjects found. Create subjects in Curriculum desk first.
                  </div>
                ) : (
                  filteredCurriculumSubjects.map((subj) => {
                    const isChecked = selectedAllocateSubjectIds.includes(subj.id)

                    return (
                      <label
                        key={subj.id}
                        className={`flex items-center justify-between p-3 transition cursor-pointer select-none ${
                          isChecked ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedAllocateSubjectIds((prev) => prev.filter((id) => id !== subj.id))
                              } else {
                                setSelectedAllocateSubjectIds((prev) => [...prev, subj.id])
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block">{subj.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{subj.subjectCode}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            subj.subjectType.toLowerCase() === 'mandatory' || subj.subjectType.toLowerCase() === 'core'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {subj.subjectType}
                        </span>
                      </label>
                    )
                  })
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1">
                <span>{selectedAllocateSubjectIds.length} Subjects Selected</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllocateSubjectsModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAllocate}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-500/10 disabled:opacity-50"
                >
                  {isSubmittingAllocate ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Allocate Subjects
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Assign Subject Teacher (Steps 6, 8, 14) */}
      {showAssignSubjectTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BookMarked size={18} className="text-indigo-600" />
                  Assign Subject Teacher
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Assign a teacher to teach a specific subject across one or more classes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAssignSubjectTeacherModal(false)
                  setValidationWarning(null)
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Step 14 Validation Warning Banner */}
            {validationWarning && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-rose-900">Assignment Validation Error</div>
                  <p className="leading-relaxed text-[11px]">{validationWarning}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSubjectTeacher} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Select Subject</label>
                <select
                  value={assignSubjTeacherSubjectId}
                  onChange={(e) => {
                    setAssignSubjTeacherSubjectId(e.target.value)
                    setValidationWarning(null)
                  }}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 font-semibold"
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {/* First list subjects offered in this class */}
                  {subjectsOffered.length > 0 && (
                    <optgroup label={`Subjects Offered by ${className}`}>
                      {subjectsOffered.map((s) => (
                        <option key={`offered-${s.subjectId}`} value={s.subjectId}>
                          {s.name} ({s.subjectCode})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {/* Then other curriculum subjects */}
                  <optgroup label="Other Curriculum Subjects">
                    {allCurriculumSubjects
                      .filter((s) => !subjectsOffered.some((so) => so.subjectId === s.id))
                      .map((s) => (
                        <option key={`other-${s.id}`} value={s.id}>
                          {s.name} ({s.subjectCode}) [Not in {className}]
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Select Teacher from Staff Directory</label>
                <select
                  value={assignSubjTeacherTeacherId}
                  onChange={(e) => setAssignSubjTeacherTeacherId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 font-semibold"
                  required
                >
                  <option value="">-- Choose Teacher --</option>
                  {staff.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.phone ? `(${t.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 8: Multi-class selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">
                  Assign to Class(es) (Multi-Class Teaching)
                </label>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 max-h-36 overflow-y-auto space-y-1.5">
                  {(allClasses.length > 0 ? allClasses : [{ id: classId, name: className }]).map((c) => {
                    const isChecked = assignSubjTeacherClassIds.includes(c.id)
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setAssignSubjTeacherClassIds((prev) => prev.filter((id) => id !== c.id))
                            } else {
                              setAssignSubjTeacherClassIds((prev) => [...prev, c.id])
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span>{c.name}</span>
                        {c.id === classId && <span className="text-[10px] text-indigo-600 font-bold">(Current Class)</span>}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Access Control Notice:</strong> This teacher will ONLY receive score entry and academic access for the assigned subject in the selected classes. They cannot access unrelated subjects.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignSubjectTeacherModal(false)
                    setValidationWarning(null)
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSubjTeacher}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-500/10 disabled:opacity-50"
                >
                  {isSubmittingSubjTeacher ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Confirm Subject Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
