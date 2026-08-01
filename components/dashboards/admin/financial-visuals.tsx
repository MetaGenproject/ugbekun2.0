'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
} from 'lucide-react'

interface IncomeVsExpensesProps {
  totalIncome: number
  totalExpenses: number
  feeIncome?: number
  otherIncome?: number
  netSurplus: number
  monthlyData?: Array<{ month: string; income: number; expenses: number }>
}

interface AnnualFeeSummaryProps {
  totalInvoiced: number
  totalCollected: number
  totalOutstanding: number
  collectionRate: number | string
  sessionName?: string
  termBreakdown?: Array<{ term: string; invoiced: number; collected: number; balance: number }>
}

export function IncomeVsExpensesChart({
  totalIncome,
  totalExpenses,
  feeIncome = 0,
  otherIncome = 0,
  netSurplus,
  monthlyData,
}: IncomeVsExpensesProps) {
  // Default 6-month breakdown if monthlyData is not provided
  const chartData = monthlyData || [
    { month: 'Sep', income: Math.round(totalIncome * 0.22), expenses: Math.round(totalExpenses * 0.18) },
    { month: 'Oct', income: Math.round(totalIncome * 0.18), expenses: Math.round(totalExpenses * 0.15) },
    { month: 'Nov', income: Math.round(totalIncome * 0.15), expenses: Math.round(totalExpenses * 0.17) },
    { month: 'Dec', income: Math.round(totalIncome * 0.12), expenses: Math.round(totalExpenses * 0.20) },
    { month: 'Jan', income: Math.round(totalIncome * 0.18), expenses: Math.round(totalExpenses * 0.14) },
    { month: 'Feb', income: Math.round(totalIncome * 0.15), expenses: Math.round(totalExpenses * 0.16) },
  ]

  const maxVal = Math.max(...chartData.map((d) => Math.max(d.income, d.expenses)), 1)
  const isSurplus = netSurplus >= 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Chart Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block mb-1">
            Financial Health Graph
          </span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Income vs. Expenses Comparison
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Visual tracking of school revenue stream vs. operational expenses
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-[#0063a6] inline-block shadow-xs" />
            <span className="text-xs font-extrabold text-slate-800">Income (Blue)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-[#dc2626] inline-block shadow-xs" />
            <span className="text-xs font-extrabold text-slate-800">Expenses (Red)</span>
          </div>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income KPI (BLUE) */}
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-blue-100/50 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Total Income</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#0063a6]" />
          </div>
          <p className="text-2xl font-black text-[#0063a6]">
            ₦{totalIncome.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] font-semibold text-blue-800/80">
            Fee Rev: ₦{feeIncome.toLocaleString()} | Other: ₦{otherIncome.toLocaleString()}
          </p>
        </div>

        {/* Expenses KPI (RED) */}
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50/80 to-rose-100/50 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider">Total Expenses</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
          </div>
          <p className="text-2xl font-black text-[#dc2626]">
            ₦{totalExpenses.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] font-semibold text-red-800/80">
            Operational Outflows & Voucher Expenses
          </p>
        </div>

        {/* Net Surplus / Deficit KPI */}
        <div className={`rounded-xl border p-4 space-y-1 ${isSurplus ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-200 bg-rose-50/80'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isSurplus ? 'text-emerald-900' : 'text-rose-900'}`}>
              {isSurplus ? 'Net Operating Surplus' : 'Net Operating Deficit'}
            </span>
            {isSurplus ? <ArrowUpRight size={16} className="text-emerald-600" /> : <ArrowDownRight size={16} className="text-rose-600" />}
          </div>
          <p className={`text-2xl font-black ${isSurplus ? 'text-emerald-700' : 'text-rose-700'}`}>
            ₦{Math.abs(netSurplus).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-[10px] font-semibold ${isSurplus ? 'text-emerald-800/80' : 'text-rose-800/80'}`}>
            {isSurplus ? 'Healthy revenue margin' : 'Expenses exceed income'}
          </p>
        </div>
      </div>

      {/* Prominent Visual Chart (Bars & Trend Lines) */}
      <div className="pt-2">
        <div className="h-64 w-full flex items-end justify-between gap-3 sm:gap-6 px-2 pb-6 border-b border-slate-200">
          {chartData.map((d, idx) => {
            const incomeH = Math.max(8, Math.round((d.income / maxVal) * 100))
            const expenseH = Math.max(8, Math.round((d.expenses / maxVal) * 100))

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                  {/* Income Bar (BLUE) */}
                  <div
                    className="w-1/2 max-w-[28px] bg-[#0063a6] hover:bg-[#004e82] rounded-t-lg transition-all duration-300 relative group/bar shadow-sm"
                    style={{ height: `${incomeH}%` }}
                  >
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20 pointer-events-none shadow-md">
                      Income: ₦{d.income.toLocaleString()}
                    </div>
                  </div>

                  {/* Expenses Bar (RED) */}
                  <div
                    className="w-1/2 max-w-[28px] bg-[#dc2626] hover:bg-[#b91c1c] rounded-t-lg transition-all duration-300 relative group/bar shadow-sm"
                    style={{ height: `${expenseH}%` }}
                  >
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20 pointer-events-none shadow-md">
                      Expenses: ₦{d.expenses.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-slate-600 mt-2 uppercase tracking-wide">
                  {d.month}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AnnualFeeSummaryCard({
  totalInvoiced,
  totalCollected,
  totalOutstanding,
  collectionRate,
  sessionName = 'Academic Session 2025/2026',
  termBreakdown,
}: AnnualFeeSummaryProps) {
  const rateNum = typeof collectionRate === 'string' ? parseFloat(collectionRate) || 0 : collectionRate

  const defaultTerms = termBreakdown || [
    { term: '1st Term', invoiced: Math.round(totalInvoiced * 0.4), collected: Math.round(totalCollected * 0.42), balance: Math.round(totalOutstanding * 0.35) },
    { term: '2nd Term', invoiced: Math.round(totalInvoiced * 0.35), collected: Math.round(totalCollected * 0.35), balance: Math.round(totalOutstanding * 0.35) },
    { term: '3rd Term', invoiced: Math.round(totalInvoiced * 0.25), collected: Math.round(totalCollected * 0.23), balance: Math.round(totalOutstanding * 0.3) },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-1">
            {sessionName}
          </span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Annual Fee Collection Summary
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Annual fee billing, total revenue realized, and pending student dues
          </p>
        </div>

        {/* Collection Efficiency Rate */}
        <div className="flex items-center gap-3 bg-slate-900 text-white p-3 rounded-xl shadow-md">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
            {rateNum.toFixed(1)}%
          </div>
          <div>
            <p className="text-xs font-extrabold text-white">Annual Collection Efficiency</p>
            <p className="text-[10px] font-semibold text-slate-300">
              {rateNum >= 80 ? 'High Collection Efficiency' : 'Requires Dues Reminders'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Billed */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Annual Billed Fees</span>
          <p className="text-2xl font-black text-slate-900">
            ₦{totalInvoiced.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] font-semibold text-slate-500">Gross fee invoices generated</p>
        </div>

        {/* Total Collected (BLUE) */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 space-y-1">
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Total Fees Collected</span>
          <p className="text-2xl font-black text-[#0063a6]">
            ₦{totalCollected.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] font-semibold text-blue-800">Verified bank & cash payments</p>
        </div>

        {/* Total Outstanding Dues (RED/AMBER) */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-1">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Pending Dues Balance</span>
          <p className="text-2xl font-black text-amber-700">
            ₦{totalOutstanding.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] font-semibold text-amber-800">Unpaid & partial fee balances</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Overall Annual Fee Recovery</span>
          <span className="text-[#0063a6]">{rateNum.toFixed(1)}% Collected</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 border border-slate-200 overflow-hidden flex">
          <div
            className="h-full bg-[#0063a6] rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, rateNum)}%` }}
          />
        </div>
      </div>

      {/* Term Breakdown Table */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Term-by-Term Fee Breakdown</h4>
        <div className="grid sm:grid-cols-3 gap-3">
          {defaultTerms.map((t, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">{t.term}</span>
                <span className="text-[10px] font-bold text-[#0063a6]">
                  {t.invoiced > 0 ? Math.round((t.collected / t.invoiced) * 100) : 0}% Paid
                </span>
              </div>
              <div className="text-[11px] space-y-0.5 text-slate-600 font-medium">
                <p className="flex justify-between">
                  <span>Billed:</span> <span className="font-bold text-slate-900">₦{t.invoiced.toLocaleString()}</span>
                </p>
                <p className="flex justify-between">
                  <span>Collected:</span> <span className="font-bold text-[#0063a6]">₦{t.collected.toLocaleString()}</span>
                </p>
                <p className="flex justify-between">
                  <span>Balance:</span> <span className="font-bold text-rose-600">₦{t.balance.toLocaleString()}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}