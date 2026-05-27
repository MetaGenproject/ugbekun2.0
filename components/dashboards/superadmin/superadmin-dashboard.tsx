'use client'

import { useState } from 'react'
import { 
  School, 
  Users, 
  DollarSign, 
  Shield, 
  Activity, 
  Cpu, 
  Database, 
  Layers, 
  RefreshCw 
} from 'lucide-react'
import { AddSchoolForm } from './add-school-form'

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
  }
}

export function SuperAdminDashboard({ user }: DashboardProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)

  const stats = [
    { label: 'Active Tenant Branches', value: '18 Branches', icon: School, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { label: 'Platform Users Count', value: '12,840 Total', icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { label: 'Monthly SaaS Revenue', value: '$84,250', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: 'System Health Check', value: '100% Online', icon: Shield, color: 'text-amber-600 bg-amber-50 border-amber-100' }
  ]

  const activities = [
    { desc: 'New School Tenant "Divine Grace Academy" migrated successfully', time: '15 mins ago' },
    { desc: 'Global database query performance optimizations applied', time: '2 hours ago' },
    { desc: 'Superadmin "master" performed ETL sync validation check', time: '4 hours ago' }
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
            SaaS Platform Superadmin
          </h1>
          <p className="text-slate-500 text-sm max-w-xl font-medium">
            Role 1 · Single master account — global control across all Ugbekun school tenants.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-extrabold text-sm shadow-sm shadow-blue-500/20"
        >
          Add School / Branch
        </button>
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

      {/* Activities & Health */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm lg:col-span-2">
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

        {/* Health Diagnostic */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-indigo-600" />
            <h3 className="text-base font-extrabold text-slate-900">SaaS System Health</h3>
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Connection Link Statuses</p>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <Database size={16} className="text-blue-500" />
                Postgres Link
              </div>
              <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">Online</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <Layers size={16} className="text-violet-500" />
                Redis Caching
              </div>
              <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">Connected</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <RefreshCw size={16} className="text-amber-500 animate-spin" />
                ETL Scheduler
              </div>
              <span className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border-blue-100 rounded-full shadow-sm">Active</span>
            </div>
          </div>
        </div>
      </div>

      {isAddOpen && (
        <AddSchoolForm
          onClose={() => setIsAddOpen(false)}
        />
      )}
    </div>
  )
}
