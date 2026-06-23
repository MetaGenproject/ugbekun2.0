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
  Edit2
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

export interface BranchStats {
  branchId: number
  branchName: string
  branchCode?: string | null
  students: number
  parents: number
  teachers: number
  staff: number
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
}

interface TeacherRow {
  id: number
  name: string
  email: string | null
  phone: string | null
  classCount: number
}

interface StaffRow {
  id: number
  username: string
  role: number
  roleLabel: string
  lastLogin: string | null
}

function formatCount(value: number, label: string) {
  return `${value.toLocaleString()} ${label}`
}

function SectionBanner({
  title,
  description,
  branchName,
  branchCode,
}: {
  title: string
  description: string
  branchName?: string
  branchCode?: string | null
}) {
  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-[#003da5] via-[#0063a6] to-[#009ca6] p-6 md:p-8 shadow-md overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
      </div>
      <div className="relative z-10 space-y-2.5">
        <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block">
          {branchName || 'Branch Admin'}
          {branchCode ? ` · ${branchCode}` : ''}
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{title}</h1>
        <p className="text-white/80 text-sm max-w-xl font-medium">{description}</p>
      </div>
    </div>
  )
}

export function AdminDashboard({ user, activeSection = 'overview', branchStats: branchStatsProp }: DashboardProps) {
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

  if (activeSection === 'teachers') {
    return (
      <div className="space-y-8">
        <SectionBanner
          title="Teachers & Staff"
          description="Academic staff and other branch personnel from live database records."
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Teachers</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {isLoadingList ? '…' : (stats?.teachers ?? teachers.length).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Other Staff</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {isLoadingList ? '…' : (stats?.staff ?? staff.length).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-2 py-2 border-b border-slate-100 mb-2">
            <h3 className="text-base font-extrabold text-slate-900">Teachers</h3>
            <button
              onClick={() => setIsOnboardOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs transition cursor-pointer active:scale-[0.98]"
            >
              <UserPlus size={14} /> Onboard Teacher
            </button>
          </div>
          {isLoadingList ? (
            <div className="p-8 text-center text-slate-500">Loading teachers...</div>
          ) : teachers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No teachers assigned to this branch yet.</p>
              <button
                onClick={() => setIsOnboardOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs transition cursor-pointer"
              >
                <UserPlus size={14} /> Onboard First Teacher
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Class Allocations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-semibold text-slate-800">{teacher.name}</TableCell>
                    <TableCell>{teacher.email || '—'}</TableCell>
                    <TableCell>{teacher.phone || '—'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {teacher.classCount} {teacher.classCount === 1 ? 'class' : 'classes'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingTeacher(teacher)
                            setIsEditOpen(true)
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => setDeactivatingTeacher(teacher)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 font-bold text-xs transition cursor-pointer"
                          title="Deactivate Teacher"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{teachers.length} teacher{teachers.length === 1 ? '' : 's'} in this branch.</TableCaption>
            </Table>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm overflow-hidden">
          <h3 className="text-base font-extrabold text-slate-900 px-2 py-2">Other Staff</h3>
          {isLoadingList ? (
            <div className="p-8 text-center text-slate-500">Loading staff...</div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No other staff linked to this branch yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.username}</TableCell>
                    <TableCell>{member.roleLabel}</TableCell>
                    <TableCell>
                      {member.lastLogin
                        ? new Date(member.lastLogin).toLocaleDateString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{staff.length} staff member{staff.length === 1 ? '' : 's'} in this branch.</TableCaption>
            </Table>
          )}
        </div>

        <TeacherOnboardingModal
          isOpen={isOnboardOpen}
          onClose={() => setIsOnboardOpen(false)}
          onSuccess={() => {
            loadList()
          }}
        />

        <EditTeacherModal
          isOpen={isEditOpen}
          teacher={editingTeacher}
          onClose={() => {
            setIsEditOpen(false)
            setEditingTeacher(null)
          }}
          onSuccess={() => {
            loadList()
          }}
        />

        {/* Deactivation Confirmation Modal */}
        {deactivatingTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-200">
              <h3 className="text-base font-black text-slate-900">Deactivate Teacher?</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Are you sure you want to deactivate <strong>{deactivatingTeacher.name}</strong>?
                This will immediately block their login and portal access. Historical grading records and notes will be preserved.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeactivatingTeacher(null)}
                  disabled={isDeactivating}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeactivateTeacher(deactivatingTeacher.id)}
                  disabled={isDeactivating}
                  className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
                >
                  {isDeactivating ? 'Deactivating...' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (activeSection === 'curriculum') {
    return <BranchSetup />
  }

  if (activeSection === 'admissions') {
    return <StudentOnboarding />
  }

  const activities = [
    {
      desc: stats
        ? `Branch "${stats.branchName}" overview loaded for admin ${user.username}`
        : `Branch admin "${user.username}" viewing dashboard`,
      time: 'Now',
    },
    {
      desc: 'Student, parent, teacher and staff totals are scoped to this branch only',
      time: 'Live',
    },
  ]

  return (
    <div className="space-y-8">
      <SectionBanner
        title={stats?.branchName || 'School Administration Panel'}
        description={`Role 2 · Branch-level controls — registrations, accounting, staff and curriculum tools.${stats?.branchCode ? ` · ${stats.branchCode}` : ''}`}
        branchName="Academic Year 2026"
      />

      {statsError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
          Could not load branch stats: {statsError}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => {
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
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm lg:col-span-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900">Recent Platform Activities</h3>
          </div>
          <div className="space-y-3.5">
            {activities.map((act, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm hover:bg-slate-100/50 transition">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="flex-1 flex flex-col sm:flex-row sm:justify-between gap-1.5">
                  <p className="text-sm font-semibold text-slate-700">{act.desc}</p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
