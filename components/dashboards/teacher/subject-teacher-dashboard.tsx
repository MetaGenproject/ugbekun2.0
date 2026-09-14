'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  BookOpen,
  Bot,
  Calendar,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  PenLine,
  Search,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { getAvatarUrl } from '@/lib/avatar'

const SUBJECT_DASHBOARD_URL = endpoints.teacher.dashboardOverview.replace(
  '/dashboard-overview',
  '/subject-dashboard'
)

type ScoreBand = {
  id: string
  label: string
  count: number
  percent: number
}

type SubjectStudent = {
  id: number
  assignKey: string
  firstName: string
  lastName: string
  photo: string | null
  registerNo: string | null
  classId: number
  sectionId: number
  subjectId: number
  className: string
  subjectName: string
  lastActivity: string
}

type SubjectDashboardData = {
  profile: {
    teacherId: number
    name: string
    firstName: string
    photo: string | null
    department: string | null
    branchName: string
  }
  session: {
    academicSession: string | null
    currentTerm: string | null
  }
  kpi: {
    classesCount: number
    studentsCount: number
    activeAssignmentsCount: number
    assessmentsToGradeCount: number
    pendingExamQuestionsCount: number
  }
  scoreOverview: {
    average: number
    scoredCount: number
    bands: ScoreBand[]
  }
  classes: Array<{ classId: number; sectionId: number; name: string; studentCount: number }>
  students: SubjectStudent[]
  studentsTotal?: number
  recentAssignments: Array<{
    id: number
    title: string
    className: string
    subjectName: string
    dueDate: string
    status: string
  }>
  assessmentsToGrade: Array<{
    id: string
    title: string
    className: string
    subjectName: string
    scriptsCount: number
    status: string
  }>
  exams: Array<{
    id: number
    title: string
    className: string
    subjectName: string
    type: string
    questionCount: number
    status: string
  }>
  schedule: Array<{
    id: number
    dateLabel: string
    className: string
    subjectName: string
    startTime: string
    endTime: string
    status: string
  }>
  staffMessages: Array<{
    id: number
    senderName: string
    senderRole: string
    photo: string | null
    subject: string | null
    preview: string
    createdAt: string
  }>
}

const BAND_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']

function greetingWord(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: 'numeric',
      hour12: false,
    }).format(date)
  )
  if (hour < 12) return 'Good Morning'
  if (hour < 16) return 'Good Afternoon'
  return 'Good Evening'
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  })
}

function formatClockNow(date: Date) {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Lagos',
  })
}

function formatDueDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMessageTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const diff = Date.now() - parsed.getTime()
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / 60000))}m`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h`
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function openOseAssistant() {
  window.dispatchEvent(new Event('open-ose-assistant'))
}

function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase()
  const styles =
    key === 'active' || key === 'approved' || key === 'ready' || key === 'scheduled'
      ? 'bg-emerald-50 text-emerald-700'
      : key === 'pending' || key === 'pending approval' || key === 'in progress'
        ? 'bg-amber-50 text-amber-700'
        : key === 'draft'
          ? 'bg-slate-100 text-slate-600'
          : 'bg-slate-100 text-slate-600'
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${styles}`}>
      {status}
    </span>
  )
}

function ScoreDonut({
  average,
  scoredCount,
  bands,
}: {
  average: number
  scoredCount: number
  bands: ScoreBand[]
}) {
  const size = 168
  const strokeWidth = 16
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const segments = bands.map((band, index) => {
    const length = scoredCount > 0 ? (band.count / scoredCount) * circumference : 0
    const segment = { ...band, color: BAND_COLORS[index], length, offset }
    offset += length
    return segment
  })

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {segments.map((segment) => (
          <circle
            key={segment.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment.length} ${circumference}`}
            strokeDashoffset={-segment.offset}
            strokeLinecap="butt"
            fill="transparent"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span className="text-2xl font-black text-slate-900 leading-none">
          {scoredCount > 0 ? `${average}%` : '—'}
        </span>
        <span className="text-[10px] font-bold text-slate-400 mt-1">
          {scoredCount > 0 ? 'Average Score' : 'No scores yet'}
        </span>
      </div>
    </div>
  )
}

export function TeacherCommunicationInbox() {
  const [messages, setMessages] = useState<
    Array<{
      id: number
      subject: string | null
      message: string
      createdAt: string
      isRead?: boolean
      parent?: { name: string | null }
      student?: { firstName: string | null; lastName: string | null }
    }>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadMessages() {
      try {
        const res = await apiSlice.get<{ success: boolean; messages: typeof messages }>(endpoints.teacher.messages)
        if (!active) return
        if (res.success) setMessages(res.messages || [])
      } finally {
        if (active) setLoading(false)
      }
    }
    loadMessages()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-lg font-extrabold text-slate-900">Staff & Parent Communication</h2>
        <p className="text-xs text-slate-500 mt-1">Messages addressed to your teacher account.</p>
      </div>
      {loading ? (
        <div className="p-10 flex items-center justify-center text-slate-500 text-sm">
          <Loader2 className="animate-spin mr-2" size={16} /> Loading messages...
        </div>
      ) : messages.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {messages.map((item) => {
            const sender =
              item.parent?.name ||
              `${item.student?.lastName || ''} ${item.student?.firstName || ''}`.trim() ||
              'School message'
            return (
              <div key={item.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{sender}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{item.subject || 'Message'}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{formatMessageTime(item.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap">{item.message}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="p-10 text-center text-xs text-slate-500">No messages have been sent to this teacher account.</p>
      )}
    </div>
  )
}

export function SubjectTeacherDashboard({
  onNavigate,
}: {
  onNavigate?: (section: string) => void
}) {
  const [data, setData] = useState<SubjectDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [classFilter, setClassFilter] = useState('ALL')
  const [studentQuery, setStudentQuery] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [showMoreActions, setShowMoreActions] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)
        const res = await apiSlice.get<{ success: boolean } & SubjectDashboardData>(SUBJECT_DASHBOARD_URL)
        if (!active) return
        if (!res.success) throw new Error('Failed to load subject teacher dashboard.')
        setData(res)
      } catch (err: any) {
        if (active) setError(err?.message || 'Failed to load subject teacher dashboard.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadDashboard()
    return () => {
      active = false
    }
  }, [])

  const filteredStudents = useMemo(() => {
    const rows = data?.students || []
    const query = studentQuery.trim().toLowerCase()
    return rows.filter((student) => {
      const matchesClass = classFilter === 'ALL' || student.className === classFilter
      const haystack = `${student.firstName} ${student.lastName} ${student.subjectName} ${student.className} ${student.registerNo || ''}`.toLowerCase()
      return matchesClass && (!query || haystack.includes(query))
    })
  }, [data?.students, classFilter, studentQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="animate-spin mr-2" size={18} />
        <span className="text-sm font-semibold">Loading your subject workspace...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center text-sm text-rose-600">
        {error || 'Subject dashboard is unavailable.'}
      </div>
    )
  }

  const go = (section: string) => onNavigate?.(section)
  const kpiCards = [
    { label: 'My Classes', value: data.kpi.classesCount, hint: 'Active classes', icon: LayoutDashboard, color: 'bg-blue-600' },
    { label: 'Students', value: data.kpi.studentsCount, hint: 'Under my subjects', icon: Users, color: 'bg-violet-600' },
    { label: 'Assignments', value: data.kpi.activeAssignmentsCount, hint: 'Active assignments', icon: CheckSquare, color: 'bg-emerald-600' },
    { label: 'Assessments', value: data.kpi.assessmentsToGradeCount, hint: 'To grade', icon: ClipboardList, color: 'bg-amber-500' },
    { label: 'Exams (Questions)', value: data.kpi.pendingExamQuestionsCount, hint: 'Need questions', icon: Award, color: 'bg-sky-600' },
  ]
  const quickActions = [
    { id: 'gradebook', label: 'Enter Scores', icon: PenLine, color: 'bg-blue-50 text-blue-700' },
    { id: 'gradebook', label: 'Upload Scores', icon: Upload, color: 'bg-violet-50 text-violet-700' },
    { id: 'assignments', label: 'Create Assignment', icon: FileText, color: 'bg-emerald-50 text-emerald-700' },
    { id: 'cbt-exams', label: 'Create Questions', icon: HelpCircle, color: 'bg-amber-50 text-amber-700' },
    { id: 'cbt-exams', label: 'My Question Bank', icon: BookOpen, color: 'bg-sky-50 text-sky-700' },
    { id: 'timetable', label: 'My Schedule', icon: Calendar, color: 'bg-indigo-50 text-indigo-700' },
    { id: 'class-reports', label: 'View Reports', icon: FileSpreadsheet, color: 'bg-rose-50 text-rose-700' },
    { id: 'communication', label: 'Message Staff', icon: MessageSquare, color: 'bg-slate-100 text-slate-700' },
  ]

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {greetingWord(now)}, {data.profile.firstName}! 👋
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Here is an overview of the classes and subjects assigned to you.
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 space-y-1 shrink-0">
              <p className="font-bold text-slate-800">{formatLongDate(now)}</p>
              <p className="font-semibold">{formatClockNow(now)}</p>
              <p>
                {data.session.academicSession || 'Session not set'}
                {data.session.currentTerm ? ` · ${data.session.currentTerm}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {kpiCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
                  <div className={`w-9 h-9 rounded-xl ${card.color} text-white flex items-center justify-center mb-3`}>
                    <Icon size={16} />
                  </div>
                  <p className="text-2xl font-black text-slate-900 leading-none">{card.value}</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{card.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{card.hint}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-sm font-extrabold text-slate-900">Students Under My Subjects</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600"
                  >
                    <option value="ALL">All Classes</option>
                    {data.classes.map((cls) => (
                      <option key={`${cls.classId}-${cls.sectionId}`} value={cls.name}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      value={studentQuery}
                      onChange={(e) => setStudentQuery(e.target.value)}
                      placeholder="Search students..."
                      className="pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] w-40"
                    />
                  </div>
                </div>
              </div>
              {filteredStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Class</th>
                        <th className="p-4">Subject</th>
                        <th className="p-4">Last Activity</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.slice(0, 8).map((student) => {
                        const fullName = `${student.lastName} ${student.firstName}`.trim()
                        return (
                          <tr key={student.assignKey} className="hover:bg-slate-50/80">
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={getAvatarUrl(student.photo, fullName)}
                                  alt={fullName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <span className="font-bold text-slate-800">{fullName}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-600 font-medium">{student.className}</td>
                            <td className="p-4 text-slate-600">{student.subjectName}</td>
                            <td className="p-4">
                              <span className={student.lastActivity === 'Active' ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                                {student.lastActivity}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                onClick={() => go('roster')}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                                title="Open student roster"
                              >
                                <MoreHorizontal size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-xs text-slate-500">
                  No enrolled students found for your assigned subjects.
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold text-slate-900">Assessment Overview</h2>
                <button
                  type="button"
                  onClick={() => go('class-reports')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View Full Analysis
                </button>
              </div>
              <div className="flex flex-col items-center gap-4">
                <ScoreDonut
                  average={data.scoreOverview.average}
                  scoredCount={data.scoreOverview.scoredCount}
                  bands={data.scoreOverview.bands}
                />
                <div className="w-full space-y-2">
                  {data.scoreOverview.bands.map((band, index) => (
                    <div key={band.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BAND_COLORS[index] }} />
                        <span className="font-semibold text-slate-600">{band.label}</span>
                      </div>
                      <span className="font-bold text-slate-800">
                        {band.count} ({band.percent}%)
                      </span>
                    </div>
                  ))}
                </div>
                {data.scoreOverview.scoredCount === 0 && (
                  <p className="text-[11px] text-slate-400 text-center">
                    The ring fills when scores have been entered for your subjects.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => go(action.id)}
                    className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span className={`w-11 h-11 rounded-2xl ${action.color} flex items-center justify-center`}>
                      <Icon size={18} />
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{action.label}</span>
                  </button>
                )
              })}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoreActions((open) => !open)}
                  className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer w-full"
                >
                  <span className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <MoreHorizontal size={18} />
                  </span>
                  <span className="text-[10px] font-bold text-slate-600">More</span>
                </button>
                {showMoreActions && (
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-2xl shadow-lg py-1 min-w-[160px]">
                    {[
                      { id: 'attendance', label: 'Attendance' },
                      { id: 'ai-planner', label: 'Lesson Plan' },
                      { id: 'my-subjects', label: 'My Subjects' },
                      { id: 'media', label: 'Resource Library' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setShowMoreActions(false)
                          go(item.id)
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">Recent Assignments</h3>
                <button type="button" onClick={() => go('assignments')} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              </div>
              {data.recentAssignments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.recentAssignments.map((item) => (
                    <div key={item.id} className="p-4 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800">{item.title}</p>
                        <StatusPill status={item.status} />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {item.className} · {item.subjectName}
                      </p>
                      <p className="text-[11px] text-slate-400">Due {formatDueDate(item.dueDate)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-[11px] text-slate-500">No assignments recorded for your subjects.</p>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">Assessments To Grade</h3>
                <button type="button" onClick={() => go('assignments')} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              </div>
              {data.assessmentsToGrade.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.assessmentsToGrade.map((item) => (
                    <div key={item.id} className="p-4 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800">{item.title}</p>
                        <StatusPill status={item.status} />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {item.className} · {item.subjectName}
                      </p>
                      <p className="text-[11px] text-slate-400">{item.scriptsCount} scripts</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-[11px] text-slate-500">No ungraded scripts for your subjects.</p>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">Exams & Questions</h3>
                <button type="button" onClick={() => go('cbt-exams')} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              </div>
              {data.exams.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.exams.map((item) => (
                    <div key={item.id} className="p-4 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800">{item.title}</p>
                        <StatusPill status={item.status} />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {item.className} · {item.type}
                      </p>
                      <p className="text-[11px] text-slate-400">{item.questionCount} questions</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-[11px] text-slate-500">No CBT exams created for your subjects.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="xl:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">My Class Schedule</h3>
              <button type="button" onClick={() => go('timetable')} className="text-[11px] font-bold text-blue-600 cursor-pointer">
                Full timetable
              </button>
            </div>
            {data.schedule.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.schedule.map((slot) => (
                  <div key={slot.id} className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">{slot.dateLabel}</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {slot.className} · {slot.subjectName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock size={11} /> {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                    <StatusPill status={slot.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-[11px] text-slate-500">No timetable periods are assigned to you yet.</p>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Staff Messages</h3>
              <button type="button" onClick={() => go('communication')} className="text-[11px] font-bold text-blue-600 cursor-pointer">
                Open Communication
              </button>
            </div>
            {data.staffMessages.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.staffMessages.map((message) => (
                  <div key={message.id} className="p-4 flex items-start gap-3">
                    <img
                      src={getAvatarUrl(message.photo, message.senderName)}
                      alt={message.senderName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{message.senderName}</p>
                          <p className="text-[10px] text-slate-400">{message.senderRole}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{formatMessageTime(message.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{message.preview}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-[11px] text-slate-500">No staff messages have been sent to you yet.</p>
            )}
          </div>

          <div className="rounded-3xl bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] text-white p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-amber-300" />
              <h3 className="text-sm font-extrabold">OSe AI Assistant</h3>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Ask about your classes, assignments, scores, and timetable using live school records.
            </p>
            <button
              type="button"
              onClick={openOseAssistant}
              className="mt-4 w-full bg-white text-blue-700 text-xs font-bold py-2 rounded-full flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot size={14} />
              Chat with OSe
            </button>
          </div>
        </aside>
      </div>

      <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-[11px] text-blue-800 font-medium">
        Note: All schedules, exam questions and assessments require School Admin approval before publishing.
      </div>
    </div>
  )
}
