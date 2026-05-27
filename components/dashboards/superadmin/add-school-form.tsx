'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

type Plan = {
  id: number
  slug: string
  name: string
  description?: string | null
  priceMonthly?: number | string
  durationMonths: number
  totalCost: number | string
  currency: string
  active: boolean
}

type AddSchoolFormProps = {
  onClose: () => void
  onAdded?: (data: any) => void
}

function currencySymbol(code: string) {
  const c = String(code || '').toUpperCase()
  switch (c) {
    case 'NGN':
      return '₦'
    case 'USD':
      return '$'
    case 'GBP':
      return '£'
    case 'EUR':
      return '€'
    default:
      return c ? `${c} ` : ''
  }
}

function formatMoney(amount: number, code: string) {
  const sym = currencySymbol(code)
  if (!Number.isFinite(amount)) return sym
  if (sym.endsWith(' ') || sym.length > 1) {
    // unknown currency — keep simple formatting
    return `${sym}${amount.toLocaleString('en-NG')}`
  }
  return `${sym}${amount.toLocaleString('en-NG')}`
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function AddSchoolForm({ onClose, onAdded }: AddSchoolFormProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [tempPassword, setTempPassword] = useState('')

  const [branchName, setBranchName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [mobileNo, setMobileNo] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [planId, setPlanId] = useState<number | ''>('')

  const [systemLogoFile, setSystemLogoFile] = useState<File | null>(null)
  const [textLogoFile, setTextLogoFile] = useState<File | null>(null)
  const [printingLogoFile, setPrintingLogoFile] = useState<File | null>(null)
  const [reportCardLogoFile, setReportCardLogoFile] = useState<File | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadPlans() {
      setLoadingPlans(true)
      setErrorMsg('')
      try {
        const data = await apiSlice.get<{ success: boolean; plans: Plan[] }>(
          endpoints.onboarding.plans
        )
        if (!mounted) return
        setPlans(data.plans || [])
      } catch (e: any) {
        if (!mounted) return
        setErrorMsg(e?.message || 'Could not load subscription plans.')
      } finally {
        if (!mounted) return
        setLoadingPlans(false)
      }
    }

    loadPlans()
    return () => {
      mounted = false
    }
  }, [])

  const selectedPlan = useMemo(() => {
    if (!planId) return null
    return plans.find((p) => p.id === planId) || null
  }, [planId, plans])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!branchName.trim()) return setErrorMsg('Branch Name is required.')
    if (!schoolName.trim()) return setErrorMsg('School Name is required.')
    if (!adminName.trim()) return setErrorMsg('Admin Name is required.')
    if (!email.trim()) return setErrorMsg('Email is required.')
    if (!mobileNo.trim()) return setErrorMsg('Mobile No is required.')
    if (!city.trim()) return setErrorMsg('City is required.')
    if (!state.trim()) return setErrorMsg('State is required.')
    if (!address.trim()) return setErrorMsg('Address is required.')
    if (!planId) return setErrorMsg('Please select a plan.')

    // The form requires logos — but we still allow missing ones to avoid total blockage.
    if (!systemLogoFile || !textLogoFile || !printingLogoFile || !reportCardLogoFile) {
      return setErrorMsg('Please upload all logos (System, Text, Printing, Report Card).')
    }

    setIsSubmitting(true)
    try {
      const [
        systemLogoBase64,
        systemLogoFileName,
        textLogoBase64,
        textLogoFileName,
        printingLogoBase64,
        printingLogoFileName,
        reportCardLogoBase64,
        reportCardLogoFileName,
      ] = await Promise.all([
        fileToBase64(systemLogoFile),
        systemLogoFile.name,
        fileToBase64(textLogoFile),
        textLogoFile.name,
        fileToBase64(printingLogoFile),
        printingLogoFile.name,
        fileToBase64(reportCardLogoFile),
        reportCardLogoFile.name,
      ])

      const payload = {
        branchName: branchName.trim(),
        schoolName: schoolName.trim(),
        adminName: adminName.trim(),
        email: email.trim(),
        mobileNo: mobileNo.trim(),
        city: city.trim(),
        state: state.trim(),
        address: address.trim(),
        status,
        planId,

        systemLogoBase64,
        systemLogoFileName,
        textLogoBase64,
        textLogoFileName,
        printingLogoBase64,
        printingLogoFileName,
        reportCardLogoBase64,
        reportCardLogoFileName,
      }

      const data = await apiSlice.post(endpoints.superadmin.addBranch, payload)
      setSuccessMsg(data.message || 'School added successfully.')
      setTempPassword(data?.data?.tempPassword || '')
      onAdded?.(data)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add school.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="w-full max-w-4xl rounded-2xl border border-primary/20 bg-card shadow-2xl mt-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-foreground">Add School / Branch</h2>
            <p className="text-sm text-foreground/60">Superadmin creates tenant branch + admin user + subscription.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition text-foreground/70"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-600 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 text-sm">
              <CheckCircle size={18} className="shrink-0" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}
          {tempPassword && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-800">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Admin temp password</p>
              <p className="mt-1 text-sm font-extrabold break-all">{tempPassword}</p>
              <p className="mt-1 text-xs text-emerald-800/70">
                Send this to the Branch Admin so they can sign in.
              </p>
            </div>
          )}

          {/* Branding preview */}
          <div className="rounded-xl border border-primary/15 bg-muted/25 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">Plan & Branding</p>
            <div className="mt-2 grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Branch Name</label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/35 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. FSP, MTGA/001"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Plan (cost)</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/35 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : '')}
                  disabled={loadingPlans}
                  required
                >
                  <option value="">Select a plan</option>
                  {plans.map((p) => {
                    const totalCost = Number(p.totalCost || 0)
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({currencySymbol(p.currency)}
                        {totalCost.toLocaleString('en-NG')}/{p.durationMonths} mo)
                      </option>
                    )
                  })}
                </select>
                {selectedPlan && (
                  <p className="text-xs text-foreground/60">
                    {selectedPlan.description || 'All plans include tenant onboarding for school admins.'}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Currency</label>
                <input
                  disabled
                  value={selectedPlan ? `${currencySymbol(selectedPlan.currency)} (${selectedPlan.currency})` : ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/30 text-foreground/80 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
                <p className="text-xs text-foreground/55">Currency is derived from the selected plan.</p>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">School Name</label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/35 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Admin Name</label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/35 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/35 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Mobile No</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/35 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/35 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">City</label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/35 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">State</label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/35 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Address</label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/35 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">Logos</p>
                <div className="space-y-3">
                  <LogoPicker
                    label="System Logo"
                    file={systemLogoFile}
                    onFile={setSystemLogoFile}
                    accept="image/*"
                  />
                  <LogoPicker
                    label="Text Logo"
                    file={textLogoFile}
                    onFile={setTextLogoFile}
                    accept="image/*"
                  />
                  <LogoPicker
                    label="Printing Logo"
                    file={printingLogoFile}
                    onFile={setPrintingLogoFile}
                    accept="image/*"
                  />
                  <LogoPicker
                    label="Report Card Logo"
                    file={reportCardLogoFile}
                    onFile={setReportCardLogoFile}
                    accept="image/*"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-border/60 bg-muted/25 hover:bg-muted/35 text-sm font-semibold transition"
            >
              {tempPassword ? 'Done' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingPlans || !planId || Boolean(tempPassword)}
              className="px-7 py-2.5 rounded-lg bg-primary text-primary-foreground hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 size={18} className="animate-spin" />
                  Adding...
                </span>
              ) : (
                'Add Branch'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LogoPicker({
  label,
  file,
  onFile,
  accept,
}: {
  label: string
  file: File | null
  onFile: (f: File | null) => void
  accept?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-foreground/90">{label}</label>
      <input
        type="file"
        accept={accept || 'image/*'}
        onChange={(e) => onFile(e.target.files?.[0] || null)}
        className="w-full text-sm text-foreground/70 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-primary/25 file:bg-muted/35 file:text-foreground file:text-sm file:cursor-pointer"
      />
      {file ? <p className="text-xs text-foreground/55">{file.name}</p> : <p className="text-xs text-foreground/45">No file selected</p>}
    </div>
  )
}

