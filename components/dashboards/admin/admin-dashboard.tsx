'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  GraduationCap, 
  UserCheck,
  Briefcase,
  Activity 
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

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
    <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-60" />
      </div>
      <div className="relative z-10 space-y-2.5">
        <span className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-full border border-blue-100 shadow-sm inline-block">
          {branchName || 'Branch Admin'}
          {branchCode ? ` · ${branchCode}` : ''}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-slate-500 text-sm max-w-xl font-medium">{description}</p>
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

  useEffect(() => {
    if (activeSection !== 'students' && activeSection !== 'teachers') return

    let cancelled = false

    async function loadList() {
      setIsLoadingList(true)
      setListError(null)
      try {
        if (activeSection === 'students') {
          const res = await apiSlice.get<{
            success: boolean
            data: { students: StudentRow[]; parents: ParentRow[] }
          }>(endpoints.admin.studentsParents)
          if (!cancelled) {
            setStudents(res.data.students)
            setParents(res.data.parents)
          }
        } else {
          const res = await apiSlice.get<{
            success: boolean
            data: { teachers: TeacherRow[]; staff: StaffRow[] }
          }>(endpoints.admin.teachersStaff)
          if (!cancelled) {
            setTeachers(res.data.teachers)
            setStaff(res.data.staff)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setListError(err instanceof Error ? err.message : 'Failed to load records')
        }
      } finally {
        if (!cancelled) setIsLoadingList(false)
      }
    }

    loadList()
    return () => { cancelled = true }
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
                  <TableHead>Gender</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.registerNo || '—'}</TableCell>
                    <TableCell>{[student.firstName, student.lastName].filter(Boolean).join(' ') || '—'}</TableCell>
                    <TableCell>{student.gender || '—'}</TableCell>
                    <TableCell>{student.parentName || '—'}</TableCell>
                    <TableCell>{student.mobileno || '—'}</TableCell>
                    <TableCell>{student.email || '—'}</TableCell>
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
          <h3 className="text-base font-extrabold text-slate-900 px-2 py-2">Teachers</h3>
          {isLoadingList ? (
            <div className="p-8 text-center text-slate-500">Loading teachers...</div>
          ) : teachers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No teachers assigned to this branch yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Class Allocations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.name}</TableCell>
                    <TableCell>{teacher.email || '—'}</TableCell>
                    <TableCell>{teacher.phone || '—'}</TableCell>
                    <TableCell>{teacher.classCount}</TableCell>
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
      </div>
    )
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
