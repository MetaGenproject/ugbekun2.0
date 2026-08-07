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
  Volume2
} from 'lucide-react'
import { SchoolHeader } from '../school-header'
import { safeStorage } from '@/lib/safeStorage'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { StudentMediaLibrary } from './student-media-library'
import { StudentLiveClassrooms } from './student-live-classrooms'
import PointsHub from './points-hub'
import SchoolCalendar from '../admin/school-calendar'

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
    name: string
    email: string | null
    phone: string | null
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rankingType, setRankingType] = useState<string>('full')
  const [rankingLimit, setRankingLimit] = useState<number>(3)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = safeStorage.getItem('ugbekun_token')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(endpoints.admin.uploadProfilePhoto, {
        method: 'POST',
        headers,
        body: formData
      })
      const result = await res.json()
      if (result.success && result.photoUrl) {
        setProfile((prev) => prev ? { ...prev, photo: result.photoUrl } : null)
        alert('Profile photo uploaded successfully!')
      } else {
        alert(result.message || 'Failed to upload photo.')
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading profile photo.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Assessment Workspace states
  const [activeAssessment, setActiveAssessment] = useState<any | null>(null)
  const [activeAssessmentType, setActiveAssessmentType] = useState<'homework' | 'online_exam' | null>(null)
  const [assessmentAnswers, setAssessmentAnswers] = useState<any[]>([])
  const [examTimeRemaining, setExamTimeRemaining] = useState<number | null>(null)

  // Audio recording & upload states
  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [uploadingQuestionIds, setUploadingQuestionIds] = useState<Set<string>>(new Set())

  // Upload helper for files
  const handleFileUpload = async (questionId: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be smaller than 10MB.')
      return
    }
    setUploadingQuestionIds(prev => {
      const next = new Set(prev)
      next.add(questionId)
      return next
    })
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        const resultStr = reader.result as string
        const base64 = resultStr.split(',')[1]
        
        const response = await fetch(endpoints.common.upload, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            mime: file.type,
            folder: 'ugbekun_tasks'
          })
        })
        const data = await response.json()
        if (data.success) {
          setAssessmentAnswers(prev => {
            const updated = [...prev]
            const idx = updated.findIndex(ans => ans.questionId === questionId)
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], fileUrl: data.url, fileName: file.name }
            } else {
              updated.push({ questionId, fileUrl: data.url, fileName: file.name })
            }
            return updated
          })
        } else {
          alert('Upload failed.')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Error uploading file.')
    } finally {
      setUploadingQuestionIds(prev => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  const startRecording = async (questionId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        setUploadingQuestionIds(prev => {
          const next = new Set(prev)
          next.add(questionId)
          return next
        })
        try {
          const reader = new FileReader()
          reader.readAsDataURL(audioBlob)
          reader.onloadend = async () => {
            const resultStr = reader.result as string
            const base64 = resultStr.split(',')[1]

            const response = await fetch(endpoints.common.upload, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                base64,
                mime: 'audio/webm',
                folder: 'ugbekun_audio_responses'
              })
            })
            const data = await response.json()
            if (data.success) {
              setAssessmentAnswers(prev => {
                const updated = [...prev]
                const idx = updated.findIndex(ans => ans.questionId === questionId)
                if (idx >= 0) {
                  updated[idx] = { ...updated[idx], audioUrl: data.url }
                } else {
                  updated.push({ questionId, audioUrl: data.url })
                }
                return updated
              })
            } else {
              alert('Audio upload failed.')
            }
          }
        } catch (err) {
          console.error(err)
          alert('Error uploading recorded audio.')
        } finally {
          setUploadingQuestionIds(prev => {
            const next = new Set(prev)
            next.delete(questionId)
            return next
          })
        }
      }
      recorder.start()
      setMediaRecorder(recorder)
      setRecordingQuestionId(questionId)
    } catch (err) {
      console.error(err)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setMediaRecorder(null)
      setRecordingQuestionId(null)
    }
  }

  const handleStartExamAttempt = async (exam: any) => {
    try {
      const token = safeStorage.getItem('ugbekun_token')
      const res = await fetch(endpoints.student.startOnlineExam(exam.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (data.success) {
        setActiveAssessment(exam)
        setActiveAssessmentType('online_exam')
        setAssessmentAnswers([])
        
        if (data.duration && data.duration > 0) {
          const startTime = new Date(data.startedAt).getTime()
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
          const totalSeconds = data.duration * 60
          const remaining = Math.max(0, totalSeconds - elapsedSeconds)
          setExamTimeRemaining(remaining)
        } else {
          setExamTimeRemaining(null)
        }
      } else {
        alert(data.message || 'Failed to start exam.')
        const tasksRes = await apiSlice.get<{ success: boolean } & TaskData>(endpoints.student.tasks)
        if (tasksRes.success) setTasks(tasksRes)
      }
    } catch (err: any) {
      console.error(err)
      alert('Error initiating exam session.')
    }
  }

  const handleAssessmentSubmit = async () => {
    if (!activeAssessment || !activeAssessmentType) return
    try {
      const token = safeStorage.getItem('ugbekun_token')
      const url = activeAssessmentType === 'homework'
        ? endpoints.student.submitHomework(activeAssessment.id)
        : endpoints.student.submitOnlineExam(activeAssessment.id)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: assessmentAnswers })
      })

      const data = await response.json()
      if (data.success) {
        alert(data.message || 'Assessment submitted successfully!')
        setActiveAssessment(null)
        setActiveAssessmentType(null)
        setAssessmentAnswers([])
        setExamTimeRemaining(null)

        const tasksRes = await apiSlice.get<{ success: boolean } & TaskData>(endpoints.student.tasks)
        if (tasksRes.success) setTasks(tasksRes)

        const gradesRes = await apiSlice.get<{ success: boolean } & GradeData>(endpoints.student.grades)
        if (gradesRes.success) setGrades(gradesRes)
      } else {
        alert(data.message || 'Failed to submit assessment.')
      }
    } catch (err: any) {
      console.error(err)
      alert('Error submitting assessment.')
    }
  }

  useEffect(() => {
    if (activeAssessmentType !== 'online_exam' || examTimeRemaining === null) return

    if (examTimeRemaining <= 0) {
      alert("Time is up! Your answers will be submitted automatically.")
      handleAssessmentSubmit()
      return
    }

    const interval = setInterval(() => {
      setExamTimeRemaining(prev => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearInterval(interval)
  }, [examTimeRemaining, activeAssessmentType])

  useEffect(() => {
    let active = true

    async function loadDashboardData() {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch Profile
        const profileRes = await apiSlice.get<{ success: boolean } & StudentProfile>(endpoints.student.profile)
        if (!active) return

        if (profileRes.success) {
          setProfile(profileRes)
        } else {
          throw new Error('Failed to load student profile.')
        }

        // 2. Fetch Attendance
        const attendanceRes = await apiSlice.get<{ success: boolean } & AttendanceData>(endpoints.student.attendance)
        if (attendanceRes.success) setAttendance(attendanceRes)

        // 3. Fetch Tasks
        const tasksRes = await apiSlice.get<{ success: boolean } & TaskData>(endpoints.student.tasks)
        if (tasksRes.success) setTasks(tasksRes)

        // 4. Fetch Grades
        const gradesRes = await apiSlice.get<{ success: boolean } & GradeData>(endpoints.student.grades)
        if (gradesRes.success) setGrades(gradesRes)

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

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true)
      const token = safeStorage.getItem('ugbekun_token')
      const url = endpoints.student.exportPdf(rankingType, rankingType === 'topn' ? rankingLimit : undefined)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        throw new Error('Failed to export PDF.')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `report_card_${profile?.lastName || 'Student'}_${profile?.firstName || 'Grades'}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to download PDF report card.')
    } finally {
      setExportingPdf(false)
    }
  }

  // Render Sub-Views based on active navigation tab
  if (activeSection === 'academics' || activeSection === 'points-hub') {
    return <PointsHub />
  }
  if (activeSection === 'media') {
    return <StudentMediaLibrary />
  }
  if (activeSection === 'liveRooms') {
    return <StudentLiveClassrooms user={user} />
  }
  if (activeSection === 'calendar') {
    return <SchoolCalendar />
  }

  // Derived values for the overview cards
  const studentName = `${profile.firstName} ${profile.lastName}`
  const firstName = profile.firstName
  const userRankText = grades?.rank ? `${grades.rank}${getOrdinal(grades.rank)}` : '8th'
  const totalClass = grades?.totalClassStudents || profile.fellowStudentsCount || 32
  const overallAvg = grades?.overallAverage ? `${grades.overallAverage}%` : '78%'
  const attendancePct = attendance?.percentage ? `${attendance.percentage}%` : '92%'

  // Mockup Timetable rows
  const todayTimetable = [
    { time: '08:00 AM - 08:40 AM', subject: 'Mathematics', teacher: 'Mr. Adewale', room: 'Room 12' },
    { time: '08:45 AM - 09:25 AM', subject: 'English Language', teacher: 'Mrs. Johnson', room: 'Room 8' },
    { time: '09:30 AM - 10:10 AM', subject: 'Basic Science', teacher: 'Mr. Okoro', room: 'Room 15' },
    { time: '10:30 AM - 11:10 AM', subject: 'Social Studies', teacher: 'Mrs. Ibrahim', room: 'Room 9' },
    { time: '11:15 AM - 11:55 AM', subject: 'Computer Studies', teacher: 'Mr. Emmanuel', room: 'ICT Lab' },
  ]

  // Subject Performance chart data
  const subjectScores = [
    { subject: 'Mathematics', score: 82, color: 'bg-blue-600' },
    { subject: 'English Lang.', score: 75, color: 'bg-blue-600' },
    { subject: 'Basic Science', score: 79, color: 'bg-purple-600' },
    { subject: 'Social Studies', score: 72, color: 'bg-amber-500' },
    { subject: 'Computer Studies', score: 88, color: 'bg-cyan-500' },
    { subject: 'Civic Education', score: 70, color: 'bg-rose-500' },
  ]

  // Default overview dashboard (activeSection === 'overview' or 'dashboard' or default)
  return (
    <div className="space-y-6 text-slate-900 pb-12">

      {/* Main Grid: Left Main Dashboard Content (col-8/9) + Right Widget Sidebar (col-4/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8/9 Columns: Main Dashboard Content */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Top Hero Welcome Banner */}
          <div className="relative rounded-3xl bg-gradient-to-r from-[#070D22] via-[#0E1A42] to-[#12245A] p-6 sm:p-8 text-white shadow-xl border border-white/10 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Background Campus Image Overlay */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <Image
                src="/login-bg.png"
                alt="School Campus"
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#070D22] via-transparent to-[#12245A]" />
            </div>

            {/* Left Welcome Info */}
            <div className="relative z-10 flex items-center gap-5">
              <div className="relative shrink-0">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={studentName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/30 shadow-xl"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600 border-2 border-white/30 shadow-xl flex items-center justify-center font-black text-white text-xl uppercase">
                    {firstName.substring(0, 1)}{profile.lastName.substring(0, 1)}
                  </div>
                )}
                {/* Green Online Dot */}
                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0E1A42]" />
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Good Morning, {firstName}! 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Stay focused today and achieve your goals.
                </p>
                <div className="inline-block pt-1">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 text-[11px] text-slate-200 italic font-medium">
                    &ldquo;Discipline today, success tomorrow.&rdquo;
                  </span>
                </div>
              </div>
            </div>

            {/* Right Meta Info Card */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-xs space-y-2 shrink-0 min-w-[220px]">
              <div className="flex items-center gap-2 text-slate-200">
                <Calendar size={14} className="text-sky-400 shrink-0" />
                <span className="font-semibold">Thursday, 30 July 2026</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Clock size={14} className="text-sky-400 shrink-0" />
                <span className="font-semibold">08:00 AM</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <GraduationCap size={14} className="text-purple-400 shrink-0" />
                <span className="font-semibold">2025/2026 Academic Session</span>
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
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 6% from last term</span>
                </p>
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
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  out of {totalClass} students
                </p>
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
                <p className="text-[11px] font-bold text-blue-600 mt-1 flex items-center gap-1">
                  <span>↑ 4% this term</span>
                </p>
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
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">Excellent</h3>
                <p className="text-[11px] font-medium text-amber-600 mt-1">
                  Keep it up! 🥳
                </p>
              </div>
            </div>

          </div>

          {/* 3. Middle Row 1: Timetable, Upcoming Assignments, Upcoming Exams */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Today's Timetable */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Today&apos;s Timetable</h3>
                  <button 
                    onClick={() => onNavigate?.('timetable')} 
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View full timetable</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {todayTimetable.map((slot, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">{slot.time}</span>
                        <span className="font-bold text-slate-900">{slot.subject}</span>
                        <span className="text-[10px] text-slate-500 block">{slot.teacher}</span>
                      </div>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                        {slot.room}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Assignments */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Upcoming Assignments</h3>
                  <button 
                    onClick={() => onNavigate?.('assignments')} 
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Mathematics Homework</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Due Tomorrow, 31 July 2026</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold shrink-0">
                      Due Tomorrow
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">English Essay</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Due 1 Aug 2026</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold shrink-0">
                      2 Days Left
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Basic Science Worksheet</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Due 2 Aug 2026</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold shrink-0">
                      3 Days Left
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-slate-100">
                <button 
                  onClick={() => onNavigate?.('assignments')}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to assignments</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Upcoming CBT / Exams */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Upcoming CBT / Exams</h3>
                  <button 
                    onClick={() => onNavigate?.('cbt-exams')} 
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Award size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">English Language Test</h4>
                        <p className="text-[10px] text-slate-500 font-medium">1 Aug 2026, 10:00 AM</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-bold shrink-0">
                      2 Days Left
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Award size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Mathematics CBT</h4>
                        <p className="text-[10px] text-slate-500 font-medium">5 Aug 2026, 10:00 AM</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-bold shrink-0">
                      6 Days Left
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Award size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Basic Science Test</h4>
                        <p className="text-[10px] text-slate-500 font-medium">7 Aug 2026, 10:00 AM</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-bold shrink-0">
                      8 Days Left
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-slate-100">
                <button 
                  onClick={() => onNavigate?.('cbt-exams')}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to exams</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* 4. Middle Row 2: 4 Small Quick Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Homework Progress Donut Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">Homework Progress</h3>
              
              <div className="flex items-center gap-4 py-1">
                <SVGDonutChart percentage={76} centerLabel="Completed" color="#10B981" />
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600 font-medium">Completed</span>
                    <span className="font-bold text-slate-900 ml-auto">19</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-600 font-medium">Pending</span>
                    <span className="font-bold text-slate-900 ml-auto">6</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-600 font-medium">Overdue</span>
                    <span className="font-bold text-slate-900 ml-auto">2</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={() => onNavigate?.('assignments')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View all homework</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Attendance Summary Donut Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">Attendance Summary</h3>
              
              <div className="flex items-center gap-4 py-1">
                <SVGDonutChart percentage={92} centerLabel="Present" color="#10B981" />
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600 font-medium">Present</span>
                    <span className="font-bold text-slate-900 ml-auto">92%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-600 font-medium">Late</span>
                    <span className="font-bold text-slate-900 ml-auto">5%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-600 font-medium">Absent</span>
                    <span className="font-bold text-slate-900 ml-auto">3%</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={() => onNavigate?.('attendance')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View full attendance</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* School Fee Status Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">School Fee Status</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Paid
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">Paid</h4>
                  <p className="text-[10px] text-slate-500 font-medium">No outstanding fees</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-semibold bg-slate-50 p-2 rounded-xl border border-slate-100">
                Next Term Begins: <span className="text-slate-900 font-bold">7 Sep 2026</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={() => onNavigate?.('school-fees')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View payment history</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* MyEduRide Status Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">MyEduRide Status</h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Bus size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pickup Point</span>
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">Alaka Estate Gate</h4>
                  <p className="text-[11px] font-bold text-emerald-600 mt-0.5">On the way</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-semibold bg-slate-50 p-2 rounded-xl border border-slate-100">
                Escort: <span className="text-slate-900 font-bold">Mr. Sunday</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={() => onNavigate?.('myeduride')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Track My Ride</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>

          </div>

          {/* 5. Bottom Split Section: Subject Performance Bar Chart + Recent Activities Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Subject Performance Overview (This Term) Bar Chart */}
            <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Subject Performance Overview (This Term)</h3>
                <button 
                  onClick={() => onNavigate?.('results')} 
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  View full report →
                </button>
              </div>

              <div className="pt-4 pb-2">
                <div className="h-48 flex items-end justify-between gap-3 px-2 border-b border-slate-200">
                  {subjectScores.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition">
                        {item.score}%
                      </span>
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-700 ${item.color} group-hover:brightness-110 shadow-sm`} 
                        style={{ height: `${item.score}%` }} 
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between gap-2 px-2 pt-3 text-[10px] font-bold text-slate-500 text-center">
                  {subjectScores.map((item, idx) => (
                    <span key={idx} className="flex-1 truncate" title={item.subject}>
                      {item.subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activities Timeline */}
            <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Recent Activities</h3>
                <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                  View all
                </button>
              </div>

              <div className="space-y-3.5">
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">You submitted Mathematics Homework</p>
                    <span className="text-[10px] text-slate-400 font-medium">Today, 7:30 AM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                    <Award size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">You scored 18/20 in Basic Science Test</p>
                    <span className="text-[10px] text-slate-400 font-medium">Yesterday, 2:15 PM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">You attended Mathematics Lesson</p>
                    <span className="text-[10px] text-slate-400 font-medium">Yesterday, 8:00 AM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                    <Bell size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">You have a new announcement</p>
                    <span className="text-[10px] text-slate-400 font-medium">30 Jul, 7:45 AM</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Right 4/3 Columns: Widget Sidebar Column (OSe AI, EduChat, Announcements) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: OSe AI Assistant */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">OSe AI Assistant</h3>
                </div>
              </div>
              <button 
                onClick={() => alert('OSe AI Assistant launched!')}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Ask OSe
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <p className="font-bold text-slate-900">Good morning, {firstName}! 👋</p>
              <p className="text-slate-500 font-medium text-[11px]">Here are a few things for you.</p>

              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex items-start gap-2.5 shadow-2xs">
                  <span className="text-base shrink-0">📗</span>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">Revise Mathematics Chapter 5</h5>
                    <p className="text-[10px] text-slate-400 font-medium">Recommended based on your performance</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex items-start gap-2.5 shadow-2xs">
                  <span className="text-base shrink-0">📘</span>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">You have 2 assignments</h5>
                    <p className="text-[10px] text-slate-400 font-medium">Due tomorrow</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex items-start gap-2.5 shadow-2xs">
                  <span className="text-base shrink-0">📙</span>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">English Test on Friday</h5>
                    <p className="text-[10px] text-slate-400 font-medium">Don&apos;t forget to prepare!</p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => alert('Opening OSe AI Interactive Assistant Chat...')}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-between cursor-pointer"
            >
              <span>Chat with OSe</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Card 2: EduChat (Messages) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">EduChat (Messages)</h3>
              <button 
                onClick={() => onNavigate?.('communication')} 
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                    T
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Mrs. Johnson</h4>
                    <p className="text-[10px] text-slate-500 truncate max-w-[170px]">Kindly submit your essay before tomorrow.</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-medium">8:15 AM</span>
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold inline-flex items-center justify-center mt-0.5">
                    2
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    A
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Mr. Adewale</h4>
                    <p className="text-[10px] text-slate-500 truncate max-w-[170px]">Don&apos;t forget our test on Friday.</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium shrink-0">Yesterday</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                    S
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">School Admin</h4>
                    <p className="text-[10px] text-slate-500 truncate max-w-[170px]">Inter-house sport next week Friday.</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium shrink-0">Yesterday</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    S
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Study Group (JSS 2A)</h4>
                    <p className="text-[10px] text-slate-500 truncate max-w-[170px]">Chisom: When is the test?</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium shrink-0">27 Jul</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <button 
                onClick={() => onNavigate?.('communication')}
                className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open EduChat</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 3: School Announcements */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">School Announcements</h3>
              <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                View all
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Independence Day Celebration</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">School will be closed on 1st October.</p>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 block">30 Jul 2026</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Trophy size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Inter-House Sport</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Starts next Friday. Get ready!</p>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 block">29 Jul 2026</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Library New Books</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">New adventure books are now available.</p>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 block">28 Jul 2026</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
