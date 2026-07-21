'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '../../../lib/apiSlice'
import { TeacherDashboard } from '../../dashboards/teacher/teacher-dashboard'
import { GraduationCap, AlertCircle, Play, ShieldAlert, ArrowLeft } from 'lucide-react'

interface TeacherOption {
  id: number
  name: string
  email: string | null
  classCount: number
}

export function AdminTeacherDuties({ user }: { user: { id: number; username: string; role: number } }) {
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Impersonation state
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('')
  const [teacherActiveTab, setTeacherActiveTab] = useState<string>('classroom')

  useEffect(() => {
    // Check if there is already an impersonated teacher in local storage
    const storedTeacherId = localStorage.getItem('ugbekun_admin_impersonated_teacher_id')
    const storedTeacherName = localStorage.getItem('ugbekun_admin_impersonated_teacher_name')
    if (storedTeacherId && storedTeacherName) {
      setSelectedTeacherId(Number(storedTeacherId))
      setSelectedTeacherName(storedTeacherName)
    }

    async function loadTeachers() {
      try {
        const res = await apiSlice.get<{
          success: boolean
          data: { teachers: TeacherOption[] }
        }>(endpoints.admin.teachersStaff)
        if (res.success && res.data.teachers) {
          setTeachers(res.data.teachers)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teachers list.')
      } finally {
        setLoading(false)
      }
    }
    loadTeachers()
  }, [])

  const handleStartImpersonation = (id: number, name: string) => {
    localStorage.setItem('ugbekun_admin_impersonated_teacher_id', id.toString())
    localStorage.setItem('ugbekun_admin_impersonated_teacher_name', name)
    setSelectedTeacherId(id)
    setSelectedTeacherName(name)
    setTeacherActiveTab('classroom')
    // Trigger storage event so that api headers update
    window.dispatchEvent(new Event('storage'))
  }

  const handleStopImpersonation = () => {
    localStorage.removeItem('ugbekun_admin_impersonated_teacher_id')
    localStorage.removeItem('ugbekun_admin_impersonated_teacher_name')
    setSelectedTeacherId(null)
    setSelectedTeacherName('')
    window.dispatchEvent(new Event('storage'))
  }

  if (selectedTeacherId) {
    const fakeTeacherUser = {
      id: selectedTeacherId,
      username: selectedTeacherName,
      role: 3 // treat as teacher
    }

    return (
      <div className="space-y-6">
        {/* Impersonation Control Banner */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-sm shadow-amber-600/20 shrink-0">
              <ShieldAlert size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-amber-900 flex items-center gap-1.5">
                Admin Impersonation Override Active
              </h2>
              <p className="text-xs text-amber-700 font-semibold mt-0.5">
                Currently acting as teacher <strong className="text-amber-950 font-black">{selectedTeacherName}</strong>. All logs and entry credentials will reference this teacher profile.
              </p>
            </div>
          </div>
          
          <button
            onClick={handleStopImpersonation}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-600/10 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <ArrowLeft size={14} className="stroke-[2.5]" /> Stop Impersonation
          </button>
        </div>

        {/* Horizontal Navigation for Teacher Duties */}
        <div className="border-b border-slate-200 bg-white rounded-xl shadow-sm p-2 flex flex-wrap gap-1">
          {[
            { id: 'classroom', label: 'My Classroom' },
            { id: 'grades', label: 'Gradebook & Exams' },
            { id: 'attendance', label: 'Attendance Tracker' },
            { id: 'roster', label: 'Student Roster' },
            { id: 'points-hub', label: 'Points Hub & XP' },
            { id: 'attrition', label: 'Attrition Radar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTeacherActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                teacherActiveTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Embedded Teacher Dashboard */}
        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/50 p-1">
          <TeacherDashboard user={fakeTeacherUser} activeSection={teacherActiveTab} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e293b] p-6 md:p-8 shadow-md overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="relative z-10 space-y-2.5">
          <span className="px-2.5 py-1 text-xs font-bold text-slate-300 bg-white/10 rounded-full border border-white/20 shadow-sm inline-block">
            Elevated Access Panel
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Teacher Duties Impersonation</h1>
          <p className="text-slate-300/80 text-sm max-w-xl font-medium">
            Select any teacher assigned to this branch to perform classroom tasks on their behalf, such as writing commentaries, marking attendance registers, or submitting grade sheets.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <GraduationCap size={18} className="text-blue-600" />
          Select a Teacher to Impersonate
        </h3>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-400 text-xs font-bold">Fetching teachers directory...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm font-semibold">
            No teachers are currently onboarded in this branch.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="p-5 border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition duration-300 flex flex-col justify-between gap-4 bg-slate-50/50 group"
              >
                <div className="space-y-1.5">
                  <h4 className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                    {teacher.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">{teacher.email || 'No email provided'}</p>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-full inline-block">
                    {teacher.classCount} class allocation{teacher.classCount === 1 ? '' : 's'}
                  </span>
                </div>

                <button
                  onClick={() => handleStartImpersonation(teacher.id, teacher.name)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-600/5 hover:shadow-blue-600/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play size={12} className="fill-current stroke-0" />
                  Impersonate Teacher
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
