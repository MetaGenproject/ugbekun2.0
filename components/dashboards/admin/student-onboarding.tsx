'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { 
  UserPlus, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  Loader2, 
  BookOpen, 
  Award, 
  UserCheck, 
  QrCode, 
  Sparkles,
  ArrowRight,
  Key,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react'

interface ClassData {
  id: number
  name: string
  sections: {
    section: {
      id: number
      name: string
    }
  }[]
}

interface Section {
  id: number
  name: string
}

interface OnboardResult {
  student: {
    id: number
    registerNo: string
    firstName: string
    lastName: string
    gender: string
    birthday: string | null
    idCardToken: string
    createdAt: string
  }
  parent: {
    id: number
    name: string
    relation: string
    email: string | null
    mobileno: string | null
  }
}

interface OnboardResponse {
  success: boolean
  data: OnboardResult
  emailSent: boolean
  credentials?: {
    student: {
      username: string
      password: string
    }
    parent?: {
      username: string
      password: string
    } | null
  }
  pdfBase64?: string | null
}

export function StudentOnboarding() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [availableSections, setAvailableSections] = useState<Section[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Onboarding wizard states
  const [activeStep, setActiveStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [resultData, setResultData] = useState<OnboardResponse | null>(null)

  // Copy & toggle visibility states
  const [showStudentPass, setShowStudentPass] = useState(false)
  const [showParentPass, setShowParentPass] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Form states
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    birthday: '',
    classId: '',
    sectionId: '',
  })

  const [parentForm, setParentForm] = useState({
    name: '',
    relation: 'Father',
    email: '',
    mobileno: '',
  })

  // Load classrooms on mount
  useEffect(() => {
    async function loadData() {
      setIsLoadingClasses(true)
      setLoadError(null)
      try {
        const res = await apiSlice.get<{ success: boolean; classes: ClassData[] }>(
          endpoints.admin.classesSections
        )
        setClasses(res.classes)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load classroom dropdown configuration.')
      } finally {
        setIsLoadingClasses(false)
      }
    }
    loadData()
  }, [])

  // Update sections when class selection changes
  useEffect(() => {
    if (!studentForm.classId) {
      setAvailableSections([])
      setStudentForm(s => ({ ...s, sectionId: '' }))
      return
    }

    const selectedClass = classes.find(c => c.id === Number(studentForm.classId))
    if (selectedClass) {
      setAvailableSections(selectedClass.sections.map(s => s.section))
      setStudentForm(s => ({ ...s, sectionId: '' }))
    }
  }, [studentForm.classId, classes])

  // Submit Handler
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      const payload = {
        student: {
          ...studentForm,
          classId: Number(studentForm.classId),
          sectionId: Number(studentForm.sectionId),
        },
        parent: parentForm,
      }

      const res = await apiSlice.post<OnboardResponse>(
        endpoints.admin.onboardStudent,
        payload
      )

      setResultData(res)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Onboarding pipeline failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset Form for next student
  const handleReset = () => {
    setStudentForm({
      firstName: '',
      lastName: '',
      gender: 'Male',
      birthday: '',
      classId: '',
      sectionId: '',
    })
    setParentForm({
      name: '',
      relation: 'Father',
      email: '',
      mobileno: '',
    })
    setResultData(null)
    setActiveStep(1)
    setErrorMsg(null)
    setShowStudentPass(false)
    setShowParentPass(false)
    setCopiedField(null)
  }

  if (resultData) {
    const s = resultData.data.student
    const p = resultData.data.parent
    const admissionYear = new Date(s.createdAt).getFullYear()

    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
        {/* Success Header */}
        <div className="text-center space-y-2.5 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} className="stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Onboarding Completed Successfully!</h2>
          <p className="text-slate-500 text-sm font-medium">The backend transaction committed and initialized all academic bindings.</p>
        </div>

        {/* Credentials and PDF Download Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Key className="text-emerald-600" size={18} /> Instantly Generated Portal Credentials
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Copy credentials below or download the pre-formatted printable slip.
              </p>
            </div>
            {resultData.pdfBase64 && (
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = `data:application/pdf;base64,${resultData.pdfBase64}`
                  link.download = `login_slip_${s.firstName.toLowerCase()}_${s.lastName.toLowerCase()}.pdf`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                <Download size={15} /> Download Printable Slip (PDF)
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Credentials Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
              <div className="flex items-center gap-2 font-black text-xs text-blue-800 uppercase tracking-wider">
                <GraduationCap size={16} /> Student Access Details
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Username</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono text-slate-800 shadow-sm">
                    <span className="flex-1 select-all truncate">{resultData.credentials?.student.username}</span>
                    <button
                      onClick={() => handleCopyText(resultData.credentials?.student.username || '', 'student_user')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      title="Copy Username"
                    >
                      {copiedField === 'student_user' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Temporary Password</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono text-slate-800 shadow-sm">
                    <input
                      type={showStudentPass ? 'text' : 'password'}
                      value={resultData.credentials?.student.password}
                      readOnly
                      className="flex-1 bg-transparent border-none outline-none select-all truncate w-full"
                    />
                    <button
                      onClick={() => setShowStudentPass(!showStudentPass)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                    >
                      {showStudentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => handleCopyText(resultData.credentials?.student.password || '', 'student_pass')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      title="Copy Password"
                    >
                      {copiedField === 'student_pass' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Credentials Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
              <div className="flex items-center gap-2 font-black text-xs text-amber-800 uppercase tracking-wider">
                <Users size={16} /> Parent Access Details
              </div>

              {resultData.credentials?.parent ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Username</label>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono text-slate-800 shadow-sm">
                      <span className="flex-1 select-all truncate">{resultData.credentials.parent.username}</span>
                      <button
                        onClick={() => handleCopyText(resultData.credentials?.parent?.username || '', 'parent_user')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                        title="Copy Username"
                      >
                        {copiedField === 'parent_user' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Temporary Password</label>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono text-slate-800 shadow-sm">
                      <input
                        type={showParentPass ? 'text' : 'password'}
                        value={resultData.credentials.parent.password}
                        readOnly
                        className="flex-1 bg-transparent border-none outline-none select-all truncate w-full"
                      />
                      <button
                        onClick={() => setShowParentPass(!showParentPass)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      >
                        {showParentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopyText(resultData.credentials?.parent?.password || '', 'parent_pass')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                        title="Copy Password"
                      >
                        {copiedField === 'parent_pass' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center py-4 text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Existing Parent Detected</span>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1 max-w-sm mx-auto">
                    An existing account with email <span className="text-slate-700 font-bold">{p.email || 'N/A'}</span> was reused. Use existing credentials to sign in.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Credentials and Digital Footprint Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Footprint Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-hidden flex flex-col justify-between h-[360px]">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
            
            {/* ID Card Top Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Ugbekun Academy</span>
                <span className="font-extrabold text-slate-900 text-xs">Active Student Card</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            {/* ID Card Middle Body */}
            <div className="flex gap-5 items-center my-6">
              <div className="w-24 h-24 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-700 text-2xl uppercase shadow-inner">
                {s.firstName.substring(0, 1)}{s.lastName.substring(0, 1)}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="font-black text-slate-900 text-lg truncate leading-tight">
                  {s.firstName} {s.lastName}
                </h3>
                <p className="text-xs text-slate-500 font-bold tracking-tight">
                  Reg No: <span className="text-slate-950">{s.registerNo}</span>
                </p>
                <p className="text-xs text-slate-400 font-semibold">
                  Class: <span className="text-slate-700">{classes.find(c => c.id === Number(studentForm.classId))?.name}</span>
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Admitted: {admissionYear}
                </p>
              </div>
            </div>

            {/* ID Card Footer Barcode Footprint */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-400 font-bold uppercase block">Security Fingerprint Token</span>
                <span className="text-[9px] font-mono text-slate-600 truncate max-w-[160px] block">{s.idCardToken}</span>
              </div>
              <QrCode className="text-slate-800" size={36} />
            </div>
          </div>

          {/* Programmatic Achievements summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-4">
            <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" /> Automated Bindings Status
            </h4>
            <p className="text-xs text-slate-400 font-medium">Below actions were dynamically completed in the background process:</p>

            <div className="space-y-3">
              <div className="flex gap-4 items-start p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Curriculum Subjects Linked</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Allocated all subjects matching class & section automatically.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Faculty Connections Registered</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Subject teachers linked with student profile to activate marksheet access.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <Award size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">CA & Exams Matrix Bound</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Generated empty evaluation placeholder rows in student grade sheets.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full mt-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              Onboard Next Student
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Smart Student Onboarding</h1>
            <p className="text-slate-500 text-sm font-medium">Onboard a student and dynamically provision parent relations, classroom schedules, and exams.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-1 rounded-xl shrink-0">
            <button 
              type="button"
              onClick={() => setActiveStep(1)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition ${activeStep === 1 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <GraduationCap size={14} /> Student Info
            </button>
            <button 
              type="button"
              onClick={() => {
                if (studentForm.firstName && studentForm.lastName && studentForm.classId && studentForm.sectionId) {
                  setActiveStep(2)
                } else {
                  setErrorMsg('Please complete student profile (Name, Class & Section) first.')
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition ${activeStep === 2 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Users size={14} /> Parent Info
            </button>
          </div>
        </div>
      </div>

      {/* Load Errors */}
      {loadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
          Error initializing classrooms: {loadError}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
          {errorMsg}
        </div>
      )}

      {isLoadingClasses ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-slate-500 text-sm font-semibold">Configuring environment...</p>
        </div>
      ) : (
        <form onSubmit={handleOnboardSubmit} className="space-y-6">
          {/* STEP 1: STUDENT PROFILE */}
          {activeStep === 1 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5 animate-fade-in">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <GraduationCap size={16} className="text-blue-600" /> Student Profile Details
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">First Name</label>
                  <input 
                    type="text" 
                    placeholder="Student's first name" 
                    value={studentForm.firstName}
                    onChange={e => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Last Name (Surname)</label>
                  <input 
                    type="text" 
                    placeholder="Student's last name" 
                    value={studentForm.lastName}
                    onChange={e => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Gender</label>
                  <select 
                    value={studentForm.gender}
                    onChange={e => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={studentForm.birthday}
                    onChange={e => setStudentForm({ ...studentForm, birthday: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Select Class</label>
                  <select 
                    value={studentForm.classId}
                    onChange={e => setStudentForm({ ...studentForm, classId: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                    required
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Select Section</label>
                  <select 
                    value={studentForm.sectionId}
                    onChange={e => setStudentForm({ ...studentForm, sectionId: e.target.value })}
                    disabled={!studentForm.classId}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 disabled:opacity-50"
                    required
                  >
                    <option value="">-- Choose Section --</option>
                    {availableSections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (studentForm.firstName && studentForm.lastName && studentForm.classId && studentForm.sectionId) {
                      setActiveStep(2)
                      setErrorMsg(null)
                    } else {
                      setErrorMsg('Please complete student profile (Name, Class & Section) first.')
                    }
                  }}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  Continue to Parent Details <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PARENT PROFILE */}
          {activeStep === 2 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5 animate-fade-in">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <Users size={16} className="text-amber-600" /> Parent / Guardian Contacts
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Parent Name</label>
                  <input 
                    type="text" 
                    placeholder="Father or Mother's full name" 
                    value={parentForm.name}
                    onChange={e => setParentForm({ ...parentForm, name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Relationship</label>
                  <select 
                    value={parentForm.relation}
                    onChange={e => setParentForm({ ...parentForm, relation: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Mobile Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 08012345678" 
                    value={parentForm.mobileno}
                    onChange={e => setParentForm({ ...parentForm, mobileno: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. parent@domain.com" 
                    value={parentForm.email}
                    onChange={e => setParentForm({ ...parentForm, email: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer"
                >
                  Back to Student Profile
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-500/10 animate-pulse-subtle"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Complete Onboarding Pipeline
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
