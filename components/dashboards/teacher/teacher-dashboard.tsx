'use client'

import { useState, useEffect } from 'react'
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
  Check
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
import SchoolCalendar from '../admin/school-calendar'
import { getAvatarUrl } from '@/lib/avatar'

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
  }
  activeSection?: string
  onNavigate?: (section: string) => void
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

export function TeacherDashboard({ user, activeSection, onNavigate }: DashboardProps) {
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

  // New Homework Form State
  const [hwTitle, setHwTitle] = useState<string>('')
  const [hwDescription, setHwDescription] = useState<string>('')
  const [hwClassId, setHwClassId] = useState<string>('')
  const [hwSubjectId, setHwSubjectId] = useState<string>('')
  const [hwDueDate, setHwDueDate] = useState<string>('')
  const [publishingHw, setPublishingHw] = useState<boolean>(false)

  // Submissions Drawer/Modal State
  const [selectedHwForSubmissions, setSelectedHwForSubmissions] = useState<any | null>(null)
  const [hwSubmissions, setHwSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false)

  // Submissions Grading State
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null)
  const [gradeScore, setGradeScore] = useState<string>('')
  const [gradeFeedback, setGradeFeedback] = useState<string>('')
  const [savingGrade, setSavingGrade] = useState<boolean>(false)

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

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hwTitle.trim() || !hwClassId || !hwSubjectId || !hwDueDate) return
    try {
      setPublishingHw(true)
      const res = await apiSlice.post<{ success: boolean; homework: any; message: string }>(endpoints.teacher.homeworks, {
        title: hwTitle.trim(),
        description: hwDescription.trim(),
        classId: Number(hwClassId),
        subjectId: Number(hwSubjectId),
        dueDate: hwDueDate
      })
      if (res.success && res.homework) {
        setHomeworksList(prev => [res.homework, ...prev])
        setHwTitle('')
        setHwDescription('')
        setHwClassId('')
        setHwSubjectId('')
        setHwDueDate('')
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

  // Render Sub-Views based on navigation tab
  if (activeSection === 'gradebook' || activeSection === 'grades') {
    return <GradebookInterface />
  }

  // MY STUDENTS / ROSTER SUB-VIEW
  if (activeSection === 'roster' || activeSection === 'my-classes' || activeSection === 'my-students') {
    return (
      <div className="space-y-6 pb-12 font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="text-blue-600" size={24} />
              Student Roster & Family Directory
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              View students in your assigned classes and communicate directly with guardians and parents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              Total Students: {rosterStudents.length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Class Roster & Guardian Information ({rosterStudents.length})
            </h3>
            {loadingRoster && <Loader2 size={16} className="animate-spin text-blue-600" />}
          </div>

          {rosterStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">Reg No</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Gender</th>
                    <th className="p-4">Parent / Guardian</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4 text-right">Quick Communication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rosterStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        {st.registerNo || `REG-${st.id}`}
                      </td>
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden shrink-0 border border-blue-200">
                          <img
                            src={getAvatarUrl(st.photo, `${st.firstName} ${st.lastName}`)}
                            alt={`${st.firstName} ${st.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>{st.firstName} {st.lastName}</span>
                      </td>
                      <td className="p-4 font-semibold text-blue-600">{st.className} {st.sectionName}</td>
                      <td className="p-4">{st.gender}</td>
                      <td className="p-4">
                        {st.parent ? (
                          <div>
                            <span className="font-bold text-slate-900 block">{st.parent.name}</span>
                            <span className="text-[10px] text-slate-400 block">{st.parent.fatherName ? `Father: ${st.parent.fatherName}` : (st.parent.motherName ? `Mother: ${st.parent.motherName}` : 'Guardian')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No Parent Linked</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        {st.parent?.mobileno || 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        {st.parent ? (
                          <button
                            onClick={() => {
                              setSelectedParentId(st.parent!.id)
                              setSelectedStudentId(st.id)
                              setSelectedParentName(`${st.parent!.name} (Parent of ${st.firstName})`)
                              setShowMsgModal(true)
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Mail size={13} />
                            <span>Message Parent</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">No Contact</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              No students enrolled in your assigned classes yet.
            </div>
          )}
        </div>

        {/* Message Parent Modal */}
        {showMsgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="text-indigo-600" size={20} />
                  Send Notice to Parent
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

              <form onSubmit={handleSendParentMessage} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient Parent</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedParentName}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Progress Update / Homework Reminder"
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
                    placeholder="Write your note to the parent..."
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

  // HOMEWORK & ASSIGNMENTS MANAGEMENT SUB-VIEW
  if (activeSection === 'assignments' || activeSection === 'homeworks') {
    return (
      <div className="space-y-6 pb-12 font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="text-purple-600" size={24} />
              Homework & Assignments Manager
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Create homework assignments for your classes and grade student submissions in real time.
            </p>
          </div>

          <button
            onClick={() => setShowCreateHwModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Homework Assignment</span>
          </button>
        </div>

        {/* Homework List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Published Assignments ({homeworksList.length})
            </h3>
            {loadingHomeworks && <Loader2 size={16} className="animate-spin text-purple-600" />}
          </div>

          {homeworksList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {homeworksList.map((hw) => (
                <div key={hw.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                        {hw.class?.name || 'Class'} &bull; {hw.subject?.name || 'Subject'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{hw.title}</h4>
                    {hw.description && <p className="text-xs text-slate-500 line-clamp-2">{hw.description}</p>}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">
                      Created: {new Date(hw.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleViewSubmissions(hw)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Eye size={14} className="text-purple-600" />
                      <span>View Submissions</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No homework assignments created yet. Click &quot;Create Homework Assignment&quot; to publish your first assignment.
            </div>
          )}
        </div>

        {/* Create Homework Modal */}
        {showCreateHwModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="text-purple-600" size={20} />
                  New Homework Assignment
                </h3>
                <button
                  onClick={() => setShowCreateHwModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateHomework} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assignment Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Mathematics Algebra Worksheet 4"
                    value={hwTitle}
                    onChange={(e) => setHwTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Class *</label>
                    <select
                      required
                      value={hwClassId}
                      onChange={(e) => setHwClassId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                    >
                      <option value="">Select Class</option>
                      {profile.formAllocations.map((fa) => (
                        <option key={fa.classId} value={fa.classId}>
                          {fa.className} ({fa.sectionName})
                        </option>
                      ))}
                      {profile.subjectAssignments.map((sa) => (
                        <option key={sa.classId} value={sa.classId}>
                          {sa.className} ({sa.sectionName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                    <select
                      required
                      value={hwSubjectId}
                      onChange={(e) => setHwSubjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                    >
                      <option value="">Select Subject</option>
                      {profile.subjectAssignments.map((sa) => (
                        <option key={sa.subjectId} value={sa.subjectId}>
                          {sa.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={hwDueDate}
                    onChange={(e) => setHwDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description / Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Instructions for students..."
                    value={hwDescription}
                    onChange={(e) => setHwDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateHwModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={publishingHw}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md cursor-pointer"
                  >
                    {publishingHw ? 'Publishing...' : 'Publish Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Submissions Modal */}
        {selectedHwForSubmissions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="text-purple-600" size={20} />
                    Submissions: {selectedHwForSubmissions.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Due Date: {new Date(selectedHwForSubmissions.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHwForSubmissions(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingSubmissions ? (
                <div className="py-12 flex justify-center items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={18} className="animate-spin text-purple-600" />
                  <span>Loading submissions...</span>
                </div>
              ) : hwSubmissions.length > 0 ? (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {hwSubmissions.map((sub) => (
                    <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-purple-600" />
                          <span className="font-bold text-slate-900">{sub.student?.firstName} {sub.student?.lastName} ({sub.student?.registerNo})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Submitted: {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {gradingSubmissionId === sub.id ? (
                        <div className="p-3 bg-white border border-purple-200 rounded-xl space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Score Mark *</label>
                              <input
                                type="number"
                                placeholder="e.g. 85"
                                value={gradeScore}
                                onChange={(e) => setGradeScore(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Feedback Note</label>
                              <input
                                type="text"
                                placeholder="Good effort!"
                                value={gradeFeedback}
                                onChange={(e) => setGradeFeedback(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setGradingSubmissionId(null)}
                              className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveSubmissionGrade(sub.id)}
                              disabled={savingGrade}
                              className="px-4 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                            >
                              {savingGrade ? 'Saving...' : 'Save Grade'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                          <div>
                            <span className="font-semibold text-slate-700">
                              Score: {sub.score !== null ? `${sub.score}%` : 'Not Graded Yet'}
                            </span>
                            {sub.feedback && <p className="text-[11px] text-slate-500 italic mt-0.5">&ldquo;{sub.feedback}&rdquo;</p>}
                          </div>
                          <button
                            onClick={() => {
                              setGradingSubmissionId(sub.id)
                              setGradeScore(sub.score !== null ? String(sub.score) : '')
                              setGradeFeedback(sub.feedback || '')
                            }}
                            className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-xs transition border border-purple-200 cursor-pointer"
                          >
                            Grade Submission
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  No students have submitted responses for this homework yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const normalizedProfile = profile ? { ...profile, id: profile.teacherId } : undefined

  if (activeSection === 'attendance') {
    return <AttendanceRegister formAllocations={profile?.formAllocations || []} />
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
  if (activeSection === 'attrition' || activeSection === 'subject-reports' || activeSection === 'class-reports') {
    return <TeacherAttritionRadar />
  }
  if (activeSection === 'cbt-exams' || activeSection === 'question-bank') {
    return <QuestionBankManager profile={profile} />
  }
  if (activeSection === 'calendar') {
    return <SchoolCalendar user={user} />
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
            
            {/* Left Hero Content */}
            <div className="relative z-10 space-y-1">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs text-blue-100 inline-flex items-center gap-1.5 mb-2">
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

              <div className="pt-2 border-t border-slate-100 text-center">
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

          {/* 4. My Classes Grid */}
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
                recentActivitiesList.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
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

    </div>
  )
}
