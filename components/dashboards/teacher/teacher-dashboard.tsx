'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  CheckSquare, 
  Activity,
  Award,
  CheckCircle,
  FileText,
  UserCheck,
  Calendar,
  GraduationCap,
  AlertCircle,
  PlusCircle,
  Search,
  Save,
  Clock,
  Download,
  Loader2,
  Sparkles,
  Upload,
  ChevronRight,
  ArrowRight,
  Bot,
  Bell,
  MessageSquare,
  ChevronLeft,
  CheckCircle2,
  ListTodo,
  PieChart,
  BarChart3,
  Sliders,
  CalendarDays,
  FileSpreadsheet,
  FilePlus,
  Edit3,
  Plus,
  X,
  Mail,
  Phone,
  MapPin,
  User,
  Eye,
  Check,
  Camera,
  ImageIcon,
} from 'lucide-react'
import { SchoolHeader } from '../school-header'
import { safeStorage } from '@/lib/safeStorage'
import { apiSlice, endpoints } from '../../../lib/apiSlice'
import { showSystemStatus, resolveHttpStatus } from '@/lib/systemStatus'
import GradebookInterface from './gradebook-interface'
import MontessoriMatrix from './montessori-matrix'
import AttendanceRegister from './attendance-register'
import { MediaLibrary } from './media-library'
import { AiLessonPlanner } from './ai-lesson-planner'
import { LiveClassroomHub } from './live-classroom-hub'
import TeacherPointsHub from './points-hub'
import { TeacherAttritionRadar } from './attrition-radar'
import { QuestionBankManager } from './question-bank-manager'
import { HomeworkQuestionStudio, type HomeworkAllocation } from '@/components/dashboards/shared/homework-question-studio'
import { TeacherSubjectsHub } from './teacher-subjects-hub'
import { TeacherTimetableView } from './teacher-timetable-view'
import { SubjectTeacherDashboard, TeacherCommunicationInbox } from './subject-teacher-dashboard'
import SchoolCalendar from '../admin/school-calendar'
import { getAvatarUrl } from '@/lib/avatar'
import { TeacherClassesManager } from './teacher-classes-manager'
import { TeacherMatrixMarksEntry } from './teacher-matrix-marks-entry'
import { TeacherAssignmentsManager } from './teacher-assignments-manager'
import { TeacherBroadReports } from './teacher-broad-reports'
import { ReportCardManagement } from '../admin/report-card-management'

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
  }
  activeSection?: string
  onNavigate?: (section: string) => void
  onIdentityChange?: (identity: {
    name: string
    photo: string | null
    title: string
  } | null) => void
}

interface FormAllocation {
  classId: number
  className: string
  sectionId: number
  sectionName: string
  sessionId: number
  isEcd?: boolean
}

interface SubjectAssignment {
  classId: number
  className: string
  sectionId: number
  sectionName: string
  subjectId: number
  subjectName: string
  sessionId: number
  isEcd?: boolean
}

interface TeacherProfile {
  teacherId: number
  name?: string
  email?: string | null
  phone?: string | null
  photo?: string | null
  department?: string | null
  qualifications?: string | null
  isFormTeacher: boolean
  isSubjectTeacher: boolean
  formAllocations: FormAllocation[]
  subjectAssignments: SubjectAssignment[]
  branchName?: string
  primaryForm?: string
}

interface DashboardOverviewData {
  profile: {
    teacherId: number
    name: string
    email: string | null
    phone: string | null
    photo: string | null
    branchName: string
    primaryForm: string
  }
  kpi: {
    studentsCount: number
    presentTodayCount: number
    subjectsCount: number
    assignmentsCount: number
    pendingReviewCount: number
    testsCount: number
    ongoingTestsCount: number
    classAverage: number
  }
  attendance: {
    overallPercentage: number
    presentCount: number
    lateCount: number
    absentCount: number
    presentPct: number
    latePct: number
    absentPct: number
  }
  subjectPerformance: Array<{
    name: string
    score: number
  }>
  teachingSummary: {
    lessonNotesCount: number
    assignmentsGivenCount: number
    testsCreatedCount: number
    scoresEnteredPct: number
  }
  subjects: Array<{
    id: number
    name: string
    studentsCount: number
    score: number
    nextLesson: string
  }>
  myClasses: Array<{
    name: string
    role: string
    studentsCount: number
  }>
  academicRoles?: {
    isClassTeacher: boolean
    isSubjectTeacher: boolean
    classTeacherClasses: Array<{
      allocationId: number
      classId: number
      className: string
      sectionId: number
      sectionName: string
      studentCount: number
      subjectsOffered: Array<{
        assignmentId: number
        subjectId: number
        subjectName: string
        subjectCode: string
        subjectType: string
        assignedTeacherId: number | null
        assignedTeacherName: string
      }>
    }>
    subjectTeacherSubjects: Array<{
      subjectId: number
      subjectName: string
      subjectCode: string
      classes: Array<{
        assignmentId: number
        classId: number
        className: string
        sectionId: number
        sectionName: string
        studentCount: number
      }>
    }>
  }
  reminders: Array<{
    id: number
    text: string
    subtext?: string
    done: boolean
  }>
  recentActivities: Array<{
    id: number
    text: string
    timestamp: string
    icon: string
  }>
}

interface RosterStudent {
  id: number
  registerNo: string | null
  rollNo: number | null
  firstName: string
  lastName: string
  gender: string
  photo: string | null
  className: string
  sectionName: string
  parent: {
    id: number
    name: string
    fatherName: string | null
    motherName: string | null
    mobileno: string | null
    email: string | null
    address: string | null
  } | null
}

// Donut Chart Helper
function SVGDonutChart({ 
  percentage, 
  centerLabel, 
  color = '#10B981', 
  bgTrack = '#E2E8F0',
  size = 130,
  strokeWidth = 12
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
  const strokeDashoffset = circumference - (percentage / 100) * circumference

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
        <span className="text-xl font-black text-slate-900 leading-none">{percentage}%</span>
        <span className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{centerLabel}</span>
      </div>
    </div>
  )
}

export function TeacherDashboard({ user, activeSection, onNavigate, onIdentityChange }: DashboardProps) {
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [remindersList, setRemindersList] = useState<Array<{ id: number; text: string; subtext?: string; done: boolean }>>([])

  // Student Roster State
  const [rosterStudents, setRosterStudents] = useState<RosterStudent[]>([])
  const [loadingRoster, setLoadingRoster] = useState<boolean>(false)

  // Parent Message Modal State
  const [showMsgModal, setShowMsgModal] = useState<boolean>(false)
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [selectedParentName, setSelectedParentName] = useState<string>('')
  const [msgSubject, setMsgSubject] = useState<string>('')
  const [msgBody, setMsgBody] = useState<string>('')
  const [sendingMsg, setSendingMsg] = useState<boolean>(false)
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null)

  // New Reminder Input State
  const [newReminderText, setNewReminderText] = useState<string>('')
  const [addingReminder, setAddingReminder] = useState<boolean>(false)

  // Homework Management State
  const [homeworksList, setHomeworksList] = useState<any[]>([])
  const [loadingHomeworks, setLoadingHomeworks] = useState<boolean>(false)
  const [showCreateHwModal, setShowCreateHwModal] = useState<boolean>(false)
  const [showHwStudio, setShowHwStudio] = useState<boolean>(false)
  const [hwStudioKey, setHwStudioKey] = useState(0)

  // New Homework Form State
  const [hwTitle, setHwTitle] = useState<string>('')
  const [hwDescription, setHwDescription] = useState<string>('')
  const [hwClassId, setHwClassId] = useState<string>('')
  const [hwSubjectId, setHwSubjectId] = useState<string>('')
  const [hwDueDate, setHwDueDate] = useState<string>('')
  const [hwTermName, setHwTermName] = useState<string>('First Term')
  const [hwQuestions, setHwQuestions] = useState<any[]>([])
  const [publishingHw, setPublishingHw] = useState<boolean>(false)

  // Master Question Bank Import Modal State
  const [showQBankImportModal, setShowQBankImportModal] = useState<boolean>(false)
  const [qBankItems, setQBankItems] = useState<any[]>([])
  const [loadingQBank, setLoadingQBank] = useState<boolean>(false)
  const [selectedQBankIds, setSelectedQBankIds] = useState<number[]>([])

  // Submissions Drawer/Modal State
  const [selectedHwForSubmissions, setSelectedHwForSubmissions] = useState<any | null>(null)
  const [hwSubmissions, setHwSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false)

  // Submissions Grading State
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null)
  const [gradeScore, setGradeScore] = useState<string>('')
  const [gradeFeedback, setGradeFeedback] = useState<string>('')
  const [savingGrade, setSavingGrade] = useState<boolean>(false)

  const homeworkAllocations: HomeworkAllocation[] = useMemo(
    () =>
      (profile?.subjectAssignments || []).map((sa) => ({
        classId: sa.classId,
        className: sa.className,
        subjectId: sa.subjectId,
        subjectName: sa.subjectName,
        sectionName: sa.sectionName,
      })),
    [profile]
  )

  // Self-Service Photograph Upload Modal State
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false)
  const [selfPhotoFile, setSelfPhotoFile] = useState<string | null>(null)
  const [uploadingSelfPhoto, setUploadingSelfPhoto] = useState<boolean>(false)
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null)

  const handleUploadSelfPhoto = async () => {
    if (!selfPhotoFile) return
    setUploadingSelfPhoto(true)
    setPhotoUploadError(null)
    try {
      const res = await apiSlice.post<{ success: boolean; photo: string }>(
        endpoints.teacher.uploadPhoto,
        { photo: selfPhotoFile }
      )
      if (res.success && res.photo) {
        setProfile(prev => prev ? { ...prev, photo: res.photo } : null)
        setShowPhotoModal(false)
        setSelfPhotoFile(null)
      }
    } catch (err: any) {
      setPhotoUploadError(err?.message || 'Failed to update photograph.')
    } finally {
      setUploadingSelfPhoto(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadTeacherData() {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch Aggregated Overview (New API)
        const overviewRes = await apiSlice.get<{ success: boolean } & DashboardOverviewData>(endpoints.teacher.dashboardOverview).catch(() => null)
        if (!active) return

        if (overviewRes && overviewRes.success) {
          setDashboardOverview(overviewRes)
          setRemindersList(overviewRes.reminders || [])
        }

        // 2. Fetch Profile
        const profileRes = await apiSlice.get<{ success: boolean } & TeacherProfile>(endpoints.teacher.profile).catch(() => null)
        if (!active) return

        if (profileRes && profileRes.success) {
          setProfile(profileRes)
          onIdentityChange?.({
            name: profileRes.name || user.username,
            photo: profileRes.photo || null,
            title: profileRes.isSubjectTeacher
              ? 'Subject Teacher'
              : profileRes.isFormTeacher
                ? 'Form Teacher'
                : 'Teacher',
          })
        } else if (overviewRes?.profile) {
          setProfile({
            teacherId: overviewRes.profile.teacherId,
            name: overviewRes.profile.name,
            email: overviewRes.profile.email,
            phone: overviewRes.profile.phone,
            photo: overviewRes.profile.photo,
            isFormTeacher: true,
            isSubjectTeacher: true,
            formAllocations: [],
            subjectAssignments: [],
            branchName: overviewRes.profile.branchName,
            primaryForm: overviewRes.profile.primaryForm
          })
          onIdentityChange?.({
            name: overviewRes.profile.name || user.username,
            photo: overviewRes.profile.photo || null,
            title: 'Subject Teacher',
          })
        } else {
          throw new Error('Failed to load teacher profile data.')
        }

      } catch (err: any) {
        if (active) {
          setError(err.message || 'Error communicating with school backend server.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTeacherData()

    return () => {
      active = false
    }
  }, [user])

  // Fetch Student Roster with Parent Contacts when entering Roster tab
  useEffect(() => {
    if (activeSection === 'roster' || activeSection === 'my-classes' || activeSection === 'my-students') {
      async function fetchRoster() {
        try {
          setLoadingRoster(true)
          const res = await apiSlice.get<{ success: boolean; students: RosterStudent[] }>(endpoints.teacher.roster)
          if (res.success) {
            setRosterStudents(res.students)
          }
        } catch (err) {
          console.error('Failed to fetch student roster:', err)
        } finally {
          setLoadingRoster(false)
        }
      }
      fetchRoster()
    }

    if (activeSection === 'assignments' || activeSection === 'homeworks') {
      async function fetchHomeworks() {
        try {
          setLoadingHomeworks(true)
          const res = await apiSlice.get<{ success: boolean; homeworks: any[] }>(endpoints.teacher.homeworks)
          if (res.success) setHomeworksList(res.homeworks || [])
        } catch (err) {
          console.error('Failed to fetch homeworks:', err)
        } finally {
          setLoadingHomeworks(false)
        }
      }
      fetchHomeworks()
    }
  }, [activeSection])

  const handleToggleReminder = async (id: number) => {
    try {
      setRemindersList(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r))
      await apiSlice.put(endpoints.teacher.toggleReminder(id), {})
    } catch (err) {
      console.error('Failed to toggle reminder:', err)
    }
  }

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReminderText.trim()) return
    try {
      setAddingReminder(true)
      const res = await apiSlice.post<{ success: boolean; reminder: any }>(endpoints.teacher.createReminder, {
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

  const handleSendParentMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParentId || !msgBody.trim()) return
    try {
      setSendingMsg(true)
      setMsgSuccess(null)
      const res = await apiSlice.post<{ success: boolean; message: string }>(endpoints.teacher.sendMessage, {
        parentId: selectedParentId,
        studentId: selectedStudentId,
        subject: msgSubject.trim() || 'Teacher Notice',
        message: msgBody.trim()
      })
      if (res.success) {
        setMsgSuccess('Message sent to parent successfully!')
        setMsgSubject('')
        setMsgBody('')
        setTimeout(() => {
          setShowMsgModal(false)
          setMsgSuccess(null)
        }, 1500)
      }
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err.message || 'Failed to send message to parent.'))
    } finally {
      setSendingMsg(false)
    }
  }

  const handleFetchQuestionBank = async () => {
    setShowQBankImportModal(true)
    setLoadingQBank(true)
    setSelectedQBankIds([])
    try {
      let query = ''
      const params = new URLSearchParams()
      if (hwSubjectId) params.append('subjectId', hwSubjectId)
      if (hwClassId) params.append('classId', hwClassId)
      if (hwTermName) params.append('termName', hwTermName)
      if (params.toString()) query = `?${params.toString()}`

      const res = await apiSlice.get<{ success: boolean; items?: any[] }>(endpoints.teacher.questionBank(query))
      if (res.success && res.items) {
        setQBankItems(res.items)
      } else {
        setQBankItems([])
      }
    } catch (err: any) {
      console.error('Failed to fetch Question Bank:', err)
      showSystemStatus(resolveHttpStatus(500, 'Unable to load Question Bank items.'))
    } finally {
      setLoadingQBank(false)
    }
  }

  const handleImportSelectedQuestions = () => {
    const selected = qBankItems.filter((q) => selectedQBankIds.includes(q.id))
    const formattedNew = selected.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      type: q.questionType === 'mcq' ? 'MCQ' : 'THEORY',
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctOption || '',
      points: q.marks || 1,
      termName: q.termName,
      topic: q.topic,
    }))

    setHwQuestions((prev) => [...prev, ...formattedNew])
    setShowQBankImportModal(false)
    setSelectedQBankIds([])
    showSystemStatus({
      type: 'ACTION_SUCCESS',
      title: 'Import Successful',
      message: `Imported ${formattedNew.length} question(s) from Master Question Bank!`,
    })
  }

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hwTitle.trim() || !hwClassId || !hwSubjectId || !hwDueDate) return
    const questionBankIds = hwQuestions.map((q) => Number(q.id)).filter((id) => Number.isInteger(id) && id > 0)
    if (!questionBankIds.length || questionBankIds.length !== hwQuestions.length) {
      showSystemStatus(resolveHttpStatus(400, 'Save or import questions from the Question Bank before assigning homework.'))
      return
    }
    try {
      setPublishingHw(true)
      const res = await apiSlice.post<{ success: boolean; homework: any; message: string }>(endpoints.teacher.homeworks, {
        title: hwTitle.trim(),
        description: hwDescription.trim(),
        classId: Number(hwClassId),
        subjectId: Number(hwSubjectId),
        dueDate: hwDueDate,
        termName: hwTermName,
        questionBankIds,
      })
      if (res.success && res.homework) {
        setHomeworksList(prev => [res.homework, ...prev])
        setHwTitle('')
        setHwDescription('')
        setHwClassId('')
        setHwSubjectId('')
        setHwDueDate('')
        setHwTermName('First Term')
        setHwQuestions([])
        setShowCreateHwModal(false)
        showSystemStatus({
          type: 'ACTION_SUCCESS',
          title: 'Successfully completed.',
          message: 'Homework assignment published successfully!'
        })
      }
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err.message || 'Failed to publish homework.'))
    } finally {
      setPublishingHw(false)
    }
  }

  const handleViewSubmissions = async (hw: any) => {
    setSelectedHwForSubmissions(hw)
    try {
      setLoadingSubmissions(true)
      const res = await apiSlice.get<{ success: boolean; submissions: any[] }>(endpoints.teacher.homeworkSubmissions(hw.id))
      if (res.success) setHwSubmissions(res.submissions || [])
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleSaveSubmissionGrade = async (submissionId: number) => {
    try {
      setSavingGrade(true)
      const res = await apiSlice.post<{ success: boolean; submission: any; message: string }>(
        endpoints.teacher.gradeHomework(submissionId),
        { score: gradeScore ? Number(gradeScore) : null, feedback: gradeFeedback }
      )
      if (res.success) {
        setHwSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, score: res.submission.score, feedback: res.submission.feedback } : s))
        setGradingSubmissionId(null)
        setGradeScore('')
        setGradeFeedback('')
        showSystemStatus({
          type: 'ACTION_SUCCESS',
          title: 'Successfully completed.',
          message: 'Submission graded successfully!'
        })
      }
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err.message || 'Failed to save grade.'))
    } finally {
      setSavingGrade(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Syncing teacher portal workspace...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 flex flex-col items-center gap-4 text-center max-w-lg mx-auto mt-10">
        <AlertCircle className="text-rose-600" size={32} />
        <div>
          <h3 className="font-extrabold text-slate-900">Dashboard Loading Failed</h3>
          <p className="text-xs font-semibold text-rose-600 mt-1">{error || 'Unable to load teacher records.'}</p>
        </div>
      </div>
    )
  }

  if (
    activeSection === 'gradebook' ||
    activeSection === 'grades' ||
    activeSection === 'scores' ||
    activeSection === 'student-scores' ||
    activeSection === 'marks' ||
    activeSection === 'cbt-scores' ||
    activeSection === 'marks-entry'
  ) {
    return <TeacherMatrixMarksEntry />
  }

  // MY CLASSES & ENROLLED STUDENTS
  if (activeSection === 'roster' || activeSection === 'my-classes' || activeSection === 'my-students') {
    return <TeacherClassesManager onNavigate={onNavigate} />
  }

  // REPORT CARDS (RESTRICTED TO TEACHER'S ASSIGNED CLASSES)
  if (activeSection === 'report-cards' || activeSection === 'report-card') {
    const allowedClassIds = (profile?.formAllocations || []).map((a) => a.classId)
    return (
      <div className="space-y-6 pb-12 font-sans">
        <ReportCardManagement allowedClassIds={allowedClassIds.length > 0 ? allowedClassIds : undefined} />
      </div>
    )
  }

  // HOMEWORK & ASSIGNMENTS MANAGEMENT (ONLINE & OFFLINE)
  if (activeSection === 'assignments' || activeSection === 'homeworks') {
    return <TeacherAssignmentsManager />
  }

  const normalizedProfile = profile ? { ...profile, id: profile.teacherId } : undefined

  if (activeSection === 'attendance') {
    return <AttendanceRegister
      formAllocations={profile?.formAllocations || []}
      schoolName={profile?.branchName}
      teacherName={profile?.name || user.username}
    />
  }
  if (activeSection === 'ai-planner' || activeSection === 'lesson-plan') {
    return <AiLessonPlanner profile={normalizedProfile as any} />
  }
  if (activeSection === 'media') {
    return <MediaLibrary teacherId={profile?.teacherId || user?.id || 0} />
  }
  if (activeSection === 'liveRooms') {
    return <LiveClassroomHub profile={normalizedProfile as any} />
  }
  if (activeSection === 'points-hub') {
    return <TeacherPointsHub />
  }
  if (activeSection === 'attrition' || activeSection === 'subject-reports') {
    return <TeacherAttritionRadar />
  }
  if (activeSection === 'class-reports' || activeSection === 'reports') {
    return <TeacherBroadReports />
  }
  if (activeSection === 'cbt-exams' || activeSection === 'question-bank') {
    return <QuestionBankManager profile={profile} />
  }
  if (activeSection === 'subjects' || activeSection === 'my-subjects' || activeSection === 'subject-session') {
    return <TeacherSubjectsHub profile={profile} onNavigate={onNavigate} />
  }
  if (activeSection === 'calendar') {
    return <SchoolCalendar user={user} />
  }
  if (activeSection === 'timetable' || activeSection === 'schedule') {
    return <TeacherTimetableView />
  }
  if (activeSection === 'communication') {
    return <TeacherCommunicationInbox />
  }
  if (!activeSection || activeSection === 'overview') {
    if (profile.isSubjectTeacher) {
      return <SubjectTeacherDashboard onNavigate={onNavigate} />
    }
  }

  // Derived values grounded strictly in real DB data
  const teacherName = profile.name || user.username
  const primaryForm = profile.primaryForm || (profile.formAllocations[0] ? `${profile.formAllocations[0].className} ${profile.formAllocations[0].sectionName}` : 'Unassigned Class')
  
  const studentsCount = dashboardOverview?.kpi?.studentsCount ?? 0
  const presentTodayCount = dashboardOverview?.kpi?.presentTodayCount ?? 0
  const subjectsCount = dashboardOverview?.kpi?.subjectsCount ?? 0
  const assignmentsCount = dashboardOverview?.kpi?.assignmentsCount ?? 0
  const pendingReviewCount = dashboardOverview?.kpi?.pendingReviewCount ?? 0
  const testsCount = dashboardOverview?.kpi?.testsCount ?? 0
  const ongoingTestsCount = dashboardOverview?.kpi?.ongoingTestsCount ?? 0
  const classAverage = dashboardOverview?.kpi?.classAverage ?? 0

  const attSummary = dashboardOverview?.attendance || {
    overallPercentage: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    presentPct: 0,
    latePct: 0,
    absentPct: 0
  }

  const subjectPerformance = dashboardOverview?.subjectPerformance || []
  const teachingSummary = dashboardOverview?.teachingSummary || {
    lessonNotesCount: 0,
    assignmentsGivenCount: 0,
    testsCreatedCount: 0,
    scoresEnteredPct: 0
  }

  const subjectsList = dashboardOverview?.subjects || []
  const myClassesList = dashboardOverview?.myClasses || []
  const academicRoles = dashboardOverview?.academicRoles
  const classTeacherClasses = academicRoles?.classTeacherClasses || []
  const subjectTeacherSubjects = academicRoles?.subjectTeacherSubjects || []
  const recentActivitiesList = dashboardOverview?.recentActivities || []

  const subjectBarColors: Record<string, string> = {
    'Mathematics': 'bg-emerald-500',
    'English Language': 'bg-blue-600',
    'Basic Science': 'bg-purple-600',
    'Social Studies': 'bg-amber-500',
    'Computer Studies': 'bg-cyan-500'
  }

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Default Overview Dashboard View
  return (
    <div className="space-y-6 text-slate-900 pb-12 font-sans">

      {/* Main Grid Layout: Left Content (col-8) + Right Sidebar Column (col-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Columns: Main Dashboard Body */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Top Hero Welcome Banner */}
          <div className="relative rounded-3xl bg-gradient-to-r from-[#070D22] via-[#0E1A42] to-[#12245A] p-6 sm:p-8 text-white shadow-xl border border-white/10 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Left Hero Content with Avatar */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
              <div className="relative group/avatar shrink-0">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={teacherName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl object-cover border-2 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-linear-to-br from-blue-500 to-indigo-600 border-2 border-white/20 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg">
                    {(teacherName[0] || 'T').toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelfPhotoFile(null)
                    setPhotoUploadError(null)
                    setShowPhotoModal(true)
                  }}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition cursor-pointer border border-white/40"
                  title="Upload profile photograph"
                >
                  <Camera size={13} />
                </button>
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs text-blue-100 inline-flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-yellow-300" />
                  Teacher Workspace
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Good Day, {teacherName}! 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Connected with <span className="text-white font-bold">{profile.branchName || 'School Campus'}</span> &bull; Primary Class: <span className="text-white font-bold">{primaryForm}</span>
                </p>
              </div>
            </div>

            {/* Right Date Box */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-xs space-y-1 shrink-0">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Calendar size={15} className="text-sky-400 shrink-0" />
                <span>{currentDateFormatted}</span>
              </div>
            </div>

          </div>

          {/* 2. Top 5 Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            
            {/* Card 1: Students */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none">{studentsCount}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Students</p>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">{presentTodayCount} Present today</span>
              </div>
            </div>

            {/* Card 2: Subjects */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none">{subjectsCount}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Subjects</p>
                <span className="text-[10px] font-medium text-slate-400 block mt-0.5">Assigned to teach</span>
              </div>
            </div>

            {/* Card 3: Assignments */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none">{assignmentsCount}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Assignments</p>
                <span className="text-[10px] font-bold text-amber-600 block mt-0.5">{pendingReviewCount} Pending review</span>
              </div>
            </div>

            {/* Card 4: Tests / CBT */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none">{testsCount}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Tests / CBT</p>
                <span className="text-[10px] font-bold text-blue-600 block mt-0.5">{ongoingTestsCount} Active</span>
              </div>
            </div>

            {/* Card 5: Class Average */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none">{classAverage}%</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Class Average</p>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">DB Score Average</span>
              </div>
            </div>

          </div>

          {/* 3. Middle Row: Attendance, Subject Performance, Teaching Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Widget 1: Attendance Overview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">Attendance Overview</h3>
                
                <div className="flex items-center gap-4 py-1">
                  <SVGDonutChart percentage={attSummary.overallPercentage} centerLabel="Overall" color="#10B981" size={120} />
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-600 font-semibold">Present</span>
                      <span className="font-bold text-slate-900 ml-auto">{attSummary.presentCount} ({attSummary.presentPct}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-slate-600 font-semibold">Late</span>
                      <span className="font-bold text-slate-900 ml-auto">{attSummary.lateCount} ({attSummary.latePct}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-slate-600 font-semibold">Absent</span>
                      <span className="font-bold text-slate-900 ml-auto">{attSummary.absentCount} ({attSummary.absentPct}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <button 
                  onClick={() => onNavigate?.('attendance')}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Take Daily Roll Call</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Widget 2: Class Performance Overview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Subject Score Averages</h3>
                  <button 
                    onClick={() => onNavigate?.('attrition')} 
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                {subjectPerformance.length > 0 ? (
                  <div className="space-y-3 text-xs">
                    {subjectPerformance.map((sub, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-700">
                          <span className="truncate max-w-[130px]">{sub.name}</span>
                          <span>{sub.score}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${subjectBarColors[sub.name] || 'bg-blue-600'}`} 
                            style={{ width: `${Math.min(100, Math.max(0, sub.score))}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    No subject score averages calculated yet.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <button 
                  onClick={() => onNavigate?.('gradebook')}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Marks Gradebook</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Widget 3: My Teaching Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">My Teaching Activity</h3>

                <div className="space-y-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <FileText size={15} />
                      </div>
                      <span className="font-bold text-slate-800">Lesson Notes</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">{teachingSummary.lessonNotesCount}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">Created</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={15} />
                      </div>
                      <span className="font-bold text-slate-800">Assignments</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">{teachingSummary.assignmentsGivenCount}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">Assigned</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Award size={15} />
                      </div>
                      <span className="font-bold text-slate-800">CBT Tests</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">{teachingSummary.testsCreatedCount}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">Published</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-1">
                <button 
                  onClick={() => onNavigate?.('timetable')}
                  className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Calendar size={13} />
                  <span>My Timetable</span>
                </button>
                <button 
                  onClick={() => onNavigate?.('ai-planner')}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>AI Lesson Planner</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* 4. Dynamic Teacher Roles & Classes: Class Teacher vs Subject Teacher */}
          <div className="space-y-4">
            {/* A. CLASS TEACHER SECTION (Step 5 & 10) */}
            {classTeacherClasses.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <GraduationCap size={16} className="text-blue-600" />
                      Your Classes (Class Teacher)
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Classes where you hold full class leadership, academic monitoring, and score entry authority.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate?.('roster')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View Roster
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classTeacherClasses.map((cls) => (
                    <div
                      key={cls.allocationId}
                      className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 via-slate-50 to-white border border-blue-100/80 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Class Teacher
                          </span>
                          <h4 className="font-black text-slate-900 text-base mt-1.5">{cls.className}</h4>
                          <span className="text-xs text-slate-500 font-semibold">Section {cls.sectionName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 block">{cls.studentCount}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Students</span>
                        </div>
                      </div>

                      {/* Subjects Offered summary */}
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Subjects Offered:</span>
                        <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {cls.subjectsOffered?.length || 0} Subjects (Auto-Covered)
                        </span>
                      </div>

                      {/* Quick Academic Actions (Step 5) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => onNavigate?.('attendance')}
                          className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200 transition text-center"
                        >
                          Attendance
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate?.('subjects')}
                          className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200 transition text-center"
                        >
                          Subjects
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate?.('scores')}
                          className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200 transition text-center"
                        >
                          Score Entry
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate?.('reports')}
                          className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200 transition text-center"
                        >
                          Reports
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* B. SUBJECT TEACHER SECTION (Step 8 & 10) */}
            {subjectTeacherSubjects.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <BookOpen size={16} className="text-indigo-600" />
                      My Teaching (Subject Teacher)
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Subjects you teach across classes. Access is strictly scoped to these subjects and students.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate?.('subjects')}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    View All Subjects
                  </button>
                </div>

                <div className="space-y-4">
                  {subjectTeacherSubjects.map((st) => (
                    <div
                      key={st.subjectId}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                            {st.subjectCode?.substring(0, 3) || 'SUB'}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">{st.subjectName}</h4>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{st.subjectCode}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-xl">
                          {st.classes.length} Classes Assigned
                        </span>
                      </div>

                      {/* Class Distribution Grid (Step 8) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {st.classes.map((cls) => (
                          <div
                            key={cls.assignmentId}
                            className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs">{cls.className}</div>
                              <span className="text-[10px] text-slate-400 font-semibold">Sec {cls.sectionName}</span>
                            </div>
                            <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                              {cls.studentCount} students
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* C. Fallback: If neither academicRoles array is populated */}
            {classTeacherClasses.length === 0 && subjectTeacherSubjects.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">My Assigned Classes</h3>
                  <button
                    onClick={() => onNavigate?.('roster')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View Roster
                  </button>
                </div>

                {myClassesList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {myClassesList.map((cls, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
                          <span className="text-[10px] font-bold text-blue-600 uppercase block">{cls.role}</span>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700">
                          {cls.studentsCount} Students
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs italic">
                    No class allocations found for your account.
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right 4 Columns: Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Sidebar Widget 1: Interactive Teacher Reminders */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <ListTodo size={15} className="text-indigo-600" />
                Teacher Checklist Reminders
              </h3>
              <span className="text-[10px] text-blue-600 font-bold">{remindersList.length} Items</span>
            </div>

            {/* Inline Add Reminder */}
            <form onSubmit={handleAddReminder} className="flex gap-2">
              <input
                type="text"
                placeholder="Add new task..."
                value={newReminderText}
                onChange={(e) => setNewReminderText(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <button
                type="submit"
                disabled={addingReminder}
                className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </form>

            <div className="space-y-2.5 pt-1">
              {remindersList.length > 0 ? (
                remindersList.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleToggleReminder(r.id)}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left text-xs transition border border-transparent hover:border-slate-100 cursor-pointer"
                  >
                    {r.done ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={`font-medium block ${r.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {r.text}
                      </span>
                      {r.subtext && <span className="text-[10px] text-rose-500 font-semibold block">{r.subtext}</span>}
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs italic">
                  All teacher reminders cleared.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Widget 2: Recent Teacher Activity Stream */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Activity size={15} className="text-emerald-600" />
                Recent Activity Stream
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {recentActivitiesList.length > 0 ? (
                recentActivitiesList.map((act: any, idx: number) => (
                  <div key={`recent-act-${act.id || idx}-${idx}`} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      <Activity size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">{act.text}</span>
                      <span className="text-[10px] text-slate-400 block">{act.timestamp}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs italic">
                  No recent activities recorded.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* SELF-SERVICE PHOTOGRAPH UPLOAD MODAL */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Camera size={16} className="text-blue-600" /> Update Profile Photograph
              </h3>
              <button
                onClick={() => {
                  setShowPhotoModal(false)
                  setSelfPhotoFile(null)
                }}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            {photoUploadError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
                {photoUploadError}
              </div>
            )}

            <div className="text-center space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Upload a clear portrait photo. This will be displayed on your staff profile and school records.
              </p>

              <div className="flex justify-center">
                {selfPhotoFile || profile?.photo ? (
                  <div className="relative w-28 h-28 rounded-2xl border-4 border-blue-500/20 overflow-hidden shadow-md">
                    <img
                      src={selfPhotoFile || profile?.photo!}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon size={28} />
                    <span className="text-[10px] mt-1 font-semibold">No Photograph</span>
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs cursor-pointer transition">
                <Upload size={14} className="text-slate-500" />
                <span>{selfPhotoFile || profile?.photo ? 'Choose Different Image' : 'Select Photograph'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (evt) => {
                        setSelfPhotoFile(evt.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </label>
              <p className="text-[10px] text-slate-400">Supported: PNG, JPG, WEBP up to 5MB</p>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoModal(false)
                  setSelfPhotoFile(null)
                }}
                disabled={uploadingSelfPhoto}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSelfPhoto}
                disabled={!selfPhotoFile || uploadingSelfPhoto}
                className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {uploadingSelfPhoto ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
