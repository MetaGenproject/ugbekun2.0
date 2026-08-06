'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  GraduationCap, 
  Landmark, 
  Calendar, 
  Users, 
  UploadCloud, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Cloud, 
  Headphones 
} from 'lucide-react'
import { UgbekunLogo } from '@/components/logo'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { resolvePlanSlug, type PlanSummary } from '@/lib/plans'

const nigerianStates = [
  'Lagos', 'Abuja (FCT)', 'Oyo', 'Rivers', 'Kano', 'Ogun', 'Enugu', 'Edo', 'Delta', 'Kaduna',
  'Anambra', 'Akwa Ibom', 'Abia', 'Adamawa', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
  'Ebonyi', 'Ekiti', 'Gombe', 'Imo', 'Jigawa', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Nasarawa',
  'Niger', 'Ondo', 'Osun', 'Plateau', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

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
  const [planSlug, setPlanSlug] = useState<string>('starter')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const rawPlan = params.get('plan')
      if (rawPlan) {
        setPlanSlug(resolvePlanSlug(rawPlan))
      }
    }
  }, [])

  const [summary, setSummary] = useState<PlanSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form Fields
  const [schoolName, setSchoolName] = useState('')
  const [motto, setMotto] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [directorName, setDirectorName] = useState('')
  const [schoolType, setSchoolType] = useState('')
  const [schoolCategory, setSchoolCategory] = useState('')
  const [state, setState] = useState('')
  const [lga, setLga] = useState('')
  const [yearEstablished, setYearEstablished] = useState('')
  const [totalStudents, setTotalStudents] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const data = await apiSlice.get<{ success: boolean; summary: PlanSummary }>(
        endpoints.onboarding.planSummary(planSlug)
      )
      setSummary(data.summary)
    } catch {
      setSummary(null)
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

    if (!schoolName.trim()) {
      setErrorMsg('School name is required.')
      return
    }
    if (!contactNumber.trim()) {
      setErrorMsg('Telephone / Mobile number is required.')
      return
    }
    if (!contactEmail.trim()) {
      setErrorMsg('Email address is required.')
      return
    }
    if (!schoolAddress.trim()) {
      setErrorMsg('School address is required.')
      return
    }
    if (!username.trim()) {
      setErrorMsg('Admin username is required.')
      return
    }
    if (!password) {
      setErrorMsg('Password is required.')
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
        adminName: directorName.trim() || 'School Director',
        contactNumber: contactNumber.trim(),
        contactEmail: contactEmail.trim(),
        username: username.trim(),
        password,
        confirmPassword: password,
        message: `Motto: ${motto} | Type: ${schoolType} | Category: ${schoolCategory} | State: ${state} | LGA: ${lga} | Est: ${yearEstablished} | Students: ${totalStudents}`,
        termsAccepted: true,
        logoBase64,
        logoFileName,
      })

      setSuccessMsg(data.message || 'School account created successfully! Redirecting to login...')
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please check your network connection.'
      setErrorMsg(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-[#081026] text-white overflow-x-hidden flex flex-col justify-between">
      
      {/* Background Campus Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-bg.png"
          alt="School Campus Background"
          fill
          className="object-cover object-center opacity-100 filter brightness-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#081026]/35 via-[#0B1536]/25 to-[#081026]/45" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col justify-between">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-8">
          <UgbekunLogo size="md" />
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition"
          >
            Sign In
          </Link>
        </div>

        {/* Center Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-12">
          
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-5 space-y-8 pt-4">
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
                Let&apos;s <br />
                Build Smarter <br />
                Schools <br />
                <span className="bg-gradient-to-r from-sky-400 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                  Together.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-gray-300 max-w-md leading-relaxed">
                Create your school account and join hundreds of schools already using Ugbekun to manage, teach, learn and grow.
              </p>
            </div>

            {/* 3 Value Prop Cards */}
            <div className="space-y-4 pt-2 max-w-md">
              
              <div className="bg-[#0E1A42]/85 border border-white/10 rounded-2xl p-4 flex items-start gap-4 shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-sky-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Secure & Reliable</h3>
                  <p className="text-xs text-gray-300 mt-0.5">Your data and students are safe with us.</p>
                </div>
              </div>

              <div className="bg-[#0E1A42]/85 border border-white/10 rounded-2xl p-4 flex items-start gap-4 shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0">
                  <Cloud size={20} className="text-pink-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">All-in-One Platform</h3>
                  <p className="text-xs text-gray-300 mt-0.5">Everything your school needs in one powerful system.</p>
                </div>
              </div>

              <div className="bg-[#0E1A42]/85 border border-white/10 rounded-2xl p-4 flex items-start gap-4 shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Headphones size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">24/7 Support</h3>
                  <p className="text-xs text-gray-300 mt-0.5">Our team is always here to support you.</p>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Solid White Registration Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl text-gray-900 border border-gray-100">
              
              {/* Form Card Header */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Landmark size={28} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Sign Up Your School
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Fill in the details below to create your school account.
                </p>
              </div>

              {/* Status Messages */}
              {successMsg && (
                <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold animate-in fade-in">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  <p>{successMsg}</p>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 text-rose-500" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Row 1: School Name & Motto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      School Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter school name"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Motto <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter school motto"
                        value={motto}
                        onChange={(e) => setMotto(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Telephone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Telephone / Mobile <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        required
                        placeholder="0803 123 4567"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="school@email.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Enter complete school address"
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                    />
                  </div>
                </div>

                {/* Row 4: Director / Proprietor Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Director / Proprietor Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Enter director / proprietor name"
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                    />
                  </div>
                </div>

                {/* Row 5: School Type & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      School Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        required
                        value={schoolType}
                        onChange={(e) => setSchoolType(e.target.value)}
                        className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition appearance-none cursor-pointer"
                      >
                        <option value="">Select school type</option>
                        <option value="Nursery & Primary">Nursery & Primary</option>
                        <option value="Secondary / High School">Secondary / High School</option>
                        <option value="Combined (K-12)">Combined (K-12)</option>
                        <option value="Tertiary / College">Tertiary / College</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      School Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Landmark size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        required
                        value={schoolCategory}
                        onChange={(e) => setSchoolCategory(e.target.value)}
                        className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition appearance-none cursor-pointer"
                      >
                        <option value="">Select category</option>
                        <option value="Private School">Private School</option>
                        <option value="Public School">Public School</option>
                        <option value="Mission / Faith-Based">Mission / Faith-Based</option>
                        <option value="International School">International School</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Row 6: State & LGA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition appearance-none cursor-pointer"
                    >
                      <option value="">Select state</option>
                      {nigerianStates.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      LGA <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Select LGA"
                      value={lga}
                      onChange={(e) => setLga(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                    />
                  </div>
                </div>

                {/* Row 7: Year Established & Total Students */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Year Established
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. 2020"
                        value={yearEstablished}
                        onChange={(e) => setYearEstablished(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Total Number of Students
                    </label>
                    <div className="relative">
                      <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        value={totalStudents}
                        onChange={(e) => setTotalStudents(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 8: File Upload Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  
                  {/* Upload Logo Box */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      School Logo <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <label className="relative border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-blue-50/20 transition cursor-pointer group">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        className="hidden"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      />
                      <UploadCloud size={24} className="text-gray-400 group-hover:text-blue-600 transition mb-1" />
                      <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition">
                        {logoFile ? logoFile.name : 'Upload logo'}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG or SVG (Max. 2MB)</span>
                    </label>
                  </div>

                  {/* Upload Signature Box */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Director&apos;s Signature <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <label className="relative border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-blue-50/20 transition cursor-pointer group">
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                      />
                      <UploadCloud size={24} className="text-gray-400 group-hover:text-blue-600 transition mb-1" />
                      <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition">
                        {signatureFile ? signatureFile.name : 'Director\'s signature'}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG (Max. 2MB)</span>
                    </label>
                  </div>

                </div>

                {/* Row 9: Admin Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Admin Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                    />
                  </div>
                </div>

                {/* Row 10: Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Blue Notice Box */}
                <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-blue-800 font-medium">
                  <ShieldCheck size={20} className="text-blue-600 shrink-0" />
                  <p>Your account will be created and you will be able to complete your school profile after sign up.</p>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500 hover:from-blue-700 hover:to-rose-600 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <>
                      <Landmark size={18} />
                      <span>Create School Account</span>
                    </>
                  )}
                </button>

                {/* Sign In Link */}
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="font-bold text-blue-600 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>

              </form>

            </div>
          </div>

        </div>

        {/* Footer Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck size={16} className="text-sky-400" />
            <span>Secure • Reliable • Trusted</span>
          </div>

          <div>
            <span>© 2026 Ugbekun School Management System. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span>Powered by Metagen Project</span>
            <div className="w-5 h-5 rounded bg-gradient-to-r from-blue-600 to-pink-600 flex items-center justify-center text-white font-bold text-[10px]">
              M
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
