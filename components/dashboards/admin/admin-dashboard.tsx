'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  GraduationCap, 
  UserCheck,
  Briefcase,
  Activity,
  TrendingUp,
  Trash2,
  UserPlus,
  Edit2,
  CreditCard,
  Wallet,
  Calendar,
  BookOpen,
  CheckSquare
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { TeacherOnboardingModal, EditTeacherModal } from './teacher-modals'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'
import { BranchSetup } from './branch-setup'
import { StudentOnboarding } from './student-onboarding'
import { StudentPromotionModal } from './student-promotion-modal'
import { ClassroomStudents } from './classroom-students'
import { IdProvisioning } from './id-provisioning'
import { FinancesDashboard } from './finances-dashboard'
import { CommentaryReview } from './commentary-review'
import { BranchSettings } from './branch-settings'
import { AdminTeacherDuties } from './admin-teacher-duties'
import { StaffActivitiesReport } from './staff-activities-report'
import { AdminCbtManager } from './admin-cbt-manager'
import SchoolCalendar from './school-calendar'
import { RoleManagement } from './role-management'
import { TimetableManager } from './timetable-manager'
import { EvaluationMatrices } from './evaluation-matrices'
import { InventoryDashboard } from './inventory-dashboard'
import { ExamHalls } from './exam-halls'
import { ExamScheduleManager } from './exam-schedule-manager'
import { MarksEntry } from './marks-entry'
import { AttendanceManager } from './attendance-manager'
import { CardManagement } from './card-management'
import { HrLeaveManagement } from './hr-leave-management'
import { StudentPromotions } from './student-promotions'
import { LibraryManagement } from './library-management'
import { ComprehensiveReports } from './comprehensive-reports'
import { ParentDirectory } from './parent-directory'
import { StaffDirectory } from './staff-directory'
import { DepartmentManagement } from './department-management'
import { AdmissionsManagement } from './admissions-management'
import { AcademicStructure } from './academic-structure'
import { LessonManagement } from './lesson-management'
import { HomeworkManagement } from './homework-management'
import { ExamCbtManagement } from './exam-cbt-management'
import { ReportCardManagement } from './report-card-management'
import { CompetitionsManagement } from './competitions-management'
import { HrManagement } from './hr-management'
import { CommunicationCenter } from './communication-center'
import { CampusLiveManagement } from './campus-live-management'
import { MyEduRideIntegration } from './myeduride-integration'
import { SchoolWebsiteManagement } from './school-website-management'
import { FinancialRecordsManagement } from './financial-records-management'

export interface BranchStats {
  branchId: number
  branchName: string
  branchCode?: string | null
  students: number
  parents: number
  teachers: number
  staff: number
  classes?: number
  subjects?: number
  feeCollected?: number
  feeOutstanding?: number
  feeExpected?: number
  admissions?: number
  settings?: {
    academicSession?: string
    currentTerm?: string
    schoolName?: string
    logoUrl?: string
    principalSignatureUrl?: string
    currencySymbol?: string
  } | null
}

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
    legacyUserId?: number | null
  }
  activeSection?: string
  branchStats?: BranchStats | null
  onNavigate?: (section: string) => void
}

interface StudentRow {
  id: number
  registerNo: string | null
  firstName: string | null
  lastName: string | null
  gender: string | null
  mobileno: string | null
  email: string | null
  parentName: string | null
  className?: string | null
  active?: boolean
}

interface ParentRow {
  id: number
  name: string | null
  relation: string | null
  email: string | null
  mobileno: string | null
  city: string | null
  state: string | null
  studentCount: number
  active?: boolean
}

interface TeacherRow {
  id: number
  name: string
  email: string | null
  phone: string | null
  photo?: string | null
  classCount: number
  active?: boolean
}

interface StaffRow {
  id: number
  username: string
  role: number
  roleLabel: string
  photo?: string | null
  lastLogin: string | null
  active?: boolean
}

function formatCount(value: number, label: string) {
  return `${value.toLocaleString()} ${label}`
}

function SectionBanner({
  title,
  description,
  branchName,
  branchCode,
  logoUrl,
}: {
  title: string
  description: string
  branchName?: string
  branchCode?: string | null
  logoUrl?: string | null
}) {
  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-[#003da5] via-[#0063a6] to-[#009ca6] p-6 md:p-8 shadow-md overflow-hidden flex items-center justify-between gap-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
      </div>
      <div className="relative z-10 space-y-2.5 flex-1 min-w-0">
        <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block">
          {branchName || 'Branch Admin'}
          {branchCode ? ` · ${branchCode}` : ''}
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{title}</h1>
        <p className="text-white/80 text-sm max-w-xl font-medium">{description}</p>
      </div>
      {logoUrl && (
        <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-2xl p-2 border border-white/30 shadow-xl shrink-0 flex items-center justify-center">
          <img src={logoUrl} alt="School Logo" className="w-full h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  )
}

export function AdminDashboard({ user, activeSection = 'overview', branchStats: branchStatsProp, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<BranchStats | null>(branchStatsProp ?? null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(!branchStatsProp)

  const [students, setStudents] = useState<StudentRow[]>([])
  const [parents, setParents] = useState<ParentRow[]>([])
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [listError, setListError] = useState<string | null>(null)
  const [isLoadingList, setIsLoadingList] = useState(false)

  // Student promotion trigger state
  const [promotingStudent, setPromotingStudent] = useState<{ id: number; name: string; currentClass: string } | null>(null)

  // Teacher management modal states
  const [isOnboardOpen, setIsOnboardOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null)
  const [deactivatingTeacher, setDeactivatingTeacher] = useState<TeacherRow | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null)

  const handleToggleStudentStatus = async (studentId: number) => {
    setTogglingStatusId(studentId)
    try {
      await apiSlice.post(endpoints.admin.toggleStudentStatus(studentId), {})
      loadList()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status update failed.')
    } finally {
      setTogglingStatusId(null)
    }
  }

  const handleToggleTeacherStatus = async (teacherId: number) => {
    setTogglingStatusId(teacherId)
    try {
      await apiSlice.post(endpoints.admin.toggleTeacherStatus(teacherId), {})
      loadList()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status update failed.')
    } finally {
      setTogglingStatusId(null)
    }
  }

  const handleToggleStaffStatus = async (staffId: number) => {
    setTogglingStatusId(staffId)
    try {
      await apiSlice.post(endpoints.admin.toggleStaffStatus(staffId), {})
      loadList()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status update failed.')
    } finally {
      setTogglingStatusId(null)
    }
  }

  const handleDeactivateTeacher = async (teacherId: number) => {
    setIsDeactivating(true)
    try {
      await apiSlice.delete(endpoints.admin.deleteTeacher(teacherId))
      setDeactivatingTeacher(null)
      loadList()
      // Reload stats to reflect updated teacher count
      const res = await apiSlice.get<{ success: boolean; data: BranchStats }>(
        endpoints.admin.stats
      )
      setStats(res.data)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Deactivation failed.')
    } finally {
      setIsDeactivating(false)
    }
  }

  useEffect(() => {
    if (branchStatsProp) {
      setStats(branchStatsProp)
      setIsLoadingStats(false)
      return
    }

    let cancelled = false

    async function loadStats() {
      setIsLoadingStats(true)
      setStatsError(null)
      try {
        const res = await apiSlice.get<{ success: boolean; data: BranchStats }>(
          endpoints.admin.stats
        )
        if (!cancelled) setStats(res.data)
      } catch (err) {
        if (!cancelled) {
          setStatsError(err instanceof Error ? err.message : 'Failed to load branch stats')
        }
      } finally {
        if (!cancelled) setIsLoadingStats(false)
      }
    }

    loadStats()
    return () => { cancelled = true }
  }, [branchStatsProp])

  async function loadList() {
    setIsLoadingList(true)
    setListError(null)
    try {
      if (activeSection === 'students') {
        const res = await apiSlice.get<{
          success: boolean
          data: { students: StudentRow[]; parents: ParentRow[] }
        }>(endpoints.admin.studentsParents)
        setStudents(res.data.students)
        setParents(res.data.parents)
      } else if (activeSection === 'teachers') {
        const res = await apiSlice.get<{
          success: boolean
          data: { teachers: TeacherRow[]; staff: StaffRow[] }
        }>(endpoints.admin.teachersStaff)
        setTeachers(res.data.teachers)
        setStaff(res.data.staff)
      }
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load records')
    } finally {
      setIsLoadingList(false)
    }
  }

  useEffect(() => {
    if (activeSection !== 'students' && activeSection !== 'teachers') return
    loadList()
  }, [activeSection])

  const statCards = [
    {
      label: 'Students Enrolled',
      value: isLoadingStats ? '…' : formatCount(stats?.students ?? 0, 'Students'),
      icon: GraduationCap,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      label: 'Parents / Guardians',
      value: isLoadingStats ? '…' : formatCount(stats?.parents ?? 0, 'Registered'),
      icon: Users,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      label: 'Academic Staff',
      value: isLoadingStats ? '…' : formatCount(stats?.teachers ?? 0, 'Teachers'),
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Other Staff',
      value: isLoadingStats ? '…' : formatCount(stats?.staff ?? 0, 'Members'),
      icon: Briefcase,
      color: 'text-violet-600 bg-violet-50 border-violet-100',
    },
  ]

  if (activeSection === 'students') {
    return (
      <div className="space-y-8">
        <SectionBanner
          title="Students & Parents"
          description="Live enrolment and guardian records for this branch."
          branchName={stats?.branchName}
          branchCode={stats?.branchCode}
        />

        {listError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
            Could not load records: {listError}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Students</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {isLoadingList ? '…' : (stats?.students ?? students.length).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Parents / Guardians</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {isLoadingList ? '…' : (stats?.parents ?? parents.length).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm overflow-hidden">
          <h3 className="text-base font-extrabold text-slate-900 px-2 py-2">Students</h3>
          {isLoadingList ? (
            <div className="p-8 text-center text-slate-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No students enrolled in this branch yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg. No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.registerNo || '—'}</TableCell>
                    <TableCell className="font-bold">{[student.firstName, student.lastName].filter(Boolean).join(' ') || '—'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                        {student.className || 'Unassigned'}
                      </span>
                    </TableCell>
                    <TableCell>{student.gender || '—'}</TableCell>
                    <TableCell>{student.parentName || '—'}</TableCell>
                    <TableCell>{student.mobileno || '—'}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleStudentStatus(student.id)}
                        disabled={togglingStatusId === student.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer select-none ${
                          student.active !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                        }`}
                        title={student.active !== false ? "Click to suspend student" : "Click to activate student"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${student.active !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {student.active !== false ? 'Active' : 'Suspended'}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setPromotingStudent({
                          id: student.id,
                          name: `${student.firstName} ${student.lastName}`,
                          currentClass: student.className || 'Unassigned'
                        })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 font-bold text-xs transition cursor-pointer"
                      >
                        <TrendingUp size={12} /> Promote
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{students.length} student{students.length === 1 ? '' : 's'} in this branch.</TableCaption>
            </Table>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm overflow-hidden">
          <h3 className="text-base font-extrabold text-slate-900 px-2 py-2">Parents / Guardians</h3>
          {isLoadingList ? (
            <div className="p-8 text-center text-slate-500">Loading parents...</div>
          ) : parents.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No parents registered in this branch yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parents.map((parent) => (
                  <TableRow key={parent.id}>
                    <TableCell>{parent.name || '—'}</TableCell>
                    <TableCell>{parent.relation || '—'}</TableCell>
                    <TableCell>{parent.studentCount}</TableCell>
                    <TableCell>{parent.mobileno || '—'}</TableCell>
                    <TableCell>{parent.email || '—'}</TableCell>
                    <TableCell>{[parent.city, parent.state].filter(Boolean).join(', ') || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{parents.length} parent{parents.length === 1 ? '' : 's'} in this branch.</TableCaption>
            </Table>
          )}
        </div>

        {promotingStudent && (
          <StudentPromotionModal
            studentId={promotingStudent.id}
            studentName={promotingStudent.name}
            currentClass={promotingStudent.currentClass}
            onClose={() => setPromotingStudent(null)}
            onSuccess={() => {
              setPromotingStudent(null)
              loadList()
            }}
          />
        )}
      </div>
    )
  }

  if (activeSection === 'teachers' || activeSection === 'staff' || activeSection === 'staff-directory') {
    return <StaffDirectory />
  }

  if (activeSection === 'roles') {
    return <RoleManagement />
  }

  if (activeSection === 'timetable') {
    return <TimetableManager />
  }

  if (activeSection === 'curriculum') {
    return <BranchSetup />
  }

  if (activeSection === 'admissions') {
    return <StudentOnboarding />
  }

  if (activeSection === 'credentials') {
    return <IdProvisioning />
  }

  if (activeSection === 'finances') {
    return <FinancesDashboard />
  }

  if (activeSection === 'classrooms') {
    return <ClassroomStudents />
  }

  if (activeSection === 'commentary-review') {
    return <CommentaryReview />
  }

  if (activeSection === 'cbt-exams') {
    return <AdminCbtManager />
  }

  if (activeSection === 'exam-schedule') {
    return <ExamScheduleManager />
  }

  if (activeSection === 'exam-halls') {
    return <ExamHalls />
  }

  if (activeSection === 'evaluation-matrices') {
    return <EvaluationMatrices />
  }

  if (activeSection === 'marks-entry') {
    return <MarksEntry />
  }

  if (activeSection === 'attendance') {
    return <AttendanceManager />
  }

  if (activeSection === 'card-management') {
    return <CardManagement />
  }

  if (activeSection === 'leave-management') {
    return <HrLeaveManagement />
  }

  if (activeSection === 'promotions') {
    return <StudentPromotions />
  }

  if (activeSection === 'library') {
    return <LibraryManagement />
  }

  if (activeSection === 'comprehensive-reports') {
    return <ComprehensiveReports />
  }

  if (activeSection === 'inventory') {
    return <InventoryDashboard />
  }

  if (activeSection === 'settings') {
    return <BranchSettings />
  }

  if (activeSection === 'teacher-duties') {
    return <AdminTeacherDuties user={user} />
  }

  if (activeSection === 'staff-activities') {
    return <StaffActivitiesReport />
  }

  if (activeSection === 'parents' || activeSection === 'parent-directory') {
    return <ParentDirectory />
  }

  if (activeSection === 'departments' || activeSection === 'department-management') {
    return <DepartmentManagement />
  }

  if (activeSection === 'admissions') {
    return <AdmissionsManagement />
  }

  if (activeSection === 'curriculum' || activeSection === 'academics' || activeSection === 'academic-structure') {
    return <AcademicStructure />
  }

  if (activeSection === 'lesson-management' || activeSection === 'lessons') {
    return <LessonManagement />
  }

  if (activeSection === 'homework' || activeSection === 'homework-management') {
    return <HomeworkManagement />
  }

  if (activeSection === 'examinations-cbt' || activeSection === 'cbt' || activeSection === 'exams') {
    return <ExamCbtManagement />
  }

  if (activeSection === 'report-cards' || activeSection === 'reports-cards') {
    return <ReportCardManagement />
  }

  if (activeSection === 'timetable' || activeSection === 'timetable-manager') {
    return <TimetableManager />
  }

  if (activeSection === 'competitions' || activeSection === 'quizzes') {
    return <CompetitionsManagement />
  }

  if (activeSection === 'hr' || activeSection === 'human-resources' || activeSection === 'hr-management') {
    return <HrManagement />
  }

  if (activeSection === 'communication' || activeSection === 'educhat' || activeSection === 'communication-center') {
    return <CommunicationCenter />
  }

  if (activeSection === 'campus-live' || activeSection === 'live-classes' || activeSection === 'live') {
    return <CampusLiveManagement />
  }

  if (activeSection === 'myeduride' || activeSection === 'gate-manager' || activeSection === 'myeduride-integration') {
    return <MyEduRideIntegration />
  }

  if (activeSection === 'website' || activeSection === 'school-website' || activeSection === 'website-builder') {
    return <SchoolWebsiteManagement />
  }

  if (activeSection === 'financial-records' || activeSection === 'financial-ledger') {
    return <FinancialRecordsManagement />
  }

  if (activeSection === 'calendar') {
    return <SchoolCalendar user={user} />
  }

  const activities = [
    {
      user: 'Mrs. Adams',
      action: 'Generated report cards',
      time: '15 mins ago',
      color: 'bg-emerald-100 text-emerald-700',
      icon: Users,
    },
    {
      user: 'John Okafor',
      action: 'Paid school fees',
      time: '30 mins ago',
      color: 'bg-rose-100 text-rose-700',
      icon: CreditCard,
    },
    {
      user: 'Primary 4B',
      action: 'Attendance completed',
      time: '45 mins ago',
      color: 'bg-purple-100 text-purple-700',
      icon: CheckSquare,
    },
    {
      user: 'Mr. Williams',
      action: 'Uploaded lesson notes',
      time: '1 hour ago',
      color: 'bg-blue-100 text-blue-700',
      icon: BookOpen,
    },
    {
      user: 'Parent Meeting',
      action: 'Scheduled for tomorrow',
      time: '2 hours ago',
      color: 'bg-amber-100 text-amber-700',
      icon: Calendar,
    },
  ]

  const oseInsights = [
    'Three teachers have not submitted lesson notes.',
    'Twelve parents sent new messages.',
    'Attendance increased by 4% this week.',
    'Mathematics scores dropped in Primary Five.',
    'Thirty-two students have outstanding fees.',
  ]

  return (
    <div className="space-y-6">
      {/* 1. Good Morning Header Greeting Banner matching Reference Image */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#eef3fe] via-[#fbf3f6] to-[#fff8f0] border border-slate-200/70 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/90 border border-amber-200 flex items-center justify-center text-amber-500 text-2xl shadow-xs shrink-0">
            ☀️
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Good Morning, {user.username || 'Administrator'} 👋
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Welcome back to {stats?.branchName || 'your school'}! Here's what's happening today.
            </p>
          </div>
        </div>

        {/* Right Date and Time Widget */}
        <div className="bg-white/90 backdrop-blur-xs border border-rose-200/60 rounded-2xl px-4 py-2.5 flex items-center gap-4 text-xs shadow-2xs shrink-0 self-stretch md:self-auto justify-between md:justify-start">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Calendar size={16} className="text-rose-500" />
            <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-2 font-black text-slate-800">
            <Activity size={16} className="text-amber-500" />
            <span>8:00 AM</span>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards Row (6 horizontal cards wired to DB stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Students */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2 cursor-pointer hover:border-blue-300 transition" onClick={() => onNavigate?.('students')}>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Users size={18} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {stats ? stats.students.toLocaleString() : '1,245'}
            </span>
            <span className="text-xs font-bold text-slate-500">Students</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>↗ Live DB count</span>
          </div>
        </div>

        {/* Card 2: Teachers */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2 cursor-pointer hover:border-purple-300 transition" onClick={() => onNavigate?.('teachers')}>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <UserCheck size={18} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {stats ? stats.teachers.toLocaleString() : '96'}
            </span>
            <span className="text-xs font-bold text-slate-500">Teachers</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>↗ Live DB count</span>
          </div>
        </div>

        {/* Card 3: Parents */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2 cursor-pointer hover:border-emerald-300 transition" onClick={() => onNavigate?.('students')}>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Users size={18} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {stats ? stats.parents.toLocaleString() : '1,040'}
            </span>
            <span className="text-xs font-bold text-slate-500">Parents</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>↗ Live DB count</span>
          </div>
        </div>

        {/* Card 4: Classes */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2 cursor-pointer hover:border-amber-300 transition" onClick={() => onNavigate?.('classrooms')}>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <GraduationCap size={18} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {stats?.classes ? stats.classes.toLocaleString() : '38'}
            </span>
            <span className="text-xs font-bold text-slate-500">Classes</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>● All active</span>
          </div>
        </div>

        {/* Card 5: Subjects */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2 cursor-pointer hover:border-rose-300 transition" onClick={() => onNavigate?.('curriculum')}>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Briefcase size={18} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {stats?.subjects ? stats.subjects.toLocaleString() : '126'}
            </span>
            <span className="text-xs font-bold text-slate-500">Subjects</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>● All active</span>
          </div>
        </div>

        {/* Card 6: Fee Collected */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2 cursor-pointer hover:border-sky-300 transition" onClick={() => onNavigate?.('finances')}>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Activity size={18} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {stats?.feeCollected ? '₦' + (stats.feeCollected >= 1000000 ? (stats.feeCollected / 1000000).toFixed(1) + 'M' : stats.feeCollected.toLocaleString()) : '₦8.6M'}
            </span>
            <span className="text-xs font-bold text-slate-500">Fee Collected</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>● This term</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Analytical Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {/* Attendance Overview Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Attendance Overview</h3>
            <select className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 outline-none">
              <option>Today</option>
              <option>This Week</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 py-2">
            {/* Donut Progress Circle (94% Overall) */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray="94, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 leading-none">94%</span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5">Overall</span>
              </div>
            </div>

            {/* Legend Stats */}
            <div className="space-y-1.5 text-xs font-bold w-full">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Present</span>
                <span className="font-extrabold text-slate-900">{stats ? Math.round(stats.students * 0.94).toLocaleString() : '1,211'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Late</span>
                <span className="font-extrabold text-slate-900">18</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Absent</span>
                <span className="font-extrabold text-slate-900">22</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> Excused</span>
                <span className="font-extrabold text-slate-900">12</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <button onClick={() => onNavigate?.('attendance')} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer">
              View full attendance →
            </button>
          </div>
        </div>

        {/* Academic Performance Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Academic Performance (This Term)</h3>
            <button onClick={() => onNavigate?.('comprehensive-reports')} className="text-xs font-bold text-blue-600 hover:underline">View all</button>
          </div>

          <div className="space-y-2.5 text-xs font-bold py-1">
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>English</span>
                <span className="font-extrabold text-slate-900">78%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Mathematics</span>
                <span className="font-extrabold text-slate-900">68%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Science</span>
                <span className="font-extrabold text-slate-900">82%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: '82%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Social Studies</span>
                <span className="font-extrabold text-slate-900">71%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '71%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Computer Studies</span>
                <span className="font-extrabold text-slate-900">88%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <button onClick={() => onNavigate?.('comprehensive-reports')} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer">
              See performance analysis →
            </button>
          </div>
        </div>

        {/* School Fees Overview Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">School Fees Overview</h3>
            <select className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 outline-none">
              <option>This Term</option>
              <option>Annual</option>
            </select>
          </div>

          <div className="space-y-4 py-1">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-slate-500">Collected</span>
                <span className="text-sm font-black text-slate-900">
                  {stats?.feeCollected ? '₦' + stats.feeCollected.toLocaleString() : '₦8,600,000'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '77%' }} />
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 block text-right mt-0.5">77%</span>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-rose-500">Outstanding</span>
                <span className="text-sm font-black text-rose-600">
                  {stats?.feeOutstanding ? '₦' + stats.feeOutstanding.toLocaleString() : '₦2,400,000'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '23%' }} />
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 block text-right mt-0.5">23%</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-500 uppercase">Total Expected</span>
              <span className="text-sm font-black text-slate-900">
                {stats?.feeExpected ? '₦' + stats.feeExpected.toLocaleString() : '₦11,000,000'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <button onClick={() => onNavigate?.('finances')} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer">
              View fee collection →
            </button>
          </div>
        </div>

        {/* Upcoming Events Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Upcoming Events</h3>
            <button onClick={() => onNavigate?.('calendar')} className="text-xs font-bold text-blue-600 hover:underline">View Calendar</button>
          </div>

          <div className="space-y-3 py-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-black text-blue-700 leading-none">31</span>
                <span className="text-[9px] font-extrabold text-blue-500 uppercase">JUL</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Parent Meeting</h4>
                <p className="text-[11px] text-slate-500 truncate font-medium">Tomorrow, 10:00 AM</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-black text-purple-700 leading-none">01</span>
                <span className="text-[9px] font-extrabold text-purple-500 uppercase">AUG</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Sports Competition</h4>
                <p className="text-[11px] text-slate-500 truncate font-medium">Friday, 9:00 AM</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-black text-rose-700 leading-none">04</span>
                <span className="text-[9px] font-extrabold text-rose-500 uppercase">AUG</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">First CA Begins</h4>
                <p className="text-[11px] text-slate-500 truncate font-medium">Monday, 8:00 AM</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-black text-amber-700 leading-none">10</span>
                <span className="text-[9px] font-extrabold text-amber-500 uppercase">AUG</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Independence Day</h4>
                <p className="text-[11px] text-slate-500 truncate font-medium">Public Holiday</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <button onClick={() => onNavigate?.('calendar')} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer">
              See all events →
            </button>
          </div>
        </div>
      </div>

      {/* 4. Quick Actions Section (All wired to modules) */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900">Quick Actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          <button onClick={() => onNavigate?.('admissions')} className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 transition shadow-2xs group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Users size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">Add Student</span>
          </button>

          <button onClick={() => onNavigate?.('commentary-review')} className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 transition shadow-2xs group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <Activity size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">Scan Document</span>
          </button>

          <button onClick={() => onNavigate?.('curriculum')} className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 transition shadow-2xs group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">Lesson Notes</span>
          </button>

          <button onClick={() => onNavigate?.('cbt-exams')} className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 transition shadow-2xs group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <Briefcase size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">Create CBT</span>
          </button>

          <button onClick={() => onNavigate?.('marks-entry')} className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 transition shadow-2xs group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <CheckSquare size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">Record Scores</span>
          </button>

          <button onClick={() => onNavigate?.('communication')} className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 transition shadow-2xs group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Activity size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">Send Announcement</span>
          </button>

          <button onClick={() => onNavigate?.('comprehensive-reports')} className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 transition shadow-2xs group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">Generate Report</span>
          </button>

          <button onClick={() => onNavigate?.('calendar')} className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 transition shadow-2xs group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <Calendar size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">Schedule Meeting</span>
          </button>

          <button onClick={() => onNavigate?.('settings')} className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 transition shadow-2xs group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition">
              <span>•••</span>
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">More</span>
          </button>
        </div>
      </div>

      {/* 5. Bottom Grid Row 1 (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {/* Today's Classes Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Today's Classes</h3>
            <button onClick={() => onNavigate?.('timetable')} className="text-xs font-bold text-blue-600 hover:underline">View Timetable</button>
          </div>
          <div className="bg-blue-50/60 rounded-xl p-3 flex items-baseline justify-between border border-blue-100">
            <span className="text-2xl font-black text-slate-900">120</span>
            <span className="text-xs font-bold text-slate-500">Classes Scheduled</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <span className="text-emerald-600 font-extrabold">116 Started</span>
            <span className="text-slate-600 flex items-center gap-1">4 Pending 🕒</span>
          </div>
        </div>

        {/* Admissions Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Admissions</h3>
            <button onClick={() => onNavigate?.('admissions')} className="text-xs font-bold text-blue-600 hover:underline">View all</button>
          </div>
          <div className="bg-rose-50/60 rounded-xl p-3 flex items-baseline justify-between border border-rose-100">
            <span className="text-2xl font-black text-rose-600">
              {stats?.admissions ? stats.admissions.toLocaleString() : '56'}
            </span>
            <span className="text-xs font-bold text-slate-500">Applications</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <span className="text-emerald-600 font-extrabold">42 Approved</span>
            <span className="text-slate-600 flex items-center gap-1">14 Pending Review 🕒</span>
          </div>
        </div>

        {/* Inventory Status Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Inventory Status</h3>
            <button onClick={() => onNavigate?.('inventory')} className="text-xs font-bold text-blue-600 hover:underline">View all</button>
          </div>
          <div className="bg-amber-50/60 rounded-xl p-3 flex items-baseline justify-between border border-amber-100">
            <span className="text-2xl font-black text-amber-700">245</span>
            <span className="text-xs font-bold text-slate-500">Items in Stock</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <span className="text-slate-700 font-extrabold">18 Low Stock</span>
            <span className="text-slate-700 flex items-center gap-1">6 Out of Stock 📦</span>
          </div>
        </div>

        {/* MyEduRide Overview Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">MyEduRide Overview</h3>
            <button onClick={() => onNavigate?.('myeduride')} className="text-xs font-bold text-blue-600 hover:underline">View MyEduRide</button>
          </div>
          <div className="bg-sky-50/60 rounded-xl p-3 flex items-baseline justify-between border border-sky-100">
            <span className="text-2xl font-black text-sky-600">390</span>
            <span className="text-xs font-bold text-slate-500">Students Picked Up</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold pt-1 text-slate-700">
            <span>27 In Transit</span>
            <span>354 Arrived Home</span>
            <span className="text-slate-400">0 Incidents</span>
          </div>
        </div>
      </div>

      {/* 6. Bottom Grid Row 2 (2 Columns: Recent Activity + OSe Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3 Column: Recent Activity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {activities.map((act, idx) => {
              const IconComp = act.icon
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 transition hover:bg-slate-100/60">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${act.color} flex items-center justify-center shrink-0`}>
                      <IconComp size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{act.user}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{act.action}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{act.time}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right 1/3 Column: OSe Insights */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <span>OSe Insights</span>
            </h3>
            <button onClick={() => onNavigate?.('settings')} className="text-xs font-bold text-blue-600 hover:underline">Ask OSe</button>
          </div>
          <div className="space-y-2.5 py-1">
            {oseInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 text-xs font-semibold text-slate-700 leading-relaxed">
                <span className="text-sm shrink-0">🤖</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

