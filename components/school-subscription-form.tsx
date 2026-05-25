'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { resolvePlanSlug, type PlanSummary } from '@/lib/plans'

const fieldClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/25 bg-muted/40 text-foreground placeholder:text-foreground/45 shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-sm'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function SchoolSubscriptionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planSlug = resolvePlanSlug(searchParams.get('plan'))

  const [summary, setSummary] = useState<PlanSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [schoolName, setSchoolName] = useState('')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [adminName, setAdminName] = useState('')
  const [gender, setGender] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [retypePassword, setRetypePassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [recaptchaChecked, setRecaptchaChecked] = useState(false)

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const data = await apiSlice.get<{ success: boolean; summary: PlanSummary }>(
        endpoints.onboarding.planSummary(planSlug)
      )
      setSummary(data.summary)
    } catch {
      setSummary(null)
      setErrorMsg('Could not load plan details. Please try again.')
    } finally {
      setLoadingSummary(false)
    }
  }, [planSlug])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!termsAccepted) {
      setErrorMsg('You must agree to the Terms & Conditions.')
      return
    }
    if (!recaptchaChecked) {
      setErrorMsg('Please confirm you are not a robot.')
      return
    }
    if (password !== retypePassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      let logoBase64: string | undefined
      let logoFileName: string | undefined
      if (logoFile) {
        logoBase64 = await fileToBase64(logoFile)
        logoFileName = logoFile.name
      }

      const data = await apiSlice.post(endpoints.onboarding.register, {
        planSlug,
        schoolName: schoolName.trim(),
        schoolAddress: schoolAddress.trim(),
        adminName: adminName.trim(),
        gender,
        contactNumber: contactNumber.trim(),
        contactEmail: contactEmail.trim(),
        username: username.trim(),
        password,
        confirmPassword: retypePassword,
        message: message.trim(),
        termsAccepted: true,
        logoBase64,
        logoFileName,
      })

      setSuccessMsg(data.message || 'Registration successful!')
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.'
      setErrorMsg(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCost = (cost: number, currency: string) => {
    if (cost === 0) return 'Custom'
    return `${currency === 'NGN' ? '₦' : ''}${cost.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="relative w-full max-w-4xl rounded-lg bg-card shadow-2xl border border-primary/15 ring-1 ring-border/60 my-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h2 className="text-xl font-bold text-foreground">School Subscription</h2>
          <Link
            href="/"
            className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-muted/50 transition"
            aria-label="Close"
          >
            <X size={22} />
          </Link>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Plan Summary */}
          <div className="rounded-lg border border-primary/20 bg-muted/30 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Plan Summary</h3>
            {loadingSummary ? (
              <div className="flex items-center gap-2 text-sm text-foreground/60">
                <Loader2 size={16} className="animate-spin" />
                Loading plan...
              </div>
            ) : summary ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-foreground/60 mb-0.5">Plan Name</p>
                  <p className="font-semibold text-foreground">{summary.planName}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-0.5">Start Date</p>
                  <p className="font-semibold text-foreground">{summary.startDateFormatted}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-0.5">Expiry Date</p>
                  <p className="font-semibold text-foreground">{summary.expiryDateFormatted}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-0.5">Total Cost</p>
                  <p className="font-semibold text-foreground">
                    {formatCost(summary.totalCost, summary.currency)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-rose-500">Plan not available.</p>
            )}
          </div>

          {successMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-sm">
              <CheckCircle size={18} className="shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left — School */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    School Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    School Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">School Logo</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className={`${fieldClass} file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-primary/20 file:bg-muted/60 file:text-foreground file:text-sm file:cursor-pointer file:font-medium`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Message</label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${fieldClass} resize-none`}
                  />
                </div>
              </div>

              {/* Right — Admin */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Admin Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Select a gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Contact Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Contact Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Admin Login Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Admin Login Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Retype Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={retypePassword}
                    onChange={(e) => setRetypePassword(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-border/50">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>
                    I agree to{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms &amp; Conditions
                    </Link>
                    .
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer border border-primary/25 rounded-lg px-3 py-2 bg-muted/40 shadow-sm w-fit">
                  <input
                    type="checkbox"
                    checked={recaptchaChecked}
                    onChange={(e) => setRecaptchaChecked(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>I&apos;m not a robot</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || loadingSummary || !summary}
                className="px-8 py-2.5 bg-[#1e3a5f] hover:bg-[#152d4a] text-white rounded font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed sm:ml-auto"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Registering...
                  </span>
                ) : (
                  'Register & Payment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
