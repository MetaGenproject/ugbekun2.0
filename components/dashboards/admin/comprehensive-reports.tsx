'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CheckSquare,
  BookOpen,
  GraduationCap,
  Archive,
  RefreshCw,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  PieChart,
  Layers,
  Star,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { IncomeVsExpensesChart, AnnualFeeSummaryCard } from './financial-visuals'

interface ReportData {
  incomeExpenses: {
    totalFeeIncome: number
    totalOfficeIncome: number
    totalIncome: number
    totalExpenses: number
    netSurplus: number
    expenseByHead: Array<{ category: string; amount: number }>
    recentTransactions: Array<{
      id: number
      type: string
      voucherHeadName: string
      amount: number
      paymentMethod: string
      transactionDate: string
      description?: string | null
    }>
  }
  fees: {
    totalInvoiced: number
    totalCollected: number
    totalOutstanding: number
    collectionRate: string
    feeTypeBreakdown: Array<{ feeType: string; totalAmount: number }>
    classByClassFees: Array<{ className: string; studentCount: number }>
    invoiceStatusCount: { paid: number; partial: number; unpaid: number }
  }
  students: {
    totalStudents: number
    activeStudents: number
    inactiveStudents: number
    maleCount: number
    femaleCount: number
    classByClass: Array<{ className: string; total: number; active: number; male: number; female: number }>
    totalClasses: number
  }
  attendance: {
    totalRecords: number
    presentCount: number
    absentCount: number
    lateCount: number
    attendanceRate: string
    classByClass: Array<{ className: string; total: number; present: number; rate: string }>
  }
  examinations: {
    totalMarksRecorded: number
    avgScore: string
    gradeDistribution: { A: number; B: number; C: number; D: number; F: number }
    classByClass: Array<{ className: string; total: number; average: string }>
  }
  inventory: {
    totalResources: number
    physicalBooks: number
    onlineEbooks: number
    studyVideos: number
    totalIssuances: number
    activeIssuances: number
    returnedIssues: number
    returnRate: string
  }
}

type ReportTab = 'income-expenses' | 'fees' | 'students' | 'attendance' | 'examinations' | 'inventory'

const TABS: { id: ReportTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'income-expenses', label: 'Income & Expenses', icon: DollarSign, color: 'emerald' },
  { id: 'fees', label: 'Fees Report', icon: FileText, color: 'blue' },
  { id: 'students', label: 'Students Report', icon: Users, color: 'violet' },
  { id: 'attendance', label: 'Attendance Report', icon: CheckSquare, color: 'amber' },
  { id: 'examinations', label: 'Examination Report', icon: GraduationCap, color: 'rose' },
  { id: 'inventory', label: 'Inventory Report', icon: Archive, color: 'cyan' },
]

function StatCard({
  label,
  value,
  sub,
  color = 'slate',
  icon: Icon,
  trend,
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    rose: 'bg-rose-50 border-rose-100 text-rose-600',
    cyan: 'bg-cyan-50 border-cyan-100 text-cyan-600',
    slate: 'bg-slate-50 border-slate-100 text-slate-600',
  }
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.slate}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black text-slate-900 truncate">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>}
      </div>
      {trend === 'up' && <ArrowUpRight size={18} className="text-emerald-500 shrink-0" />}
      {trend === 'down' && <ArrowDownRight size={18} className="text-rose-500 shrink-0" />}
      {trend === 'neutral' && <Minus size={18} className="text-slate-400 shrink-0" />}
    </div>
  )
}

function ProgressBar({ value, max, color = 'emerald' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500',
  }
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[color] || 'bg-slate-400'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function SectionTable({
  headers,
  rows,
  emptyMsg = 'No data available.',
}: {
  headers: string[]
  rows: (string | number | React.ReactNode)[][]
  emptyMsg?: string
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b">
            {headers.map((h, i) => (
              <th key={i} className="p-3 font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="p-6 text-center text-slate-400 font-medium">
                {emptyMsg}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-50 font-medium text-slate-700">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-3 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function ComprehensiveReports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('income-expenses')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; data: ReportData }>(endpoints.admin.comprehensiveReports)
      if (res.success) setData(res.data)
      else setError('Failed to load report data.')
    } catch (e: any) {
      setError(e.message || 'Failed to load report data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <BarChart3 size={16} /> School Operational Reports
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics Intelligence</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Comprehensive school reports across income, fees, students, attendance, examinations, and inventory.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchReports}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 font-medium">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={fetchReports} className="ml-auto underline text-xs cursor-pointer">Retry</button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 h-24 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
              <div className="h-6 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-emerald-600 text-white rounded-2xl p-4 space-y-1 shadow-md">
              <DollarSign size={20} className="opacity-80" />
              <p className="text-lg font-black">₦{Number(data.incomeExpenses.totalIncome).toLocaleString()}</p>
              <p className="text-[11px] font-semibold opacity-75">Total Income</p>
            </div>
            <div className="bg-rose-500 text-white rounded-2xl p-4 space-y-1 shadow-md">
              <TrendingDown size={20} className="opacity-80" />
              <p className="text-lg font-black">₦{Number(data.incomeExpenses.totalExpenses).toLocaleString()}</p>
              <p className="text-[11px] font-semibold opacity-75">Total Expenses</p>
            </div>
            <div className="bg-indigo-600 text-white rounded-2xl p-4 space-y-1 shadow-md">
              <Users size={20} className="opacity-80" />
              <p className="text-lg font-black">{data.students.totalStudents}</p>
              <p className="text-[11px] font-semibold opacity-75">Total Students</p>
            </div>
            <div className="bg-amber-500 text-white rounded-2xl p-4 space-y-1 shadow-md">
              <Activity size={20} className="opacity-80" />
              <p className="text-lg font-black">{data.attendance.attendanceRate}%</p>
              <p className="text-[11px] font-semibold opacity-75">Attendance Rate</p>
            </div>
            <div className="bg-violet-600 text-white rounded-2xl p-4 space-y-1 shadow-md">
              <GraduationCap size={20} className="opacity-80" />
              <p className="text-lg font-black">{data.examinations.avgScore}%</p>
              <p className="text-[11px] font-semibold opacity-75">Avg Exam Score</p>
            </div>
            <div className="bg-cyan-600 text-white rounded-2xl p-4 space-y-1 shadow-md">
              <Archive size={20} className="opacity-80" />
              <p className="text-lg font-black">{data.inventory.totalResources}</p>
              <p className="text-[11px] font-semibold opacity-75">Library Resources</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex overflow-x-auto border-b border-slate-100">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-xs transition cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="p-6 space-y-6">
              {/* ── INCOME & EXPENSES ── */}
              {activeTab === 'income-expenses' && (
                <div className="space-y-6">
                  {/* Visual Income vs Expenses Prominent Graph (Blue Income vs Red Expenses) */}
                  <IncomeVsExpensesChart
                    totalIncome={Number(data.incomeExpenses.totalIncome)}
                    totalExpenses={Number(data.incomeExpenses.totalExpenses)}
                    feeIncome={Number(data.incomeExpenses.totalFeeIncome)}
                    otherIncome={Number(data.incomeExpenses.totalOfficeIncome)}
                    netSurplus={Number(data.incomeExpenses.netSurplus)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Fee Collections" value={`₦${Number(data.incomeExpenses.totalFeeIncome).toLocaleString()}`} icon={DollarSign} color="emerald" trend="up" />
                    <StatCard label="Other Income" value={`₦${Number(data.incomeExpenses.totalOfficeIncome).toLocaleString()}`} icon={TrendingUp} color="blue" />
                    <StatCard label="Total Expenses" value={`₦${Number(data.incomeExpenses.totalExpenses).toLocaleString()}`} icon={TrendingDown} color="rose" trend="down" />
                    <StatCard
                      label={data.incomeExpenses.netSurplus >= 0 ? 'Net Surplus' : 'Net Deficit'}
                      value={`₦${Math.abs(Number(data.incomeExpenses.netSurplus)).toLocaleString()}`}
                      icon={data.incomeExpenses.netSurplus >= 0 ? ArrowUpRight : ArrowDownRight}
                      color={data.incomeExpenses.netSurplus >= 0 ? 'emerald' : 'rose'}
                      trend={data.incomeExpenses.netSurplus >= 0 ? 'up' : 'down'}
                    />
                  </div>

                  {data.incomeExpenses.expenseByHead.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-800">Expense Breakdown by Voucher Category</h3>
                      <div className="grid gap-3">
                        {data.incomeExpenses.expenseByHead.map((e, i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium text-slate-700">
                              <span>{e.category}</span>
                              <span className="font-bold text-rose-600">₦{Number(e.amount).toLocaleString()}</span>
                            </div>
                            <ProgressBar value={e.amount} max={data.incomeExpenses.totalExpenses} color="rose" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.incomeExpenses.recentTransactions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-800">Recent Office Transactions</h3>
                      <SectionTable
                        headers={['Date', 'Type', 'Voucher Category', 'Amount', 'Method']}
                        rows={data.incomeExpenses.recentTransactions.map((t) => [
                          new Date(t.transactionDate).toLocaleDateString(),
                          <span key={t.id} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{t.type}</span>,
                          t.voucherHeadName || 'General',
                          <span key={t.id} className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'INCOME' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
                          </span>,
                          t.paymentMethod,
                        ])}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ── FEES REPORT ── */}
              {activeTab === 'fees' && (
                <div className="space-y-6">
                  {/* Annual Fee Summary Card */}
                  <AnnualFeeSummaryCard
                    totalInvoiced={Number(data.fees.totalInvoiced)}
                    totalCollected={Number(data.fees.totalCollected)}
                    totalOutstanding={Number(data.fees.totalOutstanding)}
                    collectionRate={data.fees.collectionRate}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Invoiced" value={`₦${Number(data.fees.totalInvoiced).toLocaleString()}`} icon={FileText} color="blue" />
                    <StatCard label="Total Collected" value={`₦${Number(data.fees.totalCollected).toLocaleString()}`} icon={CheckCircle2} color="emerald" trend="up" />
                    <StatCard label="Outstanding Dues" value={`₦${Number(data.fees.totalOutstanding).toLocaleString()}`} icon={AlertTriangle} color="rose" trend="down" />
                    <StatCard label="Collection Rate" value={`${data.fees.collectionRate}%`} icon={TrendingUp} color="violet" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-slate-600">
                      <span>Collection Progress</span>
                      <span className="font-bold text-emerald-600">{data.fees.collectionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                        style={{ width: `${data.fees.collectionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                      <p className="text-2xl font-black text-emerald-700">{data.fees.invoiceStatusCount.paid}</p>
                      <p className="text-xs font-semibold text-emerald-600 mt-1">Fully Paid Invoices</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                      <p className="text-2xl font-black text-amber-700">{data.fees.invoiceStatusCount.partial}</p>
                      <p className="text-xs font-semibold text-amber-600 mt-1">Partial Payments</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-center">
                      <p className="text-2xl font-black text-rose-700">{data.fees.invoiceStatusCount.unpaid}</p>
                      <p className="text-xs font-semibold text-rose-600 mt-1">Unpaid Invoices</p>
                    </div>
                  </div>

                  {data.fees.feeTypeBreakdown.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-800">Fee Collection by Type</h3>
                      <SectionTable
                        headers={['Fee Type', 'Total Amount']}
                        rows={data.fees.feeTypeBreakdown.map((f) => [
                          f.feeType,
                          <span key={f.feeType} className="font-bold text-emerald-700">₦{Number(f.totalAmount).toLocaleString()}</span>,
                        ])}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ── STUDENTS REPORT ── */}
              {activeTab === 'students' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Students" value={data.students.totalStudents} icon={Users} color="violet" />
                    <StatCard label="Active Students" value={data.students.activeStudents} icon={CheckCircle2} color="emerald" sub={`${data.students.inactiveStudents} inactive`} />
                    <StatCard label="Male Students" value={data.students.maleCount} icon={Users} color="blue" />
                    <StatCard label="Female Students" value={data.students.femaleCount} icon={Users} color="rose" />
                  </div>

                  {/* Gender Bar */}
                  {(data.students.maleCount + data.students.femaleCount) > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Gender Distribution</span>
                        <span className="text-slate-400">{data.students.totalStudents} total enrolments</span>
                      </div>
                      <div className="flex h-4 rounded-full overflow-hidden w-full">
                        <div
                          className="bg-blue-500 transition-all duration-500"
                          style={{ width: `${(data.students.maleCount / (data.students.maleCount + data.students.femaleCount)) * 100}%` }}
                        />
                        <div
                          className="bg-rose-400 transition-all duration-500"
                          style={{ width: `${(data.students.femaleCount / (data.students.maleCount + data.students.femaleCount)) * 100}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-[11px] font-semibold">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Male: {data.students.maleCount}</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />Female: {data.students.femaleCount}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800">Student Enrollment by Class</h3>
                    <SectionTable
                      headers={['Class', 'Total', 'Active', 'Male', 'Female']}
                      rows={data.students.classByClass.map((c) => [
                        <span key={c.className} className="font-bold text-slate-800">{c.className}</span>,
                        <span key={c.className} className="font-black text-violet-700">{c.total}</span>,
                        <span key={c.className} className="font-semibold text-emerald-600">{c.active}</span>,
                        c.male,
                        c.female,
                      ])}
                      emptyMsg="No class enrollment data found."
                    />
                  </div>
                </div>
              )}

              {/* ── ATTENDANCE REPORT ── */}
              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Overall Attendance" value={`${data.attendance.attendanceRate}%`} icon={CheckSquare} color="amber" trend="up" />
                    <StatCard label="Present Records" value={data.attendance.presentCount} icon={CheckCircle2} color="emerald" />
                    <StatCard label="Absent Records" value={data.attendance.absentCount} icon={AlertTriangle} color="rose" trend="down" />
                    <StatCard label="Late Arrivals" value={data.attendance.lateCount} icon={Activity} color="amber" />
                  </div>

                  {/* Attendance Rate Gauge */}
                  <div className="bg-slate-50 rounded-xl p-5 space-y-2">
                    <div className="flex justify-between text-sm font-semibold text-slate-600">
                      <span>Overall Attendance Rate</span>
                      <span className={`font-black ${parseFloat(data.attendance.attendanceRate) >= 80 ? 'text-emerald-600' : parseFloat(data.attendance.attendanceRate) >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {data.attendance.attendanceRate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          parseFloat(data.attendance.attendanceRate) >= 80
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                            : parseFloat(data.attendance.attendanceRate) >= 60
                            ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                            : 'bg-gradient-to-r from-rose-400 to-rose-600'
                        }`}
                        style={{ width: `${data.attendance.attendanceRate}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Based on {data.attendance.totalRecords.toLocaleString()} total attendance records
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800">Attendance by Class (Ranked)</h3>
                    <SectionTable
                      headers={['Class', 'Total Records', 'Present', 'Attendance Rate']}
                      rows={data.attendance.classByClass.map((c, i) => [
                        <div key={c.className} className="flex items-center gap-2">
                          {i < 3 && <Star size={12} className={i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : 'text-amber-700'} fill="currentColor" />}
                          <span className="font-bold text-slate-800">{c.className}</span>
                        </div>,
                        c.total,
                        c.present,
                        <div key={c.className} className="flex items-center gap-2">
                          <span className={`font-black text-sm ${parseFloat(c.rate) >= 80 ? 'text-emerald-600' : parseFloat(c.rate) >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {c.rate}%
                          </span>
                          <div className="w-16">
                            <ProgressBar value={parseFloat(c.rate)} max={100} color={parseFloat(c.rate) >= 80 ? 'emerald' : parseFloat(c.rate) >= 60 ? 'amber' : 'rose'} />
                          </div>
                        </div>,
                      ])}
                      emptyMsg="No attendance records found."
                    />
                  </div>
                </div>
              )}

              {/* ── EXAMINATION REPORT ── */}
              {activeTab === 'examinations' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard label="Total Marks Recorded" value={data.examinations.totalMarksRecorded.toLocaleString()} icon={FileText} color="rose" />
                    <StatCard label="Overall Average Score" value={`${data.examinations.avgScore}%`} icon={TrendingUp} color="violet" />
                    <StatCard label="Top Grade (A ≥ 70%)" value={data.examinations.gradeDistribution.A} icon={Star} color="emerald" />
                  </div>

                  {/* Grade Distribution */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800">Grade Distribution</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {(
                        [
                          { grade: 'A', count: data.examinations.gradeDistribution.A, color: 'bg-emerald-500', label: '≥ 70%' },
                          { grade: 'B', count: data.examinations.gradeDistribution.B, color: 'bg-blue-500', label: '60–69%' },
                          { grade: 'C', count: data.examinations.gradeDistribution.C, color: 'bg-amber-500', label: '50–59%' },
                          { grade: 'D', count: data.examinations.gradeDistribution.D, color: 'bg-orange-500', label: '40–49%' },
                          { grade: 'F', count: data.examinations.gradeDistribution.F, color: 'bg-rose-500', label: '< 40%' },
                        ] as const
                      ).map((g) => (
                        <div key={g.grade} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center space-y-1">
                          <div className={`w-8 h-8 ${g.color} rounded-lg flex items-center justify-center text-white font-black text-sm mx-auto`}>
                            {g.grade}
                          </div>
                          <p className="text-xl font-black text-slate-800">{g.count}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{g.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800">Exam Performance by Class (Ranked)</h3>
                    <SectionTable
                      headers={['Rank', 'Class', 'Marks Count', 'Average Score']}
                      rows={data.examinations.classByClass.map((c, i) => [
                        <span key={i} className={`font-bold text-xs ${i === 0 ? 'text-amber-600' : i === 1 ? 'text-slate-400' : 'text-slate-300'}`}>#{i + 1}</span>,
                        <span key={c.className} className="font-bold text-slate-800">{c.className}</span>,
                        c.total,
                        <div key={c.className} className="flex items-center gap-2">
                          <span className={`font-black text-sm ${parseFloat(c.average) >= 70 ? 'text-emerald-600' : parseFloat(c.average) >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {c.average}%
                          </span>
                          <div className="w-16">
                            <ProgressBar value={parseFloat(c.average)} max={100} color={parseFloat(c.average) >= 70 ? 'emerald' : parseFloat(c.average) >= 50 ? 'amber' : 'rose'} />
                          </div>
                        </div>,
                      ])}
                      emptyMsg="No examination marks found."
                    />
                  </div>
                </div>
              )}

              {/* ── INVENTORY REPORT ── */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Resources" value={data.inventory.totalResources} icon={Archive} color="cyan" />
                    <StatCard label="Physical Books" value={data.inventory.physicalBooks} icon={BookOpen} color="blue" sub={`${data.inventory.physicalBooks} copies in catalog`} />
                    <StatCard label="Online E-Books" value={data.inventory.onlineEbooks} icon={Layers} color="violet" />
                    <StatCard label="Study Videos" value={data.inventory.studyVideos} icon={Activity} color="rose" />
                  </div>

                  {/* Issuance Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border rounded-xl p-5 text-center space-y-1">
                      <p className="text-3xl font-black text-slate-900">{data.inventory.totalIssuances}</p>
                      <p className="text-xs font-semibold text-slate-500">Total Book Issuances</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center space-y-1">
                      <p className="text-3xl font-black text-emerald-700">{data.inventory.returnedIssues}</p>
                      <p className="text-xs font-semibold text-emerald-600">Books Returned</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-center space-y-1">
                      <p className="text-3xl font-black text-amber-700">{data.inventory.activeIssuances}</p>
                      <p className="text-xs font-semibold text-amber-600">Currently Issued Out</p>
                    </div>
                  </div>

                  {/* Return Rate */}
                  <div className="bg-slate-50 rounded-xl p-5 space-y-2">
                    <div className="flex justify-between text-sm font-semibold text-slate-600">
                      <span>Book Return Compliance Rate</span>
                      <span className={`font-black ${parseFloat(data.inventory.returnRate) >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {data.inventory.returnRate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-cyan-400 to-cyan-600"
                        style={{ width: `${data.inventory.returnRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Resource Distribution */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800">Resource Type Distribution</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Physical Books', value: data.inventory.physicalBooks, color: 'blue' as const },
                        { label: 'Online E-Books', value: data.inventory.onlineEbooks, color: 'violet' as const },
                        { label: 'Study Videos', value: data.inventory.studyVideos, color: 'rose' as const },
                      ].map((r) => (
                        <div key={r.label} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-slate-700">
                            <span>{r.label}</span>
                            <span className="font-bold">{r.value}</span>
                          </div>
                          <ProgressBar value={r.value} max={Math.max(data.inventory.totalResources, 1)} color={r.color} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
