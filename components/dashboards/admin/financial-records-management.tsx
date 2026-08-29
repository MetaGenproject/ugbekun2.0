'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building2,
  PieChart,
  BookOpen,
  Receipt,
  Landmark,
  Target,
  Archive,
  FileText,
  History,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Wallet,
  Loader2
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

type FinancialTab = 
  | 'dashboard' 
  | 'income' 
  | 'expenses' 
  | 'payroll' 
  | 'general-ledger' 
  | 'cashbook' 
  | 'bank-accounts' 
  | 'budget' 
  | 'fixed-assets' 
  | 'financial-statements' 
  | 'audit-trail'

export function FinancialRecordsManagement() {
  const [activeTab, setActiveTab] = useState<FinancialTab>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Financial Datasets
  const [incomeEntries, setIncomeEntries] = useState<Array<{ id: string | number; category: string; amount: number; payer: string; date: string; method: string }>>([])
  const [expenseEntries, setExpenseEntries] = useState<Array<{ id: string | number; voucher: string; category: string; amount: number; vendor: string; approvedBy: string; date: string; status: string }>>([])
  const [bankAccounts, setBankAccounts] = useState<Array<{ id: string | number; bankName: string; accountNo: string; accountName: string; balance: number; type: string }>>([])
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string | number; action: string; user: string; timestamp: string; ip: string }>>([])

  useEffect(() => {
    async function loadLiveFinancials() {
      setLoading(true)
      try {
        const [txsRes, bankRes] = await Promise.all([
          apiSlice.get<{ success: boolean; data: any[] }>(endpoints.admin.officeTransactions).catch(() => ({ success: false, data: [] })),
          apiSlice.get<{ success: boolean; data: any }>(endpoints.admin.schoolBank).catch(() => ({ success: false, data: null }))
        ])

        if (txsRes.success && Array.isArray(txsRes.data)) {
          const incomes = txsRes.data
            .filter((t: any) => t.type === 'INCOME')
            .map((t: any) => ({
              id: t.id,
              category: t.voucherHead?.name || 'School Revenue',
              amount: Number(t.amount) || 0,
              payer: t.description || 'Institutional Payer',
              date: t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : '',
              method: t.paymentMethod || 'Bank Transfer'
            }))
          setIncomeEntries(incomes)

          const expenses = txsRes.data
            .filter((t: any) => t.type === 'EXPENSE')
            .map((t: any) => ({
              id: t.id,
              voucher: t.referenceNo || `VCH-${t.id}`,
              category: t.voucherHead?.name || 'Operational Expense',
              amount: Number(t.amount) || 0,
              vendor: t.description || 'Vendor / Supplier',
              approvedBy: 'Admin',
              date: t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : '',
              status: 'Paid'
            }))
          setExpenseEntries(expenses)
        }

        if (bankRes.success && bankRes.data) {
          const b = bankRes.data
          setBankAccounts([{
            id: b.id || 1,
            bankName: b.bankName || 'Institutional Bank',
            accountNo: b.accountNumber || '—',
            accountName: b.accountName || 'School Main Account',
            balance: Number(b.balance) || 0,
            type: 'Operational Account'
          }])
        }
      } catch (err) {
        console.warn('Failed to load live financial records:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLiveFinancials()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Landmark className="text-emerald-600" size={24} /> Financial Records & Accounting Ledger Suite
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              General ledger, cashbook, bank accounts, expenses vouchers, payroll, budgets, fixed assets, and financial statements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Generating Full Financial Audit Statement PDF...')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Download size={15} /> Export Financial Audit Statement
            </button>
          </div>
        </div>
      </div>

      {/* 11 Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📊 Financial Dashboard
        </button>
        <button onClick={() => setActiveTab('income')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📥 Income Ledgers
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'expenses' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📤 Expense Vouchers
        </button>
        <button onClick={() => setActiveTab('payroll')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'payroll' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          💼 Payroll Records
        </button>
        <button onClick={() => setActiveTab('general-ledger')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'general-ledger' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📖 General Ledger
        </button>
        <button onClick={() => setActiveTab('cashbook')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'cashbook' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📓 Cashbook
        </button>
        <button onClick={() => setActiveTab('bank-accounts')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'bank-accounts' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🏦 Bank Accounts
        </button>
        <button onClick={() => setActiveTab('budget')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'budget' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🎯 Department Budget
        </button>
        <button onClick={() => setActiveTab('fixed-assets')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'fixed-assets' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🏛️ Fixed Assets
        </button>
        <button onClick={() => setActiveTab('financial-statements')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'financial-statements' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📈 Financial Statements
        </button>
        <button onClick={() => setActiveTab('audit-trail')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'audit-trail' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📜 Audit Trail
        </button>
      </div>

      {/* 1. FINANCIAL DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-black text-emerald-600">₦185,400,000</p>
              <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1"><ArrowUpRight size={12} /> +14.2% vs Last Session</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operating Expenses</p>
              <p className="text-2xl font-black text-rose-600">₦42,100,000</p>
              <p className="text-[10px] font-bold text-rose-700 flex items-center gap-1"><ArrowDownRight size={12} /> Within Budget Allocation</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Surplus</p>
              <p className="text-2xl font-black text-indigo-600">₦143,300,000</p>
              <p className="text-[10px] font-bold text-indigo-700">Healthy Working Capital</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Balance Liquidity</p>
              <p className="text-2xl font-black text-slate-900">₦98,200,000</p>
              <p className="text-[10px] font-bold text-slate-500">2 Active Accounts</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. INCOME */}
      {activeTab === 'income' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-base text-slate-900">Non-Fee Income & Revenue Receipts</h3>
            <button onClick={() => alert('Record Non-Fee Income...')} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">+ Record Income</button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Ref ID</TableHead><TableHead>Category / Description</TableHead><TableHead>Payer / Source</TableHead><TableHead>Payment Method</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount (₦)</TableHead></TableRow></TableHeader>
            <TableBody>
              {incomeEntries.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono font-bold text-emerald-700">{i.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{i.category}</TableCell>
                  <TableCell className="text-xs text-slate-600">{i.payer}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">{i.method}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{i.date}</TableCell>
                  <TableCell className="text-right font-mono font-black text-emerald-700">₦{i.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 3. EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-base text-slate-900">Expense Vouchers & Payment Ledgers</h3>
            <button onClick={() => alert('Create Expense Voucher...')} className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl">+ Raise Expense Voucher</button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Voucher ID</TableHead><TableHead>Category / Description</TableHead><TableHead>Vendor / Beneficiary</TableHead><TableHead>Approved By</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount (₦)</TableHead></TableRow></TableHeader>
            <TableBody>
              {expenseEntries.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono font-bold text-rose-700">{e.voucher}</TableCell>
                  <TableCell className="font-bold text-slate-900">{e.category}</TableCell>
                  <TableCell className="text-xs text-slate-600">{e.vendor}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">{e.approvedBy}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{e.date}</TableCell>
                  <TableCell className="text-right font-mono font-black text-rose-700">₦{e.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 4. PAYROLL */}
      {activeTab === 'payroll' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Monthly Staff Payroll Disbursement Ledgers</h3>
          <p className="text-xs text-slate-500 font-medium">July 2026 Payroll: Total Net Salaries ₦13,365,000 • PAYE Tax ₦1,420,000 • Pension ₦940,000.</p>
        </div>
      )}

      {/* 5. GENERAL LEDGER */}
      {activeTab === 'general-ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Double-Entry General Ledger & Chart of Accounts</h3>
          <p className="text-xs text-slate-500 font-medium">Assets, Liabilities, Equity, Revenue, and Expense Control Accounts.</p>
        </div>
      )}

      {/* 6. CASHBOOK */}
      {activeTab === 'cashbook' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Daily Petty Cash & Cashbook Inflow/Outflow Register</h3>
          <p className="text-xs text-slate-500 font-medium">Opening Cash Balance: ₦250,000 • Total Disbursed: ₦85,000 • Closing Cash: ₦165,000.</p>
        </div>
      )}

      {/* 7. BANK ACCOUNTS */}
      {activeTab === 'bank-accounts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">School Commercial Bank Accounts & Reconciliation</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Account Ref</TableHead><TableHead>Bank Name</TableHead><TableHead>Account Number</TableHead><TableHead>Account Name</TableHead><TableHead className="text-right">Ledger Balance (₦)</TableHead></TableRow></TableHeader>
            <TableBody>
              {bankAccounts.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{b.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{b.bankName}</TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-700">{b.accountNo}</TableCell>
                  <TableCell className="text-xs text-slate-600">{b.accountName}</TableCell>
                  <TableCell className="text-right font-mono font-black text-emerald-700">₦{b.balance.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 8. BUDGET */}
      {activeTab === 'budget' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Annual Departmental Budget Allocation & Variance</h3>
          <p className="text-xs text-slate-500 font-medium font-medium">Academic Dept: ₦22M Allocated (72% Utilized) • Admin Dept: ₦15M Allocated (68% Utilized).</p>
        </div>
      )}

      {/* 9. FIXED ASSETS */}
      {activeTab === 'fixed-assets' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Fixed Asset Valuation & Depreciation Schedule</h3>
          <p className="text-xs text-slate-500 font-medium font-medium">Campus Buildings: ₦65M • Vehicles & Buses: ₦8.5M • Equipment: ₦2.8M.</p>
        </div>
      )}

      {/* 10. FINANCIAL STATEMENTS */}
      {activeTab === 'financial-statements' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 max-w-xl mx-auto text-center">
          <FileText size={32} className="text-emerald-600 mx-auto" />
          <h3 className="font-black text-base text-slate-900">Audited Financial Statements</h3>
          <p className="text-xs text-slate-500 font-medium">Generate Profit & Loss (P&L), Balance Sheet, and Cashflow Statements.</p>
          <button onClick={() => alert('Exporting Audited P&L Statement...')} className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl">Generate P&L & Balance Sheet</button>
        </div>
      )}

      {/* 11. AUDIT TRAIL */}
      {activeTab === 'audit-trail' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Financial Transaction Security Audit Trail</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Audit Ref</TableHead><TableHead>Transaction Action</TableHead><TableHead>User Account</TableHead><TableHead>IP Address</TableHead><TableHead>Date & Time</TableHead></TableRow></TableHeader>
            <TableBody>
              {auditLogs.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{l.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{l.action}</TableCell>
                  <TableCell className="text-xs text-slate-600">{l.user}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{l.ip}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{l.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
