'use client'

import { useEffect, useState } from 'react'
import { 
  DollarSign, TrendingUp, CreditCard, Download, FileText, Plus, RefreshCw, 
  Users, CheckCircle2, AlertTriangle, HelpCircle, Layers, Calendar, BarChart3,
  Trash2, Send
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { toast } from 'sonner'

interface OverviewData {
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

interface Invoice {
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

interface FeeType {
  id: number
  name: string
  code: string
  amount: number
  frequency: string
}

interface StudentOption {
  id: number
  registerNo: string
  firstName: string
  lastName: string
  className?: string
  enrolls?: Array<{
    class: {
      id: number
      name: string
    }
  }>
}

export function FinancesDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'feetypes' | 'allocation'>('overview')
  
  // Data
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  
  // States
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Invoices pagination
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1)

  // Modals state
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)
  const [isCreatingFeeType, setIsCreatingFeeType] = useState(false)

  // New Invoice Form
  const [invStudentId, setInvStudentId] = useState('')
  const [invTermLabel, setInvTermLabel] = useState('First Term')
  const [invSelectedFeeTypes, setInvSelectedFeeTypes] = useState<number[]>([])
  const [invDueDate, setInvDueDate] = useState('')

  // Record Payment Form
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payReference, setPayReference] = useState('')
  const [payNotes, setPayNotes] = useState('')

  // Batch Fee Types Form
  interface BatchFeeItem {
    name: string
    code: string
    amount: string
    frequency: string
  }
  const [batchFees, setBatchFees] = useState<BatchFeeItem[]>([
    { name: '', code: '', amount: '', frequency: 'per_term' }
  ])

  // Fee Allocations Tab State
  const [allocClassId, setAllocClassId] = useState('')
  const [allocSelectedFees, setAllocSelectedFees] = useState<Record<number, { selected: boolean; isOptional: boolean }>>({})
  const [bulkTermLabel, setBulkTermLabel] = useState('First Term')
  const [bulkDueDate, setBulkDueDate] = useState('')
  const [bulkGenerating, setBulkGenerating] = useState(false)

  // Load Overview Data
  const loadOverview = async () => {
    setLoading(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: OverviewData }>(
        endpoints.admin.financesOverview
      )
      setOverview(res.data)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load financial overview.')
    } finally {
      setLoading(false)
    }
  }

  // Load Invoices
  const loadInvoices = async () => {
    setLoading(true)
    try {
      const queryParams = `?page=${invoicePage}&limit=10&search=${encodeURIComponent(searchQuery)}`
        + (statusFilter ? `&status=${statusFilter}` : '')
      const res = await apiSlice.get<{ success: boolean; data: Invoice[]; pagination: { totalPages: number } }>(
        endpoints.admin.invoices(queryParams)
      )
      setInvoices(res.data)
      setInvoiceTotalPages(res.pagination.totalPages || 1)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invoices list.')
    } finally {
      setLoading(false)
    }
  }

  // Load Fee Types
  const loadFeeTypes = async () => {
    setLoading(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: FeeType[] }>(
        endpoints.admin.feeTypes
      )
      setFeeTypes(res.data)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load fee configurations.')
    } finally {
      setLoading(false)
    }
  }

  // Load option selections
  const loadOptions = async () => {
    setLoadingOptions(true)
    try {
      const [stdRes, feeRes, classRes, assignRes] = await Promise.all([
        apiSlice.get<{ success: boolean; data: { students: StudentOption[] } }>(endpoints.admin.studentsParents),
        apiSlice.get<{ success: boolean; data: FeeType[] }>(endpoints.admin.feeTypes),
        apiSlice.get<{ success: boolean; classes: any[] }>(endpoints.admin.classesSections),
        apiSlice.get<{ success: boolean; data: any[] }>(endpoints.admin.feeAssignments)
      ])
      setStudents(stdRes.data.students || [])
      setFeeTypes(feeRes.data || [])
      setClasses(classRes.classes || [])
      setAssignments(assignRes.data || [])
    } catch (err: any) {
      toast.error('Failed to load active directory options.')
    } finally {
      setLoadingOptions(false)
    }
  }

  const loadFeeAssignments = async () => {
    setLoadingAssignments(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: any[] }>(
        endpoints.admin.feeAssignments
      )
      setAssignments(res.data || [])
    } catch (err: any) {
      toast.error('Failed to load class fee assignments.')
    } finally {
      setLoadingAssignments(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview()
    } else if (activeTab === 'invoices') {
      loadInvoices()
      loadOptions()
    } else if (activeTab === 'feetypes') {
      loadFeeTypes()
    } else if (activeTab === 'allocation') {
      loadOptions()
      loadFeeAssignments()
    }
  }, [activeTab, invoicePage, statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInvoicePage(1)
    loadInvoices()
  }

  // Generate Invoice Action
  const handleGenerateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invStudentId || invSelectedFeeTypes.length === 0) {
      toast.error('Please select a student and at least one fee type.')
      return
    }

    setLoading(true)
    try {
      const res = await apiSlice.post(endpoints.admin.createInvoice, {
        studentId: parseInt(invStudentId, 10),
        termLabel: invTermLabel,
        feeTypeIds: invSelectedFeeTypes,
        dueDate: invDueDate || null
      })
      toast.success(res.message || 'Invoice generated successfully.')
      setIsCreatingInvoice(false)
      setInvStudentId('')
      setInvSelectedFeeTypes([])
      setInvDueDate('')
      if (activeTab === 'invoices') loadInvoices()
      if (activeTab === 'overview') loadOverview()
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate invoice.')
    } finally {
      setLoading(false)
    }
  }

  // Toggle fee selection
  const handleFeeToggle = (id: number) => {
    setInvSelectedFeeTypes(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    )
  }

  // Record manual Payment
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payInvoice || !payAmount) return

    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please specify a positive payment amount.')
      return
    }

    setLoading(true)
    try {
      const res = await apiSlice.post(endpoints.admin.recordPayment, {
        invoiceId: payInvoice.id,
        amount,
        method: payMethod,
        reference: payReference,
        notes: payNotes
      })
      toast.success(res.message || 'Manual payment recorded successfully.')
      setIsRecordingPayment(false)
      setPayInvoice(null)
      setPayAmount('')
      setPayReference('')
      setPayNotes('')
      if (activeTab === 'invoices') loadInvoices()
      if (activeTab === 'overview') loadOverview()
    } catch (err: any) {
      toast.error(err.message || 'Failed to record manual payment.')
    } finally {
      setLoading(false)
    }
  }

  // Batch Fee Row Helpers
  const addBatchFeeRow = () => {
    setBatchFees(prev => [...prev, { name: '', code: '', amount: '', frequency: 'per_term' }])
  }

  const updateBatchFeeRow = (index: number, field: 'name' | 'code' | 'amount' | 'frequency', value: string) => {
    setBatchFees(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const deleteBatchFeeRow = (index: number) => {
    if (batchFees.length === 1) return
    setBatchFees(prev => prev.filter((_, idx) => idx !== index))
  }

  // Create new Fee Types in batch
  const handleCreateFeeTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const invalid = batchFees.some(f => !f.name.trim() || !f.code.trim() || !f.amount)
    if (invalid) {
      toast.error('Please fill in name, unique code, and amount for all fee rows.')
      return
    }

    setLoading(true)
    try {
      const payload = batchFees.map(f => ({
        name: f.name.trim(),
        code: f.code.trim().toUpperCase(),
        amount: parseFloat(f.amount),
        frequency: f.frequency
      }))

      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.feeTypesBulk,
        { feeTypes: payload }
      )
      toast.success(res.message || 'Fee categories configured.')
      setIsCreatingFeeType(false)
      setBatchFees([{ name: '', code: '', amount: '', frequency: 'per_term' }])
      if (activeTab === 'feetypes') loadFeeTypes()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create fee categories.')
    } finally {
      setLoading(false)
    }
  }

  // Auto pre-select mandatory class fees when student is selected
  useEffect(() => {
    if (!invStudentId) {
      setInvSelectedFeeTypes([])
      return
    }
    const student = students.find(s => s.id === parseInt(invStudentId, 10))
    if (student && student.enrolls && student.enrolls.length > 0) {
      const classId = student.enrolls[0].class.id
      const classMandatoryFees = assignments
        .filter(a => a.classId === classId && !a.isOptional)
        .map(a => a.feeTypeId)
      
      setInvSelectedFeeTypes(classMandatoryFees)
    } else {
      setInvSelectedFeeTypes([])
    }
  }, [invStudentId, assignments, students])

  // Sync allocSelectedFees with selected class assignments
  useEffect(() => {
    if (!allocClassId) {
      setAllocSelectedFees({})
      return
    }
    
    const classId = parseInt(allocClassId, 10)
    const classAssignments = assignments.filter(a => a.classId === classId)
    
    const initialSelections: Record<number, { selected: boolean; isOptional: boolean }> = {}
    
    feeTypes.forEach(ft => {
      const found = classAssignments.find(a => a.feeTypeId === ft.id)
      if (found) {
        initialSelections[ft.id] = { selected: true, isOptional: found.isOptional }
      } else {
        initialSelections[ft.id] = { selected: false, isOptional: false }
      }
    })
    
    setAllocSelectedFees(initialSelections)
  }, [allocClassId, assignments, feeTypes])

  // Save fee assignments
  const handleSaveAllocations = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocClassId) {
      toast.error('Please select a class.')
      return
    }

    setLoading(true)
    try {
      const classId = parseInt(allocClassId, 10)
      const payloadAllocations = Object.entries(allocSelectedFees)
        .filter(([_, value]) => value.selected)
        .map(([feeTypeId, value]) => ({
          feeTypeId: parseInt(feeTypeId, 10),
          isOptional: value.isOptional
        }))

      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.feeAssignments,
        {
          classId,
          allocations: payloadAllocations
        }
      )
      toast.success(res.message || 'Fee allocations updated successfully.')
      
      // Reload assignments
      const assignRes = await apiSlice.get<{ success: boolean; data: any[] }>(endpoints.admin.feeAssignments)
      setAssignments(assignRes.data || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to update fee allocations.')
    } finally {
      setLoading(false)
    }
  }

  // Bulk generate invoices
  const handleBulkGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocClassId) {
      toast.error('Please select a class.')
      return
    }

    setBulkGenerating(true)
    try {
      const classId = parseInt(allocClassId, 10)
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.bulkInvoice,
        {
          classId,
          termLabel: bulkTermLabel,
          dueDate: bulkDueDate || null
        }
      )
      toast.success(res.message || 'Bulk invoicing completed.')
      setBulkDueDate('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to bulk generate invoices.')
    } finally {
      setBulkGenerating(false)
    }
  }

  // File exports
  const exportCsv = () => {
    toast.info('Downloading CSV outstanding balances report...')
    apiSlice.download(
      endpoints.admin.exportFinancesCsv,
      'financial_outstanding_balances.csv'
    ).catch(err => toast.error(err.message || 'CSV download failed.'))
  }

  const exportPdf = () => {
    toast.info('Generating PDF financial statement...')
    apiSlice.download(
      endpoints.admin.exportFinancesPdf,
      'financial_outstanding_report.pdf'
    ).catch(err => toast.error(err.message || 'PDF export failed.'))
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 md:p-8 shadow-md overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2.5">
            <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block">
              Enterprise Accounting
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Finances & Fees Desk</h1>
            <p className="text-white/80 text-sm max-w-xl font-medium">
              Manage billing structures, log manual tuition payments, track outstanding student balances, and export financial summaries.
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={exportPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <FileText size={14} /> Audit PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-sm max-w-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'overview' 
              ? 'bg-slate-100 text-slate-800 border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 size={14} /> Overview
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'invoices' 
              ? 'bg-slate-100 text-slate-800 border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={14} /> Invoices Ledger
        </button>
        <button
          onClick={() => setActiveTab('feetypes')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'feetypes' 
              ? 'bg-slate-100 text-slate-800 border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign size={14} /> Fee Setup
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'allocation' 
              ? 'bg-slate-100 text-slate-800 border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={14} /> Fee Allocation
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-scale-in">
          {/* Stat Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
                <h3 className="text-xl font-black text-slate-900">
                  ₦ {overview?.summary.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
                </h3>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
                <Layers size={18} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue / Collected</p>
                <h3 className="text-xl font-black text-emerald-600">
                  ₦ {overview?.summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-500">
                <DollarSign size={18} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
                <h3 className="text-xl font-black text-red-600">
                  ₦ {overview?.summary.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
                </h3>
              </div>
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500">
                <AlertTriangle size={18} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collection Rate</p>
                <h3 className="text-xl font-black text-indigo-600">
                  {overview?.summary.collectionRate.toFixed(1) ?? '0.0'}%
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-500">
                <TrendingUp size={18} />
              </div>
            </div>
          </div>

          {/* Top Outstanding Student Balances */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Top Outstanding Accounts</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Top student balances requiring fee follow-up.</p>
              </div>
              <button 
                onClick={loadOverview} 
                className="p-1 hover:bg-slate-50 text-slate-500 rounded transition"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading outstanding accounts...</div>
            ) : !overview || overview.outstandingStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No outstanding student accounts for this term.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Total Billing</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Remaining Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.outstandingStudents.map((stud) => (
                    <TableRow key={stud.invoiceId}>
                      <TableCell className="font-semibold text-slate-800 text-xs">{stud.invoiceNo}</TableCell>
                      <TableCell className="text-xs font-semibold">{stud.studentName} ({stud.registerNo})</TableCell>
                      <TableCell className="text-xs">₦ {stud.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-emerald-600 font-medium">₦ {stud.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-red-600 font-bold">₦ {stud.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* INVOICES LEDGER TAB */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 animate-scale-in">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Search invoices by student name or invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition"
              >
                Filter
              </button>
            </form>
            
            <button
              onClick={() => {
                loadOptions()
                setIsCreatingInvoice(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              <Plus size={14} /> New Invoice
            </button>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading ledger invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No invoices generated for this selection.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-semibold text-slate-800 text-xs">{inv.invoiceNo}</TableCell>
                        <TableCell className="text-xs font-semibold">
                          {inv.student.firstName} {inv.student.lastName} ({inv.student.registerNo})
                        </TableCell>
                        <TableCell className="text-xs">{inv.termLabel}</TableCell>
                        <TableCell className="text-xs">₦ {inv.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-emerald-600">₦ {inv.paidAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-slate-900 font-bold">₦ {inv.balanceAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'paid' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : inv.status === 'partial'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {inv.status.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => {
                                setPayInvoice(inv)
                                setIsRecordingPayment(true)
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-bold text-xs transition cursor-pointer"
                            >
                              <CreditCard size={12} /> Pay
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50 text-xs">
                  <span className="text-slate-500">Page {invoicePage} of {invoiceTotalPages}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={invoicePage === 1}
                      onClick={() => setInvoicePage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      disabled={invoicePage === invoiceTotalPages}
                      onClick={() => setInvoicePage(prev => Math.min(invoiceTotalPages, prev + 1))}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FEE SETUP TAB */}
      {activeTab === 'feetypes' && (
        <div className="space-y-4 animate-scale-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Fee Config Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">Define structured billing templates to assign to student invoices.</p>
            </div>
            <button
              onClick={() => setIsCreatingFeeType(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              <Plus size={14} /> New Category
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading fee categories...</div>
            ) : feeTypes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No fee categories registered for this branch.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Default Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeTypes.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-semibold text-slate-800 text-xs">{fee.code}</TableCell>
                      <TableCell className="text-xs font-semibold">{fee.name}</TableCell>
                      <TableCell className="text-xs capitalize">{fee.frequency.replace('_', ' ')}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-900">
                        ₦ {fee.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* FEE ALLOCATION & BULK INVOICING TAB */}
      {activeTab === 'allocation' && (
        <div className="space-y-6 animate-scale-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Class Fee Allocations & Bulk Invoicing</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign fee categories to specific classes, determine if they are optional, and issue invoices to entire classrooms in bulk.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Select Academic Class *
              </label>
              <select
                value={allocClassId}
                onChange={(e) => setAllocClassId(e.target.value)}
                className="max-w-xs w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white transition cursor-pointer"
              >
                <option value="">-- Select Class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {allocClassId && (
            <div className="grid md:grid-cols-2 gap-6 items-start">
              {/* Fee Allocation Matrix Card */}
              <form onSubmit={handleSaveAllocations} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Layers className="text-blue-600" size={16} />
                    Fee Allocation Checklist
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">Select which fees apply to this class and toggle mandatory/optional status.</p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {feeTypes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No fee categories configured. Set them up in Fee Setup first.</p>
                  ) : (
                    feeTypes.map((ft) => {
                      const selection = allocSelectedFees[ft.id] || { selected: false, isOptional: false };
                      return (
                        <div key={ft.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-xl hover:bg-slate-100/70 transition">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selection.selected}
                              onChange={(e) => {
                                setAllocSelectedFees(prev => ({
                                  ...prev,
                                  [ft.id]: { ...prev[ft.id], selected: e.target.checked }
                                }))
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-800">{ft.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{ft.code} • ₦{ft.amount.toLocaleString()}</p>
                            </div>
                          </label>

                          <div className="flex items-center gap-2">
                            <label className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                              !selection.selected 
                                ? 'opacity-40 pointer-events-none bg-slate-100 border-slate-200 text-slate-400' 
                                : selection.isOptional
                                ? 'bg-amber-50 border-amber-200 text-amber-600'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            }`}>
                              <input
                                type="checkbox"
                                disabled={!selection.selected}
                                checked={selection.isOptional}
                                onChange={(e) => {
                                  setAllocSelectedFees(prev => ({
                                    ...prev,
                                    [ft.id]: { ...prev[ft.id], isOptional: e.target.checked }
                                  }))
                                }}
                                className="sr-only"
                              />
                              {selection.isOptional ? 'Optional' : 'Mandatory'}
                            </label>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    Save Class Allocations
                  </button>
                </div>
              </form>

              {/* Bulk Invoicing Card */}
              <form onSubmit={handleBulkGenerateInvoices} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Send className="text-indigo-600 -rotate-45" size={16} />
                    Class Bulk Invoice Generator
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">Issue invoices to all students in this class in a single batch.</p>
                </div>

                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-[11px] text-indigo-700 font-medium leading-relaxed">
                  ⚠️ <strong>Notice:</strong> This action will automatically draft unpaid invoices for all active students enrolled in this class for the selected term.
                  <br />
                  <br />
                  It includes only the <strong>mandatory (non-optional)</strong> fee categories assigned to this class. Optional fees (like lessons, books, or transport) are left off the bulk list and can be manually added on student records as needed.
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Target Academic Term *
                    </label>
                    <select
                      value={bulkTermLabel}
                      onChange={(e) => setBulkTermLabel(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white transition cursor-pointer"
                      required
                    >
                      <option value="First Term">First Term</option>
                      <option value="Second Term">Second Term</option>
                      <option value="Third Term">Third Term</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Payment Due Date
                    </label>
                    <input
                      type="date"
                      value={bulkDueDate}
                      onChange={(e) => setBulkDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white transition cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={bulkGenerating}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    {bulkGenerating ? 'Generating Invoices...' : 'Bulk Generate Invoices'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {isCreatingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleGenerateInvoiceSubmit} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-md w-full space-y-4 animate-scale-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-black text-slate-900">Create Student Invoice</h3>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Select Student *</label>
                <select
                  value={invStudentId}
                  onChange={(e) => setInvStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  required
                  disabled={loadingOptions}
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => {
                    const cName = s.enrolls?.[0]?.class?.name || 'No Class Assigned'
                    return (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.registerNo}) — {cName}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Term Label *</label>
                <select
                  value={invTermLabel}
                  onChange={(e) => setInvTermLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  required
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Due Date</label>
                <input
                  type="date"
                  value={invDueDate}
                  onChange={(e) => setInvDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-600 block">Select Bills / Fee Types *</label>
                <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 bg-slate-50/50">
                  {feeTypes.map(f => {
                    const student = students.find(s => s.id === parseInt(invStudentId, 10))
                    const classId = student?.enrolls?.[0]?.class?.id
                    const classAssignment = assignments.find(a => a.classId === classId && a.feeTypeId === f.id)
                    const isMandatory = classAssignment && !classAssignment.isOptional
                    const isOptional = classAssignment && classAssignment.isOptional

                    return (
                      <label key={f.id} className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={invSelectedFeeTypes.includes(f.id)}
                            onChange={() => handleFeeToggle(f.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                          <div>
                            <span className="font-semibold text-slate-700">{f.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({f.code} - ₦{f.amount.toLocaleString()})</span>
                          </div>
                        </div>
                        <div>
                          {isMandatory && (
                            <span className="text-[8px] font-extrabold uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">
                              Mandatory
                            </span>
                          )}
                          {isOptional && (
                            <span className="text-[8px] font-extrabold uppercase bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">
                              Optional
                            </span>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingInvoice(false)}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || invSelectedFeeTypes.length === 0}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition"
              >
                {loading ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isRecordingPayment && payInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleRecordPaymentSubmit} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-sm w-full space-y-4 animate-scale-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">Record Fee Payment</h3>
            </div>

            <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-bold text-slate-700">{payInvoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Billing:</span>
                <span className="font-semibold text-slate-700">₦ {payInvoice.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/80 pt-1 mt-1 font-bold">
                <span className="text-slate-600">Remaining Balance:</span>
                <span className="text-red-600">₦ {payInvoice.balanceAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Payment Amount (NGN) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={payInvoice.balanceAmount}
                  placeholder={`Max: ${payInvoice.balanceAmount}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Transaction Reference / Receipt No</label>
                <input
                  type="text"
                  placeholder="e.g. Bank slip transaction number"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Internal Audit Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRecordingPayment(false)
                  setPayInvoice(null)
                }}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !payAmount}
                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
              >
                {loading ? 'Recording...' : 'Submit Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE FEE TYPE MODAL (BATCH ADD) */}
      {isCreatingFeeType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateFeeTypeSubmit} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-2xl w-full space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-800">Batch Configure Fee Categories</h3>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                {batchFees.length} Row{batchFees.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {batchFees.map((fee, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3.5 bg-slate-50 border border-slate-150 rounded-xl relative">
                  <div className="col-span-12 md:col-span-4 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Tuition Fee"
                      value={fee.name}
                      onChange={(e) => updateBatchFeeRow(index, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="col-span-6 md:col-span-3 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Unique Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. TUI-G1"
                      value={fee.code}
                      onChange={(e) => updateBatchFeeRow(index, 'code', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Amount (₦) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50000"
                      value={fee.amount}
                      onChange={(e) => updateBatchFeeRow(index, 'amount', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="col-span-10 md:col-span-2 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Cycle *</label>
                    <select
                      value={fee.frequency}
                      onChange={(e) => updateBatchFeeRow(index, 'frequency', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="per_term">Per Term</option>
                      <option value="annual">Annual</option>
                      <option value="one_off">One Off</option>
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1 flex justify-center pb-0.5">
                    {batchFees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteBatchFeeRow(index)}
                        className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg transition active:scale-95 cursor-pointer"
                        title="Remove Category Row"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={addBatchFeeRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition active:scale-95 cursor-pointer"
              >
                <Plus size={12} /> Add More Category
              </button>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingFeeType(false)
                    setBatchFees([{ name: '', code: '', amount: '', frequency: 'per_term' }])
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-600/10"
                >
                  {loading ? 'Configuring...' : `Save ${batchFees.length} Fee Categories`}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
