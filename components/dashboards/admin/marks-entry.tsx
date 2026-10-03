'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  FileSpreadsheet,
  Save,
  Wand2,
  Wifi,
  WifiOff,
  RefreshCw,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  School,
  BookOpen,
  Layers,
  Sparkles,
  Info,
  Check,
  X,
  Award,
  Monitor,
  Search,
  ArrowRightLeft,
  Laptop
} from 'lucide-react'

interface ClassOption {
  id: number
  name: string
  evaluationMatrixId?: number | null
  sections: { section: { id: number; name: string } }[]
}

interface SubjectOption {
  id: number
  name: string
  subjectCode: string
}

interface EvaluationMatrixData {
  id: number
  name: string
  code: string
  totalMarks: number
  components: { name: string; code: string; maxMarks: number; passMarks?: number }[]
}

interface StudentItem {
  id: number
  name: string
  roll?: string | null
  registerNo?: string | null
  sectionName?: string
}

interface StudentMarkState {
  components: Record<string, number | string>
  cbtMark?: string | null
  cbtExamTitle?: string | null
  cbtTotalMarks?: number | null
  cbtSource?: string | null
  absent: boolean
}

export function MarksEntry() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [allMatrices, setAllMatrices] = useState<EvaluationMatrixData[]>([])

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')

  const [currentMatrix, setCurrentMatrix] = useState<EvaluationMatrixData | null>(null)
  const [students, setStudents] = useState<StudentItem[]>([])
  const [marksState, setMarksState] = useState<Record<number, StudentMarkState>>({})

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Score View Mode & Search States
  const [scoreViewMode, setScoreViewMode] = useState<'all' | 'marks' | 'cbt'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Offline Buffer State
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [offlineBufferCount, setOfflineBufferCount] = useState<number>(0)

  // Matrix Assignment State
  const [assignedMatrixId, setAssignedMatrixId] = useState<string>('')
  const [isAssigningMatrix, setIsAssigningMatrix] = useState<boolean>(false)

  // AI Modal States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiTotalTarget, setAiTotalTarget] = useState<string>('75')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  useEffect(() => {
    loadSetupData()

    // Detect browser online/offline status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      fetchMarksData()
    }
  }, [selectedClassId, selectedSectionId, selectedSubjectId])

  useEffect(() => {
    checkOfflineBuffer()
  }, [selectedClassId, selectedSubjectId])

  const loadSetupData = async () => {
    try {
      const [classRes, subRes, matrixRes] = await Promise.all([
        apiSlice.get<{ success: boolean; classes: ClassOption[] }>(endpoints.admin.classesSections),
        apiSlice.get<{ success: boolean; subjects: SubjectOption[] }>(endpoints.admin.subjects),
        apiSlice.get<{ success: boolean; matrices: EvaluationMatrixData[] }>(endpoints.admin.evaluationMatrices),
      ])

      if (classRes.success && classRes.classes) {
        setClasses(classRes.classes)
        if (classRes.classes.length > 0) {
          const firstCls = classRes.classes[0]
          setSelectedClassId(String(firstCls.id))
          if (firstCls.sections && firstCls.sections.length > 0) {
            setSelectedSectionId(String(firstCls.sections[0].section.id))
          }
        }
      }

      if (subRes.success && subRes.subjects) {
        setSubjects(subRes.subjects)
        if (subRes.subjects.length > 0) {
          setSelectedSubjectId(String(subRes.subjects[0].id))
        }
      }

      if (matrixRes.success && matrixRes.matrices) {
        setAllMatrices(matrixRes.matrices)
      }
    } catch (err) {
      console.error('Failed to load setup data for marks entry:', err)
    }
  }

  const fetchMarksData = async () => {
    if (!selectedClassId || !selectedSubjectId) return
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await apiSlice.get<{
        success: boolean
        matrix: EvaluationMatrixData
        students: StudentItem[]
        marksMap: Record<
          number,
          {
            id: number
            mark?: string
            cbtMark?: string | null
            cbtExamTitle?: string | null
            cbtTotalMarks?: number | null
            cbtSource?: string | null
            absent: boolean
            components?: Record<string, number | string>
          }
        >
        classData: { id: number; name: string; evaluationMatrixId?: number | null }
      }>(
        endpoints.admin.marksEntry(
          Number(selectedClassId),
          selectedSectionId ? Number(selectedSectionId) : undefined,
          Number(selectedSubjectId)
        )
      )

      if (res.success) {
        setCurrentMatrix(res.matrix)
        setStudents(res.students)
        setAssignedMatrixId(
          res.classData.evaluationMatrixId ? String(res.classData.evaluationMatrixId) : res.matrix?.id ? String(res.matrix.id) : ''
        )

        // Build initial mark state per student
        const initialMarks: Record<number, StudentMarkState> = {}

        res.students.forEach((stu) => {
          const existing = res.marksMap?.[stu.id]
          const studentComponents: Record<string, number | string> = {}

          if (res.matrix && Array.isArray(res.matrix.components)) {
            res.matrix.components.forEach((comp) => {
              const compKey = comp.code || comp.name
              studentComponents[compKey] =
                existing?.components?.[compKey] !== undefined ? existing.components[compKey] : ''
            })
          }

          initialMarks[stu.id] = {
            components: studentComponents,
            cbtMark: existing?.cbtMark || null,
            cbtExamTitle: existing?.cbtExamTitle || null,
            cbtTotalMarks: existing?.cbtTotalMarks || null,
            cbtSource: existing?.cbtSource || null,
            absent: existing?.absent || false,
          }
        })

        // Check if there is an offline buffer for this class & subject
        const bufferKey = `ugbekun_offline_marks_${selectedClassId}_${selectedSubjectId}`
        const bufferedDataStr = localStorage.getItem(bufferKey)
        if (bufferedDataStr) {
          try {
            const bufferedData = JSON.parse(bufferedDataStr)
            Object.keys(bufferedData).forEach((sIdStr) => {
              const sId = Number(sIdStr)
              if (initialMarks[sId]) {
                initialMarks[sId] = bufferedData[sId]
              }
            })
          } catch (e) {
            console.error('Failed to parse offline buffer:', e)
          }
        }

        setMarksState(initialMarks)
      }
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load marks entry roster.')
    } finally {
      setIsLoading(false)
    }
  }

  const checkOfflineBuffer = () => {
    if (!selectedClassId || !selectedSubjectId) return
    const bufferKey = `ugbekun_offline_marks_${selectedClassId}_${selectedSubjectId}`
    const bufferedDataStr = localStorage.getItem(bufferKey)
    if (bufferedDataStr) {
      try {
        const bufferedData = JSON.parse(bufferedDataStr)
        setOfflineBufferCount(Object.keys(bufferedData).length)
      } catch (e) {
        setOfflineBufferCount(0)
      }
    } else {
      setOfflineBufferCount(0)
    }
  }

  const handleComponentScoreChange = (studentId: number, compKey: string, value: string) => {
    setMarksState((prev) => {
      const currentStudentMark = prev[studentId] || { components: {}, absent: false }
      const updatedComponents = { ...currentStudentMark.components, [compKey]: value }
      const updatedState = {
        ...prev,
        [studentId]: { ...currentStudentMark, components: updatedComponents },
      }

      // Auto-save to LocalStorage Offline Sync Buffer
      const bufferKey = `ugbekun_offline_marks_${selectedClassId}_${selectedSubjectId}`
      localStorage.setItem(bufferKey, JSON.stringify(updatedState))
      setOfflineBufferCount(students.length)

      return updatedState
    })
  }

  const handleAbsentToggle = (studentId: number, absent: boolean) => {
    setMarksState((prev) => {
      const currentStudentMark = prev[studentId] || { components: {}, absent: false }
      const updatedState = {
        ...prev,
        [studentId]: { ...currentStudentMark, absent },
      }

      const bufferKey = `ugbekun_offline_marks_${selectedClassId}_${selectedSubjectId}`
      localStorage.setItem(bufferKey, JSON.stringify(updatedState))
      setOfflineBufferCount(students.length)

      return updatedState
    })
  }

  const handleAssignMatrixToClass = async (matrixIdStr: string) => {
    if (!selectedClassId) return
    setIsAssigningMatrix(true)
    try {
      await apiSlice.post(endpoints.admin.assignClassMatrix, {
        classId: Number(selectedClassId),
        evaluationMatrixId: matrixIdStr ? Number(matrixIdStr) : null,
      })

      setAssignedMatrixId(matrixIdStr)
      setSuccessMsg('Evaluation Matrix assigned to class.')
      await fetchMarksData()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg('Failed to assign matrix to class.')
    } finally {
      setIsAssigningMatrix(false)
    }
  }

  const handleSaveMarksBatch = async () => {
    if (!selectedClassId || !selectedSubjectId) return
    setIsSaving(true)
    setErrorMsg(null)

    try {
      const payloadMarks = students.map((stu) => {
        const markObj = marksState[stu.id] || { components: {}, absent: false }
        return {
          studentId: stu.id,
          components: markObj.components,
          absent: markObj.absent,
        }
      })

      await apiSlice.post(endpoints.admin.saveMarksBatch, {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        subjectId: Number(selectedSubjectId),
        marks: payloadMarks,
      })

      // Clear local offline buffer for this class & subject upon successful server save
      const bufferKey = `ugbekun_offline_marks_${selectedClassId}_${selectedSubjectId}`
      localStorage.removeItem(bufferKey)
      setOfflineBufferCount(0)

      setSuccessMsg('Marks saved successfully to server.')
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save marks to server. Saved to offline buffer instead.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunAiScoreDistribution = async () => {
    if (!currentMatrix || !currentMatrix.components) return
    setIsGeneratingAi(true)

    try {
      const targetScoreNum = Number(aiTotalTarget) || 75
      const studentTotals = students.map((s) => ({
        studentId: s.id,
        totalScore: targetScoreNum,
      }))

      const res = await apiSlice.post<{
        success: boolean
        distributedMarksMap: Record<number, { totalScore: number; components: Record<string, number> }>
      }>(endpoints.admin.aiDistributeMarks, {
        classId: Number(selectedClassId),
        matrixComponents: currentMatrix.components,
        studentTotals,
      })

      if (res.success && res.distributedMarksMap) {
        setMarksState((prev) => {
          const updated = { ...prev }
          students.forEach((stu) => {
            const aiData = res.distributedMarksMap[stu.id]
            if (aiData) {
              updated[stu.id] = {
                components: aiData.components,
                absent: false,
              }
            }
          })

          const bufferKey = `ugbekun_offline_marks_${selectedClassId}_${selectedSubjectId}`
          localStorage.setItem(bufferKey, JSON.stringify(updated))
          setOfflineBufferCount(students.length)

          return updated
        })

        setIsAiModalOpen(false)
        setSuccessMsg('AI Score Distribution applied to student roster!')
        setTimeout(() => setSuccessMsg(null), 3500)
      }
    } catch (err: any) {
      console.error('AI distribution error:', err)
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const matrixTotalMarks = currentMatrix?.totalMarks
    ? Number(currentMatrix.totalMarks)
    : (currentMatrix?.components?.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0) || 100)

  const calculateStudentTotal = (studentId: number) => {
    const markObj = marksState[studentId]
    if (!markObj || markObj.absent || !currentMatrix) return 0

    let sum = 0
    currentMatrix.components.forEach((comp) => {
      const compKey = comp.code || comp.name
      const val = Number(markObj.components?.[compKey]) || 0
      sum += val
    })
    return sum
  }

  const getGradeBadge = (score: number) => {
    const totalMax = matrixTotalMarks > 0 ? matrixTotalMarks : 100
    const pct = (score / totalMax) * 100
    if (pct >= 80) return { label: 'A1 · Distinction', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    if (pct >= 70) return { label: 'B2 · Very Good', bg: 'bg-blue-50 text-[#0063a6] border-blue-200' }
    if (pct >= 60) return { label: 'C4 · Credit', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    if (pct >= 50) return { label: 'P7 · Pass', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
    return { label: 'F9 · Fail', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
  }

  const cbtCount = students.filter((s) => {
    const st = marksState[s.id]
    return st && st.cbtMark !== null && st.cbtMark !== undefined && String(st.cbtMark).trim() !== ''
  }).length

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.roll && s.roll.toLowerCase().includes(q)) ||
      (s.registerNo && s.registerNo.toLowerCase().includes(q))
    )
  })

  // Calculate class score averages
  const scoredStudents = students.filter((s) => !marksState[s.id]?.absent)
  const totalMarksSum = scoredStudents.reduce((sum, s) => sum + calculateStudentTotal(s.id), 0)
  const avgTotalScore = scoredStudents.length > 0 ? (totalMarksSum / scoredStudents.length).toFixed(1) : '0'

  const cbtScoresList = students
    .map((s) => marksState[s.id]?.cbtMark)
    .filter((m) => m !== null && m !== undefined && String(m).trim() !== '')
    .map((m) => Number(m))
    .filter((n) => !isNaN(n))
  const avgCbtScore = cbtScoresList.length > 0 ? (cbtScoresList.reduce((a, b) => a + b, 0) / cbtScoresList.length).toFixed(1) : '0'

  const handleSyncCbtToComponent = (studentId: number, compKey: string) => {
    const mark = marksState[studentId]
    if (!mark || mark.cbtMark === null || mark.cbtMark === undefined) return
    handleComponentScoreChange(studentId, compKey, String(mark.cbtMark))
    setSuccessMsg(`Copied CBT score (${mark.cbtMark}) into "${compKey}".`)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleSyncAllCbtToExam = () => {
    if (!currentMatrix || currentMatrix.components.length === 0) return
    const targetComp =
      currentMatrix.components.find((c) =>
        /exam|terminal|cbt|objective|theory/i.test(c.name || c.code)
      ) || currentMatrix.components[currentMatrix.components.length - 1]
    const targetKey = targetComp.code || targetComp.name

    let synced = 0
    setMarksState((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((sIdStr) => {
        const sId = Number(sIdStr)
        const st = next[sId]
        if (st && st.cbtMark !== null && st.cbtMark !== undefined && String(st.cbtMark).trim() !== '') {
          next[sId] = {
            ...st,
            components: {
              ...st.components,
              [targetKey]: st.cbtMark,
            },
          }
          synced++
        }
      })
      return next
    })

    setSuccessMsg(
      `Auto-filled CBT scores for ${synced} student(s) into matrix component "${targetComp.name}". Click "Save Marks to Server" to commit.`
    )
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const currentClass = classes.find((c) => String(c.id) === selectedClassId)
  const availableSections = currentClass?.sections || []

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 border border-white/15">
              <FileSpreadsheet size={14} className="text-blue-300" /> Offline & AI Marks Entry Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Marks Entry System</h1>
            <p className="text-xs sm:text-sm text-blue-200/80 max-w-xl">
              Input student assessment scores online/offline, assign Evaluation Matrices to classes, or utilize AI to distribute scores across components.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <Wand2 size={15} /> AI Score Assistant
            </button>
            <button
              onClick={handleSaveMarksBatch}
              disabled={isSaving}
              className="px-4 py-2.5 bg-[#0063a6] hover:bg-[#004d80] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Marks to Server
            </button>
            <button
              onClick={() => window.print()}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/15 cursor-pointer"
              title="Print Score Sheet"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Class Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Classroom</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
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
                className="bg-transparent text-xs font-bold text-slate-800 outline-none w-full"
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
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
              <Layers size={16} className="text-purple-600" />
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={availableSections.length === 0}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none w-full disabled:opacity-50"
              >
                {availableSections.map((s) => (
                  <option key={s.section.id} value={s.section.id}>
                    Section {s.section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
              <BookOpen size={16} className="text-emerald-600" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none w-full"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subjectCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Evaluation Matrix Assign Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Matrix Scheme</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
              <Award size={16} className="text-amber-500" />
              <select
                value={assignedMatrixId}
                onChange={(e) => handleAssignMatrixToClass(e.target.value)}
                disabled={isAssigningMatrix}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none w-full"
              >
                {allMatrices.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {isOnline ? <Wifi size={13} className="text-emerald-600" /> : <WifiOff size={13} className="text-rose-600" />}
              {isOnline ? 'Online Sync Active' : 'Offline Mode (Local Storage Buffer Active)'}
            </span>

            {offlineBufferCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                <RefreshCw size={12} className="animate-spin text-amber-600" />
                {offlineBufferCount} local unsaved entries buffered
              </span>
            )}
          </div>

          {currentMatrix && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="text-slate-400">Matrix Breakdown:</span>
              {currentMatrix.components.map((c) => (
                <span key={c.code || c.name} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-mono">
                  {c.code || c.name}: {c.maxMarks} Marks
                </span>
              ))}
            </div>
          )}
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

      {/* Score View Mode, Search & Quick Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Score View Mode Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setScoreViewMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
              scoreViewMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={13} className="text-blue-600" />
            <span>All Scores (Marks Entry + CBT)</span>
          </button>
          <button
            type="button"
            onClick={() => setScoreViewMode('marks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
              scoreViewMode === 'marks'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet size={13} className="text-emerald-600" />
            <span>Marks Entry Only (CA Components)</span>
          </button>
          <button
            type="button"
            onClick={() => setScoreViewMode('cbt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
              scoreViewMode === 'cbt'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor size={13} className="text-cyan-600" />
            <span>CBT Online Exam Scores Only</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#0063a6] focus:bg-white w-full sm:w-56"
            />
          </div>

          {/* Sync All CBT Button */}
          {cbtCount > 0 && (
            <button
              type="button"
              onClick={handleSyncAllCbtToExam}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
              title="Automatically sync student online CBT scores into the evaluation matrix component"
            >
              <ArrowRightLeft size={13} className="text-cyan-600" />
              <span>Auto-Fill CBT to CA ({cbtCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Class Score KPIs Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Class Enrolled</span>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{students.length} <span className="text-xs font-semibold text-slate-400">Students</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-cyan-100 bg-cyan-50/20 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-700">CBT Online Submissions</span>
          <p className="text-2xl font-black text-cyan-800 mt-0.5">{cbtCount} <span className="text-xs font-semibold text-cyan-600">/ {students.length} ({students.length > 0 ? Math.round((cbtCount / students.length) * 100) : 0}%)</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Marks Entry Average</span>
          <p className="text-2xl font-black text-emerald-800 mt-0.5">{avgTotalScore} <span className="text-xs font-semibold text-emerald-600">/ {matrixTotalMarks}</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Average CBT Score</span>
          <p className="text-2xl font-black text-indigo-800 mt-0.5">{Number(avgCbtScore) > 0 ? avgCbtScore : '—'} <span className="text-xs font-semibold text-indigo-600">pts</span></p>
        </div>
      </div>

      {/* Student Roster Marks Table */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
          <Loader2 size={24} className="animate-spin text-[#0063a6] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading student roster and assessment marks...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
          <FileSpreadsheet size={32} className="text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {students.length === 0
              ? 'No Enrolled Students Found for this Class & Section'
              : 'No students matched your search filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Roll / Reg No</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Student Name</th>

                  {/* CBT Online Exam Score Column (Shown in 'all' and 'cbt' modes) */}
                  {scoreViewMode !== 'marks' && (
                    <th className="py-3.5 px-4 text-center bg-cyan-50/60 text-cyan-900 border-x border-cyan-100/70 font-black">
                      <span className="flex items-center justify-center gap-1.5">
                        <Monitor size={13} className="text-cyan-600" />
                        CBT Online Score
                      </span>
                    </th>
                  )}

                  {/* CBT Specific Columns */}
                  {scoreViewMode === 'cbt' && (
                    <>
                      <th className="py-3.5 px-4 text-center">CBT Online Exam Title</th>
                      <th className="py-3.5 px-4 text-center">Source & Status</th>
                      <th className="py-3.5 px-4 text-center">Quick Action</th>
                    </>
                  )}

                  {/* Matrix Component Headers (Shown in 'all' and 'marks' modes) */}
                  {scoreViewMode !== 'cbt' &&
                    currentMatrix?.components.map((comp) => (
                      <th key={comp.code || comp.name} className="py-3.5 px-4 text-center">
                        {comp.name} ({comp.maxMarks} Max)
                      </th>
                    ))}

                  {/* Total & Grade Status (Shown in 'all' and 'marks' modes) */}
                  {scoreViewMode !== 'cbt' && (
                    <>
                      <th className="py-3.5 px-4 text-center font-black text-slate-900">
                        Total Score ({matrixTotalMarks})
                      </th>
                      <th className="py-3.5 px-4 text-center">Grade Status</th>
                      <th className="py-3.5 px-4 text-center">Absent</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((stu) => {
                  const markState = marksState[stu.id] || { components: {}, absent: false }
                  const totalScore = calculateStudentTotal(stu.id)
                  const gradeInfo = getGradeBadge(totalScore)
                  const hasCbt =
                    markState.cbtMark !== null &&
                    markState.cbtMark !== undefined &&
                    String(markState.cbtMark).trim() !== ''

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-mono text-slate-600 font-bold">
                        {stu.roll || stu.registerNo || `#${stu.id}`}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        <div>
                          <span>{stu.name}</span>
                          {stu.sectionName && (
                            <span className="block text-[10px] font-semibold text-slate-400">
                              Section {stu.sectionName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CBT Online Exam Score Badge Cell */}
                      {scoreViewMode !== 'marks' && (
                        <td className="py-3 px-4 text-center bg-cyan-50/30 border-x border-cyan-100/50">
                          {hasCbt ? (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-100 text-cyan-900 font-mono font-black text-xs border border-cyan-200 shadow-2xs">
                                <Laptop size={12} className="text-cyan-700" />
                                {markState.cbtMark}
                                {markState.cbtTotalMarks ? (
                                  <span className="text-[10px] text-cyan-700 font-normal">/ {markState.cbtTotalMarks}</span>
                                ) : null}
                              </span>
                              {scoreViewMode === 'all' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (currentMatrix?.components?.length) {
                                      const comp =
                                        currentMatrix.components.find((c) =>
                                          /exam|terminal|cbt|objective|theory/i.test(c.name || c.code)
                                        ) || currentMatrix.components[currentMatrix.components.length - 1]
                                      handleSyncCbtToComponent(stu.id, comp.code || comp.name)
                                    }
                                  }}
                                  className="text-[9px] font-bold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
                                  title="Copy CBT score to exam component"
                                >
                                  Copy to CA ➔
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-100">
                              No CBT
                            </span>
                          )}
                        </td>
                      )}

                      {/* CBT Specific Columns */}
                      {scoreViewMode === 'cbt' && (
                        <>
                          <td className="py-3 px-4 text-center text-xs font-semibold text-slate-700">
                            {markState.cbtExamTitle || 'Standard CBT Examination'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {hasCbt ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} /> {markState.cbtSource || 'SUBMITTED'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Not Attempted</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {hasCbt && currentMatrix?.components?.length ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const comp =
                                    currentMatrix.components.find((c) =>
                                      /exam|terminal|cbt|objective|theory/i.test(c.name || c.code)
                                    ) || currentMatrix.components[currentMatrix.components.length - 1]
                                  handleSyncCbtToComponent(stu.id, comp.code || comp.name)
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#0063a6] hover:bg-[#004d80] text-white text-[11px] font-bold transition cursor-pointer shadow-2xs"
                              >
                                Sync to CA
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Component Inputs (Shown in 'all' and 'marks' modes) */}
                      {scoreViewMode !== 'cbt' &&
                        currentMatrix?.components.map((comp) => {
                          const compKey = comp.code || comp.name
                          const scoreVal = markState.components?.[compKey] ?? ''

                          return (
                            <td key={compKey} className="py-3 px-4 text-center">
                              <input
                                type="number"
                                min="0"
                                max={comp.maxMarks}
                                disabled={markState.absent}
                                placeholder="0"
                                value={scoreVal}
                                onChange={(e) => handleComponentScoreChange(stu.id, compKey, e.target.value)}
                                className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-center font-bold text-slate-900 outline-none focus:border-[#0063a6] focus:bg-white disabled:opacity-40"
                              />
                            </td>
                          )
                        })}

                      {/* Total (Shown in 'all' and 'marks' modes) */}
                      {scoreViewMode !== 'cbt' && (
                        <>
                          <td className="py-3 px-4 text-center font-mono font-black text-base text-slate-900">
                            {markState.absent ? <span className="text-slate-400">-</span> : `${totalScore} / ${matrixTotalMarks}`}
                          </td>

                          {/* Grade Badge */}
                          <td className="py-3 px-4 text-center">
                            {markState.absent ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                ABSENT
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${gradeInfo.bg}`}>
                                {gradeInfo.label}
                              </span>
                            )}
                          </td>

                          {/* Absent Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={markState.absent}
                              onChange={(e) => handleAbsentToggle(stu.id, e.target.checked)}
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Score Distribution Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <Sparkles size={18} className="text-purple-300" /> AI Score Distribution Assistant
              </h2>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg text-white/80 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-900 font-semibold leading-relaxed flex items-start gap-2">
                <Info size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>
                  The AI Assistant calculates & distributes target student total scores across matrix components ({currentMatrix?.components.map((c) => `${c.code || c.name}: ${c.maxMarks}`).join(', ')}) matching evaluation limits.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">
                  Target Student Total Score (Out of {matrixTotalMarks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={matrixTotalMarks}
                  value={aiTotalTarget}
                  onChange={(e) => setAiTotalTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              {/* Action Buttons */}
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
                  onClick={handleRunAiScoreDistribution}
                  disabled={isGeneratingAi}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Distribute Scores
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
