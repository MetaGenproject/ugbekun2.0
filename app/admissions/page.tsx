'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  User,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  School,
  AlertCircle,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react'

interface SchoolClass {
  id: number
  name: string
  nameNumeric?: string
}

interface AdmissionMetaData {
  branchId: number
  branchCode: string
  schoolName: string
  tagline: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  phone: string | null
  email: string | null
  address: string | null
  academicSession: string
  currentTerm: string
  classes: SchoolClass[]
  instructions: string
  termsConditions: string | null
}

function AdmissionsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const domainParam = searchParams.get('domain')
  const subdomainParam = searchParams.get('subdomain')
  const branchIdParam = searchParams.get('branchId')

  const [loadingMeta, setLoadingMeta] = useState(true)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [meta, setMeta] = useState<AdmissionMetaData | null>(null)

  // Multi-step wizard state (1: Student, 2: Parent/Guardian, 3: Review & Academic, 4: Success)
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [referenceNo, setReferenceNo] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Form Fields State
  const [formData, setFormData] = useState({
    // Student Info
    firstName: '',
    lastName: '',
    gender: 'Male',
    birthday: '',
    classId: '',
    studentEmail: '',
    studentMobileNo: '',
    presentAddress: '',
    religion: '',
    bloodGroup: '',

    // Guardian Info
    guardianName: '',
    guardianRelation: 'Father',
    grdEmail: '',
    grdMobileNo: '',
    grdAddress: '',
    sameAddress: true,

    // Academic / Additional
    previousSchoolDetails: '',
    agreeTerms: false,
  })

  // Form Errors State
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch School Admissions Metadata
  const fetchMetadata = async () => {
    setLoadingMeta(true)
    setMetaError(null)

    try {
      const query = new URLSearchParams()
      if (domainParam) query.set('domain', domainParam)
      if (subdomainParam) query.set('subdomain', subdomainParam)
      if (branchIdParam) query.set('branchId', branchIdParam)

      if (!domainParam && !subdomainParam && !branchIdParam && typeof window !== 'undefined') {
        const host = window.location.hostname
        query.set('domain', host)
      }

      let json: any = null

      // 1. Try same-origin Next.js proxy route first
      try {
        const proxyRes = await fetch(`/api/proxy/public/tenant/admissions/meta?${query.toString()}`)
        if (proxyRes.ok) {
          json = await proxyRes.json().catch(() => null)
        }
      } catch {
        // Fall back to direct backend
      }

      // 2. Direct backend fallback
      if (!json || !json.success) {
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ugbekun.com').replace(/\/api\/?$/, '')
        const directRes = await fetch(`${backendUrl}/api/public/tenant/admissions/meta?${query.toString()}`)
        json = await directRes.json()
      }

      if (json && json.success && json.data) {
        setMeta(json.data)
        if (json.data.classes?.length > 0 && !formData.classId) {
          setFormData((prev) => ({ ...prev, classId: String(json.data.classes[0].id) }))
        }
      } else {
        throw new Error(json?.message || 'Failed to load admission parameters.')
      }
    } catch (err: any) {
      console.error('[ADMISSIONS] Fetch metadata error:', err)
      setMetaError(err.message || 'Unable to connect to school admissions system.')
    } finally {
      setLoadingMeta(false)
    }
  }

  useEffect(() => {
    fetchMetadata()
  }, [domainParam, subdomainParam, branchIdParam])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Validation per step
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'Student first name is required'
      } else if (formData.firstName.trim().length < 2) {
        newErrors.firstName = 'Name must be at least 2 characters'
      }

      if (!formData.classId) {
        newErrors.classId = 'Please select a class for admission'
      }
    }

    if (step === 2) {
      if (!formData.guardianName.trim()) {
        newErrors.guardianName = 'Parent or Guardian full name is required'
      }

      if (!formData.grdEmail.trim()) {
        newErrors.grdEmail = 'Parent email address is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.grdEmail.trim())) {
        newErrors.grdEmail = 'Please provide a valid email address'
      }

      if (!formData.grdMobileNo.trim()) {
        newErrors.grdMobileNo = 'Parent phone number is required'
      } else if (formData.grdMobileNo.trim().length < 7) {
        newErrors.grdMobileNo = 'Please enter a valid phone number'
      }
    }

    if (step === 3) {
      if (!formData.agreeTerms) {
        newErrors.agreeTerms = 'Please confirm that the information provided is accurate'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const query = new URLSearchParams()
      if (domainParam) query.set('domain', domainParam)
      if (subdomainParam) query.set('subdomain', subdomainParam)
      if (branchIdParam) query.set('branchId', branchIdParam)

      if (!domainParam && !subdomainParam && !branchIdParam && typeof window !== 'undefined') {
        query.set('domain', window.location.hostname)
      }

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        birthday: formData.birthday || undefined,
        classId: parseInt(formData.classId, 10),
        studentEmail: formData.studentEmail.trim() || undefined,
        studentMobileNo: formData.studentMobileNo.trim() || undefined,
        presentAddress: formData.presentAddress.trim() || undefined,
        permanentAddress: formData.presentAddress.trim() || undefined,
        religion: formData.religion || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        guardianName: formData.guardianName.trim(),
        guardianRelation: formData.guardianRelation,
        grdEmail: formData.grdEmail.trim().toLowerCase(),
        grdMobileNo: formData.grdMobileNo.trim(),
        grdAddress: (formData.sameAddress ? formData.presentAddress : formData.grdAddress).trim() || undefined,
        previousSchoolDetails: formData.previousSchoolDetails.trim() || undefined,
      }

      let resJson: any = null

      // 1. Submit through Next.js proxy route
      try {
        const proxyRes = await fetch(`/api/proxy/public/tenant/admissions/apply?${query.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        resJson = await proxyRes.json().catch(() => null)
      } catch {
        // Fallback
      }

      // 2. Fallback to direct backend
      if (!resJson || !resJson.success) {
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ugbekun.com').replace(/\/api\/?$/, '')
        const directRes = await fetch(`${backendUrl}/api/public/tenant/admissions/apply?${query.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        resJson = await directRes.json()
      }

      if (resJson && resJson.success) {
        setReferenceNo(resJson.referenceNo)
        setCurrentStep(4) // Move to Success screen
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        throw new Error(resJson?.message || 'Failed to submit admission application.')
      }
    } catch (err: any) {
      console.error('[ADMISSIONS] Submit error:', err)
      setSubmitError(err.message || 'Something went wrong while submitting. Please verify your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyReferenceToClipboard = () => {
    if (!referenceNo) return
    navigator.clipboard.writeText(referenceNo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Brand Palette Defaults
  const primaryColor = meta?.primaryColor || '#0f172a'
  const secondaryColor = meta?.secondaryColor || '#0284c7'
  const selectedClassName = meta?.classes?.find((c) => String(c.id) === String(formData.classId))?.name || 'Class'

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-sm font-semibold text-slate-400 tracking-wide">Loading Admissions Portal...</p>
      </div>
    )
  }

  if (metaError || !meta) {
    return (
      <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Admissions Portal Unavailable</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {metaError || 'We could not connect to this school admissions office. Please check the school URL or try again.'}
            </p>
          </div>
          <button
            onClick={fetchMetadata}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-lg cursor-pointer"
          >
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* ─── NAVIGATION BAR ─── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <Link href="/" className="flex items-center space-x-3 group">
              {meta.logoUrl ? (
                <img
                  src={meta.logoUrl}
                  alt={meta.schoolName}
                  className="w-11 h-11 rounded-2xl object-cover border border-slate-700 shadow group-hover:border-cyan-400 transition"
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <School size={20} />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-tight group-hover:text-cyan-300 transition">
                  {meta.schoolName}
                </span>
                <span className="text-xs text-slate-400 font-medium">Online Admissions & Enrollment</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-800"
            >
              <ArrowLeft size={14} />
              <span>Back to School</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition shadow"
            >
              <span>Portal Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Banner Card */}
        {currentStep < 4 && (
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-8 border border-slate-800 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles size={13} />
                  <span>{meta.academicSession} Admissions Open</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Student Admission Application
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-xl">
                  {meta.instructions}
                </p>
              </div>

              <div className="hidden md:flex flex-col items-end text-right border-l border-slate-800 pl-6">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">School Contact</span>
                <span className="text-sm text-slate-200 font-semibold">{meta.phone || 'Admissions Desk'}</span>
                <span className="text-xs text-slate-400">{meta.email}</span>
              </div>
            </div>

            {/* Stepper Wizard Progress */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-2 sm:gap-4">
              {/* Step 1 Pill */}
              <div
                className={`flex items-center space-x-2.5 p-2.5 rounded-2xl transition border ${
                  currentStep === 1
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : currentStep > 1
                    ? 'bg-slate-800/60 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    currentStep > 1
                      ? 'bg-emerald-500 text-slate-950'
                      : currentStep === 1
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > 1 ? <Check size={14} /> : '1'}
                </div>
                <span className="text-xs sm:text-sm font-bold truncate">Student Info</span>
              </div>

              {/* Step 2 Pill */}
              <div
                className={`flex items-center space-x-2.5 p-2.5 rounded-2xl transition border ${
                  currentStep === 2
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : currentStep > 2
                    ? 'bg-slate-800/60 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    currentStep > 2
                      ? 'bg-emerald-500 text-slate-950'
                      : currentStep === 2
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > 2 ? <Check size={14} /> : '2'}
                </div>
                <span className="text-xs sm:text-sm font-bold truncate">Parent / Guardian</span>
              </div>

              {/* Step 3 Pill */}
              <div
                className={`flex items-center space-x-2.5 p-2.5 rounded-2xl transition border ${
                  currentStep === 3
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    currentStep === 3 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  3
                </div>
                <span className="text-xs sm:text-sm font-bold truncate">Review & Submit</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 1: STUDENT INFORMATION ─── */}
        {currentStep === 1 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <User size={18} className="text-cyan-400" />
                <span>Prospective Student Details</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Please provide the applicant student&apos;s basic information.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Student First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="e.g. Chukwuma, David, Fatima"
                  className={`w-full px-4 py-3 bg-slate-950/80 border rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                    errors.firstName ? 'border-red-500 focus:border-red-400' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.firstName && <p className="text-xs text-red-400 mt-1">{errors.firstName}</p>}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Student Last Name / Surname
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="e.g. Adeleke, Okon, Ibrahim"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Class Applying For */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Class Applying For <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => handleInputChange('classId', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-950/80 border rounded-2xl text-sm text-white focus:outline-none transition ${
                    errors.classId ? 'border-red-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                >
                  <option value="" disabled>Select target class</option>
                  {meta.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                {errors.classId && <p className="text-xs text-red-400 mt-1">{errors.classId}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Male', 'Female'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleInputChange('gender', g)}
                      className={`py-3 px-4 rounded-2xl text-sm font-semibold border transition ${
                        formData.gender === g
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Religion */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Religion <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.religion}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  placeholder="e.g. Christianity, Islam"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Residential Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Student Residential Address
                </label>
                <textarea
                  rows={2}
                  value={formData.presentAddress}
                  onChange={(e) => handleInputChange('presentAddress', e.target.value)}
                  placeholder="Street address, city, state"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl hover:scale-105 transition-all"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <span>Continue to Guardian Info</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: PARENT / GUARDIAN DETAILS ─── */}
        {currentStep === 2 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Users size={18} className="text-cyan-400" />
                <span>Parent or Legal Guardian Information</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Official admission approval and login credentials will be delivered to this email address.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Guardian Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Parent / Guardian Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.guardianName}
                  onChange={(e) => handleInputChange('guardianName', e.target.value)}
                  placeholder="e.g. Mr. Emmanuel Adeyemi"
                  className={`w-full px-4 py-3 bg-slate-950/80 border rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                    errors.guardianName ? 'border-red-500 focus:border-red-400' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.guardianName && <p className="text-xs text-red-400 mt-1">{errors.guardianName}</p>}
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Relationship to Student
                </label>
                <select
                  value={formData.guardianRelation}
                  onChange={(e) => handleInputChange('guardianRelation', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Uncle">Uncle</option>
                  <option value="Aunt">Aunt</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Guardian Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Guardian Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.grdEmail}
                    onChange={(e) => handleInputChange('grdEmail', e.target.value)}
                    placeholder="parent@example.com"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-950/80 border rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                      errors.grdEmail ? 'border-red-500 focus:border-red-400' : 'border-slate-800 focus:border-cyan-500'
                    }`}
                  />
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                </div>
                {errors.grdEmail ? (
                  <p className="text-xs text-red-400 mt-1">{errors.grdEmail}</p>
                ) : (
                  <p className="text-[11px] text-cyan-400/80 mt-1">Admission credentials will be emailed here.</p>
                )}
              </div>

              {/* Guardian Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Guardian Mobile Phone <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.grdMobileNo}
                    onChange={(e) => handleInputChange('grdMobileNo', e.target.value)}
                    placeholder="08012345678"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-950/80 border rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                      errors.grdMobileNo ? 'border-red-500 focus:border-red-400' : 'border-slate-800 focus:border-cyan-500'
                    }`}
                  />
                  <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                </div>
                {errors.grdMobileNo && <p className="text-xs text-red-400 mt-1">{errors.grdMobileNo}</p>}
              </div>

              {/* Address Checkbox */}
              <div className="sm:col-span-2">
                <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.sameAddress}
                    onChange={(e) => handleInputChange('sameAddress', e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 focus:ring-0"
                  />
                  <span>Guardian residential address is the same as student address</span>
                </label>
              </div>

              {!formData.sameAddress && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Guardian Residential Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.grdAddress}
                    onChange={(e) => handleInputChange('grdAddress', e.target.value)}
                    placeholder="Guardian address details"
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              )}
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center space-x-1.5 px-5 py-3 rounded-2xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ChevronLeft size={18} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl hover:scale-105 transition-all"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <span>Review Application</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: REVIEW & SUBMISSION ─── */}
        {currentStep === 3 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileText size={18} className="text-cyan-400" />
                <span>Academic Background & Final Review</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Verify the entered application information before sending to the admissions office.
              </p>
            </div>

            {/* Previous School Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Previous School Attended <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={formData.previousSchoolDetails}
                onChange={(e) => handleInputChange('previousSchoolDetails', e.target.value)}
                placeholder="Name of previous school, last class passed, reason for transfer"
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Summary Review Card */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Application Summary
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Student Full Name</span>
                  <span className="text-slate-200 font-bold text-sm">
                    {formData.firstName} {formData.lastName || ''}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Target Class</span>
                  <span className="text-slate-200 font-bold text-sm">
                    {selectedClassName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Gender & DOB</span>
                  <span className="text-slate-200 font-medium">
                    {formData.gender} {formData.birthday ? `• ${formData.birthday}` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Guardian Contact</span>
                  <span className="text-slate-200 font-medium">
                    {formData.guardianName} ({formData.guardianRelation})
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-500 block mb-0.5">Notification Email & Phone</span>
                  <span className="text-slate-200 font-semibold text-cyan-300">
                    {formData.grdEmail} • {formData.grdMobileNo}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmation & Consent */}
            <div>
              <label className="flex items-start space-x-3 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-cyan-500 bg-slate-950 border-slate-700 focus:ring-0"
                />
                <span>
                  I declare that the information provided above is true and accurate. I consent to{' '}
                  <strong className="text-white">{meta.schoolName}</strong> processing this admission application
                  and contacting me with updates and portal credentials.
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-red-400 mt-2">{errors.agreeTerms}</p>}
            </div>

            {submitError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Step 3 Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="inline-flex items-center space-x-1.5 px-5 py-3 rounded-2xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                <ChevronLeft size={18} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Submit Online Application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: APPLICATION SUCCESS SCREEN ─── */}
        {currentStep === 4 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-8 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Application Successfully Submitted!
              </h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Thank you for applying to <strong className="text-white">{meta.schoolName}</strong> for{' '}
                <strong className="text-white">{formData.firstName} {formData.lastName}</strong>.
              </p>
            </div>

            {/* Reference Number Banner */}
            <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Application Reference Number
              </span>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tracking-wider">
                {referenceNo}
              </div>
              <button
                onClick={copyReferenceToClipboard}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Reference Copied!' : 'Copy Reference Number'}</span>
              </button>
            </div>

            {/* What Happens Next Card */}
            <div className="max-w-xl mx-auto text-left p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">What Happens Next?</h4>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>
                    A confirmation receipt has been dispatched to <strong>{formData.grdEmail}</strong>.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>
                    The school admissions board will review your ward&apos;s details and determine class placement.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>
                    Upon admission approval by the school principal, your official acceptance letter and <strong>Parent & Student Portal Login Credentials</strong> will be emailed automatically.
                  </span>
                </li>
              </ul>
            </div>

            {/* Completion Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl hover:scale-105 transition-all"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <ArrowLeft size={16} />
                <span>Return to School Homepage</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    firstName: '',
                    lastName: '',
                    gender: 'Male',
                    birthday: '',
                    classId: meta.classes?.[0]?.id ? String(meta.classes[0].id) : '',
                    studentEmail: '',
                    studentMobileNo: '',
                    presentAddress: '',
                    religion: '',
                    bloodGroup: '',
                    guardianName: '',
                    guardianRelation: 'Father',
                    grdEmail: '',
                    grdMobileNo: '',
                    grdAddress: '',
                    sameAddress: true,
                    previousSchoolDetails: '',
                    agreeTerms: false,
                  })
                  setReferenceNo(null)
                  setCurrentStep(1)
                }}
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              >
                <span>Submit Another Application</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          &copy; {new Date().getFullYear()} {meta.schoolName}. Powered by Ugbekun Educational Platform.
        </div>
      </footer>
    </div>
  )
}

export default function AdmissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center text-white space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
          <p className="text-sm font-semibold text-slate-400 tracking-wide">Loading Admissions Portal...</p>
        </div>
      }
    >
      <AdmissionsContent />
    </Suspense>
  )
}
