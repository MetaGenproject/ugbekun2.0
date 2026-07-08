'use client'

import { useEffect, useState } from 'react'
import { 
  School, 
  Users, 
  GraduationCap, 
  UserCheck,
  Activity, 
  Cpu, 
  Database, 
  Layers, 
  RefreshCw,
  Pencil,
  Trash2,
  FileSpreadsheet,
  FileText,
  Loader2,
  DollarSign,
  Calendar,
  Plus,
  Check,
  AlertCircle,
  Clock,
  Settings,
  TrendingUp,
} from 'lucide-react'
import { AddSchoolForm } from './add-school-form'
import { EditBranchForm, type BranchDetails } from './edit-branch-form'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

// Import Recharts components for beautiful charts
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
  }
  activeSection?: string
}

interface PlatformStats {
  branches: number
  activeBranches: number
  students: number
  teachers: number
  parents: number
  users: number
}

interface AnalyticsData {
  branchEnrollments: { name: string; studentsCount: number }[]
  planDistribution: { name: string; activeSubscriptions: number; revenue: number }[]
  expirationStats: { name: string; count: number; color: string }[]
}

interface SubscriptionDetail {
  branchId: number
  branchName: string
  branchCode: string
  branchActive: boolean
  latestSubscription: {
    id: number
    startDate: string
    expiryDate: string
    totalCost: number
    paymentStatus: string
    planName: string
    planSlug: string
    planId: number
  } | null
}

interface SubscriptionPlan {
  id: number
  name: string
  slug: string
  priceMonthly: number
  durationMonths: number
  totalCost: number
  currency: string
}

interface AcademicSession {
  id: number
  schoolYear: string
  createdBy: number
  createdAt: string
}

function formatCount(value: number, label: string) {
  return `${value.toLocaleString()} ${label}`
}

const COLORS = ['#2563eb', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6']

export function SuperAdminDashboard({ user, activeSection: activeSectionProp }: DashboardProps) {
  const [mounted, setMounted] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const [branches, setBranches] = useState<BranchDetails[]>([])
  const [branchesError, setBranchesError] = useState<string | null>(null)
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)
  const [editingBranch, setEditingBranch] = useState<BranchDetails | null>(null)
  const [deletingBranch, setDeletingBranch] = useState<BranchDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  // Subscriptions State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionDetail[]>([])
  const [isLoadingSubs, setIsLoadingSubs] = useState(false)
  const [subsError, setSubsError] = useState<string | null>(null)

  // Renewal Form State
  const [renewingBranch, setRenewingBranch] = useState<SubscriptionDetail | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid')
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false)
  const [renewError, setRenewError] = useState<string | null>(null)

  // Extension Form State
  const [extendingBranch, setExtendingBranch] = useState<SubscriptionDetail | null>(null)
  const [extensionDays, setExtensionDays] = useState<string>('7')
  const [extensionReason, setExtensionReason] = useState<string>('')
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false)
  const [extensionError, setExtensionError] = useState<string | null>(null)

  // Sessions State
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [newSessionName, setNewSessionName] = useState('')
  const [isSubmittingSession, setIsSubmittingSession] = useState(false)
  const [sessionActionError, setSessionActionError] = useState<string | null>(null)

  const activeSection = activeSectionProp || 'overview'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync data loaders based on activeSection
  useEffect(() => {
    if (activeSection === 'overview') {
      loadStats()
      loadAnalytics()
    } else if (activeSection === 'manage-branches') {
      refreshBranches()
    } else if (activeSection === 'subscriptions') {
      loadSubscriptions()
    } else if (activeSection === 'settings') {
      loadSessions()
    }
  }, [activeSection])

  const refreshBranches = async () => {
    setIsLoadingBranches(true)
    setBranchesError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; data: BranchDetails[] }>(
        endpoints.superadmin.branches
      )
      setBranches(res.data || [])
    } catch (err) {
      setBranchesError(err instanceof Error ? err.message : 'Failed to load branch list')
    } finally {
      setIsLoadingBranches(false)
    }
  }

  const loadStats = async () => {
    setIsLoadingStats(true)
    setStatsError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; data: PlatformStats }>(
        endpoints.superadmin.stats
      )
      setStats(res.data)
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setIsLoadingStats(false)
    }
  }

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true)
    setAnalyticsError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; data: AnalyticsData }>(
        endpoints.superadmin.analytics
      )
      setAnalytics(res.data)
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  const loadSubscriptions = async () => {
    setIsLoadingSubs(true)
    setSubsError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; data: { plans: SubscriptionPlan[]; subscriptions: SubscriptionDetail[] } }>(
        endpoints.superadmin.subscriptions
      )
      setPlans(res.data.plans || [])
      setSubscriptions(res.data.subscriptions || [])
    } catch (err) {
      setSubsError(err instanceof Error ? err.message : 'Failed to load subscriptions')
    } finally {
      setIsLoadingSubs(false)
    }
  }

  const loadSessions = async () => {
    setIsLoadingSessions(true)
    setSessionsError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; data: { sessions: AcademicSession[]; activeSessionId: number | null } }>(
        endpoints.superadmin.sessions
      )
      setSessions(res.data.sessions || [])
      setActiveSessionId(res.data.activeSessionId)
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Failed to load academic sessions')
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const handleRenewSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renewingBranch || !selectedPlanId) return
    setIsSubmittingRenewal(true)
    setRenewError(null)
    setActionMessage(null)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.superadmin.renewSubscription(renewingBranch.branchId),
        {
          planId: Number(selectedPlanId),
          paymentStatus,
        }
      )
      setActionMessage(res.message || 'Subscription renewed successfully.')
      setRenewingBranch(null)
      setSelectedPlanId('')
      loadSubscriptions()
    } catch (err) {
      setRenewError(err instanceof Error ? err.message : 'Failed to renew subscription')
    } finally {
      setIsSubmittingRenewal(false)
    }
  }

  const handleExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!extendingBranch || !extensionDays) return
    setIsSubmittingExtension(true)
    setExtensionError(null)
    setActionMessage(null)
    try {
      const daysNum = Number(extensionDays)
      if (isNaN(daysNum) || daysNum < 1 || daysNum > 30) {
        throw new Error('Please enter a number of days between 1 and 30.')
      }
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.superadmin.extendSubscription(extendingBranch.branchId),
        {
          days: daysNum,
          reason: extensionReason,
        }
      )
      setActionMessage(res.message || 'Subscription extended successfully.')
      setExtendingBranch(null)
      setExtensionDays('7')
      setExtensionReason('')
      loadSubscriptions()
    } catch (err) {
      setExtensionError(err instanceof Error ? err.message : 'Failed to extend subscription')
    } finally {
      setIsSubmittingExtension(false)
    }
  }

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSessionName.trim()) return
    setIsSubmittingSession(true)
    setSessionActionError(null)
    setActionMessage(null)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string; data: AcademicSession }>(
        endpoints.superadmin.sessions,
        {
          schoolYear: newSessionName,
        }
      )
      setActionMessage(res.message || 'Academic session created.')
      setNewSessionName('')
      await loadSessions()
    } catch (err) {
      setSessionActionError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setIsSubmittingSession(false)
    }
  }

  const handleSetActiveSession = async (sessionId: number) => {
    setSessionsError(null)
    setActionMessage(null)
    try {
      const res = await apiSlice.put<{ success: boolean; message: string }>(
        endpoints.superadmin.setActiveSession,
        {
          sessionId,
        }
      )
      setActionMessage(res.message || 'Active session updated.')
      setActiveSessionId(sessionId)
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Failed to update active session')
    }
  }

  const handleDeleteBranch = async () => {
    if (!deletingBranch) return
    setIsDeleting(true)
    setActionMessage(null)
    try {
      const res = await apiSlice.delete<{ success: boolean; message: string }>(
        endpoints.superadmin.branch(deletingBranch.id)
      )
      setActionMessage(res.message || 'Branch deleted.')
      setDeletingBranch(null)
      await refreshBranches()
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to delete branch')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(format)
    setActionMessage(null)
    try {
      const stamp = new Date().toISOString().slice(0, 10)
      if (format === 'csv') {
        await apiSlice.download(endpoints.superadmin.exportCsv, `ugbekun-branches-${stamp}.csv`)
      } else {
        await apiSlice.download(endpoints.superadmin.exportPdf, `ugbekun-branches-${stamp}.pdf`)
      }
      setActionMessage(`Branch list exported as ${format.toUpperCase()}.`)
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : `Failed to export ${format.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  const statCards = [
    {
      label: 'Tenant Branches',
      value: isLoadingStats ? '…' : formatCount(stats?.activeBranches ?? 0, 'Active'),
      sub: stats ? `${stats.branches.toLocaleString()} total` : null,
      icon: School,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      label: 'Students',
      value: isLoadingStats ? '…' : formatCount(stats?.students ?? 0, 'Enrolled'),
      icon: GraduationCap,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      label: 'Teachers',
      value: isLoadingStats ? '…' : formatCount(stats?.teachers ?? 0, 'Active'),
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Parents / Guardians',
      value: isLoadingStats ? '…' : formatCount(stats?.parents ?? 0, 'Registered'),
      sub: stats ? `${stats.users.toLocaleString()} platform logins` : null,
      icon: Users,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ]

  const activities = [
    { desc: 'Legacy branch, student, teacher and parent data imported from ugbekunc_Saas SQL dumps', time: 'Synced' },
    { desc: `Superadmin "${user.username}" viewing live platform statistics`, time: 'Now' },
    { desc: 'Global database query performance optimizations applied', time: '2 hours ago' },
  ]

  // Render Days Remaining Badge
  const getDaysRemainingBadge = (expiryDateStr: string | undefined) => {
    if (!expiryDateStr) return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-700">No Sub</span>
    
    const expiry = new Date(expiryDateStr)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
          <AlertCircle size={12} /> Expired ({Math.abs(diffDays)}d ago)
        </span>
      )
    } else if (diffDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
          <Clock size={12} /> Expiring soon ({diffDays}d left)
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <Check size={12} /> Active ({diffDays}d left)
        </span>
      )
    }
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#003da5] via-[#0063a6] to-[#009ca6] p-6 md:p-8 shadow-md overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 space-y-2.5">
          <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block">
            Academic Year 2026
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            SaaS Platform Superadmin
          </h1>
          <p className="text-white/80 text-sm max-w-xl font-medium">
            Role 1 · Single master account — global control across all Ugbekun school tenants.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 font-semibold flex items-center gap-2">
          <Check size={16} className="text-blue-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* RENDER ACTIVE SECTION */}

      {activeSection === 'overview' && (
        <>
          {statsError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
              Could not load live stats: {statsError}.
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-extrabold text-sm shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              Add School / Branch
            </button>
          </div>

          {/* Stats Cards */}
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
                    {stat.sub && (
                      <p className="text-[11px] font-semibold text-slate-400">{stat.sub}</p>
                    )}
                  </div>
                  <div className={`p-3.5 rounded-xl border ${stat.color} transition duration-300 group-hover:scale-105 shadow-sm`}>
                    <IconComp size={20} className="stroke-[2.5]" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Premium Recharts Section */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Enrollment by Branch (Pie Chart) */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">Branch Student Distribution</h3>
                <span className="text-xs text-slate-400 font-semibold">Live Enrollment</span>
              </div>
              
              {isLoadingAnalytics ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading distribution data...</div>
              ) : analyticsError ? (
                <div className="h-64 flex items-center justify-center text-rose-500 text-sm">{analyticsError}</div>
              ) : analytics?.branchEnrollments.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No branches enrolled yet</div>
              ) : mounted && analytics ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.branchEnrollments}
                        dataKey="studentsCount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {analytics.branchEnrollments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Students`, 'Enrollment']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>

            {/* Subscriptions Revenue by Plan (Dual Bar Chart) */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">SaaS Revenue by Plan</h3>
                <span className="text-xs text-slate-400 font-semibold">Active Subscriptions</span>
              </div>

              {isLoadingAnalytics ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading plan data...</div>
              ) : analyticsError ? (
                <div className="h-64 flex items-center justify-center text-rose-500 text-sm">{analyticsError}</div>
              ) : mounted && analytics ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.planDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#2563eb" fontSize={12} tickLine={false} label={{ value: 'Branches', angle: -90, position: 'insideLeft', fill: '#2563eb' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickLine={false} label={{ value: 'Revenue (₦)', angle: 90, position: 'insideRight', fill: '#10b981' }} />
                      <Tooltip formatter={(value, name) => [name === 'revenue' ? `₦${Number(value).toLocaleString()}` : value, name === 'revenue' ? 'Total Revenue' : 'Active Branches']} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="activeSubscriptions" name="Active Branches" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>

            {/* Subscriptions Expiration Status (Horizontal Bar Chart) */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">Branch Subscriptions Expiration Status</h3>
                <span className="text-xs text-slate-400 font-semibold">Renewal Pipeline</span>
              </div>

              {isLoadingAnalytics ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading pipeline...</div>
              ) : analyticsError ? (
                <div className="h-48 flex items-center justify-center text-rose-500 text-sm">{analyticsError}</div>
              ) : mounted && analytics ? (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={analytics.expirationStats} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip formatter={(value) => [`${value} Branches`, 'Count']} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {analytics.expirationStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>
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
                    <RefreshCw size={16} className="text-amber-500" />
                    ETL Scheduler
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border-blue-100 rounded-full shadow-sm">Active</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'manage-branches' && (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Manage Branches</h2>
              <p className="text-sm text-slate-500">Browse, edit, export, or remove tenant school branches.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting !== null || branches.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-semibold text-sm transition cursor-pointer"
              >
                {exporting === 'csv' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                Export CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null || branches.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-semibold text-sm transition cursor-pointer"
              >
                {exporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Export PDF
              </button>
              <button
                onClick={() => setIsAddOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-extrabold text-sm shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                Add School / Branch
              </button>
            </div>
          </div>

          {branchesError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
              Could not load branch list: {branchesError}
            </div>
          )}

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm overflow-x-auto">
            {isLoadingBranches ? (
              <div className="p-8 text-center text-slate-500">Loading branches...</div>
            ) : branches.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No branches found yet. Add a new school branch to begin.</div>
            ) : (
              <Table className="border-separate border-spacing-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Parents</TableHead>
                    <TableHead>Teachers</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Branch Admin</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-semibold text-slate-900">{branch.name}</TableCell>
                      <TableCell>{branch.code || '—'}</TableCell>
                      <TableCell>{branch.students.toLocaleString()}</TableCell>
                      <TableCell>{branch.parents.toLocaleString()}</TableCell>
                      <TableCell>{branch.teachers.toLocaleString()}</TableCell>
                      <TableCell>{branch.staff.toLocaleString()}</TableCell>
                      <TableCell>{branch.adminName || '—'}</TableCell>
                      <TableCell>{[branch.city, branch.state].filter(Boolean).join(', ') || branch.address || '—'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${branch.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {branch.active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingBranch(branch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-700 text-xs font-semibold transition cursor-pointer"
                            title="Edit branch"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingBranch(branch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                            title="Delete branch"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>{branches.length} branch{branches.length === 1 ? '' : 'es'} displayed.</TableCaption>
              </Table>
            )}
          </div>
        </>
      )}

      {activeSection === 'subscriptions' && (
        <>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Branch Subscriptions</h2>
            <p className="text-sm text-slate-500">Monitor billing statuses, expiry tracking, and process manual plan renewals.</p>
          </div>

          {subsError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
              Could not load subscriptions data: {subsError}
            </div>
          )}

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm overflow-x-auto">
            {isLoadingSubs ? (
              <div className="p-8 text-center text-slate-500">Loading subscriptions...</div>
            ) : subscriptions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No school branches found.</div>
            ) : (
              <Table className="border-separate border-spacing-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>School Branch</TableHead>
                    <TableHead>Active Plan</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Billing Status</TableHead>
                    <TableHead>Renewal State</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const lSub = sub.latestSubscription
                    return (
                      <TableRow key={sub.branchId}>
                        <TableCell className="font-semibold text-slate-900">
                          <div>
                            <div>{sub.branchName}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{sub.branchCode || 'No Code'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-slate-700 bg-slate-100 rounded-lg px-2.5 py-1 text-xs">
                            {lSub?.planName || 'No Plan Active'}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-600">
                          {lSub?.expiryDate ? new Date(lSub.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {lSub ? `₦${Number(lSub.totalCost).toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            lSub?.paymentStatus === 'paid' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : lSub?.paymentStatus === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {lSub?.paymentStatus ? lSub.paymentStatus.toUpperCase() : 'NO BILLING'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getDaysRemainingBadge(lSub?.expiryDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setExtendingBranch(sub)
                                setExtensionDays('7')
                                setExtensionReason('')
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              <Clock size={13} />
                              Extend Grace Period
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRenewingBranch(sub)
                                setSelectedPlanId(sub.latestSubscription?.planId.toString() || '')
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              <DollarSign size={13} />
                              Renew Subscription
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      {activeSection === 'settings' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Create new Session form */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm h-fit">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Create Academic Session</h3>
              <p className="text-xs text-slate-500 mt-0.5">Initialize a new academic calendar session globally.</p>
            </div>

            {sessionActionError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 font-semibold">
                {sessionActionError}
              </div>
            )}

            <form onSubmit={handleAddSession} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Session Name</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-2027"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  required
                />
                <p className="text-[10px] text-slate-400 font-semibold">Must follow the <strong>YYYY-YYYY</strong> format (e.g. 2026-2027).</p>
              </div>

              <button
                type="submit"
                disabled={isSubmittingSession}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold text-sm transition shadow-sm cursor-pointer"
              >
                {isSubmittingSession ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add Academic Session
              </button>
            </form>
          </div>

          {/* Sessions Listing & Global Selection */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm lg:col-span-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">SaaS Academic Sessions</h3>
              <p className="text-xs text-slate-500 mt-0.5">List of global academic sessions. Define which session is active across the system.</p>
            </div>

            {sessionsError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
                Could not load sessions: {sessionsError}
              </div>
            )}

            <div className="overflow-x-auto">
              {isLoadingSessions ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No academic sessions added yet.</div>
              ) : (
                <Table className="border-separate border-spacing-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((sess) => {
                      const isActive = sess.id === activeSessionId
                      return (
                        <TableRow key={sess.id}>
                          <TableCell className="font-bold text-slate-900">{sess.schoolYear}</TableCell>
                          <TableCell className="text-slate-500 text-xs">
                            {new Date(sess.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </TableCell>
                          <TableCell>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check size={12} /> Globally Active
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isActive && (
                              <button
                                type="button"
                                onClick={() => handleSetActiveSession(sess.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                              >
                                Set as Active
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXTEND SUBSCRIPTION MODAL */}
      {extendingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all animate-fade-in">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900">Extend Grace Period</h3>
                <p className="text-xs text-slate-400 font-semibold">{extendingBranch.branchName}</p>
              </div>
              <button
                onClick={() => {
                  setExtendingBranch(null)
                  setExtensionError(null)
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExtendSubscription} className="p-6 space-y-4">
              {extensionError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 font-semibold">
                  {extensionError}
                </div>
              )}

              {/* Display existing subscription context */}
              {extendingBranch.latestSubscription && (
                <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl text-xs space-y-1 text-amber-900 font-semibold">
                  <div className="flex justify-between">
                    <span>Current Expiration:</span>
                    <span>{new Date(extendingBranch.latestSubscription.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[10px] text-amber-600 font-bold leading-normal mt-1 flex items-start gap-1">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span>This will grant a grace period extension. The new expiry date will start from the current expiration date (or from today if already expired).</span>
                  </div>
                </div>
              )}

              {/* Extension Days */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Number of Days to Extend</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  required
                />
                <p className="text-[10px] text-slate-400 font-semibold">
                  Enter the number of days (1 to 30 days) to extend the subscription.
                </p>
              </div>

              {/* Reason / Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Reason for Extension</label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="e.g. School requested grace period for fee collection process."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setExtendingBranch(null)
                    setExtensionError(null)
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExtension}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-extrabold text-sm transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingExtension && <Loader2 size={14} className="animate-spin" />}
                  Confirm Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENEW SUBSCRIPTION DRAWER/DIALOG */}
      {renewingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all animate-fade-in">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900">Renew school subscription</h3>
                <p className="text-xs text-slate-400 font-semibold">{renewingBranch.branchName}</p>
              </div>
              <button
                onClick={() => {
                  setRenewingBranch(null)
                  setRenewError(null)
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRenewSubscription} className="p-6 space-y-4">
              {renewError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 font-semibold">
                  {renewError}
                </div>
              )}

              {/* Display existing subscription context */}
              {renewingBranch.latestSubscription && (
                <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs space-y-1 text-blue-900 font-semibold">
                  <div className="flex justify-between">
                    <span>Current Expiration:</span>
                    <span>{new Date(renewingBranch.latestSubscription.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[10px] text-blue-500 font-bold leading-normal mt-1 flex items-start gap-1">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span>Since this subscription is still active, renewing will append the duration directly onto the current expiration date.</span>
                  </div>
                </div>
              )}

              {/* Select Plan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Subscription Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  required
                >
                  <option value="" disabled>Select a subscription plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.durationMonths}m) — ₦{Number(plan.totalCost).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Payment Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Immediate Payment Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('paid')}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-bold text-center transition cursor-pointer ${
                      paymentStatus === 'paid'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Paid / Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('pending')}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-bold text-center transition cursor-pointer ${
                      paymentStatus === 'pending'
                        ? 'bg-amber-50 border-amber-500 text-amber-700'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Pending / Inactive
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-1">
                  Selecting <strong>Paid / Active</strong> instantly reactivates the school and credentials.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRenewingBranch(null)
                    setRenewError(null)
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRenewal}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold text-sm transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingRenewal && <Loader2 size={14} className="animate-spin" />}
                  Confirm Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BRANCH ACTION MODALS */}

      {isAddOpen && (
        <AddSchoolForm
          onClose={() => setIsAddOpen(false)}
          onAdded={() => {
            if (activeSection === 'manage-branches') {
              refreshBranches()
            } else if (activeSection === 'overview') {
              loadStats()
              loadAnalytics()
            }
          }}
        />
      )}

      {editingBranch && (
        <EditBranchForm
          branch={editingBranch}
          onClose={() => setEditingBranch(null)}
          onSaved={(updated) => {
            setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
            setActionMessage(`Branch "${updated.name}" updated successfully.`)
          }}
        />
      )}

      <AlertDialog open={!!deletingBranch} onOpenChange={(open) => !open && !isDeleting && setDeletingBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete branch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deletingBranch?.name}</strong> and all tenant-scoped
              students, parents, teachers, and subscriptions linked to this branch. Branch admin logins
              for this school will be deactivated. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteBranch()
              }}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Branch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
