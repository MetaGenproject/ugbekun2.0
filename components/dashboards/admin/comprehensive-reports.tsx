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
  Building2,
  Briefcase,
  CreditCard,
  MessageSquare,
  Bus,
  Sparkles,
  Bot,
  UserCheck,
  DoorOpen,
  Cpu,
  BrainCircuit,
  Search,
  Download
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { IncomeVsExpensesChart, AnnualFeeSummaryCard } from './financial-visuals'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

type MainReportCategory = 
  | 'academic' 
  | 'admin' 
  | 'financial' 
  | 'attendance' 
  | 'inventory' 
  | 'communication' 
  | 'myeduride' 
  | 'ai-reports'

export function ComprehensiveReports() {
  const [activeCategory, setActiveCategory] = useState<MainReportCategory>('academic')
  const [subTab, setSubTab] = useState<string>('student-reports')
  const [searchQuery, setSearchQuery] = useState('')

  // Report Datasets
  const [academicMetrics, setAcademicMetrics] = useState({
    totalStudents: 1250,
    avgScore: '84.2%',
    passRate: '98.5%',
    topSubject: 'Mathematics (88.4%)',
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="text-indigo-600" size={24} /> School Central Intelligence & Reports Hub
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Academic, Administrative, Financial, Attendance, Inventory, EduChat Communication, MyEduRide, and OSe AI Insights.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Exporting Master Intelligence PDF...')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Download size={15} /> Export Master Report PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Categories Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => { setActiveCategory('academic'); setSubTab('student-reports'); }}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition ${activeCategory === 'academic' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          🎓 Academic Reports
        </button>

        <button
          onClick={() => { setActiveCategory('admin'); setSubTab('admissions-reports'); }}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition ${activeCategory === 'admin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          🏛️ Administrative Reports
        </button>

        <button
          onClick={() => { setActiveCategory('financial'); setSubTab('fee-reports'); }}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition ${activeCategory === 'financial' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          💰 Financial Reports
        </button>

        <button
          onClick={() => { setActiveCategory('attendance'); setSubTab('attendance-summary'); }}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition ${activeCategory === 'attendance' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          📅 Attendance Reports
        </button>

        <button
          onClick={() => { setActiveCategory('inventory'); setSubTab('inventory-summary'); }}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition ${activeCategory === 'inventory' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          📦 Inventory Reports
        </button>

        <button
          onClick={() => { setActiveCategory('communication'); setSubTab('communication-summary'); }}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition ${activeCategory === 'communication' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          💬 Communication Reports
        </button>

        <button
          onClick={() => { setActiveCategory('myeduride'); setSubTab('gate-manager'); }}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition ${activeCategory === 'myeduride' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          🚌 MyEduRide Reports
        </button>

        <button
          onClick={() => { setActiveCategory('ai-reports'); setSubTab('ose-insights'); }}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition ${activeCategory === 'ai-reports' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          🤖 AI & OSe Insights
        </button>
      </div>

      {/* 1. ACADEMIC REPORTS */}
      {activeCategory === 'academic' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
            <button onClick={() => setSubTab('student-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'student-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Student Reports
            </button>
            <button onClick={() => setSubTab('class-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'class-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Class Reports
            </button>
            <button onClick={() => setSubTab('subject-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'subject-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Subject Reports
            </button>
            <button onClick={() => setSubTab('teacher-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'teacher-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Teacher Performance Reports
            </button>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Enrolled Students</p>
              <p className="text-2xl font-black text-slate-900 mt-1">1,250</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Overall Term Average</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">84.2%</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-indigo-50">
              <p className="text-[11px] font-bold text-indigo-700 uppercase">Pass Rate</p>
              <p className="text-2xl font-black text-indigo-950 mt-1">98.5%</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-amber-50">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Top Performing Subject</p>
              <p className="text-base font-black text-amber-950 mt-1">Mathematics (88.4%)</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMINISTRATIVE REPORTS */}
      {activeCategory === 'admin' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
            <button onClick={() => setSubTab('admissions-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'admissions-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Admissions Reports
            </button>
            <button onClick={() => setSubTab('campus-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'campus-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Campus Reports
            </button>
            <button onClick={() => setSubTab('hr-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'hr-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● HR & Staffing Reports
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium space-y-2">
            <h4 className="font-bold text-slate-900">Administrative Overview Status</h4>
            <p>• Total Admissions Applied This Session: 184 Candidates</p>
            <p>• Active Staff Members: 45 Personnel (32 Teaching, 13 Non-Teaching)</p>
            <p>• Campus Utilization: 94.5% Classroom Efficiency</p>
          </div>
        </div>
      )}

      {/* 3. FINANCIAL REPORTS */}
      {activeCategory === 'financial' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
            <button onClick={() => setSubTab('fee-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'fee-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● School Fee Reports
            </button>
            <button onClick={() => setSubTab('income-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'income-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Income Reports
            </button>
            <button onClick={() => setSubTab('expense-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'expense-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Expense Reports
            </button>
            <button onClick={() => setSubTab('payroll-reports')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'payroll-reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Payroll Reports
            </button>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Total Fee Income</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">₦185,400,000</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-rose-50">
              <p className="text-[11px] font-bold text-rose-700 uppercase">Operating Expenses</p>
              <p className="text-2xl font-black text-rose-950 mt-1">₦42,100,000</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-blue-50">
              <p className="text-[11px] font-bold text-blue-700 uppercase">Monthly Staff Payroll</p>
              <p className="text-2xl font-black text-blue-950 mt-1">₦13,365,000</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-amber-50">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Net Financial Surplus</p>
              <p className="text-2xl font-black text-amber-950 mt-1">₦129,935,000</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. ATTENDANCE REPORTS */}
      {activeCategory === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Attendance Audit Reports</h3>
          <p className="text-xs text-slate-500 font-medium">Monthly Presence Rates: 94.2% Students • 97.8% Staff.</p>
        </div>
      )}

      {/* 5. INVENTORY REPORTS */}
      {activeCategory === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Inventory Valuation & Depletion Audit Reports</h3>
          <p className="text-xs text-slate-500 font-medium">Total Asset Value: ₦76,300,000 • Total Stock Items: 1,480.</p>
        </div>
      )}

      {/* 6. COMMUNICATION REPORTS */}
      {activeCategory === 'communication' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">EduChat Communication & Broadcast Dispatch Log</h3>
          <p className="text-xs text-slate-500 font-medium">Total SMS Dispatched: 14,200 • Broadcast Delivery Rate: 99.4%.</p>
        </div>
      )}

      {/* 7. MYEDURIDE REPORTS */}
      {activeCategory === 'myeduride' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <button onClick={() => setSubTab('gate-manager')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'gate-manager' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Gate Manager Scans & Transport Log
            </button>
          </div>
          <p className="text-xs text-slate-500 font-medium">Turnstile Verified Gate Entries Today: 1,212 Scans.</p>
        </div>
      )}

      {/* 8. AI REPORTS & OSE INSIGHTS */}
      {activeCategory === 'ai-reports' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
            <button onClick={() => setSubTab('ose-insights')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'ose-insights' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● OSe Insights
            </button>
            <button onClick={() => setSubTab('performance-analytics')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'performance-analytics' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● Performance Analytics
            </button>
            <button onClick={() => setSubTab('school-intelligence')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'school-intelligence' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ● School Intelligence
            </button>
          </div>

          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-amber-400" />
              <h4 className="font-extrabold text-sm text-white">OSe AI Executive Summary Report</h4>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              "School academic performance is trending 4.2% higher than last term. Financial fee collection rate sits at an impressive 92.4%. Primary 4 Gold is currently the highest performing class arm."
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
