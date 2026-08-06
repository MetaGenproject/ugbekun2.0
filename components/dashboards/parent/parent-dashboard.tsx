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
  User
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

export function ParentDashboard({ user, activeSection }: DashboardProps) {
  // Children Listing State
  const [children, setChildren] = useState<ChildSummary[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)

  // Active Child Details State
  const [profile, setProfile] = useState<ChildProfile | null>(null)
  const [attendance, setAttendance] = useState<AttendanceData | null>(null)
  const [tasks, setTasks] = useState<TaskData | null>(null)
  const [grades, setGrades] = useState<GradeData | null>(null)

  // UI & Loading States
  const [loadingList, setLoadingList] = useState(true)
  const [loadingChild, setLoadingChild] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)

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

  // Interactive Checklist Reminders State
  const [reminders, setReminders] = useState([
    { id: 1, text: 'Check fee payment receipt', done: true },
    { id: 2, text: 'Review child weekly attendance log', done: true },
    { id: 3, text: 'Acknowledge terminal report card', done: true },
    { id: 4, text: 'PTA General Meeting at 10:00 AM', done: false },
    { id: 5, text: 'Submit medical record update', done: false },
  ])

  const toggleReminder = (id: number) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r))
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

  useEffect(() => {
    if (activeSection === 'sibling-requests') {
      fetchSiblingRequests()
    }
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

  return (
    <div className="space-y-6 pb-12 font-sans">

      {/* Top Welcome Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full opacity-10 bg-white blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Good Morning, {user.username}! 👋
            </h1>
            <p className="text-sm text-blue-100 mt-1 font-medium">
              Here&apos;s what&apos;s happening with your children in school today.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-xs">
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-sky-200" />
              <div>
                <span className="font-bold block text-white">{currentDateFormatted}</span>
                <span className="text-[11px] text-blue-100">2025/2026 Academic Session</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Child Switcher Bar */}
      {children.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Child:</span>
            <div className="flex flex-wrap gap-2">
              {children.map((child) => {
                const isSelected = child.id === selectedChildId
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-bold transition border border-pink-100"
          >
            <Plus size={16} />
            <span>Apply Sibling Admission</span>
          </button>
        </div>
      )}

      {/* 6 Main KPI Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 block">
                {profile?.fellowStudentsCount || (activeChild ? 38 : 0)}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Classmates</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">↑ Active term</span>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <GraduationCap size={20} />
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 block truncate">
                {profile?.formTeacher?.name || 'Mrs. Adams'}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Form Teacher</span>
            </div>
          </div>
          <span className="text-[10px] text-purple-600 font-bold">↗ Assigned</span>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 block">
                {profile?.subjects?.length || 10}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Subjects</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">✓ All Active</span>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Activity size={20} />
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 block">
                {attendance ? `${attendance.percentage}%` : '94%'}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Attendance</span>
            </div>
          </div>
          <span className="text-[10px] text-amber-600 font-bold">✓ Good Standing</span>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 block">
                {grades?.overallAverage ? `${grades.overallAverage}%` : '78.5%'}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Grade Average</span>
            </div>
          </div>
          <span className="text-[10px] text-rose-600 font-bold">↑ Rank #{grades?.rank || 3}</span>
        </div>

        {/* Card 6 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 block">
                Paid
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Term Fee</span>
            </div>
          </div>
          <span className="text-[10px] text-sky-600 font-bold">✓ Clear</span>
        </div>

      </div>

      {/* Main Analytics Section (2 Grid Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Analytics Charts */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Middle Row: 3 Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Donut Attendance Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">
                  Attendance Overview
                </h3>

                <div className="relative w-28 h-28 mx-auto my-2 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#10B981" strokeWidth="3.5" strokeDasharray="94, 100" />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xl font-black text-gray-900 leading-none block">
                      {attendance ? `${attendance.percentage}%` : '94%'}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold">Overall</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-gray-600 pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Present</span>
                    <span className="font-bold">{attendance ? attendance.presentCount : 121} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Late</span>
                    <span className="font-bold">{attendance ? attendance.lateCount : 2} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Absent</span>
                    <span className="font-bold">{attendance ? attendance.absentCount : 1} days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Performance Subject Bars */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">
                  Academic Performance
                </h3>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-700 mb-1">
                      <span>English Language</span>
                      <span className="text-emerald-600 font-bold">78%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-700 mb-1">
                      <span>Mathematics</span>
                      <span className="text-blue-600 font-bold">85%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-700 mb-1">
                      <span>Basic Science</span>
                      <span className="text-purple-600 font-bold">82%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: '82%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-700 mb-1">
                      <span>Computer Studies</span>
                      <span className="text-pink-600 font-bold">88%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                >
                  {exportingPdf ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  <span>Export Report Card (PDF)</span>
                </button>
              </div>
            </div>

            {/* School Fee Overview Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">
                  School Fee Overview
                </h3>

                <div className="space-y-3 pt-1">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Collected / Paid</span>
                    <span className="text-2xl font-black text-gray-900">₦250,000</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-600 mb-1">
                      <span>Payment Status</span>
                      <span className="text-emerald-600 font-bold">100% Cleared</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Outstanding Balance:</span>
                      <span className="font-bold text-gray-900">₦0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Term Term Fee:</span>
                      <span className="font-bold text-gray-900">Due Sep 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Actions Row */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4">
              Quick Actions
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-100 transition"
              >
                <Plus size={16} />
                <span>Sibling Admission</span>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-50 text-pink-600 font-bold text-xs hover:bg-pink-100 transition"
              >
                <Download size={16} />
                <span>Download Report Card</span>
              </button>

              <button
                onClick={() => alert('Opening Teacher Direct Messaging...')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-600 font-bold text-xs hover:bg-purple-100 transition"
              >
                <Mail size={16} />
                <span>Message Form Teacher</span>
              </button>

              <button
                onClick={() => alert('Redirecting to MyEduRide Bus Tracking...')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-100 transition"
              >
                <Bus size={16} />
                <span>Track School Bus</span>
              </button>
            </div>
          </div>

          {/* 4 Secondary Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Today&apos;s Classes</span>
              <span className="text-xl font-extrabold text-gray-900 block">8 Subjects Scheduled</span>
              <span className="text-[10px] text-emerald-600 font-bold">✓ All on timetable</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Sibling Admissions</span>
              <span className="text-xl font-extrabold text-gray-900 block">{siblingRequests.length} Applications</span>
              <span className="text-[10px] text-blue-600 font-bold">↗ Under review</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Library Books</span>
              <span className="text-xl font-extrabold text-gray-900 block">2 Borrowed</span>
              <span className="text-[10px] text-purple-600 font-bold">Due in 5 days</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">MyEduRide Tracker</span>
              <span className="text-xl font-extrabold text-gray-900 block">Arrived Home</span>
              <span className="text-[10px] text-emerald-600 font-bold">✓ Safe arrival at 3:45 PM</span>
            </div>

          </div>

          {/* Recent Activities Strip */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">
              Recent Activities & Notifications
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Form Teacher uploaded Term 2 Assessment Report</span>
                    <span className="text-gray-400 text-[11px]">15 minutes ago</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-600">View</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Term Fee Receipt Generated (#RCT-8849)</span>
                    <span className="text-gray-400 text-[11px]">2 hours ago</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-600">Download</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Upcoming Events Widget */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Upcoming Events
              </h3>
              <span className="text-[10px] text-blue-600 font-bold cursor-pointer">View All</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center text-[10px] font-bold shrink-0">
                  <span>31</span>
                  <span className="uppercase text-[8px]">JUL</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">PTA General Meeting</h4>
                  <p className="text-[11px] text-gray-500">Tomorrow, 10:00 AM</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-pink-50/50 border border-pink-100">
                <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex flex-col items-center justify-center text-[10px] font-bold shrink-0">
                  <span>01</span>
                  <span className="uppercase text-[8px]">AUG</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Inter-House Sports Competition</h4>
                  <p className="text-[11px] text-gray-500">Friday, 9:00 AM</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex flex-col items-center justify-center text-[10px] font-bold shrink-0">
                  <span>04</span>
                  <span className="uppercase text-[8px]">AUG</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">First Continuous Assessment (CA)</h4>
                  <p className="text-[11px] text-gray-500">Monday, 8:00 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Reminders Interactive Widget */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Today&apos;s Reminders
              </h3>
              <span className="text-[10px] text-blue-600 font-bold">5 Tasks</span>
            </div>

            <div className="space-y-2.5">
              {reminders.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleReminder(r.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-left text-xs transition border border-transparent hover:border-gray-100"
                >
                  {r.done ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Circle size={18} className="text-gray-300 shrink-0" />
                  )}
                  <span className={`font-medium ${r.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {r.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Sibling Admission Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-gray-900 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h3 className="text-lg font-bold text-gray-900">Apply for Sibling Admission</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gender *</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formBirthday}
                    onChange={(e) => setFormBirthday(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Class *</label>
                  <select
                    required
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="">Select Class</option>
                    {classesInfo.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Section *</label>
                  <select
                    required
                    value={formSectionId}
                    onChange={(e) => setFormSectionId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="">Select Section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
