'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  X,
  Check,
  Award,
  Search,
  ChevronLeft,
  ChevronRight,
  Printer,
  Wand2,
  Wifi,
  WifiOff,
  Laptop,
  ArrowRightLeft,
  School,
  FileSpreadsheet,
  Users
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'

interface MatrixComponent {
  code: string
  name: string
  maxMarks: number
  passMarks?: number
}

interface EvaluationMatrix {
  id: number
  name: string
  code: string
  totalMarks: number
  isDefault?: boolean
  components: MatrixComponent[]
}

interface StudentMarksRow {
  id: number
  studentId: number
  name: string
  registerNo: string
  gender: string
  photo?: string | null
  sectionName?: string
  componentMarks: Record<string, number | string>
  totalScore: number
  cbtMark?: string | null
  cbtExamTitle?: string | null
  isAbsent: boolean
  remarks: string
}

interface ClassOption {
  id: number
  name: string
  evaluationMatrixId?: number | null
  sections: Array<{ id: number; name: string }>
  subjects?: Array<{ id: number; name: string; subjectCode: string }>
}

interface SubjectOption {
  id: number
  name: string
  subjectCode: string
}

interface AssignedSubjectOption {
  id: number
  subjectId: number
  subjectName: string
  subjectCode: string
  classId: number
  className: string
  sectionId?: number
  sectionName?: string
  role?: string
}

interface ExamOption {
  id: number
  name: string
}

export function TeacherMatrixMarksEntry() {
  // Selector States
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubjectOption[]>([])
  const [exams, setExams] = useState<ExamOption[]>([])
  const [matrices, setMatrices] = useState<EvaluationMatrix[]>([])

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedMatrixId, setSelectedMatrixId] = useState<string>('')

  // Loaded Gradebook Data
  const [matrix, setMatrix] = useState<EvaluationMatrix | null>(null)
  const [gradingScale, setGradingScale] = useState<any>(null)
  const [studentRows, setStudentRows] = useState<StudentMarksRow[]>([])
  const [initialRowsState, setInitialRowsState] = useState<string>('')

  // Status States
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [savingBatch, setSavingBatch] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Offline Buffer & Network Detection
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [offlineBufferCount, setOfflineBufferCount] = useState<number>(0)

  // AI Score Assistant States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiTotalTarget, setAiTotalTarget] = useState<string>('75')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  // Search & Filter States
  const [studentSearch, setStudentSearch] = useState('')
  const [scoreFilterMode, setScoreFilterMode] = useState<'all' | 'scored' | 'cbt'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Buffer storage key
  const bufferKey = useMemo(() => {
    return `ugbekun_teacher_offline_marks_${selectedClassId}_${selectedSubjectId}_${selectedMatrixId || 'default'}`
  }, [selectedClassId, selectedSubjectId, selectedMatrixId])

  // Helper to resolve score to grade badge
  const getGradeForScore = (score: number) => {
    const totalMax = matrix?.totalMarks ? Number(matrix.totalMarks) : 100
    if (!gradingScale || !Array.isArray(gradingScale.ranges) || gradingScale.ranges.length === 0) {
      const pct = totalMax > 0 ? (score / totalMax) * 100 : score
      if (pct >= 70) return { grade: 'A', remark: 'Excellent', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
      if (pct >= 60) return { grade: 'B', remark: 'Very Good', color: 'bg-blue-100 text-blue-800 border-blue-200' }
      if (pct >= 50) return { grade: 'C', remark: 'Credit', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
      if (pct >= 45) return { grade: 'D', remark: 'Pass', color: 'bg-amber-100 text-amber-800 border-amber-200' }
      if (pct >= 40) return { grade: 'E', remark: 'Fair', color: 'bg-orange-100 text-orange-800 border-orange-200' }
      return { grade: 'F', remark: 'Fail', color: 'bg-rose-100 text-rose-800 border-rose-200' }
    }
    for (const r of gradingScale.ranges) {
      if (score >= r.minScore && score <= r.maxScore) {
        const isFail = r.grade.toUpperCase() === 'F' || (r.remark && r.remark.toLowerCase().includes('fail'))
        const isHigh = r.grade.toUpperCase() === 'A' || r.grade.toUpperCase() === 'B' || (r.gpaPoint && r.gpaPoint >= 4)
        const color = isFail
          ? 'bg-rose-100 text-rose-800 border-rose-200'
          : isHigh
          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
          : 'bg-blue-100 text-blue-800 border-blue-200'
        return { grade: r.grade, remark: r.remark || '', color }
      }
    }
    return { grade: '-', remark: '', color: 'bg-slate-100 text-slate-700 border-slate-200' }
  }

  // Network online/offline detection
  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Check offline buffer on target selection change
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) {
      setOfflineBufferCount(0)
      return
    }
    try {
      const bufferedDataStr = typeof window !== 'undefined' ? localStorage.getItem(bufferKey) : null
      if (bufferedDataStr) {
        const parsed = JSON.parse(bufferedDataStr)
        setOfflineBufferCount(Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length)
      } else {
        setOfflineBufferCount(0)
      }
    } catch {
      setOfflineBufferCount(0)
    }
  }, [bufferKey, selectedClassId, selectedSubjectId])

  // 1. Initial Load: Teacher's Classes, Subjects, Exams, and School Evaluation Matrices
  useEffect(() => {
    async function loadInitialContext() {
      try {
        setLoadingConfig(true)
        const [classesRes, subjectsRes, examsRes, matricesRes] = await Promise.all([
          apiSlice.get<{ success: boolean; assignedClasses: ClassOption[] }>(endpoints.teacher.roster),
          apiSlice.get<{
            success: boolean
            subjects: SubjectOption[]
            assignedSubjects?: AssignedSubjectOption[]
          }>(endpoints.teacher.subjects),
          apiSlice.get<{ success: boolean; exams: ExamOption[] }>(endpoints.teacher.exams),
          apiSlice.get<{ success: boolean; matrices: EvaluationMatrix[] }>(endpoints.teacher.evaluationMatrices).catch(() => ({ success: false, matrices: [] })),
        ])

        const assignedClasses = classesRes.success ? (classesRes.assignedClasses || []) : []
        const branchSubjects = subjectsRes.success ? (subjectsRes.subjects || []) : []
        const teacherAssignedSubjects = subjectsRes.success ? (subjectsRes.assignedSubjects || []) : []

        setClasses(assignedClasses)
        setSubjects(branchSubjects)
        setAssignedSubjects(teacherAssignedSubjects)

        if (matricesRes.success && Array.isArray(matricesRes.matrices)) {
          setMatrices(matricesRes.matrices)
        }

        if (examsRes.success && examsRes.exams?.length > 0) {
          setExams(examsRes.exams)
          setSelectedExamId(String(examsRes.exams[0].id))
        }

        // Check active context from Context Switcher
        let initialClassId = ''
        let initialSectionId = ''
        let initialSubjectId = ''

        try {
          const storedJson = typeof window !== 'undefined' ? localStorage.getItem('ugbekun_teacher_active_context') : null
          if (storedJson) {
            const ctx = JSON.parse(storedJson)
            if (ctx.classId && assignedClasses.some((c) => c.id === ctx.classId)) {
              initialClassId = String(ctx.classId)
              initialSectionId = ctx.sectionId ? String(ctx.sectionId) : ''
              if (ctx.capacity === 'SUBJECT_TEACHER' && ctx.subjectId) {
                initialSubjectId = String(ctx.subjectId)
              }
            }
          }
        } catch {
          // ignore
        }

        if (!initialClassId && assignedClasses.length > 0) {
          initialClassId = String(assignedClasses[0].id)
        }

        setSelectedClassId(initialClassId)
        setSelectedSectionId(initialSectionId)

        // Determine initial subject for this class
        if (initialSubjectId) {
          setSelectedSubjectId(initialSubjectId)
        } else if (initialClassId) {
          const cid = Number(initialClassId)
          const classOffered = teacherAssignedSubjects.filter((as) => as.classId === cid)
          if (classOffered.length > 0) {
            setSelectedSubjectId(String(classOffered[0].subjectId))
          } else if (branchSubjects.length > 0) {
            setSelectedSubjectId(String(branchSubjects[0].id))
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to initialize score entry.')
      } finally {
        setLoadingConfig(false)
      }
    }

    loadInitialContext()
  }, [])

  // Dynamically compute subjects offered by the selected class
  const availableSubjects = useMemo(() => {
    if (!selectedClassId) return []
    const cid = Number(selectedClassId)
    const secId = selectedSectionId ? Number(selectedSectionId) : null

    // 1. Filter assignedSubjects by classId (and sectionId if specified)
    const filtered = assignedSubjects.filter((as) => {
      if (as.classId !== cid) return false
      if (secId && as.sectionId && as.sectionId !== secId) return false
      return true
    })

    // Deduplicate by subjectId
    const map = new Map<number, SubjectOption>()
    for (const item of filtered) {
      if (!map.has(item.subjectId)) {
        map.set(item.subjectId, {
          id: item.subjectId,
          name: item.subjectName,
          subjectCode: item.subjectCode,
        })
      }
    }

    if (map.size > 0) {
      return Array.from(map.values())
    }

    const targetClass = classes.find((c) => c.id === cid)
    if (targetClass?.subjects && targetClass.subjects.length > 0) {
      return targetClass.subjects
    }

    return subjects
  }, [assignedSubjects, classes, selectedClassId, selectedSectionId, subjects])

  // Keep selectedSubjectId synchronized with availableSubjects
  useEffect(() => {
    if (availableSubjects.length > 0) {
      const exists = availableSubjects.some((s) => String(s.id) === selectedSubjectId)
      if (!exists) {
        setSelectedSubjectId(String(availableSubjects[0].id))
      }
    } else {
      setSelectedSubjectId('')
    }
  }, [availableSubjects, selectedSubjectId])

  // Listen to Top Bar Context Switcher
  useEffect(() => {
    const handleContextSwitch = (e: any) => {
      const ctx = e.detail
      if (!ctx || !ctx.classId) return

      setSelectedClassId(String(ctx.classId))
      setSelectedSectionId(ctx.sectionId ? String(ctx.sectionId) : '')

      if (ctx.capacity === 'SUBJECT_TEACHER' && ctx.subjectId) {
        setSelectedSubjectId(String(ctx.subjectId))
      }
    }

    window.addEventListener('ugbekun-context-changed', handleContextSwitch)
    return () => window.removeEventListener('ugbekun-context-changed', handleContextSwitch)
  }, [])

  // 2. Load Gradebook Sheet with School's Active Evaluation Matrix
  const fetchMarksSheet = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      return
    }

    try {
      setLoadingSheet(true)
      const params = new URLSearchParams()
      params.append('classId', selectedClassId)
      params.append('subjectId', selectedSubjectId)
      if (selectedSectionId) params.append('sectionId', selectedSectionId)
      if (selectedExamId) params.append('examId', selectedExamId)
      if (selectedMatrixId) params.append('matrixId', selectedMatrixId)

      const res = await apiSlice.get<{
        success: boolean
        matrix: EvaluationMatrix
        matrices?: EvaluationMatrix[]
        gradingScale?: any
        students: any[]
        marksMap?: Record<number, any>
        exams?: ExamOption[]
        classData?: { id: number; name: string; evaluationMatrixId?: number | null }
      }>(endpoints.teacher.marksEntry(params.toString()))

      if (res.success) {
        setMatrix(res.matrix)
        if (res.matrices && Array.isArray(res.matrices) && res.matrices.length > 0) {
          setMatrices(res.matrices)
        }
        if (res.gradingScale) {
          setGradingScale(res.gradingScale)
        }

        // Align matrix selector
        if (!selectedMatrixId) {
          const defaultMatId = res.classData?.evaluationMatrixId || res.matrix?.id
          if (defaultMatId) {
            setSelectedMatrixId(String(defaultMatId))
          }
        }

        const marksMap = res.marksMap || {}
        let rows: StudentMarksRow[] = (res.students || []).map((s: any) => {
          const sId = Number(s.studentId || s.id)
          const markData = marksMap[sId] || {}
          const existingComps = markData.components || s.componentMarks || {}

          // Compute total score
          const total = Object.values(existingComps).reduce((a: number, b: any) => a + (Number(b) || 0), 0)

          return {
            id: sId,
            studentId: sId,
            name: s.name || `${s.lastName || ''}, ${s.firstName || ''}`,
            registerNo: s.registerNo || '',
            gender: s.gender || '',
            photo: s.photo || null,
            sectionName: s.sectionName || '',
            componentMarks: existingComps,
            totalScore: Number(total) || 0,
            cbtMark: s.cbtMark ?? markData.cbtMark ?? null,
            cbtExamTitle: s.cbtExamTitle ?? markData.cbtExamTitle ?? null,
            isAbsent: markData.absent !== undefined ? markData.absent : (s.isAbsent || false),
            remarks: markData.remarks || s.remarks || '',
          }
        })

        // Restore offline buffer if available
        try {
          const bufferedStr = typeof window !== 'undefined' ? localStorage.getItem(bufferKey) : null
          if (bufferedStr) {
            const bufferedRows: StudentMarksRow[] = JSON.parse(bufferedStr)
            if (Array.isArray(bufferedRows) && bufferedRows.length > 0) {
              const bufferMap = new Map(bufferedRows.map((b) => [Number(b.studentId || b.id), b]))
              rows = rows.map((r) => {
                const bRow = bufferMap.get(r.studentId)
                if (bRow) {
                  return {
                    ...r,
                    componentMarks: bRow.componentMarks,
                    totalScore: bRow.totalScore,
                    isAbsent: bRow.isAbsent,
                  }
                }
                return r
              })
              setOfflineBufferCount(rows.length)
            }
          }
        } catch (e) {
          console.warn('Failed to parse offline buffer:', e)
        }

        setStudentRows(rows)
        setInitialRowsState(JSON.stringify(rows))
        setHasUnsavedChanges(false)

        if (res.exams && res.exams.length > 0 && !selectedExamId) {
          setSelectedExamId(String(res.exams[0].id))
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load assessment sheet.')
      setStudentRows([])
      setMatrix(null)
    } finally {
      setLoadingSheet(false)
    }
  }

  // Auto-fetch when Class, Subject, Section, Exam, or Matrix changes
  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      fetchMarksSheet()
    }
  }, [selectedClassId, selectedSubjectId, selectedSectionId, selectedExamId, selectedMatrixId])

  // Handle Score Input Change for a student component
  const handleScoreChange = (targetStudentId: number, compKey: string, value: string) => {
    const numVal = value === '' ? '' : Math.max(0, Number(value) || 0)

    setStudentRows((prev) => {
      const next = prev.map((row) => {
        const rowStudentId = Number(row.studentId || row.id)
        if (rowStudentId !== targetStudentId) return row

        const updatedComp = {
          ...(row.componentMarks || {}),
          [compKey]: numVal,
        }

        // Live Total Calculation
        const total = Object.values(updatedComp).reduce((a, b) => a + (Number(b) || 0), 0)

        return {
          ...row,
          componentMarks: updatedComp,
          totalScore: total,
          isAbsent: false,
        }
      })

      // Auto-save to LocalStorage Offline Sync Buffer
      try {
        localStorage.setItem(bufferKey, JSON.stringify(next))
        setOfflineBufferCount(next.length)
      } catch (e) {
        // quota exceeded fallback
      }

      return next
    })
    setHasUnsavedChanges(true)
  }

  // Handle Absent Toggle
  const handleToggleAbsent = (targetStudentId: number) => {
    setStudentRows((prev) => {
      const next = prev.map((row) => {
        const rowStudentId = Number(row.studentId || row.id)
        if (rowStudentId !== targetStudentId) return row
        const newAbsent = !row.isAbsent
        return {
          ...row,
          isAbsent: newAbsent,
          totalScore: newAbsent ? 0 : row.totalScore,
        }
      })

      try {
        localStorage.setItem(bufferKey, JSON.stringify(next))
        setOfflineBufferCount(next.length)
      } catch (e) {}

      return next
    })
    setHasUnsavedChanges(true)
  }

  // Sync a single student's CBT Score to matrix Exam component
  const handleSyncSingleCbt = (targetStudentId: number) => {
    if (!matrix || !Array.isArray(matrix.components) || matrix.components.length === 0) return
    const targetComp =
      matrix.components.find((c) => /exam|terminal|cbt|objective|theory/i.test(c.name || c.code)) ||
      matrix.components[matrix.components.length - 1]
    const targetKey = targetComp.code || targetComp.name

    setStudentRows((prev) => {
      const next = prev.map((row) => {
        const rowId = Number(row.studentId || row.id)
        if (rowId === targetStudentId && row.cbtMark !== null && row.cbtMark !== undefined && String(row.cbtMark).trim() !== '') {
          const numCbt = Number(row.cbtMark) || 0
          const updated = {
            ...(row.componentMarks || {}),
            [targetKey]: numCbt,
          }
          const total = Object.values(updated).reduce((a, b) => a + (Number(b) || 0), 0)
          return {
            ...row,
            componentMarks: updated,
            totalScore: total,
            isAbsent: false,
          }
        }
        return row
      })

      try {
        localStorage.setItem(bufferKey, JSON.stringify(next))
        setOfflineBufferCount(next.length)
      } catch (e) {}

      return next
    })
    setHasUnsavedChanges(true)
    toast.success(`CBT score synced into "${targetComp.name}".`)
  }

  // Sync All CBT Scores to the Exam component
  const handleSyncAllCbtToExam = () => {
    if (!matrix || !Array.isArray(matrix.components) || matrix.components.length === 0) return
    const targetComp =
      matrix.components.find((c) => /exam|terminal|cbt|objective|theory/i.test(c.name || c.code)) ||
      matrix.components[matrix.components.length - 1]
    const targetKey = targetComp.code || targetComp.name

    let synced = 0
    setStudentRows((prev) => {
      const next = prev.map((row) => {
        if (row.cbtMark !== null && row.cbtMark !== undefined && String(row.cbtMark).trim() !== '') {
          const numCbt = Number(row.cbtMark) || 0
          const updated = {
            ...(row.componentMarks || {}),
            [targetKey]: numCbt,
          }
          const total = Object.values(updated).reduce((a, b) => a + (Number(b) || 0), 0)
          synced++
          return {
            ...row,
            componentMarks: updated,
            totalScore: total,
            isAbsent: false,
          }
        }
        return row
      })

      try {
        localStorage.setItem(bufferKey, JSON.stringify(next))
        setOfflineBufferCount(next.length)
      } catch (e) {}

      return next
    })

    setHasUnsavedChanges(true)
    toast.success(`Synchronized CBT scores for ${synced} student(s) into matrix component "${targetComp.name}".`)
  }

  // Batch Save Scores to Server
  const handleBatchSave = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedExamId) {
      toast.error('Class, Subject, and Assessment Term are required to commit scores.')
      return
    }

    try {
      setSavingBatch(true)
      const marksPayload = studentRows.map((r) => ({
        studentId: Number(r.studentId || r.id),
        components: r.componentMarks,
        componentMarks: r.componentMarks,
        absent: Boolean(r.isAbsent),
        isAbsent: Boolean(r.isAbsent),
      }))

      const payload = {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        subjectId: Number(selectedSubjectId),
        examId: Number(selectedExamId),
        marks: marksPayload,
        entries: marksPayload,
      }

      const res = await apiSlice.post<{ success: boolean; message?: string }>(
        endpoints.teacher.saveMarksEntryBatch,
        payload
      )

      if (res.success) {
        toast.success(res.message || 'All student scores saved successfully.')
        setHasUnsavedChanges(false)
        setInitialRowsState(JSON.stringify(studentRows))

        // Clear offline buffer on successful save
        try {
          localStorage.removeItem(bufferKey)
          setOfflineBufferCount(0)
        } catch (e) {}
      } else {
        toast.error(res.message || 'Failed to save scores.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error while saving marks. Saved to offline buffer instead.')
    } finally {
      setSavingBatch(false)
    }
  }

  // Run AI Proportional Score Distribution
  const handleRunAiScoreDistribution = async () => {
    if (!matrix || !Array.isArray(matrix.components) || matrix.components.length === 0) return
    setIsGeneratingAi(true)

    try {
      const targetScoreNum = Number(aiTotalTarget) || 75
      const studentTotals = studentRows.map((s) => ({
        studentId: Number(s.studentId || s.id),
        totalScore: targetScoreNum,
      }))

      let distributedMap: Record<number, any> = {}

      try {
        const res = await apiSlice.post<{
          success: boolean
          distributedMarksMap: Record<number, { totalScore: number; components: Record<string, number> }>
        }>(endpoints.teacher.aiDistributeMarks, {
          matrixComponents: matrix.components,
          studentTotals,
        })
        if (res.success && res.distributedMarksMap) {
          distributedMap = res.distributedMarksMap
        }
      } catch {
        // Fallback proportional distribution
        const maxTotal = matrix.totalMarks || matrix.components.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0) || 100
        studentTotals.forEach((st) => {
          const score = Math.min(Math.max(st.totalScore, 0), maxTotal)
          const compScores: Record<string, number> = {}
          let allocated = 0
          matrix.components.forEach((c, idx) => {
            const compMax = Number(c.maxMarks) || 0
            const compKey = c.code || c.name
            if (idx === matrix.components.length - 1) {
              compScores[compKey] = Math.max(0, Math.round(score - allocated))
            } else {
              const ratio = compMax / maxTotal
              const assigned = Math.round(score * ratio)
              compScores[compKey] = assigned
              allocated += assigned
            }
          })
          distributedMap[st.studentId] = { totalScore: score, components: compScores }
        })
      }

      setStudentRows((prev) => {
        const next = prev.map((row) => {
          const rId = Number(row.studentId || row.id)
          const aiData = distributedMap[rId]
          if (aiData) {
            return {
              ...row,
              componentMarks: aiData.components,
              totalScore: aiData.totalScore,
              isAbsent: false,
            }
          }
          return row
        })

        try {
          localStorage.setItem(bufferKey, JSON.stringify(next))
          setOfflineBufferCount(next.length)
        } catch (e) {}

        return next
      })

      setHasUnsavedChanges(true)
      setIsAiModalOpen(false)
      toast.success('AI Score Distribution applied across student roster!')
    } catch (err: any) {
      toast.error('Failed to run AI distribution.')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // Filter sections for the selected class
  const currentSections = useMemo(() => {
    if (!selectedClassId) return []
    const cls = classes.find((c) => String(c.id) === String(selectedClassId))
    return cls?.sections || []
  }, [classes, selectedClassId])

  // Filter and Search student rows
  const filteredRows = useMemo(() => {
    return studentRows.filter((st) => {
      // Search Query filter
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim()
        const matchesName = st.name.toLowerCase().includes(q)
        const matchesReg = st.registerNo && st.registerNo.toLowerCase().includes(q)
        if (!matchesName && !matchesReg) return false
      }

      // Tab filter
      if (scoreFilterMode === 'scored') {
        return !st.isAbsent && st.totalScore > 0
      }
      if (scoreFilterMode === 'cbt') {
        return st.cbtMark !== null && st.cbtMark !== undefined && String(st.cbtMark).trim() !== ''
      }

      return true
    })
  }, [studentRows, studentSearch, scoreFilterMode])

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedClassId, selectedSectionId, selectedSubjectId, selectedExamId, selectedMatrixId, studentSearch, scoreFilterMode])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredRows.length)

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(startIndex, endIndex)
  }, [filteredRows, startIndex, endIndex])

  // Statistical aggregates
  const scoredCount = useMemo(() => {
    return studentRows.filter((s) => !s.isAbsent && s.totalScore > 0).length
  }, [studentRows])

  const cbtCount = useMemo(() => {
    return studentRows.filter((s) => s.cbtMark !== null && s.cbtMark !== undefined && String(s.cbtMark).trim() !== '').length
  }, [studentRows])

  const classAvgScore = useMemo(() => {
    const present = studentRows.filter((s) => !s.isAbsent)
    if (present.length === 0) return '0.0'
    const totalSum = present.reduce((acc, s) => acc + s.totalScore, 0)
    return (totalSum / present.length).toFixed(1)
  }, [studentRows])

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner matching Admin standard */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 border border-white/15">
              <FileSpreadsheet size={14} className="text-emerald-300" />
              <span>Classroom Assessments & Marks Gradebook</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Student Assessment Desk
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl">
              Enter continuous assessment and exam marks strictly for your allocated classrooms. Dynamic evaluation matrix components, AI proportional distribution, and CBT score synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {cbtCount > 0 && (
              <button
                type="button"
                onClick={handleSyncAllCbtToExam}
                className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                title="Auto-fill CBT marks into Examination column"
              >
                <ArrowRightLeft size={14} /> Sync All CBT to Exam
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              disabled={!matrix}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Wand2 size={15} /> AI Score Assistant
            </button>

            <button
              type="button"
              onClick={handleBatchSave}
              disabled={savingBatch || studentRows.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {savingBatch ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>Save Marks to Server</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/15 cursor-pointer"
              title="Print Score Sheet"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Enrolled Students</span>
            <Users size={16} className="text-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{studentRows.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active in this classroom</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Scored Students</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">{scoredCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {studentRows.length > 0 ? Math.round((scoredCount / studentRows.length) * 100) : 0}% completed
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Class Average</span>
            <TrendingUp size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700">
            {classAvgScore} <span className="text-xs font-normal text-slate-400">/{matrix?.totalMarks || 100}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Calculated across active marks</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">CBT Online Tests</span>
            <Laptop size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700">{cbtCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Submissions detected</div>
        </div>
      </div>

      {/* SELECTORS & MATRIX BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* 1. Class Selector (Strictly Teacher's Allocated Classes) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Class <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 h-11">
              <School size={16} className="text-emerald-600 shrink-0" />
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value)
                  setSelectedSectionId('')
                }}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full cursor-pointer"
              >
                {classes.length === 0 ? (
                  <option value="">No Classes Allocated</option>
                ) : (
                  classes.map((cls) => (
                    <option key={`c-${cls.id}`} value={cls.id}>
                      {cls.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 2. Section Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Section
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 h-11">
              <Layers size={16} className="text-purple-600 shrink-0" />
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full cursor-pointer"
              >
                <option value="">All Sections</option>
                {currentSections.map((sec) => (
                  <option key={`s-${sec.id}`} value={sec.id}>
                    Section {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Subject Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Subject <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 h-11">
              <BookOpen size={16} className="text-blue-600 shrink-0" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={availableSubjects.length === 0}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full cursor-pointer disabled:opacity-50"
              >
                {availableSubjects.length === 0 ? (
                  <option value="">No Subjects Available</option>
                ) : (
                  availableSubjects.map((sub) => (
                    <option key={`sub-${sub.id}`} value={sub.id}>
                      {sub.name} {sub.subjectCode ? `(${sub.subjectCode})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 4. Evaluation Matrix Scheme Selector (Created by Admin) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Matrix Scheme <span className="text-amber-500">*</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 h-11">
              <Award size={16} className="text-amber-500 shrink-0" />
              <select
                value={selectedMatrixId}
                onChange={(e) => setSelectedMatrixId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full cursor-pointer"
              >
                {matrices.length === 0 ? (
                  <option value="">{matrix ? `${matrix.name} (${matrix.code})` : 'Default Assessment Matrix'}</option>
                ) : (
                  matrices.map((m) => (
                    <option key={`mat-${m.id}`} value={m.id}>
                      {m.name} ({m.code}) — {m.totalMarks} Marks
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 5. Exam / Term Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Assessment Term <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 h-11">
              <Calendar size={16} className="text-emerald-600 shrink-0" />
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full cursor-pointer"
              >
                {exams.map((ex) => (
                  <option key={`ex-${ex.id}`} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Bar & Active Matrix Breakdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {isOnline ? <Wifi size={13} className="text-emerald-600" /> : <WifiOff size={13} className="text-rose-600" />}
              {isOnline ? 'Online Sync Active' : 'Offline Mode (Local Buffer Active)'}
            </span>

            {offlineBufferCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                <RefreshCw size={12} className="animate-spin text-amber-600" />
                {offlineBufferCount} local unsaved entries buffered
              </span>
            )}

            {hasUnsavedChanges && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                Unsaved Changes
              </span>
            )}
          </div>

          {matrix && Array.isArray(matrix.components) && matrix.components.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-700">
              <span className="text-slate-400 text-[11px]">Matrix Breakdown:</span>
              {matrix.components.map((c) => (
                <span
                  key={`pill-${c.code || c.name}`}
                  className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-mono"
                >
                  {c.name || c.code}: <strong className="text-slate-900">{c.maxMarks}</strong> Marks
                </span>
              ))}
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold">
                Total: {matrix.totalMarks}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SEARCH & SCORE FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search student by name or register no..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 outline-none w-full"
          />
          {studentSearch && (
            <button
              type="button"
              onClick={() => setStudentSearch('')}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setScoreFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              scoreFilterMode === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Students ({studentRows.length})
          </button>
          <button
            type="button"
            onClick={() => setScoreFilterMode('scored')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              scoreFilterMode === 'scored'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Scored Only ({scoredCount})
          </button>
          <button
            type="button"
            onClick={() => setScoreFilterMode('cbt')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              scoreFilterMode === 'cbt'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            CBT Online ({cbtCount})
          </button>
        </div>
      </div>

      {/* GRADEBOOK SCORE ENTRY SPREADSHEET TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadingSheet ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <p className="text-xs text-slate-500 font-medium">Loading evaluation matrix score sheet...</p>
          </div>
        ) : studentRows.length > 0 && matrix ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3">Reg. No</th>
                    <th className="p-3">Student Name</th>

                    {/* Matrix Component Headers */}
                    {(Array.isArray(matrix.components) ? matrix.components : []).map((comp) => (
                      <th key={`hdr-${comp.code || comp.name}`} className="p-3 text-center min-w-[100px]">
                        <div className="font-extrabold text-slate-900">{comp.name || comp.code}</div>
                        <div className="text-[10px] text-emerald-700 font-mono">Max: {comp.maxMarks}</div>
                      </th>
                    ))}

                    <th className="p-3 text-center min-w-[100px] bg-slate-100/70">
                      <div className="font-extrabold text-slate-900">Total</div>
                      <div className="text-[10px] text-slate-400 font-normal">/{matrix.totalMarks}</div>
                    </th>

                    <th className="p-3 text-center min-w-[90px]">CBT Test</th>
                    <th className="p-3 text-center min-w-[80px]">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.map((st, idx) => {
                    const stId = Number(st.studentId || st.id)
                    const isRowScored = !st.isAbsent && st.totalScore > 0

                    return (
                      <tr
                        key={`row-${stId}`}
                        className={`hover:bg-slate-50/80 transition ${
                          st.isAbsent ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                          {startIndex + idx + 1}
                        </td>
                        <td className="p-3 font-mono text-slate-600 font-semibold">{st.registerNo || 'N/A'}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{st.name}</span>
                            {st.sectionName && (
                              <span className="text-[10px] font-normal text-slate-400">({st.sectionName})</span>
                            )}
                          </div>
                        </td>

                        {/* Matrix Dynamic Component Inputs */}
                        {(Array.isArray(matrix.components) ? matrix.components : []).map((comp) => {
                          const compKey = comp.code || comp.name
                          const currentVal = st.componentMarks?.[compKey] ?? st.componentMarks?.[comp.code] ?? ''
                          const numVal = Number(currentVal) || 0
                          const isOverMax = currentVal !== '' && numVal > comp.maxMarks

                          return (
                            <td key={`input-${stId}-${compKey}`} className="p-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                max={comp.maxMarks}
                                disabled={st.isAbsent}
                                value={st.isAbsent ? '' : currentVal}
                                onChange={(e) => handleScoreChange(stId, compKey, e.target.value)}
                                placeholder={st.isAbsent ? 'ABS' : '0'}
                                className={`w-20 h-10 text-center font-bold font-mono text-xs rounded-xl border transition focus:outline-hidden focus:ring-2 ${
                                  isOverMax
                                    ? 'bg-rose-50 border-rose-400 text-rose-700 focus:ring-rose-500'
                                    : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500'
                                } ${st.isAbsent ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
                              />
                            </td>
                          )
                        })}

                        {/* Auto-Calculated Total & Grade Badge */}
                        <td className="p-2.5 text-center bg-slate-50/70">
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className={`font-mono font-black text-xs px-2 py-1 rounded-md ${
                                st.isAbsent
                                  ? 'bg-rose-100 text-rose-700'
                                  : isRowScored
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200/80 text-slate-700'
                              }`}
                            >
                              {st.isAbsent ? 'ABS' : st.totalScore}
                            </span>
                            {!st.isAbsent && (
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black border ${
                                  getGradeForScore(st.totalScore).color
                                }`}
                                title={getGradeForScore(st.totalScore).remark}
                              >
                                {getGradeForScore(st.totalScore).grade}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* CBT Test Column with Quick 1-Click Sync */}
                        <td className="p-2.5 text-center">
                          {st.cbtMark !== null && st.cbtMark !== undefined && String(st.cbtMark).trim() !== '' ? (
                            <div className="flex items-center justify-center gap-1">
                              <span
                                className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono font-bold text-xs border border-purple-200"
                                title={st.cbtExamTitle || 'CBT Online Test'}
                              >
                                {st.cbtMark}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSyncSingleCbt(stId)}
                                className="p-1 text-slate-400 hover:text-purple-600 transition cursor-pointer"
                                title="Copy CBT score into Exam component"
                              >
                                <ArrowRightLeft size={13} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-mono">-</span>
                          )}
                        </td>

                        {/* Attendance Toggle */}
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAbsent(stId)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              st.isAbsent
                                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            }`}
                          >
                            {st.isAbsent ? 'Absent' : 'Present'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredRows.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Showing</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {filteredRows.length === 0 ? 0 : startIndex + 1}–{endIndex}
                  </span>
                  <span>of</span>
                  <span className="font-bold text-slate-900 font-mono">{filteredRows.length}</span>
                  <span>students</span>

                  <span className="text-slate-300 mx-2">|</span>

                  <label className="text-slate-500 font-medium">Per page:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, pIdx, arr) => {
                        const prevPage = arr[pIdx - 1]
                        return (
                          <div key={`page-${p}`} className="flex items-center">
                            {prevPage && p - prevPage > 1 && (
                              <span className="px-1 text-slate-400 font-bold">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={`h-8 min-w-[32px] px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                                currentPage === p
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white'
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        )
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-16 text-center">
            <Building2 className="mx-auto text-slate-300 mb-3" size={36} />
            <h4 className="text-sm font-bold text-slate-800">No Assessment Data</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Select a class and subject to populate the school&apos;s active score sheet.
            </p>
          </div>
        )}
      </div>

      {/* AI Score Assistant Modal */}
      {isAiModalOpen && matrix && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Wand2 size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">AI Score Assistant</h3>
                  <p className="text-[11px] text-slate-500">Proportional Matrix Score Distribution</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter an overall benchmark score (out of <strong>{matrix.totalMarks}</strong>). The AI assistant will automatically calculate and distribute scores across all categories of <strong>{matrix.name}</strong> according to each component&apos;s weighting.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Benchmark Score</label>
                <input
                  type="number"
                  min="0"
                  max={matrix.totalMarks}
                  value={aiTotalTarget}
                  onChange={(e) => setAiTotalTarget(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {Array.isArray(matrix.components) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Categories to be allocated:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matrix.components.map((c) => (
                      <span
                        key={`ai-comp-${c.code || c.name}`}
                        className="px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] font-mono border border-slate-200 font-bold"
                      >
                        {c.name || c.code} (max: {c.maxMarks})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunAiScoreDistribution}
                disabled={isGeneratingAi}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Apply Distribution</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
