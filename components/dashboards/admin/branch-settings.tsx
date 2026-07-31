'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Building2,
  Users,
  Sliders,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Lock,
  Bell,
  Sparkles,
  Clock,
  Coins,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { safeStorage } from '@/lib/safeStorage'

interface SystemSettingsData {
  schoolName: string
  tagline: string
  address: string
  phone: string
  email: string
  website: string
  logoUrl: string
  principalSignatureUrl: string
  currencySymbol: string
  academicSession: string
  currentTerm: string

  regNoPrefix: string
  regNoDigits: number
  defaultStudentPassword: string
  autoSmsAttendance: boolean
  maxAbsentDaysAlert: number
  idCardTheme: string

  maintenanceMode: boolean
  aiAssistanceEnabled: boolean
  notificationChannel: string
  timezone: string
  dateFormat: string
  weeklyMintLimit: number
}

export function BranchSettings() {
  const [activeTab, setActiveTab] = useState<'school' | 'student' | 'other'>('school')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [form, setForm] = useState<SystemSettingsData>({
    schoolName: 'Ugbekun International Academy',
    tagline: 'Excellence in Knowledge & Character',
    address: '123 Academy Way, Victoria Island, Lagos, Nigeria',
    phone: '+234 800 000 0000',
    email: 'info@ugbekun.edu.ng',
    website: 'https://ugbekun.edu.ng',
    logoUrl: '',
    principalSignatureUrl: '',
    currencySymbol: '₦',
    academicSession: '2025/2026',
    currentTerm: 'First Term',

    regNoPrefix: 'UGB',
    regNoDigits: 4,
    defaultStudentPassword: 'student123',
    autoSmsAttendance: true,
    maxAbsentDaysAlert: 3,
    idCardTheme: 'EMERALD_MODERN',

    maintenanceMode: false,
    aiAssistanceEnabled: true,
    notificationChannel: 'ALL',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    weeklyMintLimit: 5000
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: SystemSettingsData }>(endpoints.admin.systemSettings)
      if (res.success && res.data) {
        setForm((prev) => ({
          ...prev,
          ...res.data,
          schoolName: res.data.schoolName || prev.schoolName,
          tagline: res.data.tagline || prev.tagline,
          address: res.data.address || prev.address,
          phone: res.data.phone || prev.phone,
          email: res.data.email || prev.email,
          website: res.data.website || prev.website,
          logoUrl: res.data.logoUrl || '',
          principalSignatureUrl: res.data.principalSignatureUrl || '',
          currencySymbol: res.data.currencySymbol || '₦',
          academicSession: res.data.academicSession || '2025/2026',
          currentTerm: res.data.currentTerm || 'First Term',
          regNoPrefix: res.data.regNoPrefix || 'UGB',
          regNoDigits: res.data.regNoDigits || 4,
          defaultStudentPassword: res.data.defaultStudentPassword || 'student123',
          autoSmsAttendance: res.data.autoSmsAttendance !== undefined ? res.data.autoSmsAttendance : true,
          maxAbsentDaysAlert: res.data.maxAbsentDaysAlert || 3,
          idCardTheme: res.data.idCardTheme || 'EMERALD_MODERN',
          maintenanceMode: Boolean(res.data.maintenanceMode),
          aiAssistanceEnabled: res.data.aiAssistanceEnabled !== undefined ? res.data.aiAssistanceEnabled : true,
          notificationChannel: res.data.notificationChannel || 'ALL',
          timezone: res.data.timezone || 'Africa/Lagos',
          dateFormat: res.data.dateFormat || 'DD/MM/YYYY',
          weeklyMintLimit: res.data.weeklyMintLimit || 5000
        }))
      }
    } catch (e: any) {
      console.error('Failed to fetch system settings:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'signature') => {
    if (type === 'logo') setUploadingLogo(true)
    else setUploadingSignature(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = safeStorage.getItem('ugbekun_token')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(endpoints.admin.uploadSchoolLogo, {
        method: 'POST',
        headers,
        body: formData
      })
      const result = await res.json()
      if (result.success && result.url) {
        const updatedUrl = result.url
        if (type === 'logo') {
          const updatedForm = { ...form, logoUrl: updatedUrl }
          setForm(updatedForm)
          setFeedback({ type: 'success', message: 'School logo uploaded to Cloudinary & active globally!' })
          apiSlice.post(endpoints.admin.systemSettings, updatedForm).then(() => {
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('branch-settings-updated'))
          }).catch(() => {})
        } else {
          const updatedForm = { ...form, principalSignatureUrl: updatedUrl }
          setForm(updatedForm)
          setFeedback({ type: 'success', message: 'Principal signature uploaded to Cloudinary & active globally!' })
          apiSlice.post(endpoints.admin.systemSettings, updatedForm).then(() => {
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('branch-settings-updated'))
          }).catch(() => {})
        }
      } else {
        setFeedback({ type: 'error', message: result.message || 'Failed to upload image.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error uploading file.' })
    } finally {
      if (type === 'logo') setUploadingLogo(false)
      else setUploadingSignature(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(endpoints.admin.systemSettings, form)
      if (res.success) {
        setFeedback({ type: 'success', message: 'System settings saved successfully!' })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('branch-settings-updated'))
        }
      } else {
        setFeedback({ type: 'error', message: res.message || 'Failed to save settings.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving configuration settings.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Loading System Settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Settings size={16} /> System Control & Configuration
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Branch & School Settings Desk</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure school profile info, upload logos, student registration rules, and system preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Configuration
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm font-medium border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 font-bold text-xs uppercase cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-3 rounded-2xl border border-slate-100 shadow-sm">
        <button
          onClick={() => setActiveTab('school')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer ${
            activeTab === 'school' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 size={18} /> School Settings
        </button>
        <button
          onClick={() => setActiveTab('student')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer ${
            activeTab === 'student' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={18} /> System Student Settings
        </button>
        <button
          onClick={() => setActiveTab('other')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer ${
            activeTab === 'other' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders size={18} /> Other Settings
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: SCHOOL SETTINGS */}
        {activeTab === 'school' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-base border-b pb-3 flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" /> General School Profile & Crest Branding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">School Name *</label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">School Motto / Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Phone Line</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Physical School Address</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Website URL</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={form.currencySymbol}
                  onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Academic Session</label>
                <input
                  type="text"
                  value={form.academicSession}
                  onChange={(e) => setForm({ ...form, academicSession: e.target.value })}
                  placeholder="e.g. 2025/2026"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Active Term</label>
                <select
                  value={form.currentTerm}
                  onChange={(e) => setForm({ ...form, currentTerm: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>

              {/* LOGO UPLOADER BOX */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>School Crest / Official Logo</span>
                  {uploadingLogo && <span className="text-blue-600 text-xs font-semibold animate-pulse">Uploading...</span>}
                </label>
                <div className="flex items-center gap-3">
                  {form.logoUrl ? (
                    <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                      <img src={form.logoUrl} alt="School Logo" className="w-full h-full object-contain p-1" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center shrink-0 text-slate-400">
                      <Upload size={20} />
                      <span className="text-[9px] font-bold">No Logo</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], 'logo')
                        }
                      }}
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    <input
                      type="url"
                      placeholder="Or enter logo image URL directly..."
                      value={form.logoUrl}
                      onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* PRINCIPAL SIGNATURE UPLOADER BOX */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Principal / Director Signature Image</span>
                  {uploadingSignature && <span className="text-blue-600 text-xs font-semibold animate-pulse">Uploading...</span>}
                </label>
                <div className="flex items-center gap-3">
                  {form.principalSignatureUrl ? (
                    <div className="w-24 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative">
                      <img src={form.principalSignatureUrl} alt="Signature" className="w-full h-full object-contain p-1" />
                    </div>
                  ) : (
                    <div className="w-24 h-14 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center shrink-0 text-slate-400">
                      <Upload size={18} />
                      <span className="text-[9px] font-bold">No Signature</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], 'signature')
                        }
                      }}
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    <input
                      type="url"
                      placeholder="Or enter signature image URL directly..."
                      value={form.principalSignatureUrl}
                      onChange={(e) => setForm({ ...form, principalSignatureUrl: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SYSTEM STUDENT SETTINGS */}
        {activeTab === 'student' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-base border-b pb-3 flex items-center gap-2">
              <Users size={20} className="text-blue-600" /> Student Rules & Identification Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  Registration Number Prefix
                  <span className="cursor-help" title="Prefix added before generated student admission IDs (e.g. UGB/2026/0001)">
                    <HelpCircle size={14} className="text-slate-400" />
                  </span>
                </label>
                <input
                  type="text"
                  value={form.regNoPrefix}
                  onChange={(e) => setForm({ ...form, regNoPrefix: e.target.value })}
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sequence Digits Length</label>
                <select
                  value={form.regNoDigits}
                  onChange={(e) => setForm({ ...form, regNoDigits: Number(e.target.value) })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value={3}>3 Digits (e.g. 001)</option>
                  <option value={4}>4 Digits (e.g. 0001)</option>
                  <option value={5}>5 Digits (e.g. 00001)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  Default Student Account Password
                  <span className="cursor-help" title="Initial password assigned to new student accounts upon onboarding">
                    <HelpCircle size={14} className="text-slate-400" />
                  </span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.defaultStudentPassword}
                    onChange={(e) => setForm({ ...form, defaultStudentPassword: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  Max Consecutive Absence Alert Threshold
                  <span className="cursor-help" title="Number of absent days before notifying class teacher and principal">
                    <HelpCircle size={14} className="text-slate-400" />
                  </span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.maxAbsentDaysAlert}
                  onChange={(e) => setForm({ ...form, maxAbsentDaysAlert: Number(e.target.value) })}
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Student ID Card Theme Palette</label>
                <select
                  value={form.idCardTheme}
                  onChange={(e) => setForm({ ...form, idCardTheme: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="EMERALD_MODERN">Emerald Modern</option>
                  <option value="ROYAL_NAVY">Royal Navy</option>
                  <option value="BURGUNDY_GOLD">Burgundy & Gold</option>
                  <option value="SLATE_MINIMAL">Slate Minimal</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Automated Attendance Notification to Parents</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Send instant SMS/Push alert to parent when a student is marked Absent or Late.</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.autoSmsAttendance}
                  onChange={(e) => setForm({ ...form, autoSmsAttendance: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OTHER SETTINGS */}
        {activeTab === 'other' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-base border-b pb-3 flex items-center gap-2">
              <Sliders size={20} className="text-blue-600" /> Additional System & Platform Rules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
              <div className="flex items-center justify-between p-4 bg-rose-50/70 border border-rose-200 rounded-xl md:col-span-2">
                <div>
                  <h4 className="font-bold text-rose-900 text-sm">System Maintenance Mode</h4>
                  <p className="text-xs text-rose-700 mt-0.5">Pause student and parent portal access during term transitions or updates.</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.maintenanceMode}
                  onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl md:col-span-2">
                <div>
                  <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                    <Sparkles size={16} /> AI Co-Pilot & Drafting Assistance
                  </h4>
                  <p className="text-xs text-indigo-700 mt-0.5">Enable AI drafting for employment letters, lesson plans, and library e-books.</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.aiAssistanceEnabled}
                  onChange={(e) => setForm({ ...form, aiAssistanceEnabled: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary System Notification Channel</label>
                <select
                  value={form.notificationChannel}
                  onChange={(e) => setForm({ ...form, notificationChannel: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Channels (SMS, Email, Push & WhatsApp)</option>
                  <option value="SMS_EMAIL">SMS & Email Only</option>
                  <option value="WHATSAPP">WhatsApp Primary</option>
                  <option value="EMAIL">Email Only</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">System Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                  <option value="Africa/Accra">Africa/Accra (GMT)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                  <option value="UTC">UTC Standard</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date Format Display</label>
                <select
                  value={form.dateFormat}
                  onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 31/07/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 07/31/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  Gamification Weekly Mint Limit
                  <span className="cursor-help" title="Maximum reward points that can be awarded across the branch per week">
                    <HelpCircle size={14} className="text-slate-400" />
                  </span>
                </label>
                <div className="relative">
                  <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={100}
                    value={form.weeklyMintLimit}
                    onChange={(e) => setForm({ ...form, weeklyMintLimit: Number(e.target.value) })}
                    required
                    className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-800">System Safeguard Active</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  System settings are synchronized across all admin desks and client portals in real-time. Changes to academic session or maintenance mode apply instantly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save All Configuration Settings
          </button>
        </div>
      </form>
    </div>
  )
}
