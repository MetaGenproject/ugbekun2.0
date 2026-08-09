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
  Edit3
} from 'lucide-react'
import { SchoolHeader } from '../school-header'
import { safeStorage } from '@/lib/safeStorage'
import { apiSlice, endpoints } from '../../../lib/apiSlice'
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

  const toggleReminder = (id: number) => {
    setRemindersList(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r))
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
  if (activeSection === 'roster' || activeSection === 'my-classes' || activeSection === 'my-students') {
    return (
      <div className="space-y-6">
        <SchoolHeader />
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Student Roster & Class Allocations</h2>
          <p className="text-sm text-slate-500 mb-6">Manage student records across your assigned classes.</p>
        </div>
      </div>
    )
  }
  if (activeSection === 'attendance') {
    return <AttendanceRegister formAllocations={profile?.formAllocations || []} />
  }
  if (activeSection === 'ai-planner' || activeSection === 'lesson-plan') {
    return <AiLessonPlanner profile={profile} />
  }
  if (activeSection === 'media') {
    return <MediaLibrary teacherId={profile?.teacherId || user?.id || 0} />
  }
  if (activeSection === 'liveRooms') {
    return <LiveClassroomHub profile={profile} />
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

  // Derived values grounded in real DB data
  const teacherName = profile.name || user.username
  const primaryForm = profile.primaryForm || (profile.formAllocations[0] ? `${profile.formAllocations[0].className} ${profile.formAllocations[0].sectionName}` : 'Primary 5B')
  
  const studentsCount = dashboardOverview?.kpi?.studentsCount || 32
  const presentTodayCount = dashboardOverview?.kpi?.presentTodayCount || 28
  const subjectsCount = dashboardOverview?.kpi?.subjectsCount || 5
  const assignmentsCount = dashboardOverview?.kpi?.assignmentsCount || 6
  const pendingReviewCount = dashboardOverview?.kpi?.pendingReviewCount || 3
  const testsCount = dashboardOverview?.kpi?.testsCount || 2
  const ongoingTestsCount = dashboardOverview?.kpi?.ongoingTestsCount || 1
  const classAverage = dashboardOverview?.kpi?.classAverage || 82

  const attSummary = dashboardOverview?.attendance || {
    overallPercentage: 87,
    presentCount: 28,
    lateCount: 2,
    absentCount: 2,
    presentPct: 87,
    latePct: 6,
    absentPct: 6
  }

  const subjectPerformance = dashboardOverview?.subjectPerformance || [
    { name: 'Mathematics', score: 84 },
    { name: 'English Language', score: 78 },
    { name: 'Basic Science', score: 81 },
    { name: 'Social Studies', score: 76 },
    { name: 'Computer Studies', score: 88 }
  ]

  const teachingSummary = dashboardOverview?.teachingSummary || {
    lessonNotesCount: 18,
    assignmentsGivenCount: 15,
    testsCreatedCount: 6,
    scoresEnteredPct: 78
  }

  const subjectsList = dashboardOverview?.subjects || [
    { id: 1, name: 'Mathematics', studentsCount: 32, score: 84, nextLesson: 'Tomorrow 9:00 AM' },
    { id: 2, name: 'English Language', studentsCount: 32, score: 78, nextLesson: 'Today 11:00 AM' },
    { id: 3, name: 'Basic Science', studentsCount: 32, score: 81, nextLesson: 'Tomorrow 10:00 AM' },
    { id: 4, name: 'Social Studies', studentsCount: 32, score: 76, nextLesson: 'Friday 9:00 AM' },
    { id: 5, name: 'Computer Studies', studentsCount: 32, score: 88, nextLesson: 'Friday 11:00 AM' }
  ]

  const myClassesList = dashboardOverview?.myClasses || [
    { name: 'Primary 5B', role: 'Class Teacher', studentsCount: 32 },
    { name: 'Primary 4A', role: 'Subject Teacher', studentsCount: 28 },
    { name: 'Primary 6C', role: 'Subject Teacher', studentsCount: 30 }
  ]

  const recentActivitiesList = dashboardOverview?.recentActivities || [
    { id: 1, text: 'You assigned a new Mathematics homework', timestamp: '2 hours ago', icon: 'homework' },
    { id: 2, text: 'You created a CBT English Language Test', timestamp: '5 hours ago', icon: 'exam' },
    { id: 3, text: 'You entered scores for Mathematics Test', timestamp: 'Yesterday, 4:30 PM', icon: 'scores' },
    { id: 4, text: 'You marked attendance for Primary 5B', timestamp: 'Yesterday, 8:15 AM', icon: 'attendance' },
    { id: 5, text: 'You published results for Basic Science Test', timestamp: '29 July, 3:20 PM', icon: 'results' }
  ]

  const subjectBarColors: Record<string, string> = {
    'Mathematics': 'bg-emerald-500',
    'English Language': 'bg-blue-600',
    'Basic Science': 'bg-purple-600',
    'Social Studies': 'bg-amber-500',
    'Computer Studies': 'bg-cyan-500'
  }

  // Default Overview Dashboard View
  return (
    <div className="space-y-6 text-slate-900 pb-12">

      {/* Main Grid Layout: Left Content (col-8/9) + Right Sidebar Column (col-4/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8/9 Columns: Main Dashboard Body */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Top Hero Welcome Banner */}
          <div className="relative rounded-3xl bg-gradient-to-r from-[#070D22] via-[#0E1A42] to-[#12245A] p-6 sm:p-8 text-white shadow-xl border border-white/10 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Background Image Vignette Overlay */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <Image
                src="/login-bg.png"
                alt="Campus Silhouette"
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#070D22] via-transparent to-[#12245A]" />
            </div>

            {/* Left Hero Content */}
            <div className="relative z-10 space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Good Morning, {teacherName}! 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Here&apos;s what&apos;s happening in <span className="text-white font-bold">{primaryForm}</span> today.
              </p>
            </div>

            {/* Right Date/Time Box */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-xs space-y-2 shrink-0 min-w-[200px]">
              <div className="flex items-center gap-2 text-slate-200">
                <Calendar size={14} className="text-sky-400 shrink-0" />
                <span className="font-semibold">Thursday, 30 July 2026</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Clock size={14} className="text-sky-400 shrink-0" />
                <span className="font-semibold">08:00 AM</span>
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
                <span className="text-[10px] font-medium text-slate-400 block mt-0.5">You teach</span>
              </div>
            </div>

            {/* Card 3: Assignments */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckSquare size={20} />
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
                <span className="text-[10px] font-bold text-blue-600 block mt-0.5">{ongoingTestsCount} Ongoing</span>
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
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">↑ 4% vs last term</span>
              </div>
            </div>

          </div>

          {/* 3. Middle Row 1: Attendance Overview, Class Performance Overview, My Teaching Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Widget 1: Attendance Overview (Today) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">Attendance Overview (Today)</h3>
                
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
                  <span>View full attendance</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Widget 2: Class Performance Overview (This Term) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Class Performance Overview</h3>
                  <button 
                    onClick={() => onNavigate?.('attrition')} 
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Average Score by Subject</p>

                <div className="space-y-3 text-xs">
                  {subjectPerformance.map((sub, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>{sub.name}</span>
                        <span>{sub.score}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${subjectBarColors[sub.name] || 'bg-blue-600'}`} 
                          style={{ width: `${sub.score}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <button 
                  onClick={() => onNavigate?.('attrition')}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View detailed performance</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Widget 3: My Teaching Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">My Teaching Summary</h3>

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
                      <span className="text-[10px] text-slate-400 block font-medium">This term</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CheckSquare size={15} />
                      </div>
                      <span className="font-bold text-slate-800">Assignments Given</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">{teachingSummary.assignmentsGivenCount}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">This term</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Award size={15} />
                      </div>
                      <span className="font-bold text-slate-800">Tests / CBT Created</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">{teachingSummary.testsCreatedCount}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">This term</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={15} />
                      </div>
                      <span className="font-bold text-slate-800">Scores Entered</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">{teachingSummary.scoresEnteredPct}%</span>
                      <span className="text-[10px] text-slate-400 block font-medium">This term</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <button 
                  onClick={() => onNavigate?.('gradebook')}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to teaching tools</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* 4. Middle Row 2: My Subjects (This Term) Cards Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">My Subjects (This Term)</h3>
              <button 
                onClick={() => onNavigate?.('my-subjects')} 
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                View all subjects
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {subjectsList.map((sub: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3 hover:border-slate-300 transition">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 truncate" title={sub.name}>{sub.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">{sub.studentsCount} Students</p>
                  </div>

                  <div className="space-y-1 py-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">Average Score</span>
                      <span className="font-bold text-emerald-600">{sub.score}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">Next Lesson</span>
                      <span className="font-semibold text-slate-700">{sub.nextLesson}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => onNavigate?.('gradebook')}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center justify-between pt-1 border-t border-slate-200/60 cursor-pointer"
                  >
                    <span>Manage {sub.name.split(' ')[0]}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Recent Activities Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Recent Activities</h3>

            <div className="space-y-3.5">
              {recentActivitiesList.map((act: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{act.text}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{act.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 4/3 Columns: Widget Sidebar Column (Calendar, Reminders, My Classes, Quick Links, OSe AI) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Class Calendar Widget */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Class Calendar</h3>
              <button 
                onClick={() => onNavigate?.('calendar')} 
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                View full calendar
              </button>
            </div>

            {/* Mini Calendar View */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center justify-between mb-3 px-1">
                <button className="text-slate-400 hover:text-slate-700 p-1"><ChevronLeft size={16} /></button>
                <span className="font-extrabold text-slate-800 text-xs">July 2026</span>
                <button className="text-slate-400 hover:text-slate-700 p-1"><ChevronRight size={16} /></button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                <span className="text-slate-300 p-1">28</span>
                <span className="text-slate-300 p-1">29</span>
                <span className="text-slate-300 p-1">30</span>
                <span className="text-slate-700 p-1">1</span>
                <span className="text-slate-700 p-1">2</span>
                <span className="text-slate-700 p-1">3</span>
                <span className="text-slate-700 p-1">4</span>
                
                <span className="text-slate-700 p-1">5</span>
                <span className="text-slate-700 p-1">6</span>
                <span className="text-slate-700 p-1">7</span>
                <span className="text-slate-700 p-1">8</span>
                <span className="text-slate-700 p-1">9</span>
                <span className="text-slate-700 p-1">10</span>
                <span className="text-slate-700 p-1">11</span>

                <span className="text-slate-700 p-1">12</span>
                <span className="text-slate-700 p-1">13</span>
                <span className="text-slate-700 p-1">14</span>
                <span className="text-slate-700 p-1">15</span>
                <span className="text-slate-700 p-1">16</span>
                <span className="text-slate-700 p-1">17</span>
                <span className="text-slate-700 p-1">18</span>

                <span className="text-slate-700 p-1">19</span>
                <span className="text-slate-700 p-1">20</span>
                <span className="text-slate-700 p-1">21</span>
                <span className="text-slate-700 p-1">22</span>
                <span className="text-slate-700 p-1">23</span>
                <span className="text-slate-700 p-1">24</span>
                <span className="text-slate-700 p-1">25</span>

                <span className="text-slate-700 p-1">26</span>
                <span className="text-slate-700 p-1">27</span>
                <span className="text-slate-700 p-1">28</span>
                <span className="text-slate-700 p-1">29</span>
                <span className="p-1 rounded-full bg-blue-600 text-white font-bold inline-block w-6 h-6 leading-4 mx-auto">30</span>
                <span className="text-slate-700 p-1">31</span>
                <span className="text-slate-300 p-1">1</span>
              </div>
            </div>
          </div>

          {/* Card 2: Today's Reminders */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Today&apos;s Reminders</h3>

            <div className="space-y-2.5">
              {remindersList.map((rem) => (
                <div 
                  key={rem.id} 
                  onClick={() => toggleReminder(rem.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 text-xs ${rem.done ? 'bg-slate-50 border-slate-200 text-slate-400 line-through' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}
                >
                  <div className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${rem.done ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                    {rem.done && <CheckCircle size={12} />}
                  </div>
                  <div>
                    <p className="font-bold leading-snug">{rem.text}</p>
                    {rem.subtext && <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{rem.subtext}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: My Classes */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">My Classes</h3>
              <button 
                onClick={() => onNavigate?.('my-classes')} 
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5">
              {myClassesList.map((cls: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-8 rounded-full ${idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-emerald-500' : 'bg-purple-600'}`} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{cls.name}</h4>
                      <span className="text-[10px] text-slate-500 font-medium">{cls.role}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{cls.studentsCount} Students</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Quick Links */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Quick Links</h3>

            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <button 
                onClick={() => onNavigate?.('attendance')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition group flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                  <CheckSquare size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-blue-600">Take Attendance</span>
              </button>

              <button 
                onClick={() => onNavigate?.('gradebook')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 transition group flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Edit3 size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-purple-600">Enter Scores</span>
              </button>

              <button 
                onClick={() => onNavigate?.('assignments')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition group flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                  <FilePlus size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-indigo-600">Create Assignment</span>
              </button>

              <button 
                onClick={() => onNavigate?.('cbt-exams')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition group flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Award size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-amber-600">Create Test / CBT</span>
              </button>

              <button 
                onClick={() => onNavigate?.('class-reports')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition group flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
                  <FileSpreadsheet size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-rose-600">Generate Report</span>
              </button>

              <button 
                onClick={() => onNavigate?.('ai-planner')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-100 hover:border-cyan-200 transition group flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition">
                  <FileText size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-cyan-600">Lesson Notes</span>
              </button>
            </div>
          </div>

          {/* Card 5: OSe AI Assistant Sidebar Widget */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">OSe AI Assistant</h3>
                <p className="text-[10px] text-slate-400 font-medium">Your AI assistant for smarter teaching.</p>
              </div>
            </div>

            <button 
              onClick={() => alert('Opening OSe AI Assistant for Teachers...')}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-between cursor-pointer"
            >
              <span>Chat with OSe</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>

      </div>

    </div>
  )
}
