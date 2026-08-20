'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Building2,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ChevronRight,
  Eye,
  Loader2,
  Layers,
  PieChart as PieChartIcon,
  Activity,
  School,
  Users
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

interface MultiBranchRevenueAnalyticsProps {
  user: {
    id: number
    username: string
    role: number
  }
}

interface RevenueSummary {
  totalSaasRevenue: number
  saasMrr: number
  saasArr: number
  activeSubscribedBranches: number
  totalBranches: number
  totalSchoolInvoiced: number
  totalSchoolCollected: number
  totalSchoolOutstanding: number
  globalCollectionRate: number
  totalExpenses: number
  netOperatingSurplus: number
}

interface BranchLeaderboardItem {
  branchId: number
  branchName: string
  branchCode: string
  active: boolean
  studentsCount: number
  adminName: string
  email: string
  phone: string
  city: string
  state: string
  planName: string
  subscriptionStatus: string
  subscriptionCost: number
  expiryDate: string | null
  invoicedAmount: number
  collectedAmount: number
  outstandingAmount: number
  collectionRate: number
  expensesAmount: number
  netSurplus: number
  paymentCount: number
  lastPaymentDate: string | null
  statusRating: 'OPTIMAL' | 'MODERATE' | 'ARREARS_RISK'
}

interface TimeTrendItem {
  month: string
  monthKey: string
  saasRevenue: number
  feeCollections: number
  expenses: number
  netSurplus: number
}

interface PaymentMethodItem {
  name: string
  amount: number
  count: number
  percentage: number
}

interface PlanRevenueItem {
  name: string
  slug: string
  activeSubscriptions: number
  revenue: number
  percentage: number
}

interface ExecutiveNarrative {
  headline: string
  summary: string
  topCampusText: string
  arrearsRiskText: string
  strategicRecommendation: string
}

interface RevenueAnalyticsResponse {
  summary: RevenueSummary
  branchLeaderboard: BranchLeaderboardItem[]
  timeTrends: TimeTrendItem[]
  paymentMethodBreakdown: PaymentMethodItem[]
  planRevenueBreakdown: PlanRevenueItem[]
  topPerformers: BranchLeaderboardItem[]
  arrearsWatchlist: BranchLeaderboardItem[]
  executiveNarrative: ExecutiveNarrative
}

interface AcademicSession {
  id: number
  schoolYear: string
}

interface BranchOption {
  id: number
  name: string
  code: string | null
}

const PIE_COLORS = ['#003da5', '#009ca6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export function MultiBranchRevenueAnalytics({ user }: MultiBranchRevenueAnalyticsProps) {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<RevenueAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPTIMAL' | 'MODERATE' | 'ARREARS_RISK'>('ALL')

  // Export states
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)

  // Drilldown Branch Modal
  const [inspectingBranch, setInspectingBranch] = useState<BranchLeaderboardItem | null>(null)

  useEffect(() => {
    setMounted(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    loadRevenueAnalytics()
  }, [selectedSessionId, selectedBranchId, selectedPeriod])

  const loadFilterOptions = async () => {
    try {
      // Load sessions
      const sessRes = await apiSlice.get<{ success: boolean; data: { sessions: AcademicSession[] } }>(
        endpoints.superadmin.sessions
      )
      if (sessRes.data?.sessions) {
        setSessions(sessRes.data.sessions)
      }

      // Load branches for filter dropdown
      const branchRes = await apiSlice.get<{ success: boolean; data: BranchOption[] }>(
        endpoints.superadmin.branches
      )
      if (branchRes.data) {
        setBranches(branchRes.data)
      }
    } catch (err) {
      console.warn('Failed to load filter dropdown items:', err)
    }
  }

  const loadRevenueAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = endpoints.superadmin.revenueAnalytics({
        sessionId: selectedSessionId || undefined,
        branchId: selectedBranchId || undefined,
        period: selectedPeriod || undefined
      })
      const res = await apiSlice.get<{ success: boolean; data: RevenueAnalyticsResponse }>(url)
      setData(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (type: 'csv' | 'pdf') => {
    setExporting(type)
    setExportMessage(null)
    try {
      const stamp = new Date().toISOString().slice(0, 10)
      const params = {
        sessionId: selectedSessionId || undefined,
        branchId: selectedBranchId || undefined,
        period: selectedPeriod || undefined
      }

      if (type === 'csv') {
        const url = endpoints.superadmin.revenueExportCsv(params)
        await apiSlice.download(url, `ugbekun-revenue-audit-${stamp}.csv`)
        setExportMessage('Consolidated revenue report exported as CSV.')
      } else {
        const url = endpoints.superadmin.revenueExportPdf(params)
        await apiSlice.download(url, `ugbekun-revenue-audit-${stamp}.pdf`)
        setExportMessage('Executive revenue report exported as PDF.')
      }
    } catch (err) {
      setExportMessage(err instanceof Error ? err.message : `Failed to export ${type.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  // Filtered leaderboard
  const filteredLeaderboard = (data?.branchLeaderboard || []).filter((b) => {
    const matchesSearch =
      b.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.adminName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || b.statusRating === statusFilter

    return matchesSearch && matchesStatus
  })

  // Format currency helpers
  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#002f6c] via-[#00529b] to-[#00838f] p-6 md:p-8 shadow-md overflow-hidden text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-30" />
          <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-teal-400/20 rounded-full blur-2xl opacity-30" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-extrabold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-flex items-center gap-1.5">
                <Sparkles size={12} className="text-teal-300" /> Multi-Branch Financial Command
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold text-teal-100 bg-teal-950/40 rounded-full border border-teal-500/30">
                Consolidated Real-time Ledger
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Superadmin Revenue Analytics
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-2xl font-medium">
              Real-time multi-tenant financial intelligence: platform SaaS subscription earnings, multi-branch fee collections, arrears bottlenecks, and operating margins.
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer backdrop-blur-sm"
            >
              {exporting === 'csv' ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
              Export CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer backdrop-blur-sm"
            >
              {exporting === 'pdf' ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              Export PDF Audit
            </button>
            <button
              onClick={loadRevenueAnalytics}
              disabled={isLoading}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white transition disabled:opacity-50 cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Export Notifications */}
      {exportMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs sm:text-sm text-blue-800 font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-semibold flex items-center gap-2 shadow-xs">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>Could not load revenue analytics: {error}</span>
        </div>
      )}

      {/* FILTER CONTROL PANEL */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-blue-600" />
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
              Financial Filter & Segmentation
            </h2>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing metrics for {data?.summary?.totalBranches || 0} registered campuses
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Academic Session */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Academic Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="">All Academic Sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.schoolYear}
                </option>
              ))}
            </select>
          </div>

          {/* Campus Drilldown */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Campus Drilldown
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="">All Branches (Consolidated)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.code ? `(${b.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Time Horizon
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="all">All-Time Cumulative</option>
              <option value="ytd">Year-to-Date (YTD)</option>
              <option value="90d">Last 90 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Search */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Quick Search Branch
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search campus name, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TOP 5 HERO KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. SaaS Platform Revenue */}
        <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/90 to-blue-100/40 p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900">
              SaaS Platform Rev
            </span>
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#003da5] tracking-tight">
            {isLoading ? '…' : fmt(data?.summary.totalSaasRevenue || 0)}
          </p>
          <div className="pt-1 border-t border-blue-200/60 text-[11px] font-semibold text-blue-800 flex items-center justify-between">
            <span>MRR: {fmt(data?.summary.saasMrr || 0)}</span>
            <span className="text-blue-900 font-bold">{data?.summary.activeSubscribedBranches || 0} Active Subs</span>
          </div>
        </div>

        {/* 2. Fees Collected */}
        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
              School Fees Collected
            </span>
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
            {isLoading ? '…' : fmt(data?.summary.totalSchoolCollected || 0)}
          </p>
          <div className="pt-1 border-t border-emerald-200/60 text-[11px] font-semibold text-emerald-800 flex items-center justify-between">
            <span>Collection Rate</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
              {data?.summary.globalCollectionRate || 0}%
            </span>
          </div>
        </div>

        {/* 3. Gross Invoiced Portfolio */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Gross Invoiced Volume
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Building2 size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isLoading ? '…' : fmt(data?.summary.totalSchoolInvoiced || 0)}
          </p>
          <div className="pt-1 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Campuses</span>
            <span className="text-slate-800 font-bold">{data?.summary.totalBranches || 0} Registered</span>
          </div>
        </div>

        {/* 4. Total Outstanding Arrears */}
        <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50/90 to-rose-100/40 p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-900">
              Outstanding Arrears
            </span>
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-800 tracking-tight">
            {isLoading ? '…' : fmt(data?.summary.totalSchoolOutstanding || 0)}
          </p>
          <div className="pt-1 border-t border-rose-200/60 text-[11px] font-semibold text-rose-800 flex items-center justify-between">
            <span>Arrears Watchlist</span>
            <span className="text-rose-900 font-bold">{data?.arrearsWatchlist?.length || 0} Priority Branches</span>
          </div>
        </div>

        {/* 5. Net Operating Surplus */}
        <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/90 to-teal-100/40 p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-900">
              Net Operating Margin
            </span>
            <div className="p-2 rounded-xl bg-teal-700 text-white shadow-xs">
              <Activity size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-teal-900 tracking-tight">
            {isLoading ? '…' : fmt(data?.summary.netOperatingSurplus || 0)}
          </p>
          <div className="pt-1 border-t border-teal-200/60 text-[11px] font-semibold text-teal-800 flex items-center justify-between">
            <span>Expenses</span>
            <span className="text-teal-950 font-bold">{fmt(data?.summary.totalExpenses || 0)}</span>
          </div>
        </div>
      </div>

      {/* OSE AI FINANCIAL INTELLIGENCE COMMENTARY */}
      {data?.executiveNarrative && (
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-blue-50/80 p-5 md:p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wide">
                Ose AI • Cross-Branch Financial Intelligence Commentary
              </h3>
              <p className="text-xs text-emerald-700 font-medium">
                Automated executive summary & revenue optimization roadmap
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 rounded-xl bg-white/80 border border-emerald-200/60 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Portfolio Performance
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {data.executiveNarrative.summary}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 border border-blue-200/60 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <TrendingUp size={14} className="text-blue-600" />
                Revenue Engine Highlights
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {data.executiveNarrative.topCampusText}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200/60 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <AlertTriangle size={14} className="text-amber-600" />
                Arrears Mitigation Strategy
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {data.executiveNarrative.arrearsRiskText}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-900/5 border border-emerald-800/10 text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
            <span>{data.executiveNarrative.strategicRecommendation}</span>
          </div>
        </div>
      )}

      {/* CHARTS GRID SECTION */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 1. Monthly Collections & Expenses Timeline (Area Chart) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900">
                6-Month Consolidated Cashflow Timeline
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Fee Collections vs. Operational Expenses vs. SaaS Subscriptions
              </p>
            </div>
            <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold">
              ₦ Cashflow
            </span>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              <Loader2 className="animate-spin mr-2" size={16} /> Loading timeline...
            </div>
          ) : mounted && data?.timeTrends ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSaas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#003da5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#003da5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₦${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                  <Tooltip formatter={(val) => [`₦${Number(val).toLocaleString()}`, 'Amount']} />
                  <Legend />
                  <Area type="monotone" dataKey="feeCollections" name="School Fee Collections" stroke="#10b981" fillOpacity={1} fill="url(#colorFees)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="saasRevenue" name="SaaS Platform Revenue" stroke="#003da5" fillOpacity={1} fill="url(#colorSaas)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>

        {/* 2. Top Branches Inflow vs Arrears (Bar Chart) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900">
                Branch Collection vs. Arrears Comparison
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Top recorded school campuses by fee volume
              </p>
            </div>
            <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold">
              Leaderboard
            </span>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              <Loader2 className="animate-spin mr-2" size={16} /> Loading comparison...
            </div>
          ) : mounted && data?.branchLeaderboard ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.branchLeaderboard.slice(0, 6).map((b) => ({
                    name: b.branchName.replace('School', '').replace('Academy', '').replace('Centre', '').trim().slice(0, 14),
                    collected: b.collectedAmount,
                    outstanding: b.outstandingAmount,
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₦${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                  <Tooltip formatter={(val) => [`₦${Number(val).toLocaleString()}`, 'Amount']} />
                  <Legend />
                  <Bar dataKey="collected" name="Fee Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" name="Outstanding Arrears" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>

        {/* 3. Payment Methods Breakdown (Donut Chart) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900">
                Payment Inflow Channel Share
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Distribution across Bank Transfer, POS & Cash
              </p>
            </div>
            <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold">
              Channels
            </span>
          </div>

          {isLoading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              <Loader2 className="animate-spin mr-2" size={16} /> Loading channels...
            </div>
          ) : mounted && data?.paymentMethodBreakdown ? (
            <div className="h-56 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.paymentMethodBreakdown}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                  >
                    {data.paymentMethodBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Total Inflow']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>

        {/* 4. SaaS Subscription Revenue by Tier (Bar Chart) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900">
                SaaS Subscription Earnings by Tier
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Revenue generated across Starter, Professional & Basic Plus
              </p>
            </div>
            <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold">
              SaaS Plans
            </span>
          </div>

          {isLoading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              <Loader2 className="animate-spin mr-2" size={16} /> Loading tiers...
            </div>
          ) : mounted && data?.planRevenueBreakdown ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.planRevenueBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₦${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                  <Tooltip formatter={(value, name) => [name === 'revenue' ? `₦${Number(value).toLocaleString()}` : value, name === 'revenue' ? 'Earnings' : 'Active Branches']} />
                  <Legend />
                  <Bar dataKey="revenue" name="Total Revenue" fill="#003da5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="activeSubscriptions" name="Active Branches" fill="#009ca6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      </div>

      {/* MULTI-BRANCH CONSOLIDATED FINANCIAL AUDIT TABLE */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Multi-Branch Financial Performance Ledger
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Complete multi-campus balance matrix, collection efficiencies, and operational margins.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {(['ALL', 'OPTIMAL', 'MODERATE', 'ARREARS_RISK'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'ALL'
                  ? 'All Campuses'
                  : st === 'OPTIMAL'
                  ? 'Optimal (80%+)'
                  : st === 'MODERATE'
                  ? 'Moderate'
                  : 'Arrears Risk'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <Loader2 className="animate-spin inline-block mr-2" size={18} /> Loading consolidated ledger...
            </div>
          ) : filteredLeaderboard.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No matching branch financial records found.
            </div>
          ) : (
            <Table className="border-separate border-spacing-0">
              <TableHeader>
                <TableRow>
                  <TableHead>School / Branch</TableHead>
                  <TableHead>SaaS Plan</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Invoiced (₦)</TableHead>
                  <TableHead className="text-right">Collected (₦)</TableHead>
                  <TableHead className="text-right">Arrears (₦)</TableHead>
                  <TableHead>Collection Rate</TableHead>
                  <TableHead className="text-right">Net Margin (₦)</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaderboard.map((branch) => (
                  <TableRow key={branch.branchId} className="hover:bg-slate-50/70 transition">
                    {/* School / Branch Name */}
                    <TableCell className="font-bold text-slate-900">
                      <div>
                        <div>{branch.branchName}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{branch.branchCode || 'No Code'}</span>
                          {branch.city && <span>• {branch.city}</span>}
                        </div>
                      </div>
                    </TableCell>

                    {/* SaaS Plan */}
                    <TableCell>
                      <span className="font-bold text-slate-700 bg-slate-100 rounded-lg px-2 py-0.5 text-xs inline-block">
                        {branch.planName}
                      </span>
                    </TableCell>

                    {/* Students */}
                    <TableCell className="font-semibold text-slate-700">
                      {branch.studentsCount.toLocaleString()}
                    </TableCell>

                    {/* Invoiced */}
                    <TableCell className="font-bold text-slate-800 text-right">
                      {fmt(branch.invoicedAmount)}
                    </TableCell>

                    {/* Collected */}
                    <TableCell className="font-black text-emerald-700 text-right">
                      {fmt(branch.collectedAmount)}
                    </TableCell>

                    {/* Arrears */}
                    <TableCell className={`font-black text-right ${branch.outstandingAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {fmt(branch.outstandingAmount)}
                    </TableCell>

                    {/* Collection Rate with Mini Progress Bar */}
                    <TableCell>
                      <div className="space-y-1 w-28">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className={branch.collectionRate >= 80 ? 'text-emerald-700' : branch.collectionRate >= 50 ? 'text-amber-700' : 'text-rose-600'}>
                            {branch.collectionRate}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              branch.collectionRate >= 80
                                ? 'bg-emerald-500'
                                : branch.collectionRate >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, branch.collectionRate)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Net Margin */}
                    <TableCell className={`font-black text-right ${branch.netSurplus >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                      {fmt(branch.netSurplus)}
                    </TableCell>

                    {/* Health Status */}
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          branch.statusRating === 'OPTIMAL'
                            ? 'bg-emerald-100 text-emerald-800'
                            : branch.statusRating === 'MODERATE'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {branch.statusRating === 'OPTIMAL'
                          ? 'Optimal'
                          : branch.statusRating === 'MODERATE'
                          ? 'Moderate'
                          : 'Arrears Risk'}
                      </span>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => setInspectingBranch(branch)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-xs font-bold transition cursor-pointer"
                        title="Inspect branch ledger details"
                      >
                        <Eye size={13} /> Inspect
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                {filteredLeaderboard.length} branch{filteredLeaderboard.length === 1 ? '' : 'es'} listed in revenue matrix.
              </TableCaption>
            </Table>
          )}
        </div>
      </div>

      {/* BRANCH QUICK INSPECTION MODAL */}
      {inspectingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#003da5] to-[#0063a6] p-6 text-white flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-white/20 text-white inline-block mb-1">
                  Campus Financial Profile
                </span>
                <h3 className="text-xl font-black text-white">{inspectingBranch.branchName}</h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Code: {inspectingBranch.branchCode} • Location: {[inspectingBranch.city, inspectingBranch.state].filter(Boolean).join(', ') || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setInspectingBranch(null)}
                className="text-white/80 hover:text-white text-lg font-black cursor-pointer bg-white/10 hover:bg-white/20 p-1.5 rounded-xl transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Invoiced</span>
                  <p className="text-base font-black text-slate-900">{fmt(inspectingBranch.invoicedAmount)}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Collected</span>
                  <p className="text-base font-black text-emerald-800">{fmt(inspectingBranch.collectedAmount)}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-rose-800 uppercase">Outstanding</span>
                  <p className="text-base font-black text-rose-700">{fmt(inspectingBranch.outstandingAmount)}</p>
                </div>
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-teal-800 uppercase">Net Margin</span>
                  <p className="text-base font-black text-teal-800">{fmt(inspectingBranch.netSurplus)}</p>
                </div>
              </div>

              {/* Campus Admin & SaaS Subscription Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-blue-600" /> Branch Administrative Contact
                  </h4>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Admin Name:</span>
                      <span className="font-bold text-slate-800">{inspectingBranch.adminName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Email:</span>
                      <span className="font-medium text-slate-800">{inspectingBranch.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Phone:</span>
                      <span className="font-medium text-slate-800">{inspectingBranch.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Enrolled Students:</span>
                      <span className="font-bold text-slate-800">{inspectingBranch.studentsCount} Students</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={14} className="text-indigo-600" /> Platform SaaS Subscription
                  </h4>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Active Plan:</span>
                      <span className="font-bold text-blue-700">{inspectingBranch.planName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Billing Status:</span>
                      <span className="font-bold uppercase text-slate-800">{inspectingBranch.subscriptionStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Plan Expiry:</span>
                      <span className="font-medium text-slate-800">
                        {inspectingBranch.expiryDate ? new Date(inspectingBranch.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Last Recorded Inflow:</span>
                      <span className="font-medium text-slate-800">
                        {inspectingBranch.lastPaymentDate ? new Date(inspectingBranch.lastPaymentDate).toLocaleDateString() : 'No Payments'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingBranch(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Close Audit Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
