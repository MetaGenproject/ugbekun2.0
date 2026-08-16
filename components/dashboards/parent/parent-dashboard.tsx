'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  DollarSign, 
  Calendar as CalendarIcon, 
  Activity, 
  BookOpen, 
  TrendingUp, 
  Mail, 
  GraduationCap, 
  Download, 
  Loader2, 
  AlertCircle,
  Plus,
  X,
  ShieldCheck,
  Landmark,
  Bus,
  CheckCircle2,
  Circle,
  User,
  Clock,
  Lock,
  Check,
  Edit3,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  ChevronRight,
  Copy,
  Sparkles,
  MessageSquare,
  Building2
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { getAvatarUrl } from '@/lib/avatar'

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
  }
  activeSection: string
}

interface ChildSummary {
  id: number
  registerNo: string | null
  firstName: string
  lastName: string
  photo: string | null
  className: string
  sectionName: string
}

interface ChildProfile {
  studentId: number
  firstName: string
  lastName: string
  registerNo: string | null
  gender: string | null
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
    submitted: boolean
    score: number | null
    submittedAt: string | null
    createdAt: string
  }>
}

interface GradeData {
  reportCard: Array<{
    id: number
    examName: string
    subjectName: string
    subjectCode: string | null
    cbtMark?: string | null
    theoryMark?: string | null
    mark: string | null
    absent: boolean
    classAverage: number
  }>
  overallAverage: number
  commentary: string | null
  rank: number | null
  totalClassStudents: number
  isEcd?: boolean
  assessment?: any
}

interface SiblingRequest {
  id: number
  firstName: string
  lastName: string
  gender: string
  birthday: string | null
  status: string
  rejectionReason: string | null
  className: string
  sectionName: string
  createdAt: string
}

interface ClassSectionInfo {
  id: number
  name: string
  sections: Array<{
    section: {
      id: number
      name: string
    }
  }>
}

interface InvoiceItem {
  id: number
  name: string
  amount: number
}

interface InvoicePayment {
  id: number
  amount: number
  paymentMethod: string
  transactionRef?: string
  paidAt: string
}

interface InvoiceData {
  id: number
  invoiceNo: string
  title: string
  amount: number
  discount: number
  fine: number
  paidAmount: number
  balance: number
  status: string
  dueDate: string | null
  createdAt: string
  items: InvoiceItem[]
  payments: InvoicePayment[]
}

interface SchoolBankData {
  bankName: string
  accountName: string
  accountNumber: string
  branchName?: string
  sortCode?: string
}

interface TimetableSlot {
  id: number
  dayOfWeek: string
  startTime: string
  endTime: string
  type: string
  title: string
  subjectName: string | null
  subjectCode: string | null
  teacherName: string | null
}

interface ExamScheduleSlot {
  id: number
  examDate: string
  startTime: string
  endTime: string
  instructions: string | null
  subjectName: string
  subjectCode: string
  hallName: string
  invigilatorName: string
}

interface TeacherInfo {
  id: number
  name: string
  email: string | null
  phone: string | null
  photo: string | null
  department: string | null
  qualifications?: string | null
  subjects?: Array<{ id: number; name: string; code: string }>
}

interface ParentMessage {
  id: number
  senderType: string
  recipientRole: string
  subject: string | null
  message: string
  isRead: boolean
  childName: string | null
  createdAt: string
}

interface ParentProfileData {
  id: number
  username: string
  name: string | null
  relation: string | null
  fatherName: string | null
  motherName: string | null
  occupation: string | null
  education: string | null
  income: string | null
  email: string | null
  mobileno: string | null
  address: string | null
  city: string | null
  state: string | null
  photo: string | null
  branchName: string | null
}

interface EventData {
  id: number
  title: string
  description: string | null
  startDate: string
  endDate: string | null
}

export function ParentDashboard({ user, activeSection }: DashboardProps) {
  // Children Listing State
  const [children, setChildren] = useState<ChildSummary[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)

  // Active Child Details State
  const [profile, setProfile] = useState<ChildProfile | null>(null)
  const [attendance, setAttendance] = useState<AttendanceData | null>(null)
  const [tasks, setTasks] = useState<TaskData | null>(null)
  const [grades, setGrades] = useState<GradeData | null>(null)

  // Sub-feature state
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [schoolBank, setSchoolBank] = useState<SchoolBankData | null>(null)
  const [totalFeeAmount, setTotalFeeAmount] = useState<number>(0)
  const [totalPaidAmount, setTotalPaidAmount] = useState<number>(0)
  const [totalBalance, setTotalBalance] = useState<number>(0)
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false)

  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([])
  const [examSlots, setExamSlots] = useState<ExamScheduleSlot[]>([])
  const [loadingTimetable, setLoadingTimetable] = useState<boolean>(false)

  const [formTeacher, setFormTeacher] = useState<TeacherInfo | null>(null)
  const [subjectTeachers, setSubjectTeachers] = useState<TeacherInfo[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false)

  const [messages, setMessages] = useState<ParentMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false)
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false)
  const [messageRecipientRole, setMessageRecipientRole] = useState<string>('TEACHER')
  const [messageSubject, setMessageSubject] = useState<string>('')
  const [messageBody, setMessageBody] = useState<string>('')
  const [sendingMessage, setSendingMessage] = useState<boolean>(false)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)

  const [events, setEvents] = useState<EventData[]>([])
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false)

  // Parent Settings State
  const [parentProfile, setParentProfile] = useState<ParentProfileData | null>(null)
  const [loadingParentProfile, setLoadingParentProfile] = useState<boolean>(false)
  const [savingProfile, setSavingProfile] = useState<boolean>(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [changingPassword, setChangingPassword] = useState<boolean>(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // UI & Loading States
  const [loadingList, setLoadingList] = useState(true)
  const [loadingChild, setLoadingChild] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [copiedBank, setCopiedBank] = useState(false)

  // PDF Export parameters
  const [rankingType, setRankingType] = useState<string>('full')
  const [rankingLimit, setRankingLimit] = useState<number>(3)

  // Sibling Admissions State
  const [siblingRequests, setSiblingRequests] = useState<SiblingRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [classesInfo, setClassesInfo] = useState<ClassSectionInfo[]>([])
  
  // Admission Form State
  const [formFirstName, setFormFirstName] = useState('')
  const [formLastName, setFormLastName] = useState('')
  const [formGender, setFormGender] = useState('Male')
  const [formBirthday, setFormBirthday] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formSectionId, setFormSectionId] = useState('')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null)

  // Filters for Attendance & Billing
  const [attendanceFilter, setAttendanceFilter] = useState<string>('ALL')
  const [calendarView, setCalendarView] = useState<'events' | 'timetable'>('events')
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)

  // Dynamic Reminders State computed from actual database data
  const [completedReminders, setCompletedReminders] = useState<Record<string, boolean>>({})

  const toggleDynamicReminder = (id: string) => {
    setCompletedReminders(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Copy Bank Account
  const handleCopyBank = () => {
    if (!schoolBank) return
    const text = `${schoolBank.bankName}\nAccount: ${schoolBank.accountNumber}\nName: ${schoolBank.accountName}`
    navigator.clipboard.writeText(text)
    setCopiedBank(true)
    setTimeout(() => setCopiedBank(false), 2000)
  }

  // Fetch Sibling Requests
  const fetchSiblingRequests = async () => {
    try {
      setLoadingRequests(true)
      const res = await apiSlice.get<{ success: boolean; siblingRequests: SiblingRequest[] }>(endpoints.parent.siblingRequests)
      if (res.success) {
        setSiblingRequests(res.siblingRequests)
      }
    } catch (err: any) {
      console.error('Failed to load sibling requests:', err)
    } finally {
      setLoadingRequests(false)
    }
  }

  // Fetch Parent Messages
  const fetchParentMessages = async () => {
    try {
      setLoadingMessages(true)
      const res = await apiSlice.get<{ success: boolean; messages: ParentMessage[] }>(endpoints.parent.messages)
      if (res.success) {
        setMessages(res.messages)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Fetch Parent Profile
  const fetchParentProfile = async () => {
    try {
      setLoadingParentProfile(true)
      const res = await apiSlice.get<{ success: boolean; parent: ParentProfileData }>(endpoints.parent.profile)
      if (res.success) {
        setParentProfile(res.parent)
      }
    } catch (err) {
      console.error('Failed to load parent profile:', err)
    } finally {
      setLoadingParentProfile(false)
    }
  }

  // Fetch Events
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true)
      const res = await apiSlice.get<{ success: boolean; events: EventData[] }>(endpoints.parent.events)
      if (res.success) {
        setEvents(res.events)
      }
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoadingEvents(false)
    }
  }

  useEffect(() => {
    if (activeSection === 'sibling-requests') {
      fetchSiblingRequests()
    } else if (activeSection === 'calendar') {
      fetchEvents()
    } else if (activeSection === 'settings') {
      fetchParentProfile()
    }
    fetchParentMessages()
  }, [activeSection])

  // Fetch classes and sections for dropdown
  useEffect(() => {
    if (!showModal) return
    async function loadClasses() {
      try {
        const res = await apiSlice.get<{ success: boolean; classes: ClassSectionInfo[] }>(endpoints.parent.classesSections)
        if (res.success) {
          setClassesInfo(res.classes)
        }
      } catch (err) {
        console.error('Failed to load class configuration:', err)
      }
    }
    loadClasses()
  }, [showModal])

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRequestError(null)
    setRequestSuccess(null)
    setSubmittingRequest(true)

    try {
      const payload = {
        firstName: formFirstName,
        lastName: formLastName,
        gender: formGender,
        birthday: formBirthday || undefined,
        classId: Number(formClassId),
        sectionId: Number(formSectionId)
      }

      const res = await apiSlice.post<{ success: boolean; message: string }>(endpoints.parent.createSiblingRequest, payload)
      if (res.success) {
        setRequestSuccess(res.message || 'Sibling request submitted successfully.')
        setFormFirstName('')
        setFormLastName('')
        setFormGender('Male')
        setFormBirthday('')
        setFormClassId('')
        setFormSectionId('')
        fetchSiblingRequests()
        setTimeout(() => {
          setShowModal(false)
          setRequestSuccess(null)
        }, 1500)
      }
    } catch (err: any) {
      setRequestError(err.message || 'Failed to submit sibling request.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageBody.trim()) return
    setSendingMessage(true)
    setMessageSuccess(null)

    try {
      const payload = {
        studentId: selectedChildId,
        recipientRole: messageRecipientRole,
        subject: messageSubject.trim() || 'Parent Inquiry',
        message: messageBody.trim(),
      }
      const res = await apiSlice.post<{ success: boolean; message: string }>(endpoints.parent.sendMessage, payload)
      if (res.success) {
        setMessageSuccess('Message sent successfully!')
        setMessageSubject('')
        setMessageBody('')
        fetchParentMessages()
        setTimeout(() => {
          setShowMessageModal(false)
          setMessageSuccess(null)
        }, 1500)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message.')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parentProfile) return
    setSavingProfile(true)
    setProfileMessage(null)

    try {
      const res = await apiSlice.put<{ success: boolean; message: string }>(endpoints.parent.updateProfile, {
        name: parentProfile.name,
        email: parentProfile.email,
        mobileno: parentProfile.mobileno,
        address: parentProfile.address,
        city: parentProfile.city,
        state: parentProfile.state,
        occupation: parentProfile.occupation,
        education: parentProfile.education,
        fatherName: parentProfile.fatherName,
        motherName: parentProfile.motherName,
      })
      if (res.success) {
        setProfileMessage('Profile updated successfully!')
        setTimeout(() => setProfileMessage(null), 3000)
      }
    } catch (err: any) {
      setProfileMessage(err.message || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setChangingPassword(true)
    setPasswordMessage(null)

    try {
      const res = await apiSlice.put<{ success: boolean; message: string }>(endpoints.parent.changePassword, {
        currentPassword,
        newPassword,
      })
      if (res.success) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordMessage(null), 3000)
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' })
    } finally {
      setChangingPassword(false)
    }
  }

  const selectedClass = classesInfo.find(c => c.id === Number(formClassId))
  const sections = selectedClass ? selectedClass.sections.map(s => s.section) : []

  // Fetch children list
  useEffect(() => {
    let active = true

    async function loadChildren() {
      try {
        setLoadingList(true)
        setError(null)
        const res = await apiSlice.get<{ success: boolean; children: ChildSummary[] }>(endpoints.parent.children)
        
        if (!active) return
        if (res.success) {
          setChildren(res.children)
          if (res.children.length > 0) {
            setSelectedChildId(res.children[0].id)
          }
        } else {
          throw new Error('Failed to load children list.')
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'An error occurred loading children records.')
        }
      } finally {
        if (active) setLoadingList(false)
      }
    }

    loadChildren()

    return () => {
      active = false
    }
  }, [])

  // Fetch active child data when selectedChildId changes
  useEffect(() => {
    if (selectedChildId === null) return
    const childId = selectedChildId
    let active = true

    async function loadChildData() {
      try {
        setLoadingChild(true)
        setProfile(null)
        setAttendance(null)
        setTasks(null)
        setGrades(null)

        // 1. Profile
        const profileRes = await apiSlice.get<{ success: boolean } & ChildProfile>(endpoints.parent.childProfile(childId))
        if (!active) return
        if (profileRes.success) setProfile(profileRes)

        // 2. Attendance
        const attendanceRes = await apiSlice.get<{ success: boolean } & AttendanceData>(endpoints.parent.childAttendance(childId))
        if (attendanceRes.success) setAttendance(attendanceRes)

        // 3. Tasks
        const tasksRes = await apiSlice.get<{ success: boolean } & TaskData>(endpoints.parent.childTasks(childId))
        if (tasksRes.success) setTasks(tasksRes)

        // 4. Grades
        const gradesRes = await apiSlice.get<{ success: boolean } & GradeData>(endpoints.parent.childGrades(childId))
        if (gradesRes.success) setGrades(gradesRes)

        // 5. Invoices
        setLoadingInvoices(true)
        const invoicesRes = await apiSlice.get<{
          success: boolean
          invoices: InvoiceData[]
          schoolBank: SchoolBankData | null
          totalFeeAmount: number
          totalPaidAmount: number
          totalBalance: number
        }>(endpoints.parent.childInvoices(childId))
        if (invoicesRes.success) {
          setInvoices(invoicesRes.invoices)
          setSchoolBank(invoicesRes.schoolBank)
          setTotalFeeAmount(invoicesRes.totalFeeAmount)
          setTotalPaidAmount(invoicesRes.totalPaidAmount)
          setTotalBalance(invoicesRes.totalBalance)
        }
        setLoadingInvoices(false)

        // 6. Timetable
        setLoadingTimetable(true)
        const timetableRes = await apiSlice.get<{
          success: boolean
          timetableSlots: TimetableSlot[]
          examScheduleSlots: ExamScheduleSlot[]
        }>(endpoints.parent.childTimetable(childId))
        if (timetableRes.success) {
          setTimetableSlots(timetableRes.timetableSlots)
          setExamSlots(timetableRes.examScheduleSlots)
        }
        setLoadingTimetable(false)

        // 7. Teachers
        setLoadingTeachers(true)
        const teachersRes = await apiSlice.get<{
          success: boolean
          formTeacher: TeacherInfo | null
          subjectTeachers: TeacherInfo[]
        }>(endpoints.parent.childTeachers(childId))
        if (teachersRes.success) {
          setFormTeacher(teachersRes.formTeacher)
          setSubjectTeachers(teachersRes.subjectTeachers)
        }
        setLoadingTeachers(false)

      } catch (err: any) {
        console.error('Error fetching child details:', err)
      } finally {
        if (active) setLoadingChild(false)
      }
    }

    loadChildData()

    return () => {
      active = false
    }
  }, [selectedChildId])

  // Export PDF Report Card
  const handleExportPdf = async () => {
    if (!selectedChildId) return
    try {
      setExportingPdf(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : ''
      const url = endpoints.parent.childExportPdf(selectedChildId, rankingType, rankingLimit)
      
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Failed to generate report card PDF.')

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `Report_Card_${selectedChildId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF report card.')
    } finally {
      setExportingPdf(false)
    }
  }

  const activeChild = children.find(c => c.id === selectedChildId)

  // Current formatted date
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Group timetable by day
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  const timetableByDay: Record<string, TimetableSlot[]> = {}
  daysOfWeek.forEach(d => {
    timetableByDay[d] = timetableSlots.filter(s => s.dayOfWeek.toUpperCase() === d)
  })

  // Filter attendance logs
  const filteredAttendanceLogs = (attendance?.logs || []).filter(l => {
    if (attendanceFilter === 'ALL') return true
    return l.status.toUpperCase() === attendanceFilter.toUpperCase()
  })

  // Compute dynamic checklist reminders based strictly on true database tables
  const dynamicReminders: Array<{ id: string; text: string; defaultDone: boolean }> = []
  
  if (totalBalance > 0) {
    dynamicReminders.push({
      id: 'rem_fee',
      text: `Outstanding fee balance of ₦${totalBalance.toLocaleString()} pending payment`,
      defaultDone: false
    })
  } else if (totalFeeAmount > 0) {
    dynamicReminders.push({
      id: 'rem_fee_cleared',
      text: 'Term school fees paid in full',
      defaultDone: true
    })
  }

  const pendingSiblings = siblingRequests.filter(s => s.status === 'pending')
  if (pendingSiblings.length > 0) {
    dynamicReminders.push({
      id: 'rem_sib',
      text: `${pendingSiblings.length} sibling admission application under review`,
      defaultDone: false
    })
  }

  const unreadMsgs = messages.filter(m => !m.isRead)
  if (unreadMsgs.length > 0) {
    dynamicReminders.push({
      id: 'rem_msg',
      text: `${unreadMsgs.length} unread message(s) from school administration / teacher`,
      defaultDone: false
    })
  }

  if (attendance && attendance.absentCount > 0) {
    dynamicReminders.push({
      id: 'rem_att',
      text: `Review child attendance log (${attendance.absentCount} day(s) absent)`,
      defaultDone: true
    })
  }

  if (grades?.overallAverage) {
    dynamicReminders.push({
      id: 'rem_grd',
      text: `Acknowledge terminal report card average (${grades.overallAverage}%)`,
      defaultDone: true
    })
  }

  return (
    <div className="space-y-6 pb-12 font-sans">

      {/* Top Welcome Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full opacity-10 bg-white blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs text-blue-100 flex items-center gap-1.5">
                <Sparkles size={13} className="text-yellow-300" />
                Parent Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Good Day, {user.username}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 font-medium max-w-xl">
              Connected with school administration, teachers, and your children&apos;s real-time academic progress.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-xs">
            <div className="flex items-center gap-2.5">
              <CalendarIcon size={18} className="text-sky-200" />
              <div>
                <span className="font-bold block text-white">{currentDateFormatted}</span>
                {profile?.sessionId && (
                  <span className="text-[11px] text-blue-100 font-medium">Session ID: #{profile.sessionId}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Child Switcher Bar */}
      {children.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-blue-600" />
              Child Profile:
            </span>
            <div className="flex flex-wrap gap-2">
              {children.map((child) => {
                const isSelected = child.id === selectedChildId
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/30 bg-blue-200">
                      <img
                        src={getAvatarUrl(child.photo, `${child.firstName} ${child.lastName}`)}
                        alt={`${child.firstName} ${child.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span>{child.firstName} {child.lastName}</span>
                    <span className="opacity-80 font-normal">({child.className} {child.sectionName})</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMessageModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200/60 cursor-pointer"
            >
              <MessageSquare size={15} />
              <span>Contact Teacher / Admin</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition border border-rose-200/60 cursor-pointer"
            >
              <Plus size={16} />
              <span>Sibling Admission</span>
            </button>
          </div>
        </div>
      )}

      {/* DYNAMIC SECTION CONTENT SWITCHER */}
      
      {/* SECTION 1: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          
          {/* 6 Main KPI Stat Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            
            {/* Card 1: Classmates */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <div>
                  <span className="text-xl font-extrabold text-slate-900 block">
                    {profile?.fellowStudentsCount ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Classmates</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">
                {profile?.fellowStudentsCount ? '✓ Enrolled Class' : 'Not Enrolled'}
              </span>
            </div>

            {/* Card 2: Form Teacher */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-extrabold text-slate-900 block truncate" title={formTeacher?.name || profile?.formTeacher?.name || 'Not Assigned'}>
                    {formTeacher?.name || profile?.formTeacher?.name || 'Not Assigned'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Form Teacher</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold ${(formTeacher || profile?.formTeacher) ? 'text-purple-600' : 'text-slate-400'}`}>
                {(formTeacher || profile?.formTeacher) ? '↗ Assigned' : 'Unassigned'}
              </span>
            </div>

            {/* Card 3: Subjects */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <BookOpen size={20} />
                </div>
                <div>
                  <span className="text-xl font-extrabold text-slate-900 block">
                    {profile?.subjects?.length ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Subjects</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">
                {profile?.subjects?.length ? '✓ Active Subjects' : 'No Subjects'}
              </span>
            </div>

            {/* Card 4: Attendance */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Activity size={20} />
                </div>
                <div>
                  <span className="text-xl font-extrabold text-slate-900 block">
                    {attendance ? `${attendance.percentage}%` : '0%'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Attendance</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold ${attendance && attendance.percentage >= 80 ? 'text-amber-600' : 'text-slate-400'}`}>
                {attendance ? (attendance.percentage >= 80 ? '✓ Good Standing' : '⚠ Attention Needed') : 'No Attendance'}
              </span>
            </div>

            {/* Card 5: Grade Average */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <span className="text-xl font-extrabold text-slate-900 block">
                    {grades?.overallAverage !== undefined && grades.overallAverage !== null ? `${grades.overallAverage}%` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Grade Average</span>
                </div>
              </div>
              <span className="text-[10px] text-rose-600 font-bold">
                {grades?.rank ? `Rank #${grades.rank} of ${grades.totalClassStudents || 0}` : 'No Grades Published'}
              </span>
            </div>

            {/* Card 6: Fee Balance */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <DollarSign size={20} />
                </div>
                <div>
                  <span className="text-xl font-extrabold text-slate-900 block">
                    {totalFeeAmount === 0 ? '₦0.00' : totalBalance <= 0 ? 'Cleared' : `₦${totalBalance.toLocaleString()}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Fee Balance</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold ${totalBalance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalFeeAmount === 0 ? 'No Invoice' : totalBalance <= 0 ? '✓ Paid in Full' : '⚠ Outstanding'}
              </span>
            </div>

          </div>

          {/* Main Analytics Section (2 Grid Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (8 cols): Analytics Charts & Overview Cards */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Middle Row: 3 Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Donut Attendance Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center justify-between">
                      <span>Attendance Overview</span>
                      <Activity size={14} className="text-emerald-500" />
                    </h3>

                    <div className="relative w-28 h-28 mx-auto my-2 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#10B981" strokeWidth="3.5" strokeDasharray={`${attendance ? attendance.percentage : 0}, 100`} />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-black text-slate-900 leading-none block">
                          {attendance ? `${attendance.percentage}%` : '0%'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">Overall</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Present</span>
                        <span className="font-bold">{attendance ? attendance.presentCount : 0} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Late</span>
                        <span className="font-bold">{attendance ? attendance.lateCount : 0} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Absent</span>
                        <span className="font-bold">{attendance ? attendance.absentCount : 0} days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Performance Subject Bars (Dynamically built strictly from DB table) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center justify-between">
                      <span>Academic Performance</span>
                      <TrendingUp size={14} className="text-blue-500" />
                    </h3>

                    {grades?.reportCard && grades.reportCard.length > 0 ? (
                      <div className="space-y-2.5 pt-1 max-h-[160px] overflow-y-auto">
                        {grades.reportCard.slice(0, 4).map((item, idx) => {
                          const scoreVal = Number(item.mark || 0)
                          const colors = ['bg-emerald-500', 'bg-blue-600', 'bg-purple-600', 'bg-pink-500']
                          const textColors = ['text-emerald-600', 'text-blue-600', 'text-purple-600', 'text-pink-600']
                          return (
                            <div key={item.id || idx}>
                              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                                <span className="truncate max-w-[130px]">{item.subjectName}</span>
                                <span className={`${textColors[idx % 4]} font-bold`}>{scoreVal}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${colors[idx % 4]} rounded-full`} style={{ width: `${Math.min(100, Math.max(0, scoreVal))}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs italic">
                        No subject grades published yet.
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={handleExportPdf}
                      disabled={exportingPdf}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      {exportingPdf ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      <span>Export Report Card (PDF)</span>
                    </button>
                  </div>
                </div>

                {/* School Fee Status Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center justify-between">
                      <span>School Fee Status</span>
                      <DollarSign size={14} className="text-amber-500" />
                    </h3>

                    <div className="space-y-3 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Term Bill</span>
                        <span className="text-2xl font-black text-slate-900">
                          ₦{totalFeeAmount.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>Payment Progress</span>
                          <span className="text-emerald-600 font-bold">
                            {totalFeeAmount > 0 ? `${Math.round((totalPaidAmount / totalFeeAmount) * 100)}% Paid` : (totalPaidAmount > 0 ? '100% Paid' : '0% Paid')}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${totalFeeAmount > 0 ? Math.min(100, (totalPaidAmount / totalFeeAmount) * 100) : (totalPaidAmount > 0 ? 100 : 0)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Outstanding Balance:</span>
                          <span className={`font-bold ${totalBalance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            ₦{totalBalance.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>School Bank:</span>
                          <span className="font-bold text-slate-900 truncate max-w-[120px]">
                            {schoolBank?.bankName || 'Not Configured'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Quick Actions Row */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4">
                  Parent Quick Actions
                </h3>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-100 transition cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Sibling Admission</span>
                  </button>

                  <button
                    onClick={handleExportPdf}
                    disabled={exportingPdf}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition cursor-pointer"
                  >
                    <Download size={16} />
                    <span>Download Report Card</span>
                  </button>

                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-600 font-bold text-xs hover:bg-purple-100 transition cursor-pointer"
                  >
                    <Mail size={16} />
                    <span>Message Form Teacher</span>
                  </button>

                  <button
                    onClick={() => alert('School bus live location synchronized with MyEduRide module.')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-100 transition cursor-pointer"
                  >
                    <Bus size={16} />
                    <span>Track School Bus</span>
                  </button>
                </div>
              </div>

              {/* 4 Secondary Stat Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Today&apos;s Classes</span>
                  <span className="text-xl font-extrabold text-slate-900 block">{timetableSlots.length} Subjects</span>
                  <span className={`text-[10px] font-bold ${timetableSlots.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {timetableSlots.length > 0 ? '✓ Scheduled on timetable' : 'No timetable set'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sibling Admissions</span>
                  <span className="text-xl font-extrabold text-slate-900 block">{siblingRequests.length} Applications</span>
                  <span className={`text-[10px] font-bold ${siblingRequests.length > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                    {siblingRequests.length > 0 ? '↗ Under review' : 'No active requests'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Messages / Notices</span>
                  <span className="text-xl font-extrabold text-slate-900 block">{messages.length} Direct Messages</span>
                  <span className="text-[10px] text-purple-600 font-bold">School Admin & Teachers</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">MyEduRide Bus Tracker</span>
                  <span className="text-sm font-extrabold text-slate-900 block truncate">
                    {profile?.registerNo ? `ID Card: ${profile.registerNo}` : 'No Bus Assigned'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">✓ MyEduRide Synced</span>
                </div>

              </div>

              {/* Recent Activities Strip */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                  Recent School Activities & Direct Messages
                </h3>

                <div className="space-y-3">
                  {messages.length > 0 ? (
                    messages.slice(0, 3).map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                            <MessageSquare size={16} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">{m.subject || 'Direct Communication'}</span>
                            <span className="text-slate-500 text-[11px] truncate block">{m.message}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs italic">
                      No recent messages or activity logs found.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column (4 cols): Sidebar Widgets */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Form Teacher & Subject Teachers Widget */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-purple-600" />
                    Teacher Directory
                  </h3>
                  <span className="text-[10px] text-blue-600 font-bold">{subjectTeachers.length + (formTeacher ? 1 : 0)} Staff</span>
                </div>

                <div className="space-y-3">
                  {formTeacher ? (
                    <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-purple-200 overflow-hidden shrink-0 border border-purple-300">
                          <img
                            src={getAvatarUrl(formTeacher.photo, formTeacher.name)}
                            alt={formTeacher.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{formTeacher.name}</h4>
                          <span className="text-[10px] text-purple-700 font-semibold block">Form Teacher</span>
                          <span className="text-[10px] text-slate-500 truncate block">{formTeacher.email || formTeacher.phone || 'Class Supervisor'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMessageRecipientRole('TEACHER')
                          setShowMessageModal(true)
                        }}
                        className="p-1.5 rounded-lg bg-white text-purple-700 hover:bg-purple-100 transition border border-purple-200 cursor-pointer"
                        title="Send Message"
                      >
                        <Mail size={14} />
                      </button>
                    </div>
                  ) : null}

                  {subjectTeachers.map((t) => (
                    <div key={t.id} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                          <img
                            src={getAvatarUrl(t.photo, t.name)}
                            alt={t.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 text-xs truncate">{t.name}</h4>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {t.subjects?.map(s => s.name).join(', ') || t.department || 'Subject Teacher'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!formTeacher && subjectTeachers.length === 0 && (
                    <div className="py-4 text-center text-slate-400 text-xs italic">
                      No teachers currently assigned to this class.
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Events Widget */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Upcoming Events
                  </h3>
                  <span className="text-[10px] text-blue-600 font-bold cursor-pointer">View All</span>
                </div>

                <div className="space-y-3 text-xs">
                  {events.length > 0 ? (
                    events.slice(0, 3).map((ev) => {
                      const d = new Date(ev.startDate)
                      const dayNum = d.getDate()
                      const monthStr = d.toLocaleDateString('en-US', { month: 'short' })
                      return (
                        <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center text-[10px] font-bold shrink-0">
                            <span>{dayNum}</span>
                            <span className="uppercase text-[8px]">{monthStr}</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{ev.title}</h4>
                            <p className="text-[11px] text-slate-500 truncate">{ev.description || 'Academic Calendar Event'}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs italic">
                      No upcoming events scheduled.
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Reminders Interactive Widget (Computed strictly from true DB tables) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Parent Checklist Reminders
                  </h3>
                  <span className="text-[10px] text-blue-600 font-bold">{dynamicReminders.length} Items</span>
                </div>

                <div className="space-y-2.5">
                  {dynamicReminders.length > 0 ? (
                    dynamicReminders.map((r) => {
                      const isDone = completedReminders[r.id] !== undefined ? completedReminders[r.id] : r.defaultDone
                      return (
                        <button
                          key={r.id}
                          onClick={() => toggleDynamicReminder(r.id)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-left text-xs transition border border-transparent hover:border-slate-100 cursor-pointer"
                        >
                          {isDone ? (
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                          ) : (
                            <Circle size={18} className="text-slate-300 shrink-0" />
                          )}
                          <span className={`font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {r.text}
                          </span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="py-4 text-center text-slate-400 text-xs italic">
                      All parent checklist items clear.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SECTION 2: SIBLING ADMISSIONS */}
      {activeSection === 'sibling-requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <GraduationCap className="text-rose-600" size={24} />
                Sibling Admissions & Applications
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Apply for admission for your other children under the family account and track approval status.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <Plus size={16} />
              <span>New Sibling Application</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Submitted Sibling Requests ({siblingRequests.length})
              </h3>
              {loadingRequests && <Loader2 size={16} className="animate-spin text-rose-600" />}
            </div>

            {siblingRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="p-4">Child Name</th>
                      <th className="p-4">Gender</th>
                      <th className="p-4">Requested Class</th>
                      <th className="p-4">Section</th>
                      <th className="p-4">Submitted Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siblingRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">
                          {req.firstName} {req.lastName}
                        </td>
                        <td className="p-4">{req.gender}</td>
                        <td className="p-4 font-semibold text-blue-600">{req.className}</td>
                        <td className="p-4">{req.sectionName}</td>
                        <td className="p-4 text-slate-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          {req.status === 'approved' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              ✓ Approved
                            </span>
                          )}
                          {req.status === 'pending' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                              ⌛ Pending Review
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              ✕ Rejected
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right text-slate-500 text-[11px]">
                          {req.rejectionReason ? (
                            <span className="text-rose-600 font-semibold">{req.rejectionReason}</span>
                          ) : req.status === 'approved' ? (
                            <span className="text-emerald-600 font-semibold">Student profile created</span>
                          ) : (
                            'Under Admin Review'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                  <GraduationCap size={24} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">No Sibling Requests Submitted Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the button below to submit a sibling admission application for your other child.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition cursor-pointer"
                >
                  Apply Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: GRADES & REPORT CARD */}
      {activeSection === 'grades' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={24} />
                Terminal Grade Progress & Official Report Card
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Subject-by-subject assessment performance, class position, and printable terminal evaluation.
              </p>
            </div>

            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-600/20 cursor-pointer"
            >
              {exportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Download Report Card (PDF)</span>
            </button>
          </div>

          {/* ECD Montessori Evaluation (If applicable) */}
          {grades?.isEcd && (
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-3xl text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-purple-700/50 pb-3">
                <span className="px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-400/30">
                  Montessori ECD Assessment Matrix
                </span>
                <span className="text-xs font-semibold text-purple-300">Early Childhood Development</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <span className="text-purple-300 font-semibold block">Writing Mastery</span>
                  <span className="text-sm font-extrabold">{grades.assessment?.writingMastery || 'N/A'}</span>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <span className="text-purple-300 font-semibold block">Physical Coordination</span>
                  <span className="text-sm font-extrabold">{grades.assessment?.physicalCoordination || 'N/A'}</span>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <span className="text-purple-300 font-semibold block">Peer Respect</span>
                  <span className="text-sm font-extrabold">{grades.assessment?.peerRespect || 'N/A'}</span>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <span className="text-purple-300 font-semibold block">Group Participation</span>
                  <span className="text-sm font-extrabold">{grades.assessment?.activeGroupParticipation || 'N/A'}</span>
                </div>
              </div>
              {grades.assessment?.narrativeComment && (
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-xs text-purple-100">
                  <span className="font-bold text-white block mb-1">Teacher Narrative:</span>
                  <p>{grades.assessment.narrativeComment}</p>
                </div>
              )}
            </div>
          )}

          {/* Grades Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Subject Grades & Class Comparative Scores
                </h3>
                <p className="text-[11px] text-slate-500">
                  Overall Average: <span className="font-bold text-blue-600">{grades?.overallAverage !== undefined ? `${grades.overallAverage}%` : 'N/A'}</span> | Class Rank: <span className="font-bold text-emerald-600">{grades?.rank ? `#${grades.rank}` : 'N/A'}</span> of {grades?.totalClassStudents ?? 0}
                </p>
              </div>

              {/* Ranking settings */}
              <div className="flex items-center gap-3 text-xs">
                <label className="font-semibold text-slate-600">PDF Ranking Mode:</label>
                <select
                  value={rankingType}
                  onChange={(e) => setRankingType(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold"
                >
                  <option value="full">Show Full Class Rank</option>
                  <option value="top_n">Show Top N Only</option>
                  <option value="hidden">Hide Rank on PDF</option>
                </select>
              </div>
            </div>

            {grades?.reportCard && grades.reportCard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="p-4">Subject Name</th>
                      <th className="p-4">Code</th>
                      <th className="p-4">CBT Score</th>
                      <th className="p-4">Theory Score</th>
                      <th className="p-4">Total Score</th>
                      <th className="p-4">Class Avg</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grades.reportCard.map((item) => {
                      const total = Number(item.mark || 0)
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 font-bold text-slate-900">{item.subjectName}</td>
                          <td className="p-4 text-slate-500 font-mono">{item.subjectCode || 'N/A'}</td>
                          <td className="p-4 font-semibold text-purple-600">{item.cbtMark || '-'}</td>
                          <td className="p-4 font-semibold text-indigo-600">{item.theoryMark || '-'}</td>
                          <td className="p-4 font-black text-slate-900 text-sm">
                            {item.absent ? <span className="text-rose-600 font-bold">ABSENT</span> : `${total}%`}
                          </td>
                          <td className="p-4 font-semibold text-slate-500">{item.classAverage}%</td>
                          <td className="p-4 text-right">
                            {total >= 70 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                Excellent
                              </span>
                            ) : total >= 50 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                Good
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                Needs Focus
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                No grade records published for this active term yet.
              </div>
            )}
          </div>

          {/* Principal Commentary */}
          {grades?.commentary && (
            <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-blue-700 block">
                Principal Sign-off Commentary
              </span>
              <p className="font-medium italic text-slate-800">
                &ldquo;{grades.commentary}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: ATTENDANCE LOGS */}
      {activeSection === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={24} />
                Attendance Logs & Daily Punctuality Record
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time daily roll call records, punctuality status, and monthly presence percentage ring.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {['ALL', 'PRESENT', 'LATE', 'ABSENT'].map((status) => (
                <button
                  key={status}
                  onClick={() => setAttendanceFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    attendanceFilter === status
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Daily Attendance History ({filteredAttendanceLogs.length} Records)
              </h3>
              <span className="text-xs font-bold text-emerald-600">
                {attendance ? `${attendance.percentage}% Overall Presence` : '0% Overall'}
              </span>
            </div>

            {filteredAttendanceLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Punctuality Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendanceLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">
                          {new Date(log.attendanceDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="p-4">
                          {log.status === 'Present' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              ✓ Present
                            </span>
                          )}
                          {log.status === 'Late' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              ⏰ Late Arrival
                            </span>
                          )}
                          {log.status === 'Absent' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              ✕ Absent
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500">
                          {log.remark || 'Regular roll call entry by form teacher'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                No attendance logs found matching the selected filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: BILLING & FEE INVOICES */}
      {activeSection === 'billing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <CreditCard className="text-emerald-600" size={24} />
                School Fee Invoices & Payment Portal
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Itemized term fee breakdown, payment receipts, and official school bank details for bank transfers.
              </p>
            </div>

            <span className={`px-4 py-2 rounded-2xl text-xs font-bold border ${
              totalBalance <= 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {totalBalance <= 0 ? '✓ Account Cleared' : `Outstanding Balance: ₦${totalBalance.toLocaleString()}`}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Invoices List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Term Invoices ({invoices.length})
                  </h3>
                  {loadingInvoices && <Loader2 size={16} className="animate-spin text-emerald-600" />}
                </div>

                {invoices.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="p-5 hover:bg-slate-50/80 transition space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{inv.title}</span>
                            <span className="text-[11px] text-slate-400 font-mono">Invoice #: {inv.invoiceNo}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700'
                              : inv.status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {inv.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium block">Total Fee:</span>
                            <span className="font-extrabold text-slate-900">₦{inv.amount.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium block">Paid Amount:</span>
                            <span className="font-extrabold text-emerald-600">₦{inv.paidAmount.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium block">Balance Due:</span>
                            <span className="font-extrabold text-rose-600">₦{inv.balance.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Itemized breakdown */}
                        {inv.items.length > 0 && (
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fee Breakdown:</span>
                            {inv.items.map(item => (
                              <div key={item.id} className="flex justify-between text-slate-700">
                                <span>{item.name}</span>
                                <span className="font-semibold">₦{item.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    No active invoices found for this child.
                  </div>
                )}
              </div>
            </div>

            {/* School Bank Account Card (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl space-y-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark size={20} className="text-amber-400" />
                    <span className="font-extrabold text-xs tracking-wider uppercase">School Bank Transfer</span>
                  </div>
                  {schoolBank && (
                    <button
                      onClick={handleCopyBank}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedBank ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedBank ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                {schoolBank ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bank Name</span>
                      <span className="text-sm font-extrabold text-white">{schoolBank.bankName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Account Number</span>
                      <span className="text-xl font-black text-amber-400 font-mono tracking-wider">{schoolBank.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Account Name</span>
                      <span className="text-xs font-bold text-slate-200">{schoolBank.accountName}</span>
                    </div>
                    {schoolBank.sortCode && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sort Code</span>
                        <span className="text-xs font-mono text-slate-300">{schoolBank.sortCode}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-300 text-xs italic">
                    School Bank Account Not Configured. Please contact administration for payment details.
                  </div>
                )}

                <div className="pt-3 border-t border-white/10 text-[11px] text-slate-300 leading-relaxed">
                  💡 Please include child&apos;s full name and Register No ({activeChild?.registerNo || 'N/A'}) in the transfer narration for confirmation.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 6: TERM CALENDAR & TIMETABLE */}
      {activeSection === 'calendar' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <CalendarIcon className="text-indigo-600" size={24} />
                Term Calendar & Class Timetable
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                View school academic events, PTA meetings, exam dates, and child daily period schedule.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setCalendarView('events')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  calendarView === 'events' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                School Events
              </button>
              <button
                onClick={() => setCalendarView('timetable')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  calendarView === 'timetable' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Class Timetable
              </button>
            </div>
          </div>

          {calendarView === 'events' ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Academic Term Events ({events.length})
              </h3>
              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((ev) => (
                    <div key={ev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                        <span>{new Date(ev.startDate).getDate()}</span>
                        <span className="uppercase text-[9px]">{new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{ev.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{ev.description || 'School Activity'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 text-xs">
                  No academic events scheduled for this term yet.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Weekly Class Period Timetable ({activeChild?.className} {activeChild?.sectionName})
              </h3>
              
              <div className="space-y-4">
                {daysOfWeek.map((day) => {
                  const slots = timetableByDay[day] || []
                  return (
                    <div key={day} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <h4 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-200 pb-2">
                        {day}
                      </h4>
                      {slots.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                          {slots.map((slot) => (
                            <div key={slot.id} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                              <span className="text-[10px] font-bold text-indigo-600 block">
                                ⏰ {slot.startTime} - {slot.endTime}
                              </span>
                              <span className="font-extrabold text-slate-900 block">{slot.title}</span>
                              {slot.teacherName && (
                                <span className="text-[10px] text-slate-500 block">Teacher: {slot.teacherName}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No periods assigned on {day}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 7: ACCOUNT & SECURITY SETTINGS */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <User className="text-slate-700" size={24} />
                Parent Profile & Security Settings
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Update guardian contact details, residential address, and account password.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Edit Profile Form (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide pb-2 border-b border-slate-100">
                Guardian Profile Details
              </h3>

              {profileMessage && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                  {profileMessage}
                </div>
              )}

              {parentProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={parentProfile.name || ''}
                        onChange={(e) => setParentProfile({ ...parentProfile, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
                      <input
                        type="text"
                        value={parentProfile.mobileno || ''}
                        onChange={(e) => setParentProfile({ ...parentProfile, mobileno: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={parentProfile.email || ''}
                        onChange={(e) => setParentProfile({ ...parentProfile, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Occupation</label>
                      <input
                        type="text"
                        value={parentProfile.occupation || ''}
                        onChange={(e) => setParentProfile({ ...parentProfile, occupation: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Home Address</label>
                    <input
                      type="text"
                      value={parentProfile.address || ''}
                      onChange={(e) => setParentProfile({ ...parentProfile, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={parentProfile.city || ''}
                        onChange={(e) => setParentProfile({ ...parentProfile, city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={parentProfile.state || ''}
                        onChange={(e) => setParentProfile({ ...parentProfile, state: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-xs cursor-pointer"
                    >
                      {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Loading profile settings...
                </div>
              )}
            </div>

            {/* Change Password Form (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Lock size={14} className="text-rose-600" />
                Change Password
              </h3>

              {passwordMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold border ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  {passwordMessage.text}
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition shadow-xs cursor-pointer"
                  >
                    {changingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Sibling Admission Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Apply for Sibling Admission</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {requestSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {requestSuccess}
              </div>
            )}

            {requestError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                {requestError}
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formBirthday}
                    onChange={(e) => setFormBirthday(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="">Select Class</option>
                    {classesInfo.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section *</label>
                  <select
                    required
                    value={formSectionId}
                    onChange={(e) => setFormSectionId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="">Select Section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md cursor-pointer"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Messaging Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="text-indigo-600" size={20} />
                Send Message to Teacher / Admin
              </h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {messageSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {messageSuccess}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Category *</label>
                <select
                  value={messageRecipientRole}
                  onChange={(e) => setMessageRecipientRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="TEACHER">Form Teacher / Subject Teachers</option>
                  <option value="ADMIN">School Administrator / Principal</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Leave Request or Progress Inquiry"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your message detail here..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
