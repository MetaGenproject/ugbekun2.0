'use client'

import { useState, useEffect } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  FileText,
  User,
  Settings,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  Check,
  Edit2,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  CreditCard,
  Sparkles,
  Award,
  AlertTriangle,
  Send,
  Printer
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

// --- INTERFACES ---
export interface LeaveCategory {
  id: number
  name: string
  daysPerYear: number
  isPaid: boolean
  requiresAttachment: boolean
  applicableRoles: string
  description?: string | null
  active: boolean
}

export interface LeaveRequest {
  id: number
  leaveCategoryId: number
  applicantId: number
  applicantType: string
  applicantName: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  attachmentUrl?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  reviewedBy?: number | null
  reviewerNotes?: string | null
  reviewedAt?: string | null
  createdAt: string
  leaveCategory: {
    id: number
    name: string
    isPaid: boolean
    daysPerYear: number
  }
}

export interface PayrollComponent {
  id: number
  staffId: number
  staffType: string
  staffName: string
  staffRole: string
  baseSalary: number
  housingAllowance: number
  transportAllowance: number
  medicalAllowance: number
  taxDeduction: number
  pensionDeduction: number
  otherDeductions: number
  bankName?: string | null
  accountNumber?: string | null
}

export interface Payslip {
  id: number
  payrollRunId: number
  staffId: number
  staffName: string
  staffRole: string
  baseSalary: number
  totalAllowances: number
  totalDeductions: number
  netSalary: number
  paymentMethod: string
  status: 'PENDING' | 'PAID'
  sentAt?: string | null
}

export interface PayrollRun {
  id: number
  monthYear: string
  totalGross: number
  totalDeductions: number
  totalNet: number
  staffCount: number
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID'
  approvedAt?: string | null
  paidAt?: string | null
  payslips: Payslip[]
}

export interface SalaryAdvance {
  id: number
  staffId: number
  staffName: string
  staffRole: string
  requestedAmount: number
  monthlyDeduction: number
  repaymentMonths: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPAID'
  reviewerNotes?: string | null
  createdAt: string
}

export interface StaffConduct {
  id: number
  staffId: number
  staffName: string
  staffRole: string
  incidentDate: string
  type: 'COMMENDATION' | 'WARNING' | 'INFRACTION' | 'DISCIPLINARY'
  title: string
  description: string
  actionTaken?: string | null
  issuedBy: string
}

export interface EmploymentLetter {
  id: number
  staffId: number
  staffName: string
  jobTitle: string
  joiningDate: string
  salaryAmount: number
  letterContent: string
  isAiGenerated: boolean
  issuedDate: string
}

export function HrLeaveManagement() {
  const [activeTab, setActiveTab] = useState<'leave' | 'payroll' | 'advance' | 'conduct' | 'letters'>('leave')
  const [leaveSubTab, setLeaveSubTab] = useState<'requests' | 'setup'>('requests')

  // --- LEAVE STATES ---
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [leaveCategories, setLeaveCategories] = useState<LeaveCategory[]>([])
  const [leaveStats, setLeaveStats] = useState({ pendingCount: 0, approvedCount: 0, rejectedCount: 0, totalCategories: 0 })
  const [isLoadingLeave, setIsLoadingLeave] = useState(false)
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('ALL')
  const [leaveCategoryFilter, setLeaveCategoryFilter] = useState('ALL')

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', daysPerYear: 14, isPaid: true, requiresAttachment: false, applicableRoles: 'ALL', description: '' })
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({ leaveCategoryId: '', applicantId: '1', applicantType: 'TEACHER', applicantName: '', startDate: '', endDate: '', reason: '', attachmentUrl: '' })
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; request: LeaveRequest | null; action: 'APPROVED' | 'REJECTED' | null; notes: string }>({ isOpen: false, request: null, action: null, notes: '' })

  // --- PAYROLL STATES ---
  const [payrollComponents, setPayrollComponents] = useState<PayrollComponent[]>([])
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(false)
  const [payrollSubTab, setPayrollSubTab] = useState<'runs' | 'components'>('runs')
  const [showComponentModal, setShowComponentModal] = useState(false)
  const [componentForm, setComponentForm] = useState({ staffId: '1', staffType: 'TEACHER', staffName: '', staffRole: 'Teacher', baseSalary: 150000, housingAllowance: 30000, transportAllowance: 15000, medicalAllowance: 10000, taxDeduction: 12000, pensionDeduction: 15000, otherDeductions: 0, bankName: 'First Bank', accountNumber: '' })
  const [showNewRunModal, setShowNewRunModal] = useState(false)
  const [newRunMonthYear, setNewRunMonthYear] = useState('')

  // --- SALARY ADVANCE STATES ---
  const [advances, setAdvances] = useState<SalaryAdvance[]>([])
  const [advanceStats, setAdvanceStats] = useState({ pendingCount: 0, approvedCount: 0, totalDisbursed: 0 })
  const [isLoadingAdvances, setIsLoadingAdvances] = useState(false)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [advanceForm, setAdvanceForm] = useState({ staffId: '1', staffName: '', staffRole: 'Teacher', requestedAmount: 50000, repaymentMonths: 2, reason: '' })
  const [advanceReviewModal, setAdvanceReviewModal] = useState<{ isOpen: boolean; advance: SalaryAdvance | null; action: 'APPROVED' | 'REJECTED' | null; notes: string }>({ isOpen: false, advance: null, action: null, notes: '' })

  // --- STAFF CONDUCT STATES ---
  const [conducts, setConducts] = useState<StaffConduct[]>([])
  const [isLoadingConducts, setIsLoadingConducts] = useState(false)
  const [showConductModal, setShowConductModal] = useState(false)
  const [conductForm, setConductForm] = useState({ staffId: '1', staffName: '', staffRole: 'Teacher', incidentDate: '', type: 'WARNING', title: '', description: '', actionTaken: '', issuedBy: 'HR Admin' })

  // --- EMPLOYMENT LETTERS STATES ---
  const [letters, setLetters] = useState<EmploymentLetter[]>([])
  const [isLoadingLetters, setIsLoadingLetters] = useState(false)
  const [showLetterModal, setShowLetterModal] = useState(false)
  const [letterForm, setLetterForm] = useState({ staffId: '1', staffName: '', jobTitle: 'Senior Mathematics Teacher', joiningDate: '', salaryAmount: 200000, letterContent: '', schoolGuidance: '', isAiGenerated: false })
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchLeaveData()
    fetchPayrollData()
    fetchAdvanceData()
    fetchConductData()
    fetchLetterData()
  }, [])

  // --- FETCHERS ---
  const fetchLeaveData = async () => {
    setIsLoadingLeave(true)
    try {
      const [catRes, reqRes] = await Promise.all([
        apiSlice.get<{ success: boolean; data: LeaveCategory[] }>(endpoints.admin.leaveCategories),
        apiSlice.get<{ success: boolean; data: LeaveRequest[]; stats: any }>(`${endpoints.admin.leaveRequests}?status=${leaveStatusFilter}&leaveCategoryId=${leaveCategoryFilter}`)
      ])
      if (catRes.success) setLeaveCategories(catRes.data)
      if (reqRes.success) {
        setRequests(reqRes.data)
        setLeaveStats(reqRes.stats)
      }
    } catch (e) {} finally {
      setIsLoadingLeave(false)
    }
  }

  const fetchPayrollData = async () => {
    setIsLoadingPayroll(true)
    try {
      const [compRes, runRes] = await Promise.all([
        apiSlice.get<{ success: boolean; data: PayrollComponent[] }>(endpoints.admin.payrollComponents),
        apiSlice.get<{ success: boolean; data: PayrollRun[] }>(endpoints.admin.payrollRuns)
      ])
      if (compRes.success) setPayrollComponents(compRes.data)
      if (runRes.success) setPayrollRuns(runRes.data)
    } catch (e) {} finally {
      setIsLoadingPayroll(false)
    }
  }

  const fetchAdvanceData = async () => {
    setIsLoadingAdvances(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: SalaryAdvance[]; stats: any }>(endpoints.admin.salaryAdvances)
      if (res.success) {
        setAdvances(res.data)
        setAdvanceStats(res.stats)
      }
    } catch (e) {} finally {
      setIsLoadingAdvances(false)
    }
  }

  const fetchConductData = async () => {
    setIsLoadingConducts(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: StaffConduct[] }>(endpoints.admin.staffConduct)
      if (res.success) setConducts(res.data)
    } catch (e) {} finally {
      setIsLoadingConducts(false)
    }
  }

  const fetchLetterData = async () => {
    setIsLoadingLetters(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: EmploymentLetter[] }>(endpoints.admin.employmentLetters)
      if (res.success) setLetters(res.data)
    } catch (e) {} finally {
      setIsLoadingLetters(false)
    }
  }

  // --- HANDLERS ---
  const handleSaveLeaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiSlice.post(endpoints.admin.leaveCategories, categoryForm)
      setFeedback({ type: 'success', message: 'Leave type created successfully.' })
      setShowCategoryModal(false)
      fetchLeaveData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save leave category.' })
    }
  }

  const handleSaveLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiSlice.post(endpoints.admin.leaveRequests, {
        ...requestForm,
        leaveCategoryId: parseInt(requestForm.leaveCategoryId, 10),
        applicantId: parseInt(requestForm.applicantId || '1', 10)
      })
      setFeedback({ type: 'success', message: 'Leave request logged successfully.' })
      setShowRequestModal(false)
      fetchLeaveData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to log leave request.' })
    }
  }

  const handleReviewLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewModal.request || !reviewModal.action) return
    try {
      await apiSlice.put(endpoints.admin.reviewLeaveRequest(reviewModal.request.id), {
        status: reviewModal.action,
        reviewerNotes: reviewModal.notes
      })
      setFeedback({ type: 'success', message: `Leave request ${reviewModal.action.toLowerCase()} successfully.` })
      setReviewModal({ isOpen: false, request: null, action: null, notes: '' })
      fetchLeaveData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to review leave request.' })
    }
  }

  // PAYROLL HANDLERS
  const handleSavePayrollComponent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiSlice.post(endpoints.admin.payrollComponents, componentForm)
      setFeedback({ type: 'success', message: 'Salary component saved successfully.' })
      setShowComponentModal(false)
      fetchPayrollData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save salary component.' })
    }
  }

  const handleCreatePayrollRun = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRunMonthYear.trim()) return
    try {
      await apiSlice.post(endpoints.admin.payrollRuns, { monthYear: newRunMonthYear })
      setFeedback({ type: 'success', message: 'Monthly payroll run generated successfully.' })
      setShowNewRunModal(false)
      setNewRunMonthYear('')
      fetchPayrollData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to process payroll run.' })
    }
  }

  const handleUpdatePayrollStatus = async (runId: number, status: 'APPROVED' | 'PAID') => {
    try {
      await apiSlice.put(endpoints.admin.updatePayrollStatus(runId), { status })
      setFeedback({ type: 'success', message: `Payroll run status updated to ${status}.` })
      fetchPayrollData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update payroll status.' })
    }
  }

  const handleDownloadPayslip = async (payslipId: number, staffName: string) => {
    try {
      await apiSlice.download(endpoints.admin.downloadPayslipPdf(payslipId), `Payslip_${staffName.replace(/\s+/g, '_')}.pdf`)
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to download payslip PDF.' })
    }
  }

  // ADVANCE HANDLERS
  const handleSaveAdvanceRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiSlice.post(endpoints.admin.salaryAdvances, advanceForm)
      setFeedback({ type: 'success', message: 'Salary advance request logged.' })
      setShowAdvanceModal(false)
      fetchAdvanceData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit advance request.' })
    }
  }

  const handleReviewAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!advanceReviewModal.advance || !advanceReviewModal.action) return
    try {
      await apiSlice.put(endpoints.admin.reviewSalaryAdvance(advanceReviewModal.advance.id), {
        status: advanceReviewModal.action,
        reviewerNotes: advanceReviewModal.notes
      })
      setFeedback({ type: 'success', message: `Salary advance request ${advanceReviewModal.action.toLowerCase()} successfully.` })
      setAdvanceReviewModal({ isOpen: false, advance: null, action: null, notes: '' })
      fetchAdvanceData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to review advance request.' })
    }
  }

  // CONDUCT HANDLERS
  const handleSaveConduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiSlice.post(endpoints.admin.staffConduct, conductForm)
      setFeedback({ type: 'success', message: 'Staff conduct log saved.' })
      setShowConductModal(false)
      fetchConductData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save conduct log.' })
    }
  }

  const handleDeleteConduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this conduct log?')) return
    try {
      await apiSlice.delete(endpoints.admin.staffConductItem(id))
      setFeedback({ type: 'success', message: 'Conduct record deleted.' })
      fetchConductData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete conduct log.' })
    }
  }

  // EMPLOYMENT LETTER HANDLERS
  const handleGenerateAiLetterDraft = async () => {
    if (!letterForm.staffName || !letterForm.jobTitle) {
      setFeedback({ type: 'error', message: 'Please enter Staff Name and Job Title first.' })
      return
    }
    setIsGeneratingAi(true)
    try {
      const res = await apiSlice.post<{ success: boolean; draftContent: string }>(endpoints.admin.generateAiEmploymentLetter, {
        staffName: letterForm.staffName,
        jobTitle: letterForm.jobTitle,
        joiningDate: letterForm.joiningDate,
        salaryAmount: letterForm.salaryAmount,
        schoolGuidance: letterForm.schoolGuidance
      })
      if (res.success) {
        setLetterForm({ ...letterForm, letterContent: res.draftContent, isAiGenerated: true })
        setFeedback({ type: 'success', message: 'AI formal employment letter draft generated.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to generate AI letter draft.' })
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiSlice.post(endpoints.admin.employmentLetters, letterForm)
      setFeedback({ type: 'success', message: 'Employment letter issued successfully.' })
      setShowLetterModal(false)
      fetchLetterData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save employment letter.' })
    }
  }

  const handleDownloadLetter = async (letterId: number, staffName: string) => {
    try {
      await apiSlice.download(endpoints.admin.downloadEmploymentLetterPdf(letterId), `Employment_Letter_${staffName.replace(/\s+/g, '_')}.pdf`)
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to download letter PDF.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Briefcase size={16} /> Human Resources Management Suite
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Staff HR, Payroll & Compliance Desk</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage leave approvals, monthly payroll & payslips, salary advances, conduct tracking, and employment letters.
          </p>
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
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Top Tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white px-3 rounded-2xl border border-slate-100 shadow-sm">
        <button
          onClick={() => setActiveTab('leave')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer ${
            activeTab === 'leave' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarDays size={18} /> Leave Management
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer ${
            activeTab === 'payroll' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign size={18} /> Payroll & Payslips
        </button>
        <button
          onClick={() => setActiveTab('advance')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer ${
            activeTab === 'advance' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard size={18} /> Salary Advances
        </button>
        <button
          onClick={() => setActiveTab('conduct')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer ${
            activeTab === 'conduct' ? 'border-rose-600 text-rose-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle size={18} /> Staff Conduct Logs
        </button>
        <button
          onClick={() => setActiveTab('letters')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer ${
            activeTab === 'letters' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={18} /> Employment Letters (AI)
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: LEAVE MANAGEMENT */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setLeaveSubTab('requests')}
                className={`px-4 py-2 text-xs font-bold border-b-2 ${leaveSubTab === 'requests' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'}`}
              >
                Leave Requests ({requests.length})
              </button>
              <button
                onClick={() => setLeaveSubTab('setup')}
                className={`px-4 py-2 text-xs font-bold border-b-2 ${leaveSubTab === 'setup' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'}`}
              >
                Leave Setup & Rules ({leaveCategories.length})
              </button>
            </div>
            {leaveSubTab === 'requests' ? (
              <button onClick={() => setShowRequestModal(true)} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Plus size={16} /> Log Leave Request
              </button>
            ) : (
              <button onClick={() => setShowCategoryModal(true)} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Plus size={16} /> New Leave Category
              </button>
            )}
          </div>

          {leaveSubTab === 'requests' ? (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                    <th className="p-4">Applicant</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="p-4 font-bold text-slate-900">{r.applicantName}</td>
                      <td className="p-4 font-semibold text-slate-800">{r.leaveCategory?.name}</td>
                      <td className="p-4">{r.totalDays} Day(s)</td>
                      <td className="p-4 max-w-xs truncate">{r.reason}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {r.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setReviewModal({ isOpen: true, request: r, action: 'APPROVED', notes: '' })} className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer">Approve</button>
                            <button onClick={() => setReviewModal({ isOpen: true, request: r, action: 'REJECTED', notes: '' })} className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded text-[11px] font-bold cursor-pointer">Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaveCategories.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.daysPerYear} Days / Year ({c.isPaid ? 'Paid' : 'Unpaid'})</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: PAYROLL & PAYSLIPS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setPayrollSubTab('runs')}
                className={`px-4 py-2 text-xs font-bold border-b-2 ${payrollSubTab === 'runs' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'}`}
              >
                Monthly Payroll Runs ({payrollRuns.length})
              </button>
              <button
                onClick={() => setPayrollSubTab('components')}
                className={`px-4 py-2 text-xs font-bold border-b-2 ${payrollSubTab === 'components' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'}`}
              >
                Staff Salary Structures ({payrollComponents.length})
              </button>
            </div>
            {payrollSubTab === 'runs' ? (
              <button onClick={() => setShowNewRunModal(true)} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Plus size={16} /> Process Monthly Payroll
              </button>
            ) : (
              <button onClick={() => setShowComponentModal(true)} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Plus size={16} /> Setup Staff Salary
              </button>
            )}
          </div>

          {payrollSubTab === 'runs' ? (
            <div className="space-y-4">
              {payrollRuns.map((run) => (
                <div key={run.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{run.monthYear} Payroll</h3>
                      <p className="text-xs text-slate-500">{run.staffCount} Staff Members Processed</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${run.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : run.status === 'APPROVED' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                        {run.status}
                      </span>
                      {run.status === 'SUBMITTED' && (
                        <button onClick={() => handleUpdatePayrollStatus(run.id, 'APPROVED')} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer">Approve Run</button>
                      )}
                      {run.status === 'APPROVED' && (
                        <button onClick={() => handleUpdatePayrollStatus(run.id, 'PAID')} className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5">
                          <Send size={14} /> Pay & Send Payslips
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-xs font-semibold">
                    <div>Gross Payroll: <span className="text-slate-900 font-bold">₦{Number(run.totalGross).toLocaleString()}</span></div>
                    <div>Deductions: <span className="text-rose-600 font-bold">₦{Number(run.totalDeductions).toLocaleString()}</span></div>
                    <div>Total Net Salary: <span className="text-emerald-600 font-bold text-sm">₦{Number(run.totalNet).toLocaleString()}</span></div>
                  </div>

                  {/* Payslips Grid */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Itemized Staff Payslips</h4>
                    <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                      {run.payslips?.map((p) => (
                        <div key={p.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                          <div>
                            <div className="font-bold text-slate-900">{p.staffName} ({p.staffRole})</div>
                            <div className="text-[11px] text-slate-500">{p.paymentMethod}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="font-bold text-emerald-700">₦{Number(p.netSalary).toLocaleString()}</div>
                            <button onClick={() => handleDownloadPayslip(p.id, p.staffName)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Download Payslip PDF">
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-semibold uppercase">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Base Salary</th>
                    <th className="p-4">Allowances</th>
                    <th className="p-4">Deductions</th>
                    <th className="p-4">Bank Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700 font-medium">
                  {payrollComponents.map((comp) => (
                    <tr key={comp.id}>
                      <td className="p-4 font-bold text-slate-900">{comp.staffName} ({comp.staffRole})</td>
                      <td className="p-4 font-semibold">₦{Number(comp.baseSalary).toLocaleString()}</td>
                      <td className="p-4 text-emerald-600 font-semibold">+₦{(Number(comp.housingAllowance) + Number(comp.transportAllowance) + Number(comp.medicalAllowance)).toLocaleString()}</td>
                      <td className="p-4 text-rose-600 font-semibold">-₦{(Number(comp.taxDeduction) + Number(comp.pensionDeduction) + Number(comp.otherDeductions)).toLocaleString()}</td>
                      <td className="p-4">{comp.bankName || 'N/A'} {comp.accountNumber ? `(${comp.accountNumber})` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: SALARY ADVANCES */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'advance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100">
            <div className="text-xs font-semibold text-slate-600">
              Disbursed Advances: <strong className="text-amber-600">₦{Number(advanceStats.totalDisbursed).toLocaleString()}</strong>
            </div>
            <button onClick={() => setShowAdvanceModal(true)} className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Plus size={16} /> Request Salary Advance
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 font-semibold uppercase">
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Requested Amount</th>
                  <th className="p-4">Repayment Plan</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700 font-medium">
                {advances.map((a) => (
                  <tr key={a.id}>
                    <td className="p-4 font-bold text-slate-900">{a.staffName} ({a.staffRole})</td>
                    <td className="p-4 font-bold text-amber-700">₦{Number(a.requestedAmount).toLocaleString()}</td>
                    <td className="p-4">₦{Number(a.monthlyDeduction).toLocaleString()} / mo ({a.repaymentMonths} month(s))</td>
                    <td className="p-4 max-w-xs truncate">{a.reason}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${a.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : a.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {a.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setAdvanceReviewModal({ isOpen: true, advance: a, action: 'APPROVED', notes: '' })} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer">Approve</button>
                          <button onClick={() => setAdvanceReviewModal({ isOpen: true, advance: a, action: 'REJECTED', notes: '' })} className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-[11px] font-bold cursor-pointer">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: STAFF CONDUCT LOGS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'conduct' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100">
            <div className="text-xs font-semibold text-slate-600">Code of Conduct & Compliance Logs</div>
            <button onClick={() => setShowConductModal(true)} className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Plus size={16} /> Log Conduct Incident
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conducts.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                    <div className="text-xs text-slate-500 font-semibold">{c.staffName} ({c.staffRole})</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${c.type === 'COMMENDATION' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {c.type}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{c.description}</p>
                {c.actionTaken && (
                  <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-700 font-medium border">
                    Action Taken: {c.actionTaken}
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t pt-2">
                  <span>Issued By: {c.issuedBy}</span>
                  <button onClick={() => handleDeleteConduct(c.id)} className="text-rose-500 hover:underline font-bold">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: EMPLOYMENT LETTERS (AI) */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'letters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100">
            <div className="text-xs font-semibold text-slate-600">Issued Employment Letters & AI Templates</div>
            <button onClick={() => setShowLetterModal(true)} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Sparkles size={16} /> Draft Employment Letter (AI)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {letters.map((l) => (
              <div key={l.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{l.staffName}</h3>
                    <div className="text-xs text-slate-500 font-semibold">{l.jobTitle}</div>
                  </div>
                  <button onClick={() => handleDownloadLetter(l.id, l.staffName)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer" title="Download Official Letter PDF">
                    <Download size={18} />
                  </button>
                </div>
                <div className="text-xs text-slate-500">Joining Date: {new Date(l.joiningDate).toLocaleDateString()}</div>
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-700 font-mono line-clamp-3 border">
                  {l.letterContent}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ALL MODAL OVERLAYS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}

      {/* MODAL 1: SALARY ADVANCE REVIEW (APPROVE / REJECT) */}
      {advanceReviewModal.isOpen && advanceReviewModal.advance && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {advanceReviewModal.action === 'APPROVED' ? 'Approve Salary Advance' : 'Reject Salary Advance'}
              </h2>
              <button onClick={() => setAdvanceReviewModal({ isOpen: false, advance: null, action: null, notes: '' })} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1">
              <div className="font-bold text-slate-900">{advanceReviewModal.advance.staffName} ({advanceReviewModal.advance.staffRole})</div>
              <div className="text-amber-700 font-bold">Requested Amount: ₦{Number(advanceReviewModal.advance.requestedAmount).toLocaleString()}</div>
              <div className="text-slate-500 italic text-[11px]">"{advanceReviewModal.advance.reason}"</div>
            </div>

            <form onSubmit={handleReviewAdvanceSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reviewer Notes (Optional)</label>
                <textarea rows={3} placeholder="Enter reviewer comments..." value={advanceReviewModal.notes} onChange={(e) => setAdvanceReviewModal({ ...advanceReviewModal, notes: e.target.value })} className="w-full p-2 border rounded-lg" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setAdvanceReviewModal({ isOpen: false, advance: null, action: null, notes: '' })} className="px-4 py-2 border rounded-lg font-semibold">Cancel</button>
                <button type="submit" className={`px-4 py-2 text-white font-bold rounded-lg cursor-pointer ${advanceReviewModal.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                  {advanceReviewModal.action === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LEAVE REQUEST REVIEW (APPROVE / REJECT) */}
      {reviewModal.isOpen && reviewModal.request && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {reviewModal.action === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h2>
              <button onClick={() => setReviewModal({ isOpen: false, request: null, action: null, notes: '' })} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1">
              <div className="font-bold text-slate-900">{reviewModal.request.applicantName}</div>
              <div className="text-slate-600">{reviewModal.request.leaveCategory?.name} ({reviewModal.request.totalDays} Days)</div>
              <div className="text-slate-500 italic text-[11px]">"{reviewModal.request.reason}"</div>
            </div>

            <form onSubmit={handleReviewLeaveSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reviewer Notes (Optional)</label>
                <textarea rows={3} placeholder="Enter reviewer comments..." value={reviewModal.notes} onChange={(e) => setReviewModal({ ...reviewModal, notes: e.target.value })} className="w-full p-2 border rounded-lg text-xs" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setReviewModal({ isOpen: false, request: null, action: null, notes: '' })} className="px-4 py-2 border rounded-lg font-semibold">Cancel</button>
                <button type="submit" className={`px-4 py-2 text-white font-bold rounded-lg cursor-pointer ${reviewModal.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                  {reviewModal.action === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE LEAVE CATEGORY */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">New Leave Type & Rule</h2>
            <form onSubmit={handleSaveLeaveCategory} className="space-y-3 text-xs font-medium">
              <input type="text" placeholder="Leave Name (e.g. Annual Leave)" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required className="w-full p-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Days / Year" value={categoryForm.daysPerYear} onChange={(e) => setCategoryForm({ ...categoryForm, daysPerYear: parseInt(e.target.value, 10) })} required className="p-2 border rounded-lg" />
                <select value={categoryForm.applicableRoles} onChange={(e) => setCategoryForm({ ...categoryForm, applicableRoles: e.target.value })} className="p-2 border rounded-lg">
                  <option value="ALL">All Roles</option>
                  <option value="TEACHER">Teachers Only</option>
                  <option value="STAFF">Staff Only</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg">Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: LOG LEAVE REQUEST */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Log Leave Request</h2>
            <form onSubmit={handleSaveLeaveRequest} className="space-y-3 text-xs font-medium">
              <select value={requestForm.leaveCategoryId} onChange={(e) => setRequestForm({ ...requestForm, leaveCategoryId: e.target.value })} required className="w-full p-2 border rounded-lg">
                <option value="">Select Category</option>
                {leaveCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.daysPerYear} days)</option>
                ))}
              </select>
              <input type="text" placeholder="Applicant Name" value={requestForm.applicantName} onChange={(e) => setRequestForm({ ...requestForm, applicantName: e.target.value })} required className="w-full p-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={requestForm.startDate} onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })} required className="p-2 border rounded-lg" />
                <input type="date" value={requestForm.endDate} onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })} required className="p-2 border rounded-lg" />
              </div>
              <textarea rows={3} placeholder="Reason..." value={requestForm.reason} onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })} required className="w-full p-2 border rounded-lg" />
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PAYROLL COMPONENT SETUP */}
      {showComponentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Setup Staff Salary Structure</h2>
            <form onSubmit={handleSavePayrollComponent} className="space-y-3 text-xs font-medium">
              <input type="text" placeholder="Staff Name" value={componentForm.staffName} onChange={(e) => setComponentForm({ ...componentForm, staffName: e.target.value })} required className="w-full p-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Base Salary" value={componentForm.baseSalary} onChange={(e) => setComponentForm({ ...componentForm, baseSalary: parseFloat(e.target.value) })} className="p-2 border rounded-lg" />
                <input type="number" placeholder="Housing Allowance" value={componentForm.housingAllowance} onChange={(e) => setComponentForm({ ...componentForm, housingAllowance: parseFloat(e.target.value) })} className="p-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Transport Allowance" value={componentForm.transportAllowance} onChange={(e) => setComponentForm({ ...componentForm, transportAllowance: parseFloat(e.target.value) })} className="p-2 border rounded-lg" />
                <input type="number" placeholder="TAX Deduction" value={componentForm.taxDeduction} onChange={(e) => setComponentForm({ ...componentForm, taxDeduction: parseFloat(e.target.value) })} className="p-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Bank Name" value={componentForm.bankName} onChange={(e) => setComponentForm({ ...componentForm, bankName: e.target.value })} className="p-2 border rounded-lg" />
                <input type="text" placeholder="Account Number" value={componentForm.accountNumber} onChange={(e) => setComponentForm({ ...componentForm, accountNumber: e.target.value })} className="p-2 border rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowComponentModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg">Save Structure</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: NEW PAYROLL RUN */}
      {showNewRunModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Process Monthly Payroll</h2>
            <form onSubmit={handleCreatePayrollRun} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-semibold mb-1">Pay Period / Month Year *</label>
                <input type="text" placeholder="e.g. July 2026" value={newRunMonthYear} onChange={(e) => setNewRunMonthYear(e.target.value)} required className="w-full p-2.5 border rounded-lg text-xs" />
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                <button type="button" onClick={() => setShowNewRunModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg">Generate Run</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: SALARY ADVANCE REQUEST */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Request Salary Advance</h2>
            <form onSubmit={handleSaveAdvanceRequest} className="space-y-3 text-xs font-medium">
              <input type="text" placeholder="Staff Name" value={advanceForm.staffName} onChange={(e) => setAdvanceForm({ ...advanceForm, staffName: e.target.value })} required className="w-full p-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Requested Amount (₦)" value={advanceForm.requestedAmount} onChange={(e) => setAdvanceForm({ ...advanceForm, requestedAmount: parseFloat(e.target.value) })} required className="p-2 border rounded-lg" />
                <input type="number" placeholder="Repayment Months" value={advanceForm.repaymentMonths} onChange={(e) => setAdvanceForm({ ...advanceForm, repaymentMonths: parseInt(e.target.value, 10) })} required className="p-2 border rounded-lg" />
              </div>
              <textarea rows={3} placeholder="Reason for advance..." value={advanceForm.reason} onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })} required className="w-full p-2 border rounded-lg" />
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAdvanceModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: STAFF CONDUCT */}
      {showConductModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Log Staff Conduct Incident</h2>
            <form onSubmit={handleSaveConduct} className="space-y-3 text-xs font-medium">
              <input type="text" placeholder="Staff Name" value={conductForm.staffName} onChange={(e) => setConductForm({ ...conductForm, staffName: e.target.value })} required className="w-full p-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <select value={conductForm.type} onChange={(e) => setConductForm({ ...conductForm, type: e.target.value })} className="p-2 border rounded-lg">
                  <option value="WARNING">Warning</option>
                  <option value="COMMENDATION">Commendation</option>
                  <option value="INFRACTION">Infraction</option>
                  <option value="DISCIPLINARY">Disciplinary Action</option>
                </select>
                <input type="date" value={conductForm.incidentDate} onChange={(e) => setConductForm({ ...conductForm, incidentDate: e.target.value })} required className="p-2 border rounded-lg" />
              </div>
              <input type="text" placeholder="Incident Title / Subject" value={conductForm.title} onChange={(e) => setConductForm({ ...conductForm, title: e.target.value })} required className="w-full p-2 border rounded-lg" />
              <textarea rows={3} placeholder="Detailed description..." value={conductForm.description} onChange={(e) => setConductForm({ ...conductForm, description: e.target.value })} required className="w-full p-2 border rounded-lg" />
              <input type="text" placeholder="Action Taken (Optional)" value={conductForm.actionTaken} onChange={(e) => setConductForm({ ...conductForm, actionTaken: e.target.value })} className="w-full p-2 border rounded-lg" />
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowConductModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg">Save Incident Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: EMPLOYMENT LETTER (AI) */}
      {showLetterModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="text-blue-600" size={18} /> Generate Employment Letter (AI)
              </h2>
              <button onClick={() => setShowLetterModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveLetter} className="space-y-3 text-xs font-medium">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Staff Name *" value={letterForm.staffName} onChange={(e) => setLetterForm({ ...letterForm, staffName: e.target.value })} required className="p-2 border rounded-lg" />
                <input type="text" placeholder="Job Title / Position *" value={letterForm.jobTitle} onChange={(e) => setLetterForm({ ...letterForm, jobTitle: e.target.value })} required className="p-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={letterForm.joiningDate} onChange={(e) => setLetterForm({ ...letterForm, joiningDate: e.target.value })} required className="p-2 border rounded-lg" />
                <input type="number" placeholder="Salary Amount (₦)" value={letterForm.salaryAmount} onChange={(e) => setLetterForm({ ...letterForm, salaryAmount: parseFloat(e.target.value) })} className="p-2 border rounded-lg" />
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
                <label className="block font-bold text-blue-900">Custom School Guidance / Special Terms (For AI Drafting)</label>
                <input type="text" placeholder="e.g. Include 6 months probation clause and accommodation allowance..." value={letterForm.schoolGuidance} onChange={(e) => setLetterForm({ ...letterForm, schoolGuidance: e.target.value })} className="w-full p-2 border rounded-lg bg-white" />
                <button type="button" onClick={handleGenerateAiLetterDraft} disabled={isGeneratingAi} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <Sparkles size={14} /> {isGeneratingAi ? 'Drafting with AI...' : 'Draft Letter Content with AI'}
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Letter Content (Editable)</label>
                <textarea rows={6} value={letterForm.letterContent} onChange={(e) => setLetterForm({ ...letterForm, letterContent: e.target.value })} required className="w-full p-2.5 border rounded-lg font-mono text-[11px]" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowLetterModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg">Issue Employment Letter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
