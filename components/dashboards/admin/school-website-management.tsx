'use client'

import { useState, useEffect } from 'react'
import {
  Globe,
  Layout,
  Home,
  UserPlus,
  Newspaper,
  Image as ImageIcon,
  Calendar,
  Users,
  PhoneCall,
  BarChart3,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  Trash2,
  Upload,
  RefreshCw,
  Loader2,
  ExternalLink,
  Sliders,
  ShieldCheck,
  ChevronRight,
  GraduationCap
} from 'lucide-react'
import { BASE_URL } from '@/lib/apiSlice'
import { DomainSettingsTab } from './domain-settings-tab'

interface HeroBannerSlide {
  id?: number | string
  url: string
  caption: string
  subcaption?: string
  ctaText?: string
  ctaLink?: string
}

interface AcademicProgramItem {
  id?: string
  title: string
  ageGroup: string
  icon?: string
  description: string
}

interface GalleryPhotoItem {
  id?: number | string
  url: string
  caption: string
  category?: string
}

interface AnnouncementItem {
  id?: number | string
  title: string
  date: string
  badge?: string
  excerpt: string
  link?: string
}

interface LandingPageCMSData {
  branchId: number
  branchName: string
  schoolName: string
  tagline: string
  logoUrl: string | null
  address: string
  phone: string
  email: string
  primaryColor: string
  secondaryColor: string
  subdomain: string
  customDomain: string | null
  isEnabled: boolean
  heroHeadline: string
  heroSubheadline: string
  heroBanners: HeroBannerSlide[]
  welcomeTitle: string
  welcomeMessage: string
  welcomeAuthor: string
  welcomePhoto: string | null
  aboutText: string
  photoGallery: GalleryPhotoItem[]
  academicPrograms: AcademicProgramItem[]
  announcements: AnnouncementItem[]
  showAdmissionCta: boolean
  showPortalLoginCta: boolean
  showGallery: boolean
  showAnnouncements: boolean
  socials: {
    facebook?: string
    instagram?: string
    youtube?: string
    twitter?: string
  }
}

type TabKey = 'overview' | 'hero' | 'about' | 'programs' | 'gallery' | 'news' | 'contact' | 'domain'

export function SchoolWebsiteManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [data, setData] = useState<LandingPageCMSData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Uploading state
  const [uploadingImage, setUploadingImage] = useState(false)

  const fetchCMSData = async () => {
    setLoading(true)
    setStatusMessage(null)
    try {
      const res = await fetch(`${BASE_URL}/admin/landing-page`, {
        credentials: 'include',
      })
      const json = await res.json()
      if (json && (json.branchId || json.data)) {
        setData(json.data || json)
      } else {
        throw new Error(json.message || 'Failed to load website settings.')
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Could not connect to landing page CMS service.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCMSData()
  }, [])

  const handleSave = async (updatedFields?: Partial<LandingPageCMSData>) => {
    if (!data) return
    setSaving(true)
    setStatusMessage(null)

    const payload = {
      ...data,
      ...updatedFields,
    }

    try {
      const res = await fetch(`${BASE_URL}/admin/landing-page`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success || json.branchId) {
        setStatusMessage({ type: 'success', text: 'School website updated and published live!' })
        if (json.data) setData(json.data)
      } else {
        throw new Error(json.message || 'Failed to save changes.')
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving changes.' })
    } finally {
      setSaving(false)
    }
  }

  // Upload helper for banners/photos
  const uploadImageFile = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          setUploadingImage(true)
          const res = await fetch(`${BASE_URL}/admin/landing-page/upload-media`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 }),
          })
          const json = await res.json()
          if (json.success && json.data?.url) {
            resolve(json.data.url)
          } else {
            resolve(base64) // Fallback to inline data URI
          }
        } catch {
          resolve(reader.result as string)
        } finally {
          setUploadingImage(false)
        }
      }
      reader.onerror = () => reject(null)
      reader.readAsDataURL(file)
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-600">Loading School Website & CMS Content...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-bold text-slate-700">Unable to load website configuration.</p>
        <button
          onClick={fetchCMSData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Try Again
        </button>
      </div>
    )
  }

  const liveUrl = data.customDomain
    ? `https://${data.customDomain}`
    : data.subdomain
    ? `https://${data.subdomain}.ugbekun.edu.ng`
    : `/tenant-home?branchId=${data.branchId}`

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-50/70 rounded-full blur-3xl opacity-70" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold mb-1">
              <Globe size={14} /> 100% White-Labeled School Website
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              School Website Builder & Content Manager
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              Upload custom information, manage hero sliders, programs, and photo gallery. Remove or delete unwanted content cleanly anytime.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Eye size={15} /> View Live Website <ExternalLink size={13} />
            </a>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Publish Changes
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 flex items-center space-x-2 p-3 rounded-xl text-xs font-bold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
            activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders size={14} /> Sections & Branding
        </button>
        <button
          onClick={() => setActiveTab('hero')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
            activeTab === 'hero' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ImageIcon size={14} /> Hero Banners ({data.heroBanners?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
            activeTab === 'about' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Home size={14} /> Principal Welcome & About
        </button>
        <button
          onClick={() => setActiveTab('programs')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
            activeTab === 'programs' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap size={14} /> Academic Programs ({data.academicPrograms?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
            activeTab === 'gallery' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ImageIcon size={14} /> Photo Gallery ({data.photoGallery?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
            activeTab === 'news' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Newspaper size={14} /> Announcements ({data.announcements?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('domain')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
            activeTab === 'domain' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe size={14} /> Domain & SSL Setup
        </button>
      </div>

      {/* TAB 1: OVERVIEW & SECTION TOGGLES */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Sliders className="text-indigo-600" size={18} /> Section Visibility Toggles
            </h3>
            <p className="text-xs text-slate-500">
              Turn off sections you do not wish to display on your public website. Turning a section off will completely hide it from visitors.
            </p>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/60 cursor-pointer transition">
                <div>
                  <div className="text-xs font-bold text-slate-900">Enable Website (Public Access)</div>
                  <div className="text-[11px] text-slate-500">Allow visitors to access your school landing page</div>
                </div>
                <input
                  type="checkbox"
                  checked={data.isEnabled}
                  onChange={(e) => setData({ ...data, isEnabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/60 cursor-pointer transition">
                <div>
                  <div className="text-xs font-bold text-slate-900">Show Campus Photo Gallery</div>
                  <div className="text-[11px] text-slate-500">Display campus life and facilities photo album</div>
                </div>
                <input
                  type="checkbox"
                  checked={data.showGallery}
                  onChange={(e) => setData({ ...data, showGallery: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/60 cursor-pointer transition">
                <div>
                  <div className="text-xs font-bold text-slate-900">Show Noticeboard / News Section</div>
                  <div className="text-[11px] text-slate-500">Display latest announcements and academic calendar notices</div>
                </div>
                <input
                  type="checkbox"
                  checked={data.showAnnouncements}
                  onChange={(e) => setData({ ...data, showAnnouncements: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/60 cursor-pointer transition">
                <div>
                  <div className="text-xs font-bold text-slate-900">Show Online Admission CTA Banner</div>
                  <div className="text-[11px] text-slate-500">Encourages prospective parents to start online admission</div>
                </div>
                <input
                  type="checkbox"
                  checked={data.showAdmissionCta}
                  onChange={(e) => setData({ ...data, showAdmissionCta: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/60 cursor-pointer transition">
                <div>
                  <div className="text-xs font-bold text-slate-900">Show Student & Staff Portal Login Link</div>
                  <div className="text-[11px] text-slate-500">Navigation button for teachers, students & parents</div>
                </div>
                <input
                  type="checkbox"
                  checked={data.showPortalLoginCta}
                  onChange={(e) => setData({ ...data, showPortalLoginCta: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="text-indigo-600" size={18} /> Primary Theme Colors
            </h3>
            <p className="text-xs text-slate-500">
              Customize the background gradients, buttons, and badges to match your school brand identity.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Primary Brand Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={data.primaryColor || '#003da5'}
                    onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={data.primaryColor || '#003da5'}
                    onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Secondary Accent Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={data.secondaryColor || '#009ca6'}
                    onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={data.secondaryColor || '#009ca6'}
                    onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 mt-4">
              <div className="text-xs font-bold text-slate-800">Preview Button Gradient</div>
              <div
                className="w-full py-3 rounded-xl text-center text-white text-xs font-bold shadow-md"
                style={{ background: `linear-gradient(135deg, ${data.primaryColor || '#003da5'}, ${data.secondaryColor || '#009ca6'})` }}
              >
                Apply for Admission — {data.schoolName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HERO SLIDER MANAGER */}
      {activeTab === 'hero' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Hero Carousel Banners</h3>
              <p className="text-xs text-slate-500">
                Manage the main rotating banner slides shown at the top of your landing page. You can add, edit, or delete any slide.
              </p>
            </div>
            <button
              onClick={() => {
                const newSlide: HeroBannerSlide = {
                  id: Date.now(),
                  url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80',
                  caption: `Welcome to ${data.schoolName}`,
                  subcaption: 'World-class academic standards and moral excellence.',
                  ctaText: 'Apply for Admission',
                  ctaLink: '/admissions',
                }
                setData({ ...data, heroBanners: [...(data.heroBanners || []), newSlide] })
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
            >
              <Plus size={14} /> Add New Banner Slide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Main Headline</label>
              <input
                type="text"
                value={data.heroHeadline || ''}
                onChange={(e) => setData({ ...data, heroHeadline: e.target.value })}
                placeholder="e.g. Excellence in Knowledge, Character & Innovation"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Subheadline / Supporting Pitch</label>
              <input
                type="text"
                value={data.heroSubheadline || ''}
                onChange={(e) => setData({ ...data, heroSubheadline: e.target.value })}
                placeholder="e.g. We empower young minds with world-class academics..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Slides List */}
          <div className="space-y-4 pt-2">
            {(!data.heroBanners || data.heroBanners.length === 0) ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
                No hero banners configured. Click <b>"Add New Banner Slide"</b> above to add one.
              </div>
            ) : (
              data.heroBanners.map((slide, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-3 relative group">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                      Slide #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = data.heroBanners.filter((_, i) => i !== idx)
                        setData({ ...data, heroBanners: updated })
                      }}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer p-1"
                    >
                      <Trash2 size={14} /> Remove Slide
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 relative">
                        <img src={slide.url} alt={slide.caption} className="w-full h-full object-cover" />
                      </div>
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-600 block mb-1">Upload Custom Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const uploadedUrl = await uploadImageFile(file)
                              if (uploadedUrl) {
                                const next = [...data.heroBanners]
                                next[idx].url = uploadedUrl
                                setData({ ...data, heroBanners: next })
                              }
                            }
                          }}
                          className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </label>
                    </div>

                    <div className="md:col-span-2 space-y-2 text-xs">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Slide Title</label>
                        <input
                          type="text"
                          value={slide.caption || ''}
                          onChange={(e) => {
                            const next = [...data.heroBanners]
                            next[idx].caption = e.target.value
                            setData({ ...data, heroBanners: next })
                          }}
                          className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Slide Description</label>
                        <input
                          type="text"
                          value={slide.subcaption || ''}
                          onChange={(e) => {
                            const next = [...data.heroBanners]
                            next[idx].subcaption = e.target.value
                            setData({ ...data, heroBanners: next })
                          }}
                          className="w-full p-2 border border-slate-200 rounded-xl bg-white font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Button Text</label>
                          <input
                            type="text"
                            value={slide.ctaText || ''}
                            onChange={(e) => {
                              const next = [...data.heroBanners]
                              next[idx].ctaText = e.target.value
                              setData({ ...data, heroBanners: next })
                            }}
                            className="w-full p-2 border border-slate-200 rounded-xl bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Button Link Target</label>
                          <input
                            type="text"
                            value={slide.ctaLink || ''}
                            onChange={(e) => {
                              const next = [...data.heroBanners]
                              next[idx].ctaLink = e.target.value
                              setData({ ...data, heroBanners: next })
                            }}
                            placeholder="/admissions or #contact"
                            className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono text-indigo-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ABOUT & PRINCIPAL'S MESSAGE */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">Principal's Welcome Note & School History</h3>
            <p className="text-xs text-slate-500">
              Provide a personal message from the Head of School, executive leadership, or a brief narrative of your school's history and core values.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Principal / Leader Portrait Photo</label>
              <div className="h-48 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative">
                {data.welcomePhoto ? (
                  <img src={data.welcomePhoto} alt="Leader" className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                    No photo uploaded
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const uploadedUrl = await uploadImageFile(file)
                    if (uploadedUrl) {
                      setData({ ...data, welcomePhoto: uploadedUrl })
                    }
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {data.welcomePhoto && (
                <button
                  type="button"
                  onClick={() => setData({ ...data, welcomePhoto: null })}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} /> Remove Portrait Photo
                </button>
              )}
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Section Title</label>
                  <input
                    type="text"
                    value={data.welcomeTitle || ''}
                    onChange={(e) => setData({ ...data, welcomeTitle: e.target.value })}
                    placeholder="Welcome from the Principal"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Signatory / Leader Name</label>
                  <input
                    type="text"
                    value={data.welcomeAuthor || ''}
                    onChange={(e) => setData({ ...data, welcomeAuthor: e.target.value })}
                    placeholder="e.g. Dr. Jane Doe (Principal)"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Principal's Welcome Address</label>
                <textarea
                  rows={4}
                  value={data.welcomeMessage || ''}
                  onChange={(e) => setData({ ...data, welcomeMessage: e.target.value })}
                  placeholder="On behalf of our dedicated faculty and staff, I warmly welcome you..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 font-normal leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Additional Narrative / Mission & Vision</label>
                <textarea
                  rows={3}
                  value={data.aboutText || ''}
                  onChange={(e) => setData({ ...data, aboutText: e.target.value })}
                  placeholder="Our school is a premier educational institution fostering excellence..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 font-normal leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACADEMIC PROGRAMS */}
      {activeTab === 'programs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Curriculum & Academic Programs</h3>
              <p className="text-xs text-slate-500">
                Display the academic levels offered (e.g. Creche, Nursery, Primary, Junior & Senior Secondary). Remove any program your school does not offer.
              </p>
            </div>
            <button
              onClick={() => {
                const newProg: AcademicProgramItem = {
                  id: `prog-${Date.now()}`,
                  title: 'New Academic Program',
                  ageGroup: 'Ages 5 - 11 Years',
                  description: 'Comprehensive curriculum tailored for personalized student achievement.',
                }
                setData({ ...data, academicPrograms: [...(data.academicPrograms || []), newProg] })
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
            >
              <Plus size={14} /> Add Academic Program
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!data.academicPrograms || data.academicPrograms.length === 0) ? (
              <div className="col-span-2 p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
                No academic programs configured. If left empty, this section will be automatically hidden from your website.
              </div>
            ) : (
              data.academicPrograms.map((prog, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 relative group">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-indigo-700 uppercase">Program #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = data.academicPrograms.filter((_, i) => i !== idx)
                        setData({ ...data, academicPrograms: updated })
                      }}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} /> Delete Program
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Program Name / Tier</label>
                      <input
                        type="text"
                        value={prog.title || ''}
                        onChange={(e) => {
                          const next = [...data.academicPrograms]
                          next[idx].title = e.target.value
                          setData({ ...data, academicPrograms: next })
                        }}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Age Range / Target Group</label>
                      <input
                        type="text"
                        value={prog.ageGroup || ''}
                        onChange={(e) => {
                          const next = [...data.academicPrograms]
                          next[idx].ageGroup = e.target.value
                          setData({ ...data, academicPrograms: next })
                        }}
                        placeholder="e.g. Ages 2 - 5 Years"
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white font-semibold text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Curriculum Overview</label>
                      <textarea
                        rows={2}
                        value={prog.description || ''}
                        onChange={(e) => {
                          const next = [...data.academicPrograms]
                          next[idx].description = e.target.value
                          setData({ ...data, academicPrograms: next })
                        }}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white font-normal"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PHOTO GALLERY */}
      {activeTab === 'gallery' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Campus Photo Gallery</h3>
              <p className="text-xs text-slate-500">
                Upload real campus facilities, computer labs, sports events, and classroom pictures. You can delete stock photos anytime.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer">
                <Upload size={14} /> Upload Campus Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const uploadedUrl = await uploadImageFile(file)
                      if (uploadedUrl) {
                        const newPhoto: GalleryPhotoItem = {
                          id: Date.now(),
                          url: uploadedUrl,
                          caption: file.name.replace(/\.[^/.]+$/, ''),
                          category: 'Campus',
                        }
                        setData({ ...data, photoGallery: [newPhoto, ...(data.photoGallery || [])] })
                      }
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(!data.photoGallery || data.photoGallery.length === 0) ? (
              <div className="col-span-3 p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
                No photos in gallery. Click <b>"Upload Campus Photo"</b> to add pictures.
              </div>
            ) : (
              data.photoGallery.map((photo, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 group flex flex-col justify-between">
                  <div className="h-44 bg-slate-950 relative overflow-hidden">
                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = data.photoGallery.filter((_, i) => i !== idx)
                        setData({ ...data, photoGallery: updated })
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md transition cursor-pointer"
                      title="Delete Photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="p-3 space-y-2 text-xs">
                    <div>
                      <input
                        type="text"
                        value={photo.caption || ''}
                        onChange={(e) => {
                          const next = [...data.photoGallery]
                          next[idx].caption = e.target.value
                          setData({ ...data, photoGallery: next })
                        }}
                        placeholder="Caption / Description"
                        className="w-full p-1.5 border border-slate-200 rounded-lg bg-white font-bold text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={photo.category || ''}
                        onChange={(e) => {
                          const next = [...data.photoGallery]
                          next[idx].category = e.target.value
                          setData({ ...data, photoGallery: next })
                        }}
                        placeholder="Category (e.g. Laboratories, Sports)"
                        className="w-full p-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-[11px] text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: ANNOUNCEMENTS & NEWS */}
      {activeTab === 'news' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Noticeboard & Public Announcements</h3>
              <p className="text-xs text-slate-500">
                Publish resumption guidelines, admission entrance exam dates, and student achievements.
              </p>
            </div>
            <button
              onClick={() => {
                const newNotice: AnnouncementItem = {
                  id: Date.now(),
                  title: 'New Announcement Notice',
                  date: 'Nov 2026',
                  badge: 'Notice',
                  excerpt: 'Important update for parents, students, and prospective scholars.',
                  link: '#contact',
                }
                setData({ ...data, announcements: [newNotice, ...(data.announcements || [])] })
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
            >
              <Plus size={14} /> Add Announcement
            </button>
          </div>

          <div className="space-y-4">
            {(!data.announcements || data.announcements.length === 0) ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
                No announcements published. If left empty, this section will automatically hide from your website.
              </div>
            ) : (
              data.announcements.map((news, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-indigo-700 uppercase">Notice #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = data.announcements.filter((_, i) => i !== idx)
                        setData({ ...data, announcements: updated })
                      }}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} /> Delete Announcement
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Headline</label>
                      <input
                        type="text"
                        value={news.title || ''}
                        onChange={(e) => {
                          const next = [...data.announcements]
                          next[idx].title = e.target.value
                          setData({ ...data, announcements: next })
                        }}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Badge Category</label>
                      <input
                        type="text"
                        value={news.badge || ''}
                        onChange={(e) => {
                          const next = [...data.announcements]
                          next[idx].badge = e.target.value
                          setData({ ...data, announcements: next })
                        }}
                        placeholder="Admissions / Calendar"
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Date Display</label>
                      <input
                        type="text"
                        value={news.date || ''}
                        onChange={(e) => {
                          const next = [...data.announcements]
                          next[idx].date = e.target.value
                          setData({ ...data, announcements: next })
                        }}
                        placeholder="e.g. Sep 2026"
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Excerpt Summary</label>
                    <textarea
                      rows={2}
                      value={news.excerpt || ''}
                      onChange={(e) => {
                        const next = [...data.announcements]
                        next[idx].excerpt = e.target.value
                        setData({ ...data, announcements: next })
                      }}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white font-normal"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 7: DOMAIN & SSL SETTINGS */}
      {activeTab === 'domain' && (
        <DomainSettingsTab />
      )}
    </div>
  )
}
