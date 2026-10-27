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
  Calendar,
  EyeOff,
  Globe
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

interface SessionItem {
  id: number
  name: string
}

interface ClassSectionItem {
  id: number
  name: string
  studentCount: number
}

interface ClassItem {
  id: number
  name: string
  isEcd: boolean
  usesScores?: boolean
  isCommentBased?: boolean
  isPublished?: boolean
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

export interface SubjectCommentItem {
  id: number
  subjectId: number
  subjectName: string
  subjectCode: string
  comment: string
  rating: number
  ratingLabel?: string
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
  usesScores?: boolean
  isCommentBased?: boolean
  totalMarks?: number | null
  average?: number | null
  grade?: string | null
  position?: string | null
  rank?: number | null
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
  subjectComments?: SubjectCommentItem[]
}

export function ReportCardManagement({ allowedClassIds }: { allowedClassIds?: number[] } = {}) {
  const [activeTab, setActiveTab] = useState<ReportCardTab>('generate')
  
  // Session selection state
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)

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

  // Assessment Stage Filter & Term Selection
  const [assessmentStage, setAssessmentStage] = useState<'FULL' | 'COMBINED_CA' | 'CA1' | 'CA2' | 'EXAM'>('FULL')
  const [selectedTermId, setSelectedTermId] = useState<number>(1)

  // Report Card Granular Publication State
  const [isPublished, setIsPublished] = useState<boolean>(false)
  const [pubDetails, setPubDetails] = useState<{
    isPublished: boolean
    releaseCa1: boolean
    releaseCa2: boolean
    releaseCombinedCa?: boolean
    releaseExam: boolean
    releaseFull: boolean
    termId: number
  }>({
    isPublished: false,
    releaseCa1: false,
    releaseCa2: false,
    releaseCombinedCa: false,
    releaseExam: false,
    releaseFull: false,
    termId: 1,
  })
  const [isTogglingPublish, setIsTogglingPublish] = useState<boolean>(false)
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState<boolean>(false)
  const [publishScope, setPublishScope] = useState<'class' | 'all'>('class')
  const [modalReleaseCa1, setModalReleaseCa1] = useState<boolean>(false)
  const [modalReleaseCa2, setModalReleaseCa2] = useState<boolean>(false)
  const [modalReleaseCombinedCa, setModalReleaseCombinedCa] = useState<boolean>(false)
  const [modalReleaseExam, setModalReleaseExam] = useState<boolean>(false)
  const [modalReleaseFull, setModalReleaseFull] = useState<boolean>(false)

  const openPublishModal = () => {
    setPublishScope('class')
    setModalReleaseCa1(Boolean(pubDetails.releaseCa1))
    setModalReleaseCa2(Boolean(pubDetails.releaseCa2))
    setModalReleaseCombinedCa(Boolean(pubDetails.releaseCombinedCa))
    setModalReleaseExam(Boolean(pubDetails.releaseExam))
    setModalReleaseFull(Boolean(pubDetails.releaseFull))
    setShowPublishConfirmModal(true)
  }

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

  const fetchClasses = async (sessionId?: number) => {
    setLoadingClasses(true)
    try {
      const res = await apiSlice.get<{
        success: boolean
        sessionId?: number
        sessions?: SessionItem[]
        classes: ClassItem[]
      }>(endpoints.admin.reportCards.classes(sessionId))

      if (res.success && res.classes) {
        if (res.sessions && res.sessions.length > 0) {
          setSessions(res.sessions)
        }
        if (res.sessionId && (!selectedSessionId || sessionId)) {
          setSelectedSessionId(res.sessionId)
        }
        const availableClasses = allowedClassIds && allowedClassIds.length > 0
          ? res.classes.filter(c => allowedClassIds.includes(c.id))
          : res.classes;
        setClasses(availableClasses)
        fetchPublishStatus(sessionId || res.sessionId)

        // Read active context from localStorage if available
        let targetClassId: number | null = null
        let targetSectionId: number | null = null

        try {
          const storedJson = typeof window !== 'undefined' ? localStorage.getItem('ugbekun_teacher_active_context') : null
          if (storedJson) {
            const ctx = JSON.parse(storedJson)
            if (ctx.classId && availableClasses.some((c) => c.id === ctx.classId)) {
              targetClassId = ctx.classId
              const matchedCls = availableClasses.find((c) => c.id === ctx.classId)
              if (matchedCls && ctx.sectionId && matchedCls.sections.some((s) => s.id === ctx.sectionId)) {
                targetSectionId = ctx.sectionId
              }
            }
          }
        } catch {
          // ignore
        }

        if (availableClasses.length > 0) {
          const foundCls = targetClassId
            ? availableClasses.find(c => c.id === targetClassId)
            : (selectedClassId ? availableClasses.find(c => c.id === selectedClassId) : null)
          const activeCls = foundCls || availableClasses[0]
          setSelectedClassId(activeCls.id)
          if (activeCls.sections.length > 0) {
            const foundSec = targetSectionId
              ? activeCls.sections.find(s => s.id === targetSectionId)
              : (selectedSectionId ? activeCls.sections.find(s => s.id === selectedSectionId) : null)
            setSelectedSectionId(foundSec ? foundSec.id : activeCls.sections[0].id)
          } else {
            setSelectedSectionId(null)
          }
        } else {
          setSelectedClassId(null)
          setSelectedSectionId(null)
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load classrooms.')
    } finally {
      setLoadingClasses(false)
    }
  }

  // Listen to Top Bar Context Switcher
  useEffect(() => {
    const handleContextSwitch = (e: any) => {
      const ctx = e.detail
      if (!ctx || !ctx.classId) return
      setSelectedClassId(ctx.classId)
      if (ctx.sectionId) {
        setSelectedSectionId(ctx.sectionId)
      }
    }
    window.addEventListener('ugbekun-context-changed', handleContextSwitch)
    return () => window.removeEventListener('ugbekun-context-changed', handleContextSwitch)
  }, [])

  // Fetch Students when selected class/section/session/stage/term changes
  useEffect(() => {
    if (selectedClassId && selectedSectionId) {
      fetchStudents(selectedClassId, selectedSectionId, selectedSessionId || undefined, assessmentStage, selectedTermId)
      fetchPublishStatus(selectedSessionId || undefined, selectedClassId, selectedTermId)
    } else {
      setStudents([])
    }
  }, [selectedClassId, selectedSectionId, selectedSessionId, assessmentStage, selectedTermId])

  const fetchPublishStatus = async (sessionId?: number, classId?: number, termId: number = selectedTermId) => {
    try {
      const res = await apiSlice.get<{
        success: boolean
        isPublished: boolean
        releaseCa1?: boolean
        releaseCa2?: boolean
        releaseCombinedCa?: boolean
        releaseExam?: boolean
        releaseFull?: boolean
        termId?: number
      }>(endpoints.admin.reportCards.publishStatus(sessionId, classId || selectedClassId || undefined, termId))
      if (res.success) {
        setIsPublished(Boolean(res.isPublished))
        setPubDetails({
          isPublished: Boolean(res.isPublished),
          releaseCa1: Boolean(res.releaseCa1),
          releaseCa2: Boolean(res.releaseCa2),
          releaseCombinedCa: Boolean(res.releaseCombinedCa),
          releaseExam: Boolean(res.releaseExam),
          releaseFull: Boolean(res.releaseFull),
          termId: res.termId || termId,
        })
      }
    } catch {
      // ignore
    }
  }

  const handleTogglePublish = async (params: {
    publish?: boolean
    releaseCa1?: boolean
    releaseCa2?: boolean
    releaseCombinedCa?: boolean
    releaseExam?: boolean
    releaseFull?: boolean
    scopeOverride?: 'class' | 'all'
  }) => {
    const activeScope = params.scopeOverride || publishScope
    setIsTogglingPublish(true)
    try {
      const res = await apiSlice.post<{
        success: boolean
        isPublished: boolean
        releaseCa1: boolean
        releaseCa2: boolean
        releaseCombinedCa?: boolean
        releaseExam: boolean
        releaseFull: boolean
        termId: number
        message: string
      }>(
        endpoints.admin.reportCards.togglePublish,
        {
          classId: activeScope === 'class' ? selectedClassId || undefined : undefined,
          sectionId: activeScope === 'class' ? selectedSectionId || undefined : undefined,
          sessionId: selectedSessionId || undefined,
          termId: selectedTermId,
          publish: params.publish,
          publishAllClasses: activeScope === 'all',
          releaseCa1: params.releaseCa1,
          releaseCa2: params.releaseCa2,
          releaseCombinedCa: params.releaseCombinedCa,
          releaseExam: params.releaseExam,
          releaseFull: params.releaseFull,
        }
      )
      if (res.success) {
        setIsPublished(res.isPublished)
        setPubDetails({
          isPublished: res.isPublished,
          releaseCa1: res.releaseCa1,
          releaseCa2: res.releaseCa2,
          releaseCombinedCa: res.releaseCombinedCa,
          releaseExam: res.releaseExam,
          releaseFull: res.releaseFull,
          termId: res.termId,
        })
        if (selectedSessionId) {
          fetchClasses(selectedSessionId)
        } else {
          fetchClasses()
        }
        toast.success(res.message || 'Report card publication state updated successfully!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update publication status.')
    } finally {
      setIsTogglingPublish(false)
      setShowPublishConfirmModal(false)
    }
  }

  const fetchStudents = async (
    classId: number,
    sectionId: number,
    sessionId?: number,
    stage: string = assessmentStage,
    termId: number = selectedTermId
  ) => {
    setLoadingStudents(true)
    try {
      const res = await apiSlice.get<{
        success: boolean
        sessionId?: number
        className: string
        stage?: string
        termId?: number
        isEcd: boolean
        isPublished?: boolean
        publication?: any
        totalStudents: number
        students: StudentReportPreview[]
      }>(endpoints.admin.reportCards.students(classId, sectionId, sessionId, stage, termId))

      if (res.success && res.students) {
        if (res.sessionId && !selectedSessionId) {
          setSelectedSessionId(res.sessionId)
        }
        setStudents(res.students)
        if (res.isPublished !== undefined) {
          setIsPublished(res.isPublished)
        }
        if (res.publication) {
          setPubDetails(res.publication)
          setIsPublished(res.publication.isPublished)
        }
        
        // Populate initial AI selection
        if (res.students.length > 0) {
          const s0 = res.students[0]
          setSelectedAiStudentId(s0.id)
          setAiStudentName(s0.studentName)
          setAiAverage(s0.average !== null && s0.average !== undefined ? String(s0.average) : 'Qualitative')
          setAiAttendance(s0.totalAttendanceDays > 0 ? `${Math.round((s0.presentCount / s0.totalAttendanceDays) * 100)}%` : '95%')
          setTeacherComment(s0.teacherComment || `${s0.studentName} has displayed commendable academic dedication and consistent progress this term.`)
          setPrincipalComment(s0.principalComment || ((s0.average ?? 0) >= 70 ? 'Promoted with distinction.' : 'Promoted.'))
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
      setAiAverage(st.average !== null && st.average !== undefined ? String(st.average) : 'Qualitative')
      setAiAttendance(st.totalAttendanceDays > 0 ? `${Math.round((st.presentCount / st.totalAttendanceDays) * 100)}%` : '95%')
      setTeacherComment(st.teacherComment || `${st.studentName} has displayed commendable academic dedication and consistent progress this term.`)
      setPrincipalComment(st.principalComment || ((st.average ?? 0) >= 70 ? 'Promoted with distinction.' : 'Promoted.'))
    }
  }

  // 1-Click Single PDF Report Card Download
  const handleDownloadSinglePdf = async (st: StudentReportPreview) => {
    if (!selectedClassId || !selectedSectionId) return
    setDownloadingStudentId(st.id)
    const stageLabel = assessmentStage === 'FULL' ? 'Terminal Report' : assessmentStage
    toast.info(`Compiling official ${stageLabel} card for ${st.studentName}…`)

    try {
      const url = endpoints.admin.reportCards.exportPdf(
        st.id,
        selectedClassId,
        selectedSectionId,
        rankingType,
        rankingLimit,
        selectedSessionId || undefined,
        assessmentStage,
        selectedTermId
      )
      const safeName = (st.lastName || 'Student').replace(/\s+/g, '_')
      const safeFirst = (st.firstName || 'Record').replace(/\s+/g, '_')
      await apiSlice.download(url, `Report_Card_${safeName}_${safeFirst}_${assessmentStage}.pdf`)
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
    const stageLabel = assessmentStage === 'FULL' ? 'Full Terminal' : assessmentStage

    toast.info(`Compiling Batch PDF for ${className} (${sectionName}) [${stageLabel}] with ${students.length} students…`)

    try {
      const url = endpoints.admin.reportCards.exportBatchPdf(
        selectedClassId,
        selectedSectionId,
        rankingType,
        rankingLimit,
        selectedSessionId || undefined,
        assessmentStage,
        selectedTermId
      )
      const safeCls = className.replace(/\s+/g, '_')
      const safeSec = sectionName.replace(/\s+/g, '_')
      await apiSlice.download(url, `Batch_Report_Cards_${safeCls}_${safeSec}_${assessmentStage}.pdf`)
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
          sessionId: selectedSessionId || undefined,
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
        sessionId: selectedSessionId || undefined,
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
          sessionId: selectedSessionId || undefined,
          commentaries: payload,
          status: 'APPROVED_BY_PRINCIPAL'
        }
      )

      if (res.success) {
        toast.success(res.message || `Saved & authorized ${res.savedCount} report card remarks!`)
        setShowBatchAiModal(false)
        fetchStudents(selectedClassId, selectedSectionId, selectedSessionId || undefined)
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
          sessionId: selectedSessionId || undefined,
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
          sessionId: selectedSessionId || undefined,
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

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Publish Status Badge */}
            <div className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
              pubDetails.releaseFull
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : pubDetails.releaseExam
                ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                : (pubDetails.releaseCa1 || pubDetails.releaseCa2)
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {pubDetails.releaseFull ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Globe size={14} className="text-emerald-600" />
                  <span>{currentClass?.name || 'Class'}: Full Report Live</span>
                </>
              ) : pubDetails.releaseExam ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <Globe size={14} className="text-indigo-600" />
                  <span>{currentClass?.name || 'Class'}: Exam Only Live</span>
                </>
              ) : (pubDetails.releaseCa1 || pubDetails.releaseCa2) ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <Globe size={14} className="text-amber-600" />
                  <span>
                    {currentClass?.name || 'Class'}: Mid-Term CA (
                    {[pubDetails.releaseCa1 && 'CA1', pubDetails.releaseCa2 && 'CA2'].filter(Boolean).join(' + ')}
                    ) Live
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <EyeOff size={14} className="text-slate-500" />
                  <span>{currentClass?.name || 'Class'}: Hidden (Draft)</span>
                </>
              )}
            </div>

            {/* Toggle Publish Button */}
            <button
              onClick={openPublishModal}
              disabled={isTogglingPublish || !selectedClassId}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50 ${
                isPublished
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              }`}
            >
              {isTogglingPublish ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              <span>Granular Release Engine</span>
            </button>

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
          {/* Academic Session */}
          {sessions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Calendar size={13} className="text-rose-600" /> Session:
              </span>
              <select
                value={selectedSessionId || ''}
                onChange={e => {
                  const sid = Number(e.target.value)
                  setSelectedSessionId(sid)
                  fetchClasses(sid)
                }}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-bold bg-rose-50/50 text-slate-800 focus:outline-rose-500"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                  {c.isPublished ? '🟢 [Published]' : '⚪ [Draft]'} {c.name} {c.isEcd ? '(Early Years)' : ''} ({c.totalEnrolled} Students)
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

          {/* Term Selector */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <span className="text-xs font-bold text-slate-500">Term:</span>
            <select
              value={selectedTermId}
              onChange={e => setSelectedTermId(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
            >
              <option value={1}>1st Term</option>
              <option value={2}>2nd Term</option>
              <option value={3}>3rd Term</option>
            </select>
          </div>

          {/* Assessment Stage Filter */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <span className="text-xs font-bold text-slate-500">Stage:</span>
            <select
              value={assessmentStage}
              onChange={e => setAssessmentStage(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-xs font-bold bg-rose-50/60 text-rose-900"
            >
              <option value="FULL">Full Terminal Report (Out of 100)</option>
              <option value="COMBINED_CA">Combined CA Only (CA1 + CA2 — Out of 40)</option>
              <option value="CA1">CA1 Progress Slip (Out of 20)</option>
              <option value="CA2">CA2 Progress Slip (Out of 20)</option>
              <option value="EXAM">Terminal Exam Only</option>
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
                fetchStudents(selectedClassId, selectedSectionId, selectedSessionId || undefined)
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {currentClass?.usesScores === false ? 'Assessment Standard' : 'Class Average'}
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-base sm:text-xl font-black text-slate-900">
                      {currentClass?.usesScores === false
                        ? 'Qualitative Domains'
                        : `${students.length > 0 ? (students.reduce((acc, s) => acc + (s.average || 0), 0) / students.length).toFixed(1) : 0}%`}
                    </span>
                    {currentClass?.usesScores === false ? (
                      <Sparkles size={18} className="text-emerald-500" />
                    ) : (
                      <Award size={18} className="text-emerald-500" />
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evaluation Mode</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-black text-slate-900 uppercase">
                      {currentClass?.usesScores === false
                        ? 'Zero-Score Montessori'
                        : currentClass?.isEcd
                        ? 'Montessori ECD'
                        : 'Standard 100-Point'}
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
                {filteredStudents.map((st) => {
                  const isCommentBased = currentClass?.usesScores === false || st.usesScores === false || st.isCommentBased === true

                  return (
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
                        {isCommentBased ? (
                          <span className="px-2.5 py-0.5 rounded text-xs font-black border bg-emerald-100 text-emerald-800 border-emerald-200">
                            Qualitative Report
                          </span>
                        ) : assessmentStage === 'FULL' ? (
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
                        ) : (
                          <span className="px-2.5 py-0.5 rounded text-xs font-black border bg-amber-100 text-amber-800 border-amber-200">
                            {assessmentStage} Slip
                          </span>
                        )}
                      </div>

                      {isCommentBased ? (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                            <span className="text-[10px] text-emerald-700 block font-bold">
                              ASSESSMENT SYSTEM
                            </span>
                            <span className="font-bold text-emerald-950 text-xs">
                              Developmental Domains
                            </span>
                          </div>
                          <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/80">
                            <span className="text-[10px] text-blue-700 block font-bold">
                              EVALUATED DOMAINS
                            </span>
                            <span className="font-bold text-blue-950 text-xs">
                              {st.subjectComments && st.subjectComments.length > 0
                                ? `${st.subjectComments.length} Domains Recorded`
                                : 'Milestones Active'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-bold">
                              {assessmentStage === 'COMBINED_CA' ? 'COMBINED CA (/40)' : (assessmentStage === 'FULL' ? 'AVERAGE SCORE' : `${assessmentStage} STAGE AVG`)}
                            </span>
                            <span className="font-mono font-black text-slate-900 text-sm">
                              {assessmentStage === 'COMBINED_CA' ? `${st.totalMarks !== null && st.totalMarks !== undefined ? st.totalMarks : '-'} / 40` : `${st.average}%`}
                            </span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-bold">
                              {assessmentStage === 'FULL' ? 'CLASS RANK' : 'STAGE STATUS'}
                            </span>
                            <span className="font-bold text-indigo-700 text-sm">
                              {assessmentStage === 'FULL' ? st.position : (assessmentStage === 'COMBINED_CA' ? 'CA Progress Graded' : 'Progress Recorded')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Observed Domains Snippet (For Comment-Based Classes) */}
                      {isCommentBased && st.subjectComments && st.subjectComments.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-100">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Observed Domains & Competencies:
                          </span>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {st.subjectComments.map((sc) => (
                              <span
                                key={sc.id || sc.subjectId}
                                className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1"
                              >
                                <span>{sc.subjectName}:</span>
                                <span className="font-black text-emerald-950">{sc.ratingLabel || `Level ${sc.rating}`}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

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
                          {isCommentBased ? '1-Click Developmental PDF' : assessmentStage === 'FULL' ? '1-Click PDF Report' : `1-Click ${assessmentStage} Slip`}
                        </button>
                      </div>
                    </div>
                  )
                })}
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
                      {s.studentName} {s.average !== null && s.average !== undefined ? `(${s.average}%)` : '(Qualitative)'}
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
                  <UserCheck size={14} className="text-rose-600" /> Class Teacher Holistic Remarks
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
                        {sessions.find(s => s.id === selectedSessionId)?.name || 'ACTIVE SESSION'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {sec ? (
                        <button
                          onClick={async () => {
                            try {
                              toast.info(`Preparing Batch PDF for ${c.name}…`)
                              const url = endpoints.admin.reportCards.exportBatchPdf(c.id, sec.id, 'full', 3, selectedSessionId || undefined)
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

      {/* Report Card Granular Publication Engine Modal */}
      {showPublishConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-5 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Granular Parent Release Engine
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Multi-stage progressive disclosure for student & parent portals
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishConfirmModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Scope Selection: Targeted Class vs All Classes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Choose Publication Scope:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPublishScope('class')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    publishScope === 'class'
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      {currentClass?.name || 'Selected Class'} Only
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Targeted
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Releases solely this class without altering other classes still in grading.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishScope('all')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    publishScope === 'all'
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      All Classes ({classes.length})
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Cohort Batch
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Apply publication state across the entire school session in one click.
                  </span>
                </button>
              </div>
            </div>

            {/* Term Selection */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700">Academic Term:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedTermId(t)
                      fetchPublishStatus(selectedSessionId || undefined, selectedClassId || undefined, t)
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      selectedTermId === t
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {t === 1 ? '1st Term' : t === 2 ? '2nd Term' : '3rd Term'}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Granular Stage Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Granular Stage Release Toggles:
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {/* Stage 1: CA1 */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  modalReleaseCa1 ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50/50 border-slate-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Stage 1: CA 1 Progress Slip</span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800">
                        Mid-Term
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Releases Continuous Assessment 1 scores & teacher progress notes to parent portal.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={modalReleaseCa1}
                    onChange={e => setModalReleaseCa1(e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded-md border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                {/* Stage 2: CA2 */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  modalReleaseCa2 ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50/50 border-slate-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Stage 2: CA 2 Progress Slip</span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800">
                        Mid-Term
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Releases Continuous Assessment 2 marks & progress slips to students/parents.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={modalReleaseCa2}
                    onChange={e => setModalReleaseCa2(e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded-md border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                {/* Stage: Combined CA */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  modalReleaseCombinedCa ? 'bg-purple-50/60 border-purple-300' : 'bg-slate-50/50 border-slate-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Combined CA (CA1 + CA2) Progress Report</span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-100 text-purple-800">
                        Mid-Term Out of 40
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Releases Combined Continuous Assessment (CA1 + CA2 out of 40). Exam columns and class ranking are strictly hidden.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={modalReleaseCombinedCa}
                    onChange={e => setModalReleaseCombinedCa(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded-md border-slate-300 focus:ring-purple-500 cursor-pointer"
                  />
                </label>

                {/* Stage 3: Exam */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  modalReleaseExam ? 'bg-indigo-50/60 border-indigo-300' : 'bg-slate-50/50 border-slate-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Stage 3: Terminal Exam Marks</span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                        Exam Paper
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Releases terminal examination scores for individual subjects.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={modalReleaseExam}
                    onChange={e => setModalReleaseExam(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>

                {/* Stage 4: Full */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  modalReleaseFull ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50/50 border-slate-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Stage 4: Full Terminal Composite Report</span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        Complete
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Releases cumulative composite grade (100%), GPA, class positions, and final PDF downloads.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={modalReleaseFull}
                    onChange={e => setModalReleaseFull(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Zero Data Leakage Info */}
            <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-blue-800 text-[11px]">
                🛡️ Zero Data Leakage Invariant Enforced
              </span>
              <p className="text-[11px] text-blue-800/90 leading-relaxed">
                When Exam or Full Report is unchecked, backend APIs strictly nullify examination marks, composite totals, GPA grades, and class rank from both parent JSON payloads and PDF downloads, guaranteeing zero exposure before official publication.
              </p>
            </div>

            {/* Quick Actions & Confirm Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalReleaseCa1(false)
                      setModalReleaseCa2(false)
                      setModalReleaseCombinedCa(false)
                      setModalReleaseExam(false)
                      setModalReleaseFull(false)
                      handleTogglePublish({
                        publish: false,
                        releaseCa1: false,
                        releaseCa2: false,
                        releaseCombinedCa: false,
                        releaseExam: false,
                        releaseFull: false,
                      })
                    }}
                    disabled={isTogglingPublish}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                  >
                    Unpublish / Shield All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalReleaseCa1(true)
                      setModalReleaseCa2(true)
                      setModalReleaseCombinedCa(true)
                      setModalReleaseExam(true)
                      setModalReleaseFull(true)
                      handleTogglePublish({
                        publish: true,
                        releaseCa1: true,
                        releaseCa2: true,
                        releaseCombinedCa: true,
                        releaseExam: true,
                        releaseFull: true,
                      })
                    }}
                    disabled={isTogglingPublish}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    Release Full Terminal
                  </button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowPublishConfirmModal(false)}
                    disabled={isTogglingPublish}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleTogglePublish({
                        releaseCa1: modalReleaseCa1,
                        releaseCa2: modalReleaseCa2,
                        releaseCombinedCa: modalReleaseCombinedCa,
                        releaseExam: modalReleaseExam,
                        releaseFull: modalReleaseFull,
                      })
                    }
                    disabled={isTogglingPublish}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm flex items-center gap-2 transition cursor-pointer"
                  >
                    {isTogglingPublish && <Loader2 size={14} className="animate-spin" />}
                    <span>Save Granular Configuration</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Class Teacher Narrative</label>
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
