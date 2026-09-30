'use client'

import React, { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  Calendar,
  User,
  ArrowRight,
  Printer,
  RefreshCw,
  Plus,
  TrendingUp,
  Clock,
  ChevronRight,
  ShieldCheck,
  Phone,
  FileText,
  BadgeCheck,
  Loader2,
  Sparkles
} from 'lucide-react'
import { FeeReceiptModal } from './fee-management-modals'

interface StudentSummary {
  id: number
  firstName: string
  lastName: string
  fullName: string
  registerNo: string
  photo?: string | null
  gender?: string
  classId?: number | null
  className: string
  sectionName: string
  parentName: string
  parentMobile: string
  totalInvoiced: number
  totalPaid: number
  totalBalance: number
  status: 'paid' | 'partial' | 'unpaid' | 'no_invoice'
  invoicesCount: number
  invoices: any[]
}

export function FeesCollectionDesk({
  classes = [],
  sessionId,
  onRefreshParent,
}: {
  classes: any[]
  sessionId?: string
  onRefreshParent?: () => void
}) {
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('due') // default to students with dues!
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null)

  // Recent Collections Stream
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [isLoadingRecent, setIsLoadingRecent] = useState(false)

  // Payment Collection Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Cash')
  const [payReference, setPayReference] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Fetch students with fee summaries
  const fetchStudentSummaries = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.append('search', searchQuery.trim())
      if (selectedClassId) params.append('classId', selectedClassId)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (sessionId) params.append('sessionId', sessionId)

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await apiSlice.get<{ success: boolean; data: StudentSummary[] }>(
        endpoints.admin.studentFeeSummaries(queryString)
      )
      if (res?.success && Array.isArray(res.data)) {
        setStudents(res.data)
        // Keep selected student updated if already selected
        if (selectedStudent) {
          const updated = res.data.find((s) => s.id === selectedStudent.id)
          if (updated) setSelectedStudent(updated)
        }
      }
    } catch (err: any) {
      console.error('Fetch student fee summaries error:', err)
      toast.error('Failed to load student fee records.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch recent payments across the school
  const fetchRecentPayments = async () => {
    setIsLoadingRecent(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: any[] }>(
        endpoints.admin.recentPayments('?limit=25')
      )
      if (res?.success && Array.isArray(res.data)) {
        setRecentPayments(res.data)
      }
    } catch (err) {
      console.error('Fetch recent payments error:', err)
    } finally {
      setIsLoadingRecent(false)
    }
  }

  useEffect(() => {
    fetchStudentSummaries()
  }, [selectedClassId, statusFilter, sessionId])

  useEffect(() => {
    fetchRecentPayments()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchStudentSummaries()
  }

  // Open Payment Collection Modal
  const openCollectPaymentModal = (student: StudentSummary, invoice?: any) => {
    setSelectedStudent(student)
    const targetInv = invoice || student.invoices.find((i) => Number(i.balanceAmount) > 0) || student.invoices[0]
    setPaymentInvoice(targetInv || null)
    setPayAmount(targetInv ? String(Number(targetInv.balanceAmount || 0)) : String(student.totalBalance || ''))
    setPayMethod('Cash')
    setPayReference('')
    setPayNotes('')
    setPayDate(new Date().toISOString().split('T')[0])
    setShowPaymentModal(true)
  }

  // Submit Payment Collection
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !paymentInvoice) {
      toast.error('Please select an invoice to record payment against.')
      return
    }

    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid payment amount.')
      return
    }

    const maxDue = Number(paymentInvoice.balanceAmount || paymentInvoice.totalAmount)
    if (amt > maxDue) {
      const proceed = confirm(`Amount ₦${amt.toLocaleString()} exceeds invoice balance of ₦${maxDue.toLocaleString()}. Continue?`)
      if (!proceed) return
    }

    setIsProcessingPayment(true)
    try {
      const res = await apiSlice.post<{ success: boolean; payment: any; message?: string }>(
        endpoints.admin.recordPayment,
        {
          invoiceId: paymentInvoice.id,
          amount: amt,
          method: payMethod,
          reference: payReference || `RCP-${Date.now().toString().slice(-6)}`,
          notes: payNotes || null,
        }
      )

      toast.success(res?.message || 'Payment collected & logged successfully!')
      setShowPaymentModal(false)

      // Prepare receipt data
      const receiptPayload = {
        ...(res?.payment || {}),
        amount: amt,
        method: payMethod,
        reference: payReference || res?.payment?.reference,
        notes: payNotes,
        paidAt: new Date().toISOString(),
        student: selectedStudent,
        invoice: {
          ...paymentInvoice,
          balanceAmount: Math.max(0, maxDue - amt),
        },
      }
      setActiveReceipt(receiptPayload)
      setShowReceiptModal(true)

      // Refresh data
      fetchStudentSummaries()
      fetchRecentPayments()
      if (onRefreshParent) onRefreshParent()
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Aggregate KPI metrics
  const totalInvoicedSum = students.reduce((sum, s) => sum + s.totalInvoiced, 0)
  const totalPaidSum = students.reduce((sum, s) => sum + s.totalPaid, 0)
  const totalOutstandingSum = students.reduce((sum, s) => sum + s.totalBalance, 0)
  const recoveryRate = totalInvoicedSum > 0 ? ((totalPaidSum / totalInvoicedSum) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Top Desk KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Fees Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">₦{totalPaidSum.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400">Total received in active filter</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Outstanding Dues</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">₦{totalOutstandingSum.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400">Uncollected fees balance</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Invoiced</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">₦{totalInvoicedSum.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400">Gross student billing</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Recovery Rate</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700">{recoveryRate}%</div>
          <p className="text-[11px] text-slate-400">Collection efficiency</p>
        </div>
      </div>

      {/* Main Cashier Desk Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Student Search & Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Receipt className="text-emerald-600" size={17} /> Student Fees Directory
              </h3>
              <p className="text-[11px] text-slate-400">Search student to collect school fees</p>
            </div>
            <button
              onClick={() => {
                fetchStudentSummaries()
                fetchRecentPayments()
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              title="Refresh"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search & Filters */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or reg no..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="due">With Dues Only</option>
                <option value="unpaid">Unpaid Invoices</option>
                <option value="partial">Partial Paid</option>
                <option value="paid">Fully Cleared</option>
                <option value="all">All Records</option>
              </select>
            </div>
          </form>

          {/* Students List Queue */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Loader2 size={24} className="animate-spin mx-auto text-emerald-600" />
                <p className="text-xs">Searching student fee records...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-1">
                <Receipt size={28} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No student fee records found</p>
                <p className="text-[11px]">Try adjusting your search query or class filter.</p>
              </div>
            ) : (
              students.map((student) => {
                const isSelected = selectedStudent?.id === student.id
                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer select-none space-y-2 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {student.photo ? (
                          <img
                            src={student.photo}
                            alt={student.fullName}
                            className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {(student.firstName?.[0] || 'S') + (student.lastName?.[0] || '')}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{student.fullName}</h4>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {student.registerNo} • {student.className}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                          student.totalBalance <= 0 && student.totalInvoiced > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : student.totalPaid > 0
                            ? 'bg-amber-100 text-amber-800'
                            : student.totalInvoiced > 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {student.totalBalance <= 0 && student.totalInvoiced > 0
                          ? 'CLEARED'
                          : student.totalPaid > 0
                          ? 'PARTIAL'
                          : student.totalInvoiced > 0
                          ? 'UNPAID'
                          : 'NO BILL'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                      <span className="text-slate-500">
                        Paid: <strong className="text-emerald-700">₦{student.totalPaid.toLocaleString()}</strong>
                      </span>
                      <span className="text-slate-500">
                        Due:{' '}
                        <strong className={student.totalBalance > 0 ? 'text-rose-700' : 'text-slate-600'}>
                          ₦{student.totalBalance.toLocaleString()}
                        </strong>
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Cashier Counter & Payment Processing (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedStudent ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              {/* Student Header & Quick Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-3">
                  {selectedStudent.photo ? (
                    <img
                      src={selectedStudent.photo}
                      alt={selectedStudent.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border-2 border-emerald-200 flex items-center justify-center font-black text-lg shrink-0">
                      {(selectedStudent.firstName?.[0] || 'S') + (selectedStudent.lastName?.[0] || '')}
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-base text-slate-900">{selectedStudent.fullName}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Reg: <strong className="text-slate-700">{selectedStudent.registerNo}</strong> • Class:{' '}
                      <strong className="text-slate-700">{selectedStudent.className}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Parent: {selectedStudent.parentName} {selectedStudent.parentMobile !== '—' ? `(${selectedStudent.parentMobile})` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openCollectPaymentModal(selectedStudent)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto"
                >
                  <Receipt size={16} /> Collect Fees / Payment
                </button>
              </div>

              {/* Student Fee Balance Bar */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Billed</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    ₦{selectedStudent.totalInvoiced.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Amount Cleared</span>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">
                    ₦{selectedStudent.totalPaid.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Current Balance Due</span>
                  <div className={`text-sm font-black mt-0.5 ${selectedStudent.totalBalance > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                    ₦{selectedStudent.totalBalance.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Invoices Breakdown Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-blue-600" /> Issued Fee Invoices ({selectedStudent.invoices.length})
                  </h4>
                </div>

                {selectedStudent.invoices.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">
                    No invoices generated yet for this student.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.invoices.map((inv) => {
                      const bal = Number(inv.balanceAmount || 0)
                      return (
                        <div
                          key={inv.id}
                          className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900">#{inv.invoiceNo}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                {inv.termLabel || 'General'}
                              </span>
                              <span
                                className={`text-[9px] font-black px-2 py-0.2 rounded-full uppercase ${
                                  bal <= 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : Number(inv.paidAmount) > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {inv.status || (bal <= 0 ? 'PAID' : 'DUE')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Total: <strong>₦{Number(inv.totalAmount).toLocaleString()}</strong> • Paid:{' '}
                              <strong className="text-emerald-700">₦{Number(inv.paidAmount).toLocaleString()}</strong> • Due:{' '}
                              <strong className={bal > 0 ? 'text-rose-700' : 'text-slate-600'}>₦{bal.toLocaleString()}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {bal > 0 ? (
                              <button
                                type="button"
                                onClick={() => openCollectPaymentModal(selectedStudent, inv)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                Pay Invoice
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={13} /> Paid in Full
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Student's Payment Receipts Ledger */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt size={14} className="text-emerald-600" /> Past Collections for this Student
                </h4>
                {selectedStudent.invoices.flatMap((i) => i.payments || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No payment receipts logged yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden text-xs">
                    {selectedStudent.invoices
                      .flatMap((i) => (i.payments || []).map((p: any) => ({ ...p, invoice: i })))
                      .map((pm: any) => (
                        <div key={pm.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                          <div>
                            <div className="font-bold text-slate-900">
                              ₦{Number(pm.amount).toLocaleString()}{' '}
                              <span className="text-[10px] text-slate-400 uppercase font-normal">via {pm.method}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Ref: {pm.reference || 'N/A'} • {new Date(pm.paidAt).toLocaleDateString('en-GB')}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReceipt({
                                ...pm,
                                student: selectedStudent,
                                invoice: pm.invoice,
                              })
                              setShowReceiptModal(true)
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Printer size={12} /> Receipt
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <Receipt size={32} />
              </div>
              <h3 className="font-black text-slate-900 text-base">Select a Student to Collect Fees</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Pick any student from the left directory or use the search bar above to look up their billing balance, collect school fees, and issue an official verified receipt.
              </p>
            </div>
          )}

          {/* Recent School-wide Payments Stream */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-600" /> Recent Fees Collected School-wide
              </h4>
              <button
                onClick={fetchRecentPayments}
                className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1"
              >
                <RefreshCw size={11} className={isLoadingRecent ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {isLoadingRecent ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading recent transactions...</p>
            ) : recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent collections on record.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 text-xs">
                {recentPayments.map((rp) => {
                  const s = rp.invoice?.student || {}
                  const className = s.enrolls?.[0]?.class?.name || s.class?.name || 'Classroom'
                  return (
                    <div key={rp.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 truncate">
                          {[s.firstName, s.lastName].filter(Boolean).join(' ') || 'Student'}
                          <span className="text-[10px] text-slate-400 ml-1">({className})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {rp.method?.toUpperCase()} • {new Date(rp.paidAt).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-emerald-700 text-xs">
                          ₦{Number(rp.amount).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReceipt(rp)
                            setShowReceiptModal(true)
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: COLLECT PAYMENT FORM */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 my-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Receipt size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Record Fee Collection</h2>
                  <p className="text-[11px] text-slate-400">Issue official receipt to student account</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs font-semibold">
              <div className="bg-slate-50 p-3 rounded-xl border space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-bold text-slate-900">{selectedStudent.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reg No / Class:</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.registerNo} • {selectedStudent.className}
                  </span>
                </div>
                {paymentInvoice && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice #{paymentInvoice.invoiceNo}:</span>
                    <span className="font-bold text-rose-700">
                      ₦{Number(paymentInvoice.balanceAmount || paymentInvoice.totalAmount).toLocaleString()} due
                    </span>
                  </div>
                )}
              </div>

              {/* Target Invoice Selector */}
              {selectedStudent.invoices.length > 1 && (
                <div>
                  <label className="block text-slate-700 mb-1">Target Fee Invoice</label>
                  <select
                    value={paymentInvoice?.id || ''}
                    onChange={(e) => {
                      const inv = selectedStudent.invoices.find((i) => String(i.id) === e.target.value)
                      if (inv) {
                        setPaymentInvoice(inv)
                        setPayAmount(String(Number(inv.balanceAmount || 0)))
                      }
                    }}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 outline-none"
                  >
                    {selectedStudent.invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        Invoice #{inv.invoiceNo} ({inv.termLabel || 'General'}) — Due: ₦{Number(inv.balanceAmount).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 mb-1">Payment Amount (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-emerald-800 font-black text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="POS / Card">POS / Card</option>
                    <option value="Bank Deposit / Teller">Bank Deposit / Teller</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Reference / Teller No / Transaction ID</label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="e.g. TRF-9283719"
                  className="w-full p-2.5 border rounded-xl bg-slate-50 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Cashier Remarks / Note (Optional)</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid in cash at accounts counter"
                  className="w-full p-2.5 border rounded-xl bg-slate-50 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingPayment ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
                  Confirm & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      <FeeReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receipt={activeReceipt}
      />
    </div>
  )
}
