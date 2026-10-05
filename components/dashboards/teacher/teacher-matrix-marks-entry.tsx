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
  components: MatrixComponent[]
}

interface StudentMarksRow {
  id: number
  studentId: number
  name: string
  registerNo: string
  gender: string
  componentMarks: Record<string, number>
  totalScore: number
  isAbsent: boolean
  remarks: string
}

interface ClassOption {
  id: number
  name: string
  sections: Array<{ id: number; name: string }>
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

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedExamId, setSelectedExamId] = useState<string>('')

  // Loaded Gradebook Data
  const [matrix, setMatrix] = useState<EvaluationMatrix | null>(null)
  const [studentRows, setStudentRows] = useState<StudentMarksRow[]>([])
  const [initialRowsState, setInitialRowsState] = useState<string>('')

  // Search & Pagination States
  const [studentSearch, setStudentSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Status States
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [savingBatch, setSavingBatch] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Filter students based on search
  const filteredRows = useMemo(() => {
    if (!studentSearch.trim()) return studentRows
    const q = studentSearch.toLowerCase().trim()
    return studentRows.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        (st.registerNo && st.registerNo.toLowerCase().includes(q))
    )
  }, [studentRows, studentSearch])

  // Reset pagination on filter or dataset change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedClassId, selectedSectionId, selectedSubjectId, selectedExamId, studentSearch])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredRows.length)

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(startIndex, endIndex)
  }, [filteredRows, startIndex, endIndex])

  // 1. Initial Load: Teacher's Classes, Subjects, and Exams
  useEffect(() => {
    async function loadInitialContext() {
      try {
        setLoadingConfig(true)
        const [classesRes, subjectsRes, examsRes] = await Promise.all([
          apiSlice.get<{ success: boolean; assignedClasses: ClassOption[] }>(endpoints.teacher.roster),
          apiSlice.get<{
            success: boolean
            subjects: SubjectOption[]
            assignedSubjects?: AssignedSubjectOption[]
          }>(endpoints.teacher.subjects),
          apiSlice.get<{ success: boolean; exams: ExamOption[] }>(endpoints.teacher.exams),
        ])

        const assignedClasses = classesRes.success ? (classesRes.assignedClasses || []) : []
        const branchSubjects = subjectsRes.success ? (subjectsRes.subjects || []) : []
        const teacherAssignedSubjects = subjectsRes.success ? (subjectsRes.assignedSubjects || []) : []

        setClasses(assignedClasses)
        setSubjects(branchSubjects)
        setAssignedSubjects(teacherAssignedSubjects)

        if (examsRes.success && examsRes.exams?.length > 0) {
          setExams(examsRes.exams)
          setSelectedExamId(String(examsRes.exams[0].id))
        }

        // Check if user has an active context saved from Context Switcher
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

  // Dynamically compute subjects offered by the currently selected class
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

    // Fallback: If no assigned subjects mapped to this class, fallback to global branch subjects
    return subjects
  }, [assignedSubjects, selectedClassId, selectedSectionId, subjects])

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

      const res = await apiSlice.get<{
        success: boolean
        matrix: EvaluationMatrix
        students: any[]
        marksMap?: Record<number, any>
        exams: ExamOption[]
      }>(endpoints.teacher.marksEntry(params.toString()))

      if (res.success) {
        setMatrix(res.matrix)
        const marksMap = res.marksMap || {}
        const rows: StudentMarksRow[] = (res.students || []).map((s: any) => {
          const sId = Number(s.studentId || s.id)
          const markData = marksMap[sId] || {}
          const existingComps = markData.components || s.componentMarks || {}
          const total = Object.values(existingComps).reduce((a: number, b: any) => a + (Number(b) || 0), 0)

          return {
            id: sId,
            studentId: sId,
            name: s.name || `${s.lastName || ''}, ${s.firstName || ''}`,
            registerNo: s.registerNo || '',
            gender: s.gender || '',
            componentMarks: existingComps,
            totalScore: Number(total) || 0,
            isAbsent: markData.absent !== undefined ? markData.absent : (s.isAbsent || false),
            remarks: markData.remarks || s.remarks || '',
          }
        })

        setStudentRows(rows)
        setInitialRowsState(JSON.stringify(rows))
        setHasUnsavedChanges(false)
        if (res.exams && res.exams.length > 0 && !selectedExamId) {
          setSelectedExamId(String(res.exams[0].id))
        }
        toast.success(`Active Assessment Matrix: ${res.matrix.name} loaded.`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load marks entry sheet.')
      setStudentRows([])
      setMatrix(null)
    } finally {
      setLoadingSheet(false)
    }
  }

  // Auto-fetch when Class or Subject changes
  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      fetchMarksSheet()
    }
  }, [selectedClassId, selectedSubjectId, selectedSectionId, selectedExamId])

  // Handle Score Input Change for a student component
  const handleScoreChange = (targetStudentId: number, compCode: string, value: string) => {
    const numVal = value === '' ? 0 : Math.max(0, Number(value) || 0)

    setStudentRows((prev) =>
      prev.map((row) => {
        const rowStudentId = Number(row.studentId || row.id)
        if (rowStudentId !== targetStudentId) return row

        const updatedComp = {
          ...(row.componentMarks || {}),
          [compCode]: numVal,
        }

        // Calculate Automatic Total
        const total = Object.values(updatedComp).reduce((a, b) => a + (Number(b) || 0), 0)

        return {
          ...row,
          componentMarks: updatedComp,
          totalScore: total,
          isAbsent: false, // Entering a score automatically marks student as present
        }
      })
    )
    setHasUnsavedChanges(true)
  }

  // Handle Absent Toggle
  const handleToggleAbsent = (targetStudentId: number) => {
    setStudentRows((prev) =>
      prev.map((row) => {
        const rowStudentId = Number(row.studentId || row.id)
        if (rowStudentId !== targetStudentId) return row
        const newAbsent = !row.isAbsent
        return {
          ...row,
          isAbsent: newAbsent,
          totalScore: newAbsent ? 0 : row.totalScore,
        }
      })
    )
    setHasUnsavedChanges(true)
  }

  // Batch Save Scores
  const handleBatchSave = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedExamId) {
      toast.error('Class, Subject, and Exam are required to commit scores.')
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
      } else {
        toast.error(res.message || 'Failed to save scores.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error while saving marks.')
    } finally {
      setSavingBatch(false)
    }
  }

  // Filter sections for the selected class
  const currentSections = useMemo(() => {
    if (!selectedClassId) return []
    const cls = classes.find((c) => String(c.id) === String(selectedClassId))
    return cls?.sections || []
  }, [classes, selectedClassId])

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2 border border-emerald-200/60">
            <Award size={14} />
            <span>School Evaluation Matrix Inherited</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Assessments & Examination Gradebook
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Enter marks dynamically mapped to the school&apos;s active Assessment Matrix. Totals are calculated automatically and instantly synced into student academic records.
          </p>
        </div>

        {matrix && (
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matrix Config</span>
              <span className="text-xs font-black text-slate-800">{matrix.name}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 text-center">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Total Marks</span>
              <span className="text-lg font-black text-emerald-700">{matrix.totalMarks}</span>
            </div>
          </div>
        )}
      </div>

      {/* SELECTION BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Class <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value)
                setSelectedSectionId('')
              }}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {classes.length === 0 ? (
                <option value="">No Classes Assigned</option>
              ) : (
                classes.map((cls) => (
                  <option key={`c-${cls.id}`} value={cls.id}>
                    {cls.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">All Sections</option>
              {currentSections.map((sec) => (
                <option key={`s-${sec.id}`} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Subject <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={availableSubjects.length === 0}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
            >
              {availableSubjects.length === 0 ? (
                <option value="">No Subjects Offered in this Class</option>
              ) : (
                availableSubjects.map((sub) => (
                  <option key={`sub-${sub.id}`} value={sub.id}>
                    {sub.name} {sub.subjectCode ? `(${sub.subjectCode})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Exam / Term Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Assessment / Term <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {exams.map((ex) => (
                <option key={`ex-${ex.id}`} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Matrix Active Component Tags */}
        {matrix && Array.isArray(matrix.components) && (
          <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Matrix Components:
            </span>
            {matrix.components.map((comp) => (
              <span
                key={`comp-badge-${comp.code}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/70"
              >
                <span>{comp.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200/80 rounded-sm text-emerald-900 font-mono">
                  Max: {comp.maxMarks}
                </span>
              </span>
            ))}
            <span className="text-xs text-slate-400 italic ml-auto">
              Auto-Total calculates on entry
            </span>
          </div>
        )}
      </div>

      {/* MARKS ENTRY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>Score Sheet</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
                {filteredRows.length} Students
              </span>
            </h3>
            {hasUnsavedChanges && (
              <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                <AlertCircle size={12} />
                Unsaved score edits detected
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Quick Search */}
            <div className="relative flex-1 md:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={fetchMarksSheet}
              disabled={loadingSheet}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="Refresh Roster"
            >
              <RefreshCw size={15} className={loadingSheet ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleBatchSave}
              disabled={savingBatch || loadingSheet || studentRows.length === 0}
              className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
            >
              {savingBatch ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving Marks...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save All Scores</span>
                </>
              )}
            </button>
          </div>
        </div>

        {loadingSheet ? (
          <div className="p-16 text-center">
            <Loader2 className="animate-spin text-emerald-600 mx-auto mb-3" size={28} />
            <p className="text-xs text-slate-500 font-medium">Loading matrix evaluation sheet...</p>
          </div>
        ) : studentRows.length > 0 && matrix ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">Reg No</th>
                    <th className="p-4">Student Name</th>
                    {(Array.isArray(matrix.components) ? matrix.components : []).map((comp) => (
                      <th key={`th-${comp.code}`} className="p-4 text-center">
                        <div>{comp.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">Max: {comp.maxMarks}</div>
                      </th>
                    ))}
                    <th className="p-4 text-center font-black text-slate-900 bg-slate-100/60">
                      <div>Total</div>
                      <div className="text-[10px] text-slate-400 font-normal">/{matrix.totalMarks}</div>
                    </th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.map((st, idx) => {
                    const stId = Number(st.studentId || st.id)
                    return (
                      <tr
                        key={`row-${stId}`}
                        className={`transition ${st.isAbsent ? 'bg-rose-50/40' : 'hover:bg-slate-50/80'}`}
                      >
                        <td className="p-4 text-center text-slate-400 font-mono text-[11px]">
                          {startIndex + idx + 1}
                        </td>
                        <td className="p-4 font-mono text-slate-600 font-semibold">{st.registerNo || 'N/A'}</td>
                        <td className="p-4 font-bold text-slate-900">{st.name}</td>

                        {/* Matrix Dynamic Component Columns */}
                        {(Array.isArray(matrix.components) ? matrix.components : []).map((comp) => {
                          const currentVal = st.componentMarks?.[comp.code] ?? 0
                          const isOverMax = currentVal > comp.maxMarks

                          return (
                            <td key={`input-${stId}-${comp.code}`} className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={comp.maxMarks}
                                disabled={st.isAbsent}
                                value={st.isAbsent ? '' : currentVal}
                                onChange={(e) => handleScoreChange(stId, comp.code, e.target.value)}
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

                        {/* Auto-Calculated Total */}
                        <td className="p-3 text-center bg-slate-50/60">
                          <span
                            className={`inline-block px-3 py-1.5 rounded-xl font-mono font-black text-xs ${
                              st.isAbsent
                                ? 'bg-rose-100 text-rose-700'
                                : st.totalScore >= (matrix.totalMarks * 0.5)
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {st.isAbsent ? 'ABS' : st.totalScore}
                          </span>
                        </td>

                        {/* Absent Toggle Button */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAbsent(stId)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
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
                    className="h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                    title="Previous Page"
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
                    title="Next Page"
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
    </div>
  )
}
