'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Users,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  Calendar,
  BarChart3,
  Trash2,
  Send,
  Building2,
  Landmark,
  PieChart,
  CheckSquare,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Bell
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { toast } from 'sonner'

export interface OverviewData {
  summary: {
    totalInvoiced: number
    totalRevenue: number
    totalOutstanding: number
    collectionRate: number
  }
  paymentTrend: Array<{ date: string; amount: number }>
  outstandingStudents: Array<{
    invoiceId: number
    invoiceNo: string
    studentName: string
    registerNo: string
    total: number
    paid: number
    balance: number
  }>
}

export interface Invoice {
  id: number
  invoiceNo: string
  termLabel: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: 'paid' | 'partial' | 'unpaid'
  dueDate: string | null
  issuedAt: string
  student: {
    firstName: string
    lastName: string
    registerNo: string
  }
  items: Array<{
    id: number
    description: string
    amount: number
  }>
}

export interface FeeType {
  id: number
  name: string
  code: string
  amount: number
  frequency: string
}

export interface FeeGroup {
  id: number
  name: string
  description?: string | null
  feeTypeIds: string
  totalAmount: number
  createdAt: string
}

export interface VoucherHead {
  id: number
  name: string
  type: 'EXPENSE' | 'INCOME'
  description?: string | null
}

export interface OfficeTransaction {
  id: number
  type: 'INCOME' | 'EXPENSE'
  voucherHeadName: string
  amount: number
  paymentMethod: string
  transactionDate: string
  referenceNo?: string | null
  description?: string | null
}

export interface SchoolBank {
  id: number
  bankName: string
  accountName: string
  accountNumber: string
  branchName?: string | null
  sortCode?: string | null
  swiftCode?: string | null
  isActive: boolean
}

export function FinancesDashboard() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'invoices' | 'bulk-collections' | 'feetypes' | 'allocation' | 'reports' | 'office-finance'
  >('overview')

  // Core Data
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [feeGroups, setFeeGroups] = useState<FeeGroup[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])

  // Office & Bank Data
  const [voucherHeads, setVoucherHeads] = useState<VoucherHead[]>([])
  const [officeTxs, setOfficeTxs] = useState<OfficeTransaction[]>([])
  const [schoolBank, setSchoolBank] = useState<SchoolBank | null>(null)
  const [reportsData, setReportsData] = useState<any>(null)

  // Loading States
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modals & Forms
  const [showBulkDuesModal, setShowBulkDuesModal] = useState(false)
  const [bulkDuesForm, setBulkDuesForm] = useState({
    classId: '',
    termLabel: 'First Term 2026',
    dueDate: '',
    selectedFeeTypeIds: [] as number[]
  })

  const [showFeeGroupModal, setShowFeeGroupModal] = useState(false)
  const [feeGroupForm, setFeeGroupForm] = useState({
    name: '',
    description: '',
    selectedFeeTypeIds: [] as number[]
  })

  const [showOfficeTxModal, setShowOfficeTxModal] = useState(false)
  const [officeTxForm, setOfficeTxForm] = useState({
    type: 'EXPENSE',
    voucherHeadName: 'School Supplies',
    amount: '',
    paymentMethod: 'Bank Transfer',
    referenceNo: '',
    description: ''
  })

  const [showVoucherHeadModal, setShowVoucherHeadModal] = useState(false)
  const [voucherHeadForm, setVoucherHeadForm] = useState({
    name: '',
    type: 'EXPENSE',
    description: ''
  })

  const [showSchoolBankModal, setShowSchoolBankModal] = useState(false)
  const [schoolBankForm, setSchoolBankForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchName: '',
    sortCode: '',
    swiftCode: ''
  })

  // Payment Recording Modal
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Bank Transfer')
  const [payReference, setPayReference] = useState('')

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [ovRes, invRes, ftRes, fgRes, clsRes, vhRes, txRes, sbRes, repRes] = await Promise.all([
        apiSlice.get<{ success: boolean; data: OverviewData }>(endpoints.admin.financesOverview).catch(() => null),
        apiSlice.get<{ success: boolean; data: Invoice[] }>(endpoints.admin.invoices()).catch(() => null),
        apiSlice.get<{ success: boolean; data: FeeType[] }>(endpoints.admin.feeTypes).catch(() => null),
        apiSlice.get<{ success: boolean; data: FeeGroup[] }>(endpoints.admin.feeGroups).catch(() => null),
        apiSlice.get<{ success: boolean; classes: any[] }>(endpoints.admin.classesSections).catch(() => null),
        apiSlice.get<{ success: boolean; data: VoucherHead[] }>(endpoints.admin.voucherHeads).catch(() => null),
        apiSlice.get<{ success: boolean; data: OfficeTransaction[] }>(endpoints.admin.officeTransactions).catch(() => null),
        apiSlice.get<{ success: boolean; data: SchoolBank }>(endpoints.admin.schoolBank).catch(() => null),
        apiSlice.get<{ success: boolean; data: any }>(endpoints.admin.financesCollectionsReport).catch(() => null)
      ])

      if (ovRes && ovRes.success) setOverview(ovRes.data)
      if (invRes && invRes.success) setInvoices(invRes.data || [])
      if (ftRes && ftRes.success) setFeeTypes(ftRes.data || [])
      if (fgRes && fgRes.success) setFeeGroups(fgRes.data || [])
      if (clsRes && clsRes.success) setClasses(clsRes.classes || [])
      if (vhRes && vhRes.success) setVoucherHeads(vhRes.data || [])
      if (txRes && txRes.success) setOfficeTxs(txRes.data || [])
      if (sbRes && sbRes.success && sbRes.data) {
        setSchoolBank(sbRes.data)
        setSchoolBankForm({
          bankName: sbRes.data.bankName || '',
          accountName: sbRes.data.accountName || '',
          accountNumber: sbRes.data.accountNumber || '',
          branchName: sbRes.data.branchName || '',
          sortCode: sbRes.data.sortCode || '',
          swiftCode: sbRes.data.swiftCode || ''
        })
      }
      if (repRes && repRes.success) setReportsData(repRes)
    } catch (e) {
      console.error('Error fetching finance initial data:', e)
    } finally {
      setLoading(false)
    }
  }

  // Handlers
  const handleBulkDuesPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkDuesForm.classId || bulkDuesForm.selectedFeeTypeIds.length === 0) {
      setFeedback({ type: 'error', message: 'Please select a Class and at least one Fee Type.' })
      return
    }
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(endpoints.admin.bulkDuesPost, {
        classId: bulkDuesForm.classId,
        termLabel: bulkDuesForm.termLabel,
        dueDate: bulkDuesForm.dueDate,
        feeTypeIds: bulkDuesForm.selectedFeeTypeIds
      })
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
        setShowBulkDuesModal(false)
        fetchInitialData()
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to bulk post class dues.' })
    }
  }

  const handleSendParentReminder = async (invoiceId: number) => {
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(endpoints.admin.sendParentReminder, { invoiceId })
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to send fee reminder.' })
    }
  }

  const handleCreateFeeGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feeGroupForm.name) return
    const selectedTypes = feeTypes.filter((ft) => feeGroupForm.selectedFeeTypeIds.includes(ft.id))
    const totalAmount = selectedTypes.reduce((acc, ft) => acc + Number(ft.amount), 0)

    try {
      await apiSlice.post(endpoints.admin.feeGroups, {
        name: feeGroupForm.name,
        description: feeGroupForm.description,
        feeTypeIds: feeGroupForm.selectedFeeTypeIds,
        totalAmount
      })
      setFeedback({ type: 'success', message: 'Fee Group created successfully.' })
      setShowFeeGroupModal(false)
      fetchInitialData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create fee group.' })
    }
  }

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payInvoice || !payAmount) return
    try {
      await apiSlice.post(endpoints.admin.bulkPaymentsPost, {
        payments: [
          {
            invoiceId: payInvoice.id,
            amountPaid: parseFloat(payAmount),
            paymentMethod: payMethod,
            reference: payReference
          }
        ]
      })
      setFeedback({ type: 'success', message: `Payment receipt logged for Invoice #${payInvoice.invoiceNo}.` })
      setPayInvoice(null)
      fetchInitialData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record payment.' })
    }
  }

  const handleSaveOfficeTx = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!officeTxForm.amount) return
    try {
      await apiSlice.post(endpoints.admin.officeTransactions, officeTxForm)
      setFeedback({ type: 'success', message: 'Office financial transaction recorded.' })
      setShowOfficeTxModal(false)
      fetchInitialData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record transaction.' })
    }
  }

  const handleSaveVoucherHead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherHeadForm.name) return
    try {
      await apiSlice.post(endpoints.admin.voucherHeads, voucherHeadForm)
      setFeedback({ type: 'success', message: 'Voucher head created.' })
      setShowVoucherHeadModal(false)
      fetchInitialData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save voucher head.' })
    }
  }

  const handleSaveSchoolBank = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiSlice.post(endpoints.admin.schoolBank, schoolBankForm)
      setFeedback({ type: 'success', message: 'School bank details updated successfully.' })
      setShowSchoolBankModal(false)
      fetchInitialData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save school bank details.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <DollarSign size={16} /> Fees, Collections & Office Finance Suite
          </div>
          <h1 className="text-2xl font-bold text-slate-900">School Bursary & Financial Desk</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage fee types, fee groups, bulk dues posting, parent reminders, reports, office transactions, and school bank setup.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkDuesModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Bulk Post Class Dues
          </button>
          <button
            onClick={() => setShowSchoolBankModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Landmark size={16} /> School Bank Setup
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              ₦{Number(overview?.summary?.totalRevenue || 0).toLocaleString()}
            </div>
            <div className="text-xs font-medium text-emerald-800">Total Fees Revenue</div>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              ₦{Number(overview?.summary?.totalOutstanding || 0).toLocaleString()}
            </div>
            <div className="text-xs font-medium text-rose-800">Total Outstanding Dues</div>
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{overview?.summary?.collectionRate || 0}%</div>
            <div className="text-xs font-medium text-indigo-800">Collection Rate</div>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Landmark size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {schoolBank ? `${schoolBank.bankName} (${schoolBank.accountNumber})` : 'Not Configured'}
            </div>
            <div className="text-xs font-medium text-blue-800">Official School Bank</div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-3 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'overview' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 size={18} /> Overview & Analytics
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'invoices' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={18} /> Invoices & Bulk Dues ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('feetypes')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'feetypes' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers size={18} /> Fee Types & Fee Groups ({feeTypes.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'reports' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <PieChart size={18} /> Collection Reports
        </button>
        <button
          onClick={() => setActiveTab('office-finance')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'office-finance' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 size={18} /> Office Finance & Bank Setup
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Students with Highest Outstanding Balances</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-semibold uppercase">
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Register No</th>
                    <th className="p-3">Total Invoiced</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3">Outstanding Balance</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700 font-medium">
                  {overview?.outstandingStudents?.map((st) => (
                    <tr key={st.invoiceId} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{st.invoiceNo}</td>
                      <td className="p-3 font-bold text-slate-800">{st.studentName}</td>
                      <td className="p-3 font-mono text-slate-500">{st.registerNo}</td>
                      <td className="p-3">₦{Number(st.total).toLocaleString()}</td>
                      <td className="p-3 text-emerald-600 font-semibold">₦{Number(st.paid).toLocaleString()}</td>
                      <td className="p-3 text-rose-600 font-bold">₦{Number(st.balance).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSendParentReminder(st.invoiceId)}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Bell size={12} /> Send Parent Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICES & BULK DUES POSTING */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => setShowBulkDuesModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> Bulk Post Class Dues
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-semibold uppercase">
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Term</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Paid</th>
                    <th className="p-4">Balance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono font-bold text-slate-900">{inv.invoiceNo}</td>
                      <td className="p-4 font-bold text-slate-800">
                        {inv.student?.firstName} {inv.student?.lastName}
                      </td>
                      <td className="p-4 text-slate-500">{inv.termLabel}</td>
                      <td className="p-4 font-bold">₦{Number(inv.totalAmount).toLocaleString()}</td>
                      <td className="p-4 text-emerald-600 font-bold">₦{Number(inv.paidAmount).toLocaleString()}</td>
                      <td className="p-4 text-rose-600 font-bold">₦{Number(inv.balanceAmount).toLocaleString()}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => {
                                setPayInvoice(inv)
                                setPayAmount(String(inv.balanceAmount))
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Record Payment
                            </button>
                          )}
                          <button
                            onClick={() => handleSendParentReminder(inv.id)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold cursor-pointer"
                            title="Send Parent Fee Reminder"
                          >
                            <Bell size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEE TYPES & FEE GROUPS */}
      {activeTab === 'feetypes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">Fee Types & Group Bundles</div>
            <button
              onClick={() => setShowFeeGroupModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> Create Fee Group Bundle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fee Types List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Individual Fee Types ({feeTypes.length})</h3>
              <div className="divide-y divide-slate-100">
                {feeTypes.map((ft) => (
                  <div key={ft.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{ft.name} ({ft.code})</div>
                      <div className="text-[11px] text-slate-400 capitalize">{ft.frequency}</div>
                    </div>
                    <div className="font-bold text-emerald-700 text-sm">₦{Number(ft.amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee Groups List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Group Fee Bundles ({feeGroups.length})</h3>
              <div className="space-y-3">
                {feeGroups.map((fg) => (
                  <div key={fg.id} className="p-4 bg-slate-50 rounded-xl border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{fg.name}</h4>
                      <span className="font-bold text-indigo-700 text-sm">₦{Number(fg.totalAmount).toLocaleString()}</span>
                    </div>
                    {fg.description && <p className="text-[11px] text-slate-500">{fg.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COLLECTION REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Fee Collection Breakdown by Fee Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportsData?.feeTypeBreakdown?.map((item: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border space-y-1">
                  <div className="text-xs font-semibold text-slate-600">{item.feeType}</div>
                  <div className="text-lg font-black text-emerald-700">₦{Number(item.totalAmount).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OFFICE FINANCE & BANK SETUP */}
      {activeTab === 'office-finance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">Office Non-Tuition Deposits & Expenses Ledger</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVoucherHeadModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> New Voucher Head
              </button>
              <button
                onClick={() => setShowOfficeTxModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Log Income / Expense
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-semibold uppercase">
                    <th className="p-4">Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Voucher Category</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Ref No</th>
                    <th className="p-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {officeTxs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-500">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">{tx.voucherHeadName}</td>
                      <td className={`p-4 font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
                      </td>
                      <td className="p-4 text-slate-500">{tx.paymentMethod}</td>
                      <td className="p-4 font-mono text-slate-400">{tx.referenceNo || 'N/A'}</td>
                      <td className="p-4 text-slate-600 max-w-xs truncate">{tx.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ALL MODAL OVERLAYS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}

      {/* MODAL 1: BULK CLASS DUES POSTING */}
      {showBulkDuesModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Bulk Post Class Dues Invoices</h2>
              <button onClick={() => setShowBulkDuesModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleBulkDuesPost} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Class *</label>
                <select
                  value={bulkDuesForm.classId}
                  onChange={(e) => setBulkDuesForm({ ...bulkDuesForm, classId: e.target.value })}
                  required
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Term Label *</label>
                <input
                  type="text"
                  value={bulkDuesForm.termLabel}
                  onChange={(e) => setBulkDuesForm({ ...bulkDuesForm, termLabel: e.target.value })}
                  required
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Due Date *</label>
                <input
                  type="date"
                  value={bulkDuesForm.dueDate}
                  onChange={(e) => setBulkDuesForm({ ...bulkDuesForm, dueDate: e.target.value })}
                  required
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Included Fee Types *</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border p-2 rounded-xl">
                  {feeTypes.map((ft) => {
                    const isChecked = bulkDuesForm.selectedFeeTypeIds.includes(ft.id)
                    return (
                      <label key={ft.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <span className="font-bold text-slate-800">{ft.name} (₦{Number(ft.amount).toLocaleString()})</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkDuesForm({ ...bulkDuesForm, selectedFeeTypeIds: [...bulkDuesForm.selectedFeeTypeIds, ft.id] })
                            } else {
                              setBulkDuesForm({
                                ...bulkDuesForm,
                                selectedFeeTypeIds: bulkDuesForm.selectedFeeTypeIds.filter((id) => id !== ft.id)
                              })
                            }
                          }}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowBulkDuesModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                  Post Class Dues
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT RECEIPT */}
      {payInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Record Fee Payment Receipt</h2>
              <button onClick={() => setPayInvoice(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-emerald-900">Invoice #{payInvoice.invoiceNo}</div>
              <div className="text-slate-600">Student: {payInvoice.student?.firstName} {payInvoice.student?.lastName}</div>
              <div className="text-rose-600 font-bold">Outstanding Balance: ₦{Number(payInvoice.balanceAmount).toLocaleString()}</div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Amount (₦) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="w-full p-2.5 border rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="p-2.5 border rounded-xl">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="POS">POS Terminal</option>
                  <option value="Cheque">Cheque</option>
                </select>
                <input
                  type="text"
                  placeholder="Ref No / Tx Hash"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setPayInvoice(null)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE FEE GROUP */}
      {showFeeGroupModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Create Fee Group Bundle</h2>
              <button onClick={() => setShowFeeGroupModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateFeeGroup} className="space-y-3 text-xs font-medium">
              <input
                type="text"
                placeholder="Group Name (e.g. Primary School Fees Group) *"
                value={feeGroupForm.name}
                onChange={(e) => setFeeGroupForm({ ...feeGroupForm, name: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl"
              />
              <textarea
                rows={2}
                placeholder="Description..."
                value={feeGroupForm.description}
                onChange={(e) => setFeeGroupForm({ ...feeGroupForm, description: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Fee Types to Bundle</label>
                <div className="space-y-1 max-h-36 overflow-y-auto border p-2 rounded-xl">
                  {feeTypes.map((ft) => {
                    const isChecked = feeGroupForm.selectedFeeTypeIds.includes(ft.id)
                    return (
                      <label key={ft.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <span className="font-bold text-slate-800">{ft.name} (₦{Number(ft.amount).toLocaleString()})</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFeeGroupForm({ ...feeGroupForm, selectedFeeTypeIds: [...feeGroupForm.selectedFeeTypeIds, ft.id] })
                            } else {
                              setFeeGroupForm({
                                ...feeGroupForm,
                                selectedFeeTypeIds: feeGroupForm.selectedFeeTypeIds.filter((id) => id !== ft.id)
                              })
                            }
                          }}
                          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                        />
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowFeeGroupModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer">
                  Create Fee Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SCHOOL BANK SETUP */}
      {showSchoolBankModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Landmark size={20} className="text-blue-600" /> School Bank Account Setup
              </h2>
              <button onClick={() => setShowSchoolBankModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveSchoolBank} className="space-y-3 text-xs font-medium">
              <input
                type="text"
                placeholder="Bank Name (e.g. First Bank of Nigeria) *"
                value={schoolBankForm.bankName}
                onChange={(e) => setSchoolBankForm({ ...schoolBankForm, bankName: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl"
              />

              <input
                type="text"
                placeholder="Account Name *"
                value={schoolBankForm.accountName}
                onChange={(e) => setSchoolBankForm({ ...schoolBankForm, accountName: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl"
              />

              <input
                type="text"
                placeholder="Account Number *"
                value={schoolBankForm.accountNumber}
                onChange={(e) => setSchoolBankForm({ ...schoolBankForm, accountNumber: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl font-mono text-sm font-bold"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Branch Name"
                  value={schoolBankForm.branchName}
                  onChange={(e) => setSchoolBankForm({ ...schoolBankForm, branchName: e.target.value })}
                  className="p-2.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Sort / SWIFT Code"
                  value={schoolBankForm.sortCode}
                  onChange={(e) => setSchoolBankForm({ ...schoolBankForm, sortCode: e.target.value })}
                  className="p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowSchoolBankModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl cursor-pointer">
                  Save Bank Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: LOG OFFICE TRANSACTION (DEPOSIT / EXPENSE) */}
      {showOfficeTxModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Record Office Income / Expense</h2>
              <button onClick={() => setShowOfficeTxModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveOfficeTx} className="space-y-3 text-xs font-medium">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={officeTxForm.type}
                  onChange={(e) => setOfficeTxForm({ ...officeTxForm, type: e.target.value })}
                  className="p-2.5 border rounded-xl font-bold"
                >
                  <option value="EXPENSE">Office Expense</option>
                  <option value="INCOME">Non-Tuition Income / Deposit</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount (₦) *"
                  value={officeTxForm.amount}
                  onChange={(e) => setOfficeTxForm({ ...officeTxForm, amount: e.target.value })}
                  required
                  className="p-2.5 border rounded-xl font-bold"
                />
              </div>

              <input
                type="text"
                placeholder="Voucher Category / Head"
                value={officeTxForm.voucherHeadName}
                onChange={(e) => setOfficeTxForm({ ...officeTxForm, voucherHeadName: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={officeTxForm.paymentMethod}
                  onChange={(e) => setOfficeTxForm({ ...officeTxForm, paymentMethod: e.target.value })}
                  className="p-2.5 border rounded-xl"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="POS">POS Terminal</option>
                  <option value="Cheque">Cheque</option>
                </select>
                <input
                  type="text"
                  placeholder="Ref No / Voucher No"
                  value={officeTxForm.referenceNo}
                  onChange={(e) => setOfficeTxForm({ ...officeTxForm, referenceNo: e.target.value })}
                  className="p-2.5 border rounded-xl"
                />
              </div>

              <textarea
                rows={2}
                placeholder="Description..."
                value={officeTxForm.description}
                onChange={(e) => setOfficeTxForm({ ...officeTxForm, description: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowOfficeTxModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: NEW VOUCHER HEAD */}
      {showVoucherHeadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">New Voucher Head Category</h2>
              <button onClick={() => setShowVoucherHeadModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveVoucherHead} className="space-y-3 text-xs font-medium">
              <input
                type="text"
                placeholder="Voucher Name (e.g. Utility & Maintenance) *"
                value={voucherHeadForm.name}
                onChange={(e) => setVoucherHeadForm({ ...voucherHeadForm, name: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl"
              />
              <select
                value={voucherHeadForm.type}
                onChange={(e) => setVoucherHeadForm({ ...voucherHeadForm, type: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="EXPENSE">Expense Category</option>
                <option value="INCOME">Income Category</option>
              </select>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowVoucherHeadModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl cursor-pointer">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
