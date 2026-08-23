'use client'

import { useState, useEffect } from 'react'
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
  Share2,
  ShieldCheck,
  ChevronDown,
  Layers
} from 'lucide-react'
import { SchoolLandingView, SchoolHomepageData } from '@/components/tenant-home/school-landing-view'

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
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // CMS Editor Tab
  const [activeTab, setActiveTab] = useState<'banners' | 'welcome' | 'gallery' | 'academics' | 'announcements' | 'branding' | 'preview'>('banners')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Form State
  const [cmsData, setCmsData] = useState<SchoolHomepageData | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  const getSuperadminToken = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('ugbekun_superadmin_token') || localStorage.getItem('token') || ''
  }

  // Fetch list of branches
  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true)
      try {
        const token = getSuperadminToken()
        const res = await fetch(`${backendUrl}/api/superadmin/branches`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setBranches(json.data)
          if (json.data.length > 0) {
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
        const token = getSuperadminToken()
        const res = await fetch(`${backendUrl}/api/superadmin/branches/${selectedBranchId}/landing-page`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success && json.data) {
          setCmsData(json.data)
        } else {
          throw new Error(json.message || 'Failed to load landing page data.')
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error loading CMS data.')
      } finally {
        setLoadingCms(false)
      }
    }

    fetchCmsData()
  }, [selectedBranchId])

  // Save changes
  const handleSaveLandingPage = async () => {
    if (!selectedBranchId || !cmsData) return
    setSaving(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const token = getSuperadminToken()
      const res = await fetch(`${backendUrl}/api/superadmin/branches/${selectedBranchId}/landing-page`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
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
          twitterUrl: cmsData.socials?.twitter
        })
      })

      const json = await res.json()
      if (json.success) {
        setSuccessMessage('School Landing Page published and synchronized live!')
        if (json.data) {
          setCmsData(json.data)
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
    setCmsData({ ...cmsData, heroBanners: updated })
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

  return (
    <div className="space-y-6">
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

          {/* Save / Publish Button */}
          <button
            onClick={handleSaveLandingPage}
            disabled={saving || !cmsData}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Publish Homepage</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold">
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
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
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
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
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
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
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
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'academics'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <BookOpen size={14} />
                <span>Academic Programs</span>
              </button>

              <button
                onClick={() => setActiveTab('announcements')}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'announcements'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Calendar size={14} />
                <span>Announcements & News</span>
              </button>

              <button
                onClick={() => setActiveTab('branding')}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'branding'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Palette size={14} />
                <span>Colors & Branding</span>
              </button>
            </div>

            {/* Live Preview Device Toggle */}
            <button
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
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
                  <p className="text-xs text-slate-400">High-resolution banner pictures shown on the school landing page hero slider.</p>
                </div>
                <button
                  onClick={addBanner}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all"
                >
                  <Plus size={14} />
                  <span>Add Banner Slide</span>
                </button>
              </div>

              {/* General Headline & Subheadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Primary Hero Headline</label>
                  <input
                    type="text"
                    value={cmsData.heroHeadline}
                    onChange={(e) => setCmsData({ ...cmsData, heroHeadline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Hero Subheadline</label>
                  <input
                    type="text"
                    value={cmsData.heroSubheadline}
                    onChange={(e) => setCmsData({ ...cmsData, heroSubheadline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Banner Slide Cards */}
              <div className="space-y-4">
                {cmsData.heroBanners.map((banner, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-cyan-400">Slide #{idx + 1}</span>
                      <button
                        onClick={() => deleteBanner(idx)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Image Thumbnail */}
                      <div className="md:col-span-3">
                        <img
                          src={banner.url}
                          alt={banner.caption}
                          className="w-full h-32 object-cover rounded-xl border border-slate-700 shadow-md"
                        />
                      </div>

                      {/* Fields */}
                      <div className="md:col-span-9 space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Image URL (High-Res 1600x900)</label>
                          <input
                            type="text"
                            value={banner.url}
                            onChange={(e) => updateBanner(idx, 'url', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Slide Title / Caption</label>
                            <input
                              type="text"
                              value={banner.caption}
                              onChange={(e) => updateBanner(idx, 'caption', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                            />
                          </div>

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
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Welcome Title</label>
                    <input
                      type="text"
                      value={cmsData.welcomeTitle}
                      onChange={(e) => setCmsData({ ...cmsData, welcomeTitle: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Author Name & Title</label>
                    <input
                      type="text"
                      value={cmsData.welcomeAuthor}
                      onChange={(e) => setCmsData({ ...cmsData, welcomeAuthor: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Principal Photograph URL</label>
                    <input
                      type="text"
                      value={cmsData.welcomePhoto || ''}
                      onChange={(e) => setCmsData({ ...cmsData, welcomePhoto: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-500 mb-2"
                    />
                    {cmsData.welcomePhoto && (
                      <img src={cmsData.welcomePhoto} alt="Principal Preview" className="w-24 h-24 object-cover rounded-xl border border-slate-700 shadow" />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Welcome Message Letter</label>
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
                <button
                  onClick={addGalleryItem}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all"
                >
                  <Plus size={14} />
                  <span>Add Photo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cmsData.photoGallery.map((photo, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="relative h-36 rounded-xl overflow-hidden border border-slate-700">
                      <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                      <button
                        onClick={() => deleteGalleryItem(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-red-400 hover:bg-red-500 hover:text-white transition-colors shadow"
                      >
                        <Trash2 size={14} />
                      </button>
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
              <div>
                <h3 className="text-lg font-bold text-white">Academic Curricula & Programs</h3>
                <p className="text-xs text-slate-400">Configure learning stages displayed in the academic excellence section.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(cmsData.academicPrograms || []).map((prog, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Program Title</label>
                        <input
                          type="text"
                          value={prog.title}
                          onChange={(e) => {
                            const updated = [...cmsData.academicPrograms]
                            updated[idx] = { ...updated[idx], title: e.target.value }
                            setCmsData({ ...cmsData, academicPrograms: updated })
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Age Group</label>
                        <input
                          type="text"
                          value={prog.ageGroup}
                          onChange={(e) => {
                            const updated = [...cmsData.academicPrograms]
                            updated[idx] = { ...updated[idx], ageGroup: e.target.value }
                            setCmsData({ ...cmsData, academicPrograms: updated })
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Curriculum Description</label>
                      <textarea
                        rows={3}
                        value={prog.description}
                        onChange={(e) => {
                          const updated = [...cmsData.academicPrograms]
                          updated[idx] = { ...updated[idx], description: e.target.value }
                          setCmsData({ ...cmsData, academicPrograms: updated })
                        }}
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
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all"
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
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
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

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Excerpt</label>
                      <input
                        type="text"
                        value={notice.excerpt}
                        onChange={(e) => updateAnnouncement(idx, 'excerpt', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500"
                      />
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
                <h3 className="text-lg font-bold text-white">Brand Palette & Social Links</h3>
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
                </div>
              </div>
            </div>
          )}

          {/* 9. TAB 7: LIVE DEVICE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                  <Eye size={16} className="text-cyan-400" />
                  <span>Real-Time Interactive Preview: {cmsData.schoolName}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-2 rounded-xl border transition-all ${
                      previewDevice === 'desktop'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor size={16} />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-2 rounded-xl border transition-all ${
                      previewDevice === 'mobile'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Mobile View"
                  >
                    <Smartphone size={16} />
                  </button>
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
