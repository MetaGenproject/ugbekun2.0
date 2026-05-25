'use client'

import { 
  BookOpen, 
  CheckSquare, 
  TrendingUp, 
  Calendar, 
  Activity 
} from 'lucide-react'

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
  }
}

export function StudentDashboard({ user }: DashboardProps) {
  const stats = [
    { label: 'Enrolled Courses', value: '7 Subjects', icon: BookOpen, color: 'text-violet-600 bg-violet-50 border-violet-100' },
    { label: 'Attendance Counter', value: '98.2% Present', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: 'Semester Grade Average', value: '3.82 GPA', icon: TrendingUp, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { label: 'Next Lecture Class', value: 'Chemistry (10:30 AM)', icon: Calendar, color: 'text-amber-600 bg-amber-50 border-amber-100' }
  ]

  const activities = [
    { desc: 'Submitted Grade 11 Chemistry laboratory workbook', time: '1 hour ago' },
    { desc: 'Finished short online history test on Colonial Era', time: 'Yesterday' },
    { desc: 'Math worksheet review notes uploaded by Mr. Davies', time: '2 days ago' }
  ]

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 space-y-2.5">
          <span className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-full border border-blue-100 shadow-sm inline-block">
            Academic Year 2026
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Learning Workspace
          </h1>
          <p className="text-slate-500 text-sm max-w-xl font-medium">
            Access study guides, attendance trackers, assignments, and test schedules.
          </p>
        </div>
      </div>

      {/* Stats */}
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

      {/* Activities */}
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
