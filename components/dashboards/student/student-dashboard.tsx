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
  Check
} from 'lucide-react'
import { SchoolHeader } from '../school-header'
import { safeStorage } from '@/lib/safeStorage'
import { apiSlice, endpoints } from '@/lib/apiSlice'
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
        <span className="text-lg font-black text-slate-900 leading-none">{percentage}%</span>
        <span className="text-[10px] font-bold text-slate-400 mt-0.5 leading-tight">{centerLabel}</span>
      </div>
    </div>
  )
}

export function StudentDashboard({ user, activeSection, onNavigate }: DashboardProps) {
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

  // Timetable & Exam Slots state
  const [timetableSlots, setTimetableSlots] = useState<any[]>([])
  const [examScheduleSlots, setExamScheduleSlots] = useState<any[]>([])
  const [loadingTimetable, setLoadingTimetable] = useState<boolean>(false)

  // Reminders state
  const [remindersList, setRemindersList] = useState<Array<{ id: number; text: string; subtext?: string; done: boolean }>>([])
  const [newReminderText, setNewReminderText] = useState<string>('')
  const [addingReminder, setAddingReminder] = useState<boolean>(false)

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

  // Change password state
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboardData() {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch Aggregated Dashboard Overview
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

        // 5. Fetch Grades
        const gradesRes = await apiSlice.get<{ success: boolean } & GradeData>(endpoints.student.grades).catch(() => null)
        if (gradesRes?.success) setGrades(gradesRes)

        // 6. Fetch Reminders
        const remindersRes = await apiSlice.get<{ success: boolean; reminders: any[] }>(endpoints.student.reminders).catch(() => null)
        if (remindersRes?.success) setRemindersList(remindersRes.reminders || [])

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

    if (activeSection === 'school-fees' || activeSection === 'finances') {
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
      alert(err.message || 'Failed to send message.')
    } finally {
      setSendingMsg(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match.')
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
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update password.')
    } finally {
      setUpdatingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Syncing student portal workspace...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 flex flex-col items-center gap-4 text-center max-w-lg mx-auto mt-10">
        <AlertCircle className="text-rose-600" size={32} />
        <div>
          <h3 className="font-extrabold text-slate-900">Dashboard Loading Failed</h3>
          <p className="text-xs font-semibold text-rose-600 mt-1">{error || 'Database mapping error.'}</p>
        </div>
      </div>
    )
  }

  // Render Sub-Views based on active navigation tab
  if (activeSection === 'media') {
    return <StudentMediaLibrary />
  }
  if (activeSection === 'liveRooms') {
    return <StudentLiveClassrooms user={user} />
  }
  if (activeSection === 'calendar') {
    return <SchoolCalendar user={user} />
  }

  // ACADEMICS & TEACHER DIRECTORY SUB-VIEW
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
                setSelectedRecipientId(formTeacher.id)
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
              {subjectTeachers.map((st) => (
                <div key={st.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
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

  // SCHOOL FEES & BANK DETAILS SUB-VIEW
  if (activeSection === 'school-fees' || activeSection === 'finances') {
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

        {/* Invoices Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Fee Invoices & Payment Logs ({invoices.length})
            </h3>
            {loadingInvoices && <Loader2 size={16} className="animate-spin text-blue-600" />}
          </div>

          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Paid Amount</th>
                    <th className="p-4">Balance</th>
                    <th className="p-4">Status</th>
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

  // TIMETABLE & EXAM SCHEDULE SUB-VIEW
  if (activeSection === 'timetable') {
    return (
      <div className="space-y-6 pb-12 font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="text-purple-600" size={24} />
              Class Timetable & Published Exam Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Class: <span className="font-bold text-slate-900">{profile.className} {profile.sectionName}</span>
            </p>
          </div>
          {loadingTimetable && <Loader2 size={18} className="animate-spin text-blue-600" />}
        </div>

        {/* Period Timetable */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Weekly Class Period Schedule</h3>
          {timetableSlots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {timetableSlots.map((slot) => (
                <div key={slot.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase block">{slot.dayOfWeek} &bull; {slot.startTime} - {slot.endTime}</span>
                    <h4 className="font-bold text-slate-900 mt-0.5">{slot.title}</h4>
                    <span className="text-[10px] text-slate-500 block">Teacher: {slot.teacherName || 'Form Teacher'}</span>
                  </div>
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                    {slot.subjectCode || 'CLASS'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No weekly class timetable slots published for your class section yet.
            </div>
          )}
        </div>

        {/* Exam Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Term Examination Timetable</h3>
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
                    <tr key={es.id}>
                      <td className="p-3 font-bold text-slate-900">{es.examDate ? new Date(es.examDate).toLocaleDateString() : 'TBD'}</td>
                      <td className="p-3 font-mono">{es.startTime} - {es.endTime}</td>
                      <td className="p-3 font-bold text-indigo-600">{es.subjectName} ({es.subjectCode})</td>
                      <td className="p-3">{es.hallName}</td>
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

  // COMMUNICATION / MESSAGES SUB-VIEW
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

  // SETTINGS & PASSWORD SUB-VIEW
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
  
  const totalClass = dashboardOverview?.kpi?.totalClassStudents || profile.fellowStudentsCount || 0
  const overallAvg = dashboardOverview?.kpi?.averageScore ? `${dashboardOverview.kpi.averageScore}%` : (grades?.overallAverage ? `${grades.overallAverage}%` : '0%')
  const attendancePct = dashboardOverview?.kpi?.attendancePercentage ? `${dashboardOverview.kpi.attendancePercentage}%` : (attendance?.percentage ? `${attendance.percentage}%` : '0%')
  const behaviourRating = dashboardOverview?.kpi?.behaviourRating || 'Good'

  const timetableList = dashboardOverview?.todayTimetable || []
  const homeworksList = dashboardOverview?.upcomingHomeworks || []
  const examsList = dashboardOverview?.upcomingExams || []
  const hwProgress = dashboardOverview?.homeworkProgress || { percentage: 0, completed: 0, pending: 0, overdue: 0 }
  const attSummary = dashboardOverview?.attendance || { percentage: 0, presentCount: 0, lateCount: 0, absentCount: 0 }
  const feeInfo = dashboardOverview?.feeStatus || { status: 'Unknown', outstanding: 0, nextTermDate: null }

  const subjectPerformance = dashboardOverview?.subjectPerformance || []
  const barColors = ['bg-blue-600', 'bg-emerald-500', 'bg-purple-600', 'bg-amber-500', 'bg-cyan-500', 'bg-rose-500']

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

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
            </div>

          </div>

          {/* 2. Top 4 Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Card 1: Average Score */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Star size={20} className="fill-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Score</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{overallAvg}</h3>
                <p className="text-[11px] font-bold text-emerald-600 mt-1">DB Grade Average</p>
              </div>
            </div>

            {/* Card 2: Class Position */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Trophy size={20} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Position</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{userRankText}</h3>
                <p className="text-[11px] font-medium text-slate-500 mt-1">out of {totalClass} students</p>
              </div>
            </div>

            {/* Card 3: Attendance */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <ShieldCheck size={20} />
                </div>
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
                  <h3 className="text-sm font-extrabold text-slate-900">Today&apos;s Timetable</h3>
                  <button 
                    onClick={() => onNavigate?.('timetable')} 
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {timetableList.length > 0 ? (
                  <div className="space-y-2.5">
                    {timetableList.map((slot: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block">{slot.startTime} - {slot.endTime}</span>
                          <span className="font-bold text-slate-900">{slot.title}</span>
                          <span className="text-[10px] text-slate-500 block">{slot.teacherName || 'Form Teacher'}</span>
                        </div>
                        <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                          {slot.roomLabel || 'Classroom'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs italic">
                    No class periods scheduled for today.
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Homeworks */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Upcoming Assignments</h3>
                  <button 
                    onClick={() => onNavigate?.('tasks')} 
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>

                {homeworksList.length > 0 ? (
                  <div className="space-y-2.5">
                    {homeworksList.map((hw: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{hw.title}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">{hw.dueDate}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          {hw.deadlineBadge}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs italic">
                    No pending homework assignments.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 4. Subject Performance Bars */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Subject Performance Breakdown</h3>
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

          {/* Sidebar Widget 2: Interactive Study Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <ListTodo size={15} className="text-indigo-600" />
                Personal Study Checklist
              </h3>
              <span className="text-[10px] text-blue-600 font-bold">{remindersList.length} Tasks</span>
            </div>

            <form onSubmit={handleAddReminder} className="flex gap-2">
              <input
                type="text"
                placeholder="Add study task..."
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

            <div className="space-y-2 pt-1">
              {remindersList.length > 0 ? (
                remindersList.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleToggleReminder(r.id)}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left text-xs transition cursor-pointer"
                  >
                    {r.done ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                    )}
                    <span className={`font-medium ${r.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {r.text}
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs italic">
                  Study checklist empty. Add your tasks above!
                </div>
              )}
            </div>
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
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
