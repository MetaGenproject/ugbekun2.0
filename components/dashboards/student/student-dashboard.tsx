'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  BookOpen, 
  CheckSquare, 
  TrendingUp, 
  Calendar, 
  Activity,
  Download,
  AlertCircle,
  FileText,
  User,
  GraduationCap,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Mic,
  Square,
  Upload,
  Trophy,
  ShieldCheck,
  Smile,
  DollarSign,
  Bus,
  Bot,
  MessageSquare,
  Bell,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Star,
  Award,
  Sparkles,
  CheckCircle2,
  MapPin,
  Send,
  HelpCircle,
  ExternalLink,
  Volume2,
  Plus,
  X,
  Copy,
  Lock,
  ListTodo,
  CreditCard,
  Building,
  Check,
  Trash2,
  Filter,
  Layers,
  Eye,
  RefreshCw,
  BarChart3,
  CheckCheck,
  FolderDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ChevronLeft,
  Flag,
  Zap,
  ShieldAlert,
  Printer,
  School,
  Coffee,
  Sun,
  LayoutGrid,
  List,
} from 'lucide-react'
import { SchoolHeader } from '../school-header'
import { useSchoolBranding } from '@/lib/schoolBrandingContext'
import { safeStorage } from '@/lib/safeStorage'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { showSystemStatus, resolveHttpStatus } from '@/lib/systemStatus'
import { StudentMediaLibrary } from './student-media-library'
import { StudentLiveClassrooms } from './student-live-classrooms'
import PointsHub from './points-hub'
import SchoolCalendar from '../admin/school-calendar'
import { getAvatarUrl } from '@/lib/avatar'

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
  }
  activeSection: string
  onNavigate?: (section: string) => void
}

interface StudentProfile {
  studentId: number
  firstName: string
  lastName: string
  registerNo: string
  gender: string
  photo: string | null
  branchName: string | null
  classId: number | null
  className: string | null
  sectionId: number | null
  sectionName: string | null
  sessionId: number
  fellowStudentsCount: number
  formTeacher: {
    id?: number
    name: string
    email: string | null
    phone: string | null
    photo?: string | null
  } | null
  subjects: Array<{
    id: number
    name: string
    code: string
    type: string
  }>
}

interface AttendanceData {
  percentage: number
  totalDays: number
  presentCount: number
  absentCount: number
  lateCount: number
  logs: Array<{
    id: number
    attendanceDate: string
    status: string
    remark: string | null
  }>
}

interface TaskData {
  notes: Array<{
    id: number
    title: string
    description: string
    fileName: string
    encName: string
    teacherName: string
    createdAt: string
  }>
  onlineExams: Array<{
    id: number
    title: string
    subjectName: string
    passingMark: number
    questions?: any[]
    submitted: boolean
    score: number | null
    submittedAt: string | null
    duration?: number
    examDate?: string | null
    createdAt: string
  }>
  homeworks: Array<{
    id: number
    title: string
    description?: string
    subjectName: string
    dueDate: string
    questions?: any[]
    submitted: boolean
    score: number | null
    feedback: string | null
    submittedAt: string | null
    createdAt: string
  }>
}

interface GradeData {
  reportCard: Array<{
    id: number
    examName: string
    subjectName: string
    subjectCode: string
    cbtMark?: string | null
    theoryMark?: string | null
    mark: string | null
    absent: boolean
    classAverage: number
  }>
  overallAverage: number
  commentary: string | null
  rank: number | null
  totalClassStudents: number | null
  isEcd?: boolean
  assessment?: any
}

interface DashboardOverviewData {
  profile: StudentProfile
  kpi: {
    averageScore: number
    classRank: number | null
    totalClassStudents: number
    attendancePercentage: number
    behaviourRating: string
  }
  attendance: AttendanceData
  todayTimetable: Array<{
    id: number
    startTime: string
    endTime: string
    type?: string
    title: string
    teacherName: string | null
    roomLabel: string | null
  }>
  upcomingHomeworks: Array<{
    id: number
    title: string
    subjectName: string
    dueDate: string
    deadlineBadge: string
    diffDays?: number
    submitted: boolean
  }>
  upcomingExams: Array<{
    id: number
    title: string
    subjectName: string
    examDate: string | null
    deadlineBadge: string
    diffDays?: number | null
    submitted: boolean
  }>
  homeworkProgress: {
    completed: number
    pending: number
    overdue: number
    percentage: number
  }
  feeStatus: {
    status: string
    totalBilled: number
    totalPaid: number
    outstanding: number
    nextTermDate: string | null
  }
  subjectPerformance: Array<{
    name: string
    score: number
  }>
  announcements: Array<{
    id: number
    title: string
    description: string
    startDate: string
  }>
  recentActivities: Array<{
    type: string
    text: string
    timestamp: string
  }>
}

interface TeacherContact {
  id: number
  name: string
  email: string | null
  phone: string | null
  photo: string | null
  department: string | null
  role?: string
  subjects?: Array<{ id: number; name: string; code: string }>
}

interface InvoiceItem {
  id: number
  invoiceNo: string
  title: string
  amount: number
  paidAmount: number
  balance: number
  status: string
  dueDate: string
  items: Array<{ id: number; name: string; amount: number }>
  payments: Array<{ id: number; amount: number; paymentMethod: string; paidAt: string }>
}

interface SchoolBankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  branchName: string
  sortCode?: string
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function getGradeLetter(score: number): { letter: string; color: string; bg: string } {
  if (score >= 80) return { letter: 'A (Distinction)', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' }
  if (score >= 70) return { letter: 'B (Very Good)', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' }
  if (score >= 60) return { letter: 'C (Credit)', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' }
  if (score >= 50) return { letter: 'D (Pass)', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
  if (score >= 40) return { letter: 'E (Fair)', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' }
  return { letter: 'F (Needs Improvement)', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }
}

// Donut Chart helper component
function SVGDonutChart({ 
  percentage, 
  centerLabel, 
  color = '#10B981', 
  bgTrack = '#E2E8F0',
  size = 110,
  strokeWidth = 10
}: { 
  percentage: number; 
  centerLabel: string; 
  color?: string; 
  bgTrack?: string; 
  size?: number; 
  strokeWidth?: number; 
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgTrack}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
        <span className="text-lg font-black text-slate-900 leading-none">{percentage}%</span>
        <span className="text-[10px] font-bold text-slate-400 mt-0.5 leading-tight">{centerLabel}</span>
      </div>
    </div>
  )
}

export function StudentDashboard({ user, activeSection, onNavigate }: DashboardProps) {
  const { branding } = useSchoolBranding()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [attendance, setAttendance] = useState<AttendanceData | null>(null)
  const [tasks, setTasks] = useState<TaskData | null>(null)
  const [grades, setGrades] = useState<GradeData | null>(null)
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Teachers directory state
  const [formTeacher, setFormTeacher] = useState<TeacherContact | null>(null)
  const [subjectTeachers, setSubjectTeachers] = useState<TeacherContact[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false)

  // Invoices & School Bank state
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [schoolBank, setSchoolBank] = useState<SchoolBankDetails | null>(null)
  const [totalFeeAmount, setTotalFeeAmount] = useState<number>(0)
  const [totalPaidAmount, setTotalPaidAmount] = useState<number>(0)
  const [totalBalance, setTotalBalance] = useState<number>(0)
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false)
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false)
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(null)

  // Timetable & Exam Slots state
  const [timetableSlots, setTimetableSlots] = useState<any[]>([])
  const [examScheduleSlots, setExamScheduleSlots] = useState<any[]>([])
  const [loadingTimetable, setLoadingTimetable] = useState<boolean>(false)
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>('ALL')
  const [timetableViewMode, setTimetableViewMode] = useState<'grid' | 'cards'>('grid')

  // Reminders / Study Checklist state
  const [remindersList, setRemindersList] = useState<Array<{ id: number; text: string; subtext?: string; done: boolean }>>([])
  const [newReminderText, setNewReminderText] = useState<string>('')
  const [addingReminder, setAddingReminder] = useState<boolean>(false)
  const [reminderFilter, setReminderFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL')

  // Homework submission state
  const [selectedHomework, setSelectedHomework] = useState<any | null>(null)
  const [showSubmitHwModal, setShowSubmitHwModal] = useState<boolean>(false)
  const [submissionContent, setSubmissionContent] = useState<string>('')
  const [submittingHw, setSubmittingHw] = useState<boolean>(false)
  const [hwSuccessMsg, setHwSuccessMsg] = useState<string | null>(null)

  // Messaging state
  const [studentMessages, setStudentMessages] = useState<any[]>([])
  const [showMsgModal, setShowMsgModal] = useState<boolean>(false)
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null)
  const [recipientRole, setRecipientRole] = useState<string>('TEACHER')
  const [recipientName, setRecipientName] = useState<string>('')
  const [msgSubject, setMsgSubject] = useState<string>('')
  const [msgBody, setMsgBody] = useState<string>('')
  const [sendingMsg, setSendingMsg] = useState<boolean>(false)
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null)

  // PDF Export state
  const [exportingPdf, setExportingPdf] = useState<boolean>(false)

  // Report Card Preview state
  const [showReportCardPreview, setShowReportCardPreview] = useState<boolean>(false)
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string | null>(null)
  const [loadingPdfPreview, setLoadingPdfPreview] = useState<boolean>(false)
  const [previewTab, setPreviewTab] = useState<'document' | 'pdf'>('document')

  // Change password state
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  // CBT Examination Runner State
  const [cbtExamsList, setCbtExamsList] = useState<any[]>([])
  const [loadingCbtList, setLoadingCbtList] = useState<boolean>(false)
  const [activeCbtExam, setActiveCbtExam] = useState<{
    id: number
    onlineExamId?: number
    title: string
    duration: number
    passingMark: number
    instructions?: string
    showResults: boolean
    questions: Array<{
      id: number
      questionText: string
      questionType: string
      options: string[]
      marks: number
    }>
  } | null>(null)
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isSubmittingExam, setIsSubmittingExam] = useState<boolean>(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false)
  const [cbtResultModal, setCbtResultModal] = useState<{
    totalScore: number
    totalPossible: number
    percentage: number
    grade: string
    isPassed: boolean
    correctCount: number
    wrongCount: number
    unansweredCount: number
    showResults: boolean
    breakdown: Array<{
      questionId: number
      questionText: string
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      marksAwarded: number
      marksPossible: number
    }>
  } | null>(null)

  // CBT Countdown Timer Effect
  useEffect(() => {
    if (!activeCbtExam || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleSubmitCbtExam(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [activeCbtExam, timeRemaining])

  const fetchCbtExams = async () => {
    setLoadingCbtList(true)
    try {
      const res = await apiSlice.get<{ success: boolean; exams: any[] }>(endpoints.student.cbtActiveExams)
      if (res.success && res.exams) {
        setCbtExamsList(res.exams)
      }
    } catch (e) {
      console.error('Failed to load CBT exams', e)
    } finally {
      setLoadingCbtList(false)
    }
  }

  const handleStartCbtExam = async (examId: number) => {
    try {
      const res = await apiSlice.get<{ success: boolean; exam: any }>(endpoints.student.cbtTakeExam(examId))
      if (res.success && res.exam) {
        setActiveCbtExam(res.exam)
        setActiveQuestionIdx(0)
        setSelectedAnswers({})
        setFlaggedQuestions(new Set())
        setTimeRemaining((res.exam.duration || 30) * 60)
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to start CBT examination.')
    }
  }

  const handleSubmitCbtExam = async (isAutoExpire = false) => {
    if (!activeCbtExam) return
    setIsSubmittingExam(true)
    try {
      const answersPayload = Object.entries(selectedAnswers).map(([qId, ans]) => ({
        questionId: Number(qId),
        answerText: ans,
      }))

      const res = await apiSlice.post<{ success: boolean; result: any; message: string }>(
        endpoints.student.cbtSubmitExam(activeCbtExam.id),
        { answers: answersPayload }
      )

      if (res.success && res.result) {
        setCbtResultModal(res.result)
        setActiveCbtExam(null)
        setShowConfirmSubmit(false)
        fetchCbtExams()
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to submit CBT examination.')
    } finally {
      setIsSubmittingExam(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadDashboardData() {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch Aggregated Dashboard Overview (Real DB averages, Timetable, Fees)
        const overviewRes = await apiSlice.get<{ success: boolean } & DashboardOverviewData>(endpoints.student.dashboardOverview).catch(() => null)
        if (!active) return

        if (overviewRes && overviewRes.success) {
          setDashboardOverview(overviewRes)
        }

        // 2. Fetch Profile
        const profileRes = await apiSlice.get<{ success: boolean } & StudentProfile>(endpoints.student.profile).catch(() => null)
        if (!active) return

        if (profileRes?.success) {
          setProfile(profileRes)
        } else if (overviewRes?.profile) {
          setProfile(overviewRes.profile)
        } else {
          throw new Error('Failed to load student profile.')
        }

        // 3. Fetch Attendance
        const attendanceRes = await apiSlice.get<{ success: boolean } & AttendanceData>(endpoints.student.attendance).catch(() => null)
        if (attendanceRes?.success) setAttendance(attendanceRes)

        // 4. Fetch Tasks
        const tasksRes = await apiSlice.get<{ success: boolean } & TaskData>(endpoints.student.tasks).catch(() => null)
        if (tasksRes?.success) setTasks(tasksRes)

        // 5. Fetch Grades & Full Report Cards
        const gradesRes = await apiSlice.get<{ success: boolean } & GradeData>(endpoints.student.grades).catch(() => null)
        if (gradesRes?.success) setGrades(gradesRes)

        // 6. Fetch Reminders / Study Checklist
        const remindersRes = await apiSlice.get<{ success: boolean; reminders: any[] }>(endpoints.student.reminders).catch(() => null)
        if (remindersRes?.success) setRemindersList(remindersRes.reminders || [])

        // 7. Fetch CBT Exams
        const cbtRes = await apiSlice.get<{ success: boolean; exams: any[] }>(endpoints.student.cbtActiveExams).catch(() => null)
        if (cbtRes?.success && cbtRes.exams) setCbtExamsList(cbtRes.exams)

      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to fetch dashboard data. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      active = false
    }
  }, [user])

  // Sub-view data fetchers
  useEffect(() => {
    if (activeSection === 'academics' || activeSection === 'teachers') {
      async function fetchTeachers() {
        try {
          setLoadingTeachers(true)
          const res = await apiSlice.get<{ success: boolean; formTeacher: TeacherContact | null; subjectTeachers: TeacherContact[] }>(endpoints.student.teachers)
          if (res.success) {
            setFormTeacher(res.formTeacher)
            setSubjectTeachers(res.subjectTeachers)
          }
        } catch (err) {
          console.error('Failed to fetch teachers:', err)
        } finally {
          setLoadingTeachers(false)
        }
      }
      fetchTeachers()
    }

    if (activeSection === 'school-fees' || activeSection === 'finances' || activeSection === 'billing') {
      async function fetchInvoices() {
        try {
          setLoadingInvoices(true)
          const res = await apiSlice.get<{
            success: boolean
            invoices: InvoiceItem[]
            schoolBank: SchoolBankDetails | null
            totalFeeAmount: number
            totalPaidAmount: number
            totalBalance: number
          }>(endpoints.student.invoices)
          if (res.success) {
            setInvoices(res.invoices)
            setSchoolBank(res.schoolBank)
            setTotalFeeAmount(res.totalFeeAmount)
            setTotalPaidAmount(res.totalPaidAmount)
            setTotalBalance(res.totalBalance)
          }
        } catch (err) {
          console.error('Failed to fetch invoices:', err)
        } finally {
          setLoadingInvoices(false)
        }
      }
      fetchInvoices()
    }

    if (activeSection === 'timetable') {
      async function fetchTimetable() {
        try {
          setLoadingTimetable(true)
          const res = await apiSlice.get<{ success: boolean; timetableSlots: any[]; examScheduleSlots: any[] }>(endpoints.student.timetable)
          if (res.success) {
            setTimetableSlots(res.timetableSlots)
            setExamScheduleSlots(res.examScheduleSlots)
          }
        } catch (err) {
          console.error('Failed to fetch timetable:', err)
        } finally {
          setLoadingTimetable(false)
        }
      }
      fetchTimetable()
    }

    if (activeSection === 'communication' || activeSection === 'messages') {
      async function fetchMessages() {
        try {
          const res = await apiSlice.get<{ success: boolean; messages: any[] }>(endpoints.student.messages)
          if (res.success) {
            setStudentMessages(res.messages)
          }
        } catch (err) {
          console.error('Failed to fetch messages:', err)
        }
      }
      fetchMessages()
    }
  }, [activeSection])

  // Study Checklist actions
  const handleToggleReminder = async (id: number) => {
    try {
      setRemindersList(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r))
      await apiSlice.put(endpoints.student.toggleReminder(id), {})
    } catch (err) {
      console.error('Failed to toggle reminder:', err)
    }
  }

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReminderText.trim()) return
    try {
      setAddingReminder(true)
      const res = await apiSlice.post<{ success: boolean; reminder: any }>(endpoints.student.createReminder, {
        text: newReminderText.trim()
      })
      if (res.success && res.reminder) {
        setRemindersList(prev => [{ id: res.reminder.id, text: res.reminder.text, done: res.reminder.done }, ...prev])
        setNewReminderText('')
      }
    } catch (err) {
      console.error('Failed to create reminder:', err)
    } finally {
      setAddingReminder(false)
    }
  }

  const handleDeleteReminder = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setRemindersList(prev => prev.filter(r => r.id !== id))
      await apiSlice.delete(endpoints.student.deleteReminder(id))
    } catch (err) {
      console.error('Failed to delete reminder:', err)
    }
  }

function normalizeQuestions(raw: any): any[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return normalizeQuestions(parsed)
    } catch {
      return []
    }
  }
  if (typeof raw === 'object' && Array.isArray(raw.questions)) {
    return raw.questions
  }
  return []
}

  const [hwAnswersMap, setHwAnswersMap] = useState<Record<string, string>>({})

  // Homework submission
  const handleOpenHwSubmit = async (hw: any) => {
    setSelectedHomework({
      ...hw,
      score: hw.submissionScore ?? hw.score ?? null,
      submissionScore: hw.submissionScore ?? hw.score ?? null,
      feedback: hw.feedback || null,
      questions: normalizeQuestions(hw.questions),
    })
    setSubmissionContent(hw.submission?.answers?.[0]?.notes || '')
    setHwAnswersMap({})
    setHwSuccessMsg(null)
    setShowSubmitHwModal(true)

    try {
      const res = await apiSlice.get<{ success: boolean; homework?: any }>(endpoints.student.homeworkDetail(hw.id))
      if (res.success && res.homework) {
        const normQ = normalizeQuestions(res.homework.questions)
        const sub = res.homework.submission
        const finalScore = res.homework.score ?? res.homework.submissionScore ?? sub?.score ?? hw.submissionScore ?? hw.score ?? null
        const finalFeedback = res.homework.feedback ?? sub?.feedback ?? hw.feedback ?? null
        
        // Populate previous answers if already submitted
        const subAnswers = sub?.answers || []
        const mappedAnswers: Record<string, string> = {}
        if (Array.isArray(subAnswers)) {
          for (const item of subAnswers) {
            if (item && item.questionId !== undefined) {
              mappedAnswers[String(item.questionId)] = item.answerText || ''
            }
          }
        }
        setHwAnswersMap(mappedAnswers)
        if (sub?.answers?.[0]?.notes) {
          setSubmissionContent(sub.answers[0].notes)
        }

        setSelectedHomework((prev: any) => ({
          ...prev,
          ...res.homework,
          score: finalScore,
          submissionScore: finalScore,
          feedback: finalFeedback,
          submitted: res.homework.submitted ?? !!sub ?? prev?.submitted,
          questions: normQ,
        }))
      }
    } catch (err) {
      console.error('Failed to load full homework detail:', err)
    }
  }

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHomework) return

    const questions = normalizeQuestions(selectedHomework.questions)
    let payloadAnswers: any[] = []

    if (questions.length > 0) {
      payloadAnswers = questions.map((q: any) => ({
        questionId: q.id,
        answerText: hwAnswersMap[q.id] || '',
      }))
    }

    try {
      setSubmittingHw(true)
      setHwSuccessMsg(null)
      const res = await apiSlice.post<{ success: boolean; message: string; submission?: any }>(
        endpoints.student.submitHomework(selectedHomework.id),
        {
          answers: payloadAnswers.length > 0 ? payloadAnswers : undefined,
          notes: submissionContent.trim() || 'Submitted',
        }
      )
      if (res.success) {
        setHwSuccessMsg('Homework submitted successfully to your teacher!')
        if (tasks) {
          setTasks((prev) =>
            prev
              ? {
                  ...prev,
                  homeworks: prev.homeworks.map((h) =>
                    h.id === selectedHomework.id
                      ? {
                          ...h,
                          submitted: true,
                          submittedAt: new Date().toISOString(),
                          submissionScore: res.submission?.score ?? null,
                          submissionStatus: res.submission?.score !== null ? 'GRADED' : 'SUBMITTED',
                        }
                      : h
                  ),
                }
              : null
          )
        }
        setTimeout(() => {
          setShowSubmitHwModal(false)
          setHwSuccessMsg(null)
        }, 1500)
      }
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err.message || 'Failed to submit homework.'))
    } finally {
      setSubmittingHw(false)
    }
  }

  // Messaging action
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgBody.trim()) return
    try {
      setSendingMsg(true)
      setMsgSuccess(null)
      const res = await apiSlice.post<{ success: boolean; message: string; newMessage: any }>(endpoints.student.sendMessage, {
        recipientRole,
        recipientId: selectedRecipientId,
        subject: msgSubject.trim() || 'Student Inquiry',
        message: msgBody.trim()
      })
      if (res.success) {
        setMsgSuccess('Message sent successfully!')
        if (res.newMessage) setStudentMessages(prev => [res.newMessage, ...prev])
        setMsgSubject('')
        setMsgBody('')
        setTimeout(() => {
          setShowMsgModal(false)
          setMsgSuccess(null)
        }, 1500)
      }
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err.message || 'Failed to send message.'))
    } finally {
      setSendingMsg(false)
    }
  }

  // Change password action
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showSystemStatus({
        type: 'MISSING_INFO',
        title: 'Required information missing.',
        message: 'New password and confirm password do not match.'
      })
      return
    }
    try {
      setUpdatingPassword(true)
      setPasswordSuccess(null)
      const res = await apiSlice.put<{ success: boolean; message: string }>(endpoints.student.changePassword, {
        currentPassword,
        newPassword
      })
      if (res.success) {
        setPasswordSuccess('Password updated successfully!')
        showSystemStatus({
          type: 'ACTION_SUCCESS',
          title: 'Successfully completed.',
          message: 'Password updated successfully!'
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err.message || 'Failed to update password.'))
    } finally {
      setUpdatingPassword(false)
    }
  }

  // PDF Export
  const handleExportReportCard = async () => {
    try {
      setExportingPdf(true)
      const token = safeStorage.getItem('ugbekun_token')
      const url = endpoints.student.exportPdf('all')
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error('PDF Export failed.')
      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `ReportCard_${profile?.registerNo || 'Student'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err.message || 'Could not download report card.'))
    } finally {
      setExportingPdf(false)
    }
  }

  // Open & Pre-load Report Card Preview
  const handleOpenReportCardPreview = async () => {
    setShowReportCardPreview(true)
    setPreviewTab('document')

    if (!previewPdfBlobUrl) {
      try {
        setLoadingPdfPreview(true)
        const token = safeStorage.getItem('ugbekun_token')
        const url = endpoints.student.exportPdf('all')
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (res.ok) {
          const blob = await res.blob()
          const objectUrl = window.URL.createObjectURL(blob)
          setPreviewPdfBlobUrl(objectUrl)
        }
      } catch (err) {
        console.warn('[STUDENT] PDF preview load error:', err)
      } finally {
        setLoadingPdfPreview(false)
      }
    }
  }

  const handleCloseReportCardPreview = () => {
    setShowReportCardPreview(false)
  }

  // Clean up PDF blob object URL on unmount
  useEffect(() => {
    return () => {
      if (previewPdfBlobUrl) {
        window.URL.revokeObjectURL(previewPdfBlobUrl)
      }
    }
  }, [previewPdfBlobUrl])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-slate-600 font-bold text-sm tracking-wide animate-pulse">Syncing student database workspace...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 flex flex-col items-center gap-4 text-center max-w-lg mx-auto mt-12 shadow-sm">
        <AlertCircle className="text-rose-600" size={36} />
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Dashboard Synchronization Failed</h3>
          <p className="text-xs font-semibold text-rose-600 mt-1.5">{error || 'Database mapping error.'}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  // 1. MEDIA LIBRARY SUB-VIEW
  if (activeSection === 'media') {
    return <StudentMediaLibrary />
  }

  // 2. CAMPUS LIVE CLASSROOMS SUB-VIEW
  if (activeSection === 'liveRooms') {
    return <StudentLiveClassrooms user={user} />
  }

  // 3. POINTS & TRIVIA HUB
  if (activeSection === 'points' || activeSection === 'trivia') {
    return <PointsHub />
  }

  // 4. TERM CALENDAR SUB-VIEW
  if (activeSection === 'calendar') {
    return <SchoolCalendar user={user} />
  }

  // 5. ACADEMICS & TEACHER DIRECTORY SUB-VIEW
  if (activeSection === 'academics' || activeSection === 'teachers') {
    return (
      <div className="space-y-6 pb-12 font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="text-blue-600" size={24} />
              My Class & Teacher Directory
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Class: <span className="font-bold text-slate-900">{profile.className} {profile.sectionName}</span> &bull; Enrolled Subjects: <span className="font-bold text-slate-900">{profile.subjects.length}</span>
            </p>
          </div>
        </div>

        {/* Form Teacher Card */}
        {formTeacher ? (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 overflow-hidden shrink-0 border-2 border-white/30">
                <img
                  src={getAvatarUrl(formTeacher.photo, formTeacher.name)}
                  alt={formTeacher.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider">
                  Form Class Teacher
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">{formTeacher.name}</h3>
                <p className="text-xs text-slate-300">{formTeacher.email || 'No email registered'} &bull; {formTeacher.phone || 'No phone registered'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedRecipientId(formTeacher.id || null)
                setRecipientRole('TEACHER')
                setRecipientName(`${formTeacher.name} (Form Teacher)`)
                setShowMsgModal(true)
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Mail size={14} />
              <span>Contact Form Teacher</span>
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-100 text-slate-500 text-xs text-center italic">
            No Form Teacher allocated for {profile.className} {profile.sectionName} yet.
          </div>
        )}

        {/* Subject Teachers Directory */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Subject Teachers ({subjectTeachers.length})
            </h3>
            {loadingTeachers && <Loader2 size={16} className="animate-spin text-blue-600" />}
          </div>

          {subjectTeachers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectTeachers.map((st, idx) => (
                <div key={`subj-teacher-${st.id}-${idx}`} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden shrink-0 border border-blue-200">
                      <img
                        src={getAvatarUrl(st.photo, st.name)}
                        alt={st.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                      <p className="text-[11px] text-slate-500">{st.department || 'Academic Staff'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subjects Taught</span>
                    <div className="flex flex-wrap gap-1">
                      {st.subjects?.map((sub) => (
                        <span key={sub.id} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-blue-700">
                          {sub.name} ({sub.code})
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRecipientId(st.id)
                      setRecipientRole('TEACHER')
                      setRecipientName(`${st.name} (Subject Teacher)`)
                      setShowMsgModal(true)
                    }}
                    className="w-full mt-2 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Mail size={13} />
                    <span>Send Message</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No subject teachers assigned to your class section yet.
            </div>
          )}
        </div>
      </div>
    )
  }

  // 6. REAL DB RESULTS & TERM REPORT CARD SUB-VIEW
  if (activeSection === 'results' || activeSection === 'grades') {
    const rawRank = dashboardOverview?.kpi?.classRank ?? grades?.rank
    const userRankText = rawRank ? `${rawRank}${getOrdinal(rawRank)}` : 'N/A'
    const totalClass = dashboardOverview?.kpi?.totalClassStudents || grades?.totalClassStudents || profile.fellowStudentsCount || 0
    const avgScore = dashboardOverview?.kpi?.averageScore ?? grades?.overallAverage ?? 0
    const reportCardList = grades?.reportCard || []

    return (
      <div className="space-y-6 pb-12 font-sans">
        {/* Header with PDF Export Button */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="text-indigo-600" size={24} />
              Term Academic Results & Official Report Card
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Class: <span className="font-bold text-slate-900">{profile.className} {profile.sectionName}</span> &bull; Student Reg: <span className="font-bold text-slate-900">{profile.registerNo}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleOpenReportCardPreview}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Eye size={15} />
              <span>Preview Report Card</span>
            </button>

            <button
              type="button"
              onClick={handleExportReportCard}
              disabled={exportingPdf}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              {exportingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>Download Report Card (PDF)</span>
            </button>
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-md">
            <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-200 block">Overall DB Grade Average</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black">{avgScore}%</span>
              <span className="text-xs text-emerald-400 font-bold">Real-time DB aggregate</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Class Position (Rank)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900">{userRankText}</span>
              <span className="text-xs text-slate-500 font-medium">out of {totalClass} students</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Enrolled Graded Subjects</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900">{reportCardList.length || profile.subjects.length}</span>
              <span className="text-xs text-blue-600 font-bold">Subjects Recorded</span>
            </div>
          </div>
        </div>

        {/* Teacher Commentary Card */}
        {grades?.commentary && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 text-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wide">
              <Sparkles size={16} className="text-amber-600" />
              <span>Official Teacher & Principal Commentary</span>
            </div>
            <p className="text-xs leading-relaxed italic text-slate-700">{grades.commentary}</p>
          </div>
        )}

        {/* Report Card Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Subject Scores, CBT & Theory Marks Breakdown
            </h3>
            <button
              type="button"
              onClick={handleOpenReportCardPreview}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye size={13} className="text-indigo-600" />
              <span>Full Preview Sheet</span>
            </button>
          </div>

          {reportCardList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Exam / Term</th>
                    <th className="p-4">CBT Test</th>
                    <th className="p-4">Theory / Exam</th>
                    <th className="p-4">Total Score</th>
                    <th className="p-4">Class Average</th>
                    <th className="p-4">Grade & Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportCardList.map((item) => {
                    const totalVal = parseFloat(item.mark || '0')
                    const gradeInfo = getGradeLetter(totalVal)
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{item.subjectName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.subjectCode}</span>
                        </td>
                        <td className="p-4 font-medium text-slate-700">{item.examName}</td>
                        <td className="p-4 font-mono font-semibold">{item.cbtMark ? `${item.cbtMark} / 40` : '-'}</td>
                        <td className="p-4 font-mono font-semibold">{item.theoryMark ? `${item.theoryMark} / 60` : '-'}</td>
                        <td className="p-4 font-black text-slate-900 text-sm">{item.mark !== null ? `${item.mark}%` : 'N/A'}</td>
                        <td className="p-4 font-mono text-slate-500">{item.classAverage}%</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${gradeInfo.bg} ${gradeInfo.color}`}>
                            {gradeInfo.letter}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No official marks or report card records recorded for this term session yet.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL REPORT CARD PREVIEW MODAL                                        */}
        {/* ========================================================================= */}
        {showReportCardPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
            <div className="relative w-full max-w-5xl bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:bg-white print:rounded-none">
              
              {/* Modal Top Header (Hidden in Print) */}
              <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      Official Term Report Card Preview
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {profile.firstName} {profile.lastName} &bull; Reg: <span className="font-mono font-bold text-slate-700">{profile.registerNo}</span> &bull; {profile.className} ({profile.sectionName})
                    </p>
                  </div>
                </div>

                {/* Tab Switcher & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('document')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        previewTab === 'document' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Award size={14} />
                      <span>Digital Certificate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('pdf')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        previewTab === 'pdf' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye size={14} />
                      <span>PDF Document</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer size={14} />
                    <span className="hidden sm:inline">Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportReportCard}
                    disabled={exportingPdf}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    <span className="hidden sm:inline">Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseReportCardPreview}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
                {previewTab === 'document' ? (
                  <div id="printable-report-card" className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-10 space-y-6 text-slate-800 font-sans max-w-4xl mx-auto print:shadow-none print:border-none print:p-4 print:m-0">
                    
                    {/* Institution Header */}
                    <div className="border-b-2 border-slate-900/80 pb-6 text-center space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                          {branding?.logoUrl ? (
                            <img src={branding.logoUrl} alt={branding.schoolName} className="w-full h-full object-contain rounded-xl" />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-indigo-950 text-white flex items-center justify-center font-bold">
                              <School size={28} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                            {branding?.schoolName || profile.branchName || 'UGBEKUN INTERNATIONAL ACADEMY'}
                          </h1>
                          <p className="text-xs italic font-bold text-slate-600 mt-0.5">
                            {branding?.tagline || 'Excellence in Knowledge & Character'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {branding?.address || 'Main Campus'} {branding?.phone ? `• Tel: ${branding.phone}` : ''} {branding?.email ? `• Email: ${branding.email}` : ''}
                          </p>
                        </div>

                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={getAvatarUrl(profile.photo, `${profile.firstName} ${profile.lastName}`)}
                            alt={profile.firstName}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest">
                          Continuous Assessment & Terminal Academic Report Card
                        </span>
                        <p className="text-xs font-bold text-indigo-700 mt-1.5">
                          Academic Session: {branding?.academicSession || '2025/2026'} &bull; Term: {branding?.currentTerm || 'First Term'}
                        </p>
                      </div>
                    </div>

                    {/* Student Bio Grid */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Name</span>
                          <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                            {profile.firstName} {profile.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration No</span>
                          <span className="font-mono font-extrabold text-slate-900 text-sm block mt-0.5">
                            {profile.registerNo}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Class & Arm</span>
                          <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                            {profile.className} {profile.sectionName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender</span>
                          <span className="font-extrabold text-slate-900 text-sm block mt-0.5 capitalize">
                            {profile.gender || 'Not Specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Record</span>
                          <span className="font-extrabold text-emerald-700 text-sm block mt-0.5">
                            {attendance?.percentage ?? 100}% ({attendance?.presentCount ?? 0} of {attendance?.totalDays ?? 0} Days)
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Position (Rank)</span>
                          <span className="font-extrabold text-indigo-700 text-sm block mt-0.5">
                            {userRankText} <span className="text-[11px] text-slate-500 font-normal">out of {totalClass}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Terminal Average</span>
                          <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                            {avgScore}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Terminal Grade</span>
                          <span className="font-extrabold text-indigo-800 text-sm block mt-0.5">
                            {getGradeLetter(avgScore).letter}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Academic Marks Breakdown Table */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart3 size={15} className="text-indigo-600" />
                        <span>Cognitive Academic Evaluation & Subject Breakdown</span>
                      </h4>

                      {reportCardList.length > 0 ? (
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                              <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Subject</th>
                                <th className="p-3 text-center">CBT / CA (40)</th>
                                <th className="p-3 text-center">Theory / Exam (60)</th>
                                <th className="p-3 text-center">Total (100)</th>
                                <th className="p-3 text-center">Class Avg</th>
                                <th className="p-3 text-center">Grade</th>
                                <th className="p-3">Remark</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {reportCardList.map((item, idx) => {
                                const totalVal = parseFloat(item.mark || '0')
                                const gradeInfo = getGradeLetter(totalVal)
                                return (
                                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    <td className="p-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                                    <td className="p-3">
                                      <span className="font-bold text-slate-900 block">{item.subjectName}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">{item.subjectCode}</span>
                                    </td>
                                    <td className="p-3 text-center font-mono font-semibold text-slate-700">
                                      {item.cbtMark ? item.cbtMark : '-'}
                                    </td>
                                    <td className="p-3 text-center font-mono font-semibold text-slate-700">
                                      {item.theoryMark ? item.theoryMark : '-'}
                                    </td>
                                    <td className="p-3 text-center font-mono font-black text-slate-900 text-sm">
                                      {item.mark !== null ? `${item.mark}` : 'ABS'}
                                    </td>
                                    <td className="p-3 text-center font-mono text-slate-500 font-medium">
                                      {item.classAverage}%
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${gradeInfo.bg} ${gradeInfo.color}`}>
                                        {gradeInfo.letter.split(' ')[0]}
                                      </span>
                                    </td>
                                    <td className="p-3 font-medium text-slate-700 text-[11px]">
                                      {gradeInfo.letter.includes('(') ? gradeInfo.letter.split('(')[1].replace(')', '') : 'Satisfactory'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs italic">
                          No recorded subject marks available for this term yet.
                        </div>
                      )}
                    </div>

                    {/* Non-Cognitive / Affective Skills & Ratings */}
                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Affective & Behavioral Development
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-500 block">Punctuality</span>
                          <span className="font-bold text-amber-500 text-sm mt-0.5 block">⭐⭐⭐⭐⭐</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Excellent</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-500 block">Class Neatness</span>
                          <span className="font-bold text-amber-500 text-sm mt-0.5 block">⭐⭐⭐⭐⭐</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Commendable</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-500 block">Attentiveness</span>
                          <span className="font-bold text-amber-500 text-sm mt-0.5 block">⭐⭐⭐⭐⭐</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Consistent</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-500 block">Peer Relations</span>
                          <span className="font-bold text-amber-500 text-sm mt-0.5 block">⭐⭐⭐⭐⭐</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Respectful</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-500 block">Teamwork</span>
                          <span className="font-bold text-amber-500 text-sm mt-0.5 block">⭐⭐⭐⭐⭐</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Active Leader</span>
                        </div>
                      </div>
                    </div>

                    {/* Qualitative Teacher & Principal Endorsement */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Form Teacher's Commentary
                        </span>
                        <p className="text-xs text-slate-700 italic leading-relaxed">
                          "{grades?.commentary || 'A diligent, polite, and academically steady pupil. Demonstrates high enthusiasm for learning and cooperation.'}"
                        </p>
                        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{profile.formTeacher?.name || 'Class Teacher'}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Signed & Endorsed</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Principal's Certification & Stamp
                          </span>
                          <p className="text-xs text-slate-700 italic leading-relaxed">
                            "Satisfactory academic outcome. Confirmed for progression in line with institution requirements."
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {branding?.principalSignatureUrl ? (
                              <img src={branding.principalSignatureUrl} alt="Signature" className="h-9 object-contain" />
                            ) : (
                              <span className="font-serif italic text-sm font-bold text-indigo-900">Dr. School Principal</span>
                            )}
                          </div>
                          <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Official Stamp</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grading System Legend Footer */}
                    <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-500 text-center leading-relaxed">
                      <span className="font-bold text-slate-700">Official Grading Scale:</span> A (80-100%: Distinction) &bull; B (70-79%: Very Good) &bull; C (60-69%: Credit) &bull; D (50-59%: Pass) &bull; E (40-49%: Fair) &bull; F (0-39%: Fail)
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
                    {loadingPdfPreview ? (
                      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
                        <Loader2 size={36} className="animate-spin text-indigo-600" />
                        <p className="text-xs font-bold text-slate-700 tracking-wide">Compiling official PDF report card document...</p>
                      </div>
                    ) : previewPdfBlobUrl ? (
                      <iframe
                        src={previewPdfBlobUrl}
                        className="w-full h-[650px] rounded-2xl border border-slate-200 shadow-inner bg-slate-50"
                        title="Report Card PDF Live Preview"
                      />
                    ) : (
                      <div className="py-20 text-center space-y-3">
                        <Award size={36} className="mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">PDF preview could not be rendered directly in this window.</p>
                        <button
                          type="button"
                          onClick={handleExportReportCard}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                        >
                          Download PDF Instead
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    )
  }

  // 7. TIMETABLE & EXAM SCHEDULE SUB-VIEW
  if (activeSection === 'timetable') {
    const days = ['ALL', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    const weekdayCols = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    const filteredSlots = selectedTimetableDay === 'ALL'
      ? timetableSlots
      : timetableSlots.filter(s => s.dayOfWeek?.toUpperCase() === selectedTimetableDay)

    return (
      <div className="space-y-6 pb-12 font-sans">
        {/* Timetable Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="text-purple-600" size={24} />
              Class Timetable & Published Exam Schedule
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
                Class: {profile.className || 'My Class'} {profile.sectionName ? `(${profile.sectionName})` : ''}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                {timetableSlots.length} Total Period Slots
              </span>
              {timetableSlots.length > 0 && timetableSlots[0]?.sectionName && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                  Arm: {timetableSlots[0].sectionName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTimetableViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  timetableViewMode === 'grid'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Weekly Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setTimetableViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  timetableViewMode === 'cards'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List size={14} />
                <span>Day Cards</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <Printer size={14} className="text-slate-500" />
              <span>Print</span>
            </button>

            {loadingTimetable && <Loader2 size={18} className="animate-spin text-blue-600" />}
          </div>
        </div>

        {/* 1. WEEKLY GRID VIEW */}
        {timetableViewMode === 'grid' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={15} className="text-indigo-600" />
                Full Weekly Class Period Schedule
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Monday &ndash; Friday Schedule</span>
            </div>

            {timetableSlots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {weekdayCols.map((day) => {
                  const daySlots = timetableSlots
                    .filter((s) => s.dayOfWeek?.toUpperCase() === day)
                    .sort((a, b) => (a.startTime > b.startTime ? 1 : -1))

                  return (
                    <div
                      key={day}
                      className="flex flex-col rounded-2xl border border-slate-200/90 bg-slate-50/60 overflow-hidden"
                    >
                      {/* Day Column Header */}
                      <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100/80 flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-900 tracking-wide">
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                          {daySlots.length}
                        </span>
                      </div>

                      {/* Day Slot Items */}
                      <div className="p-2 space-y-2 flex-1 min-h-[220px]">
                        {daySlots.length > 0 ? (
                          daySlots.map((slot) => {
                            if (slot.type === 'BREAK') {
                              return (
                                <div
                                  key={slot.id}
                                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/90 text-amber-900 space-y-1 shadow-xs"
                                >
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-bold flex items-center gap-1 text-amber-700">
                                      <Coffee size={12} />
                                      Break / Recess
                                    </span>
                                    <span className="font-mono text-amber-800 font-bold">
                                      {slot.startTime}-{slot.endTime}
                                    </span>
                                  </div>
                                  <div className="text-xs font-extrabold text-amber-900">
                                    {slot.title || 'Break Time'}
                                  </div>
                                </div>
                              )
                            }

                            if (slot.type === 'ASSEMBLY') {
                              return (
                                <div
                                  key={slot.id}
                                  className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/90 text-sky-900 space-y-1 shadow-xs"
                                >
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-bold flex items-center gap-1 text-sky-700">
                                      <Sun size={12} />
                                      Assembly
                                    </span>
                                    <span className="font-mono text-sky-800 font-bold">
                                      {slot.startTime}-{slot.endTime}
                                    </span>
                                  </div>
                                  <div className="text-xs font-extrabold text-sky-900">
                                    {slot.title || 'Morning Assembly'}
                                  </div>
                                </div>
                              )
                            }

                            // SUBJECT PERIOD
                            return (
                              <div
                                key={slot.id}
                                className="p-3 rounded-xl border border-indigo-100 bg-white hover:border-indigo-300 hover:shadow-xs transition space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                  {slot.subjectCode && (
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-bold">
                                      {slot.subjectCode}
                                    </span>
                                  )}
                                </div>

                                <div className="font-extrabold text-slate-900 text-xs leading-snug">
                                  {slot.title || slot.subjectName || 'Subject Period'}
                                </div>

                                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                                  <span className="flex items-center gap-1 truncate font-medium text-slate-700">
                                    <User size={11} className="text-slate-400 shrink-0" />
                                    {slot.teacherName || 'Teacher Unassigned'}
                                  </span>
                                </div>

                                {slot.sectionName && (
                                  <div className="text-[9px] text-slate-400 font-semibold truncate">
                                    Arm: {slot.sectionName}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-8 text-slate-300 text-xs italic">
                            No periods scheduled
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No class period timetable slots published yet for this classroom.
              </div>
            )}
          </div>
        )}

        {/* 2. CARD / DAY-BY-DAY VIEW */}
        {timetableViewMode === 'cards' && (
          <div className="space-y-4">
            {/* Day-of-Week Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {days.map((day) => {
                const count =
                  day === 'ALL'
                    ? timetableSlots.length
                    : timetableSlots.filter((s) => s.dayOfWeek?.toUpperCase() === day).length
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedTimetableDay(day)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      selectedTimetableDay === day
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{day === 'ALL' ? 'All Days' : day.charAt(0) + day.slice(1).toLowerCase()}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedTimetableDay === day ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Timetable Cards Grid */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Class Periods for {selectedTimetableDay.toLowerCase()}
              </h3>
              {filteredSlots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSlots.map((slot) => {
                    const isBreak = slot.type === 'BREAK'
                    const isAssembly = slot.type === 'ASSEMBLY'

                    return (
                      <div
                        key={slot.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between text-xs space-y-2.5 transition hover:shadow-xs ${
                          isBreak
                            ? 'bg-amber-50/70 border-amber-200'
                            : isAssembly
                            ? 'bg-sky-50/70 border-sky-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                              isBreak
                                ? 'bg-amber-100 text-amber-800'
                                : isAssembly
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {slot.dayOfWeek}
                          </span>
                          <span className="text-slate-600 font-mono font-bold text-[11px]">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{slot.title}</h4>
                          {isBreak ? (
                            <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
                              Recess / Student Rest Period
                            </span>
                          ) : isAssembly ? (
                            <span className="text-[11px] text-sky-700 font-semibold block mt-0.5">
                              Morning Devotion & Roll Call
                            </span>
                          ) : (
                            <div className="mt-1 space-y-0.5">
                              <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                                <User size={12} className="text-slate-400 shrink-0" />
                                Assigned Teacher: <strong className="text-slate-900">{slot.teacherName || 'Unassigned'}</strong>
                              </span>
                              {slot.teacherPhone && (
                                <span className="text-[10px] text-slate-400 block pl-4">
                                  Phone: {slot.teacherPhone}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-600 uppercase">
                            {isBreak ? '☕ RECESS' : isAssembly ? '☀️ ASSEMBLY' : '📚 SUBJECT PERIOD'}
                          </span>
                          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-slate-700">
                            {slot.subjectCode || (slot.sectionName ? `Arm: ${slot.sectionName}` : 'CLASS')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs italic">
                  No class period timetable slots published for {selectedTimetableDay.toLowerCase()}.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exam Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Published Term Examination Timetable</h3>
          {examScheduleSlots.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Exam Date</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Hall</th>
                    <th className="p-3">Invigilator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examScheduleSlots.map((es) => (
                    <tr key={es.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">{es.examDate ? new Date(es.examDate).toLocaleDateString() : 'TBD'}</td>
                      <td className="p-3 font-mono">{es.startTime} - {es.endTime}</td>
                      <td className="p-3 font-bold text-purple-700">{es.subjectName} ({es.subjectCode})</td>
                      <td className="p-3 font-semibold text-slate-800">{es.hallName}</td>
                      <td className="p-3 text-slate-500">{es.invigilatorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No term examination dates published yet.
            </div>
          )}
        </div>
      </div>
    )
  }

  // 8. SCHOOL FEES & BANK DETAILS SUB-VIEW
  if (activeSection === 'school-fees' || activeSection === 'finances' || activeSection === 'billing') {
    return (
      <div className="space-y-6 pb-12 font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={24} />
              School Fees & Payment Account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              View official fee invoices, payment history, and school bank account for wire transfers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${totalBalance === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              Balance Due: ₦{totalBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 3 Fee Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Billed Fees</span>
            <h3 className="text-2xl font-black text-slate-900">₦{totalFeeAmount.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500">Total invoice fees issued</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid Amount</span>
            <h3 className="text-2xl font-black text-emerald-600">₦{totalPaidAmount.toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-600 font-medium">Verified payments recorded</p>
          </div>

          <div className={`rounded-3xl p-5 border shadow-xs space-y-2 ${totalBalance === 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Total Outstanding Balance</span>
            <h3 className={`text-2xl font-black ${totalBalance === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ₦{totalBalance.toLocaleString()}
            </h3>
            <p className="text-[11px] font-bold text-slate-600">{totalBalance === 0 ? 'All fees settled' : 'Payment required'}</p>
          </div>
        </div>

        {/* Official School Bank Card */}
        {schoolBank && (
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <Building className="text-emerald-400" size={20} />
                <h3 className="font-extrabold text-sm uppercase tracking-wide">Official School Bank Account</h3>
              </div>
              <span className="text-[10px] bg-white/20 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                Wire Transfer / Direct Deposit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Bank Name</span>
                <span className="text-base font-black text-white">{schoolBank.bankName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Account Name</span>
                <span className="text-base font-black text-white">{schoolBank.accountName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Account Number</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-mono font-black text-yellow-300 tracking-wider">{schoolBank.accountNumber}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(schoolBank.accountNumber)
                      setCopiedAccount(true)
                      setTimeout(() => setCopiedAccount(false), 2000)
                    }}
                    className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                  >
                    {copiedAccount ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Table with Expandable Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Fee Invoices & Payment Breakdown ({invoices.length})
            </h3>
            {loadingInvoices && <Loader2 size={16} className="animate-spin text-blue-600" />}
          </div>

          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Title / Term</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Paid Amount</th>
                    <th className="p-4">Balance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-mono font-bold text-slate-900">{inv.invoiceNo}</td>
                      <td className="p-4 font-semibold text-slate-800">{inv.title}</td>
                      <td className="p-4 font-bold text-slate-900">₦{inv.amount.toLocaleString()}</td>
                      <td className="p-4 font-bold text-emerald-600">₦{inv.paidAmount.toLocaleString()}</td>
                      <td className="p-4 font-bold text-rose-600">₦{inv.balance.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200')}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setExpandedInvoiceId(expandedInvoiceId === inv.id ? null : inv.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <span>{expandedInvoiceId === inv.id ? 'Hide' : 'Details'}</span>
                          {expandedInvoiceId === inv.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              No school fee invoices generated for your student account yet.
            </div>
          )}
        </div>
      </div>
    )
  }

  // 9. ASSIGNMENTS & HOMEWORKS SUB-VIEW
  if (activeSection === 'assignments' || activeSection === 'tasks') {
    const rawHwList = tasks?.homeworks?.length ? tasks.homeworks : (dashboardOverview?.upcomingHomeworks || [])
    const notesList = tasks?.notes || []

    // When an assignment is active (Attempting or Reviewing)
    if (showSubmitHwModal && selectedHomework) {
      const activeQs = normalizeQuestions(selectedHomework.questions)

      return (
        <div className="space-y-6 pb-12 font-sans">
          {/* Top Bar with Back Button */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSubmitHwModal(false)
                  setSelectedHomework(null)
                  setHwSuccessMsg(null)
                }}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
              >
                <ArrowLeft size={16} />
                <span>Back to Assignments</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold text-[11px]">
                    {selectedHomework.subjectName}
                  </span>
                  <span className="text-xs text-slate-400">
                    Due: {new Date(selectedHomework.dueDate).toLocaleDateString()}
                  </span>
                  {selectedHomework.submitted && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                      ✓ Submitted
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {selectedHomework.title}
                </h2>
              </div>
            </div>

            {activeQs.length > 0 && (
              <span className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold shrink-0 flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>{activeQs.length} Questions • Auto-Grading Enabled</span>
              </span>
            )}
          </div>

          {hwSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{hwSuccessMsg}</span>
            </div>
          )}

          {/* Grade & Teacher Evaluation Card if submitted */}
          {selectedHomework.submitted && (
            <div className="bg-linear-to-r from-emerald-500/10 via-blue-500/10 to-indigo-500/10 rounded-3xl p-6 border border-emerald-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
                  {selectedHomework.score !== null && selectedHomework.score !== undefined
                    ? selectedHomework.score
                    : '✓'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      {selectedHomework.score !== null && selectedHomework.score !== undefined
                        ? 'Teacher Grade & Evaluation'
                        : 'Submission Status'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                      {selectedHomework.score !== null && selectedHomework.score !== undefined ? 'GRADED' : 'SUBMITTED'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedHomework.score !== null && selectedHomework.score !== undefined
                      ? `Score Awarded: ${selectedHomework.score} pts`
                      : 'Assignment Submitted • Awaiting Teacher Grade'}
                  </h3>
                  {selectedHomework.feedback && (
                    <p className="text-xs text-slate-700 mt-1.5 font-medium bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                      <span className="font-bold text-indigo-700">Teacher Feedback:</span> &quot;{selectedHomework.feedback}&quot;
                    </p>
                  )}
                </div>
              </div>

              {selectedHomework.score !== null && selectedHomework.score !== undefined && (
                <div className="px-5 py-2.5 bg-white rounded-2xl border border-emerald-200 shadow-2xs text-center shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                  <span className="text-sm font-black text-emerald-600">EVALUATED</span>
                </div>
              )}
            </div>
          )}

          {/* Description / Instructions */}
          {selectedHomework.description && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Assignment Instructions</h3>
              <p className="text-xs text-slate-700 leading-relaxed">{selectedHomework.description}</p>
            </div>
          )}

          {/* Questions Sheet / Submission Form */}
          <form onSubmit={handleSubmitHomework} className="space-y-6">
            {activeQs.length > 0 ? (
              <div className="space-y-4">
                {activeQs.map((q: any, idx: number) => {
                  const qType = String(q.type || q.questionType || '').toUpperCase()
                  const currentAns = hwAnswersMap[q.id] || ''

                  return (
                    <div key={q.id || idx} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                              {q.questionText}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Question {idx + 1} of {activeQs.length}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shrink-0">
                          {q.points || q.marks || 1} pt
                        </span>
                      </div>

                      {/* MCQ Options */}
                      {qType === 'MCQ' && Array.isArray(q.options) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {q.options.map((opt: string, oIdx: number) => {
                            const isSelected = currentAns === opt || currentAns === String(oIdx)
                            return (
                              <button
                                type="button"
                                key={oIdx}
                                disabled={selectedHomework.submitted}
                                onClick={() => setHwAnswersMap((prev) => ({ ...prev, [q.id]: opt }))}
                                className={`p-4 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-between text-left ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                              >
                                <span>{opt}</span>
                                {isSelected && <CheckCircle2 size={18} className="text-white shrink-0" />}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* True / False Options */}
                      {qType === 'TF' && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          {['True', 'False'].map((tfOpt) => {
                            const isSelected = currentAns.toLowerCase() === tfOpt.toLowerCase()
                            return (
                              <button
                                type="button"
                                key={tfOpt}
                                disabled={selectedHomework.submitted}
                                onClick={() => setHwAnswersMap((prev) => ({ ...prev, [q.id]: tfOpt }))}
                                className={`py-3.5 rounded-2xl border text-sm font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span>{tfOpt}</span>
                                {isSelected && <CheckCircle2 size={18} className="text-white" />}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Theory / Short Answer Input */}
                      {(qType === 'THEORY' || qType === 'SHORT') && (
                        <div className="pt-2">
                          <textarea
                            rows={4}
                            disabled={selectedHomework.submitted}
                            placeholder="Type your explanation or response here..."
                            value={currentAns}
                            onChange={(e) => setHwAnswersMap((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <label className="block font-bold text-slate-800 text-xs">Your Solution / Answer Notes *</label>
                <textarea
                  required
                  rows={6}
                  disabled={selectedHomework.submitted}
                  placeholder="Type your answers, solutions or comments here..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition"
                />
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowSubmitHwModal(false)
                  setSelectedHomework(null)
                  setHwSuccessMsg(null)
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Return to Homeworks List</span>
              </button>

              {!selectedHomework.submitted ? (
                <button
                  type="submit"
                  disabled={submittingHw}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md cursor-pointer flex items-center gap-2 transition"
                >
                  <Upload size={15} />
                  <span>{submittingHw ? 'Submitting Answers...' : 'Submit Completed Assignment'}</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                  ✓ Assignment Already Submitted
                </span>
              )}
            </div>
          </form>
        </div>
      )
    }

    return (
      <div className="space-y-6 pb-12 font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-blue-600" size={24} />
              Homework Assignments & Study Resources
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Complete your homework assignments and access downloadable teacher lecture notes.
            </p>
          </div>
        </div>

        {/* Homeworks List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Assigned Homeworks ({rawHwList.length})
          </h3>

          {rawHwList.length > 0 ? (
            <div className="space-y-3">
              {rawHwList.map((hw: any) => (
                <div key={hw.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md">
                        {hw.subjectName}
                      </span>
                      {hw.submissionScore !== null && hw.submissionScore !== undefined ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs">
                          ★ Graded: {hw.submissionScore} pts
                        </span>
                      ) : hw.submitted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          ✓ Submitted (Awaiting Grade)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          Pending
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{hw.title}</h4>
                    <p className="text-xs text-slate-500">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                    {hw.feedback && (
                      <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100/80 p-2.5 rounded-xl mt-1.5 font-medium flex items-center gap-1.5">
                        <MessageSquare size={13} className="shrink-0 text-indigo-500" />
                        <span>Teacher Feedback: &quot;{hw.feedback}&quot;</span>
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {hw.submitted ? (
                      <button
                        onClick={() => handleOpenHwSubmit(hw)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye size={14} className="text-blue-600" />
                        <span>{hw.submissionScore !== null && hw.submissionScore !== undefined ? 'View Graded Assignment' : 'View Submission'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenHwSubmit(hw)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles size={14} />
                        <span>Attempt Assignment</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs italic">
              No pending homework assignments recorded for your class.
            </div>
          )}
        </div>

        {/* Downloadable Notes */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Teacher Lecture Notes & Downloads ({notesList.length})
          </h3>

          {notesList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {notesList.map((note) => (
                <div key={note.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">{note.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{note.description || 'No description'}</p>
                  <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>By {note.teacherName}</span>
                    <span className="font-bold text-blue-600">{note.fileName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No study lecture notes published yet.
            </div>
          )}
        </div>
      </div>
    )
  }

  // 10. CBT & ONLINE EXAMS SUB-VIEW
  if (activeSection === 'cbt-exams' || activeSection === 'exams') {
    const examsList = cbtExamsList.length > 0 ? cbtExamsList : (tasks?.onlineExams || [])

    // IF AN EXAM IS CURRENTLY ACTIVE (TAKING TEST)
    if (activeCbtExam) {
      const currentQ = activeCbtExam.questions[activeQuestionIdx] || activeCbtExam.questions[0]
      const totalQ = activeCbtExam.questions.length
      const answeredCount = Object.keys(selectedAnswers).length
      const currentAns = currentQ ? selectedAnswers[currentQ.id] : undefined
      const isFlagged = currentQ ? flaggedQuestions.has(currentQ.id) : false

      const minutes = Math.floor(timeRemaining / 60)
      const seconds = timeRemaining % 60
      const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      const isLowTime = timeRemaining <= 300 // < 5 minutes

      return (
        <div className="space-y-6 pb-12 font-sans">
          {/* Exam Header Bar */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to exit? Your unsaved progress will be lost.')) {
                    setActiveCbtExam(null)
                  }
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
                title="Exit Exam"
              >
                <ChevronLeft size={18} />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-md uppercase">
                    CBT Assessment
                  </span>
                  <span className="text-xs text-slate-300 font-bold">
                    Question {activeQuestionIdx + 1} of {totalQ}
                  </span>
                </div>
                <h2 className="text-base font-black tracking-tight text-white mt-0.5">
                  {activeCbtExam.title}
                </h2>
              </div>
            </div>

            {/* Countdown Timer Display */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-black text-sm transition ${
                  isLowTime
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-white/10 border-white/20 text-amber-400'
                }`}
              >
                <Clock size={16} />
                <span>{formattedTime}</span>
              </div>

              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-2xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} /> Submit Exam
              </button>
            </div>
          </div>

          {/* Main Assessment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Question Viewer */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
                {/* Question Info Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      {activeQuestionIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {currentQ?.marks || 1} Mark{(currentQ?.marks || 1) > 1 ? 's' : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (!currentQ) return
                      const updated = new Set(flaggedQuestions)
                      if (updated.has(currentQ.id)) updated.delete(currentQ.id)
                      else updated.add(currentQ.id)
                      setFlaggedQuestions(updated)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isFlagged
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Flag size={13} className={isFlagged ? 'fill-amber-600' : ''} />
                    {isFlagged ? 'Flagged for Review' : 'Flag Question'}
                  </button>
                </div>

                {/* Question Text */}
                <div className="text-sm md:text-base font-bold text-slate-900 leading-relaxed min-h-[70px]">
                  {currentQ?.questionText}
                </div>

                {/* Option Selector Cards */}
                <div className="space-y-3 pt-2">
                  {currentQ?.options?.map((opt: string, optIdx: number) => {
                    const optLetter = String.fromCharCode(65 + optIdx)
                    const isSelected = currentAns === optLetter || (currentQ.questionType === 'true_false' && currentAns === (optIdx === 0 ? 'A' : 'B'))

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => {
                          setSelectedAnswers({
                            ...selectedAnswers,
                            [currentQ.id]: currentQ.questionType === 'true_false' ? (optIdx === 0 ? 'A' : 'B') : optLetter
                          })
                        }}
                        className={`w-full p-4 rounded-2xl border text-left transition flex items-center gap-4 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-slate-900 font-bold shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700 font-medium'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition ${
                            isSelected ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {optLetter}
                        </span>
                        <span className="text-xs md:text-sm flex-1">{opt}</span>
                        {isSelected && <CheckCircle2 size={18} className="text-amber-600 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {/* Navigation Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx((prev) => Math.max(prev - 1, 0))}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft size={15} /> Previous
                  </button>

                  {activeQuestionIdx < totalQ - 1 ? (
                    <button
                      onClick={() => setActiveQuestionIdx((prev) => Math.min(prev + 1, totalQ - 1))}
                      className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      Next Question <ChevronRight size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConfirmSubmit(true)}
                      className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      Review & Submit <Check size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Question Palette Matrix */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers size={14} className="text-amber-500" /> Question Palette
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    {answeredCount} / {totalQ} Answered
                  </span>
                </div>

                {/* Palette Grid of 1..N */}
                <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
                  {activeCbtExam.questions.map((q, idx) => {
                    const isAns = selectedAnswers[q.id] !== undefined
                    const isFlg = flaggedQuestions.has(q.id)
                    const isCurr = activeQuestionIdx === idx

                    let btnStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    if (isAns) btnStyle = 'bg-emerald-500 text-white font-bold shadow-xs'
                    if (isFlg) btnStyle = 'bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-500'

                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveQuestionIdx(idx)}
                        className={`w-full aspect-square rounded-xl text-xs font-black transition flex items-center justify-center relative cursor-pointer ${btnStyle} ${
                          isCurr ? 'ring-2 ring-slate-950 ring-offset-2 scale-105' : ''
                        }`}
                      >
                        {idx + 1}
                        {isFlg && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-600 rounded-full border border-white" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-amber-400 shrink-0" />
                    <span>Flagged for Review ({flaggedQuestions.size})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-slate-200 shrink-0" />
                    <span>Unanswered ({totalQ - answeredCount})</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={15} /> Finish & Submit Assessment
                </button>
              </div>
            </div>
          </div>

          {/* CONFIRM SUBMISSION MODAL */}
          {showConfirmSubmit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-5 my-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Submit CBT Examination?</h3>
                  <p className="text-xs text-slate-500">
                    Are you ready to submit your assessment? Once submitted, your answers will be automatically graded.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex justify-between">
                    <span>Total Questions:</span>
                    <strong className="text-slate-900">{totalQ}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Answered:</span>
                    <strong>{answeredCount}</strong>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Unanswered:</span>
                    <strong>{totalQ - answeredCount}</strong>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmSubmit(false)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer"
                  >
                    Back to Test
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingExam}
                    onClick={() => handleSubmitCbtExam(false)}
                    className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingExam ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Confirm Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    // DEFAULT: LIST OF ACTIVE CBT EXAMS
    return (
      <div className="space-y-6 pb-12 font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="text-amber-500" size={24} />
              CBT Tests & Online Examinations
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Take scheduled online CBT assessments and view real-time scores.
            </p>
          </div>

          <button
            onClick={fetchCbtExams}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} /> Refresh Exams
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Available Online CBT Exams ({examsList.length})
          </h3>

          {loadingCbtList ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="animate-spin text-amber-500" size={28} />
              <p className="text-xs font-semibold">Loading active examinations...</p>
            </div>
          ) : examsList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {examsList.map((exam) => {
                const isCompleted = exam.isSubmitted || exam.submitted
                const examScore = exam.totalMark !== null && exam.totalMark !== undefined ? exam.totalMark : exam.score

                return (
                  <div key={exam.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between hover:border-amber-400/60 transition">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md">
                          {exam.subjectName}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isCompleted ? 'Completed' : 'Available to Take'}
                        </span>
                      </div>

                      <h4 className="font-black text-slate-900 text-sm mt-2">{exam.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>Duration: <strong className="text-slate-700">{exam.duration || 30} Mins</strong></span>
                        <span>&bull;</span>
                        <span>Pass Mark: <strong className="text-slate-700">{exam.passingMark || 50}%</strong></span>
                      </p>
                    </div>

                    {isCompleted ? (
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><CheckCircle2 size={15} /> Completed</span>
                        <span className="font-mono text-sm font-black">{examScore !== null ? `${examScore}%` : 'Graded'}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartCbtExam(exam.id)}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap size={14} /> Start CBT Assessment
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No online CBT tests currently active for your class.
            </div>
          )}
        </div>

        {/* MODAL: AUTO-GRADING RESULT SUMMARY */}
        {cbtResultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
              <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-center space-y-2">
                <span className="px-3 py-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full uppercase">
                  Auto-Grading Complete
                </span>
                <h2 className="text-xl font-black tracking-tight">Assessment Performance Summary</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Circular Score Gauge */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-amber-500 flex flex-col items-center justify-center shadow-md">
                    <span className="text-2xl font-black text-slate-900">{cbtResultModal.percentage}%</span>
                    <span className="text-[10px] font-bold text-slate-500">Grade: {cbtResultModal.grade}</span>
                  </div>

                  <span
                    className={`px-4 py-1 rounded-full text-xs font-black uppercase ${
                      cbtResultModal.isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {cbtResultModal.isPassed ? 'Passed' : 'Needs Improvement'}
                  </span>
                </div>

                {/* Score Breakdown Cards */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700">Correct</span>
                    <p className="text-lg font-black text-emerald-900">{cbtResultModal.correctCount}</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700">Wrong</span>
                    <p className="text-lg font-black text-rose-900">{cbtResultModal.wrongCount}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600">Unanswered</span>
                    <p className="text-lg font-black text-slate-900">{cbtResultModal.unansweredCount}</p>
                  </div>
                </div>

                {/* Detailed Breakdown Review (if showResults is enabled) */}
                {cbtResultModal.showResults && cbtResultModal.breakdown && cbtResultModal.breakdown.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Questions Review & Key
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {cbtResultModal.breakdown.map((item, bIdx) => (
                        <div
                          key={bIdx}
                          className={`p-3 rounded-xl border text-xs space-y-1 ${
                            item.isCorrect
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                              : 'bg-rose-50/70 border-rose-200 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>#{bIdx + 1} {item.questionText}</span>
                            <span className="font-mono">{item.marksAwarded} / {item.marksPossible} Marks</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span>Your Answer: <strong>{item.studentAnswer}</strong></span>
                            <span>&bull;</span>
                            <span>Correct Key: <strong>{item.correctAnswer}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setCbtResultModal(null)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-xs transition cursor-pointer"
                >
                  Return to CBT Portal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 11. ATTENDANCE SUB-VIEW
  if (activeSection === 'attendance') {
    const attData = attendance || dashboardOverview?.attendance || { percentage: 100, totalDays: 0, presentCount: 0, absentCount: 0, lateCount: 0, logs: [] }

    return (
      <div className="space-y-6 pb-12 font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="text-emerald-600" size={24} />
              Term Attendance Records & Daily Roll Call
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Class: <span className="font-bold text-slate-900">{profile.className} {profile.sectionName}</span>
            </p>
          </div>
        </div>

        {/* 4 Attendance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Attendance Rate</span>
            <h3 className="text-2xl font-black text-emerald-600">{attData.percentage}%</h3>
            <p className="text-[10px] text-slate-500">Overall Term Rate</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Present Days</span>
            <h3 className="text-2xl font-black text-slate-900">{attData.presentCount}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold">Punctual attendance</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Late Days</span>
            <h3 className="text-2xl font-black text-amber-600">{attData.lateCount}</h3>
            <p className="text-[10px] text-amber-600 font-semibold">Late arrivals</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Absent Days</span>
            <h3 className="text-2xl font-black text-rose-600">{attData.absentCount}</h3>
            <p className="text-[10px] text-rose-600 font-semibold">Excused / unexcused</p>
          </div>
        </div>

        {/* Attendance Daily Logs Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Daily Attendance History ({attData.logs.length})
            </h3>
          </div>

          {attData.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attData.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-bold text-slate-900">
                        {new Date(log.attendanceDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${log.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (log.status === 'Late' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200')}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 italic">{log.remark || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No daily roll call logs recorded yet.
            </div>
          )}
        </div>
      </div>
    )
  }

  // 12. COMMUNICATION / MESSAGES SUB-VIEW
  if (activeSection === 'communication' || activeSection === 'messages') {
    return (
      <div className="space-y-6 pb-12 font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Mail className="text-indigo-600" size={24} />
              Messages & Inquiries
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Communicate directly with your Form Teacher, Subject Teachers, and School Administration.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedRecipientId(null)
              setRecipientRole('TEACHER')
              setRecipientName('Form Teacher / School Admin')
              setShowMsgModal(true)
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
          >
            <Plus size={15} />
            <span>New Message</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Sent Inquiries & Replies ({studentMessages.length})</h3>
          {studentMessages.length > 0 ? (
            <div className="space-y-3">
              {studentMessages.map((msg) => (
                <div key={msg.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase">
                      To: {msg.recipientRole}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{msg.subject || 'Student Inquiry'}</h4>
                  <p className="text-xs text-slate-600">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No messages sent yet. Click &quot;New Message&quot; above to reach your teachers.
            </div>
          )}
        </div>
      </div>
    )
  }

  // 13. SETTINGS & PROFILE SUB-VIEW
  if (activeSection === 'settings' || activeSection === 'profile') {
    return (
      <div className="space-y-6 pb-12 font-sans max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Lock className="text-slate-700" size={22} />
            Security & Account Password
          </h2>
          <p className="text-xs text-slate-500">Update your student portal login password securely.</p>

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer transition"
            >
              {updatingPassword ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Derived values grounded strictly in real DB data
  const studentName = `${profile.firstName} ${profile.lastName}`
  const firstName = profile.firstName
  const rawRank = dashboardOverview?.kpi?.classRank ?? grades?.rank
  const userRankText = rawRank ? `${rawRank}${getOrdinal(rawRank)}` : 'N/A'
  
  const totalClass = dashboardOverview?.kpi?.totalClassStudents || grades?.totalClassStudents || profile.fellowStudentsCount || 0
  const overallAvg = dashboardOverview?.kpi?.averageScore !== undefined ? `${dashboardOverview.kpi.averageScore}%` : (grades?.overallAverage !== undefined ? `${grades.overallAverage}%` : '0%')
  const attendancePct = dashboardOverview?.kpi?.attendancePercentage !== undefined ? `${dashboardOverview.kpi.attendancePercentage}%` : (attendance?.percentage !== undefined ? `${attendance.percentage}%` : '0%')
  const behaviourRating = dashboardOverview?.kpi?.behaviourRating || 'Good'

  const timetableList = dashboardOverview?.todayTimetable || []
  const homeworksList = dashboardOverview?.upcomingHomeworks || []
  const examsList = dashboardOverview?.upcomingExams || []
  const hwProgress = dashboardOverview?.homeworkProgress || { percentage: 0, completed: 0, pending: 0, overdue: 0 }
  const attSummary = dashboardOverview?.attendance || { percentage: 100, presentCount: 0, lateCount: 0, absentCount: 0 }
  const feeInfo = dashboardOverview?.feeStatus || { status: 'Unknown', totalBilled: 0, totalPaid: 0, outstanding: 0, nextTermDate: null }

  const subjectPerformance = dashboardOverview?.subjectPerformance || []
  const barColors = ['bg-blue-600', 'bg-emerald-500', 'bg-purple-600', 'bg-amber-500', 'bg-cyan-500', 'bg-rose-500']

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Filtered Study Checklist Tasks
  const filteredReminders = remindersList.filter(r => {
    if (reminderFilter === 'PENDING') return !r.done
    if (reminderFilter === 'DONE') return r.done
    return true
  })
  const completedRemindersCount = remindersList.filter(r => r.done).length

  // MAIN OVERVIEW DASHBOARD VIEW
  return (
    <div className="space-y-6 text-slate-900 pb-12 font-sans">

      {/* Main Grid: Left Main Content (col-8) + Right Widget Sidebar (col-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Columns: Main Dashboard Content */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Top Hero Welcome Banner */}
          <div className="relative rounded-3xl bg-gradient-to-r from-[#070D22] via-[#0E1A42] to-[#12245A] p-6 sm:p-8 text-white shadow-xl border border-white/10 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Left Welcome Info */}
            <div className="relative z-10 flex items-center gap-5">
              <div className="relative shrink-0">
                <img
                  src={getAvatarUrl(profile.photo, studentName)}
                  alt={studentName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/30 shadow-xl"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0E1A42]" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs text-blue-100 inline-flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-yellow-300" />
                  Student Portal
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Welcome, {firstName}! 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Class: <span className="text-white font-bold">{profile.className || 'Unassigned'} {profile.sectionName || ''}</span> &bull; Reg: <span className="text-white font-bold">{profile.registerNo || 'N/A'}</span>
                </p>
              </div>
            </div>

            {/* Right Date Box */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-xs space-y-1 shrink-0 min-w-[200px]">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Calendar size={15} className="text-sky-400 shrink-0" />
                <span>{currentDateFormatted}</span>
              </div>
              <p className="text-[11px] text-slate-300">Session: <span className="font-semibold text-white">2026 Academic Term</span></p>
            </div>

          </div>

          {/* 2. Top 4 Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Card 1: Average Score (Real DB) */}
            <div 
              onClick={() => onNavigate?.('results')}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:border-emerald-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Star size={20} className="fill-emerald-600" />
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Score</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{overallAvg}</h3>
                <p className="text-[11px] font-bold text-emerald-600 mt-1">DB Grade Average</p>
              </div>
            </div>

            {/* Card 2: Class Position (Real DB) */}
            <div 
              onClick={() => onNavigate?.('results')}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:border-purple-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Trophy size={20} />
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Position</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{userRankText}</h3>
                <p className="text-[11px] font-medium text-slate-500 mt-1">out of {totalClass} students</p>
              </div>
            </div>

            {/* Card 3: Attendance (Real DB) */}
            <div 
              onClick={() => onNavigate?.('attendance')}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:border-blue-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <ShieldCheck size={20} />
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attendance</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{attendancePct}</h3>
                <p className="text-[11px] font-bold text-blue-600 mt-1">Term Roll Call</p>
              </div>
            </div>

            {/* Card 4: Behaviour Rating */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Smile size={20} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Behaviour Rating</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{behaviourRating}</h3>
                <p className="text-[11px] font-medium text-amber-600 mt-1">Punctuality Record</p>
              </div>
            </div>

          </div>

          {/* 3. Middle Row: Today's Timetable & Upcoming Assignments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Today's Timetable */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Clock size={16} className="text-purple-600" />
                    <span>Today&apos;s Timetable</span>
                  </h3>
                  <button 
                    onClick={() => onNavigate?.('timetable')} 
                    className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Schedule</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {timetableList.length > 0 ? (
                  <div className="space-y-2.5">
                    {timetableList.map((slot: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-100/70 transition">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-purple-700 block">{slot.startTime} - {slot.endTime}</span>
                          <span className="font-bold text-slate-900 text-sm mt-0.5 block">{slot.title}</span>
                          <span className="text-[10px] text-slate-500 block">Teacher: {slot.teacherName || 'Form Teacher'}</span>
                        </div>
                        <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                          {slot.roomLabel || 'Classroom'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    No class periods scheduled for today.
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Homeworks */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FileText size={16} className="text-blue-600" />
                    <span>Upcoming Assignments</span>
                  </h3>
                  <button 
                    onClick={() => onNavigate?.('assignments')} 
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>

                {homeworksList.length > 0 ? (
                  <div className="space-y-2.5">
                    {homeworksList.map((hw: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => handleOpenHwSubmit(hw)}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-300 hover:bg-slate-100/60 transition cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                            <FileText size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{hw.title}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${hw.submitted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {hw.submitted ? '✓ Submitted' : hw.deadlineBadge || 'Pending'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenHwSubmit(hw)
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow-2xs ${
                              hw.submitted
                                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {hw.submitted ? 'View' : 'Attempt'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    No pending homework assignments.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 4. Subject Performance Bars & Fee Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Subject Performance */}
            <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Subject Performance Breakdown</h3>
                <button 
                  onClick={() => onNavigate?.('results')}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Full Report Card
                </button>
              </div>

              {subjectPerformance.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {subjectPerformance.map((sub, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>{sub.name}</span>
                        <span>{sub.score}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${barColors[idx % barColors.length]}`} 
                          style={{ width: `${Math.min(100, Math.max(0, sub.score))}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs italic">
                  No subject grade records published yet.
                </div>
              )}
            </div>

            {/* Fee Status Strip */}
            <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <DollarSign size={15} className="text-emerald-600" />
                    <span>Fee Balance Status</span>
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${feeInfo.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {feeInfo.status}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Outstanding Balance</span>
                  <span className="text-xl font-black text-slate-900">₦{(feeInfo.outstanding || 0).toLocaleString()}</span>
                  <p className="text-[10px] text-slate-500">Total Billed: ₦{(feeInfo.totalBilled || 0).toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate?.('school-fees')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard size={14} />
                <span>View Bank Account & Invoices</span>
              </button>
            </div>

          </div>

        </div>

        {/* Right 4 Columns: Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Sidebar Widget 1: Attendance Donut Ring */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Attendance Summary</h3>
            <div className="flex items-center gap-4">
              <SVGDonutChart percentage={attSummary.percentage} centerLabel="Attendance" color="#10B981" size={105} />
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-600 font-semibold">Present:</span>
                  <span className="font-bold text-slate-900">{attSummary.presentCount} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-600 font-semibold">Late:</span>
                  <span className="font-bold text-slate-900">{attSummary.lateCount} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-slate-600 font-semibold">Absent:</span>
                  <span className="font-bold text-slate-900">{attSummary.absentCount} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Widget 2: Interactive Study Checklist (Real DB CRUD) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <ListTodo size={15} className="text-indigo-600" />
                <span>Personal Study Checklist</span>
              </h3>
              <span className="text-[10px] text-indigo-600 font-bold">
                {completedRemindersCount}/{remindersList.length} Done
              </span>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold text-slate-600">
              <button
                onClick={() => setReminderFilter('ALL')}
                className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${reminderFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                onClick={() => setReminderFilter('PENDING')}
                className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${reminderFilter === 'PENDING' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setReminderFilter('DONE')}
                className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${reminderFilter === 'DONE' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'}`}
              >
                Done
              </button>
            </div>

            {/* Add task form */}
            <form onSubmit={handleAddReminder} className="flex gap-2">
              <input
                type="text"
                placeholder="Add study task..."
                value={newReminderText}
                onChange={(e) => setNewReminderText(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={addingReminder || !newReminderText.trim()}
                className="px-3 py-1.5 bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 cursor-pointer transition"
              >
                {addingReminder ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </form>

            {/* Reminders List */}
            <div className="space-y-1.5 pt-1 max-h-60 overflow-y-auto pr-1">
              {filteredReminders.length > 0 ? (
                filteredReminders.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleToggleReminder(r.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 group text-left text-xs transition cursor-pointer border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
                      {r.done ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                      )}
                      <span className={`font-medium truncate ${r.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {r.text}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteReminder(r.id, e)}
                      title="Delete Task"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs italic">
                  {reminderFilter === 'DONE' ? 'No completed tasks yet.' : 'Study checklist empty. Add your tasks above!'}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Widget 3: Live Announcements */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Bell size={15} className="text-amber-500" />
              <span>School Announcements</span>
            </h3>
            {dashboardOverview?.announcements && dashboardOverview.announcements.length > 0 ? (
              <div className="space-y-3">
                {dashboardOverview.announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <span className="text-[10px] font-mono text-slate-400 block">{new Date(ann.startDate).toLocaleDateString()}</span>
                    <h4 className="font-bold text-slate-900">{ann.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{ann.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs italic">
                No active announcements today.
              </div>
            )}
          </div>

        </div>

      </div>



      {/* Message Modal */}
      {showMsgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail className="text-indigo-600" size={20} />
                Send Inquiry / Message
              </h3>
              <button
                onClick={() => setShowMsgModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {msgSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {msgSuccess}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient</label>
                <input
                  type="text"
                  readOnly
                  value={recipientName || 'Form Teacher / Admin'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Question about homework assignment"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Body *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your message..."
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMsgModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  {sendingMsg ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
