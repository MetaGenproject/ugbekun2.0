'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Table,
  CheckCircle2,
  Users,
  Award,
  TrendingUp,
  Calendar,
  Printer,
  Loader2,
  AlertCircle,
  Building2,
  BookOpen,
  Phone,
  Search,
  Download,
  Layers,
  Key,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  EyeOff,
  Eye,
  Clock,
  Calculator,
  Lock,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'
import {
  BrandedReportCardPreview,
  SchoolReportBranding,
  BrandedReportCardStudentData,
} from '../shared/branded-report-card-preview'

interface AssignedClass {
  id: number
  name: string
  sections: Array<{ id: number; name: string }>
}

interface SubjectItem {
  id: number
  name: string
  code?: string
  subjectCode?: string
}

interface MatrixComponent {
  key: string
  name: string
  maxMarks: number
  code?: string
}

interface EvaluationMatrixInfo {
  id: number
  name: string
  code: string
  totalMarks: number
  components: MatrixComponent[]
}

interface GradeRange {
  grade: string
  minScore: number
  maxScore: number
  minPercentage?: number
  maxPercentage?: number
  remark: string
  color: string
}

interface GradingScaleInfo {
  id: number
  name: string
  ranges: GradeRange[]
}

interface ExamItem {
  id: number
  name: string
  displayName?: string
  termId?: number | null
  sessionId?: number
  examCategory?: string | null
}

interface TabulationRow {
  studentId: number
  name: string
  firstName?: string
  lastName?: string
  registerNo: string
  rollNo?: number
  gender: string
  photo?: string | null
  birthday?: string | null
  sectionName: string
  subjectScores: Record<number, number>
  subjectBreakdowns?: Record<number, Record<string, number>>
  subjectGrades?: Record<number, { grade: string; remark: string; color: string }>
  totalScore: number
  totalCA?: number
  totalExam?: number
  averageScore: number
  rawAverageScore?: number
  grade?: string
  gradeRemark?: string
  gradeColor?: string
  position: number
  attendanceRate: number
  attendanceSummary?: { present: number; absent: number; total: number; rate: number }
  teacherComment?: string
  principalComment?: string
  // Login Details
  studentUsername?: string
  studentPassword?: string
  userActive?: boolean
  lastLogin?: string | null
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  parentUsername?: string | null
  parentPassword?: string | null
}

interface AssessmentComponentItem {
  key: string
  code: string
  name: string
  label?: string
  maxMarks: number
  passMarks?: number
  category: 'CA' | 'PRACTICAL' | 'EXAM' | string
}

interface SessionItem {
  id: number
  name: string
  isCurrent?: boolean
}

interface ClassReportsData {
  schoolBranding?: Partial<SchoolReportBranding>
  stage?: string
  isCaOnlyStage?: boolean
  subjectMaxMarks?: number
  caMaxMarks?: number
  fullMaxMarks?: number
  examMaxMarks?: number
  classSummary: {
    classId: number
    className: string
    sectionId?: number
    sectionName: string
    sessionId?: number
    sessionName?: string
    termId?: number
    totalStudents: number
    classAverage: number
    highestScore: number
    lowestScore: number
    passRate?: number
    passCount?: number
    subjectMaxMarks?: number
    stage?: string
    isCaOnlyStage?: boolean
  }
  sessionId?: number
  termId?: number
  activeSession?: { id: number; name: string }
  sessions?: SessionItem[]
  selectedExamId?: number | null
  exams?: ExamItem[]
  assessmentComponents?: AssessmentComponentItem[]
  allMatrixColumns?: AssessmentComponentItem[]
  evaluationMatrix?: EvaluationMatrixInfo | null
  gradingScale?: GradingScaleInfo | null
  offeredSubjects: SubjectItem[]
  tabulation: TabulationRow[]
  performance?: {
    totalStudents: number
    classAverage: number
    highestScore: number
    lowestScore: number
    passCount: number
    passRate: number
    gradeDistribution: Record<string, number>
    topPerformers: Array<{
      position: number
      studentId: number
      name: string
      registerNo: string
      totalScore: number
      averageScore: number
      grade: string
      gradeColor: string
    }>
    subjectStats: Array<{
      subjectId: number
      name: string
      code?: string
      average: number
      highest: number
      passRate: number
    }>
  }
  attendanceOverview: {
    totalDaysRecorded: number
    averageAttendanceRate: number
  }
}

export function TeacherBroadReports() {
  const [classes, setClasses] = useState<AssignedClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedTermId, setSelectedTermId] = useState<string>('1')
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedStage, setSelectedStage] = useState<string>('FULL')
  const [availableSessions, setAvailableSessions] = useState<SessionItem[]>([])
  const [activeTab, setActiveTab] = useState<'tabulation' | 'performance' | 'credentials' | 'attendance' | 'totalSummary'>('tabulation')
  const [summarySubjectFilter, setSummarySubjectFilter] = useState<string>('')
  const [summaryViewMode, setSummaryViewMode] = useState<'breakdown' | 'compact'>('breakdown')

  const [reportsData, setReportsData] = useState<ClassReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterSearch, setFilterSearch] = useState('')
  const [showScoresAsGrades, setShowScoresAsGrades] = useState(false)

  // Password visibility map: studentId -> boolean
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [previewStudentRow, setPreviewStudentRow] = useState<TabulationRow | null>(null)
  const [downloadingStudentPdfId, setDownloadingStudentPdfId] = useState<number | null>(null)

  // 1. Initial Load: Teacher's assigned classes
  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true)
        const res = await apiSlice.get<{ success: boolean; assignedClasses: AssignedClass[] }>(
          endpoints.teacher.roster
        )
        if (res.success && res.assignedClasses?.length > 0) {
          setClasses(res.assignedClasses)

          let initialClassId = String(res.assignedClasses[0].id)
          let initialSectionId = ''

          try {
            const storedJson = typeof window !== 'undefined' ? localStorage.getItem('ugbekun_teacher_active_context') : null
            if (storedJson) {
              const ctx = JSON.parse(storedJson)
              if (ctx.classId && res.assignedClasses.some((c) => c.id === ctx.classId)) {
                initialClassId = String(ctx.classId)
                initialSectionId = ctx.sectionId ? String(ctx.sectionId) : ''
              }
              if (ctx.sessionId) {
                setSelectedSessionId(String(ctx.sessionId))
              }
              if (ctx.termId) {
                setSelectedTermId(String(ctx.termId))
              }
            }
          } catch {
            // ignore
          }

          setSelectedClassId(initialClassId)
          setSelectedSectionId(initialSectionId)
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load assigned classes.')
      } finally {
        setLoading(false)
      }
    }
    loadClasses()
  }, [])

  // Listen to Top Bar Context Switcher
  useEffect(() => {
    const handleContextSwitch = (e: any) => {
      const ctx = e.detail
      if (!ctx) return
      if (ctx.classId) setSelectedClassId(String(ctx.classId))
      if (ctx.sectionId !== undefined) setSelectedSectionId(ctx.sectionId ? String(ctx.sectionId) : '')
      if (ctx.sessionId) setSelectedSessionId(String(ctx.sessionId))
      if (ctx.termId) setSelectedTermId(String(ctx.termId))
    }

    window.addEventListener('ugbekun-context-changed', handleContextSwitch)
    return () => window.removeEventListener('ugbekun-context-changed', handleContextSwitch)
  }, [])

  // 2. Fetch Class Reports when selected class, section, session, term, exam, or stage changes
  const fetchReports = async (
    overrideClassId?: string,
    overrideSectionId?: string,
    overrideSessionId?: string,
    overrideTermId?: string,
    overrideExamId?: string,
    overrideStage?: string
  ) => {
    const classToFetch = overrideClassId !== undefined ? overrideClassId : selectedClassId
    if (!classToFetch) return
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('classId', classToFetch)

      const sectionToFetch = overrideSectionId !== undefined ? overrideSectionId : selectedSectionId
      if (sectionToFetch) params.append('sectionId', sectionToFetch)

      const sessionToFetch = overrideSessionId !== undefined ? overrideSessionId : selectedSessionId
      if (sessionToFetch) params.append('sessionId', sessionToFetch)

      const termToFetch = overrideTermId !== undefined ? overrideTermId : selectedTermId
      if (termToFetch) params.append('termId', termToFetch)

      const examToFetch = overrideExamId !== undefined ? overrideExamId : selectedExamId
      if (examToFetch) params.append('examId', examToFetch)

      const stageToFetch = overrideStage !== undefined ? overrideStage : selectedStage
      if (stageToFetch) params.append('stage', stageToFetch)

      const res = await apiSlice.get<{ success: boolean } & ClassReportsData>(
        endpoints.teacher.classReports(params.toString())
      )

      if (res.success) {
        setReportsData(res)
        if (res.sessions && res.sessions.length > 0) {
          setAvailableSessions(res.sessions)
        }
        if (!sessionToFetch && res.sessionId) {
          setSelectedSessionId(String(res.sessionId))
        }
        if (!termToFetch && res.termId) {
          setSelectedTermId(String(res.termId))
        }
        // Auto-sync selectedExamId from backend response if none selected or if current option is invalid for this class
        if (overrideExamId !== undefined && overrideExamId) {
          setSelectedExamId(String(overrideExamId))
        } else if (res.exams && res.exams.length > 0) {
          const exists = res.exams.some((ex) => String(ex.id) === String(selectedExamId))
          if (!exists) {
            setSelectedExamId(String(res.selectedExamId || res.exams[0].id || 'FULL'))
          }
        } else if (!selectedExamId && res.selectedExamId) {
          setSelectedExamId(String(res.selectedExamId))
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load class reports.')
      setReportsData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClassId) {
      fetchReports()
    }
  }, [selectedClassId, selectedSectionId, selectedSessionId, selectedTermId, selectedExamId, selectedStage])

  useEffect(() => {
    const handleRealtimeRefresh = () => {
      if (selectedClassId) {
        fetchReports()
      }
    }
    window.addEventListener('ugbekun-marks-updated', handleRealtimeRefresh)
    window.addEventListener('branch-settings-updated', handleRealtimeRefresh)
    return () => {
      window.removeEventListener('ugbekun-marks-updated', handleRealtimeRefresh)
      window.removeEventListener('branch-settings-updated', handleRealtimeRefresh)
    }
  }, [selectedClassId, selectedSectionId, selectedSessionId, selectedTermId, selectedExamId, selectedStage])

  const handleDownloadStudentReportCardPdf = async (row: TabulationRow) => {
    try {
      setDownloadingStudentPdfId(row.studentId)
      const secId =
        selectedSectionId ||
        String(currentSections[0]?.id || classSummary.sectionId || 1)
      const url = endpoints.teacher.exportReportCardPdf(
        row.studentId,
        selectedExamId && !isNaN(Number(selectedExamId)) ? Number(selectedExamId) : undefined,
        {
          classId: selectedClassId,
          sectionId: secId,
          stage: reportsData?.stage || selectedStage || selectedExamId,
          sessionId: selectedSessionId || reportsData?.sessionId,
        }
      )
      const safeName = (row.name || 'Student').replace(/\s+/g, '_')
      await apiSlice.download(url, `Report_Card_${safeName}.pdf`)
      toast.success(`Report card PDF downloaded for ${row.name}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to download report card PDF.')
    } finally {
      setDownloadingStudentPdfId(null)
    }
  }

  const buildStudentPreviewData = (row: TabulationRow): BrandedReportCardStudentData => {
    const subMax = reportsData?.subjectMaxMarks || reportsData?.fullMaxMarks || reportsData?.evaluationMatrix?.totalMarks || 0
    const subjectRows = (reportsData?.offeredSubjects || []).map((sub) => {
      const score = row.subjectScores[sub.id] ?? 0
      const bd = row.subjectBreakdowns?.[sub.id] || {}
      const gr = row.subjectGrades?.[sub.id]
      const stat = reportsData?.performance?.subjectStats.find((s) => s.subjectId === sub.id)
      const resolvedMark = bd.totalScore !== undefined ? bd.totalScore : score
      return {
        id: sub.id,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.subjectCode || sub.code,
        cbtMark: bd.caTotal !== undefined ? String(bd.caTotal) : null,
        theoryMark: reportsData?.isCaOnlyStage ? null : (bd.examScore !== undefined ? String(bd.examScore) : null),
        mark: String(resolvedMark),
        stageScore: String(resolvedMark),
        maxMarks: subMax,
        componentScores: bd,
        classAverage: stat?.average ?? null,
        grade: gr?.grade,
        remark: gr?.remark,
      }
    })
    return {
      id: row.studentId,
      studentName: row.name,
      firstName: row.firstName,
      lastName: row.lastName,
      registerNo: row.registerNo,
      admissionNo: row.registerNo,
      className: classSummary.className || 'Class',
      sectionName: row.sectionName,
      gender: row.gender,
      photo: row.photo || null,
      birthday: row.birthday || null,
      totalMarks: row.totalScore,
      average: row.averageScore,
      rawAverage: row.rawAverageScore,
      maxMarksPerSubject: subMax,
      grade: row.grade,
      position: reportsData?.isCaOnlyStage ? null : `#${row.position} of ${classSummary.totalStudents || reportsData?.tabulation.length || 1}`,
      rank: reportsData?.isCaOnlyStage ? null : row.position,
      totalClassStudents: classSummary.totalStudents,
      presentCount: row.attendanceSummary?.present ?? 0,
      absentCount: row.attendanceSummary?.absent ?? 0,
      totalAttendanceDays: row.attendanceSummary?.total ?? 0,
      attendanceRate: row.attendanceRate,
      teacherComment: row.teacherComment || '',
      principalComment: row.principalComment || '',
      resumptionDate: reportsData?.schoolBranding?.resumptionDate || null,
      nextTermFees: reportsData?.schoolBranding?.nextTermFees || null,
      reportCard: subjectRows,
    }
  }

  // Print Tabulation Sheet
  const handlePrint = () => {
    window.print()
  }

  // Batch Credential Slips PDF Download
  const handleDownloadBatchCredentialsPdf = async () => {
    if (!selectedClassId) return
    try {
      setDownloadingPdf(true)
      const params = new URLSearchParams()
      params.append('classId', selectedClassId)
      if (selectedSectionId) params.append('sectionId', selectedSectionId)
      if (selectedSessionId) params.append('sessionId', selectedSessionId)
      if (selectedTermId) params.append('termId', selectedTermId)

      const classNameSafe = classSummary.className?.replace(/\s+/g, '_') || 'Class'
      await apiSlice.download(
        endpoints.teacher.exportClassCredentialsPdf(params.toString()),
        `Batch_Login_Slips_${classNameSafe}.pdf`
      )
      toast.success('Batch credential slips PDF downloaded successfully.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to download batch login slips.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  // Toggle single password visibility
  const togglePasswordVisibility = (studentId: number) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
  }

  // Copy to clipboard with feedback
  const handleCopyText = (text: string, key: string, label: string) => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => {
      setCopiedKey(null)
    }, 2500)
  }

  const currentSections = classes.find((c) => String(c.id) === String(selectedClassId))?.sections || []

  // Normalized Class Summary
  const classSummary = reportsData?.classSummary || (reportsData as any)?.classInfo || {
    classId: 0,
    className: '',
    sectionName: 'All Sections',
    totalStudents: 0,
    classAverage: 0,
    highestScore: 0,
    lowestScore: 0,
    passRate: 0,
    passCount: 0,
  }

  // Filtered rows for tabulation / directory
  const filteredTabulation = (reportsData?.tabulation || []).filter((r) => {
    if (!filterSearch.trim()) return true
    const q = filterSearch.toLowerCase().trim()
    const studentName = r.name || `${r.firstName || ''} ${r.lastName || ''}`
    return (
      studentName.toLowerCase().includes(q) ||
      (r.registerNo || '').toLowerCase().includes(q) ||
      (r.studentUsername || '').toLowerCase().includes(q)
    )
  })

  // Matrix components
  const matrixComponents = reportsData?.evaluationMatrix?.components || []
  const availableExams = reportsData?.exams || []

  // Assessment components configured by school admin for Total Score Summary
  const totalSummaryComponents: AssessmentComponentItem[] =
    reportsData?.assessmentComponents && reportsData.assessmentComponents.length > 0
      ? reportsData.assessmentComponents
      : reportsData?.evaluationMatrix?.components && reportsData.evaluationMatrix.components.length > 0
        ? reportsData.evaluationMatrix.components.map((c, idx) => ({
          key: String(c.key || c.code || idx + 1),
          code: String(c.code || c.key || `COMP_${idx + 1}`).toUpperCase(),
          name: c.name || `Component ${idx + 1}`,
          maxMarks: c.maxMarks || 0,
          category: ((c.code || c.name || '').toLowerCase().includes('exam') ? 'EXAM' : 'CA') as 'CA' | 'EXAM',
        }))
        : []

  const totalSummaryMaxMarks =
    reportsData?.subjectMaxMarks ||
    totalSummaryComponents.reduce((acc, c) => acc + (c.maxMarks || 0), 0) ||
    reportsData?.evaluationMatrix?.totalMarks ||
    0

  // Selected subject for subject-specific continuous assessment view
  const selectedSummarySubject = summarySubjectFilter
    ? reportsData?.offeredSubjects.find((s) => String(s.id) === String(summarySubjectFilter))
    : null

  // Class KPI calculations for Total Score Summary
  const classAvgCA =
    reportsData?.tabulation && reportsData.tabulation.length > 0
      ? Math.round(
        (reportsData.tabulation.reduce((sum, r) => sum + (r.totalCA || 0), 0) /
          reportsData.tabulation.length) *
        10
      ) / 10
      : 0

  const classAvgExam =
    reportsData?.tabulation && reportsData.tabulation.length > 0
      ? Math.round(
        (reportsData.tabulation.reduce((sum, r) => sum + (r.totalExam || 0), 0) /
          reportsData.tabulation.length) *
        10
      ) / 10
      : 0

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-200/60">
            <FileText size={14} />
            <span>Academic Performance & Tabulation System</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Class Academic Reports</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Inspect per-exam tabulation sheets, continuous assessment matrix breakdowns, ranking intelligence, and generate official student login credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadBatchCredentialsPdf}
            disabled={downloadingPdf || !selectedClassId}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {downloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Batch Credential Slips (PDF)</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer size={14} />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Session, Term, Class, Section & Exam Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* 1. Academic Session */}
          <div className="lg:col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Academic Session <span className="text-rose-500">*</span></span>
              <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                session
              </span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-blue-500">
              <Calendar size={15} className="text-blue-600 shrink-0" />
              <select
                value={selectedSessionId}
                onChange={(e) => {
                  const newSession = e.target.value
                  setSelectedSessionId(newSession)
                  setSelectedExamId('FULL')
                  setSelectedStage('FULL')
                  fetchReports(undefined, undefined, newSession, selectedTermId, 'FULL', 'FULL')
                }}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full cursor-pointer"
              >
                {availableSessions.length === 0 ? (
                  <option value="">{reportsData?.activeSession?.name || 'Current Session'}</option>
                ) : (
                  availableSessions.map((s) => (
                    <option key={`sess-${s.id}`} value={s.id}>
                      {s.name} {s.isCurrent ? '★ (Active)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 2. Academic Term */}
          <div className="lg:col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Academic Term <span className="text-rose-500">*</span></span>
              <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                term
              </span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-blue-500">
              <Clock size={15} className="text-indigo-600 shrink-0" />
              <select
                value={selectedTermId}
                onChange={(e) => {
                  const newTerm = e.target.value
                  setSelectedTermId(newTerm)
                  setSelectedExamId('FULL')
                  setSelectedStage('FULL')
                  fetchReports(undefined, undefined, selectedSessionId, newTerm, 'FULL', 'FULL')
                }}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full cursor-pointer"
              >
                <option value="1">1st Term</option>
                <option value="2">2nd Term</option>
                <option value="3">3rd Term</option>
              </select>
            </div>
          </div>

          {/* 3. Class Select */}
          <div className="lg:col-span-3 sm:col-span-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Assigned Class <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const newClass = e.target.value
                setSelectedClassId(newClass)
                setSelectedSectionId('')
                setSelectedExamId('FULL')
                setSelectedStage('FULL')
                fetchReports(newClass, '', selectedSessionId, selectedTermId, 'FULL', 'FULL')
              }}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={`c-${cls.id}`} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Section Select */}
          <div className="lg:col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => {
                const newSec = e.target.value
                setSelectedSectionId(newSec)
                fetchReports(selectedClassId, newSec, selectedSessionId, selectedTermId, selectedExamId, selectedStage)
              }}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Sections</option>
              {currentSections.map((sec) => (
                <option key={`s-${sec.id}`} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Exam Select (Evaluation Matrix Tabulation) */}
          <div className="lg:col-span-3 sm:col-span-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Examination</span>
              <span className="text-[10px] text-blue-600 font-bold lowercase">matrix</span>
            </label>
            <select
              value={selectedExamId || 'FULL'}
              onChange={(e) => {
                const newExam = e.target.value
                setSelectedExamId(newExam)
                setSelectedStage(newExam)
                fetchReports(selectedClassId, selectedSectionId, selectedSessionId, selectedTermId, newExam, newExam)
              }}
              className="w-full h-11 px-3 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {availableExams.length > 0 ? (
                availableExams.map((ex) => (
                  <option key={`ex-${ex.id}`} value={ex.id}>
                    {ex.displayName || ex.name}
                  </option>
                ))
              ) : (
                <option value="FULL">Tabulation Sheet (Full Report)</option>
              )}
            </select>
          </div>
        </div>

        {/* Evaluation Matrix Setup Banner */}
        {reportsData?.evaluationMatrix && (
          <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 rounded-2xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                <Layers size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900">{reportsData.evaluationMatrix.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    Max: {reportsData.evaluationMatrix.totalMarks} Marks
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Evaluation Matrix applied for grading components and cumulative weight calculation.
                </p>
              </div>
            </div>

            {matrixComponents.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {matrixComponents.map((comp) => (
                  <span
                    key={`mat-c-${comp.key}`}
                    className="px-2.5 py-1 bg-white border border-blue-200/80 rounded-lg text-[11px] font-bold text-slate-700 shadow-2xs"
                  >
                    {comp.name}: <span className="text-blue-600">{comp.maxMarks}pts</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Executive KPI Summary */}
        {reportsData && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Average</span>
              <span className="text-xl font-black text-blue-600">{classSummary.classAverage ?? 0}%</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pass Rate</span>
              <span className="text-xl font-black text-emerald-600">{classSummary.passRate ?? 0}%</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Highest Score</span>
              <span className="text-xl font-black text-indigo-600">{classSummary.highestScore ?? 0}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lowest Score</span>
              <span className="text-xl font-black text-amber-600">{classSummary.lowestScore ?? 0}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
              <span className="text-xl font-black text-purple-600">
                {reportsData.attendanceOverview?.averageAttendanceRate ?? 100}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* REPORT TYPE TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveTab('tabulation')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === 'tabulation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
        >
          <Table size={14} />
          <span>Tabulation Sheet</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === 'performance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
        >
          <TrendingUp size={14} />
          <span>Student Performance & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === 'credentials'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
        >
          <Key size={14} />
          <span>Student Login Credentials</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
        >
          <Calendar size={14} />
          <span>Attendance Intelligence</span>
        </button>

        <button
          onClick={() => setActiveTab('totalSummary')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === 'totalSummary'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
        >
          <Calculator size={14} />
          <span>Total Score Summary</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={28} />
          <p className="text-xs text-slate-500 font-medium">Compiling classroom academic intelligence...</p>
        </div>
      ) : !reportsData ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
          <Building2 className="mx-auto text-slate-300 mb-3" size={36} />
          <h4 className="text-sm font-bold text-slate-800">Select an Assigned Classroom</h4>
          <p className="text-xs text-slate-500 mt-1">
            Choose a class and section from the dropdown above to view the academic report.
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: TABULATION SHEET */}
          {activeTab === 'tabulation' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Header Bar */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900 uppercase">
                      {classSummary.className || 'Class'} ({classSummary.sectionName || 'All Sections'}) — Exam Tabulation Sheet
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {availableSessions.find((s) => String(s.id) === String(selectedSessionId))?.name || reportsData.activeSession?.name || 'Current Session'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {selectedTermId === '1' ? '1st Term' : selectedTermId === '2' ? '2nd Term' : selectedTermId === '3' ? '3rd Term' : `Term ${selectedTermId}`}
                    </span>
                    {reportsData.selectedExamId && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 shadow-2xs">
                        Matrix: {availableExams.find((e) => e.id === reportsData.selectedExamId)?.displayName || availableExams.find((e) => e.id === reportsData.selectedExamId)?.name || 'Active Matrix'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total Enrolled: <span className="font-bold text-slate-700">{classSummary.totalStudents || 0}</span> | Currently Offered Subjects: <span className="font-bold text-slate-700">{reportsData.offeredSubjects?.length || 0}</span> | Class Pass Rate: <span className="font-bold text-slate-700">{classSummary.passRate ?? 0}%</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto print:hidden">
                  <button
                    onClick={() => setShowScoresAsGrades(!showScoresAsGrades)}
                    className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={13} className="text-blue-600" />
                    <span>{showScoresAsGrades ? 'Show Numeric Scores' : 'Show Letter Grades'}</span>
                  </button>

                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      placeholder="Search student or reg no..."
                      className="w-full h-9 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* No Offered Subjects Notification */}
              {reportsData.offeredSubjects.length === 0 && (
                <div className="m-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold">No subjects currently assigned/offered for this class in this session.</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Please ensure subjects are allocated under Subject Allocation or select the session/term when subjects were offered.</p>
                  </div>
                </div>
              )}

              {/* Tabulation Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-center w-14">Rank</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Reg No</th>
                      {reportsData.offeredSubjects.map((sub) => (
                        <th key={`th-sub-${sub.id}`} className="p-3 text-center">
                          <span className="block truncate max-w-[90px]" title={sub.name}>
                            {sub.subjectCode || sub.code || sub.name}
                          </span>
                        </th>
                      ))}
                      <th className="p-3 text-center font-black bg-blue-50 text-blue-800">Total</th>
                      <th className="p-3 text-center font-black bg-blue-50 text-blue-800">Average %</th>
                      <th className="p-3 text-center font-black bg-indigo-50 text-indigo-800">Grade</th>
                      <th className="p-3 text-center font-black bg-emerald-50 text-emerald-800 print:hidden">Report Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredTabulation.length === 0 ? (
                      <tr>
                        <td colSpan={reportsData.offeredSubjects.length + 7} className="py-12 px-6 text-center text-slate-400 text-xs">
                          <Users size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
                          <p className="font-bold text-slate-600">No active students enrolled in this class for the selected session.</p>
                          <p className="text-[11px] text-slate-400 mt-1">If students were enrolled in another academic session, please switch the Academic Session selector above.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTabulation.map((row) => (
                        <tr key={`tab-row-${row.studentId}`} className="hover:bg-slate-50 transition">
                          <td className="p-3 text-center font-black">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${row.position === 1
                                  ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                                  : row.position === 2
                                    ? 'bg-slate-200 text-slate-800 ring-1 ring-slate-300'
                                    : row.position === 3
                                      ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
                                      : 'text-slate-500 font-normal'
                                }`}
                            >
                              {row.position}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 border border-slate-200">
                                {row.photo ? (
                                  <img src={row.photo} alt={row.name} className="w-full h-full object-cover" />
                                ) : (
                                  (row.name?.[0] || 'S').toUpperCase()
                                )}
                              </div>
                              <span>{row.name}</span>
                              {row.position <= 3 && (
                                <Award size={13} className={row.position === 1 ? 'text-amber-500' : 'text-slate-400'} />
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-500 text-[11px]">{row.registerNo || 'N/A'}</td>

                          {/* Subject Scores */}
                          {reportsData.offeredSubjects.map((sub) => {
                            const score = row.subjectScores[sub.id]
                            const gradeObj = row.subjectGrades?.[sub.id]
                            const breakdown = row.subjectBreakdowns?.[sub.id]

                            return (
                              <td
                                key={`score-${row.studentId}-${sub.id}`}
                                className="p-3 text-center font-mono text-xs"
                                title={
                                  breakdown && Object.keys(breakdown).length > 0
                                    ? Object.entries(breakdown)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(' | ')
                                    : undefined
                                }
                              >
                                {score !== undefined ? (
                                  showScoresAsGrades ? (
                                    <span
                                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${gradeObj?.color === 'emerald'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : gradeObj?.color === 'blue'
                                            ? 'bg-blue-50 text-blue-700'
                                            : gradeObj?.color === 'rose'
                                              ? 'bg-rose-50 text-rose-700'
                                              : 'bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                      {gradeObj?.grade || '-'}
                                    </span>
                                  ) : (
                                    <span
                                      className={
                                        score >= 70
                                          ? 'text-emerald-700 font-bold'
                                          : score >= 50
                                            ? 'text-slate-800 font-semibold'
                                            : 'text-rose-600 font-bold'
                                      }
                                    >
                                      {score}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            )
                          })}

                          <td className="p-3 text-center font-mono font-black text-blue-700 bg-blue-50/40">
                            {row.totalScore}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800 bg-blue-50/40">
                            {row.averageScore}%
                          </td>
                          <td className="p-3 text-center bg-indigo-50/30">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black ${row.grade === 'A'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.grade === 'B'
                                    ? 'bg-blue-100 text-blue-800'
                                    : row.grade === 'C'
                                      ? 'bg-amber-100 text-amber-800'
                                      : row.grade === 'D'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-rose-100 text-rose-800'
                                }`}
                            >
                              {row.grade || '—'}
                            </span>
                          </td>
                          <td className="p-3 text-center bg-emerald-50/20 print:hidden">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewStudentRow(row)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                                title="Preview Branded Report Card & Add Teacher Remark / Signature"
                              >
                                <Eye size={12} /> Report Card
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadStudentReportCardPdf(row)}
                                disabled={downloadingStudentPdfId === row.studentId}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition disabled:opacity-50"
                                title="Download Official Branded PDF Report Card"
                              >
                                {downloadingStudentPdfId === row.studentId ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Download size={12} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* Table Footer with Subject Averages */}
                  {reportsData.performance?.subjectStats && reportsData.performance.subjectStats.length > 0 && (
                    <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 text-[11px] font-bold text-slate-700">
                      <tr>
                        <td colSpan={3} className="p-3 text-right uppercase tracking-wider text-slate-500">
                          Subject Class Average:
                        </td>
                        {reportsData.offeredSubjects.map((sub) => {
                          const stat = reportsData.performance?.subjectStats.find((s) => s.subjectId === sub.id)
                          return (
                            <td key={`foot-sub-${sub.id}`} className="p-3 text-center font-mono text-blue-700 font-bold">
                              {stat ? `${stat.average}` : '—'}
                            </td>
                          )
                        })}
                        <td className="p-3 text-center font-mono font-black bg-blue-100/70 text-blue-900">
                          {classSummary.classAverage}
                        </td>
                        <td className="p-3 text-center font-mono font-black bg-blue-100/70 text-blue-900">
                          {classSummary.classAverage}%
                        </td>
                        <td className="p-3 text-center bg-indigo-100/50 text-indigo-900">
                          {classSummary.passRate}% Pass
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT PERFORMANCE & ANALYTICS */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Honor Roll / Podium */}
              {reportsData.performance?.topPerformers && reportsData.performance.topPerformers.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="text-amber-500" size={20} />
                    <h3 className="text-base font-black text-slate-900">Honor Roll — Top Performers Podium</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reportsData.performance.topPerformers.map((top, idx) => (
                      <div
                        key={`podium-${top.studentId}`}
                        className={`p-5 rounded-2xl border transition relative overflow-hidden ${top.position === 1
                            ? 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border-amber-200 shadow-xs'
                            : top.position === 2
                              ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100/50 border-slate-200'
                              : 'bg-gradient-to-br from-orange-50/50 via-white to-amber-50/20 border-orange-200'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black mb-2 ${top.position === 1
                                  ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                                  : top.position === 2
                                    ? 'bg-slate-200 text-slate-800'
                                    : 'bg-orange-100 text-orange-900'
                                }`}
                            >
                              Rank #{top.position}
                            </span>
                            <h4 className="text-base font-black text-slate-900">{top.name}</h4>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{top.registerNo}</p>
                          </div>

                          <div className="text-right">
                            <span className="text-2xl font-black text-slate-900 block">{top.averageScore}%</span>
                            <span className="text-[11px] font-bold text-slate-500">Total: {top.totalScore}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500">Letter Grade</span>
                          <span
                            className={`px-2 py-0.5 rounded-md ${top.grade === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            Grade {top.grade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade Distribution & Subject Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Grade Distribution */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={18} />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Grade Distribution</h3>
                  </div>

                  {reportsData.performance?.gradeDistribution && (
                    <div className="space-y-3 pt-2">
                      {[
                        { grade: 'A', label: 'Distinction (70% - 100%)', color: 'bg-emerald-500', text: 'text-emerald-700' },
                        { grade: 'B', label: 'Very Good (60% - 69%)', color: 'bg-blue-500', text: 'text-blue-700' },
                        { grade: 'C', label: 'Credit (50% - 59%)', color: 'bg-amber-500', text: 'text-amber-700' },
                        { grade: 'D', label: 'Pass (40% - 49%)', color: 'bg-orange-500', text: 'text-orange-700' },
                        { grade: 'F', label: 'Needs Improvement (<40%)', color: 'bg-rose-500', text: 'text-rose-700' },
                      ].map((item) => {
                        const count = reportsData.performance?.gradeDistribution[item.grade] || 0
                        const total = classSummary.totalStudents || 1
                        const pct = Math.round((count / total) * 100)

                        return (
                          <div key={`gd-${item.grade}`} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-700">{item.label}</span>
                              <span className={item.text}>
                                {count} students ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Subject Difficulty Breakdown */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="text-blue-600" size={18} />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        Subject Performance Breakdown
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-bold">
                      {reportsData.performance?.subjectStats?.length || 0} Subjects
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {reportsData.performance?.subjectStats?.map((sub) => (
                      <div
                        key={`stat-${sub.subjectId}`}
                        className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 text-xs truncate max-w-[150px]">{sub.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">{sub.code || ''}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center pt-1 border-t border-slate-200/50">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Average</span>
                            <span className="text-xs font-black text-blue-700">{sub.average}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Highest</span>
                            <span className="text-xs font-black text-emerald-700">{sub.highest}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Pass %</span>
                            <span className="text-xs font-black text-purple-700">{sub.passRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Students Needing Academic Intervention */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-rose-600" size={18} />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Academic Attention & Parent Follow-up Roster
                    </h3>
                    <p className="text-xs text-slate-500">
                      Students scoring below 50% cumulative average requiring academic intervention or parent consultation.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                      <tr>
                        <th className="p-3">Student</th>
                        <th className="p-3">Reg No</th>
                        <th className="p-3 text-center">Class Average</th>
                        <th className="p-3 text-center">Grade</th>
                        <th className="p-3">Parent Contact</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportsData.tabulation
                        .filter((r) => r.averageScore < 50)
                        .map((row) => (
                          <tr key={`interv-${row.studentId}`} className="hover:bg-rose-50/30 transition">
                            <td className="p-3 font-bold text-slate-900">{row.name}</td>
                            <td className="p-3 font-mono text-slate-500 text-[11px]">{row.registerNo}</td>
                            <td className="p-3 text-center font-mono font-black text-rose-600">{row.averageScore}%</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                {row.grade || 'F'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800">{row.parentName || 'Parent'}</span>
                                <span className="text-[11px] text-slate-500 font-mono">{row.parentPhone || 'No Phone'}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {row.parentPhone && row.parentPhone !== 'N/A' && (
                                <a
                                  href={`tel:${row.parentPhone}`}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                                >
                                  <Phone size={12} />
                                  <span>Call Parent</span>
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      {reportsData.tabulation.filter((r) => r.averageScore < 50).length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-emerald-600 text-xs font-bold">
                            <CheckCircle2 size={16} className="inline mr-1.5" />
                            Excellent news! No students in this classroom are currently below the 50% passing threshold.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT LOGIN CREDENTIALS */}
          {activeTab === 'credentials' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-6">
              {/* Credentials Header & Batch Export Banner */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" size={18} />
                    <h2 className="text-base font-black text-slate-900">
                      Student & Parent Portal Credentials Directory
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Official portal login usernames and temporary passwords for students in {classSummary.className}. You can copy credentials individually or download print-ready slips in bulk.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      placeholder="Search student or username..."
                      className="w-full h-9 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    onClick={handleDownloadBatchCredentialsPdf}
                    disabled={downloadingPdf}
                    className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    {downloadingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    <span>Download Slips PDF</span>
                  </button>
                </div>
              </div>

              {/* Credentials Roster Table */}
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Admission No</th>
                      <th className="p-3">Portal Username</th>
                      <th className="p-3">Portal Password</th>
                      <th className="p-3">Parent Details</th>
                      <th className="p-3 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTabulation.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                          No students found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredTabulation.map((row, idx) => {
                        const isPassVisible = !!visiblePasswords[row.studentId]
                        const studentUsername = row.studentUsername || `${row.firstName?.toLowerCase()}.${row.lastName?.toLowerCase()}`
                        const studentPassword = row.studentPassword || 'Pass@123'
                        const copySlipKey = `slip-${row.studentId}`
                        const copyUserKey = `u-${row.studentId}`
                        const copyPassKey = `p-${row.studentId}`

                        const fullSlipText = `[UGBEKUN ACADEMY] Student Portal Access\nStudent: ${row.name}\nClass: ${classSummary.className}\nReg No: ${row.registerNo}\nUsername: ${studentUsername}\nPassword: ${studentPassword}\nParent: ${row.parentName || 'N/A'} (${row.parentPhone || 'N/A'})`

                        return (
                          <tr key={`cred-row-${row.studentId}`} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{row.name}</span>
                              <span className="text-[10px] text-slate-400 capitalize">{row.sectionName} section</span>
                            </td>
                            <td className="p-3 font-mono text-slate-500 text-[11px]">{row.registerNo || 'N/A'}</td>

                            {/* Username with Copy */}
                            <td className="p-3">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200/60 font-mono text-xs text-slate-800">
                                <span>{studentUsername}</span>
                                <button
                                  onClick={() => handleCopyText(studentUsername, copyUserKey, 'Username')}
                                  className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                  title="Copy username"
                                >
                                  {copiedKey === copyUserKey ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </td>

                            {/* Password with Show/Hide & Copy */}
                            <td className="p-3">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/70 border border-amber-200/60 rounded-lg font-mono text-xs text-amber-900">
                                <span>{isPassVisible ? studentPassword : '••••••••'}</span>
                                <button
                                  onClick={() => togglePasswordVisibility(row.studentId)}
                                  className="text-amber-600 hover:text-amber-800 transition cursor-pointer ml-1"
                                  title={isPassVisible ? 'Hide password' : 'Show password'}
                                >
                                  {isPassVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                                <button
                                  onClick={() => handleCopyText(studentPassword, copyPassKey, 'Password')}
                                  className="text-amber-600 hover:text-amber-800 transition cursor-pointer"
                                  title="Copy password"
                                >
                                  {copiedKey === copyPassKey ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </td>

                            {/* Parent Details */}
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-xs">{row.parentName || 'Parent / Guardian'}</span>
                                {row.parentPhone && row.parentPhone !== 'N/A' && (
                                  <a
                                    href={`tel:${row.parentPhone}`}
                                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-mono mt-0.5"
                                  >
                                    <Phone size={10} />
                                    <span>{row.parentPhone}</span>
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Quick Actions */}
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleCopyText(fullSlipText, copySlipKey, 'Full credential slip')}
                                className="h-8 px-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer border border-slate-200/70"
                                title="Copy student's credential slip"
                              >
                                {copiedKey === copySlipKey ? (
                                  <>
                                    <Check size={12} className="text-emerald-600" />
                                    <span className="text-emerald-700">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy Slip</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE INTELLIGENCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Attendance Overview Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-blue-600" size={18} />
                    <h3 className="text-base font-black text-slate-900">Class Attendance Summary</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Records aggregated across all calendar session days recorded in the school register for this class.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-2xl border border-purple-100">
                    <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block">
                      Days Recorded
                    </span>
                    <span className="text-xl font-black text-purple-700">
                      {reportsData.attendanceOverview?.totalDaysRecorded || 0}
                    </span>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                      Average Rate
                    </span>
                    <span className="text-xl font-black text-indigo-700">
                      {reportsData.attendanceOverview?.averageAttendanceRate || 100}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase">Student Attendance Roster</h4>
                  <div className="relative w-64 print:hidden">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      placeholder="Filter student..."
                      className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Reg No</th>
                        <th className="p-3 text-center">Attendance Rate</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTabulation.map((row, idx) => (
                        <tr key={`att-${row.studentId}`} className="hover:bg-slate-50 transition">
                          <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{row.name}</td>
                          <td className="p-3 font-mono text-slate-500 text-[11px]">{row.registerNo}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {row.attendanceRate}%
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${row.attendanceRate >= 85
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.attendanceRate >= 70
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                            >
                              {row.attendanceRate >= 85
                                ? 'Regular'
                                : row.attendanceRate >= 70
                                  ? 'Moderate'
                                  : 'Chronic Absence'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TOTAL SCORE SUMMARY (NON-EDITABLE ASSESSMENT BREAKDOWN) */}
          {activeTab === 'totalSummary' && (
            <div className="space-y-6">
              {/* Header / Admin Matrix Scheme Banner */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs">
                      <Calculator size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-slate-900 uppercase">
                          Total Score Summary — Assessment & Exam Breakdown
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Lock size={10} />
                          <span>Non-Editable / Official Lock</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {availableSessions.find((s) => String(s.id) === String(selectedSessionId))?.name || reportsData.activeSession?.name || 'Current Session'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          {selectedTermId === '1' ? '1st Term' : selectedTermId === '2' ? '2nd Term' : selectedTermId === '3' ? '3rd Term' : `Term ${selectedTermId}`}
                        </span>
                        {reportsData.selectedExamId && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 shadow-2xs">
                            Matrix: {availableExams.find((e) => e.id === reportsData.selectedExamId)?.displayName || availableExams.find((e) => e.id === reportsData.selectedExamId)?.name || 'Active Matrix'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Consolidated test and exam scores entered by teachers for the current academic session. Evaluated based on the active assessment matrix set by the school admin.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={handlePrint}
                      className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer size={13} />
                      <span>Print Summary</span>
                    </button>
                  </div>
                </div>

                {/* Admin-Configured Components Scheme Display */}
                {totalSummaryComponents.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                      <Layers size={14} className="text-blue-600" />
                      <span>Admin Assessment Scheme Components:</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {totalSummaryComponents.map((comp) => (
                        <span
                          key={`sum-comp-${comp.key}`}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs flex items-center gap-1.5 ${comp.category === 'EXAM'
                              ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                              : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                            }`}
                        >
                          <span>{comp.name}</span>
                          <span className={comp.category === 'EXAM' ? 'text-blue-600 font-mono' : 'text-indigo-600 font-mono'}>
                            ({comp.maxMarks}pts)
                          </span>
                        </span>
                      ))}
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                        Max Total: {totalSummaryMaxMarks} Marks
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* KPI Statistics Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Class Average CA</span>
                  <span className="text-xl font-black text-indigo-600 mt-1 block">
                    {classAvgCA} pts
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Aggregated continuous assessment</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Class Average Exam</span>
                  <span className="text-xl font-black text-blue-600 mt-1 block">
                    {classAvgExam} pts
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Terminal exam score average</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Overall Total Average</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">
                    {classSummary.classAverage || 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Combined CA + Exam average</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Highest Total Score</span>
                  <span className="text-xl font-black text-emerald-600 mt-1 block">
                    {classSummary.highestScore || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Top performer overall mark</span>
                </div>
              </div>

              {/* Toolbar & Filters */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-3 flex-1 flex-wrap">
                  {/* Subject Selector */}
                  <div className="w-full sm:w-72">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Filter by Subject / Roster
                    </label>
                    <div className="relative">
                      <select
                        value={summarySubjectFilter}
                        onChange={(e) => setSummarySubjectFilter(e.target.value)}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="">All Subjects (Cumulative Roster)</option>
                        {reportsData.offeredSubjects.map((sub) => (
                          <option key={`sum-sub-${sub.id}`} value={String(sub.id)}>
                            {sub.name} ({sub.subjectCode || sub.code || 'SUB'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Student Search */}
                  <div className="w-full sm:w-64">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Search Student
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder="Search student or reg no..."
                        className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <span className="text-xs font-bold text-slate-500">View:</span>
                  <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setSummaryViewMode('breakdown')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${summaryViewMode === 'breakdown'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Detailed Breakdown
                    </button>
                    <button
                      onClick={() => setSummaryViewMode('compact')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${summaryViewMode === 'compact'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Compact Total
                    </button>
                  </div>
                </div>
              </div>

              {/* The Score Summary Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 uppercase">
                      {selectedSummarySubject
                        ? `${selectedSummarySubject.name} — Continuous Assessment & Exam Breakdown`
                        : 'Class Overall Continuous Assessment & Total Examination Roster'}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {filteredTabulation.length} Students
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Lock size={12} className="text-slate-400" />
                    Read-only verified records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      {selectedSummarySubject ? (
                        /* Subject Specific Column Headers */
                        <tr>
                          <th className="p-3 text-center w-14">Rank</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Reg No</th>
                          {totalSummaryComponents.map((comp) => (
                            <th key={`th-comp-${comp.key}`} className="p-3 text-center">
                              <span className="block truncate max-w-[120px]" title={comp.name}>
                                {comp.name}
                              </span>
                              <span className="block text-[9px] font-normal lowercase text-slate-500">
                                max {comp.maxMarks}
                              </span>
                            </th>
                          ))}
                          <th className="p-3 text-center font-black bg-blue-50 text-blue-800">Total Score</th>
                          <th className="p-3 text-center font-black bg-indigo-50 text-indigo-800">Grade</th>
                          <th className="p-3 text-center">Remark</th>
                        </tr>
                      ) : (
                        /* All Subjects Combined Headers */
                        <tr>
                          <th className="p-3 text-center w-14">Rank</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Reg No</th>
                          <th className="p-3">Section</th>
                          {summaryViewMode === 'breakdown' && (
                            <>
                              <th className="p-3 text-center font-bold bg-indigo-50/50 text-indigo-800">CA Total</th>
                              <th className="p-3 text-center font-bold bg-blue-50/50 text-blue-800">Exam Total</th>
                            </>
                          )}
                          <th className="p-3 text-center font-black bg-slate-200/80 text-slate-900">Grand Total</th>
                          <th className="p-3 text-center font-black bg-blue-50 text-blue-800">Average %</th>
                          <th className="p-3 text-center font-black bg-indigo-50 text-indigo-800">Grade</th>
                          <th className="p-3 text-center">Remark</th>
                        </tr>
                      )}
                    </thead>

                    <tbody className="divide-y divide-slate-100 font-sans">
                      {filteredTabulation.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 px-6 text-center text-slate-400 text-xs">
                            <Users size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
                            <p className="font-bold text-slate-600">No student records found matching filter.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredTabulation.map((row) => {
                          if (selectedSummarySubject) {
                            const subId = selectedSummarySubject.id
                            const breakdown = row.subjectBreakdowns?.[subId] || {}
                            const subScore = row.subjectScores?.[subId] ?? 0
                            const subGrade = row.subjectGrades?.[subId]

                            return (
                              <tr key={`sum-row-${row.studentId}`} className="hover:bg-slate-50 transition">
                                <td className="p-3 text-center font-black text-slate-600">{row.position}</td>
                                <td className="p-3 font-bold text-slate-900">
                                  <div className="flex items-center gap-1.5">
                                    <span>{row.name}</span>
                                    {row.position <= 3 && (
                                      <Award size={13} className={row.position === 1 ? 'text-amber-500' : 'text-slate-400'} />
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-slate-500 text-[11px]">{row.registerNo}</td>

                                {/* Dynamic Components Entered by Teachers */}
                                {totalSummaryComponents.map((comp) => {
                                  const compVal = breakdown[comp.code] ?? breakdown[comp.key] ?? breakdown[comp.name]
                                  return (
                                    <td
                                      key={`comp-val-${row.studentId}-${comp.key}`}
                                      className="p-3 text-center font-mono font-semibold"
                                    >
                                      {compVal !== undefined && compVal !== null ? (
                                        <span
                                          className={
                                            Number(compVal) >= comp.maxMarks * 0.7
                                              ? 'text-emerald-700 font-bold'
                                              : Number(compVal) >= comp.maxMarks * 0.5
                                                ? 'text-slate-800'
                                                : 'text-rose-600 font-bold'
                                          }
                                        >
                                          {compVal}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300">—</span>
                                      )}
                                    </td>
                                  )
                                })}

                                <td className="p-3 text-center font-mono font-black text-blue-700 bg-blue-50/40">
                                  {subScore}
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${subGrade?.color === 'emerald'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : subGrade?.color === 'blue'
                                          ? 'bg-blue-50 text-blue-700'
                                          : subGrade?.color === 'rose'
                                            ? 'bg-rose-50 text-rose-700'
                                            : 'bg-slate-100 text-slate-700'
                                      }`}
                                  >
                                    {subGrade?.grade || '-'}
                                  </span>
                                </td>
                                <td className="p-3 text-center text-slate-600 text-[11px]">
                                  {subGrade?.remark || '—'}
                                </td>
                              </tr>
                            )
                          }

                          /* All Subjects Combined Row */
                          return (
                            <tr key={`sum-row-${row.studentId}`} className="hover:bg-slate-50 transition">
                              <td className="p-3 text-center font-black text-slate-600">{row.position}</td>
                              <td className="p-3 font-bold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <span>{row.name}</span>
                                  {row.position <= 3 && (
                                    <Award size={13} className={row.position === 1 ? 'text-amber-500' : 'text-slate-400'} />
                                  )}
                                </div>
                              </td>
                              <td className="p-3 font-mono text-slate-500 text-[11px]">{row.registerNo}</td>
                              <td className="p-3 text-slate-600">{row.sectionName}</td>

                              {summaryViewMode === 'breakdown' && (
                                <>
                                  <td className="p-3 text-center font-mono font-bold text-indigo-700 bg-indigo-50/20">
                                    {row.totalCA ?? '—'}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-blue-700 bg-blue-50/20">
                                    {row.totalExam ?? '—'}
                                  </td>
                                </>
                              )}

                              <td className="p-3 text-center font-mono font-black text-slate-900 bg-slate-50">
                                {row.totalScore}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-blue-700">
                                {row.averageScore}%
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${row.gradeColor === 'emerald'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : row.gradeColor === 'blue'
                                        ? 'bg-blue-50 text-blue-700'
                                        : row.gradeColor === 'rose'
                                          ? 'bg-rose-50 text-rose-700'
                                          : 'bg-slate-100 text-slate-700'
                                    }`}
                                >
                                  {row.grade || '—'}
                                </span>
                              </td>
                              <td className="p-3 text-center text-slate-600 text-[11px]">
                                {row.gradeRemark || '—'}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* LIVE BRANDED REPORT CARD PREVIEW & TEACHER COMMENT/SIGNATURE MODAL */}
      {previewStudentRow && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto print:static print:bg-transparent print:p-0">
          <div className="w-full max-w-4xl my-4">
            <BrandedReportCardPreview
              student={buildStudentPreviewData(previewStudentRow)}
              branding={reportsData?.schoolBranding}
              assessmentComponents={reportsData?.assessmentComponents}
              maxTotal={reportsData?.subjectMaxMarks}
              stage={reportsData?.stage || selectedStage}
              gradingRanges={(reportsData?.gradingScale?.ranges || []).map((r) => ({
                grade: r.grade,
                minPercentage: r.minPercentage ?? r.minScore,
                maxPercentage: r.maxPercentage ?? r.maxScore,
                remark: r.remark,
              }))}
              onClose={() => setPreviewStudentRow(null)}
              onDownloadPdf={() => handleDownloadStudentReportCardPdf(previewStudentRow)}
              isDownloadingPdf={downloadingStudentPdfId === previewStudentRow.studentId}
              editable
              editorRole="teacher"
              onSaveRemarksAndSettings={async (payload) => {
                if (!selectedClassId) return
                const secId =
                  selectedSectionId ||
                  String(currentSections[0]?.id || classSummary.sectionId || 1)
                const res = await apiSlice.post<{ success: boolean; message?: string }>(
                  endpoints.teacher.saveCommentary,
                  {
                    studentId: payload.studentId,
                    classId: Number(selectedClassId),
                    sectionId: Number(secId),
                    remark: payload.teacherComment,
                    principalRemark: payload.principalComment,
                    teacherSignatureUrl: payload.teacherSignatureUrl,
                    status: 'SUBMITTED_TO_PRINCIPAL',
                  }
                )
                if (res.success) {
                  toast.success("Teacher's comment & signature saved to report card immediately!")
                  await fetchReports()
                  setPreviewStudentRow((prev) =>
                    prev
                      ? {
                        ...prev,
                        teacherComment: payload.teacherComment,
                        principalComment: payload.principalComment,
                      }
                      : null
                  )
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
