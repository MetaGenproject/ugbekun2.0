'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Building2,
  Sliders,
  Save,
  Loader2,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  FileText,
  Sparkles,
  Image as ImageIcon,
  SmartphoneNfc,
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
  Trash2,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  Search,
  Coins,
  Info,
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
import SchoolCalendar from './school-calendar'
import { RoleManagement } from './role-management'
import { AcademicSessionManager } from './academic-session-manager'

import { apiSlice, endpoints } from '@/lib/apiSlice'

type SettingsTab = 
  | 'school-info' 
  | 'next-term-fees'
  | 'branding' 
  | 'domain-cms'
  | 'academic-session' 
  | 'school-calendar' 
  | 'roles-permissions' 
  | 'pwa-settings'

export function BranchSettings({ user }: { user?: { id?: number; username?: string; role?: number } }) {
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

  // Branding & Report Card Form States
  const [logoUrl, setLogoUrl] = useState('')
  const [logoBase64, setLogoBase64] = useState('')
  const [principalName, setPrincipalName] = useState('')
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState('')
  const [signatureBase64, setSignatureBase64] = useState('')
  const [defaultTeacherSignatureUrl, setDefaultTeacherSignatureUrl] = useState('')
  const [teacherSignatureBase64, setTeacherSignatureBase64] = useState('')
  const [resumptionDate, setResumptionDate] = useState('')
  const [nextTermFees, setNextTermFees] = useState('')
  const [defaultNextTermFee, setDefaultNextTermFee] = useState('')
  const [availableClasses, setAvailableClasses] = useState<Array<{ id: number; name: string }>>([])
  const [classFeeGroups, setClassFeeGroups] = useState<Array<{
    id: string
    name: string
    amount: string
    classIds: number[]
  }>>([])
  const [feeMode, setFeeMode] = useState<'uniform' | 'class-specific'>('uniform')
  const [openDropdownGroupId, setOpenDropdownGroupId] = useState<string | null>(null)
  const [classMatrixSearch, setClassMatrixSearch] = useState('')
  const [showClassMatrix, setShowClassMatrix] = useState(false)
  const [autoPublishReportCards, setAutoPublishReportCards] = useState(true)
  const [primaryColor, setPrimaryColor] = useState('#0f172a')
  const [secondaryColor, setSecondaryColor] = useState('#0284c7')
  const [idCardTheme, setIdCardTheme] = useState('EMERALD_MODERN')

  // PWA Settings
  const [pwaAppName, setPwaAppName] = useState('Ugbekun Portal')
  const [pwaShortName, setPwaShortName] = useState('Ugbekun')

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const [res, clsRes] = await Promise.all([
        apiSlice.get<{ success: boolean; data: any }>(endpoints.admin.systemSettings),
        apiSlice.get<{ success: boolean; classes: Array<{ id: number; name: string }> }>(endpoints.admin.classes).catch(() => ({ success: false, classes: [] })),
      ])

      if (clsRes?.success && Array.isArray(clsRes.classes)) {
        setAvailableClasses(clsRes.classes)
      }

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
        setPrincipalName(res.data.principalName || '')
        setPrincipalSignatureUrl(res.data.principalSignatureUrl || '')
        setDefaultTeacherSignatureUrl(res.data.defaultTeacherSignatureUrl || '')
        setResumptionDate(res.data.resumptionDate || '')

        const rawFees = res.data.nextTermFees || ''
        setNextTermFees(rawFees)
        if (rawFees.startsWith('{') && rawFees.endsWith('}')) {
          try {
            const parsed = JSON.parse(rawFees)
            const defAmt = parsed.default || ''
            setDefaultNextTermFee(defAmt)
            if (Array.isArray(parsed.groups) && parsed.groups.length > 0) {
              setClassFeeGroups(
                parsed.groups.map((g: any, idx: number) => ({
                  id: g.id || `group-${Date.now()}-${idx}`,
                  name: g.name || `Fee Tier ${idx + 1}`,
                  amount: String(g.amount || ''),
                  classIds: Array.isArray(g.classIds) ? g.classIds.map(Number) : [],
                }))
              )
              setFeeMode('class-specific')
            } else if (parsed.byClass && typeof parsed.byClass === 'object' && Object.keys(parsed.byClass).length > 0) {
              const feeToClasses: Record<string, number[]> = {}
              for (const [cId, amt] of Object.entries(parsed.byClass)) {
                const amtStr = String(amt || '').trim()
                if (amtStr) {
                  if (!feeToClasses[amtStr]) feeToClasses[amtStr] = []
                  feeToClasses[amtStr].push(Number(cId))
                }
              }
              const reconstructed = Object.entries(feeToClasses).map(([amt, ids], idx) => ({
                id: `group-${Date.now()}-${idx}`,
                name: `Fee Tier ${idx + 1}`,
                amount: amt,
                classIds: ids,
              }))
              setClassFeeGroups(reconstructed)
              setFeeMode('class-specific')
            } else {
              setClassFeeGroups([])
              setFeeMode('uniform')
            }
          } catch {
            setDefaultNextTermFee(rawFees)
            setClassFeeGroups([])
            setFeeMode('uniform')
          }
        } else {
          setDefaultNextTermFee(rawFees)
          setClassFeeGroups([])
          setFeeMode('uniform')
        }

        setAutoPublishReportCards(
          res.data.autoPublishReportCards !== undefined ? Boolean(res.data.autoPublishReportCards) : true
        )
        setPrimaryColor(res.data.primaryColor || '#0f172a')
        setSecondaryColor(res.data.secondaryColor || '#0284c7')
        setIdCardTheme(res.data.idCardTheme || 'EMERALD_MODERN')
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

  const handleTeacherSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setTeacherSignatureBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAddFeeGroup = () => {
    const newGroupNum = classFeeGroups.length + 1
    const newGroup = {
      id: `group-${Date.now()}`,
      name: `Fee Tier ${newGroupNum}`,
      amount: '',
      classIds: [],
    }
    setClassFeeGroups((prev) => [...prev, newGroup])
    setFeeMode('class-specific')
    setOpenDropdownGroupId(newGroup.id)
  }

  const handleRemoveFeeGroup = (groupId: string) => {
    setClassFeeGroups((prev) => prev.filter((g) => g.id !== groupId))
  }

  const handleUpdateGroup = (groupId: string, field: 'name' | 'amount', value: string) => {
    setClassFeeGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, [field]: value } : g))
    )
  }

  const handleToggleClassInGroup = (groupId: string, classId: number) => {
    setClassFeeGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const isPresent = g.classIds.includes(classId)
          return {
            ...g,
            classIds: isPresent ? g.classIds.filter((id) => id !== classId) : [...g.classIds, classId],
          }
        } else {
          return {
            ...g,
            classIds: g.classIds.filter((id) => id !== classId),
          }
        }
      })
    )
  }

  const handleBulkSelectClasses = (
    groupId: string,
    type: 'all' | 'nursery' | 'primary' | 'secondary' | 'clear'
  ) => {
    if (type === 'clear') {
      setClassFeeGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, classIds: [] } : g))
      )
      return
    }

    let targetClassIds: number[] = []
    if (type === 'all') {
      targetClassIds = availableClasses.map((c) => c.id)
    } else if (type === 'nursery') {
      targetClassIds = availableClasses
        .filter((c) =>
          /nursery|reception|creche|ecd|kg|playgroup|pre-nursery/i.test(c.name)
        )
        .map((c) => c.id)
    } else if (type === 'primary') {
      targetClassIds = availableClasses
        .filter((c) => /primary|pry|basic|grade/i.test(c.name))
        .map((c) => c.id)
    } else if (type === 'secondary') {
      targetClassIds = availableClasses
        .filter((c) => /jss|sss|js|ss|year\s*(?:7|8|9|10|11|12)/i.test(c.name))
        .map((c) => c.id)
    }

    setClassFeeGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const merged = Array.from(new Set([...g.classIds, ...targetClassIds]))
          return { ...g, classIds: merged }
        } else {
          return {
            ...g,
            classIds: g.classIds.filter((id) => !targetClassIds.includes(id)),
          }
        }
      })
    )
  }

  const getEffectiveClassFee = (classId: number): { amount: string; source: string; isGroup: boolean } => {
    if (feeMode === 'class-specific') {
      for (const g of classFeeGroups) {
        if (g.classIds.includes(classId) && g.amount.trim()) {
          return { amount: g.amount.trim(), source: g.name || 'Shared Group', isGroup: true }
        }
      }
    }
    return {
      amount: defaultNextTermFee.trim(),
      source: defaultNextTermFee.trim() ? 'Default School Fee' : 'Not Set (Blank)',
      isGroup: false,
    }
  }

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      // Compile nextTermFees payload: simple string or structured JSON with class groups
      let payloadNextTermFees = defaultNextTermFee.trim()
      if (feeMode === 'class-specific' && classFeeGroups.length > 0) {
        const computedByClass: Record<string, string> = {}
        classFeeGroups.forEach((group) => {
          const cleanAmount = group.amount.trim()
          if (cleanAmount) {
            group.classIds.forEach((cId) => {
              computedByClass[String(cId)] = cleanAmount
            })
          }
        })
        payloadNextTermFees = JSON.stringify({
          default: defaultNextTermFee.trim(),
          groups: classFeeGroups,
          byClass: computedByClass,
        })
      }

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
        principalName,
        principalSignatureUrl,
        signatureBase64,
        defaultTeacherSignatureUrl,
        teacherSignatureBase64,
        resumptionDate,
        nextTermFees: payloadNextTermFees,
        autoPublishReportCards,
        primaryColor,
        secondaryColor,
        idCardTheme,
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('branch-settings-updated'))
      }
      setLogoBase64('')
      setSignatureBase64('')
      setTeacherSignatureBase64('')
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

  const renderNextTermFeesSection = () => (
    <div className="space-y-5 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200/70">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
            <FileText size={16} className="text-emerald-700" /> Report Card Resumption Date, Next Term Payment & Signatures
          </h4>
          <p className="text-[11px] text-emerald-800/80 font-medium mt-0.5">
            These values appear automatically on all student report cards (web preview, official PDF and Parent Dashboard).
          </p>
        </div>
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-950 cursor-pointer shadow-2xs hover:bg-emerald-50 transition">
          <input
            type="checkbox"
            checked={autoPublishReportCards}
            onChange={e => setAutoPublishReportCards(e.target.checked)}
            className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-600"
          />
          Immediate Effect After Score Entry
        </label>
      </div>

      {/* Basic Fields: Resumption Date, Principal Name, Default Fee */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Next Term Resumption Date</span>
            <span className="text-[10px] text-slate-400 font-normal">calendar</span>
          </label>
          <input
            type="text"
            value={resumptionDate}
            onChange={e => setResumptionDate(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 outline-none shadow-2xs"
            placeholder="e.g. Monday, 12th Jan 2026"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Principal / Head of School Name</span>
            <span className="text-[10px] text-slate-400 font-normal">signatory</span>
          </label>
          <input
            type="text"
            value={principalName}
            onChange={e => setPrincipalName(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 outline-none shadow-2xs"
            placeholder="e.g. Dr. (Mrs.) A. Okafor"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Default Next Term Payment</span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">default</span>
          </label>
          <input
            type="text"
            value={defaultNextTermFee}
            onChange={e => {
              setDefaultNextTermFee(e.target.value)
              setNextTermFees(e.target.value)
            }}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 outline-none shadow-2xs"
            placeholder="e.g. ₦85,000"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Applied to any class not explicitly grouped into a custom fee tier below.
          </p>
        </div>
      </div>

      {/* Class Payment Mode & Shared Fee Groups */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Coins size={16} />
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Class Payment Structure (Per Classes & Shared Fees)
              </h5>
              <p className="text-[11px] text-slate-500">
                Easily group classes that share the same fee using the class select box, or use uniform fee.
              </p>
            </div>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFeeMode('uniform')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                feeMode === 'uniform'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Same Fee For All Classes
            </button>
            <button
              type="button"
              onClick={() => {
                setFeeMode('class-specific')
                if (classFeeGroups.length === 0) {
                  handleAddFeeGroup()
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                feeMode === 'class-specific'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Class Shared Fee Groups</span>
              {classFeeGroups.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {classFeeGroups.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {feeMode === 'uniform' ? (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
            <Info size={18} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">
                Uniform Next Term Payment is active: <span className="text-emerald-700">{defaultNextTermFee ? defaultNextTermFee : <span className="text-slate-400 font-normal italic">Blank (No fee set)</span>}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                All student report cards will show this single fee. If some classes (e.g. Nursery vs Primary vs Secondary) have different payments, switch to "Class Shared Fee Groups" above.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Groups List */}
            <div className="space-y-3">
              {classFeeGroups.map((group, gIdx) => {
                const isOpen = openDropdownGroupId === group.id
                return (
                  <div
                    key={group.id}
                    className="p-4 rounded-xl border border-emerald-200/90 bg-slate-50/70 space-y-3 transition hover:border-emerald-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                          {gIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={group.name}
                          onChange={e => handleUpdateGroup(group.id, 'name', e.target.value)}
                          placeholder="e.g. Primary Section Fee"
                          className="font-bold text-xs text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-600 outline-none px-1 py-0.5"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 focus-within:ring-2 focus-within:ring-emerald-500">
                          <span className="text-xs font-bold text-slate-400">Amount:</span>
                          <input
                            type="text"
                            value={group.amount}
                            onChange={e => handleUpdateGroup(group.id, 'amount', e.target.value)}
                            placeholder="e.g. ₦80,000"
                            className="text-xs font-black text-emerald-900 outline-none w-28 bg-transparent"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFeeGroup(group.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Remove this fee group"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* SELECT BOX: Classes Using Same Fee */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Classes Using This Fee</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {group.classIds.length} classes selected
                          </span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Click dropdown to select classes sharing this fee
                        </span>
                      </div>

                      {/* Interactive Select Box Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdownGroupId(isOpen ? null : group.id)}
                          className="w-full min-h-[42px] p-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl flex items-center justify-between gap-2 text-xs transition cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center gap-1.5 text-left flex-1">
                            {group.classIds.length === 0 ? (
                              <span className="text-slate-400 italic">
                                Click here to select classes that use this fee...
                              </span>
                            ) : (
                              group.classIds.map(cId => {
                                const cls = availableClasses.find(c => c.id === cId)
                                return (
                                  <span
                                    key={`badge-${group.id}-${cId}`}
                                    className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-md text-[11px]"
                                  >
                                    {cls?.name || `Class #${cId}`}
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleClassInGroup(group.id, cId)
                                      }}
                                      className="hover:text-rose-600 cursor-pointer ml-0.5"
                                    >
                                      ✕
                                    </span>
                                  </span>
                                )
                              })
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 shrink-0">
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>

                        {/* Dropdown Menu */}
                        {isOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                            {/* Fast Select Presets */}
                            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                                Quick Group:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleBulkSelectClasses(group.id, 'nursery')}
                                className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 transition cursor-pointer"
                              >
                                + All Nursery
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBulkSelectClasses(group.id, 'primary')}
                                className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 transition cursor-pointer"
                              >
                                + All Primary
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBulkSelectClasses(group.id, 'secondary')}
                                className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200 transition cursor-pointer"
                              >
                                + All Secondary
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBulkSelectClasses(group.id, 'all')}
                                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold transition cursor-pointer"
                              >
                                + Select All
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBulkSelectClasses(group.id, 'clear')}
                                className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition cursor-pointer ml-auto"
                              >
                                Clear
                              </button>
                            </div>

                            {/* Class Checkbox Grid */}
                            <div className="max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1">
                              {availableClasses.map(cls => {
                                const isSelectedInThisGroup = group.classIds.includes(cls.id)
                                const otherGroup = classFeeGroups.find(
                                  g => g.id !== group.id && g.classIds.includes(cls.id)
                                )

                                return (
                                  <label
                                    key={`cls-${group.id}-${cls.id}`}
                                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer border transition ${
                                      isSelectedInThisGroup
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                        : otherGroup
                                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelectedInThisGroup}
                                      onChange={() => handleToggleClassInGroup(group.id, cls.id)}
                                      className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="truncate flex-1">{cls.name}</span>
                                    {otherGroup && !isSelectedInThisGroup && (
                                      <span className="text-[9px] text-slate-400 italic">
                                        ({otherGroup.name})
                                      </span>
                                    )}
                                  </label>
                                )
                              })}
                            </div>

                            <div className="flex justify-end pt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setOpenDropdownGroupId(null)}
                                className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add Fee Group Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleAddFeeGroup}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={14} /> Add Another Shared Fee Tier
              </button>

              <button
                type="button"
                onClick={() => setShowClassMatrix(!showClassMatrix)}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <Layers size={13} /> {showClassMatrix ? 'Hide All Class Fees Matrix' : 'View All Class Fees Matrix'}
              </button>
            </div>

            {/* Live Class Fees Matrix */}
            {showClassMatrix && (
              <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h6 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Active Next Term Fee Per Class
                  </h6>
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      value={classMatrixSearch}
                      onChange={e => setClassMatrixSearch(e.target.value)}
                      placeholder="Search class..."
                      className="w-full pl-7 pr-3 py-1 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {availableClasses
                    .filter(c => c.name.toLowerCase().includes(classMatrixSearch.toLowerCase()))
                    .map(c => {
                      const feeInfo = getEffectiveClassFee(c.id)
                      return (
                        <div
                          key={`mat-${c.id}`}
                          className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold"
                        >
                          <span className="text-slate-800 truncate mr-2">{c.name}</span>
                          <div className="text-right shrink-0">
                            <span className="text-emerald-700 block font-black">
                              {feeInfo.amount ? feeInfo.amount : <span className="text-slate-400 font-normal italic">Blank</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {feeInfo.source}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

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
              School profiles, branding, academic sessions, calendar, user roles, and PWA setup.
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
        <button onClick={() => setActiveTab('pwa-settings')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'pwa-settings' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📱 PWA Settings
        </button>
      </div>

      {/* School Campus Isolation & Parent Visibility Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-blue-900 shadow-2xs">
        <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
          <Building2 size={18} />
        </div>
        <div className="text-xs space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-950 text-sm">School Campus Configuration</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200/70 text-blue-800">
              Campus Scoped
            </span>
          </div>
          <p className="text-blue-800/90 leading-relaxed font-medium">
            This configuration is strictly for <strong>your school campus</strong>. The official name, contact numbers, address, logo, and branding saved here will be synchronized directly to your school branch profile, printed on official student fee receipts, and displayed on your parents&apos; portal overview.
          </p>
        </div>
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

            {/* Quick jump to Next Term Fees tab */}
            <div
              onClick={() => setActiveTab('next-term-fees')}
              className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition">
                  <Coins size={18} />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-950 block">Next Term Payments & Shared Class Fees</span>
                  <span className="text-[11px] text-emerald-800/80 font-medium">Click to manage fee mode, group classes by fee, and set resumption dates</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs group-hover:bg-emerald-50 transition shrink-0">
                Open Dedicated Tab &rarr;
              </span>
            </div>

            {/* Section D: Official Report Card Settings (Resumption Date, Next Term Payment & Immediate Reflection) */}
            {renderNextTermFeesSection()}

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

      {/* 2. NEXT TERM FEES TAB */}
      {activeTab === 'next-term-fees' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Coins className="text-emerald-600" size={20} /> Next Term Payment & Resumption Setup
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Set per-class next term fees, group classes sharing identical fees, and configure resumption dates for report cards & parent portals.
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
                onClick={() => handleSaveSettings()}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin text-white" /> : <Save size={13} />} Save Fee Settings
              </button>
            </div>
          </div>

          {renderNextTermFeesSection()}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin text-amber-300" /> : <Save size={15} />} Save Next Term Fees
            </button>
          </div>
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

              {/* Asset B: Principal / Director Signature & Default Teacher Signature */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText size={14} className="text-emerald-600" /> Principal & Teacher Signatures (Report Card)
                  </h4>
                  {(signatureBase64 || principalSignatureUrl) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBrandingAsset('signature')}
                      disabled={isResetting}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove Principal Signature
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Principal / Head of School Name</label>
                  <input
                    type="text"
                    value={principalName}
                    onChange={e => setPrincipalName(e.target.value)}
                    placeholder="e.g. Dr. (Mrs.) A. Okafor"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl border-2 border-slate-200 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:8px_8px] bg-white flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs relative">
                    {signatureBase64 || principalSignatureUrl ? (
                      <img
                        src={signatureBase64 || principalSignatureUrl}
                        alt="Principal Signature Preview"
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
                    <label className="block text-xs font-bold text-slate-700">Upload Principal Signature</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">Endorses all official student report cards & transcripts.</p>
                  </div>
                </div>

                {/* Default Class Teacher Signature */}
                <div className="pt-3 border-t border-slate-200/70 flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl border-2 border-slate-200 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:8px_8px] bg-white flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs relative">
                    {teacherSignatureBase64 || defaultTeacherSignatureUrl ? (
                      <img
                        src={teacherSignatureBase64 || defaultTeacherSignatureUrl}
                        alt="Teacher Signature Preview"
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
                    <label className="block text-xs font-bold text-slate-700">Upload Default Class Teacher Signature</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTeacherSignatureFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">Used when a class teacher has not uploaded an individual signature.</p>
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
        <AcademicSessionManager />
      )}

      {activeTab === 'school-calendar' && (
        <SchoolCalendar user={user || { role: 2 }} embedded />
      )}

      {activeTab === 'roles-permissions' && (
        <RoleManagement embedded />
      )}

      {/* PWA SETTINGS */}
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
