'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Globe,
  Sliders,
  Image as ImageIcon,
  Building2,
  BookOpen,
  Calendar,
  Sparkles,
  Save,
  Loader2,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Palette,
  ShieldCheck,
  ChevronDown,
  Layers,
  Settings2,
  Check,
  HelpCircle,
  Link as LinkIcon
} from 'lucide-react'
import { SchoolLandingView, SchoolHomepageData } from '@/components/tenant-home/school-landing-view'
import { apiSlice, endpoints } from '@/lib/apiSlice'

interface BranchOption {
  id: number
  name: string
  code: string
  subdomain?: string
  customDomain?: string
  schoolName?: string
}

export function SuperadminSchoolCmsEditor() {
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [loadingCms, setLoadingCms] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // CMS Editor Tab
  const [activeTab, setActiveTab] = useState<'banners' | 'welcome' | 'gallery' | 'academics' | 'announcements' | 'branding' | 'settings' | 'preview'>('banners')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Form State
  const [cmsData, setCmsData] = useState<SchoolHomepageData | null>(null)

  // Hidden File Input Ref for uploads
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadCallback, setUploadCallback] = useState<((url: string) => void) | null>(null)
  const [uploadCategory, setUploadCategory] = useState<string>('cms')

  // Fetch list of branches
  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true)
      try {
        const json = await apiSlice.get<{ success: boolean; data: BranchOption[] }>(endpoints.superadmin.branches)
        if (json.success && Array.isArray(json.data)) {
          setBranches(json.data)
          if (json.data.length > 0 && !selectedBranchId) {
            setSelectedBranchId(json.data[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load branches:', err)
      } finally {
        setLoadingBranches(false)
      }
    }

    fetchBranches()
  }, [])

  // Fetch CMS data when selectedBranchId changes
  useEffect(() => {
    if (!selectedBranchId) return

    const fetchCmsData = async () => {
      setLoadingCms(true)
      setErrorMessage('')
      try {
        const json = await apiSlice.get<{ success: boolean; data: SchoolHomepageData }>(
          endpoints.superadmin.branchLandingPage(selectedBranchId),
          { cacheBust: true }
        )
        if (json.success && json.data) {
          setCmsData(json.data)
        } else {
          throw new Error('Failed to load landing page data.')
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error loading CMS data.')
      } finally {
        setLoadingCms(false)
      }
    }

    fetchCmsData()
  }, [selectedBranchId])

  // Trigger file upload dialog
  const triggerImageUpload = (category: string, onUploaded: (url: string) => void) => {
    setUploadCategory(category)
    setUploadCallback(() => onUploaded)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  // Handle file upload to backend/Cloudinary
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedBranchId || !uploadCallback) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP).')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8MB limit.')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      try {
        setUploadingMedia(true)
        setErrorMessage('')
        setSuccessMessage('')

        const res = await apiSlice.post<{ success: boolean; data: { url: string } }>(
          endpoints.superadmin.uploadLandingPageMedia(selectedBranchId),
          {
            imageBase64: base64,
            category: uploadCategory,
            caption: file.name
          }
        )

        if (res.success && res.data?.url) {
          uploadCallback(res.data.url)
          setSuccessMessage('Image uploaded and synced successfully! Click "Publish Homepage" to save live.')
        } else {
          throw new Error('Image upload failed.')
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to upload image.')
      } finally {
        setUploadingMedia(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // Save changes
  const handleSaveLandingPage = async () => {
    if (!selectedBranchId || !cmsData) return
    setSaving(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const payload = {
        isEnabled: cmsData.isEnabled,
        heroHeadline: cmsData.heroHeadline,
        heroSubheadline: cmsData.heroSubheadline,
        heroBanners: cmsData.heroBanners,
        welcomeTitle: cmsData.welcomeTitle,
        welcomeMessage: cmsData.welcomeMessage,
        welcomeAuthor: cmsData.welcomeAuthor,
        welcomePhoto: cmsData.welcomePhoto,
        aboutText: cmsData.aboutText,
        photoGallery: cmsData.photoGallery,
        academicPrograms: cmsData.academicPrograms,
        announcements: cmsData.announcements,
        primaryColor: cmsData.primaryColor,
        secondaryColor: cmsData.secondaryColor,
        showAdmissionCta: cmsData.showAdmissionCta,
        showPortalLoginCta: cmsData.showPortalLoginCta,
        showGallery: cmsData.showGallery,
        showAnnouncements: cmsData.showAnnouncements,
        facebookUrl: cmsData.socials?.facebook,
        instagramUrl: cmsData.socials?.instagram,
        youtubeUrl: cmsData.socials?.youtube,
        twitterUrl: cmsData.socials?.twitter,
      }

      const json = await apiSlice.put<{ success: boolean; message?: string; data?: SchoolHomepageData }>(
        endpoints.superadmin.branchLandingPage(selectedBranchId),
        payload
      )

      if (json.success) {
        setSuccessMessage('School Landing Page published and synchronized live! Changes take effect immediately.')
        if (json.data) {
          setCmsData(json.data)
        }

        // Broadcast publish event to all open school portal tabs in real time
        if (typeof window !== 'undefined') {
          try {
            if ('BroadcastChannel' in window) {
              const ch = new BroadcastChannel('ugbekun_cms_sync')
              ch.postMessage({ branchId: selectedBranchId, timestamp: Date.now() })
              ch.close()
            }
          } catch {}
          try {
            localStorage.setItem(
              'ugbekun_cms_sync',
              JSON.stringify({ branchId: selectedBranchId, timestamp: Date.now() })
            )
          } catch {}
        }
      } else {
        throw new Error(json.message || 'Failed to save landing page.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving landing page.')
    } finally {
      setSaving(false)
    }
  }

  // Sync hero headline with slide 1 caption
  const updateHeroHeadline = (val: string) => {
    if (!cmsData) return
    const updated = [...cmsData.heroBanners]
    if (updated.length > 0) {
      updated[0] = { ...updated[0], caption: val }
    }
    setCmsData({
      ...cmsData,
      heroHeadline: val,
      heroBanners: updated
    })
  }

  // Sync hero subheadline with slide 1 subcaption
  const updateHeroSubheadline = (val: string) => {
    if (!cmsData) return
    const updated = [...cmsData.heroBanners]
    if (updated.length > 0) {
      updated[0] = { ...updated[0], subcaption: val }
    }
    setCmsData({
      ...cmsData,
      heroSubheadline: val,
      heroBanners: updated
    })
  }

  // Banner Slide Management
  const addBanner = () => {
    if (!cmsData) return
    const newBanner = {
      id: Date.now(),
      url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80',
      caption: `Empowering Academic Excellence at ${cmsData.schoolName}`,
      subcaption: 'World-class standard education with modern ICT, science laboratories, and moral integrity.',
      ctaText: 'Apply for Admission',
      ctaLink: '/subscribe'
    }
    setCmsData({
      ...cmsData,
      heroBanners: [...cmsData.heroBanners, newBanner]
    })
  }

  const updateBanner = (index: number, field: string, value: string) => {
    if (!cmsData) return
    const updated = [...cmsData.heroBanners]
    updated[index] = { ...updated[index], [field]: value }
    
    // If updating slide 0, keep top-level hero headline in sync
    if (index === 0 && field === 'caption') {
      setCmsData({ ...cmsData, heroHeadline: value, heroBanners: updated })
    } else if (index === 0 && field === 'subcaption') {
      setCmsData({ ...cmsData, heroSubheadline: value, heroBanners: updated })
    } else {
      setCmsData({ ...cmsData, heroBanners: updated })
    }
  }

  const deleteBanner = (index: number) => {
    if (!cmsData) return
    if (cmsData.heroBanners.length <= 1) {
      alert('At least one hero banner slide is required.')
      return
    }
    const updated = cmsData.heroBanners.filter((_, i) => i !== index)
    setCmsData({ ...cmsData, heroBanners: updated })
  }

  // Gallery Management
  const addGalleryItem = () => {
    if (!cmsData) return
    const newItem = {
      id: Date.now(),
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
      caption: 'New Campus Facility Photo',
      category: 'Campus'
    }
    setCmsData({
      ...cmsData,
      photoGallery: [...cmsData.photoGallery, newItem]
    })
  }

  const updateGalleryItem = (index: number, field: string, value: string) => {
    if (!cmsData) return
    const updated = [...cmsData.photoGallery]
    updated[index] = { ...updated[index], [field]: value }
    setCmsData({ ...cmsData, photoGallery: updated })
  }

  const deleteGalleryItem = (index: number) => {
    if (!cmsData) return
    const updated = cmsData.photoGallery.filter((_, i) => i !== index)
    setCmsData({ ...cmsData, photoGallery: updated })
  }

  // Academic Program Management
  const addAcademicProgram = () => {
    if (!cmsData) return
    const newProg = {
      id: `prog-${Date.now()}`,
      title: 'New Academic Program',
      ageGroup: 'Ages 5 - 12 Years',
      icon: 'BookOpen',
      description: 'Comprehensive curriculum cultivating intellect, character, and 21st-century problem-solving capabilities.'
    }
    setCmsData({
      ...cmsData,
      academicPrograms: [...(cmsData.academicPrograms || []), newProg]
    })
  }

  const updateAcademicProgram = (index: number, field: string, value: string) => {
    if (!cmsData) return
    const updated = [...(cmsData.academicPrograms || [])]
    updated[index] = { ...updated[index], [field]: value }
    setCmsData({ ...cmsData, academicPrograms: updated })
  }

  const deleteAcademicProgram = (index: number) => {
    if (!cmsData) return
    const updated = (cmsData.academicPrograms || []).filter((_, i) => i !== index)
    setCmsData({ ...cmsData, academicPrograms: updated })
  }

  // Announcement Management
  const addAnnouncement = () => {
    if (!cmsData) return
    const newNotice = {
      id: Date.now(),
      title: 'New Term Event & Announcements',
      date: '2026',
      badge: 'News',
      excerpt: 'Important update for parents, scholars, and prospective students.',
      link: '#contact'
    }
    setCmsData({
      ...cmsData,
      announcements: [...cmsData.announcements, newNotice]
    })
  }

  const updateAnnouncement = (index: number, field: string, value: string) => {
    if (!cmsData) return
    const updated = [...cmsData.announcements]
    updated[index] = { ...updated[index], [field]: value }
    setCmsData({ ...cmsData, announcements: updated })
  }

  const deleteAnnouncement = (index: number) => {
    if (!cmsData) return
    const updated = cmsData.announcements.filter((_, i) => i !== index)
    setCmsData({ ...cmsData, announcements: updated })
  }

  if (loadingBranches) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm font-semibold">Loading School Front-CMS Studio...</p>
      </div>
    )
  }

  const selectedBranch = branches.find((item) => item.id === selectedBranchId)

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Image Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. TOP HEADER & BRANCH SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={14} />
            <span>Multi-Tenant Front-CMS Studio</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            School Homepage & Custom Domain CMS Builder
          </h2>
          <p className="text-sm text-slate-400">
            Customize hero banners, principal welcome notes, campus photo galleries, and visual branding for any school branch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Picker */}
          <div className="relative min-w-[260px]">
            <select
              value={selectedBranchId || ''}
              onChange={(e) => setSelectedBranchId(parseInt(e.target.value, 10))}
              className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-500 pr-10 shadow-sm"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code || `ID: ${b.id}`})
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>

          {/* View Live Preview Links */}
          {selectedBranchId && (
            <div className="flex items-center space-x-2">
              <a
                href={`/tenant-home?branchId=${selectedBranchId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/30 shadow transition-all cursor-pointer"
                title="Open live preview of this school landing page in new tab"
              >
                <ExternalLink size={14} />
                <span>View Live Preview</span>
              </a>

              {selectedBranch?.customDomain && (
                <a
                  href={`https://${selectedBranch.customDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow transition-all cursor-pointer"
                  title={`Open custom domain: https://${selectedBranch.customDomain}`}
                >
                  <Globe size={13} className="text-cyan-400" />
                  <span className="hidden lg:inline">{selectedBranch.customDomain}</span>
                </a>
              )}
            </div>
          )}

          {/* Save / Publish Button */}
          <button
            onClick={handleSaveLandingPage}
            disabled={saving || uploadingMedia || !cmsData}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Publish Homepage</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {uploadingMedia && (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-semibold">
          <Loader2 size={18} className="animate-spin" />
          <span>Uploading image to Cloudinary storage and optimizing...</span>
        </div>
      )}
      {successMessage && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold animate-in fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          {selectedBranchId && (
            <a
              href={`/tenant-home?branchId=${selectedBranchId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <span>View School Portal</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold animate-in fade-in">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {loadingCms ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-sm">Loading school homepage configuration...</p>
        </div>
      ) : cmsData ? (
        <div className="space-y-6">
          {/* 2. CMS STUDIO NAVIGATION TABS */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('banners')}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'banners'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <ImageIcon size={14} />
                <span>Hero Banners & Sliders ({cmsData.heroBanners?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('welcome')}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'welcome'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Building2 size={14} />
                <span>Principal Message & About</span>
              </button>

              <button
                onClick={() => setActiveTab('gallery')}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <ImageIcon size={14} />
                <span>Campus Photo Gallery ({cmsData.photoGallery?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('academics')}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'academics'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <BookOpen size={14} />
                <span>Academic Programs ({(cmsData.academicPrograms || []).length})</span>
              </button>

              <button
                onClick={() => setActiveTab('announcements')}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'announcements'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Calendar size={14} />
                <span>Announcements & News ({cmsData.announcements?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('branding')}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'branding'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Palette size={14} />
                <span>Colors & Branding</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Settings2 size={14} />
                <span>Sections & Visibility</span>
              </button>
            </div>

            {/* Live Preview Device Toggle */}
            <button
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Eye size={14} />
              <span>Live Device Preview</span>
            </button>
          </div>

          {/* 3. TAB 1: HERO BANNERS & SLIDERS */}
          {activeTab === 'banners' && (
            <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Hero Banners & Carousel Slides</h3>
                  <p className="text-xs text-slate-400">High-resolution banner pictures and captions displayed on the school landing page hero slider.</p>
                </div>
                <button
                  onClick={addBanner}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Banner Slide</span>
                </button>
              </div>

              {/* General Headline & Subheadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Primary Hero Headline (Slide #1 Title)
                  </label>
                  <input
                    type="text"
                    value={cmsData.heroHeadline}
                    onChange={(e) => updateHeroHeadline(e.target.value)}
                    placeholder="e.g. Knowledge for Service"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-semibold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Directly displays on the opening hero banner of your landing page.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Hero Subheadline (Slide #1 Subtitle)
                  </label>
                  <input
                    type="text"
                    value={cmsData.heroSubheadline}
                    onChange={(e) => updateHeroSubheadline(e.target.value)}
                    placeholder="e.g. Welcome to Fortune Springs Montessori School..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Brief institutional slogan or welcoming sentence.</p>
                </div>
              </div>

              {/* Banner Slide Cards */}
              <div className="space-y-4">
                {cmsData.heroBanners.map((banner, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                          Slide #{idx + 1} {idx === 0 ? '(Primary Hero)' : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteBanner(idx)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete this banner slide"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {/* Image Thumbnail with Upload Button */}
                      <div className="md:col-span-4 space-y-2">
                        <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-md h-36 bg-slate-900">
                          <img
                            src={banner.url}
                            alt={banner.caption}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => triggerImageUpload('banners', (url) => updateBanner(idx, 'url', url))}
                          className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                        >
                          <Upload size={14} />
                          <span>Upload Banner Image</span>
                        </button>
                      </div>

                      {/* Fields */}
                      <div className="md:col-span-8 space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Image URL (High-Res 1600x900)</label>
                          <input
                            type="text"
                            value={banner.url}
                            onChange={(e) => updateBanner(idx, 'url', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Slide Title / Headline</label>
                          <input
                            type="text"
                            value={banner.caption}
                            onChange={(e) => updateBanner(idx, 'caption', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Slide Subheadline / Description</label>
                          <input
                            type="text"
                            value={banner.subcaption || ''}
                            onChange={(e) => updateBanner(idx, 'subcaption', e.target.value)}
                            placeholder="Brief description for this slide..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Button CTA Text</label>
                            <input
                              type="text"
                              value={banner.ctaText || ''}
                              onChange={(e) => updateBanner(idx, 'ctaText', e.target.value)}
                              placeholder="e.g. Apply for Admission"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Button Link URL</label>
                            <input
                              type="text"
                              value={banner.ctaLink || ''}
                              onChange={(e) => updateBanner(idx, 'ctaLink', e.target.value)}
                              placeholder="e.g. /subscribe or #about"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. TAB 2: PRINCIPAL MESSAGE & ABOUT */}
          {activeTab === 'welcome' && (
            <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div>
                <h3 className="text-lg font-bold text-white">Principal / Proprietor Welcome Address</h3>
                <p className="text-xs text-slate-400">Formal address from the head of school with photo and school history.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Welcome Section Title</label>
                    <input
                      type="text"
                      value={cmsData.welcomeTitle}
                      onChange={(e) => setCmsData({ ...cmsData, welcomeTitle: e.target.value })}
                      placeholder="e.g. A Message from the Principal"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Author Name & Title</label>
                    <input
                      type="text"
                      value={cmsData.welcomeAuthor}
                      onChange={(e) => setCmsData({ ...cmsData, welcomeAuthor: e.target.value })}
                      placeholder="e.g. Executive Principal / Head of School"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Principal Photograph</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={cmsData.welcomePhoto || ''}
                          onChange={(e) => setCmsData({ ...cmsData, welcomePhoto: e.target.value })}
                          placeholder="Image URL..."
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() => triggerImageUpload('principal', (url) => setCmsData({ ...cmsData, welcomePhoto: url }))}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/30 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <Upload size={14} />
                          <span>Upload Photo</span>
                        </button>
                      </div>

                      {cmsData.welcomePhoto && (
                        <div className="flex items-center space-x-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
                          <img
                            src={cmsData.welcomePhoto}
                            alt="Principal Preview"
                            className="w-16 h-16 object-cover rounded-lg border border-slate-700 shadow"
                          />
                          <span className="text-xs text-slate-400">Current photograph preview</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Welcome Letter / Address</label>
                    <textarea
                      rows={5}
                      value={cmsData.welcomeMessage}
                      onChange={(e) => setCmsData({ ...cmsData, welcomeMessage: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">About School Narrative</label>
                    <textarea
                      rows={3}
                      value={cmsData.aboutText}
                      onChange={(e) => setCmsData({ ...cmsData, aboutText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. TAB 3: CAMPUS PHOTO GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Campus Photo Gallery Manager</h3>
                  <p className="text-xs text-slate-400">Add, edit, or categorize campus life, science lab, sports, and arts photos.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      triggerImageUpload('gallery', (url) => {
                        const newItem = {
                          id: Date.now(),
                          url,
                          caption: 'New Campus Photo',
                          category: 'Campus'
                        }
                        setCmsData({
                          ...cmsData,
                          photoGallery: [...cmsData.photoGallery, newItem]
                        })
                      })
                    }
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow transition-all cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Upload & Add Photo</span>
                  </button>

                  <button
                    onClick={addGalleryItem}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add by URL</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cmsData.photoGallery.map((photo, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="relative h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                      <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => triggerImageUpload('gallery', (url) => updateGalleryItem(idx, 'url', url))}
                          className="p-1.5 rounded-lg bg-slate-950/80 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-colors shadow cursor-pointer"
                          title="Replace Photo"
                        >
                          <Upload size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGalleryItem(idx)}
                          className="p-1.5 rounded-lg bg-slate-950/80 text-red-400 hover:bg-red-500 hover:text-white transition-colors shadow cursor-pointer"
                          title="Delete Photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Image URL</label>
                      <input
                        type="text"
                        value={photo.url}
                        onChange={(e) => updateGalleryItem(idx, 'url', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Caption</label>
                        <input
                          type="text"
                          value={photo.caption}
                          onChange={(e) => updateGalleryItem(idx, 'caption', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Category</label>
                        <select
                          value={photo.category || 'Campus'}
                          onChange={(e) => updateGalleryItem(idx, 'category', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-cyan-500"
                        >
                          <option value="Campus">Campus</option>
                          <option value="Laboratories">Laboratories</option>
                          <option value="Sports">Sports</option>
                          <option value="Arts">Arts</option>
                          <option value="Library">Library</option>
                          <option value="Technology">Technology</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. TAB 4: ACADEMIC PROGRAMS */}
          {activeTab === 'academics' && (
            <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Academic Curricula & Programs</h3>
                  <p className="text-xs text-slate-400">Configure learning stages displayed in the academic excellence section.</p>
                </div>
                <button
                  onClick={addAcademicProgram}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Curriculum Program</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(cmsData.academicPrograms || []).map((prog, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 uppercase">Program #{idx + 1}</span>
                      <button
                        onClick={() => deleteAcademicProgram(idx)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
                        title="Delete Program"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Program Title</label>
                        <input
                          type="text"
                          value={prog.title}
                          onChange={(e) => updateAcademicProgram(idx, 'title', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Age Group</label>
                        <input
                          type="text"
                          value={prog.ageGroup}
                          onChange={(e) => updateAcademicProgram(idx, 'ageGroup', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Curriculum Description</label>
                      <textarea
                        rows={3}
                        value={prog.description}
                        onChange={(e) => updateAcademicProgram(idx, 'description', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-cyan-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. TAB 5: ANNOUNCEMENTS & NOTICES */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Announcements & Event Noticeboard</h3>
                  <p className="text-xs text-slate-400">Keep prospective parents and scholars informed of open admissions and events.</p>
                </div>
                <button
                  onClick={addAnnouncement}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Notice</span>
                </button>
              </div>

              <div className="space-y-3">
                {cmsData.announcements.map((notice, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400">Notice #{idx + 1}</span>
                      <button
                        onClick={() => deleteAnnouncement(idx)}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Headline</label>
                        <input
                          type="text"
                          value={notice.title}
                          onChange={(e) => updateAnnouncement(idx, 'title', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Date / Badge</label>
                        <input
                          type="text"
                          value={notice.date}
                          onChange={(e) => updateAnnouncement(idx, 'date', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Excerpt</label>
                        <input
                          type="text"
                          value={notice.excerpt}
                          onChange={(e) => updateAnnouncement(idx, 'excerpt', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Link Target</label>
                        <input
                          type="text"
                          value={notice.link || ''}
                          onChange={(e) => updateAnnouncement(idx, 'link', e.target.value)}
                          placeholder="e.g. /subscribe or #about"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. TAB 6: COLORS & BRANDING */}
          {activeTab === 'branding' && (
            <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div>
                <h3 className="text-lg font-bold text-white">Brand Palette & Social Profiles</h3>
                <p className="text-xs text-slate-400">Configure white-label school color scheme and external profiles.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white">Theme Accent Colors</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Primary Brand Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={cmsData.primaryColor || '#003da5'}
                        onChange={(e) => setCmsData({ ...cmsData, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cmsData.primaryColor || '#003da5'}
                        onChange={(e) => setCmsData({ ...cmsData, primaryColor: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Secondary Accent Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={cmsData.secondaryColor || '#009ca6'}
                        onChange={(e) => setCmsData({ ...cmsData, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cmsData.secondaryColor || '#009ca6'}
                        onChange={(e) => setCmsData({ ...cmsData, secondaryColor: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white">Social Media Channels</h4>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Facebook URL</label>
                    <input
                      type="text"
                      value={cmsData.socials?.facebook || ''}
                      onChange={(e) =>
                        setCmsData({
                          ...cmsData,
                          socials: { ...cmsData.socials, facebook: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Instagram URL</label>
                    <input
                      type="text"
                      value={cmsData.socials?.instagram || ''}
                      onChange={(e) =>
                        setCmsData({
                          ...cmsData,
                          socials: { ...cmsData.socials, instagram: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">YouTube URL</label>
                    <input
                      type="text"
                      value={cmsData.socials?.youtube || ''}
                      onChange={(e) =>
                        setCmsData({
                          ...cmsData,
                          socials: { ...cmsData.socials, youtube: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Twitter / X URL</label>
                    <input
                      type="text"
                      value={cmsData.socials?.twitter || ''}
                      onChange={(e) =>
                        setCmsData({
                          ...cmsData,
                          socials: { ...cmsData.socials, twitter: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 9. TAB 7: SECTIONS & VISIBILITY SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div>
                <h3 className="text-lg font-bold text-white">Sections & Feature Visibility</h3>
                <p className="text-xs text-slate-400">Control which modules, buttons, and galleries appear on the school's public website.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div>
                    <div className="text-sm font-bold text-white">School Landing Page Enabled</div>
                    <div className="text-xs text-slate-400 mt-0.5">When disabled, visits redirect to portal login.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cmsData.isEnabled ?? true}
                    onChange={(e) => setCmsData({ ...cmsData, isEnabled: e.target.checked })}
                    className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div>
                    <div className="text-sm font-bold text-white">Admission CTA Button</div>
                    <div className="text-xs text-slate-400 mt-0.5">Display "Apply for Admission" buttons in navbar & hero.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cmsData.showAdmissionCta ?? true}
                    onChange={(e) => setCmsData({ ...cmsData, showAdmissionCta: e.target.checked })}
                    className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div>
                    <div className="text-sm font-bold text-white">Portal Login CTA Button</div>
                    <div className="text-xs text-slate-400 mt-0.5">Display "Sign In" link for students, parents, and staff.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cmsData.showPortalLoginCta ?? true}
                    onChange={(e) => setCmsData({ ...cmsData, showPortalLoginCta: e.target.checked })}
                    className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div>
                    <div className="text-sm font-bold text-white">Campus Photo Gallery</div>
                    <div className="text-xs text-slate-400 mt-0.5">Display campus photos and interactive lightbox modal.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cmsData.showGallery ?? true}
                    onChange={(e) => setCmsData({ ...cmsData, showGallery: e.target.checked })}
                    className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div>
                    <div className="text-sm font-bold text-white">Announcements Noticeboard</div>
                    <div className="text-xs text-slate-400 mt-0.5">Display calendar events and admission notices.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cmsData.showAnnouncements ?? true}
                    onChange={(e) => setCmsData({ ...cmsData, showAnnouncements: e.target.checked })}
                    className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. TAB 8: LIVE DEVICE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                  <Eye size={16} className="text-cyan-400" />
                  <span>Real-Time Interactive Preview: {cmsData.schoolName}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <a
                    href={`/tenant-home?branchId=${selectedBranchId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/30 transition-all cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>Open in New Tab</span>
                  </a>

                  <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        previewDevice === 'desktop'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                          : 'bg-transparent text-slate-400 border-transparent hover:text-white'
                      }`}
                      title="Desktop View"
                    >
                      <Monitor size={15} />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        previewDevice === 'mobile'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                          : 'bg-transparent text-slate-400 border-transparent hover:text-white'
                      }`}
                      title="Mobile View"
                    >
                      <Smartphone size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Container Frame */}
              <div className="flex justify-center bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
                <div
                  className={`transition-all duration-300 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${
                    previewDevice === 'mobile' ? 'w-[375px] max-h-[750px] overflow-y-auto' : 'w-full'
                  }`}
                >
                  <SchoolLandingView initialData={cmsData} previewMode={true} />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
