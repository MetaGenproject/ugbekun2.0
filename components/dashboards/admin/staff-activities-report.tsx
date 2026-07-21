'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '../../../lib/apiSlice'
import { Activity, AlertCircle, RefreshCw, Search, Calendar, User, Shield } from 'lucide-react'

interface ActivityItem {
  id: string
  type: string
  category: string
  description: string
  staffName: string
  staffRole: string
  timestamp: string
}

export function StaffActivitiesReport() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const fetchActivities = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; activities: ActivityItem[] }>(
        endpoints.admin.staffActivities
      )
      if (res.success && res.activities) {
        setActivities(res.activities)
      } else {
        setError('Failed to fetch activity records.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching activities.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  // Filter activities
  const filtered = activities.filter((act) => {
    const matchesSearch =
      act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.staffName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole =
      selectedRole === 'All' ||
      act.staffRole.toLowerCase().includes(selectedRole.toLowerCase())

    const matchesCategory =
      selectedCategory === 'All' ||
      act.category === selectedCategory

    return matchesSearch && matchesRole && matchesCategory
  })

  // Format type badges
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'LESSON_PLAN':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'COMMENTARY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'IDCARD':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'CERTIFICATE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'INVOICE':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'PAYMENT':
        return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'ATTENDANCE':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'MARKS':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#003da5] via-[#0063a6] to-[#009ca6] p-6 md:p-8 shadow-md overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 space-y-2.5">
          <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block">
            Administrative Audit Report
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Staff Activity Logs</h1>
          <p className="text-white/80 text-sm max-w-xl font-medium">
            Review live action logs and audit records of teachers, finance staff, and school administrators within this branch.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600" />
          {error}
        </div>
      )}

      {/* Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by staff name or action details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              >
                <option value="All">All Staff Roles</option>
                <option value="Teacher">Teachers</option>
                <option value="Admin">Admin/Staff</option>
                <option value="Collector">Finance / Accountants</option>
              </select>
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              >
                <option value="All">All Categories</option>
                <option value="Instructional">Instructional</option>
                <option value="Academic Grading">Academic Grading</option>
                <option value="Academic Remarks">Academic Remarks</option>
                <option value="Administration">Administration</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <button
              onClick={fetchActivities}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Reload Logs
            </button>
          </div>
        </div>
      </div>

      {/* Activity Timeline Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-400 text-xs font-bold">Compiling audit records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-sm font-semibold">
            No activity matches the selected filters.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-8">
            {filtered.map((act) => (
              <div key={act.id} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-white border-4 border-blue-500 group-hover:border-blue-600 shadow-sm transition" />
                
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition duration-300 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getTypeBadge(act.type)}`}>
                        {act.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {act.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-800 leading-relaxed">
                    {act.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1 text-slate-600 font-black">
                      <User size={13} className="text-blue-500" />
                      {act.staffName}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <Shield size={12} />
                      {act.staffRole}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
