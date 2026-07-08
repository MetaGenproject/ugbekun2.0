'use client'

import { useState, useEffect } from 'react'
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
  Upload
} from 'lucide-react'
import { SchoolHeader } from '../school-header'
import { apiSlice, endpoints } from '@/lib/apiSlice'

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
  }
  activeSection: string
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

export function StudentDashboard({ user, activeSection }: DashboardProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [attendance, setAttendance] = useState<AttendanceData | null>(null)
  const [tasks, setTasks] = useState<TaskData | null>(null)
  const [grades, setGrades] = useState<GradeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rankingType, setRankingType] = useState<string>('full')
  const [rankingLimit, setRankingLimit] = useState<number>(3)
  const [exportingPdf, setExportingPdf] = useState(false)

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
              updated[idx] = { ...updated[idx], fileUrl: data.url }
            } else {
              updated.push({ questionId, fileUrl: data.url })
            }
            return updated
          })
        } else {
          alert('Upload failed: ' + (data.message || 'Unknown error'))
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

  // Audio recording helpers
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
      const res = await fetch(endpoints.student.startOnlineExam(exam.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ugbekun_token') || localStorage.getItem('token')}`
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
        // Refresh tasks list
        const tasksRes = await apiSlice.get<{ success: boolean } & TaskData>(endpoints.student.tasks)
        if (tasksRes.success) setTasks(tasksRes)
      }
    } catch (err) {
      console.error(err)
      alert('Error starting exam attempt.')
    }
  }

  const handleAssessmentSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!activeAssessment || !activeAssessmentType) return
    try {
      const url = activeAssessmentType === 'homework'
        ? endpoints.student.submitHomework(activeAssessment.id)
        : endpoints.student.submitOnlineExam(activeAssessment.id)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ugbekun_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ answers: assessmentAnswers })
      })
      const data = await response.json()
      if (data.success) {
        alert('Assessment submitted successfully!')
        setActiveAssessment(null)
        setActiveAssessmentType(null)
        setAssessmentAnswers([])
        setExamTimeRemaining(null)
        // Refresh tasks list
        const tasksRes = await apiSlice.get<{ success: boolean } & TaskData>(endpoints.student.tasks)
        if (tasksRes.success) setTasks(tasksRes)
      } else {
        alert(data.message || 'Submission failed.')
      }
    } catch (err) {
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
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Syncing school portal workspace...</p>
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
      const token = localStorage.getItem('ugbekun_token')
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

  // Helper stats computed from profile/attendance
  const gpa = grades ? Number(((grades.overallAverage / 100) * 4).toFixed(2)) : 0.00
  const stats = [
    { label: 'Enrolled Courses', value: `${profile.subjects.length} Subjects`, icon: BookOpen, color: 'text-violet-600 bg-violet-50 border-violet-100' },
    { label: 'Attendance Counter', value: `${attendance?.percentage || 100}% Present`, icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: 'Grade Average', value: `${grades?.overallAverage || 0}% (${gpa} GPA)`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { label: 'Form Room Count', value: `${profile.fellowStudentsCount} Students`, icon: Calendar, color: 'text-amber-600 bg-amber-50 border-amber-100' }
  ]

  // Render Sub-Views based on active navigation tab
  return (
    <div className="space-y-8">
      {/* School Header */}
      <SchoolHeader />

      {/* Profile Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#003da5] via-[#0063a6] to-[#009ca6] p-6 md:p-8 shadow-md overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 space-y-2.5">
          <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block">
            {profile.branchName || 'Academy Workspace'}
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome Back, {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-white/80 text-sm max-w-xl font-medium">
            Room: <span className="text-white font-bold">{profile.className || 'Not Enrolled'} ({profile.sectionName || 'N/A'})</span> | Reg: <span className="text-white font-bold">{profile.registerNo || 'N/A'}</span>
          </p>
        </div>
      </div>

      {/* Render tab-specific sections */}
      {activeSection === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat, idx) => {
              const IconComp = stat.icon
              return (
                <div 
                  key={idx} 
                  className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition duration-300 flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{stat.value}</p>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${stat.color} transition duration-300 group-hover:scale-105 shadow-sm`}>
                    <IconComp size={20} className="stroke-[2.5]" />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Subject Roster */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Enrolled Subjects</h3>
              </div>
              {profile.subjects.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">No subjects currently assigned to this classroom.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {profile.subjects.map((sub, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200/60 bg-slate-50 hover:bg-slate-100/50 transition flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{sub.name}</p>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{sub.code} ({sub.type})</span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xs">
                        {sub.name.substring(0, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Teacher Information */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Form Teacher</h3>
              </div>
              {profile.formTeacher ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-700 uppercase">
                      {profile.formTeacher.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{profile.formTeacher.name}</p>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Class Manager</span>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {profile.formTeacher.email && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        <span className="truncate">{profile.formTeacher.email}</span>
                      </div>
                    )}
                    {profile.formTeacher.phone && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        <span>{profile.formTeacher.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-400">No form teacher allocated to this classroom yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'assignments' && (
        <div className="space-y-6">
          {/* Assessment Workspace Drawer / Panel */}
          {activeAssessment && (
            <div className="rounded-xl border border-blue-200 bg-white p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Taking Assessment: {activeAssessment.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Subject: {activeAssessment.subjectName} • Type: {activeAssessmentType === 'homework' ? 'Homework' : 'Exam'}</p>
                  {activeAssessmentType === 'online_exam' && examTimeRemaining !== null && (
                    <div className="mt-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold text-rose-700 inline-flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Time Remaining: {Math.floor(examTimeRemaining / 60)}m {examTimeRemaining % 60}s
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAssessment(null)
                    setActiveAssessmentType(null)
                    setAssessmentAnswers([])
                    setExamTimeRemaining(null)
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Cancel & Exit
                </button>
              </div>

              <form onSubmit={handleAssessmentSubmit} className="space-y-6">
                {(activeAssessment.questions || []).map((q: any, qIdx: number) => {
                  const studentAns = assessmentAnswers.find(ans => ans.questionId === q.id)
                  const isUploading = uploadingQuestionIds.has(q.id)

                  return (
                    <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-extrabold text-slate-800">
                          Question {qIdx + 1}: {q.questionText}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-md text-[9px] font-bold">
                          {q.points || 1} Points
                        </span>
                      </div>

                      {/* Render based on question type */}
                      {q.type === 'MCQ' && (
                        <div className="grid sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt: string, oIdx: number) => {
                            const isChecked = studentAns?.answerText === opt
                            return (
                              <label
                                key={oIdx}
                                className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition ${isChecked ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  checked={isChecked}
                                  onChange={() => {
                                    setAssessmentAnswers(prev => {
                                      const updated = [...prev]
                                      const idx = updated.findIndex(ans => ans.questionId === q.id)
                                      if (idx >= 0) {
                                        updated[idx] = { ...updated[idx], answerText: opt }
                                      } else {
                                        updated.push({ questionId: q.id, answerText: opt })
                                      }
                                      return updated
                                    })
                                  }}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-xs font-semibold text-slate-700">{opt}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}

                      {q.type === 'TF' && (
                        <div className="flex gap-4">
                          {['True', 'False'].map((opt) => {
                            const isChecked = studentAns?.answerText === opt
                            return (
                              <label
                                key={opt}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition ${isChecked ? 'bg-blue-50 border-blue-300 font-bold' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  checked={isChecked}
                                  onChange={() => {
                                    setAssessmentAnswers(prev => {
                                      const updated = [...prev]
                                      const idx = updated.findIndex(ans => ans.questionId === q.id)
                                      if (idx >= 0) {
                                        updated[idx] = { ...updated[idx], answerText: opt }
                                      } else {
                                        updated.push({ questionId: q.id, answerText: opt })
                                      }
                                      return updated
                                    })
                                  }}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-xs font-semibold text-slate-700">{opt}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}

                      {q.type === 'DOCUMENT' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(q.id, file)
                              }}
                              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                            />
                            {isUploading && (
                              <Loader2 className="animate-spin text-blue-600" size={16} />
                            )}
                          </div>
                          {studentAns?.fileUrl && (
                            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              ✓ Document ready: <a href={studentAns.fileUrl} target="_blank" rel="noreferrer" className="underline">View file</a>
                            </p>
                          )}
                        </div>
                      )}

                      {q.type === 'AUDIO' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            {recordingQuestionId === q.id ? (
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                              >
                                <Square size={12} /> Stop Recording
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startRecording(q.id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                              >
                                <Mic size={12} /> Start Recording
                              </button>
                            )}

                            {isUploading && (
                              <Loader2 className="animate-spin text-blue-600" size={16} />
                            )}
                          </div>
                          {studentAns?.audioUrl && (
                            <div className="space-y-1">
                              <p className="text-xs text-emerald-600 font-bold">✓ Audio uploaded successfully:</p>
                              <audio controls src={studentAns.audioUrl} className="h-8 w-full max-w-xs" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                <button
                  type="submit"
                  disabled={uploadingQuestionIds.size > 0}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  Submit Assessment Answers
                </button>
              </form>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Study Materials & Assignments */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm lg:col-span-1">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Study Materials & Notes</h3>
              </div>
              {tasks?.notes.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">No study materials uploaded for your class yet.</p>
              ) : (
                <div className="space-y-4">
                  {tasks?.notes.map((note) => (
                    <div key={note.id} className="p-4 rounded-xl border border-slate-200/60 bg-slate-50 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">{note.title}</p>
                        <p className="text-xs font-semibold text-slate-500">{note.description}</p>
                        <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pt-1">
                          <span>By {note.teacherName}</span>
                          <span>•</span>
                          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => window.open(`${endpoints.health.replace('/health', '')}/uploads/${note.encName}`, '_blank')}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition shadow-sm"
                        title="Download material file"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Online Assessments Workspace */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm lg:col-span-1">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-violet-600" />
                <h3 className="text-base font-extrabold text-slate-900">Online Exams</h3>
              </div>
              {tasks?.onlineExams.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">No online exams allocated to your class yet.</p>
              ) : (
                <div className="space-y-4">
                  {tasks?.onlineExams.map((ex) => (
                    <div key={ex.id} className="p-4 rounded-xl border border-slate-200/60 bg-slate-50 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{ex.title}</p>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          {ex.subjectName} {(ex.duration && ex.duration > 0) ? `• ${ex.duration} Mins` : ''}
                        </p>
                        {ex.submitted && ex.submittedAt && (
                          <span className="text-[10px] text-slate-400 font-bold block pt-1 uppercase">
                            Submitted on {new Date(ex.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div>
                        {ex.submitted ? (
                          <div className="text-right">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-700 rounded-full inline-block mb-1">
                              Completed
                            </span>
                            <p className="text-sm font-black text-slate-800">{ex.score} Marks</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartExamAttempt(ex)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg inline-block transition"
                          >
                            Take Exam
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Homework Assignments Workspace */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm lg:col-span-1">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Homework Assignments</h3>
              </div>
              {tasks?.homeworks.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">No homework assignments allocated to your class yet.</p>
              ) : (
                <div className="space-y-4">
                  {tasks?.homeworks.map((hw) => (
                    <div key={hw.id} className="p-4 rounded-xl border border-slate-200/60 bg-slate-50 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-800">{hw.title}</p>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{hw.subjectName}</p>
                        {hw.submitted && hw.submittedAt ? (
                          <span className="text-[10px] text-slate-400 font-bold block pt-1 uppercase">
                            Submitted: {new Date(hw.submittedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold block pt-1 uppercase">
                            Due: {new Date(hw.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div>
                        {hw.submitted ? (
                          <div className="text-right">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-700 rounded-full inline-block mb-1">
                              Submitted
                            </span>
                            <p className="text-sm font-black text-slate-800">
                              {hw.score !== null ? `${hw.score} Marks` : 'Pending Grade'}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveAssessment(hw)
                              setActiveAssessmentType('homework')
                              setAssessmentAnswers([])
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-block transition"
                          >
                            Solve Task
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'grades' && grades && (
        <div className="space-y-6">
          {/* Ranking Configuration Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-100/80 border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wide">Ranking Mode:</span>
                <select
                  value={rankingType}
                  onChange={(e) => setRankingType(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="full">Full Class Ranking</option>
                  <option value="topn">Top-N Bracket</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              {rankingType === 'topn' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wide">Limit N:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={rankingLimit}
                    onChange={(e) => setRankingLimit(Number(e.target.value))}
                    className="w-16 text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleExportPdf}
              disabled={exportingPdf || (!grades?.isEcd && grades?.reportCard.length === 0)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-black rounded-lg shadow-sm transition shrink-0 cursor-pointer"
            >
              {exportingPdf ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Export A4 PDF
                </>
              )}
            </button>
          </div>

          {/* Unified A4 Live Report Card Preview */}
          <div className="overflow-x-auto w-full py-4 bg-slate-50 border border-slate-200/60 shadow-2xs rounded-xl flex justify-center">
            {!grades?.isEcd && grades?.reportCard.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400 p-6 italic">No grades or exam marks recorded for this session yet.</p>
            ) : (() => {
              if (grades?.isEcd) {
                const assessment = grades.assessment || {}
                const commentText = assessment.narrativeComment || 'No qualitative narrative commentary or developmental remarks have been logged for this term evaluation.'

                return (
                  <div 
                    id="a4-report-card-preview" 
                    className="bg-white border border-slate-300 shadow-lg p-10 font-sans text-slate-800 flex flex-col justify-between select-none shrink-0"
                    style={{ width: '794px', height: '1123px', minWidth: '794px', minHeight: '1123px' }}
                  >
                    <div>
                      {/* A4 Header Accent */}
                      <div className="bg-emerald-700 text-white p-6 flex justify-between items-center rounded-sm">
                        <div className="space-y-1">
                          <h2 className="text-base font-black tracking-wide uppercase">{profile.branchName || 'UGBEKUN SCHOOLS'}</h2>
                          <p className="text-[10px] font-semibold text-emerald-200">MONTESSORI & NARRATIVE ASSESSMENT SHEET</p>
                        </div>
                        <div className="text-right space-y-1">
                          <h3 className="text-sm font-bold text-white uppercase">{assessment.exam?.name || 'TERM EVALUATION'}</h3>
                          <p className="text-[10px] text-emerald-200">Date Issued: {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Profile Information Block */}
                      <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-sm text-xs mt-6">
                        <div className="space-y-2">
                          <p className="text-slate-500 font-semibold">Student Name: <span className="text-slate-900 font-black">{profile.lastName}, {profile.firstName}</span></p>
                          <p className="text-slate-500 font-semibold">Registration No: <span className="text-slate-900 font-black">{profile.registerNo || 'Pending'}</span></p>
                          <p className="text-slate-500 font-semibold">Classroom: <span className="text-slate-900 font-black">{profile.className} ({profile.sectionName || 'Main'})</span></p>
                        </div>
                        <div className="space-y-1 text-slate-500 font-semibold text-[10px]">
                          <p className="font-extrabold text-emerald-700 text-xs mb-1">EVALUATION LEGEND:</p>
                          <p>EM : Emerging (Starting to demonstrate skill)</p>
                          <p>DV : Developing (Demonstrates occasionally)</p>
                          <p>AC : Achieved (Performs consistently)</p>
                          <p>MS : Mastered (Internalized skill / models for peers)</p>
                        </div>
                      </div>

                      {/* Developmental Matrix */}
                      <div className="mt-8 grid grid-cols-2 gap-6">
                        {/* Psychomotor Domain */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider py-2 px-3">
                            1. Psychomotor Domain
                          </div>
                          <div className="p-4 space-y-4">
                            {[
                              { label: 'Writing Mastery', val: assessment.writingMastery },
                              { label: 'Drawing Capability', val: assessment.drawingCapability },
                              { label: 'Physical Coordination', val: assessment.physicalCoordination },
                              { label: 'Motor Skill Progression', val: assessment.motorSkillProgression }
                            ].map((f, i) => (
                              <div key={i} className="space-y-1.5">
                                <p className="text-xs font-bold text-slate-700">{f.label}</p>
                                <div className="grid grid-cols-4 gap-1">
                                  {['EM', 'DV', 'AC', 'MS'].map(lvl => (
                                    <span 
                                      key={lvl} 
                                      className={`text-[9px] font-black text-center py-0.5 rounded border ${
                                        f.val === lvl 
                                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                                          : 'bg-slate-50 border-slate-200 text-slate-400'
                                      }`}
                                    >
                                      {lvl}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Behavioral Domain */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider py-2 px-3">
                            2. Behavioral Domain
                          </div>
                          <div className="p-4 space-y-4">
                            {[
                              { label: 'General Punctuality', val: assessment.generalPunctuality },
                              { label: 'Peer Respect', val: assessment.peerRespect },
                              { label: 'Aesthetic Neatness', val: assessment.aestheticNeatness },
                              { label: 'Active Group Participation', val: assessment.activeGroupParticipation }
                            ].map((f, i) => (
                              <div key={i} className="space-y-1.5">
                                <p className="text-xs font-bold text-slate-700">{f.label}</p>
                                <div className="grid grid-cols-4 gap-1">
                                  {['EM', 'DV', 'AC', 'MS'].map(lvl => (
                                    <span 
                                      key={lvl} 
                                      className={`text-[9px] font-black text-center py-0.5 rounded border ${
                                        f.val === lvl 
                                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                                          : 'bg-slate-50 border-slate-200 text-slate-400'
                                      }`}
                                    >
                                      {lvl}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary & narrative feedback */}
                    <div className="space-y-6">
                      <div className="border border-slate-200 p-4 rounded-sm space-y-2">
                        <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-wide">Holistic Developmental Commentary</h5>
                        <p className="text-slate-700 font-semibold italic text-[11px] leading-relaxed">
                          "{commentText}"
                        </p>
                      </div>

                      {/* Resumption & Form Teacher Details */}
                      <div className="grid grid-cols-2 gap-4 border border-slate-200 p-3 rounded-sm text-xs">
                        <p className="text-slate-500 font-semibold">Next Term Resumption: <span className="text-slate-900 font-bold">To Be Announced</span></p>
                        <p className="text-slate-500 font-semibold">Form Teacher: <span className="text-slate-900 font-bold">{profile.formTeacher?.name || 'Form Teacher'}</span></p>
                      </div>

                      {/* Signature lines */}
                      <div className="grid grid-cols-2 gap-12 pt-6">
                        <div className="border-t border-slate-250 text-center pt-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Form Teacher Signature</span>
                        </div>
                        <div className="border-t border-slate-250 text-center pt-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">School Principal Signature</span>
                        </div>
                      </div>

                      {/* Bottom disclaimer */}
                      <div className="border-t border-slate-100 text-center pt-4 space-y-1">
                        <p className="text-[8.5px] text-slate-400 font-semibold">This is an official computer-generated student narrative evaluation compiled on the Ugbekun 2.0 Portal.</p>
                        <p className="text-[8.5px] text-slate-400 font-semibold">© {new Date().getFullYear()} {profile.branchName || 'Ugbekun Schools'}. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                )
              }

              // GPA rating letter
              let gpaGrade = 'F'
              if (grades?.overallAverage) {
                const avg = grades.overallAverage
                if (avg >= 70) gpaGrade = 'A'
                else if (avg >= 60) gpaGrade = 'B'
                else if (avg >= 50) gpaGrade = 'C'
                else if (avg >= 45) gpaGrade = 'D'
                else if (avg >= 40) gpaGrade = 'E'
              }

              // Display rank computed suffix
              const getOrdinalSuffix = (i: number) => {
                const j = i % 10, k = i % 100
                if (j === 1 && k !== 11) return 'st'
                if (j === 2 && k !== 12) return 'nd'
                if (j === 3 && k !== 13) return 'rd'
                return 'th'
              }

              let displayRank = '-'
              if (grades?.rank && grades?.totalClassStudents) {
                if (rankingType === 'full') {
                  displayRank = `${grades.rank}${getOrdinalSuffix(grades.rank)} of ${grades.totalClassStudents}`
                } else if (rankingType === 'topn') {
                  if (grades.rank <= rankingLimit) {
                    displayRank = `${grades.rank}${getOrdinalSuffix(grades.rank)} (Top ${rankingLimit})`
                  } else {
                    displayRank = 'Graded'
                  }
                } else if (rankingType === 'hidden') {
                  displayRank = 'Hidden'
                }
              }

              return (
                <div 
                  id="a4-report-card-preview" 
                  className="bg-white border border-slate-350 shadow-lg p-10 font-sans text-slate-800 flex flex-col justify-between select-none shrink-0"
                  style={{ width: '794px', height: '1123px', minWidth: '794px', minHeight: '1123px' }}
                >
                  <div>
                    {/* A4 Header Accent */}
                    <div className="bg-blue-900 text-white p-6 flex justify-between items-center rounded-sm">
                      <div className="space-y-1">
                        <h2 className="text-base font-black tracking-wide uppercase">{profile.branchName || 'UGBEKUN SCHOOLS'}</h2>
                        <p className="text-[10px] font-semibold text-blue-200">OFFICIAL TERM REPORT CARD • BRANCH: {profile.branchName || 'GEN'}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <h3 className="text-sm font-bold text-white uppercase">{grades?.reportCard[0]?.examName || 'TERM EVALUATION'}</h3>
                        <p className="text-[10px] text-blue-200">Date Issued: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Profile Information Block */}
                    <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-sm text-xs mt-6">
                      <div className="space-y-2">
                        <p className="text-slate-500 font-semibold">Student Name: <span className="text-slate-900 font-black">{profile.lastName}, {profile.firstName}</span></p>
                        <p className="text-slate-500 font-semibold">Registration No: <span className="text-slate-900 font-black">{profile.registerNo || 'Pending'}</span></p>
                        <p className="text-slate-500 font-semibold">Classroom: <span className="text-slate-900 font-black">{profile.className} ({profile.sectionName || 'Main'})</span></p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-500 font-semibold">Overall Average: <span className="text-slate-900 font-black">{grades.overallAverage}%</span></p>
                        <p className="text-slate-500 font-semibold">GPA Grade: <span className="text-slate-900 font-black text-blue-700">{gpaGrade}</span></p>
                        <p className="text-slate-500 font-semibold">Class Ranking: <span className="text-slate-950 font-black underline decoration-blue-500 decoration-2">{displayRank}</span></p>
                      </div>
                    </div>

                    {/* Academic scoreboard */}
                    <div className="mt-8 space-y-3">
                      <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">Academic Score Board</h4>
                      <table className="w-full text-left border-collapse border border-slate-200">
                        <thead>
                          <tr className="bg-blue-900 text-white text-[9px] font-black uppercase tracking-wider">
                            <th className="py-2.5 px-3 border border-slate-200">Subject Code</th>
                            <th className="py-2.5 px-3 border border-slate-200">Subject Name</th>
                            <th className="py-2.5 px-3 border border-slate-200 text-center">Status</th>
                            <th className="py-2.5 px-3 border border-slate-200 text-right">Score</th>
                            <th className="py-2.5 px-3 border border-slate-200 text-right">Class Average</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {grades.reportCard.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-2.5 px-3 border border-slate-200 font-bold text-slate-800">{row.subjectCode || '-'}</td>
                              <td className="py-2.5 px-3 border border-slate-200 font-semibold text-slate-700">{row.subjectName}</td>
                              <td className="py-2.5 px-3 border border-slate-200 text-center">
                                {row.absent ? (
                                  <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Absent</span>
                                ) : row.mark !== null ? (
                                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Graded</span>
                                ) : (
                                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Pending</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 border border-slate-200 text-right font-black text-slate-900">
                                {row.absent ? '-' : (row.mark !== null ? `${row.mark}` : '-')}
                              </td>
                              <td className="py-2.5 px-3 border border-slate-200 text-right font-semibold text-slate-500">
                                {row.absent ? '-' : `${row.classAverage}`}
                              </td>
                            </tr>
                          ))}
                          {/* Empty padding rows for layout uniformity if short */}
                          {grades.reportCard.length < 5 && 
                            Array.from({ length: 5 - grades.reportCard.length }).map((_, i) => (
                              <tr key={`fill-${i}`}>
                                <td className="py-2.5 px-3 border border-slate-200">&nbsp;</td>
                                <td className="py-2.5 px-3 border border-slate-200">&nbsp;</td>
                                <td className="py-2.5 px-3 border border-slate-200">&nbsp;</td>
                                <td className="py-2.5 px-3 border border-slate-200">&nbsp;</td>
                                <td className="py-2.5 px-3 border border-slate-200">&nbsp;</td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary & remarks footer section */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="col-span-2 border border-slate-200 p-4 rounded-sm space-y-2">
                        <h5 className="text-[9px] font-black text-blue-900 uppercase tracking-wide">Form Teacher Commentary</h5>
                        <p className="text-slate-600 font-semibold italic text-[11px] leading-relaxed">
                          {grades.commentary ? `"${grades.commentary}"` : '"No performance commentary has been entered for this term yet."'}
                        </p>
                      </div>
                      <div className="border border-slate-200 p-4 rounded-sm space-y-2 text-xs">
                        <h5 className="text-[9px] font-black text-blue-900 uppercase tracking-wide">Term Overview</h5>
                        <p className="text-[10px] text-slate-500 font-semibold">Next Resumption Date:</p>
                        <p className="text-xs font-black text-slate-800">To Be Announced</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-2">Form Teacher:</p>
                        <p className="text-[10px] font-black text-slate-800">{profile.formTeacher?.name || 'Form Teacher'}</p>
                      </div>
                    </div>

                    {/* Signature lines */}
                    <div className="grid grid-cols-2 gap-12 pt-8">
                      <div className="border-t border-slate-250 text-center pt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Form Teacher Signature</span>
                      </div>
                      <div className="border-t border-slate-250 text-center pt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">School Principal Signature</span>
                      </div>
                    </div>

                    {/* Bottom disclaimer */}
                    <div className="border-t border-slate-100 text-center pt-4 space-y-1">
                      <p className="text-[8.5px] text-slate-400 font-semibold">This is an official computer-generated student evaluation record compiled on the Ugbekun 2.0 Portal.</p>
                      <p className="text-[8.5px] text-slate-400 font-semibold">© {new Date().getFullYear()} {profile.branchName || 'Ugbekun Schools'}. All rights reserved.</p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {activeSection === 'attendance' && (
        <div className="space-y-6">
          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Attendance Rate</p>
              <p className="text-3xl font-black text-emerald-600 mt-2">{attendance?.percentage ?? 100}%</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Present Days</p>
              <p className="text-3xl font-black text-blue-600 mt-2">{attendance?.presentCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Absent Days</p>
              <p className="text-3xl font-black text-rose-600 mt-2">{attendance?.absentCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Late Days</p>
              <p className="text-3xl font-black text-amber-600 mt-2">{attendance?.lateCount ?? 0}</p>
            </div>
          </div>

          {/* Daily Logs Table */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-900">Daily Attendance History</h3>
            </div>
            {!attendance?.logs || attendance.logs.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400 italic">No attendance records have been registered for this term yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Teacher Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {attendance.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {new Date(log.attendanceDate).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          {log.status === 'present' && (
                            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                              Present
                            </span>
                          )}
                          {log.status === 'absent' && (
                            <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                              Absent
                            </span>
                          )}
                          {log.status === 'late' && (
                            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                              Late
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 italic font-medium">
                          {log.remark || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'timetable' && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900">Timetable & Assigned Sessions</h3>
          </div>
          {profile.subjects.length === 0 ? (
            <p className="text-sm font-semibold text-slate-400">No classes assigned to display in the schedule.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profile.subjects.map((sub, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-slate-200/60 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-blue-100 text-blue-700 rounded-md">
                      {sub.type}
                    </span>
                    <Clock size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-800">{sub.name}</h4>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{sub.code}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Weekly Session</span>
                    <span className="text-slate-800">Allocated</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'settings' && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-6 shadow-sm max-w-2xl">
          <div className="flex items-center gap-2">
            <User size={18} className="text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900">Platform Settings & Profile</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 font-black text-2xl uppercase flex items-center justify-center border-4 border-white shadow-md">
              {profile.firstName.substring(0, 1)}{profile.lastName.substring(0, 1)}
            </div>
            <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
              <h4 className="text-lg font-black text-slate-800">{profile.firstName} {profile.lastName}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registration: {profile.registerNo || 'N/A'}</p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 font-semibold pt-3 border-t border-slate-200/60">
                <p>Gender: <span className="text-slate-800 font-bold capitalize">{profile.gender || 'Not Specified'}</span></p>
                <p>Branch Code: <span className="text-slate-800 font-bold uppercase">{profile.branchName || 'N/A'}</span></p>
                <p>Class Room: <span className="text-slate-800 font-bold">{profile.className || 'N/A'}</span></p>
                <p>Section: <span className="text-slate-800 font-bold">{profile.sectionName || 'N/A'}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
