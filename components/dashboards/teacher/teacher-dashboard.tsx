'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
  Lock,
  EyeOff,
  Shield,
  AtSign,
  History,
  Briefcase,
  Building,
  CreditCard,
  RefreshCw,
} from 'lucide-react'
import { StudentPhotoCaptureModal } from '../admin/student-photo-capture-modal'
import { SchoolHeader } from '../school-header'
import { safeStorage } from '@/lib/safeStorage'
import { apiSlice, endpoints } from '../../../lib/apiSlice'
import dynamic from 'next/dynamic'
import { showSystemStatus, resolveHttpStatus } from '@/lib/systemStatus'

const SectionLoadingSkeleton = () => (
  <div className="w-full space-y-4 animate-pulse p-4">
    <div className="h-16 bg-slate-200/70 rounded-2xl w-full" />
    <div className="h-64 bg-slate-200/60 rounded-2xl w-full" />
  </div>
)

const GradebookInterface = dynamic(() => import('./gradebook-interface'), { loading: () => <SectionLoadingSkeleton /> })
const MontessoriMatrix = dynamic(() => import('./montessori-matrix'), { loading: () => <SectionLoadingSkeleton /> })
const AttendanceRegister = dynamic(() => import('./attendance-register'), { loading: () => <SectionLoadingSkeleton /> })
const MediaLibrary = dynamic(() => import('./media-library').then(mod => mod.MediaLibrary), { loading: () => <SectionLoadingSkeleton /> })
const AiLessonPlanner = dynamic(() => import('./ai-lesson-planner').then(mod => mod.AiLessonPlanner), { loading: () => <SectionLoadingSkeleton /> })
const LiveClassroomHub = dynamic(() => import('./live-classroom-hub').then(mod => mod.LiveClassroomHub), { loading: () => <SectionLoadingSkeleton /> })
const TeacherPointsHub = dynamic(() => import('./points-hub'), { loading: () => <SectionLoadingSkeleton /> })
const TeacherAttritionRadar = dynamic(() => import('./attrition-radar').then(mod => mod.TeacherAttritionRadar), { loading: () => <SectionLoadingSkeleton /> })
const QuestionBankManager = dynamic(() => import('./question-bank-manager').then(mod => mod.QuestionBankManager), { loading: () => <SectionLoadingSkeleton /> })
const HomeworkQuestionStudio = dynamic(() => import('@/components/dashboards/shared/homework-question-studio').then(mod => mod.HomeworkQuestionStudio), { loading: () => <SectionLoadingSkeleton /> })
const TeacherSubjectsHub = dynamic(() => import('./teacher-subjects-hub').then(mod => mod.TeacherSubjectsHub), { loading: () => <SectionLoadingSkeleton /> })
const TeacherTimetableView = dynamic(() => import('./teacher-timetable-view').then(mod => mod.TeacherTimetableView), { loading: () => <SectionLoadingSkeleton /> })
const SubjectTeacherDashboard = dynamic(() => import('./subject-teacher-dashboard').then(mod => mod.SubjectTeacherDashboard), { loading: () => <SectionLoadingSkeleton /> })
const TeacherCommunicationInbox = dynamic(() => import('./subject-teacher-dashboard').then(mod => mod.TeacherCommunicationInbox), { loading: () => <SectionLoadingSkeleton /> })
const SchoolCalendar = dynamic(() => import('../admin/school-calendar'), { loading: () => <SectionLoadingSkeleton /> })
const TeacherClassesManager = dynamic(() => import('./teacher-classes-manager').then(mod => mod.TeacherClassesManager), { loading: () => <SectionLoadingSkeleton /> })
const TeacherMatrixMarksEntry = dynamic(() => import('./teacher-matrix-marks-entry').then(mod => mod.TeacherMatrixMarksEntry), { loading: () => <SectionLoadingSkeleton /> })
const TeacherAssignmentsManager = dynamic(() => import('./teacher-assignments-manager').then(mod => mod.TeacherAssignmentsManager), { loading: () => <SectionLoadingSkeleton /> })
const TeacherBroadReports = dynamic(() => import('./teacher-broad-reports').then(mod => mod.TeacherBroadReports), { loading: () => <SectionLoadingSkeleton /> })
const ReportCardManagement = dynamic(() => import('../admin/report-card-management').then(mod => mod.ReportCardManagement), { loading: () => <SectionLoadingSkeleton /> })

import { getAvatarUrl } from '@/lib/avatar'
import type { HomeworkAllocation } from '@/components/dashboards/shared/homework-question-studio'


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
  username?: string | null
  email?: string | null
  phone?: string | null
  photo?: string | null
  department?: string | null
  qualifications?: string | null
  houseAddress?: string | null
  bankName?: string | null
  accountNumber?: string | null
  accountName?: string | null
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

  // Teacher Profile & Settings State
  const [activeProfileTab, setActiveProfileTab] = useState<'bio' | 'allocations' | 'security'>('bio')
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false)
  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false)
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null)

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    qualifications: '',
    houseAddress: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  })
  const [savingProfile, setSavingProfile] = useState<boolean>(false)
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null)
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null)

  // Security Credentials state
  const [newUsername, setNewUsername] = useState<string>('')
  const [updatingUsername, setUpdatingUsername] = useState<boolean>(false)
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false)
  const [showNewPass, setShowNewPass] = useState<boolean>(false)
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false)
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Sync profile form when profile changes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || '',
        qualifications: profile.qualifications || '',
        houseAddress: profile.houseAddress || '',
        bankName: profile.bankName || '',
        accountNumber: profile.accountNumber || '',
        accountName: profile.accountName || '',
      })
    }
  }, [profile])

  // Save captured photo via modal or file picker
  const handleSaveCapturedPhoto = async (photoBase64: string | null) => {
    if (!photoBase64) return
    setUploadingPhoto(true)
    setPhotoSuccess(null)
    try {
      const res = await apiSlice.post<{ success: boolean; photo: string; message?: string }>(
        endpoints.teacher.uploadPhoto,
        { photo: photoBase64 }
      )
      if (res.success && res.photo) {
        setProfile(prev => prev ? { ...prev, photo: res.photo } : null)
        onIdentityChange?.({
          name: profile?.name || user.username,
          photo: res.photo,
          title: profile?.department || 'Teacher',
        })
        setIsPhotoModalOpen(false)
        setPhotoSuccess('Profile photograph updated successfully!')
        setTimeout(() => setPhotoSuccess(null), 4000)
      } else {
        throw new Error(res.message || 'Failed to update photograph.')
      }
    } catch (err: any) {
      showSystemStatus(err?.message || 'Failed to update profile photo.', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Quick native file upload handler
  const handleDirectPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string
      if (base64) {
        await handleSaveCapturedPhoto(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  // Save profile information handler
  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileSuccessMsg(null)
    setProfileErrorMsg(null)
    try {
      const res = await apiSlice.put<{ success: boolean; message?: string; profile: any }>(
        endpoints.teacher.updateProfile,
        profileForm
      )
      if (res.success) {
        setProfile(prev => prev ? {
          ...prev,
          name: profileForm.name || prev.name,
          email: profileForm.email || prev.email,
          phone: profileForm.phone || prev.phone,
          department: profileForm.department || prev.department,
          qualifications: profileForm.qualifications || prev.qualifications,
          houseAddress: profileForm.houseAddress || prev.houseAddress,
          bankName: profileForm.bankName || prev.bankName,
          accountNumber: profileForm.accountNumber || prev.accountNumber,
          accountName: profileForm.accountName || prev.accountName,
        } : null)
        onIdentityChange?.({
          name: profileForm.name || profile?.name || user.username,
          photo: profile?.photo || null,
          title: profileForm.department || profile?.department || 'Teacher',
        })
        setProfileSuccessMsg('Profile information updated successfully!')
        setTimeout(() => setProfileSuccessMsg(null), 5000)
      } else {
        throw new Error(res.message || 'Failed to update profile information.')
      }
    } catch (err: any) {
      setProfileErrorMsg(err?.message || 'Failed to update profile information.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Change username handler
  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameSuccess(null)
    setUsernameError(null)
    const clean = newUsername.trim()
    if (!clean || clean.length < 3) {
      setUsernameError('Username must be at least 3 characters long.')
      return
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(clean)) {
      setUsernameError('Only letters, numbers, dots, hyphens, and underscores are allowed.')
      return
    }
    setUpdatingUsername(true)
    try {
      const res = await apiSlice.put<{ success: boolean; message?: string; username: string }>(
        endpoints.teacher.changeUsername,
        { newUsername: clean }
      )
      if (res.success) {
        setProfile(prev => prev ? { ...prev, username: res.username } : null)
        setUsernameSuccess(`Username successfully changed to @${res.username}! Use this next time you log in.`)
        setNewUsername('')
        setTimeout(() => setUsernameSuccess(null), 6000)
      } else {
        throw new Error(res.message || 'Failed to change username.')
      }
    } catch (err: any) {
      setUsernameError(err?.message || 'Failed to change username.')
    } finally {
      setUpdatingUsername(false)
    }
  }

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess(null)
    setPasswordError(null)
    if (!currentPassword) {
      setPasswordError('Please enter your current password.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    setUpdatingPassword(true)
    try {
      const res = await apiSlice.put<{ success: boolean; message?: string }>(
        endpoints.teacher.changePassword,
        { currentPassword, newPassword }
      )
      if (res.success) {
        setPasswordSuccess('Password successfully updated! Your account is secure.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordSuccess(null), 6000)
      } else {
        throw new Error(res.message || 'Failed to update password.')
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password. Please check your current password.')
    } finally {
      setUpdatingPassword(false)
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
          const isClass = Boolean((profileRes as any).isClassTeacher || profileRes.isFormTeacher)
          const isSubj = Boolean(profileRes.isSubjectTeacher)
          onIdentityChange?.({
            name: profileRes.name || user.username,
            photo: profileRes.photo || null,
            title: isClass && isSubj
              ? 'Class & Subject Teacher'
              : isClass
                ? 'Class Teacher'
                : isSubj
                  ? 'Subject Teacher'
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
    return <QuestionBankManager profile={{ ...profile, role: user?.role || 3 }} isAdmin={false} />
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

  // Derived values grounded strictly in real DB data
  const teacherName = profile?.name || user.username
  const primaryForm = profile?.primaryForm || (profile?.formAllocations?.[0] ? `${profile.formAllocations[0].className} ${profile.formAllocations[0].sectionName}` : 'Unassigned Class')

  // 14. TEACHER PROFILE & SETTINGS SUB-VIEW
  if (activeSection === 'settings' || activeSection === 'profile') {
    return (
      <div className="space-y-6 pb-12 font-sans max-w-5xl mx-auto animate-in fade-in duration-200">
        {/* Profile Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar with Camera Trigger Overlay */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-white/20 bg-white/10 shadow-xl">
                <img
                  src={getAvatarUrl(profile?.photo, teacherName)}
                  alt={teacherName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Hidden file input */}
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleDirectPhotoFile}
                className="hidden"
              />

              {/* Camera Trigger Button */}
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition cursor-pointer border-2 border-slate-900 flex items-center justify-center disabled:opacity-50"
                title="Change Passport Photo"
              >
                {uploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>
            </div>

            {/* Profile Meta Info */}
            <div className="text-center sm:text-left space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
                  Teacher & Staff Portal
                </span>
                {profile?.isFormTeacher && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold">
                    Class Form Teacher
                  </span>
                )}
                {profile?.isSubjectTeacher && (
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-bold">
                    Subject Specialist
                  </span>
                )}
                {(profile?.username || user.username) && (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 border border-white/15 text-xs font-mono">
                    @{profile?.username || user.username}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                {teacherName}
              </h2>

              <p className="text-xs text-slate-300 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
                <span>Department: <strong className="text-white">{profile?.department || 'Academics'}</strong></span>
                <span>Primary Class: <strong className="text-blue-300">{primaryForm}</strong></span>
                <span>Campus: <strong className="text-white">{profile?.branchName || 'Main Campus'}</strong></span>
              </p>

              {/* Upload trigger buttons & live feedback */}
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  disabled={uploadingPhoto}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-blue-400/40 shadow-sm"
                >
                  <Camera size={13} />
                  <span>Snap with Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => profilePhotoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/15"
                >
                  <Upload size={13} />
                  <span>{uploadingPhoto ? 'Uploading...' : 'Choose File from Device'}</span>
                </button>
                {photoSuccess && (
                  <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 size={14} />
                    {photoSuccess}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveProfileTab('bio')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeProfileTab === 'bio'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User size={15} />
            <span>Staff Bio & Profile Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveProfileTab('allocations')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeProfileTab === 'allocations'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Briefcase size={15} />
            <span>Classes & Subject Allocations</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveProfileTab('security')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeProfileTab === 'security'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Lock size={15} />
            <span>Security & Login Credentials</span>
          </button>
        </div>

        {/* TAB 1: STAFF BIO & PROFILE INFO */}
        {activeProfileTab === 'bio' && (
          <form onSubmit={handleSaveProfileInfo} className="space-y-6">
            {profileSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            {/* Personal & Staff Details Card */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Personal & Employment Information</h3>
                  <p className="text-xs text-slate-500">Official contact records, academic qualifications, and teaching bio.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. teacher@school.edu"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. 08012345678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department / Faculty</label>
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Science, Languages, Humanities"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Academic Qualifications & Certifications</label>
                  <textarea
                    rows={2}
                    value={profileForm.qualifications}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, qualifications: e.target.value }))}
                    placeholder="e.g. B.Sc Mathematics, PGDE, TRCN Certified, Cambridge IGCSE Certified"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={profileForm.houseAddress}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, houseAddress: e.target.value }))}
                    placeholder="e.g. 15 Campus Road, Benin City"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payroll & Banking Information Card */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Payroll & Banking Details</h3>
                  <p className="text-xs text-slate-500">Official bank details used for salary dispatches and school remunerations.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={profileForm.bankName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g. Zenith Bank, GTBank"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={profileForm.accountNumber}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                    placeholder="e.g. 10-digit Account No"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={profileForm.accountName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="e.g. John K. Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{savingProfile ? 'Saving Information...' : 'Save Profile Information'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: CLASSES & SUBJECT ALLOCATIONS */}
        {activeProfileTab === 'allocations' && (
          <div className="space-y-6">
            {/* Form Teacher Allocations */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Form Teacher Class Allocations</h3>
                  <p className="text-xs text-slate-500">Classes where you serve as the designated Form / Class Master.</p>
                </div>
              </div>

              {(profile?.formAllocations || []).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {profile?.formAllocations.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Class Responsibility</span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{item.className} &bull; {item.sectionName}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[10px]">
                        Form Master
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                  No active Form Class assignment recorded for the current session.
                </div>
              )}
            </div>

            {/* Subject Teaching Allocations */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Assigned Teaching Subjects</h3>
                  <p className="text-xs text-slate-500">Curriculum subjects and classes you are assigned to teach and grade.</p>
                </div>
              </div>

              {(profile?.subjectAssignments || []).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {profile?.subjectAssignments.map((sub, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-blue-300 transition space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 text-[10px] font-bold">
                          {sub.className}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">Section {sub.sectionName}</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900">{sub.subjectName}</h4>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                  No subject allocations found for the active term.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY & LOGIN CREDENTIALS */}
        {activeProfileTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Change Username Card */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                  <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                    <AtSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Change Portal Username</h3>
                    <p className="text-xs text-slate-500">Update your teacher portal username used for logging in.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Username</span>
                  <p className="font-mono font-extrabold text-slate-900 text-sm">@{profile?.username || user.username}</p>
                </div>

                {usernameSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{usernameSuccess}</span>
                  </div>
                )}
                {usernameError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>{usernameError}</span>
                  </div>
                )}

                <form onSubmit={handleChangeUsername} className="space-y-4 pt-1 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Username *</label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. mr_john_doe"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Letters, numbers, underscores, dots only. Minimum 3 characters.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={updatingUsername}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {updatingUsername ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{updatingUsername ? 'Saving Username...' : 'Save New Username'}</span>
                  </button>
                </form>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-800 mt-4">
                <strong>Important:</strong> Once your username is changed, please use this new username to log into the portal.
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Security & Account Password</h3>
                  <p className="text-xs text-slate-500">Update your teacher portal password securely.</p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {updatingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                  <span>{updatingPassword ? 'Updating Password...' : 'Save New Password'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STAFF PASSPORT PHOTOGRAPH MODAL */}
        <StudentPhotoCaptureModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          onSavePhoto={handleSaveCapturedPhoto}
          studentName={teacherName}
          studentRegNo={profile?.department || 'Staff'}
          currentPhoto={profile?.photo}
          title="Teacher Profile Photograph"
        />
      </div>
    )
  }

  if (!activeSection || activeSection === 'overview') {
    if (profile.isSubjectTeacher && !profile.isFormTeacher) {
      return <SubjectTeacherDashboard onNavigate={onNavigate} />
    }
  }
  
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
          <div className="relative rounded-3xl bg-gradient-to-r from-[#070D22] via-[#0E1A42] to-[#12245A] p-4 sm:p-6 md:p-8 text-white shadow-xl border border-white/10 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            
            {/* Left Hero Content with Avatar */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-5 w-full md:w-auto">
              <div className="relative group/avatar shrink-0">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={teacherName}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl object-cover border-2 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-linear-to-br from-blue-500 to-indigo-600 border-2 border-white/20 text-white font-black text-lg sm:text-2xl flex items-center justify-center shadow-lg">
                    {(teacherName[0] || 'T').toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsPhotoModalOpen(true)
                  }}
                  className="absolute -bottom-1 -right-1 p-1 sm:p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition cursor-pointer border border-white/40"
                  title="Upload profile photograph"
                >
                  <Camera size={12} />
                </button>
              </div>

              <div className="space-y-1 min-w-0">
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 text-[11px] sm:text-xs font-semibold backdrop-blur-xs text-blue-100 inline-flex items-center gap-1.5 mb-0.5">
                  <Sparkles size={12} className="text-yellow-300" />
                  Teacher Workspace
                </span>
                <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Good Day, {teacherName}! 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Connected with <span className="text-white font-bold">{profile.branchName || 'School Campus'}</span> &bull; Primary Class: <span className="text-white font-bold">{primaryForm}</span>
                </p>
              </div>
            </div>

            {/* Right Date Box */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 text-xs space-y-1 w-full sm:w-auto shrink-0 flex items-center justify-between sm:block">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Calendar size={14} className="text-sky-400 shrink-0" />
                <span>{currentDateFormatted}</span>
              </div>
            </div>

          </div>

          {/* 2. Top 5 Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
            
            {/* Card 1: Students */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:shadow-md transition">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Users size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-none">{studentsCount}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">Students</p>
                <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-600 block mt-0.5 truncate">{presentTodayCount} Present today</span>
              </div>
            </div>

            {/* Card 2: Subjects */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:shadow-md transition">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-none">{subjectsCount}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">Subjects</p>
                <span className="text-[9.5px] sm:text-[10px] font-medium text-slate-400 block mt-0.5 truncate">Assigned to teach</span>
              </div>
            </div>

            {/* Card 3: Assignments */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:shadow-md transition">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-none">{assignmentsCount}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">Assignments</p>
                <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-600 block mt-0.5 truncate">{pendingReviewCount} Pending</span>
              </div>
            </div>

            {/* Card 4: Tests / CBT */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:shadow-md transition">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Award size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-none">{testsCount}</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">Tests / CBT</p>
                <span className="text-[9.5px] sm:text-[10px] font-bold text-blue-600 block mt-0.5 truncate">{ongoingTestsCount} Active</span>
              </div>
            </div>

            {/* Card 5: Class Average */}
            <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:shadow-md transition">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <TrendingUp size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-none">{classAverage}%</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">Class Average</p>
                <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-600 block mt-0.5 truncate">DB Score Average</span>
              </div>
            </div>

          </div>

          {/* 3. Middle Row: Attendance, Subject Performance, Teaching Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Widget 1: Attendance Overview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">Attendance Overview</h3>
                
                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-1">
                  <SVGDonutChart percentage={attSummary.overallPercentage} centerLabel="Overall" color="#10B981" size={115} />
                  <div className="space-y-2 text-xs w-full sm:w-auto">
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
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer py-1.5 min-h-[38px]"
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
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer py-1.5 min-h-[38px]"
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
                  className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer py-1.5 min-h-[38px]"
                >
                  <Calendar size={13} />
                  <span>My Timetable</span>
                </button>
                <button 
                  onClick={() => onNavigate?.('ai-planner')}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer py-1.5 min-h-[38px]"
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
                          className="py-2 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-[10px] border border-slate-200 transition text-center min-h-[36px]"
                        >
                          Attendance
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate?.('subjects')}
                          className="py-2 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-[10px] border border-slate-200 transition text-center min-h-[36px]"
                        >
                          Subjects
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate?.('scores')}
                          className="py-2 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-[10px] border border-slate-200 transition text-center min-h-[36px]"
                        >
                          Score Entry
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate?.('reports')}
                          className="py-2 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-[10px] border border-slate-200 transition text-center min-h-[36px]"
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

      {/* SELF-SERVICE / PASSPORT PHOTOGRAPH MODAL */}
      <StudentPhotoCaptureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSavePhoto={handleSaveCapturedPhoto}
        studentName={teacherName}
        studentRegNo={profile?.department || 'Staff'}
        currentPhoto={profile?.photo}
        title="Teacher Profile Photograph"
      />

    </div>
  )
}
