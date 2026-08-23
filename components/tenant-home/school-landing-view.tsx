'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  Send,
  ExternalLink,
  Baby,
  Building2,
  X,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Image as ImageIcon
} from 'lucide-react'

export interface SchoolHomepageData {
  branchId: number
  branchName: string
  branchCode: string
  subdomain: string
  customDomain: string | null
  domainStatus: string
  schoolName: string
  tagline: string
  logoUrl: string | null
  address: string
  phone: string
  email: string
  primaryColor: string
  secondaryColor: string
  isEnabled: boolean
  heroHeadline: string
  heroSubheadline: string
  heroBanners: Array<{
    id?: number
    url: string
    caption: string
    subcaption?: string
    ctaText?: string
    ctaLink?: string
  }>
  welcomeTitle: string
  welcomeMessage: string
  welcomeAuthor: string
  welcomePhoto: string | null
  aboutText: string
  photoGallery: Array<{
    id?: number
    url: string
    caption: string
    category?: string
  }>
  academicPrograms: Array<{
    id?: string
    title: string
    ageGroup: string
    icon?: string
    description: string
  }>
  announcements: Array<{
    id?: number
    title: string
    date: string
    badge?: string
    excerpt: string
    link?: string
  }>
  showAdmissionCta: boolean
  showPortalLoginCta: boolean
  showGallery: boolean
  showAnnouncements: boolean
  socials: {
    facebook?: string | null
    instagram?: string | null
    youtube?: string | null
    twitter?: string | null
  }
}

interface SchoolLandingViewProps {
  initialData: SchoolHomepageData
  previewMode?: boolean
}

export function SchoolLandingView({ initialData, previewMode = false }: SchoolLandingViewProps) {
  const [data, setData] = useState<SchoolHomepageData>(initialData)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [activeGalleryCategory, setActiveGalleryCategory] = useState('All')
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; caption: string } | null>(null)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const banners = data.heroBanners && data.heroBanners.length > 0 ? data.heroBanners : []

  // Auto-advance banner slider
  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [banners.length])

  const nextBanner = () => {
    if (banners.length === 0) return
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
  }

  const prevBanner = () => {
    if (banners.length === 0) return
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const galleryCategories = ['All', ...Array.from(new Set((data.photoGallery || []).map((p) => p.category || 'Campus')))]

  const filteredGallery = (data.photoGallery || []).filter((item) => {
    if (activeGalleryCategory === 'All') return true
    return item.category === activeGalleryCategory
  })

  const primaryColor = data.primaryColor || '#003da5'
  const secondaryColor = data.secondaryColor || '#009ca6'

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 selection:bg-cyan-500 selection:text-white font-sans antialiased">
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070d19]/90 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & School Name */}
          <Link href="/" className="flex items-center space-x-3 group">
            {data.logoUrl ? (
              <img
                src={data.logoUrl}
                alt={data.schoolName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {data.branchCode || 'SCH'}
              </div>
            )}
            <div>
              <div className="text-lg font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                {data.schoolName}
              </div>
              <div className="text-xs text-slate-400 font-medium tracking-wider uppercase">
                {data.tagline || 'Excellence in Knowledge & Character'}
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-300">
            <a href="#about" className="hover:text-cyan-400 transition-colors">About Us</a>
            <a href="#academics" className="hover:text-cyan-400 transition-colors">Academics</a>
            {data.showGallery && <a href="#gallery" className="hover:text-cyan-400 transition-colors">Campus Life</a>}
            {data.showAnnouncements && <a href="#announcements" className="hover:text-cyan-400 transition-colors">News & Events</a>}
            <a href="#contact" className="hover:text-cyan-400 transition-colors">Contact</a>
          </nav>

          {/* Actions: Portal Login & Apply CTA */}
          <div className="flex items-center space-x-3">
            {data.showPortalLoginCta && (
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all hover:border-slate-500 shadow-sm"
              >
                <LogIn size={16} className="text-cyan-400" />
                <span>Portal Login</span>
              </Link>
            )}

            {data.showAdmissionCta && (
              <Link
                href="/subscribe"
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <span>Apply Now</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO BANNER SLIDER */}
      <section className="relative h-[580px] sm:h-[640px] w-full overflow-hidden bg-slate-950 flex items-center">
        {banners.map((banner, index) => {
          const isActive = index === currentBannerIndex
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Image with Dark Gradient Overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-out transform scale-105"
                style={{ backgroundImage: `url(${banner.url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-900/40" />

              {/* Banner Text Content */}
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center max-w-3xl">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 w-max">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span>{data.schoolName} Academic Portal</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-md">
                  {banner.caption || data.heroHeadline}
                </h1>

                <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8 max-w-2xl drop-shadow">
                  {banner.subcaption || data.heroSubheadline}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={banner.ctaLink || '/subscribe'}
                    className="inline-flex items-center space-x-3 px-7 py-3.5 rounded-2xl text-base font-bold text-white shadow-xl hover:scale-105 transition-all"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <span>{banner.ctaText || 'Apply for Admission'}</span>
                    <ArrowRight size={18} />
                  </Link>

                  <a
                    href="#about"
                    className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl text-base font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all hover:border-slate-500"
                  >
                    <span>Learn More</span>
                  </a>
                </div>
              </div>
            </div>
          )
        })}

        {/* Carousel Slider Controls */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevBanner}
              className="absolute left-4 z-20 p-3 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-slate-700/60 backdrop-blur transition-all"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 z-20 p-3 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-slate-700/60 backdrop-blur transition-all"
              aria-label="Next Slide"
            >
              <ChevronRight size={22} />
            </button>

            {/* Slider Dots */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2.5">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBannerIndex(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentBannerIndex ? 'w-8 bg-cyan-400' : 'w-2.5 bg-slate-600 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 3. KEY HIGHLIGHT STATS */}
      <section className="relative -mt-10 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center space-x-4 border-r border-slate-800/80 pr-4 last:border-none">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Award size={28} />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">100%</div>
              <div className="text-xs text-slate-400 font-medium">Exam Distinction Rate</div>
            </div>
          </div>

          <div className="flex items-center space-x-4 border-r border-slate-800/80 pr-4 last:border-none">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Users size={28} />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">1:15</div>
              <div className="text-xs text-slate-400 font-medium">Teacher-Student Ratio</div>
            </div>
          </div>

          <div className="flex items-center space-x-4 border-r border-slate-800/80 pr-4 last:border-none">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <GraduationCap size={28} />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">STEM & ICT</div>
              <div className="text-xs text-slate-400 font-medium">Advanced Curriculum</div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">Safe Campus</div>
              <div className="text-xs text-slate-400 font-medium">CCTV & Smart Transit</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRINCIPAL'S WELCOME ADDRESS & ABOUT SECTION */}
      <section id="about" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Principal / Head of School Photo Card */}
          <div className="lg:col-span-5">
            <div className="relative group">
              <div
                className="absolute -inset-2 rounded-3xl opacity-30 blur-xl transition duration-500 group-hover:opacity-60"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              />
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                <img
                  src={
                    data.welcomePhoto ||
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={data.welcomeAuthor}
                  className="w-full h-96 object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="p-6 bg-slate-900/95 border-t border-slate-800">
                  <div className="text-lg font-bold text-white">{data.welcomeAuthor}</div>
                  <div className="text-sm font-medium text-cyan-400">Head of School / Administration</div>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Letter & Narrative */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Building2 size={14} />
              <span>About {data.schoolName}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-6">
              {data.welcomeTitle || 'Welcome to Our Academic Community'}
            </h2>

            <div className="prose prose-invert max-w-none text-slate-300 text-base leading-relaxed space-y-4 mb-8">
              <p>{data.welcomeMessage}</p>
              {data.aboutText && <p>{data.aboutText}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <CheckCircle2 size={20} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">Holistic Character Education</div>
                  <div className="text-xs text-slate-400 mt-0.5">Discipline, leadership ethics & personal accountability.</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <CheckCircle2 size={20} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">Digital Learning Ecosystem</div>
                  <div className="text-xs text-slate-400 mt-0.5">Smart classrooms, CBT assessments & parent portal tracking.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ACADEMIC PROGRAMS & TIERS */}
      <section id="academics" className="py-24 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
              <BookOpen size={14} />
              <span>Academic Excellence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
              Curriculum & Educational Programs
            </h2>
            <p className="text-slate-400 text-base">
              Carefully structured learning pathways designed to inspire intellectual curiosity from early years through senior secondary graduation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(data.academicPrograms || []).map((prog, idx) => (
              <div
                key={idx}
                className="group relative rounded-3xl p-7 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.02] shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-6 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                    <GraduationCap size={24} />
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                    {prog.ageGroup}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                    {prog.title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {prog.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                  <span>Explore Curriculum</span>
                  <ArrowRight size={14} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CAMPUS PHOTO GALLERY */}
      {data.showGallery && (
        <section id="gallery" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                <ImageIcon size={14} />
                <span>Campus Showcase</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Vibrant Campus Life & Facilities
              </h2>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {galleryCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveGalleryCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeGalleryCategory === cat
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((photo, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative h-72 rounded-3xl overflow-hidden border border-slate-800 cursor-pointer bg-slate-900 shadow-lg"
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                <div className="absolute bottom-4 left-4 right-4">
                  {photo.category && (
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                      {photo.category}
                    </span>
                  )}
                  <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {photo.caption}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lightbox Modal */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
              onClick={() => setSelectedPhoto(null)}
            >
              <div
                className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/80 text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
                <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="w-full max-h-[70vh] object-contain bg-slate-950" />
                <div className="p-5 text-base font-bold text-white bg-slate-900 border-t border-slate-800">
                  {selectedPhoto.caption}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 7. ANNOUNCEMENTS & NEWS NOTICEBOARD */}
      {data.showAnnouncements && (
        <section id="announcements" className="py-24 bg-slate-950/40 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Calendar size={14} />
                <span>Noticeboard & Updates</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                Latest News & Upcoming Events
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(data.announcements || []).map((news, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {news.badge || 'News'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{news.date}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{news.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">{news.excerpt}</p>
                  </div>

                  {news.link && (
                    <Link
                      href={news.link}
                      className="inline-flex items-center text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <span>Read More / Register</span>
                      <ArrowRight size={14} className="ml-1" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. ADMISSION APPLICATION CTA BANNER */}
      {data.showAdmissionCta && (
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="relative rounded-3xl p-10 sm:p-14 overflow-hidden border border-white/20 shadow-2xl text-center"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                  Join {data.schoolName} Today
                </h2>
                <p className="text-base sm:text-lg text-white/90 font-normal mb-8 leading-relaxed">
                  Admissions are open for our Nursery, Primary, and Secondary sections. Secure a bright future for your child with our holistic, technology-driven education.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/subscribe"
                    className="inline-flex items-center space-x-3 px-8 py-4 rounded-2xl text-base font-bold bg-white text-slate-950 hover:bg-slate-100 shadow-2xl transition-all hover:scale-105"
                  >
                    <span>Start Online Admission</span>
                    <ArrowRight size={18} />
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex items-center space-x-2 px-6 py-4 rounded-2xl text-base font-bold text-white bg-slate-950/40 hover:bg-slate-950/60 border border-white/30 backdrop-blur transition-all"
                  >
                    <LogIn size={18} />
                    <span>Parent / Student Login</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 9. CONTACT & FOOTER */}
      <footer id="contact" className="bg-slate-950 border-t border-slate-800 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* School Info */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center space-x-3">
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt={data.schoolName} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {data.branchCode || 'SCH'}
                  </div>
                )}
                <span className="text-lg font-black text-white">{data.schoolName}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                {data.tagline || 'Excellence in Knowledge & Character'}. A premier institution providing holistic education and leadership development.
              </p>

              {/* Social Media Links */}
              <div className="flex items-center space-x-3 pt-2">
                {data.socials?.facebook && (
                  <a href={data.socials.facebook} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors">
                    <Facebook size={16} />
                  </a>
                )}
                {data.socials?.instagram && (
                  <a href={data.socials.instagram} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors">
                    <Instagram size={16} />
                  </a>
                )}
                {data.socials?.youtube && (
                  <a href={data.socials.youtube} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors">
                    <Youtube size={16} />
                  </a>
                )}
                {data.socials?.twitter && (
                  <a href={data.socials.twitter} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors">
                    <Twitter size={16} />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-3">
              <div className="text-sm font-bold text-white uppercase tracking-wider">Quick Links</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white transition-colors">About Our School</a></li>
                <li><a href="#academics" className="hover:text-white transition-colors">Academic Programs</a></li>
                <li><a href="#gallery" className="hover:text-white transition-colors">Campus Photo Gallery</a></li>
                <li><Link href="/subscribe" className="hover:text-white transition-colors">Online Admission</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Student & Staff Portal</Link></li>
              </ul>
            </div>

            {/* Campus Contact Details */}
            <div className="md:col-span-4 space-y-3">
              <div className="text-sm font-bold text-white uppercase tracking-wider">Campus Contact</div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-start space-x-3">
                  <MapPin size={16} className="text-cyan-400 mt-1 flex-shrink-0" />
                  <span>{data.address}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone size={16} className="text-emerald-400 flex-shrink-0" />
                  <span>{data.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail size={16} className="text-blue-400 flex-shrink-0" />
                  <span>{data.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-900 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              &copy; {new Date().getFullYear()} {data.schoolName}. Powered by Ugbekun Educational Platform.
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="hover:text-slate-300">Staff Portal</Link>
              <span>•</span>
              <Link href="/subscribe" className="hover:text-slate-300">Admissions</Link>
              <span>•</span>
              <a href="#contact" className="hover:text-slate-300">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
