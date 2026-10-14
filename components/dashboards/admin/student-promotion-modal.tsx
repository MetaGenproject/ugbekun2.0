'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { Loader2, TrendingUp, AlertTriangle, Check, X, Users, RefreshCw, Layers } from 'lucide-react'

export interface ClassData {
  id: number
  name: string
  sections?: {
    id?: number
    section?: {
      id: number
      name: string
    }
    name?: string
  }[]
}

export interface Section {
  id: number
  name: string
}

export interface AcademicSessionItem {
  id: number
  name: string
  isCurrent?: boolean
}

export interface ModalStudentItem {
  id: number
  name: string
  currentClass?: string
}

export interface PromotionModalProps {
  studentId?: number
  studentName?: string
  currentClass?: string
  students?: ModalStudentItem[]
  sourceClassId?: number
  onClose: () => void
  onSuccess: () => void
}

export function StudentPromotionModal({
  studentId,
  studentName,
  currentClass,
  students = [],
  sourceClassId,
  onClose,
  onSuccess,
}: PromotionModalProps) {
  // Normalize students array
  const initialStudentList: ModalStudentItem[] = students.length > 0
    ? students
    : studentId && studentName
      ? [{ id: studentId, name: studentName, currentClass }]
      : []

  const [classes, setClasses] = useState<ClassData[]>([])
  const [availableSections, setAvailableSections] = useState<Section[]>([])
  const [sessions, setSessions] = useState<AcademicSessionItem[]>([])
  const [isLoadingMeta, setIsLoadingMeta] = useState(false)

  // Promotion mode & target states
  const [promotionAction, setPromotionAction] = useState<'PROMOTE' | 'REPEAT'>('PROMOTE')
  const [targetSessionId, setTargetSessionId] = useState<string>('')
  const [targetClassId, setTargetClassId] = useState('')
  const [targetSectionId, setTargetSectionId] = useState('')
  
  // Cohort scope: promote selected vs promote all in classroom
  const [isWholeClassScope, setIsWholeClassScope] = useState(false)
  const [classCohortStudents, setClassCohortStudents] = useState<ModalStudentItem[]>([])
  const [isLoadingCohort, setIsLoadingCohort] = useState(false)

  const [isPromoting, setIsPromoting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Load classrooms, sections & academic sessions
  useEffect(() => {
    async function loadMeta() {
      setIsLoadingMeta(true)
      try {
        const [clsRes, sessRes] = await Promise.all([
          apiSlice.get<{ success: boolean; classes: any[]; sections?: any[] }>(endpoints.admin.classesSections),
          apiSlice.get<{ success: boolean; sessions?: any[] }>(endpoints.admin.academicSessions).catch(() => ({ success: false, sessions: [] })),
        ])

        if (clsRes.success && clsRes.classes) {
          const rawClasses = clsRes.classes
          setClasses(rawClasses)

          // If currentClass is known, try to pre-suggest next class
          if (currentClass) {
            const curIdx = rawClasses.findIndex((c: any) => c.name?.toLowerCase() === currentClass?.toLowerCase())
            if (curIdx !== -1 && curIdx + 1 < rawClasses.length) {
              setTargetClassId(String(rawClasses[curIdx + 1].id))
            } else if (rawClasses.length > 0) {
              setTargetClassId(String(rawClasses[0].id))
            }
          } else if (rawClasses.length > 0) {
            setTargetClassId(String(rawClasses[0].id))
          }
        }

        if (sessRes.success && sessRes.sessions && sessRes.sessions.length > 0) {
          const mappedSessions = sessRes.sessions.map((s: any) => ({
            id: s.id,
            name: `${s.name || s.schoolYear || `Session #${s.id}`} ${s.isCurrent ? '(Current)' : ''}`,
            isCurrent: s.isCurrent,
          }))
          setSessions(mappedSessions)
          const current = mappedSessions.find((s: any) => s.isCurrent) || mappedSessions[0]
          if (current) {
            setTargetSessionId(String(current.id))
          }
        }
      } catch (err: any) {
        setErrorMsg('Failed to load classes or session configurations.')
      } finally {
        setIsLoadingMeta(false)
      }
    }
    loadMeta()
  }, [currentClass])

  // Update target sections when target class changes
  useEffect(() => {
    if (!targetClassId) {
      setAvailableSections([])
      setTargetSectionId('')
      return
    }

    const selectedClass = classes.find(c => c.id === Number(targetClassId))
    if (selectedClass && selectedClass.sections) {
      const extracted: Section[] = selectedClass.sections.map((s: any) => {
        if (s.section) return { id: s.section.id, name: s.section.name }
        return { id: s.id || 0, name: s.name || 'Default Section' }
      }).filter((s: Section) => s.id > 0)

      setAvailableSections(extracted)
      if (extracted.length > 0) {
        setTargetSectionId(String(extracted[0].id))
      } else {
        setTargetSectionId('')
      }
    } else {
      setAvailableSections([])
      setTargetSectionId('')
    }
  }, [targetClassId, classes])

  // Load entire class cohort if user toggles whole class scope
  useEffect(() => {
    async function loadWholeClass() {
      const resolvedClassId = sourceClassId || classes.find(c => c.name?.toLowerCase() === currentClass?.toLowerCase())?.id
      if (isWholeClassScope && resolvedClassId) {
        setIsLoadingCohort(true)
        try {
          const res = await apiSlice.get<{ success: boolean; data: any[] }>(
            `${endpoints.admin.promotionsClassStudents}?classId=${resolvedClassId}&sectionId=ALL`
          )
          if (res.success && res.data) {
            setClassCohortStudents(res.data.map(s => ({
              id: s.studentId,
              name: s.fullName,
              currentClass: s.currentClassName || currentClass
            })))
          }
        } catch (err) {
          console.warn('Could not load full classroom cohort:', err)
        } finally {
          setIsLoadingCohort(false)
        }
      }
    }
    loadWholeClass()
  }, [isWholeClassScope, sourceClassId, classes, currentClass])

  // Effective students to promote
  const effectiveStudents: ModalStudentItem[] = isWholeClassScope && classCohortStudents.length > 0
    ? classCohortStudents
    : initialStudentList

  const isBatchMode = effectiveStudents.length > 1 || isWholeClassScope

  // Submit promotion handler
  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetClassId || !targetSectionId) {
      setErrorMsg('Please select target class and section.')
      return
    }

    const studentIdsToPromote = effectiveStudents.map(s => s.id).filter(Boolean)
    if (studentIdsToPromote.length === 0) {
      setErrorMsg('No students selected for promotion.')
      return
    }

    setIsPromoting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const payload = {
        studentIds: studentIdsToPromote,
        studentId: studentIdsToPromote[0],
        targetClassId: Number(targetClassId),
        classId: Number(targetClassId),
        targetSectionId: Number(targetSectionId),
        sectionId: Number(targetSectionId),
        targetSessionId: targetSessionId ? Number(targetSessionId) : undefined,
        action: promotionAction,
      }

      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.batchPromoteStudents,
        payload
      )

      if (res.success) {
        setSuccessMsg(res.message || 'Promotion successfully completed!')
        setTimeout(() => {
          onSuccess()
        }, 1200)
      } else {
        setErrorMsg(res.message || 'Promotion failed.')
      }
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Promotion failed.')
    } finally {
      setIsPromoting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X size={16} />
        </button>

        <form onSubmit={handlePromoteSubmit} className="space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} /> 
              {isBatchMode ? 'Batch Class Promotion' : 'Promote Student'}
            </h3>
            <p className="text-xs text-slate-500 font-semibold tracking-wide">
              {isBatchMode
                ? `Promoting cohort of ${effectiveStudents.length} student(s)`
                : `Student: ${initialStudentList[0]?.name || 'Student'} (ID: #${initialStudentList[0]?.id || '—'})`}
            </p>
          </div>

          {/* Scope & Mode Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Current Classroom:</span>
              <span className="text-slate-900 font-extrabold bg-white border border-slate-200 px-2.5 py-0.5 rounded-md shadow-2xs">
                {currentClass || initialStudentList[0]?.currentClass || 'All Classes'}
              </span>
            </div>

            {/* Whole classroom toggle if opened for single or small group */}
            {(currentClass || sourceClassId) && initialStudentList.length <= 1 && (
              <label className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-xs font-bold text-indigo-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isWholeClassScope}
                  onChange={(e) => setIsWholeClassScope(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                />
                <span>Promote entire class cohort ({currentClass})</span>
                {isLoadingCohort && <Loader2 size={12} className="animate-spin text-indigo-600" />}
              </label>
            )}
          </div>

          {/* Students Preview Tag Cloud */}
          {effectiveStudents.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-slate-500" />
                  Target Cohort ({effectiveStudents.length} student{effectiveStudents.length === 1 ? '' : 's'}):
                </span>
              </div>
              <div className="max-h-24 overflow-y-auto p-2 bg-slate-100/70 border border-slate-200 rounded-xl flex flex-wrap gap-1.5">
                {effectiveStudents.slice(0, 20).map((st) => (
                  <span
                    key={st.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-800 shadow-2xs"
                  >
                    {st.name}
                  </span>
                ))}
                {effectiveStudents.length > 20 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-extrabold">
                    +{effectiveStudents.length - 20} more students
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Switch: Promote vs Repeat */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-600">Promotion Action</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPromotionAction('PROMOTE')}
                className={`py-1.5 px-3 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  promotionAction === 'PROMOTE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp size={13} /> Promote to Next Class
              </button>
              <button
                type="button"
                onClick={() => setPromotionAction('REPEAT')}
                className={`py-1.5 px-3 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  promotionAction === 'REPEAT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw size={13} /> Set to Repeat Class
              </button>
            </div>
          </div>

          {/* Destination Selectors */}
          {isLoadingMeta ? (
            <div className="flex items-center justify-center p-8 gap-2">
              <Loader2 className="animate-spin text-blue-600" size={20} />
              <span className="text-xs text-slate-400 font-bold">Loading academic structures...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Target Academic Session *</label>
                  <select 
                    value={targetSessionId}
                    onChange={e => setTargetSessionId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 font-bold text-slate-800"
                    required
                  >
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Target Class {promotionAction === 'REPEAT' ? '(Current)' : '*'}
                  </label>
                  <select 
                    value={targetClassId}
                    onChange={e => setTargetClassId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 font-bold text-slate-800"
                    required
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Target Section *</label>
                  <select 
                    value={targetSectionId}
                    onChange={e => setTargetSectionId(e.target.value)}
                    disabled={!targetClassId}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 font-bold text-slate-800 disabled:opacity-50"
                    required
                  >
                    <option value="">-- Choose Section --</option>
                    {availableSections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check size={15} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPromoting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPromoting || !targetClassId || !targetSectionId || effectiveStudents.length === 0}
              className={`flex-1 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm ${
                promotionAction === 'PROMOTE'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
              } disabled:opacity-50`}
            >
              {isPromoting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={14} />
                  <span>
                    {promotionAction === 'PROMOTE'
                      ? `Promote (${effectiveStudents.length}) Student${effectiveStudents.length === 1 ? '' : 's'}`
                      : `Repeat (${effectiveStudents.length}) Student${effectiveStudents.length === 1 ? '' : 's'}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
