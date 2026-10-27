'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

export type CbtTargetSlot = '' | 'CBT1' | 'CBT2' | 'CBT_EXAM'
export type CbtDistributionSourceMode = 'vault' | 'bundle'
export type CbtDistributionModalMode = 'create' | 'edit' | 'reschedule'

export interface ClassSectionItem {
  id: number | string
  name: string
}

export interface ClassItem {
  id: number | string
  name: string
  sections?: ClassSectionItem[]
}

export interface SubjectItem {
  id: number | string
  name: string
  subjectCode?: string
}

export interface ExamMasterItem {
  id: number | string
  name: string
  term?: string | null
  termId?: number | null
  sessionId?: number | null
  examCategory?: string | null
  cbtTotalMarks?: number | null
  totalQuestionCount?: number | null
}

export interface ExamSetupComponent {
  id: number | string
  code: string
  displayName: string
}

export interface ExamSetup {
  id?: number | string
  components?: ExamSetupComponent[]
}

export interface QuestionGroupItem {
  id: number | string
  title: string
  groupCode?: string
  description?: string | null
  subjectId: number | string
  questionIds?: number[]
}

export interface VaultQuestion {
  id: number
  questionText?: string | null
  questionType?: string | null
  options?: any
  correctOption?: any
  marks?: number | null
  status?: string | null
}

export interface UseCbtDistributionFormProps {
  isOpen?: boolean
  sourceMode: CbtDistributionSourceMode
  mode?: CbtDistributionModalMode
  editingDistId?: number | null
  initialData?: any | null
  vaultQuestions?: VaultQuestion[]
  classes: ClassItem[]
  schoolSections?: any[]
  subjects: SubjectItem[]
  examMasters: ExamMasterItem[]
  activeExamSetup?: ExamSetup | null
  questionGroups?: QuestionGroupItem[]
  subjectApprovedCount?: number | null
  isAdmin?: boolean
  onSuccess?: (result: any, message?: string) => void
  onError?: (error: Error | string) => void
}

export function useCbtDistributionForm({
  isOpen = true,
  sourceMode,
  mode = 'create',
  editingDistId = null,
  initialData = null,
  vaultQuestions = [],
  classes,
  schoolSections = [],
  subjects,
  examMasters,
  activeExamSetup = null,
  questionGroups = [],
  subjectApprovedCount = null,
  isAdmin = true,
  onSuccess,
  onError,
}: UseCbtDistributionFormProps) {
  // Form State
  const [distTitle, setDistTitle] = useState('')
  const [selectedExamMasterId, setSelectedExamMasterId] = useState<string>('')
  const [distTargetSlot, setDistTargetSlot] = useState<CbtTargetSlot>('')
  const [distAssessmentComponentId, setDistAssessmentComponentId] = useState<string>('')
  const [distClassId, setDistClassId] = useState<string>('')
  const [distSectionId, setDistSectionId] = useState<string>('')
  const [distSubjectId, setDistSubjectId] = useState<string>('')
  const [distGroupId, setDistGroupId] = useState<string>('')
  const [distDuration, setDistDuration] = useState<number | string>(30)
  const [distPassingMark, setDistPassingMark] = useState<number | string>(50)
  const [distStartDate, setDistStartDate] = useState<string>('')
  const [distEndDate, setDistEndDate] = useState<string>('')
  const [distShuffle, setDistShuffle] = useState<boolean>(true)
  const [distShowResults, setDistShowResults] = useState<boolean>(true)
  const [distPublished, setDistPublished] = useState<boolean>(true)
  const [distInstructions, setDistInstructions] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Initialize or re-populate form when initialData or mode changes
  const populateFromData = useCallback((data: any, currentMode: CbtDistributionModalMode = 'edit') => {
    if (!data) return

    setDistTitle(data.title || data.name || '')
    setDistTargetSlot((data.targetSlot as CbtTargetSlot) || '')
    setDistAssessmentComponentId(data.assessmentComponentId ? String(data.assessmentComponentId) : '')

    const resolvedClassId = data.classId ? String(data.classId) : (classes.length > 0 ? String(classes[0].id) : '')
    setDistClassId(resolvedClassId)
    setDistSectionId(data.sectionId ? String(data.sectionId) : '')

    const resolvedSubjectId = data.subjectId ? String(data.subjectId) : (subjects.length > 0 ? String(subjects[0].id) : '')
    setDistSubjectId(resolvedSubjectId)

    setDistGroupId(data.groupId ? String(data.groupId) : '')
    setDistDuration(data.duration ?? 30)
    setDistPassingMark(data.passingMark ?? 50)
    setDistShuffle(data.shuffleQuestions ?? true)
    setDistShowResults(data.showResults ?? true)
    setDistPublished(data.isPublished ?? true)
    setDistInstructions(data.instructions || '')

    const toLocalDatetime = (isoDate?: string | null) => {
      if (!isoDate) return ''
      try {
        const d = new Date(isoDate)
        if (isNaN(d.getTime())) return ''
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      } catch {
        return ''
      }
    }

    setDistStartDate(toLocalDatetime(data.startDate || data.examDate))
    setDistEndDate(toLocalDatetime(data.endDate))

    if (data.examMasterId) {
      setSelectedExamMasterId(String(data.examMasterId))
    } else if (data.title && examMasters.length > 0) {
      const match = examMasters.find(
        (em) => em.name.trim().toLowerCase() === String(data.title).trim().toLowerCase()
      )
      if (match) setSelectedExamMasterId(String(match.id))
    }
  }, [examMasters, classes, subjects])

  const resetForm = useCallback(() => {
    setDistTitle('')
    setSelectedExamMasterId('')
    setDistTargetSlot('')
    setDistAssessmentComponentId('')
    setDistClassId(classes[0] ? String(classes[0].id) : '')
    setDistSectionId('')
    setDistSubjectId(subjects[0] ? String(subjects[0].id) : '')
    setDistGroupId('')
    setDistDuration(30)
    setDistPassingMark(50)
    setDistStartDate('')
    setDistEndDate('')
    setDistShuffle(true)
    setDistShowResults(true)
    setDistPublished(true)
    setDistInstructions('')
    setIsSaving(false)
  }, [classes, subjects])

  // Hydrate only when modal opens or target initialData changes (breaks reactive loop)
  const prevIsOpenRef = useRef(false)
  const prevInitialDataIdRef = useRef<any>(null)

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current
    const dataIdentity = initialData?.id || (initialData?.subjectId ? `${initialData.subjectId}-${initialData.classId || ''}-${initialData.title || ''}` : null)
    const dataChanged = isOpen && dataIdentity && dataIdentity !== prevInitialDataIdRef.current

    if (justOpened || dataChanged) {
      if (initialData) {
        populateFromData(initialData, mode)
      } else {
        resetForm()
      }
      prevInitialDataIdRef.current = dataIdentity
    }

    prevIsOpenRef.current = Boolean(isOpen)
  }, [isOpen, initialData, mode, populateFromData, resetForm])

  // Active Class & Dependent Sections
  const activeClass = useMemo(() => {
    return classes.find((c) => String(c.id) === String(distClassId))
  }, [classes, distClassId])

  const activeSectionsForClass = useMemo(() => {
    // 1. Try class-specific sections (which can be join objects or flat objects)
    const rawClassSections = (activeClass as any)?.sections || []
    const mappedClassSections = rawClassSections
      .map((item: any) => {
        if (!item) return null
        if (item.section && item.section.id && item.section.name) {
          return {
            id: item.section.id,
            name: item.section.name,
          }
        }
        if (item.id && item.name) {
          return {
            id: item.id,
            name: item.name,
          }
        }
        if (item.sectionId && Array.isArray(schoolSections)) {
          const matched = schoolSections.find((s) => Number(s.id) === Number(item.sectionId))
          if (matched) return { id: matched.id, name: matched.name }
        }
        return null
      })
      .filter(Boolean) as ClassSectionItem[]

    if (mappedClassSections.length > 0) {
      return mappedClassSections
    }

    // 2. If the class has no allocated sections, provide the school's global sections
    if (Array.isArray(schoolSections) && schoolSections.length > 0) {
      return schoolSections
        .map((s: any) => ({
          id: s.id,
          name: s.name,
        }))
        .filter((s: any) => s && s.id && s.name)
    }

    return []
  }, [activeClass, schoolSections])

  // Active Exam Master Resolution
  const activeExam = useMemo(() => {
    return examMasters.find(
      (e) => String(e.id) === selectedExamMasterId || (distTitle && e.name.trim().toLowerCase() === distTitle.trim().toLowerCase())
    )
  }, [examMasters, selectedExamMasterId, distTitle])

  // Selected Question Bundle (if in bundle mode)
  const selectedBundle = useMemo(() => {
    return questionGroups.find((g) => String(g.id) === String(distGroupId))
  }, [questionGroups, distGroupId])

  // Cap and Question Count Calculations
  const activeCap = activeExam?.totalQuestionCount || null
  const activeExamTotalMarks = activeExam?.cbtTotalMarks ?? null

  const currentQuestionCount = useMemo(() => {
    if (sourceMode === 'vault') {
      return vaultQuestions.length
    }
    return selectedBundle && Array.isArray(selectedBundle.questionIds) ? selectedBundle.questionIds.length : 0
  }, [sourceMode, vaultQuestions.length, selectedBundle])

  const totalVaultMarks = useMemo(() => {
    if (sourceMode !== 'vault') return 0
    return vaultQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0)
  }, [sourceMode, vaultQuestions])

  const isExceedingCap = Boolean(activeCap && currentQuestionCount > activeCap)

  const hasNoQuestionsAvailable = useMemo(() => {
    if (mode === 'reschedule') return false
    if (sourceMode === 'vault') {
      return vaultQuestions.length === 0
    }
    if (distGroupId) {
      return !selectedBundle || !Array.isArray(selectedBundle.questionIds) || selectedBundle.questionIds.length === 0
    }
    return subjectApprovedCount === 0
  }, [mode, sourceMode, vaultQuestions.length, distGroupId, selectedBundle, subjectApprovedCount])

  // Handlers
  const handleExamMasterChange = useCallback((masterId: string) => {
    setSelectedExamMasterId(masterId)
    const found = examMasters.find((em) => String(em.id) === masterId)
    if (found) {
      setDistTitle(found.name)
    }
  }, [examMasters])

  const handleTargetSlotChange = useCallback((slot: CbtTargetSlot) => {
    setDistTargetSlot(slot)
    if (activeExamSetup && Array.isArray(activeExamSetup.components)) {
      const comp = activeExamSetup.components.find(
        (c: ExamSetupComponent) => c.code === (slot === 'CBT_EXAM' ? 'EXAM' : slot)
      )
      if (comp) {
        setDistAssessmentComponentId(String(comp.id))
        if (!distTitle || distTitle === 'CBT 1' || distTitle === 'CBT 2' || distTitle === 'Terminal CBT') {
          setDistTitle(`${comp.displayName} CBT`)
        }
      }
    }
  }, [activeExamSetup, distTitle])

  const handleClassChange = useCallback((classId: string) => {
    setDistClassId(classId)
    setDistSectionId('')
  }, [])

  const handleSubjectChange = useCallback((subjectId: string) => {
    setDistSubjectId(subjectId)
    setDistGroupId('')
  }, [])



  // Submit Distribution Execution
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (mode === 'reschedule') {
      if (!editingDistId) {
        onError?.('Distribution identifier is required for rescheduling.')
        return
      }
      if (!distStartDate || !distEndDate) {
        onError?.('Choose a new start and end date/time.')
        return
      }
      if (new Date(distEndDate) <= new Date(distStartDate)) {
        onError?.('Closing time must be after opening time.')
        return
      }

      setIsSaving(true)
      try {
        const res = await apiSlice.post<{ success: boolean; distribution: any; message?: string }>(
          endpoints.admin.rescheduleCbtDistribution(editingDistId),
          {
            startDate: new Date(distStartDate).toISOString(),
            endDate: new Date(distEndDate).toISOString(),
          }
        )
        if (res.success) {
          onSuccess?.(res.distribution, res.message || 'Sitting rescheduled successfully.')
        } else {
          onError?.(res.message || 'Failed to reschedule sitting.')
        }
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Failed to reschedule sitting.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // Validation for create/edit
    if (!distTitle.trim() || !distClassId || !distSubjectId) {
      onError?.('Assessment Title, Class, and Subject are required.')
      return
    }

    if (distStartDate && distEndDate && new Date(distEndDate) <= new Date(distStartDate)) {
      onError?.('Closing time must be after opening time.')
      return
    }

    if (isExceedingCap && activeCap) {
      onError?.(`Maximum of ${activeCap} questions approved for this exam.`)
      return
    }

    if (hasNoQuestionsAvailable) {
      onError?.(
        sourceMode === 'vault'
          ? 'No questions collected in this assessment batch.'
          : distGroupId
            ? 'The selected Question Bundle contains 0 questions.'
            : 'No approved questions found in the Question Bank for this subject.'
      )
      return
    }

    setIsSaving(true)
    try {
      const payload: any = {
        id: editingDistId || undefined,
        title: distTitle.trim(),
        targetSlot: distTargetSlot || undefined,
        assessmentComponentId: distAssessmentComponentId ? Number(distAssessmentComponentId) : undefined,
        examMasterId: selectedExamMasterId ? Number(selectedExamMasterId) : (activeExam ? Number(activeExam.id) : undefined),
        classId: Number(distClassId),
        sectionId: distSectionId ? Number(distSectionId) : null,
        subjectId: Number(distSubjectId),
        duration: Number(distDuration) || 30,
        passingMark: Number(distPassingMark) || 50,
        shuffleQuestions: distShuffle,
        showResults: distShowResults,
        isPublished: distPublished,
        instructions: distInstructions.trim() || null,
        startDate: distStartDate ? new Date(distStartDate).toISOString() : null,
        endDate: distEndDate ? new Date(distEndDate).toISOString() : null,
      }

      if (sourceMode === 'vault') {
        const approvedQuestions = vaultQuestions.filter((q) => (q.status || 'APPROVED') === 'APPROVED')
        payload.questionBankIds = approvedQuestions.map((q) => q.id)
        payload.questions = vaultQuestions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctOption: q.correctOption,
          marks: q.marks,
        }))
      } else {
        payload.groupId = distGroupId ? Number(distGroupId) : null
      }

      const endpointUrl = isAdmin
        ? endpoints.admin.cbtDistributions()
        : endpoints.teacher.onlineExams

      const res = await apiSlice.post<{ success: boolean; distribution: any; message?: string }>(
        endpointUrl,
        payload
      )

      if (res.success) {
        onSuccess?.(
          res.distribution,
          res.message || (editingDistId ? 'CBT schedule updated.' : 'CBT Assessment distributed successfully!')
        )
      } else {
        onError?.(res.message || 'Failed to distribute CBT assessment.')
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to distribute CBT assessment.')
    } finally {
      setIsSaving(false)
    }
  }, [
    mode,
    editingDistId,
    distStartDate,
    distEndDate,
    distTitle,
    distClassId,
    distSubjectId,
    isExceedingCap,
    activeCap,
    hasNoQuestionsAvailable,
    sourceMode,
    distGroupId,
    distTargetSlot,
    distAssessmentComponentId,
    selectedExamMasterId,
    activeExam,
    distSectionId,
    distDuration,
    distPassingMark,
    distShuffle,
    distShowResults,
    distPublished,
    distInstructions,
    vaultQuestions,
    isAdmin,
    onSuccess,
    onError,
  ])

  return {
    // State
    distTitle,
    setDistTitle,
    selectedExamMasterId,
    setSelectedExamMasterId,
    distTargetSlot,
    setDistTargetSlot,
    distAssessmentComponentId,
    setDistAssessmentComponentId,
    distClassId,
    setDistClassId,
    distSectionId,
    setDistSectionId,
    distSubjectId,
    setDistSubjectId,
    distGroupId,
    setDistGroupId,
    distDuration,
    setDistDuration,
    distPassingMark,
    setDistPassingMark,
    distStartDate,
    setDistStartDate,
    distEndDate,
    setDistEndDate,
    distShuffle,
    setDistShuffle,
    distShowResults,
    setDistShowResults,
    distPublished,
    setDistPublished,
    distInstructions,
    setDistInstructions,
    isSaving,

    // Computed
    activeClass,
    activeSectionsForClass,
    activeExam,
    activeCap,
    activeExamTotalMarks,
    selectedBundle,
    currentQuestionCount,
    totalVaultMarks,
    isExceedingCap,
    hasNoQuestionsAvailable,

    // Handlers
    handleExamMasterChange,
    handleTargetSlotChange,
    handleClassChange,
    handleSubjectChange,
    handleSubmit,
    resetForm,
    populateFromData,
  }
}
