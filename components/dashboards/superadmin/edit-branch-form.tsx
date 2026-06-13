'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

export interface BranchDetails {
  id: number
  name: string
  code?: string | null
  adminName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  active: boolean
  students: number
  parents: number
  teachers: number
  staff: number
  createdAt: string
  updatedAt: string | null
}

type EditBranchFormProps = {
  branch: BranchDetails
  onClose: () => void
  onSaved?: (branch: BranchDetails) => void
}

export function EditBranchForm({ branch, onClose, onSaved }: EditBranchFormProps) {
  const [name, setName] = useState(branch.name)
  const [code, setCode] = useState(branch.code || '')
  const [adminName, setAdminName] = useState(branch.adminName || '')
  const [email, setEmail] = useState(branch.email || '')
  const [phone, setPhone] = useState(branch.phone || '')
  const [city, setCity] = useState(branch.city || '')
  const [state, setState] = useState(branch.state || '')
  const [address, setAddress] = useState(branch.address || '')
  const [active, setActive] = useState(branch.active)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setName(branch.name)
    setCode(branch.code || '')
    setAdminName(branch.adminName || '')
    setEmail(branch.email || '')
    setPhone(branch.phone || '')
    setCity(branch.city || '')
    setState(branch.state || '')
    setAddress(branch.address || '')
    setActive(branch.active)
  }, [branch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const res = await apiSlice.put<{ success: boolean; data: BranchDetails; message: string }>(
        endpoints.superadmin.branch(branch.id),
        { name, code, adminName, email, phone, city, state, address, active }
      )
      onSaved?.(res.data)
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update branch')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Edit Branch</h2>
            <p className="text-sm text-slate-500">Update school details for branch #{branch.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">School Name</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Branch Code</label>
              <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Branch Admin</label>
              <input className={inputClass} value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Phone</label>
              <input type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">City</label>
              <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">State</label>
              <input className={inputClass} value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Address</label>
              <textarea
                className={`${inputClass} min-h-[88px] resize-y`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select
                className={inputClass}
                value={active ? 'active' : 'inactive'}
                onChange={(e) => setActive(e.target.value === 'active')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Live enrolment: {branch.students.toLocaleString()} students · {branch.parents.toLocaleString()} parents · {branch.teachers.toLocaleString()} teachers · {branch.staff.toLocaleString()} staff
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold text-sm transition"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
