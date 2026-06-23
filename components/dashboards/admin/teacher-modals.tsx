'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  X,
  Loader2,
  UserPlus,
  Edit,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  Key,
  CheckCircle2
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// PROPS INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

interface TeacherOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface EditTeacherModalProps {
  isOpen: boolean
  teacher: {
    id: number
    name: string
    email: string | null
    phone: string | null
  } | null
  onClose: () => void
  onSuccess: () => void
}

interface OnboardResponse {
  success: boolean
  data: {
    teacher: {
      id: number
      name: string
      email: string
      phone: string | null
    }
  }
  emailSent: boolean
  credentials?: {
    username: string
    password: string
  }
  pdfBase64?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER ONBOARDING MODAL
// ─────────────────────────────────────────────────────────────────────────────

export function TeacherOnboardingModal({ isOpen, onClose, onSuccess }: TeacherOnboardingModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [resultData, setResultData] = useState<OnboardResponse | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleReset = () => {
    setName('')
    setEmail('')
    setPhone('')
    setResultData(null)
    setErrorMsg(null)
    setIsSubmitting(false)
    setShowPassword(false)
    setCopiedField(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      }

      const res = await apiSlice.post<OnboardResponse>(
        endpoints.admin.onboardTeacher,
        payload
      )

      setResultData(res)
      onSuccess()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Teacher onboarding failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="text-[#0063a6]" size={18} /> Onboard New Teacher
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {resultData ? (
            <div className="space-y-6">
              <div className="text-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} className="stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Onboarding Completed!</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {resultData.emailSent 
                    ? `Account created. Portal credentials successfully delivered to ${resultData.data.teacher.email}.`
                    : `Account created. (Email skipped or failed delivery).`}
                </p>
              </div>

              {/* Credentials Slip */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-5 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#0063a6]" />
                <div className="flex items-center gap-2 font-black text-xs text-[#0063a6] uppercase tracking-wider">
                  <Key size={14} /> Teacher Account Access
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Username</label>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono text-slate-800 shadow-sm">
                      <span className="flex-1 select-all truncate">{resultData.credentials?.username}</span>
                      <button
                        onClick={() => handleCopyText(resultData.credentials?.username || '', 'username')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      >
                        {copiedField === 'username' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Temporary Password</label>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono text-slate-800 shadow-sm">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={resultData.credentials?.password}
                        readOnly
                        className="flex-1 bg-transparent border-none outline-none select-all truncate w-full"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopyText(resultData.credentials?.password || '', 'password')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      >
                        {copiedField === 'password' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {resultData.pdfBase64 && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = `data:application/pdf;base64,${resultData.pdfBase64}`
                      link.download = `login_slip_teacher_${resultData.data.teacher.name.toLowerCase().replace(/\s+/g, '_')}.pdf`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    <Download size={15} /> Download Printable Slip (PDF)
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition active:scale-[0.98]"
                >
                  Onboard Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Teacher Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0063a6] transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email Address <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="e.g. teacher@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0063a6] transition"
                />
                <p className="text-[10px] text-slate-400 font-semibold">Login credentials will be dispatched to this address.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Contact Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 08033332222"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0063a6] transition"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Complete Onboarding
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT TEACHER DETAILS MODAL
// ─────────────────────────────────────────────────────────────────────────────

export function EditTeacherModal({ isOpen, teacher, onClose, onSuccess }: EditTeacherModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Populate data when teacher changes
  useEffect(() => {
    if (teacher) {
      setName(teacher.name || '')
      setEmail(teacher.email || '')
      setPhone(teacher.phone || '')
      setErrorMsg(null)
    }
  }, [teacher])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return

    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      }

      await apiSlice.put(
        endpoints.admin.updateTeacher(teacher.id),
        payload
      )

      onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update teacher.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !teacher) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Edit className="text-[#0063a6]" size={18} /> Edit Teacher Details
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Teacher Full Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0063a6] transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Email Address <span className="text-rose-500">*</span></label>
              <input
                type="email"
                required
                placeholder="e.g. teacher@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0063a6] transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Contact Number</label>
              <input
                type="tel"
                placeholder="e.g. 08033332222"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0063a6] transition"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
