'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  DollarSign, 
  CheckSquare, 
  Calendar, 
  Activity, 
  BookOpen, 
  TrendingUp, 
  Mail, 
  Phone, 
  GraduationCap, 
  Clock, 
  ChevronDown, 
  Download, 
  Loader2, 
  AlertCircle,
  FileText,
  Bookmark
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

export function ParentDashboard({ user, activeSection }: DashboardProps) {
  // Children Listing
  const [children, setChildren] = useState<ChildSummary[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)

  // Active Child details
  const [profile, setProfile] = useState<ChildProfile | null>(null)
  const [attendance, setAttendance] = useState<AttendanceData | null>(null)
  const [tasks, setTasks] = useState<TaskData | null>(null)
  const [grades, setGrades] = useState<GradeData | null>(null)

  // System UI States
  const [loadingList, setLoadingList] = useState(true)
  const [loadingChild, setLoadingChild] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  // PDF Ranking State parameters
  const [rankingType, setRankingType] = useState<string>('full')
  const [rankingLimit, setRankingLimit] = useState<number>(3)

  // Fetch children list first
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
          setError(err.message || 'An error occurred loading children links.')
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

  // Fetch student details when active child changes
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

        // 1. Fetch Profile
        const profileRes = await apiSlice.get<{ success: boolean } & ChildProfile>(endpoints.parent.childProfile(childId))
        if (!active) return
        if (profileRes.success) setProfile(profileRes)

        // 2. Fetch Attendance
        const attendanceRes = await apiSlice.get<{ success: boolean } & AttendanceData>(endpoints.parent.childAttendance(childId))
        if (attendanceRes.success) setAttendance(attendanceRes)

        // 3. Fetch Tasks
        const tasksRes = await apiSlice.get<{ success: boolean } & TaskData>(endpoints.parent.childTasks(childId))
        if (tasksRes.success) setTasks(tasksRes)

        // 4. Fetch Grades
        const gradesRes = await apiSlice.get<{ success: boolean } & GradeData>(endpoints.parent.childGrades(childId))
        if (gradesRes.success) setGrades(gradesRes)

      } catch (err: any) {
        console.error(err)
      } finally {
        if (active) setLoadingChild(false)
      }
    }

    loadChildData()

    return () => {
      active = false
    }
  }, [selectedChildId])

  // PDF Export Trigger
  const handleExportPdf = async () => {
    if (!profile) return
    try {
      setExportingPdf(true)
      const url = endpoints.parent.childExportPdf(profile.studentId, rankingType, rankingType === 'topn' ? rankingLimit : undefined)
      await apiSlice.download(url, `report_card_${profile.lastName}_${profile.firstName}.pdf`)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to download PDF report card.')
    } finally {
      setExportingPdf(false)
    }
  }

  // Render Loading States
  if (loadingList) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Resolving children associations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 max-w-lg mx-auto text-center space-y-4 shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h4 className="text-base font-bold text-rose-900">Linkage Error</h4>
        <p className="text-xs text-rose-700 font-semibold">{error}</p>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
        <Users className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-black text-slate-800">No Linked Student Records</h3>
        <p className="text-sm text-slate-400 font-semibold">Your parent profile is not currently linked to any registered students. Please contact school administration to set up child relations.</p>
      </div>
    )
  }

  // Active Child summaries
  const activeChild = children.find(c => c.id === selectedChildId) || children[0]
  const gpa = grades ? Number(((grades.overallAverage / 100) * 4).toFixed(2)) : 0.00
  
  const stats = [
    { label: 'Enrolled Courses', value: profile ? `${profile.subjects.length} Subjects` : '...', icon: BookOpen, color: 'text-violet-600 bg-violet-50 border-violet-100' },
    { label: 'Attendance Counter', value: attendance ? `${attendance.percentage}% Present` : '...', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: 'Grade Average', value: grades ? `${grades.overallAverage}% (${gpa} GPA)` : '...', icon: TrendingUp, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { label: 'Classroom Count', value: profile ? `${profile.fellowStudentsCount} Students` : '...', icon: Users, color: 'text-amber-600 bg-amber-50 border-amber-100' }
  ]

  return (
    <div className="space-y-8">
      {/* School Header */}
      <SchoolHeader />

      {/* Children Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-black text-blue-600 text-sm uppercase border border-blue-100">
            {activeChild.firstName.substring(0, 1)}{activeChild.lastName.substring(0, 1)}
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Viewing Academic Record For</span>
            <h3 className="text-base font-black text-slate-800 leading-tight">{activeChild.lastName}, {activeChild.firstName}</h3>
          </div>
        </div>

        {/* Dropdown switcher */}
        {children.length > 1 && (
          <div className="relative">
            <select 
              value={selectedChildId || ''} 
              onChange={(e) => setSelectedChildId(Number(e.target.value))}
              className="appearance-none pr-10 pl-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.lastName}, {child.firstName} ({child.className})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none stroke-[2.5]" />
          </div>
        )}
      </div>

      {loadingChild ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading student aggregates...</p>
        </div>
      ) : profile ? (
        <>
          {/* Banner */}
          <div className="relative rounded-2xl bg-gradient-to-r from-[#003da5] via-[#0063a6] to-[#009ca6] p-6 md:p-8 shadow-md overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
            </div>
            <div className="relative z-10 space-y-2.5">
              <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block">
                {profile.branchName || 'Academy Workspace'}
              </span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-white/80 text-sm max-w-xl font-medium">
                Room: <span className="text-white font-bold">{profile.className || 'Not Enrolled'} ({profile.sectionName || 'N/A'})</span> | Reg: <span className="text-white font-bold">{profile.registerNo || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Overview Section */}
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

          {/* Attendance Section */}
          {activeSection === 'attendance' && (
            <div className="space-y-6">
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

              <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Child's Attendance History</h3>
                </div>
                {!attendance?.logs || attendance.logs.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-400 italic">No attendance records have been registered for this child yet.</p>
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
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </td>
                            <td className="py-3.5 px-4">
                              {log.status === 'Present' && (
                                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                                  Present
                                </span>
                              )}
                              {log.status === 'Absent' && (
                                <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                                  Absent
                                </span>
                              )}
                              {log.status === 'Late' && (
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

          {/* Assignments/Tasks Section */}
          {activeSection === 'assignments' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Study notes from teacher */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Bookmark size={18} className="text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Study Materials & Notes</h3>
                </div>
                {!tasks?.notes || tasks.notes.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-400 italic">No study materials shared with the classroom yet.</p>
                ) : (
                  <div className="space-y-4">
                    {tasks.notes.map((note) => (
                      <div key={note.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between">
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{note.title}</p>
                          <p className="text-xs font-semibold text-slate-500 line-clamp-2">{note.description}</p>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">By {note.teacherName} · {new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <a 
                          href={`http://localhost:5001/uploads/${note.encName}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition shrink-0 ml-4"
                        >
                          <Download size={16} className="stroke-[2.5]" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Online exams */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Online Assessments</h3>
                </div>
                {!tasks?.onlineExams || tasks.onlineExams.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-400 italic">No online exams allocated to the classroom yet.</p>
                ) : (
                  <div className="space-y-4">
                    {tasks.onlineExams.map((exam) => (
                      <div key={exam.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-800">{exam.title}</h4>
                          {exam.submitted ? (
                            <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-700 rounded border border-emerald-200">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-extrabold bg-slate-100 text-slate-500 rounded border border-slate-200">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1 border-t border-slate-100">
                          <span>Subject: {exam.subjectName}</span>
                          {exam.submitted && exam.score !== null ? (
                            <span className="font-bold text-slate-800">Score: {exam.score} / 100</span>
                          ) : (
                            <span>Pass: {exam.passingMark}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grades tab with live A4 Preview and dynamic rankings */}
          {activeSection === 'grades' && grades && (
            <div className="space-y-8">
              {/* PDF Options Bar */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span>Ranking Parameters:</span>
                    <select
                      value={rankingType}
                      onChange={(e) => setRankingType(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600 bg-slate-50"
                    >
                      <option value="full">Full Class Ranking</option>
                      <option value="topn">Top-N Bracket</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>

                  {rankingType === 'topn' && (
                    <div className="flex items-center gap-2">
                      <span>Top Limit:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={rankingLimit}
                        onChange={(e) => setRankingLimit(parseInt(e.target.value, 10) || 3)}
                        className="w-16 px-2 py-1.5 border border-slate-200 rounded-md text-center bg-slate-50 text-slate-800 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf || (!grades?.isEcd && grades?.reportCard.length === 0)}
                  className="flex items-center justify-center gap-2 bg-[#003da5] hover:bg-[#002e7d] disabled:bg-slate-400 text-white font-extrabold text-xs px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition"
                >
                  {exportingPdf ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Exporting A4 PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} className="stroke-[2.5]" />
                      <span>Export A4 PDF</span>
                    </>
                  )}
                </button>
              </div>

              {/* A4 High-Fidelity Preview Container */}
              <div className="bg-slate-100 rounded-xl p-8 overflow-auto border border-slate-200/60 flex justify-center shadow-inner">
                {grades?.isEcd ? (() => {
                  const assessment = grades.assessment || {}
                  const commentText = assessment.narrativeComment || 'No qualitative narrative commentary or developmental remarks have been logged for this term evaluation.'

                  return (
                    <div 
                      id="a4-preview-card" 
                      className="w-[595px] min-h-[841px] bg-white border border-slate-350 p-8 flex flex-col justify-between select-none text-[10px]"
                      style={{ boxSizing: 'border-box' }}
                    >
                      <div>
                        {/* A4 Header Accent */}
                        <div className="bg-emerald-700 text-white p-4 flex justify-between items-center rounded-sm">
                          <div className="space-y-0.5">
                            <h2 className="text-[11px] font-black tracking-wide uppercase">{profile.branchName || 'UGBEKUN SCHOOLS'}</h2>
                            <p className="text-[8px] font-semibold text-emerald-200">MONTESSORI & NARRATIVE ASSESSMENT SHEET</p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <h3 className="text-[10px] font-bold text-white uppercase">{assessment.exam?.name || 'TERM EVALUATION'}</h3>
                            <p className="text-[8px] text-emerald-200">Date Issued: {new Date().toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Profile Information Block */}
                        <div className="grid grid-cols-2 gap-4 border border-slate-200 p-3 rounded-sm text-[9px] mt-4">
                          <div className="space-y-1">
                            <p className="text-slate-500 font-semibold">Student Name: <span className="text-slate-900 font-black">{profile.lastName}, {profile.firstName}</span></p>
                            <p className="text-slate-500 font-semibold">Registration No: <span className="text-slate-900 font-black">{profile.registerNo || 'Pending'}</span></p>
                            <p className="text-slate-500 font-semibold">Classroom: <span className="text-slate-900 font-black">{profile.className} ({profile.sectionName || 'Main'})</span></p>
                          </div>
                          <div className="space-y-0.5 text-slate-500 font-semibold text-[8px]">
                            <p className="font-extrabold text-emerald-700 text-[9px] mb-0.5">EVALUATION LEGEND:</p>
                            <p>EM : Emerging | DV : Developing | AC : Achieved | MS : Mastered</p>
                          </div>
                        </div>

                        {/* Developmental Matrix */}
                        <div className="mt-5 grid grid-cols-2 gap-4">
                          {/* Psychomotor Domain */}
                          <div className="border border-slate-200 rounded overflow-hidden">
                            <div className="bg-emerald-700 text-white text-[8px] font-black uppercase tracking-wider py-1.5 px-2">
                              1. Psychomotor Domain
                            </div>
                            <div className="p-3 space-y-3">
                              {[
                                { label: 'Writing Mastery', val: assessment.writingMastery },
                                { label: 'Drawing Capability', val: assessment.drawingCapability },
                                { label: 'Physical Coordination', val: assessment.physicalCoordination },
                                { label: 'Motor Skill Progression', val: assessment.motorSkillProgression }
                              ].map((f, i) => (
                                <div key={i} className="space-y-1">
                                  <p className="text-[9px] font-bold text-slate-700">{f.label}</p>
                                  <div className="grid grid-cols-4 gap-0.5">
                                    {['EM', 'DV', 'AC', 'MS'].map(lvl => (
                                      <span 
                                        key={lvl} 
                                        className={`text-[8px] font-black text-center py-0.5 rounded border ${
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
                          <div className="border border-slate-200 rounded overflow-hidden">
                            <div className="bg-indigo-700 text-white text-[8px] font-black uppercase tracking-wider py-1.5 px-2">
                              2. Behavioral Domain
                            </div>
                            <div className="p-3 space-y-3">
                              {[
                                { label: 'General Punctuality', val: assessment.generalPunctuality },
                                { label: 'Peer Respect', val: assessment.peerRespect },
                                { label: 'Aesthetic Neatness', val: assessment.aestheticNeatness },
                                { label: 'Active Group Participation', val: assessment.activeGroupParticipation }
                              ].map((f, i) => (
                                <div key={i} className="space-y-1">
                                  <p className="text-[9px] font-bold text-slate-700">{f.label}</p>
                                  <div className="grid grid-cols-4 gap-0.5">
                                    {['EM', 'DV', 'AC', 'MS'].map(lvl => (
                                      <span 
                                        key={lvl} 
                                        className={`text-[8px] font-black text-center py-0.5 rounded border ${
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
                      <div className="space-y-4 mt-4">
                        <div className="border border-slate-200 p-3 rounded-sm space-y-1">
                          <h5 className="text-[8px] font-black text-emerald-800 uppercase tracking-wide">Holistic Developmental Commentary</h5>
                          <p className="text-slate-700 font-semibold italic text-[9px] leading-relaxed">
                            "{commentText}"
                          </p>
                        </div>

                        {/* Resumption & Form Teacher Details */}
                        <div className="grid grid-cols-2 gap-4 border border-slate-200 p-2 rounded-sm text-[9px]">
                          <p className="text-slate-500 font-semibold">Next Resumption: <span className="text-slate-900 font-bold">To Be Announced</span></p>
                          <p className="text-slate-500 font-semibold">Form Teacher: <span className="text-slate-900 font-bold">{profile.formTeacher?.name || 'Form Teacher'}</span></p>
                        </div>

                        {/* Signature lines */}
                        <div className="grid grid-cols-2 gap-8 pt-4">
                          <div className="border-t border-slate-250 text-center pt-1.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Form Teacher Signature</span>
                          </div>
                          <div className="border-t border-slate-250 text-center pt-1.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">School Principal Signature</span>
                          </div>
                        </div>

                        {/* Bottom disclaimer */}
                        <div className="border-t border-slate-100 text-center pt-3 space-y-0.5">
                          <p className="text-[7.5px] text-slate-400 font-semibold">This is an official computer-generated student narrative evaluation compiled on the Ugbekun 2.0 Portal.</p>
                          <p className="text-[7.5px] text-slate-400 font-semibold">© {new Date().getFullYear()} {profile.branchName || 'Ugbekun Schools'}. All rights reserved.</p>
                        </div>
                      </div>
                    </div>
                  )
                })() : (
                  <div 
                    id="a4-preview-card"
                    className="w-[595px] min-h-[841px] bg-white border border-slate-350 p-8 flex flex-col justify-between text-slate-800 shadow-lg text-[10px]"
                    style={{ boxSizing: 'border-box' }}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex justify-between items-center border-b border-slate-300 pb-4">
                        <div className="space-y-1">
                          <h2 className="text-sm font-black text-blue-900 tracking-tight uppercase">
                            {profile.branchName || 'Ugbekun Schools'}
                          </h2>
                          <p className="text-[8px] font-bold text-slate-400 tracking-wider">OFFICIAL EVALUATION RECORD</p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 font-black rounded text-[8px] uppercase tracking-wider">
                            Report Card
                          </span>
                          <p className="text-[7.5px] font-bold text-slate-400 mt-1">CODE: {profile.registerNo || 'GEN'}</p>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-4 mt-5 bg-slate-50 border border-slate-200/80 p-4 rounded-sm text-[9px]">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-slate-500">Student Name: <span className="text-slate-800 font-black ml-1">{profile.lastName}, {profile.firstName}</span></p>
                          <p className="font-semibold text-slate-500">Register No: <span className="text-slate-800 font-bold ml-1">{profile.registerNo || 'N/A'}</span></p>
                          <p className="font-semibold text-slate-500">Class Room: <span className="text-slate-800 font-bold ml-1">{profile.className || 'N/A'} ({profile.sectionName || 'N/A'})</span></p>
                        </div>
                        <div className="space-y-1.5 text-right">
                          {(() => {
                            const showRank = 
                              rankingType === 'full' || 
                              (rankingType === 'topn' && grades.rank !== null && grades.rank <= rankingLimit)

                            return (
                              <p className="font-semibold text-slate-500">
                                Academic Position: 
                                <span className="text-slate-800 font-black ml-1 uppercase">
                                  {showRank && grades.rank !== null 
                                    ? `${grades.rank} of ${grades.totalClassStudents}` 
                                    : 'Graded'}
                                </span>
                              </p>
                            )
                          })()}
                          <p className="font-semibold text-slate-500">Class Average: <span className="text-slate-800 font-bold ml-1">{grades.overallAverage}%</span></p>
                          <p className="font-semibold text-slate-500">Evaluation Date: <span className="text-slate-800 font-bold ml-1">{new Date().toLocaleDateString()}</span></p>
                        </div>
                      </div>

                      {/* Report Card Grid */}
                      <div className="mt-8 space-y-3">
                        <h4 className="text-[9px] font-black text-blue-900 uppercase tracking-wider">Academic Score Board</h4>
                        <table className="w-full text-left border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-blue-950 text-white text-[9px] font-black uppercase tracking-wider">
                              <th className="py-2 px-3 border border-slate-200">Subject Code</th>
                              <th className="py-2 px-3 border border-slate-200">Subject Name</th>
                              <th className="py-2 px-3 border border-slate-200 text-center">Status</th>
                              <th className="py-2 px-3 border border-slate-200 text-right">Score</th>
                              <th className="py-2 px-3 border border-slate-200 text-right">Class Average</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-[9px]">
                            {grades.reportCard.map((row) => (
                              <tr key={row.id}>
                                <td className="py-2 px-3 border border-slate-200 font-bold text-slate-800">{row.subjectCode || '-'}</td>
                                <td className="py-2 px-3 border border-slate-200 font-semibold text-slate-700">{row.subjectName}</td>
                                <td className="py-2 px-3 border border-slate-200 text-center">
                                  {row.absent ? (
                                    <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Absent</span>
                                  ) : row.mark !== null ? (
                                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Graded</span>
                                  ) : (
                                    <span className="text-[8px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Pending</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 border border-slate-200 text-right font-black text-slate-900">
                                  {row.absent ? '-' : (row.mark !== null ? `${row.mark}` : '-')}
                                </td>
                                <td className="py-2 px-3 border border-slate-200 text-right font-semibold text-slate-500">
                                  {row.absent ? '-' : `${row.classAverage}`}
                                </td>
                              </tr>
                            ))}
                            {grades.reportCard.length < 5 && 
                              Array.from({ length: 5 - grades.reportCard.length }).map((_, i) => (
                                <tr key={`fill-${i}`}>
                                  <td className="py-2 px-3 border border-slate-200">&nbsp;</td>
                                  <td className="py-2 px-3 border border-slate-200">&nbsp;</td>
                                  <td className="py-2 px-3 border border-slate-200">&nbsp;</td>
                                  <td className="py-2 px-3 border border-slate-200">&nbsp;</td>
                                  <td className="py-2 px-3 border border-slate-200">&nbsp;</td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Remarks & Signatures Footer */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                        <div className="col-span-2 border border-slate-200 p-4 rounded-sm space-y-2">
                          <h5 className="text-[8px] font-black text-blue-900 uppercase tracking-wide">Form Teacher Commentary</h5>
                          <p className="text-slate-600 font-semibold italic text-[10px] leading-relaxed">
                            {grades.commentary ? `"${grades.commentary}"` : '"No performance commentary has been entered for this term yet."'}
                          </p>
                        </div>
                        <div className="border border-slate-200 p-4 rounded-sm space-y-2 text-[9px]">
                          <h5 className="text-[8px] font-black text-blue-900 uppercase tracking-wide">Term Overview</h5>
                          <p className="text-[8px] text-slate-500 font-semibold">Next Resumption Date:</p>
                          <p className="text-[9px] font-black text-slate-800">To Be Announced</p>
                          <p className="text-[8px] text-slate-500 font-semibold mt-2">Form Teacher:</p>
                          <p className="text-[8px] font-black text-slate-800">{profile.formTeacher?.name || 'Form Teacher'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-12 pt-6">
                        <div className="border-t border-slate-250 text-center pt-2">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Form Teacher Signature</span>
                        </div>
                        <div className="border-t border-slate-250 text-center pt-2">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">School Principal Signature</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 text-center pt-4 space-y-1">
                        <p className="text-[8px] text-slate-400 font-semibold">This is an official computer-generated student evaluation record compiled on the Ugbekun 2.0 Portal.</p>
                        <p className="text-[8px] text-slate-400 font-semibold">© {new Date().getFullYear()} {profile.branchName || 'Ugbekun Schools'}. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-400">Child profile details are missing.</p>
        </div>
      )}
    </div>
  )
}
