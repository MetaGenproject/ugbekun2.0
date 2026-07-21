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
  CheckCircle2,
  Plus,
  Trash2,
  Users
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

interface ClassSectionData {
  section: {
    id: number
    name: string
  }
}

interface ClassData {
  id: number
  name: string
  sections: ClassSectionData[]
}

interface SubjectData {
  id: number
  name: string
  subjectCode: string
}

const STAFF_ROLE_LABELS: Record<string, string> = {
  '3': 'Teacher',
  '4': 'Accountant',
  '8': 'Receptionist',
  '9': 'Proprietor',
  '12': 'Librarian',
  '13': 'Staff',
}

interface PendingStaff {
  id: string
  name: string
  email: string
  phone: string
  role: string
  roleLabel: string
  isClassTeacher: boolean
  classTeacherClassId: string
  classTeacherSectionId: string
  isSubjectTeacher: boolean
  subjectTeacherClassId: string
  subjectTeacherSectionId: string
  subjectTeacherSubjectId: string
}

export function TeacherOnboardingModal({ isOpen, onClose, onSuccess }: TeacherOnboardingModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [role, setRole] = useState('3')
  const [isClassTeacher, setIsClassTeacher] = useState(false)
  const [isSubjectTeacher, setIsSubjectTeacher] = useState(false)
  const [classTeacherClassId, setClassTeacherClassId] = useState('')
  const [classTeacherSectionId, setClassTeacherSectionId] = useState('')
  const [subjectTeacherClassId, setSubjectTeacherClassId] = useState('')
  const [subjectTeacherSectionId, setSubjectTeacherSectionId] = useState('')
  const [subjectTeacherSubjectId, setSubjectTeacherSubjectId] = useState('')

  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Batch Onboarding States
  const [pendingStaffList, setPendingStaffList] = useState<PendingStaff[]>([])
  const [batchResultData, setBatchResultData] = useState<(OnboardResponse & { name: string; role: string; email: string; error?: string })[]>([])
  const [showPasswordMap, setShowPasswordMap] = useState<Record<number, boolean>>({})
  const [copiedFieldMap, setCopiedFieldMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isOpen) {
      loadSetupData()
    }
  }, [isOpen])

  const loadSetupData = async () => {
    try {
      const [classRes, subjectRes] = await Promise.all([
        apiSlice.get<{ success: boolean; classes: ClassData[] }>(endpoints.admin.classesSections),
        apiSlice.get<{ success: boolean; subjects: SubjectData[] }>(endpoints.admin.subjects),
      ])
      if (classRes.success && classRes.classes) {
        setClasses(classRes.classes)
      }
      if (subjectRes.success && subjectRes.subjects) {
        setSubjects(subjectRes.subjects)
      }
    } catch (err) {
      console.error('Failed to load setup data for onboarding:', err)
    }
  }

  const handleCopyTextWithMap = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedFieldMap(prev => ({ ...prev, [key]: true }))
    setTimeout(() => {
      setCopiedFieldMap(prev => ({ ...prev, [key]: false }))
    }, 2000)
  }

  const handleReset = () => {
    setName('')
    setEmail('')
    setPhone('')
    setRole('3')
    setIsClassTeacher(false)
    setIsSubjectTeacher(false)
    setClassTeacherClassId('')
    setClassTeacherSectionId('')
    setSubjectTeacherClassId('')
    setSubjectTeacherSectionId('')
    setSubjectTeacherSubjectId('')
    setBatchResultData([])
    setPendingStaffList([])
    setErrorMsg(null)
    setIsSubmitting(false)
    setShowPasswordMap({})
    setCopiedFieldMap({})
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleAddMore = () => {
    setErrorMsg(null)
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName || !trimmedEmail) {
      setErrorMsg('Name and email are required to add a staff member.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    const newItem: PendingStaff = {
      id: Math.random().toString(),
      name: trimmedName,
      email: trimmedEmail,
      phone: phone.trim(),
      role,
      roleLabel: STAFF_ROLE_LABELS[role] || 'Staff',
      isClassTeacher,
      classTeacherClassId,
      classTeacherSectionId,
      isSubjectTeacher,
      subjectTeacherClassId,
      subjectTeacherSectionId,
      subjectTeacherSubjectId,
    }

    setPendingStaffList([...pendingStaffList, newItem])

    // Clear form inputs, keeping setup data
    setName('')
    setEmail('')
    setPhone('')
    setIsClassTeacher(false)
    setIsSubjectTeacher(false)
    setClassTeacherClassId('')
    setClassTeacherSectionId('')
    setSubjectTeacherClassId('')
    setSubjectTeacherSectionId('')
    setSubjectTeacherSubjectId('')
  }

  const handleRemovePending = (id: string) => {
    setPendingStaffList(pendingStaffList.filter(item => item.id !== id))
  }

  const handleDownloadAllPDFs = () => {
    batchResultData.forEach((res) => {
      if (res.pdfBase64) {
        const link = document.createElement('a')
        link.href = `data:application/pdf;base64,${res.pdfBase64}`
        link.download = `login_slip_staff_${res.name.toLowerCase().replace(/\s+/g, '_')}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)

    // Prepare all items to onboard
    let itemsToOnboard = [...pendingStaffList]

    // If there is currently filled text in the form, validate and add it as the final item
    const currentName = name.trim()
    const currentEmail = email.trim()

    if (currentName || currentEmail) {
      if (!currentName || !currentEmail) {
        setErrorMsg('Please finish filling the current staff details or clear the fields before onboarding.')
        setIsSubmitting(false)
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(currentEmail)) {
        setErrorMsg('Please enter a valid email address for the current staff member.')
        setIsSubmitting(false)
        return
      }

      itemsToOnboard.push({
        id: 'current-form',
        name: currentName,
        email: currentEmail,
        phone: phone.trim(),
        role,
        roleLabel: STAFF_ROLE_LABELS[role] || 'Staff',
        isClassTeacher,
        classTeacherClassId,
        classTeacherSectionId,
        isSubjectTeacher,
        subjectTeacherClassId,
        subjectTeacherSectionId,
        subjectTeacherSubjectId,
      })
    }

    if (itemsToOnboard.length === 0) {
      setErrorMsg('Please enter at least one staff member details or add to list.')
      setIsSubmitting(false)
      return
    }

    const results: (OnboardResponse & { name: string; role: string; email: string; error?: string })[] = []
    let hasSuccess = false

    for (const item of itemsToOnboard) {
      try {
        const payload = {
          name: item.name,
          email: item.email,
          phone: item.phone || undefined,
          role: Number(item.role),
          isClassTeacher: item.isClassTeacher,
          classTeacherClassId: item.classTeacherClassId ? Number(item.classTeacherClassId) : undefined,
          classTeacherSectionId: item.classTeacherSectionId ? Number(item.classTeacherSectionId) : undefined,
          isSubjectTeacher: item.isSubjectTeacher,
          subjectTeacherClassId: item.subjectTeacherClassId ? Number(item.subjectTeacherClassId) : undefined,
          subjectTeacherSectionId: item.subjectTeacherSectionId ? Number(item.subjectTeacherSectionId) : undefined,
          subjectTeacherSubjectId: item.subjectTeacherSubjectId ? Number(item.subjectTeacherSubjectId) : undefined,
        }

        const res = await apiSlice.post<OnboardResponse>(
          endpoints.admin.onboardTeacher,
          payload
        )

        results.push({
          ...res,
          name: item.name,
          role: item.roleLabel,
          email: item.email,
        })
        hasSuccess = true
      } catch (err: any) {
        results.push({
          success: false,
          data: {
            teacher: {
              id: 0,
              name: item.name,
              email: item.email,
              phone: item.phone || null,
            }
          },
          name: item.name,
          role: item.roleLabel,
          email: item.email,
          emailSent: false,
          error: err instanceof Error ? err.message : 'Onboarding failed',
        })
      }
    }

    setBatchResultData(results)
    if (hasSuccess) {
      onSuccess()
    }
    setIsSubmitting(false)
  }

  if (!isOpen) return null

  const hasPending = pendingStaffList.length > 0
  const successBatchCount = batchResultData.filter(r => r.success).length
  const totalBatchCount = batchResultData.length
  const hasPDFs = batchResultData.some(r => r.pdfBase64)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`relative bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 transition-all ${
        (hasPending || batchResultData.length > 0) ? 'max-w-4xl' : 'max-w-lg'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 shrink-0">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="text-[#0063a6]" size={18} /> Onboard New Staff / Teacher
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {batchResultData.length > 0 ? (
            <div className="space-y-6">
              <div className="text-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} className="stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Onboarding Completed!</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Processed {totalBatchCount} staff account(s). {successBatchCount} succeeded, {totalBatchCount - successBatchCount} failed.
                </p>
              </div>

              {/* Grid of Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {batchResultData.map((res, idx) => (
                  <div key={idx} className={`rounded-xl border p-4 space-y-3 relative overflow-hidden ${
                    res.success ? 'border-slate-200 bg-slate-50' : 'border-rose-100 bg-rose-50/30'
                  }`}>
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${res.success ? 'bg-[#0063a6]' : 'bg-rose-500'}`} />
                    
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{res.name}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{res.role} • {res.email}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        res.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {res.success ? 'Success' : 'Failed'}
                      </span>
                    </div>

                    {res.success ? (
                      <div className="space-y-2 pl-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Username</label>
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono text-slate-800 shadow-sm">
                            <span className="flex-1 select-all truncate">{res.credentials?.username}</span>
                            <button
                              onClick={() => handleCopyTextWithMap(res.credentials?.username || '', `user-${idx}`)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                            >
                              {copiedFieldMap[`user-${idx}`] ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Temporary Password</label>
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono text-slate-800 shadow-sm">
                            <input
                              type={showPasswordMap[idx] ? 'text' : 'password'}
                              value={res.credentials?.password || ''}
                              readOnly
                              className="flex-1 bg-transparent border-none outline-none select-all truncate w-full"
                            />
                            <button
                              onClick={() => setShowPasswordMap(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                            >
                              {showPasswordMap[idx] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              onClick={() => handleCopyTextWithMap(res.credentials?.password || '', `pass-${idx}`)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                            >
                              {copiedFieldMap[`pass-${idx}`] ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>

                        {res.pdfBase64 && (
                          <button
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = `data:application/pdf;base64,${res.pdfBase64}`
                              link.download = `login_slip_staff_${res.name.toLowerCase().replace(/\s+/g, '_')}.pdf`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                            className="w-full mt-1.5 py-1 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                          >
                            <Download size={12} /> Download PDF Slip
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-rose-600 font-semibold pl-2 py-1">
                        {res.error || 'Failed to onboard this staff member.'}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                {hasPDFs && (
                  <button
                    onClick={handleDownloadAllPDFs}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    <Download size={15} /> Download All Printable Slips (PDFs)
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl transition active:scale-[0.98]"
                >
                  Onboard Another Batch
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Side: Onboarding Form */}
              <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Staff Role <span className="text-rose-500">*</span></label>
                    <select
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value)
                        // Reset teacher flags if not teacher role
                        if (e.target.value !== '3') {
                          setIsClassTeacher(false)
                          setIsSubjectTeacher(false)
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 outline-none focus:border-[#0063a6] transition"
                    >
                      <option value="3">Teacher</option>
                      <option value="4">Accountant</option>
                      <option value="8">Receptionist</option>
                      <option value="9">Proprietor</option>
                      <option value="12">Librarian</option>
                      <option value="13">Staff</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{role === '3' ? 'Teacher' : 'Staff'} Full Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
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

                  {role === '3' && (
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
                      <p className="text-xs font-bold text-slate-700">Teacher Designation & Immediate Class Assignment</p>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isClassTeacher}
                            onChange={(e) => setIsClassTeacher(e.target.checked)}
                            className="rounded border-slate-300 text-[#0063a6] focus:ring-[#0063a6]"
                          />
                          Class Teacher (Form Teacher)
                        </label>

                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSubjectTeacher}
                            onChange={(e) => setIsSubjectTeacher(e.target.checked)}
                            className="rounded border-slate-300 text-[#0063a6] focus:ring-[#0063a6]"
                          />
                          Subject Teacher
                        </label>
                      </div>

                      {/* Class Teacher (Form Teacher) Allocation Dropdowns */}
                      {isClassTeacher && (
                        <div className="space-y-3 pt-2 border-t border-slate-200/60">
                          <p className="text-[11px] font-bold text-[#0063a6] uppercase tracking-wider">Allocate Form/Class Classroom</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">Class <span className="text-rose-500">*</span></label>
                              <select
                                required={isClassTeacher}
                                value={classTeacherClassId}
                                onChange={(e) => {
                                  setClassTeacherClassId(e.target.value)
                                  setClassTeacherSectionId('')
                                }}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                              >
                                <option value="">Select Class</option>
                                {classes.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">Section <span className="text-rose-500">*</span></label>
                              <select
                                required={isClassTeacher}
                                value={classTeacherSectionId}
                                onChange={(e) => setClassTeacherSectionId(e.target.value)}
                                disabled={!classTeacherClassId}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none disabled:opacity-60"
                              >
                                <option value="">Select Section</option>
                                {classTeacherClassId &&
                                  classes
                                    .find((c) => String(c.id) === classTeacherClassId)
                                    ?.sections.map((s) => (
                                      <option key={s.section.id} value={s.section.id}>
                                        {s.section.name}
                                      </option>
                                    ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subject Teacher Assignment Dropdowns */}
                      {isSubjectTeacher && (
                        <div className="space-y-3 pt-2 border-t border-slate-200/60">
                          <p className="text-[11px] font-bold text-[#0063a6] uppercase tracking-wider">Assign Subject & Classroom</p>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">Subject <span className="text-rose-500">*</span></label>
                            <select
                              required={isSubjectTeacher}
                              value={subjectTeacherSubjectId}
                              onChange={(e) => setSubjectTeacherSubjectId(e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                            >
                              <option value="">Select Subject</option>
                              {subjects.map((sub) => (
                                <option key={sub.id} value={sub.id}>{sub.name} ({sub.subjectCode})</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">Class <span className="text-rose-500">*</span></label>
                              <select
                                required={isSubjectTeacher}
                                value={subjectTeacherClassId}
                                onChange={(e) => {
                                  setSubjectTeacherClassId(e.target.value)
                                  setSubjectTeacherSectionId('')
                                }}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                              >
                                <option value="">Select Class</option>
                                {classes.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">Section <span className="text-rose-500">*</span></label>
                              <select
                                required={isSubjectTeacher}
                                value={subjectTeacherSectionId}
                                onChange={(e) => setSubjectTeacherSectionId(e.target.value)}
                                disabled={!subjectTeacherClassId}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none disabled:opacity-60"
                              >
                                <option value="">Select Section</option>
                                {subjectTeacherClassId &&
                                  classes
                                    .find((c) => String(c.id) === subjectTeacherClassId)
                                    ?.sections.map((s) => (
                                      <option key={s.section.id} value={s.section.id}>
                                        {s.section.name}
                                      </option>
                                    ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={handleAddMore}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98]"
                    >
                      <Plus size={14} /> Add More (Save to List)
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} /> Complete Onboarding {hasPending && `(${pendingStaffList.length + (name || email ? 1 : 0)})`}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side: List of Staff Added */}
              {hasPending && (
                <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6 flex flex-col max-h-[500px]">
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                    <Users size={16} className="text-[#0063a6]" />
                    <span className="font-black text-xs text-slate-700 uppercase tracking-wider">Staff List to Onboard ({pendingStaffList.length})</span>
                  </div>

                  <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                    {pendingStaffList.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start justify-between gap-3 shadow-sm hover:shadow-md transition">
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">{item.name}</h5>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{item.roleLabel} • {item.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePending(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 hover:bg-slate-100 rounded-lg transition shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
