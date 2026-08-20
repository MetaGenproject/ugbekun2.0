'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Sparkles,
  Award,
  Heart,
  Activity,
  History,
  Printer,
  Download,
  Loader2,
  CheckCircle2,
  Bot,
  UserCheck,
  Building2,
  Search,
  Star,
  Check,
  Send,
  Sliders,
  AlertCircle,
  RefreshCw,
  Eye,
  GraduationCap,
  Users,
  Calendar
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'

type ReportCardTab = 'generate' | 'ai-comments' | 'psychomotor' | 'affective' | 'history'

interface ClassSectionItem {
  id: number
  name: string
  studentCount: number
}

interface ClassItem {
  id: number
  name: string
  isEcd: boolean
  totalEnrolled: number
  sections: ClassSectionItem[]
}

interface SubjectScoreItem {
  id: number
  examName: string
  subjectName: string
  subjectCode: string
  cbtMark: string | null
  theoryMark: string | null
  mark: string | null
  absent: boolean
  classAverage?: number
}

interface StudentReportPreview {
  id: number
  studentName: string
  firstName: string
  lastName: string
  admissionNo: string
  registerNo: string | null
  className: string
  gender: string
  totalMarks: number
  average: number
  grade: string
  position: string
  rank: number | null
  attendanceDays: string
  presentCount: number
  absentCount: number
  totalAttendanceDays: number
  teacherComment: string
  principalComment: string
  commentStatus: string
  isAiGenerated: boolean
  psychomotor: {
    writingMastery: string
    drawingCapability: string
    physicalCoordination: string
    motorSkillProgression: string
  }
  affective: {
    generalPunctuality: string
    peerRespect: string
    aestheticNeatness: string
    activeGroupParticipation: string
  }
  isEcd: boolean
  subjectsCount: number
  reportCard: SubjectScoreItem[]
}

export function ReportCardManagement() {
  const [activeTab, setActiveTab] = useState<ReportCardTab>('generate')
  
  // Class selection state
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null)
  const [rankingType, setRankingType] = useState<'full' | 'topn' | 'hidden'>('full')
  const [rankingLimit, setRankingLimit] = useState<number>(3)

  // Loading & Data States
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [students, setStudents] = useState<StudentReportPreview[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Batch Generation State
  const [isBatchGeneratingPdf, setIsBatchGeneratingPdf] = useState(false)
  const [downloadingStudentId, setDownloadingStudentId] = useState<number | null>(null)

  // AI Comment Generator State
  const [selectedAiStudentId, setSelectedAiStudentId] = useState<number | null>(null)
  const [aiStudentName, setAiStudentName] = useState('')
  const [aiAverage, setAiAverage] = useState('')
  const [aiAttendance, setAiAttendance] = useState('')
  const [aiStrengths, setAiStrengths] = useState('Academic Excellence & Analytical Thinking')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [teacherComment, setTeacherComment] = useState('')
  const [principalComment, setPrincipalComment] = useState('')

  // Whole Classroom Batch AI Commentary State
  const [showBatchAiModal, setShowBatchAiModal] = useState(false)
  const [batchTone, setBatchTone] = useState<'constructive' | 'rigorous' | 'growth-oriented' | 'encouraging'>('constructive')
  const [batchBehavioralTags, setBatchBehavioralTags] = useState<string[]>(['Courteous', 'Attentive', 'Diligent', 'Punctual'])
  const [isBatchGenerating, setIsBatchGenerating] = useState(false)
  const [batchGeneratedRemarks, setBatchGeneratedRemarks] = useState<Array<{
    studentId: number
    studentName: string
    registerNo?: string
    averageScore: number
    attendanceRate: number
    generatedRemark: string
    principalRemark?: string
  }>>([])
  const [isBatchSaving, setIsBatchSaving] = useState(false)

  // Psychomotor & Affective Evaluation State
  const [psychomotorScores, setPsychomotorScores] = useState<Record<number, Record<string, string>>>({})
  const [affectiveScores, setAffectiveScores] = useState<Record<number, Record<string, string>>>({})
  const [isSavingBehavioral, setIsSavingBehavioral] = useState(false)

  // Load Classes on Mount
  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setLoadingClasses(true)
    try {
      const res = await apiSlice.get<{ success: boolean; classes: ClassItem[] }>(
        endpoints.admin.reportCards.classes
      )
      if (res.success && res.classes) {
        setClasses(res.classes)
        if (res.classes.length > 0) {
          const firstCls = res.classes[0]
          setSelectedClassId(firstCls.id)
          if (firstCls.sections.length > 0) {
            setSelectedSectionId(firstCls.sections[0].id)
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load classrooms.')
    } finally {
      setLoadingClasses(false)
    }
  }

  // Fetch Students when selected class/section changes
  useEffect(() => {
    if (selectedClassId && selectedSectionId) {
      fetchStudents(selectedClassId, selectedSectionId)
    } else {
      setStudents([])
    }
  }, [selectedClassId, selectedSectionId])

  const fetchStudents = async (classId: number, sectionId: number) => {
    setLoadingStudents(true)
    try {
      const res = await apiSlice.get<{
        success: boolean
        className: string
        isEcd: boolean
        totalStudents: number
        students: StudentReportPreview[]
      }>(endpoints.admin.reportCards.students(classId, sectionId))

      if (res.success && res.students) {
        setStudents(res.students)
        
        // Populate initial AI selection
        if (res.students.length > 0) {
          const s0 = res.students[0]
          setSelectedAiStudentId(s0.id)
          setAiStudentName(s0.studentName)
          setAiAverage(String(s0.average))
          setAiAttendance(s0.totalAttendanceDays > 0 ? `${Math.round((s0.presentCount / s0.totalAttendanceDays) * 100)}%` : '95%')
          setTeacherComment(s0.teacherComment || `${s0.studentName} has displayed commendable academic dedication and consistent progress this term.`)
          setPrincipalComment(s0.principalComment || (s0.average >= 70 ? 'Promoted with distinction.' : 'Promoted.'))
        }

        // Populate psychomotor & affective ratings maps
        const psychMap: Record<number, Record<string, string>> = {}
        const affMap: Record<number, Record<string, string>> = {}
        res.students.forEach(st => {
          psychMap[st.id] = { ...st.psychomotor }
          affMap[st.id] = { ...st.affective }
        })
        setPsychomotorScores(psychMap)
        setAffectiveScores(affMap)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to compile classroom report cards.')
    } finally {
      setLoadingStudents(false)
    }
  }

  // Handle AI student selection change
  const handleAiStudentSelect = (studentId: number) => {
    setSelectedAiStudentId(studentId)
    const st = students.find(s => s.id === studentId)
    if (st) {
      setAiStudentName(st.studentName)
      setAiAverage(String(st.average))
      setAiAttendance(st.totalAttendanceDays > 0 ? `${Math.round((st.presentCount / st.totalAttendanceDays) * 100)}%` : '95%')
      setTeacherComment(st.teacherComment || `${st.studentName} has displayed commendable academic dedication and consistent progress this term.`)
      setPrincipalComment(st.principalComment || (st.average >= 70 ? 'Promoted with distinction.' : 'Promoted.'))
    }
  }

  // 1-Click Single PDF Report Card Download
  const handleDownloadSinglePdf = async (st: StudentReportPreview) => {
    if (!selectedClassId || !selectedSectionId) return
    setDownloadingStudentId(st.id)
    toast.info(`Compiling official report card for ${st.studentName}…`)

    try {
      const url = endpoints.admin.reportCards.exportPdf(
        st.id,
        selectedClassId,
        selectedSectionId,
        rankingType,
        rankingLimit
      )
      const safeName = (st.lastName || 'Student').replace(/\s+/g, '_')
      const safeFirst = (st.firstName || 'Record').replace(/\s+/g, '_')
      await apiSlice.download(url, `Report_Card_${safeName}_${safeFirst}.pdf`)
      toast.success(`Report Card downloaded for ${st.studentName}!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to download report card PDF.')
    } finally {
      setDownloadingStudentId(null)
    }
  }

  // 1-Click Batch PDF Class Report Cards Download
  const handleDownloadBatchPdf = async () => {
    if (!selectedClassId || !selectedSectionId) {
      toast.error('Please select both a class and section.')
      return
    }

    if (students.length === 0) {
      toast.error('No student records found in this class section.')
      return
    }

    setIsBatchGeneratingPdf(true)
    const currentClass = classes.find(c => c.id === selectedClassId)
    const currentSec = currentClass?.sections.find(s => s.id === selectedSectionId)
    const className = currentClass?.name || 'Class'
    const sectionName = currentSec?.name || 'Main'

    toast.info(`Compiling 1-Click Batch PDF for ${className} (${sectionName}) with ${students.length} students…`)

    try {
      const url = endpoints.admin.reportCards.exportBatchPdf(
        selectedClassId,
        selectedSectionId,
        rankingType,
        rankingLimit
      )
      const safeCls = className.replace(/\s+/g, '_')
      const safeSec = sectionName.replace(/\s+/g, '_')
      await apiSlice.download(url, `Batch_Report_Cards_${safeCls}_${safeSec}.pdf`)
      toast.success(`Classroom Batch Report Cards compiled successfully! (${students.length} Pages)`)
    } catch (err: any) {
      toast.error(err.message || 'Batch report card generation failed.')
    } finally {
      setIsBatchGeneratingPdf(false)
    }
  }

  // Trigger AI Remarks Generation
  const handleGenerateAiRemarks = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingAi(true)

    try {
      const res = await apiSlice.post<{
        success: boolean
        teacherComment: string
        principalComment: string
      }>(endpoints.admin.reportCards.aiComments, {
        studentName: aiStudentName,
        averageScore: Number(aiAverage) || 75,
        attendanceRate: Number(aiAttendance.replace('%', '')) || 90,
        strengths: aiStrengths
      })

      if (res.success) {
        setTeacherComment(res.teacherComment)
        setPrincipalComment(res.principalComment)
        toast.success('AI Remarks generated successfully!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate AI remarks.')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // Attach & Save Remarks to Student Profile
  const handleSaveCommentary = async () => {
    if (!selectedAiStudentId || !selectedClassId || !selectedSectionId) {
      toast.error('Please select a student and valid class.')
      return
    }

    setIsSavingComment(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.reportCards.commentary,
        {
          studentId: selectedAiStudentId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          remark: teacherComment,
          principalRemark: principalComment,
          status: 'PRINCIPAL_SIGNED_OFF'
        }
      )

      if (res.success) {
        toast.success(res.message || 'Remarks successfully attached to student report card!')
        // Update local student array
        setStudents(prev =>
          prev.map(s =>
            s.id === selectedAiStudentId
              ? { ...s, teacherComment, principalComment, commentStatus: 'PRINCIPAL_SIGNED_OFF' }
              : s
          )
        )
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save commentary.')
    } finally {
      setIsSavingComment(false)
    }
  }

  // Batch Generate AI Commentary for Whole Classroom
  const handleBatchGenerateAi = async () => {
    if (!selectedClassId || !selectedSectionId) {
      toast.error('Please select an active Class and Section.')
      return
    }

    setIsBatchGenerating(true)
    try {
      const res = await apiSlice.post<{
        success: boolean
        count: number
        commentaries: Array<{
          studentId: number
          studentName: string
          registerNo?: string
          averageScore: number
          attendanceRate: number
          generatedRemark: string
        }>
      }>(endpoints.admin.batchGenerateCommentary, {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        tone: batchTone,
        behavioralTags: batchBehavioralTags
      })

      if (res.success && res.commentaries) {
        const enriched = res.commentaries.map(c => ({
          ...c,
          principalRemark: c.averageScore >= 75
            ? 'Commended for academic distinction. Promoted with praise!'
            : (c.averageScore >= 50 ? 'Satisfactory terminal result. Promoted.' : 'Recommended for structured holiday revision.')
        }))
        setBatchGeneratedRemarks(enriched)
        toast.success(`Generated personalized AI remarks for ${res.count} students!`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to batch generate remarks.')
    } finally {
      setIsBatchGenerating(false)
    }
  }

  // Batch Save & Authorize All Remarks
  const handleBatchSaveAllRemarks = async () => {
    if (!selectedClassId || !selectedSectionId || batchGeneratedRemarks.length === 0) {
      toast.error('No generated remarks to save.')
      return
    }

    setIsBatchSaving(true)
    try {
      const payload = batchGeneratedRemarks.map(r => ({
        studentId: r.studentId,
        remark: r.generatedRemark,
        principalRemark: r.principalRemark,
        status: 'APPROVED_BY_PRINCIPAL'
      }))

      const res = await apiSlice.post<{ success: boolean; message: string; savedCount: number }>(
        endpoints.admin.batchSaveCommentary,
        {
          classId: selectedClassId,
          sectionId: selectedSectionId,
          commentaries: payload,
          status: 'APPROVED_BY_PRINCIPAL'
        }
      )

      if (res.success) {
        toast.success(res.message || `Saved & authorized ${res.savedCount} report card remarks!`)
        setShowBatchAiModal(false)
        fetchStudents(selectedClassId, selectedSectionId)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to batch save commentaries.')
    } finally {
      setIsBatchSaving(false)
    }
  }

  // Save Psychomotor / Affective Ratings
  const handleSaveBehavioralRatings = async (studentId: number) => {
    if (!selectedClassId || !selectedSectionId) return
    setIsSavingBehavioral(true)

    try {
      const psych = psychomotorScores[studentId] || {
        writingMastery: 'AC',
        drawingCapability: 'AC',
        physicalCoordination: 'AC',
        motorSkillProgression: 'AC'
      }

      const aff = affectiveScores[studentId] || {
        generalPunctuality: 'AC',
        peerRespect: 'AC',
        aestheticNeatness: 'AC',
        activeGroupParticipation: 'AC'
      }

      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.reportCards.behavioral,
        {
          studentId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          psychomotor: psych,
          affective: aff,
          narrativeComment: teacherComment
        }
      )

      if (res.success) {
        toast.success(res.message || 'Behavioral ratings saved to report card!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save behavioral ratings.')
    } finally {
      setIsSavingBehavioral(false)
    }
  }

  // Save All Behavioral Ratings for the Classroom
  const handleSaveAllBehavioralRatings = async () => {
    if (!selectedClassId || !selectedSectionId || students.length === 0) return
    setIsSavingBehavioral(true)

    try {
      for (const st of students) {
        const psych = psychomotorScores[st.id] || {
          writingMastery: 'AC',
          drawingCapability: 'AC',
          physicalCoordination: 'AC',
          motorSkillProgression: 'AC'
        }
        const aff = affectiveScores[st.id] || {
          generalPunctuality: 'AC',
          peerRespect: 'AC',
          aestheticNeatness: 'AC',
          activeGroupParticipation: 'AC'
        }

        await apiSlice.post(endpoints.admin.reportCards.behavioral, {
          studentId: st.id,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          psychomotor: psych,
          affective: aff
        })
      }
      toast.success(`Successfully saved behavioral assessments for all ${students.length} students!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save all behavioral ratings.')
    } finally {
      setIsSavingBehavioral(false)
    }
  }

  // Filtered students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students
    const q = searchQuery.toLowerCase()
    return students.filter(
      s =>
        s.studentName.toLowerCase().includes(q) ||
        (s.admissionNo && s.admissionNo.toLowerCase().includes(q))
    )
  }, [students, searchQuery])

  // Current selected class object
  const currentClass = classes.find(c => c.id === selectedClassId)
  const currentSections = currentClass?.sections || []

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-rose-50/70 rounded-full blur-3xl opacity-70" />
          <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-indigo-50/50 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                1-Click PDF Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                Real-Time DB Sync
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-rose-600" size={24} /> Automated Report Card Generation Engine
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Instant 1-Click single and whole-classroom batch PDF report cards, AI automated commentary, psychomotor & affective evaluations, and report archives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai-comments')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles size={15} className="text-amber-400" /> AI Comment Engine
            </button>
            <button
              onClick={handleDownloadBatchPdf}
              disabled={isBatchGeneratingPdf || students.length === 0}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              {isBatchGeneratingPdf ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Printer size={15} />
              )}
              Batch Print Class ({students.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'generate' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText size={15} /> Generate Report Cards
        </button>

        <button
          onClick={() => setActiveTab('ai-comments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'ai-comments' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles size={15} className="text-amber-300" /> AI Comments
        </button>

        <button
          onClick={() => setActiveTab('psychomotor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'psychomotor' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity size={15} /> Psychomotor Assessment
        </button>

        <button
          onClick={() => setActiveTab('affective')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'affective' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart size={15} /> Affective Assessment
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'history' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History size={15} /> Report History & Archives
        </button>
      </div>

      {/* Classroom & Ranking Selector Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Classroom:</span>
            <select
              value={selectedClassId || ''}
              onChange={e => {
                const cid = Number(e.target.value)
                setSelectedClassId(cid)
                const c = classes.find(item => item.id === cid)
                if (c && c.sections.length > 0) {
                  setSelectedSectionId(c.sections[0].id)
                } else {
                  setSelectedSectionId(null)
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.isEcd ? '(Early Years / Montessori)' : ''} ({c.totalEnrolled} Students)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Section / Stream:</span>
            <select
              value={selectedSectionId || ''}
              onChange={e => setSelectedSectionId(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
            >
              {currentSections.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentCount} enrolled)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <span className="text-xs font-bold text-slate-500">Ranking:</span>
            <select
              value={rankingType}
              onChange={e => setRankingType(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
            >
              <option value="full">Full Class Rank</option>
              <option value="topn">Top N Ranks Only</option>
              <option value="hidden">Hide Class Rank</option>
            </select>
            {rankingType === 'topn' && (
              <select
                value={rankingLimit}
                onChange={e => setRankingLimit(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search student or reg no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
            />
          </div>

          <button
            onClick={() => {
              if (selectedClassId && selectedSectionId) {
                fetchStudents(selectedClassId, selectedSectionId)
              }
            }}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw size={14} className={loadingStudents ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* TAB 1: GENERATE REPORT CARDS */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {loadingStudents ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="animate-spin text-rose-600" size={32} />
              <p className="text-sm font-bold text-slate-600">Compiling real classroom performance records…</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <AlertCircle className="mx-auto text-amber-500" size={36} />
              <h3 className="text-base font-bold text-slate-800">No Enrolled Students Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No students are currently enrolled in this classroom for the active academic session.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Roster</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xl font-black text-slate-900">{students.length} Pupils</span>
                    <Users size={18} className="text-blue-500" />
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Average</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xl font-black text-slate-900">
                      {students.length > 0
                        ? (students.reduce((acc, s) => acc + s.average, 0) / students.length).toFixed(1)
                        : 0}%
                    </span>
                    <Award size={18} className="text-emerald-500" />
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evaluation Mode</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-black text-slate-900 uppercase">
                      {currentClass?.isEcd ? 'Montessori ECD' : 'Standard 100-Point'}
                    </span>
                    <GraduationCap size={18} className="text-indigo-500" />
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1-Click Batch Print</span>
                  <button
                    onClick={handleDownloadBatchPdf}
                    disabled={isBatchGenerating}
                    className="mt-1 w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    {isBatchGenerating ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />} Download Class PDF
                  </button>
                </div>
              </div>

              {/* Student Report Cards Preview Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((st) => (
                  <div
                    key={st.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{st.studentName}</h4>
                        <p className="text-[11px] font-mono text-slate-400">
                          {st.admissionNo} • {st.className}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-black border ${
                          st.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : st.grade === 'B'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : st.grade === 'C'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        Grade {st.grade}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-bold">AVERAGE SCORE</span>
                        <span className="font-mono font-black text-slate-900 text-sm">{st.average}%</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-bold">CLASS RANK</span>
                        <span className="font-bold text-indigo-700 text-sm">{st.position}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600">
                      <p className="flex items-center justify-between">
                        <strong className="text-slate-700">Attendance Log:</strong>
                        <span className="font-mono font-semibold text-slate-800">{st.attendanceDays}</span>
                      </p>
                      <p className="truncate text-slate-500">
                        <strong className="text-slate-700">Remarks:</strong> {st.teacherComment || 'Pending assessment remarks.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadSinglePdf(st)}
                        disabled={downloadingStudentId === st.id}
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        {downloadingStudentId === st.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Download size={13} />
                        )}
                        1-Click PDF Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: AI COMMENTS ENGINE */}
      {activeTab === 'ai-comments' && (
        <div className="space-y-6">
          {/* Whole Classroom AI Batch Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-amber-200">
                <Sparkles size={18} /> 1-Click Classroom AI Engine
              </div>
              <h3 className="text-xl font-black mt-1">Batch Generate Narrative Remarks for Entire Class</h3>
              <p className="text-xs text-white/85 max-w-xl mt-1">
                Instantly evaluate all enrolled students’ real marks, subject strengths, and attendance rates to produce bespoke, constructive remarks in seconds.
              </p>
            </div>

            <button
              onClick={() => {
                setShowBatchAiModal(true)
                if (batchGeneratedRemarks.length === 0) {
                  handleBatchGenerateAi()
                }
              }}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 font-black text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer self-start md:self-center shrink-0"
            >
              <Bot size={16} className="text-rose-600" />
              Launch Whole-Class AI Generator
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 1/3: Form Generator */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bot size={20} className="text-amber-500" />
              <div>
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">OSe AI Report Commenter</h3>
                <p className="text-[11px] text-slate-400 font-medium">Auto-generate contextual teacher & principal remarks.</p>
              </div>
            </div>

            <form onSubmit={handleGenerateAiRemarks} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Student from Class</label>
                <select
                  value={selectedAiStudentId || ''}
                  onChange={e => handleAiStudentSelect(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} ({s.average}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={aiStudentName}
                  onChange={e => setAiStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Term Average (%)</label>
                  <input
                    type="number"
                    value={aiAverage}
                    onChange={e => setAiAverage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Attendance Rate</label>
                  <input
                    type="text"
                    value={aiAttendance}
                    onChange={e => setAiAttendance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Academic Focus & Strengths</label>
                <input
                  type="text"
                  value={aiStrengths}
                  onChange={e => setAiStrengths(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingAi}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isGeneratingAi ? (
                  <Loader2 size={14} className="animate-spin text-amber-400" />
                ) : (
                  <Sparkles size={14} className="text-amber-400" />
                )}
                Generate AI Remarks
              </button>
            </form>
          </div>

          {/* Right 2/3: Generated Remarks */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Sparkles size={14} className="text-amber-500" /> Generated Report Card Remarks for {aiStudentName || 'Student'}
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-rose-600" /> Form Teacher Holistic Remarks
                </h4>
                <textarea
                  rows={3}
                  value={teacherComment}
                  onChange={e => setTeacherComment(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Award size={14} className="text-indigo-600" /> School Principal / Head of School Sign-off Remarks
                </h4>
                <textarea
                  rows={2}
                  value={principalComment}
                  onChange={e => setPrincipalComment(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-400 font-medium">
                  Saving will update the official student record stored in the database.
                </p>
                <button
                  onClick={handleSaveCommentary}
                  disabled={isSavingComment}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {isSavingComment ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Attach Remarks to Student Report Card
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PSYCHOMOTOR ASSESSMENT */}
      {activeTab === 'psychomotor' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Activity className="text-rose-600" size={20} /> Psychomotor Development Matrix (1 - 5 Scale)
              </h3>
              <p className="text-xs text-slate-500 font-medium">Evaluate handwriting mastery, sports coordination, crafts, and fine motor skills.</p>
            </div>

            <button
              onClick={handleSaveAllBehavioralRatings}
              disabled={isSavingBehavioral || students.length === 0}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {isSavingBehavioral ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save All Classroom Ratings
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Writing Mastery</TableHead>
                <TableHead>Drawing & Crafts</TableHead>
                <TableHead>Physical Balance</TableHead>
                <TableHead>Motor Progression</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((st) => (
                <TableRow key={st.id}>
                  <TableCell className="font-bold text-slate-900">
                    <div>{st.studentName}</div>
                    <span className="text-[10px] font-mono text-slate-400">{st.admissionNo}</span>
                  </TableCell>
                  {[
                    { key: 'writingMastery', label: 'Writing' },
                    { key: 'drawingCapability', label: 'Drawing' },
                    { key: 'physicalCoordination', label: 'Physical' },
                    { key: 'motorSkillProgression', label: 'Motor' }
                  ].map(trait => (
                    <TableCell key={trait.key}>
                      <select
                        value={psychomotorScores[st.id]?.[trait.key] || 'AC'}
                        onChange={e => {
                          const val = e.target.value
                          setPsychomotorScores(prev => ({
                            ...prev,
                            [st.id]: {
                              ...(prev[st.id] || {}),
                              [trait.key]: val
                            }
                          }))
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-slate-50 text-slate-800"
                      >
                        <option value="MS">MS - Mastered (5)</option>
                        <option value="AC">AC - Achieved (4)</option>
                        <option value="DV">DV - Developing (3)</option>
                        <option value="EM">EM - Emerging (2)</option>
                      </select>
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleSaveBehavioralRatings(st.id)}
                      disabled={isSavingBehavioral}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition border border-rose-200"
                    >
                      Save
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 4: AFFECTIVE ASSESSMENT */}
      {activeTab === 'affective' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Heart className="text-rose-600" size={20} /> Affective Traits & Character Rating (1 - 5 Scale)
              </h3>
              <p className="text-xs text-slate-500 font-medium">Evaluate punctuality, neatness, politeness, leadership, and social courtesy.</p>
            </div>

            <button
              onClick={handleSaveAllBehavioralRatings}
              disabled={isSavingBehavioral || students.length === 0}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {isSavingBehavioral ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save All Classroom Ratings
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>General Punctuality</TableHead>
                <TableHead>Peer Respect</TableHead>
                <TableHead>Aesthetic Neatness</TableHead>
                <TableHead>Group Participation</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((st) => (
                <TableRow key={st.id}>
                  <TableCell className="font-bold text-slate-900">
                    <div>{st.studentName}</div>
                    <span className="text-[10px] font-mono text-slate-400">{st.admissionNo}</span>
                  </TableCell>
                  {[
                    { key: 'generalPunctuality', label: 'Punctuality' },
                    { key: 'peerRespect', label: 'Peer Respect' },
                    { key: 'aestheticNeatness', label: 'Neatness' },
                    { key: 'activeGroupParticipation', label: 'Participation' }
                  ].map(trait => (
                    <TableCell key={trait.key}>
                      <select
                        value={affectiveScores[st.id]?.[trait.key] || 'AC'}
                        onChange={e => {
                          const val = e.target.value
                          setAffectiveScores(prev => ({
                            ...prev,
                            [st.id]: {
                              ...(prev[st.id] || {}),
                              [trait.key]: val
                            }
                          }))
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-slate-50 text-slate-800"
                      >
                        <option value="MS">MS - Mastered (5)</option>
                        <option value="AC">AC - Achieved (4)</option>
                        <option value="DV">DV - Developing (3)</option>
                        <option value="EM">EM - Emerging (2)</option>
                      </select>
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleSaveBehavioralRatings(st.id)}
                      disabled={isSavingBehavioral}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition border border-rose-200"
                    >
                      Save
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 5: REPORT HISTORY & ARCHIVES */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <History className="text-rose-600" size={20} /> Official Report Cards Archives & Batch Downloads
              </h3>
              <p className="text-xs text-slate-500 font-medium">Access active and historical session report card packages ready for instant bulk re-printing.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Stream</TableHead>
                <TableHead>Curriculum / Mode</TableHead>
                <TableHead>Enrolled Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">1-Click Batch Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map(c => {
                const sec = c.sections[0]
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold text-slate-900">
                      {c.name} {sec ? `(${sec.name})` : ''}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {c.isEcd ? 'Montessori & Early Years ECD' : 'Standard 100-Point Primary / Secondary'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {c.totalEnrolled} Students
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ACTIVE SESSION
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {sec ? (
                        <button
                          onClick={async () => {
                            try {
                              toast.info(`Preparing Batch PDF for ${c.name}…`)
                              const url = endpoints.admin.reportCards.exportBatchPdf(c.id, sec.id)
                              await apiSlice.download(url, `Batch_${c.name.replace(/\s+/g, '_')}_${sec.name}.pdf`)
                              toast.success(`Batch report cards downloaded for ${c.name}!`)
                            } catch (e: any) {
                              toast.error(e.message || 'Batch export failed.')
                            }
                          }}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 ml-auto"
                        >
                          <Download size={13} /> Batch PDF Archive
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">No stream</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* BATCH CLASSROOM AI COMMENTARY MODAL */}
      {showBatchAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Sparkles size={18} className="text-amber-400" />
                Whole-Classroom AI Report Commentary Assistant
              </div>
              <button
                onClick={() => setShowBatchAiModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 font-sans">
              {/* Controls */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pedagogical Tone</label>
                  <select
                    value={batchTone}
                    onChange={(e) => setBatchTone(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="constructive">Constructive & Encouraging (Balanced)</option>
                    <option value="rigorous">Academic Rigorous & Analytical</option>
                    <option value="growth-oriented">Growth-Oriented & Actionable</option>
                    <option value="encouraging">Inspiring & Praise-Focused</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Behavioral Attributes</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Courteous', 'Attentive', 'Diligent', 'Punctual', 'Leadership', 'Inquisitive', 'Team Player'].map(tag => {
                      const selected = batchBehavioralTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setBatchBehavioralTags(prev =>
                              selected ? prev.filter(t => t !== tag) : [...prev, tag]
                            )
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            selected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Generated Class Remarks ({batchGeneratedRemarks.length} Students)
                </h4>
                <button
                  onClick={handleBatchGenerateAi}
                  disabled={isBatchGenerating}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isBatchGenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Regenerate Class Remarks
                </button>
              </div>

              {isBatchGenerating ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="animate-spin text-rose-600" size={32} />
                  <p className="text-xs font-semibold">Analyzing marks & generating qualitative remarks...</p>
                </div>
              ) : batchGeneratedRemarks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Click Regenerate to draft comments for this classroom.
                </div>
              ) : (
                <div className="space-y-4">
                  {batchGeneratedRemarks.map((item, idx) => (
                    <div key={item.studentId} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">{item.studentName}</span>
                          {item.registerNo && (
                            <span className="text-[10px] text-slate-400 font-mono">({item.registerNo})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md">
                            Avg: {item.averageScore}%
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-md">
                            Att: {item.attendanceRate}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Form Teacher Narrative</label>
                        <textarea
                          rows={2}
                          value={item.generatedRemark}
                          onChange={(e) => {
                            const val = e.target.value
                            setBatchGeneratedRemarks(prev =>
                              prev.map((r, i) => i === idx ? { ...r, generatedRemark: val } : r)
                            )
                          }}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Principal / Academic Director Endorsement</label>
                        <input
                          type="text"
                          value={item.principalRemark || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setBatchGeneratedRemarks(prev =>
                              prev.map((r, i) => i === idx ? { ...r, principalRemark: val } : r)
                            )
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {batchGeneratedRemarks.length} student records ready for batch authorization.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBatchAiModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchSaveAllRemarks}
                  disabled={isBatchSaving || batchGeneratedRemarks.length === 0}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black rounded-2xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  {isBatchSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Approve & Sync All to Official Report Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
