'use client'

import React, { useState, useEffect, useRef } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'
import {
  X,
  Edit3,
  Loader2,
  Check,
  Printer,
  Receipt,
  Building2,
  User,
  Calendar,
  CreditCard,
  Layers,
  Sparkles
} from 'lucide-react'
import { useSchoolBranding } from '@/lib/schoolBrandingContext'

export interface FeeType {
  id: number
  name: string
  code: string
  amount: number | string
  currency?: string
  frequency: string
  active?: boolean
}

export interface FeeGroup {
  id: number
  name: string
  description?: string | null
  feeTypeIds?: any
  classIds?: any
  feeTypes?: FeeType[]
  classes?: any[]
  totalAmount: number | string
}

// ============================================================================
// 1. EDIT FEE TYPE MODAL
// ============================================================================
export function EditFeeTypeModal({
  isOpen,
  onClose,
  feeType,
  onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  feeType: FeeType | null
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('per_term')
  const [active, setActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (feeType) {
      setName(feeType.name || '')
      setCode(feeType.code || '')
      setAmount(String(feeType.amount || ''))
      setFrequency(feeType.frequency || 'per_term')
      setActive(feeType.active !== false)
    }
  }, [feeType])

  if (!isOpen || !feeType) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim() || !amount) {
      toast.error('Please enter fee name, unique code, and amount.')
      return
    }

    setIsSubmitting(true)
    try {
      await apiSlice.put(endpoints.admin.feeTypeItem(feeType.id), {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        amount: parseFloat(amount),
        frequency,
        active,
      })
      toast.success(`Fee Type '${name}' updated successfully!`)
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update fee type.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 my-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Edit3 size={17} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Edit Fee Type</h2>
              <p className="text-[11px] text-slate-400">Update code, title, and billing parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 mb-1">Fee Type Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tuition Fee"
              required
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1">Unique Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="TUI01"
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none uppercase text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Amount (₦) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1">Billing Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900"
              >
                <option value="per_term">Per term</option>
                <option value="per_session">Per session / Annual</option>
                <option value="monthly">Monthly</option>
                <option value="one_off">One-off / Admission</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Status</label>
              <select
                value={active ? 'true' : 'false'}
                onChange={(e) => setActive(e.target.value === 'true')}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900"
              >
                <option value="true">Active</option>
                <option value="false">Inactive / Disabled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// 2. EDIT FEE GROUP MODAL
// ============================================================================
export function EditFeeGroupModal({
  isOpen,
  onClose,
  feeGroup,
  allFeeTypes,
  classes,
  onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  feeGroup: FeeGroup | null
  allFeeTypes: FeeType[]
  classes: any[]
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFeeTypeIds, setSelectedFeeTypeIds] = useState<number[]>([])
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parseIds = (raw: any): number[] => {
    if (Array.isArray(raw)) return raw.map(Number).filter((n) => Number.isInteger(n) && n > 0)
    if (typeof raw === 'string') {
      return raw
        .replace(/[\[\]\s]/g, '')
        .split(',')
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0)
    }
    return []
  }

  useEffect(() => {
    if (feeGroup) {
      setName(feeGroup.name || '')
      setDescription(feeGroup.description || '')
      setSelectedFeeTypeIds(
        Array.isArray(feeGroup.feeTypes) && feeGroup.feeTypes.length
          ? feeGroup.feeTypes.map((ft) => ft.id)
          : parseIds(feeGroup.feeTypeIds)
      )
      setSelectedClassIds(
        Array.isArray(feeGroup.classes) && feeGroup.classes.length
          ? feeGroup.classes.map((cls) => cls.id)
          : parseIds(feeGroup.classIds)
      )
    }
  }, [feeGroup])

  if (!isOpen || !feeGroup) return null

  // Computed total
  const computedTotal = allFeeTypes
    .filter((ft) => selectedFeeTypeIds.includes(ft.id))
    .reduce((sum, ft) => sum + Number(ft.amount || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Fee group name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await apiSlice.put(endpoints.admin.feeGroupItem(feeGroup.id), {
        name: name.trim(),
        description: description.trim() || null,
        feeTypeIds: selectedFeeTypeIds,
        classIds: selectedClassIds,
        totalAmount: computedTotal,
      })
      toast.success(`Fee Group '${name}' updated successfully!`)
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update fee group.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 my-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers size={17} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Edit Fee Group Bundle</h2>
              <p className="text-[11px] text-slate-400">Bundle fee types and adjust class allocations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 mb-1">Group Bundle Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Senior Secondary Fees Bundle"
              required
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Applicable to SS1 to SS3 students"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 resize-none"
            />
          </div>

          {/* Bundled Fee Types selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-700">Bundled Fee Types</label>
              <span className="text-[11px] font-bold text-indigo-700">
                Total: ₦{computedTotal.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto border border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
              {allFeeTypes.length === 0 ? (
                <p className="p-2 text-slate-400 text-center">No fee types registered yet.</p>
              ) : (
                allFeeTypes.map((ft) => {
                  const isChecked = selectedFeeTypeIds.includes(ft.id)
                  return (
                    <label
                      key={ft.id}
                      className="flex items-center justify-between p-1.5 hover:bg-white rounded-lg cursor-pointer transition select-none"
                    >
                      <span className="font-bold text-slate-800">
                        {ft.name} ({ft.code})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-bold">₦{Number(ft.amount).toLocaleString()}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFeeTypeIds((prev) => [...prev, ft.id])
                            } else {
                              setSelectedFeeTypeIds((prev) => prev.filter((id) => id !== ft.id))
                            }
                          }}
                          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                        />
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* Class allocation selection */}
          <div className="space-y-1.5">
            <label className="text-slate-700 block">Class Allocation ({selectedClassIds.length} classes)</label>
            <div className="space-y-1 max-h-36 overflow-y-auto border border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
              {classes.length === 0 ? (
                <p className="p-2 text-slate-400 text-center">No classes registered.</p>
              ) : (
                classes.map((cls) => {
                  const isChecked = selectedClassIds.includes(cls.id)
                  return (
                    <label
                      key={cls.id}
                      className="flex items-center justify-between p-1.5 hover:bg-white rounded-lg cursor-pointer transition select-none"
                    >
                      <span className="font-bold text-slate-800">{cls.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClassIds((prev) => [...prev, cls.id])
                          } else {
                            setSelectedClassIds((prev) => prev.filter((id) => id !== cls.id))
                          }
                        }}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save Group Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// 3. OFFICIAL PRINTABLE FEE RECEIPT MODAL
// ============================================================================
export function FeeReceiptModal({
  isOpen,
  onClose,
  receipt,
}: {
  isOpen: boolean
  onClose: () => void
  receipt: any | null
}) {
  const { branding } = useSchoolBranding()
  const printAreaRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !receipt) return null

  const student = receipt.invoice?.student || receipt.student || {}
  const invoice = receipt.invoice || {}
  const receiptNo = receipt.reference || `REC-${receipt.id || '0000'}`
  const paidDate = receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')
  const amountPaid = Number(receipt.amount || 0)
  const remainingBalance = Number(invoice.balanceAmount ?? receipt.balanceAmount ?? 0)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 my-8 print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Modal Top Actions (Hidden on Print) */}
        <div className="flex items-center justify-between border-b pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="text-emerald-600" size={20} />
            <h2 className="text-base font-black text-slate-900">Official School Fee Receipt</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
            >
              <Printer size={14} /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Card */}
        <div
          ref={printAreaRef}
          className="border-2 border-slate-200 rounded-2xl p-6 bg-slate-50/40 space-y-5 print:border-0 print:p-0 print:bg-white"
        >
          {/* Header Branding */}
          <div className="text-center space-y-1.5 border-b border-slate-200 pb-4">
            {branding.logoUrl && (
              <img
                src={branding.logoUrl}
                alt="School Logo"
                className="w-14 h-14 mx-auto object-contain rounded-xl"
              />
            )}
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {branding.schoolName || 'School Dashboard'}
            </h1>
            {branding.tagline && (
              <p className="text-[11px] text-slate-500 font-semibold italic">{branding.tagline}</p>
            )}
            {branding.address && (
              <p className="text-[10px] text-slate-500">{branding.address}</p>
            )}
            <div className="inline-block mt-1 bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              Fee Payment Voucher & Receipt
            </div>
          </div>

          {/* Receipt & Student Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Receipt No</span>
              <span className="font-black text-slate-900 text-sm">{receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Date</span>
              <span className="font-bold text-slate-800">{paidDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Student Name</span>
              <span className="font-bold text-slate-900">
                {[student.firstName, student.lastName].filter(Boolean).join(' ') || student.fullName || 'Student'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Registration No</span>
              <span className="font-bold text-slate-800">{student.registerNo || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Classroom</span>
              <span className="font-bold text-slate-800">
                {student.className || student.enrolls?.[0]?.class?.name || 'Classroom'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Academic Term</span>
              <span className="font-bold text-slate-800">{invoice.termLabel || branding.currentTerm || 'Current Term'}</span>
            </div>
          </div>

          {/* Payment Breakdown Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex justify-between text-xs font-bold text-slate-700">
              <span>Transaction Summary</span>
              <span>Invoice #{invoice.invoiceNo || 'N/A'}</span>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Payment Mode</span>
                <span className="font-bold text-slate-800 uppercase">{receipt.method || 'CASH'}</span>
              </div>
              {receipt.reference && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Reference / Teller ID</span>
                  <span className="font-mono text-slate-700">{receipt.reference}</span>
                </div>
              )}
              {receipt.notes && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Cashier Note</span>
                  <span className="font-medium text-slate-700">{receipt.notes}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="font-black text-slate-900">Total Amount Paid</span>
                <span className="font-black text-emerald-700 text-lg">₦{amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-xs text-slate-500">
                <span>Outstanding Balance</span>
                <span className={`font-bold ${remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  ₦{remainingBalance.toLocaleString()} {remainingBalance <= 0 ? '(Fully Cleared)' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="pt-4 flex justify-between items-end border-t border-dashed border-slate-300 text-[11px] text-slate-500">
            <div>
              <p>Generated by School Accounts Desk</p>
              <p className="text-[10px] text-slate-400">Computer generated verified receipt.</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-slate-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">Authorized Signature</span>
            </div>
          </div>
        </div>

        {/* Print Instruction & Close */}
        <div className="flex justify-end gap-2 print:hidden pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
