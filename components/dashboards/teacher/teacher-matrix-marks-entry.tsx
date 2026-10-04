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

interface ExamOption {
  id: number
  name: string
}

export function TeacherMatrixMarksEntry() {
  // Selector States
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [exams, setExams] = useState<ExamOption[]>([])

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedExamId, setSelectedExamId] = useState<string>('')

  // Loaded Gradebook Data
  const [matrix, setMatrix] = useState<EvaluationMatrix | null>(null)
  const [studentRows, setStudentRows] = useState<StudentMarksRow[]>([])
  const [initialRowsState, setInitialRowsState] = useState<string>('')

  // Status States
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [savingBatch, setSavingBatch] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // 1. Initial Load: Teacher's Classes, Subjects, and Exams
  useEffect(() => {
    async function loadInitialContext() {
      try {
        setLoadingConfig(true)
        const [classesRes, subjectsRes, examsRes] = await Promise.all([
          apiSlice.get<{ success: boolean; assignedClasses: ClassOption[] }>(endpoints.teacher.roster),
          apiSlice.get<{ success: boolean; subjects: SubjectOption[] }>(endpoints.teacher.subjects),
          apiSlice.get<{ success: boolean; exams: ExamOption[] }>(endpoints.teacher.exams),
        ])

        if (classesRes.success && classesRes.assignedClasses?.length > 0) {
          setClasses(classesRes.assignedClasses)
          setSelectedClassId(String(classesRes.assignedClasses[0].id))
        }

        if (subjectsRes.success && subjectsRes.subjects?.length > 0) {
          setSubjects(subjectsRes.subjects)
          setSelectedSubjectId(String(subjectsRes.subjects[0].id))
        }

        if (examsRes.success && examsRes.exams?.length > 0) {
          setExams(examsRes.exams)
          setSelectedExamId(String(examsRes.exams[0].id))
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to initialize score entry.')
      } finally {
        setLoadingConfig(false)
      }
    }

    loadInitialContext()
  }, [])

  // 2. Load Gradebook Sheet with School's Active Evaluation Matrix
  const fetchMarksSheet = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error('Please select both a Class and a Subject.')
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
        students: StudentMarksRow[]
        exams: ExamOption[]
      }>(endpoints.teacher.marksEntry(params.toString()))

      if (res.success) {
        setMatrix(res.matrix)
        setStudentRows(res.students || [])
        setInitialRowsState(JSON.stringify(res.students || []))
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
  const handleScoreChange = (studentId: number, compCode: string, value: string) => {
    const numVal = value === '' ? 0 : Math.max(0, Number(value) || 0)

    setStudentRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row

        const updatedComp = {
          ...row.componentMarks,
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
  const handleToggleAbsent = (studentId: number) => {
    setStudentRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row
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
      const payload = {
        classId: Number(selectedClassId),
        sectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        subjectId: Number(selectedSubjectId),
        examId: Number(selectedExamId),
        entries: studentRows.map((r) => ({
          studentId: r.studentId,
          componentMarks: r.componentMarks,
          absent: r.isAbsent,
        })),
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
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={`sub-${sub.id}`} value={sub.id}>
                  {sub.name} {sub.subjectCode ? `(${sub.subjectCode})` : ''}
                </option>
              ))}
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
        {matrix && matrix.components && (
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
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>Score Sheet</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
                {studentRows.length} Students
              </span>
            </h3>
            {hasUnsavedChanges && (
              <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                <AlertCircle size={12} />
                Unsaved score edits detected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMarksSheet}
              disabled={loadingSheet}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">Reg No</th>
                  <th className="p-4">Student Name</th>
                  {matrix.components.map((comp) => (
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
                {studentRows.map((st, idx) => (
                  <tr
                    key={`row-${st.studentId}`}
                    className={`transition ${st.isAbsent ? 'bg-rose-50/40' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="p-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="p-4 font-mono text-slate-600 font-semibold">{st.registerNo || 'N/A'}</td>
                    <td className="p-4 font-bold text-slate-900">{st.name}</td>

                    {/* Matrix Dynamic Component Columns */}
                    {matrix.components.map((comp) => {
                      const currentVal = st.componentMarks[comp.code] ?? 0
                      const isOverMax = currentVal > comp.maxMarks

                      return (
                        <td key={`input-${st.studentId}-${comp.code}`} className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={comp.maxMarks}
                            disabled={st.isAbsent}
                            value={st.isAbsent ? '' : currentVal}
                            onChange={(e) => handleScoreChange(st.studentId, comp.code, e.target.value)}
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
                        onClick={() => handleToggleAbsent(st.studentId)}
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
                ))}
              </tbody>
            </table>
          </div>
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
