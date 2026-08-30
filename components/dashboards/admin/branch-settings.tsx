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
  Image as ImageIcon,
  Bus,
  CreditCard,
  Smartphone,
  Key,
  Database,
  History,
  SmartphoneNfc,
  Calendar,
  Check,
  Share2,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Trash2
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'
import { DomainSettingsTab } from './domain-settings-tab'

import { apiSlice, endpoints } from '@/lib/apiSlice'

type SettingsTab = 
  | 'school-info' 
  | 'branding' 
  | 'domain-cms'
  | 'academic-session' 
  | 'school-calendar' 
  | 'roles-permissions' 
  | 'myeduride' 
  | 'payment-gateway' 
  | 'sms-email' 
  | 'api-webhooks' 
  | 'ose-ai' 
  | 'backup-restore' 
  | 'audit-logs' 
  | 'pwa-settings'

export function BranchSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('school-info')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // School Info Form
  const [schoolName, setSchoolName] = useState('')
  const [tagline, setTagline] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [whatsappNo, setWhatsappNo] = useState('')
  const [website, setWebsite] = useState('')

  // Social Media Handles
  const [facebookUrl, setFacebookUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')

  // Branding Form States
  const [logoUrl, setLogoUrl] = useState('')
  const [logoBase64, setLogoBase64] = useState('')
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState('')
  const [signatureBase64, setSignatureBase64] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#0f172a')
  const [secondaryColor, setSecondaryColor] = useState('#0284c7')
  const [idCardTheme, setIdCardTheme] = useState('EMERALD_MODERN')

  // Academic Session
  const [session, setSession] = useState('2025/2026')
  const [term, setTerm] = useState('First Term')

  // Payment Gateway Keys
  const [paystackKey, setPaystackKey] = useState('pk_live_9482910482018402')
  const [flutterwaveKey, setFlutterwaveKey] = useState('FLWSECK-f8941094-X')

  // SMS Gateway
  const [smsSenderId, setSmsSenderId] = useState('UGBEKUN SCH')
  const [smsApiKey, setSmsApiKey] = useState('TL_849204918204')

  // OSe AI Settings
  const [aiTemperature, setAiTemperature] = useState('0.7')
  const [aiAutoComment, setAiAutoComment] = useState(true)

  // PWA Settings
  const [pwaAppName, setPwaAppName] = useState('Ugbekun Portal')
  const [pwaShortName, setPwaShortName] = useState('Ugbekun')

  // Audit Logs Sample
  const [auditLogs, setAuditLogs] = useState([
    { id: 'LOG-001', user: 'Admin', action: 'System Provisioned & Active', ip: '127.0.0.1', date: new Date().toISOString().slice(0, 16).replace('T', ' ') },
  ])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: any }>(endpoints.admin.systemSettings)
      if (res?.data) {
        setSchoolName(res.data.schoolName || '')
        setTagline(res.data.tagline || '')
        setAddress(res.data.address || '')
        setPhone(res.data.phone || '')
        setEmail(res.data.email || '')
        setWhatsappNo(res.data.whatsappNo || '')
        setWebsite(res.data.website || '')
        setFacebookUrl(res.data.facebookUrl || '')
        setInstagramUrl(res.data.instagramUrl || '')
        setTwitterUrl(res.data.twitterUrl || '')
        setLinkedinUrl(res.data.linkedinUrl || '')
        setYoutubeUrl(res.data.youtubeUrl || '')

        setLogoUrl(res.data.logoUrl || '')
        setPrincipalSignatureUrl(res.data.principalSignatureUrl || '')
        setPrimaryColor(res.data.primaryColor || '#0f172a')
        setSecondaryColor(res.data.secondaryColor || '#0284c7')
        setIdCardTheme(res.data.idCardTheme || 'EMERALD_MODERN')

        if (res.data.academicSession) setSession(res.data.academicSession)
        if (res.data.currentTerm) setTerm(res.data.currentTerm)
        if (res.data.aiAssistanceEnabled !== undefined) setAiAutoComment(res.data.aiAssistanceEnabled)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setSignatureBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      await apiSlice.post(endpoints.admin.systemSettings, {
        schoolName,
        tagline,
        address,
        phone,
        email,
        whatsappNo,
        website,
        facebookUrl,
        instagramUrl,
        twitterUrl,
        linkedinUrl,
        youtubeUrl,
        logoUrl,
        logoBase64,
        principalSignatureUrl,
        signatureBase64,
        primaryColor,
        secondaryColor,
        idCardTheme,
        academicSession: session,
        currentTerm: term,
        aiAssistanceEnabled: aiAutoComment,
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('branch-settings-updated'))
      }
      setLogoBase64('')
      setSignatureBase64('')
      await loadSettings()
      alert('System Settings saved & synchronized successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBrandingAsset = async (assetType: 'logo' | 'signature' | 'colors') => {
    const label = assetType === 'logo' ? 'School Logo' : assetType === 'signature' ? 'Principal Signature' : 'Theme Colors'
    if (!confirm(`Are you sure you want to remove/reset ${label}?`)) {
      return
    }
    setIsResetting(true)
    try {
      await apiSlice.delete(`${endpoints.admin.systemSettings}/branding/assets/${assetType}`)
      if (assetType === 'logo') {
        setLogoUrl('')
        setLogoBase64('')
      } else if (assetType === 'signature') {
        setPrincipalSignatureUrl('')
        setSignatureBase64('')
      } else if (assetType === 'colors') {
        setPrimaryColor('#0f172a')
        setSecondaryColor('#0284c7')
        setIdCardTheme('EMERALD_MODERN')
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('branch-settings-updated'))
      }
      alert(`${label} removed/reset successfully!`)
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to remove ${label}.`)
    } finally {
      setIsResetting(false)
    }
  }

  const handleResetSchoolInfo = async () => {
    if (!confirm('Are you sure you want to clear optional contact details, tagline, website, and social media links?')) {
      return
    }
    setIsResetting(true)
    try {
      await apiSlice.delete(`${endpoints.admin.systemSettings}/school-info`)
      setTagline('')
      setWebsite('')
      setWhatsappNo('')
      setFacebookUrl('')
      setInstagramUrl('')
      setTwitterUrl('')
      setLinkedinUrl('')
      setYoutubeUrl('')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('branch-settings-updated'))
      }
      alert('Optional school details and social handles reset successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset school info.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="text-slate-700" size={24} /> System Configuration & Settings
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              School profiles, branding, session terms, user permissions, gateways, AI configuration, and PWA setup.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin text-amber-400" /> : <Save size={15} />} Save All Changes
          </button>
        </div>
      </div>

      {/* 13 Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button onClick={() => setActiveTab('school-info')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'school-info' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🏫 School Information
        </button>
        <button onClick={() => setActiveTab('branding')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'branding' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🎨 Branding
        </button>
        <button onClick={() => setActiveTab('domain-cms')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'domain-cms' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🌐 Custom Domain & CMS
        </button>
        <button onClick={() => setActiveTab('academic-session')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'academic-session' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🗓️ Academic Session
        </button>
        <button onClick={() => setActiveTab('school-calendar')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'school-calendar' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📅 School Calendar
        </button>
        <button onClick={() => setActiveTab('roles-permissions')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'roles-permissions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🔐 Roles & Permissions
        </button>
        <button onClick={() => setActiveTab('myeduride')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'myeduride' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🚌 MyEduRide Integration
        </button>
        <button onClick={() => setActiveTab('payment-gateway')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'payment-gateway' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          💳 Payment Gateway
        </button>
        <button onClick={() => setActiveTab('sms-email')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'sms-email' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📱 SMS & Email
        </button>
        <button onClick={() => setActiveTab('api-webhooks')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'api-webhooks' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🔑 API & Webhooks
        </button>
        <button onClick={() => setActiveTab('ose-ai')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'ose-ai' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🤖 OSe AI Settings
        </button>
        <button onClick={() => setActiveTab('backup-restore')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'backup-restore' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          💾 Backup & Restore
        </button>
        <button onClick={() => setActiveTab('audit-logs')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'audit-logs' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📜 Audit Logs
        </button>
        <button onClick={() => setActiveTab('pwa-settings')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'pwa-settings' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📱 PWA Settings
        </button>
      </div>

      {/* 1. SCHOOL INFORMATION */}
      {activeTab === 'school-info' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Building2 className="text-slate-700" size={20} /> General School Profile & Contact Info
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage basic school metadata, official communication channels, WhatsApp business line, and social media handles.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={loadSettings}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Reload from Database"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Reload
              </button>
              <button
                type="button"
                onClick={handleResetSchoolInfo}
                disabled={isResetting}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Reset Optional & Social Media Details"
              >
                {isResetting ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Clear Optional Info
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* Section A: Core Identity */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-700" /> Core School Identity
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Official School Name *</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="e.g. Canaan Gate Educational Centre"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">School Motto / Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="e.g. Excellence in Knowledge & Character"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Campus Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none resize-none"
                    placeholder="e.g. 123 Academy Way, Victoria Island, Lagos, Nigeria"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Direct Contact & WhatsApp */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-600" /> Direct Contact & Messaging Channels
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                    <Phone size={12} className="text-slate-500" /> Primary Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="+234 807634567"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                    <Mail size={12} className="text-slate-500" /> Official Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="info@school.edu.ng"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center justify-between">
                    <span className="flex items-center gap-1"><MessageSquare size={12} className="text-emerald-600" /> WhatsApp Contact No</span>
                    {whatsappNo && (
                      <a href={`https://wa.me/${whatsappNo.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5">
                        Test Chat <ExternalLink size={10} />
                      </a>
                    )}
                  </label>
                  <input
                    type="text"
                    value={whatsappNo}
                    onChange={e => setWhatsappNo(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 outline-none"
                    placeholder="+234 801 234 5678"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                    <Globe size={12} className="text-slate-500" /> Official Website URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="https://www.school.edu.ng"
                  />
                </div>
              </div>
            </div>

            {/* Section C: Social Media Handles */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Share2 size={14} className="text-cyan-600" /> Social Media Profiles & Public Portals
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                    <Facebook size={12} className="text-blue-600" /> Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={e => setFacebookUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="https://facebook.com/your-school"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                    <Instagram size={12} className="text-pink-600" /> Instagram Handle / URL
                  </label>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={e => setInstagramUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-pink-600 outline-none"
                    placeholder="https://instagram.com/your_school"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                    <Twitter size={12} className="text-slate-800" /> Twitter (X) Profile / URL
                  </label>
                  <input
                    type="text"
                    value={twitterUrl}
                    onChange={e => setTwitterUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="https://x.com/your_school"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                    <Linkedin size={12} className="text-sky-700" /> LinkedIn Company Page
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={e => setLinkedinUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-sky-700 outline-none"
                    placeholder="https://linkedin.com/school/your-school"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                    <Youtube size={12} className="text-red-600" /> YouTube Channel URL
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="https://youtube.com/@your-school-official"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin text-amber-400" /> : <Save size={15} />} Save School Info
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. BRANDING STUDIO */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Sparkles className="text-amber-500" size={20} /> School Branding & Theme Studio
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage your school crest logo, principal signature, custom color palettes, and portal ID themes.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={loadSettings}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Reload Branding"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Reload
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBrandingAsset('colors')}
                disabled={isResetting}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Reset Theme Colors to Default"
              >
                {isResetting ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Reset Colors
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Asset Managers (Logo, Signature & Colors) */}
            <div className="space-y-5">
              {/* Asset A: School Logo / Crest */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-cyan-600" /> School Crest / Logo (PNG / SVG)
                  </h4>
                  {(logoBase64 || logoUrl) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBrandingAsset('logo')}
                      disabled={isResetting}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs relative">
                    {logoBase64 || logoUrl ? (
                      <img
                        src={logoBase64 || logoUrl}
                        alt="School Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon size={20} className="mx-auto text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-400 block mt-1">No Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Upload New Crest</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">Recommended: Square PNG or SVG with transparent background (Max 2MB).</p>
                  </div>
                </div>
              </div>

              {/* Asset B: Principal / Director Signature */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText size={14} className="text-emerald-600" /> Principal Signature PNG
                  </h4>
                  {(signatureBase64 || principalSignatureUrl) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBrandingAsset('signature')}
                      disabled={isResetting}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove Signature
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl border-2 border-slate-200 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:8px_8px] bg-white flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs relative">
                    {signatureBase64 || principalSignatureUrl ? (
                      <img
                        src={signatureBase64 || principalSignatureUrl}
                        alt="Signature Preview"
                        className="max-w-full max-h-full object-contain filter contrast-125"
                      />
                    ) : (
                      <div className="text-center p-1">
                        <FileText size={18} className="mx-auto text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-400 block mt-0.5">No Signature</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Upload Official Signature</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">Used for automatic report card & certificate endorsement.</p>
                  </div>
                </div>
              </div>

              {/* Asset C: Brand Colors & Theme Select */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sliders size={14} className="text-indigo-600" /> Theme Colors & Palette
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Primary Brand Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Secondary Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Quick Color Presets</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setPrimaryColor('#064e3b'); setSecondaryColor('#059669'); setIdCardTheme('EMERALD_MODERN'); }}
                      className="px-2.5 py-1.5 rounded-lg border bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="w-3 h-3 rounded-full bg-emerald-700 inline-block" /> Emerald
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPrimaryColor('#0f172a'); setSecondaryColor('#0284c7'); setIdCardTheme('NAVY_CLASSIC'); }}
                      className="px-2.5 py-1.5 rounded-lg border bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="w-3 h-3 rounded-full bg-slate-900 inline-block" /> Navy
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPrimaryColor('#083344'); setSecondaryColor('#06b6d4'); setIdCardTheme('CYAN_DYNAMIC'); }}
                      className="px-2.5 py-1.5 rounded-lg border bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="w-3 h-3 rounded-full bg-cyan-700 inline-block" /> Cyan
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPrimaryColor('#451a03'); setSecondaryColor('#d97706'); setIdCardTheme('GOLDEN_ELEGANCE'); }}
                      className="px-2.5 py-1.5 rounded-lg border bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="w-3 h-3 rounded-full bg-amber-700 inline-block" /> Golden
                    </button>
                  </div>
                </div>

                {/* ID Card Theme Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Portal & Student ID Card Theme</label>
                  <select
                    value={idCardTheme}
                    onChange={e => setIdCardTheme(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-800"
                  >
                    <option value="EMERALD_MODERN">Emerald Modern (Green & Gold Accent)</option>
                    <option value="NAVY_CLASSIC">Navy Classic (Deep Slate & Sky Blue)</option>
                    <option value="CYAN_DYNAMIC">Cyan Dynamic (Ocean Teal & Cyan Glow)</option>
                    <option value="GOLDEN_ELEGANCE">Golden Elegance (Bronze & Amber Gold)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Column 2: Real-time Live Badge & Portal Mockup Preview */}
            <div className="space-y-4">
              <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" /> Live Brand Mockup Preview
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Realtime Sync
                  </span>
                </div>

                {/* Mockup 1: Student ID Card */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md max-w-sm mx-auto">
                  {/* Card Header with Primary Color */}
                  <div className="p-4 text-white flex items-center gap-3 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs p-1 flex items-center justify-center shrink-0 border border-white/20">
                      {logoBase64 || logoUrl ? (
                        <img src={logoBase64 || logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Building2 size={24} className="text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-black text-xs truncate leading-tight">{schoolName || 'Ugbekun International Academy'}</h5>
                      <p className="text-[10px] text-white/80 truncate mt-0.5">{tagline || 'Excellence in Knowledge & Character'}</p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0 text-slate-400 font-bold text-xs">
                        PHOTO
                      </div>
                      <div className="text-xs space-y-0.5">
                        <p className="font-black text-slate-900">David Okafor</p>
                        <p className="text-[10px] text-slate-500 font-semibold">Reg: REG/2026/0001</p>
                        <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full text-white mt-1" style={{ backgroundColor: secondaryColor }}>
                          JSS 2 Gold
                        </span>
                      </div>
                    </div>

                    {/* Signature Endorsement Strip */}
                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[9px] font-semibold text-slate-500">
                      <span>Endorsed By Principal:</span>
                      <div className="h-6 w-20 flex items-center justify-end">
                        {signatureBase64 || principalSignatureUrl ? (
                          <img src={signatureBase64 || principalSignatureUrl} alt="Signature" className="max-h-full object-contain" />
                        ) : (
                          <span className="text-[9px] italic text-slate-400">Signed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium text-center italic">
                  Preview of how your crest, colors, and endorsement signature display across student portals and report cards.
                </p>
              </div>

              {/* Save Button Bar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin text-amber-400" /> : <Save size={16} />} Save All Branding Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2.5 CUSTOM DOMAIN & CMS SETTINGS */}
      {activeTab === 'domain-cms' && (
        <DomainSettingsTab />
      )}

      {/* 3. ACADEMIC SESSION */}
      {activeTab === 'academic-session' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Current Academic Session & Term</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={session} onChange={e => setSession(e.target.value)} className="p-2.5 border rounded-xl text-xs bg-slate-50 font-bold"><option value="2025/2026">2025/2026 Session</option><option value="2026/2027">2026/2027 Session</option></select>
            <select value={term} onChange={e => setTerm(e.target.value)} className="p-2.5 border rounded-xl text-xs bg-slate-50 font-bold"><option value="1st Term">1st Term</option><option value="2nd Term">2nd Term</option><option value="3rd Term">3rd Term</option></select>
          </div>
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Update Session</button>
        </div>
      )}

      {/* 4. SCHOOL CALENDAR */}
      {activeTab === 'school-calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">School Calendar & Key Dates</h3>
          <p className="text-xs text-slate-500 font-medium">Term Resumption: August 10, 2026 • Mid-Term Break: October 15, 2026.</p>
        </div>
      )}

      {/* 5. USER ROLES & PERMISSIONS */}
      {activeTab === 'roles-permissions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Access Control Matrix (Roles & Permissions)</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Role Title</TableHead><TableHead>Scope</TableHead><TableHead>Permissions</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell className="font-bold">Super Admin</TableCell><TableCell>Global</TableCell><TableCell className="text-xs text-emerald-700 font-bold">Full Access</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Branch Admin</TableCell><TableCell>Branch</TableCell><TableCell className="text-xs text-emerald-700 font-bold">Full Branch Management</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Teacher</TableCell><TableCell>Classroom</TableCell><TableCell className="text-xs text-slate-700">Grades, Attendance, Lessons</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* 6. MYEDURIDE INTEGRATION */}
      {activeTab === 'myeduride' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">MyEduRide API Credentials & Gate Sync</h3>
          <input type="text" defaultValue="EDURIDE-LIVE-KEY-948291" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono font-bold text-cyan-700" />
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Save Integration</button>
        </div>
      )}

      {/* 7. PAYMENT GATEWAY */}
      {activeTab === 'payment-gateway' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Online Fee Payment Gateways (Paystack & Flutterwave)</h3>
          <input type="text" value={paystackKey} onChange={e => setPaystackKey(e.target.value)} placeholder="Paystack Secret Key" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono font-bold" />
          <input type="text" value={flutterwaveKey} onChange={e => setFlutterwaveKey(e.target.value)} placeholder="Flutterwave Public Key" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono font-bold" />
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Save Payment Keys</button>
        </div>
      )}

      {/* 8. SMS & EMAIL */}
      {activeTab === 'sms-email' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Termii / Twilio SMS Gateway & SMTP Mail Server</h3>
          <input type="text" value={smsSenderId} onChange={e => setSmsSenderId(e.target.value)} placeholder="SMS Sender ID" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <input type="text" value={smsApiKey} onChange={e => setSmsApiKey(e.target.value)} placeholder="SMS API Key" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono" />
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Save Messaging Config</button>
        </div>
      )}

      {/* 9. API & WEBHOOKS */}
      {activeTab === 'api-webhooks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Developer API Keys & Webhook Endpoints</h3>
          <input type="text" defaultValue="https://ugbekun.edu.ng/api/v1/webhooks/paystack" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono" />
          <button onClick={() => alert('New API Secret Generated!')} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Generate New API Key</button>
        </div>
      )}

      {/* 10. OSE AI SETTINGS */}
      {activeTab === 'ose-ai' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={18} /> OSe AI Model & Auto-Assist Rules
          </h3>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={aiAutoComment} onChange={e => setAiAutoComment(e.target.checked)} /> Auto-Generate Report Card Remarks with OSe Engine
          </label>
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Save OSe Settings</button>
        </div>
      )}

      {/* 11. BACKUP & RESTORE */}
      {activeTab === 'backup-restore' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4 text-center">
          <Database size={32} className="text-indigo-600 mx-auto" />
          <h3 className="font-black text-base text-slate-900">Database Backup & Recovery</h3>
          <p className="text-xs text-slate-500 font-medium">Automatic daily cloud snapshot enabled at 02:00 AM.</p>
          <button onClick={() => alert('Backup Created & Saved to Cloud!')} className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">Create Manual Database Backup</button>
        </div>
      )}

      {/* 12. AUDIT LOGS */}
      {activeTab === 'audit-logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">System Security Audit Log Trail</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Log ID</TableHead><TableHead>User</TableHead><TableHead>Action Performed</TableHead><TableHead>IP Address</TableHead><TableHead>Date & Time</TableHead></TableRow></TableHeader>
            <TableBody>
              {auditLogs.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{l.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{l.user}</TableCell>
                  <TableCell className="text-xs text-slate-700">{l.action}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{l.ip}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{l.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 13. PWA SETTINGS */}
      {activeTab === 'pwa-settings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <SmartphoneNfc className="text-indigo-600" size={18} /> Progressive Web App (PWA) Manifest Settings
          </h3>
          <input type="text" value={pwaAppName} onChange={e => setPwaAppName(e.target.value)} placeholder="PWA App Name" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <input type="text" value={pwaShortName} onChange={e => setPwaShortName(e.target.value)} placeholder="Home Screen Short Name" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Save PWA Manifest</button>
        </div>
      )}
    </div>
  )
}
