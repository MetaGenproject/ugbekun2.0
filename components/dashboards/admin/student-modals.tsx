'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { 
  X, 
  Edit3, 
  Loader2, 
  User, 
  GraduationCap, 
  Phone, 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'

interface Section {
  id: number
  name: string
}

interface ClassData {
  id: number
  name: string
  sections: {
    section: Section
  }[]
}

interface EditStudentModalProps {
  isOpen: boolean
  studentId: number | null
  classes: ClassData[]
  onClose: () => void
  onSuccess: () => void
}

export function EditStudentModal({ isOpen, studentId, classes, onClose, onSuccess }: EditStudentModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'contact' | 'parent' | 'additional'>('personal')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    birthday: '',
    registerNo: '',
    photo: '',
    active: true,
    classId: '',
    sectionId: '',
    mobileno: '',
    email: '',
    currentAddress: '',
    permanentAddress: '',
    city: '',
    state: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentRelation: '',
    religion: '',
    caste: '',
    bloodGroup: '',
    motherTongue: '',
    previousDetails: '',
  })

  // Available sections based on selected classId
  const [availableSections, setAvailableSections] = useState<Section[]>([])

  // Load student details when modal opens with studentId
  useEffect(() => {
    if (isOpen && studentId) {
      loadStudentDetails(studentId)
    } else {
      resetForm()
    }
  }, [isOpen, studentId])

  // Update available sections when classId changes
  useEffect(() => {
    if (!formData.classId) {
      setAvailableSections([])
      return
    }
    const selectedClass = classes.find(c => c.id === Number(formData.classId))
    if (selectedClass && selectedClass.sections) {
      setAvailableSections(selectedClass.sections.map(s => s.section))
    } else {
      setAvailableSections([])
    }
  }, [formData.classId, classes])

  const resetForm = () => {
    setActiveTab('personal')
    setErrorMsg(null)
    setSuccessMsg(null)
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'Male',
      birthday: '',
      registerNo: '',
      photo: '',
      active: true,
      classId: '',
      sectionId: '',
      mobileno: '',
      email: '',
      currentAddress: '',
      permanentAddress: '',
      city: '',
      state: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      parentRelation: '',
      religion: '',
      caste: '',
      bloodGroup: '',
      motherTongue: '',
      previousDetails: '',
    })
  }

  const loadStudentDetails = async (id: number) => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await apiSlice.get<{ success: boolean; student: any }>(
        endpoints.admin.student(id)
      )
      if (res.success && res.student) {
        const s = res.student
        setFormData({
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          gender: s.gender || 'Male',
          birthday: s.birthday || '',
          registerNo: s.registerNo || '',
          photo: s.photo || '',
          active: s.active !== undefined ? s.active : true,
          classId: s.classId ? String(s.classId) : '',
          sectionId: s.sectionId ? String(s.sectionId) : '',
          mobileno: s.mobileno || '',
          email: s.email || '',
          currentAddress: s.currentAddress || '',
          permanentAddress: s.permanentAddress || '',
          city: s.city || '',
          state: s.state || '',
          parentName: s.parent?.name || '',
          parentEmail: s.parent?.email || '',
          parentPhone: s.parent?.mobileno || '',
          parentRelation: s.parent?.relation || '',
          religion: s.religion || '',
          caste: s.caste || '',
          bloodGroup: s.bloodGroup || '',
          motherTongue: s.motherTongue || '',
          previousDetails: s.previousDetails || '',
        })
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load student details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) return

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg('First Name and Last Name are required.')
      return
    }

    setErrorMsg(null)
    setSuccessMsg(null)
    setIsSubmitting(true)

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        birthday: formData.birthday || null,
        registerNo: formData.registerNo.trim() || null,
        photo: formData.photo.trim() || null,
        active: formData.active,
        classId: formData.classId ? Number(formData.classId) : null,
        sectionId: formData.sectionId ? Number(formData.sectionId) : null,
        mobileno: formData.mobileno.trim() || null,
        email: formData.email.trim() || null,
        currentAddress: formData.currentAddress.trim() || null,
        permanentAddress: formData.permanentAddress.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        parentName: formData.parentName.trim() || null,
        parentEmail: formData.parentEmail.trim() || null,
        parentPhone: formData.parentPhone.trim() || null,
        parentRelation: formData.parentRelation.trim() || null,
        religion: formData.religion.trim() || null,
        caste: formData.caste.trim() || null,
        bloodGroup: formData.bloodGroup.trim() || null,
        motherTongue: formData.motherTongue.trim() || null,
        previousDetails: formData.previousDetails.trim() || null,
      }

      const res = await apiSlice.put<{ success: boolean; message: string }>(
        endpoints.admin.updateStudent(studentId),
        payload
      )

      if (res.success) {
        setSuccessMsg('Student information updated successfully!')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1000)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update student information.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !studentId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0063a6]/10 text-[#0063a6] rounded-xl">
              <Edit3 size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Edit Student Information
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Correct student records, academic placement, and parent details.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 bg-white overflow-x-auto">
          {[
            { id: 'personal', label: 'Personal Details', icon: User },
            { id: 'academic', label: 'Class & Section', icon: GraduationCap },
            { id: 'contact', label: 'Contact & Address', icon: Phone },
            { id: 'parent', label: 'Parent / Guardian', icon: Users },
            { id: 'additional', label: 'Additional Details', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-[#0063a6] text-[#0063a6] bg-[#0063a6]/5'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Form Body */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="animate-spin text-[#0063a6]" size={28} />
              <p className="text-xs font-semibold">Loading student record...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Feedback messages */}
              {errorMsg && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Tab 1: Personal Details */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={e => handleChange('firstName', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={e => handleChange('lastName', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={e => handleChange('gender', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.birthday}
                        onChange={e => handleChange('birthday', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Registration / Admission No</label>
                      <input
                        type="text"
                        value={formData.registerNo}
                        onChange={e => handleChange('registerNo', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                        placeholder="e.g. UGB-2026-0042"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                      <select
                        value={formData.active ? 'true' : 'false'}
                        onChange={e => handleChange('active', e.target.value === 'true')}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none bg-white"
                      >
                        <option value="true">Active Student</option>
                        <option value="false">Inactive / Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Photo URL</label>
                    <input
                      type="text"
                      value={formData.photo}
                      onChange={e => handleChange('photo', e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      placeholder="https://cloudinary.com/sample.jpg or base64"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Class & Section */}
              {activeTab === 'academic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Class Placement</label>
                      <select
                        value={formData.classId}
                        onChange={e => handleChange('classId', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none bg-white"
                      >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Section Allocation</label>
                      <select
                        value={formData.sectionId}
                        onChange={e => handleChange('sectionId', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none bg-white"
                        disabled={!formData.classId}
                      >
                        <option value="">Select Section</option>
                        {availableSections.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Contact & Address */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Student Phone / Mobile</label>
                      <input
                        type="text"
                        value={formData.mobileno}
                        onChange={e => handleChange('mobileno', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Student Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={e => handleChange('city', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">State / Province</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={e => handleChange('state', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current Residential Address</label>
                    <textarea
                      rows={2}
                      value={formData.currentAddress}
                      onChange={e => handleChange('currentAddress', e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Permanent Address</label>
                    <textarea
                      rows={2}
                      value={formData.permanentAddress}
                      onChange={e => handleChange('permanentAddress', e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Parent & Guardian */}
              {activeTab === 'parent' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Parent / Guardian Name</label>
                      <input
                        type="text"
                        value={formData.parentName}
                        onChange={e => handleChange('parentName', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                      <input
                        type="text"
                        value={formData.parentRelation}
                        onChange={e => handleChange('parentRelation', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                        placeholder="Father, Mother, Guardian, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Parent Email</label>
                      <input
                        type="email"
                        value={formData.parentEmail}
                        onChange={e => handleChange('parentEmail', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Parent Mobile / Phone</label>
                      <input
                        type="text"
                        value={formData.parentPhone}
                        onChange={e => handleChange('parentPhone', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Additional Details */}
              {activeTab === 'additional' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Religion</label>
                      <input
                        type="text"
                        value={formData.religion}
                        onChange={e => handleChange('religion', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={e => handleChange('bloodGroup', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none bg-white"
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mother Tongue</label>
                      <input
                        type="text"
                        value={formData.motherTongue}
                        onChange={e => handleChange('motherTongue', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Caste / Sub-Caste</label>
                      <input
                        type="text"
                        value={formData.caste}
                        onChange={e => handleChange('caste', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Previous School & Academic History</label>
                    <textarea
                      rows={2}
                      value={formData.previousDetails}
                      onChange={e => handleChange('previousDetails', e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0063a6]/20 focus:border-[#0063a6] outline-none resize-none"
                      placeholder="Previous school name, last grade passed, etc."
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#0063a6] hover:bg-[#00528a] active:scale-[0.98] rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Saving Changes...
                    </>
                  ) : (
                    'Save Student Changes'
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
