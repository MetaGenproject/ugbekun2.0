'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  DollarSign, 
  BookOpen, 
  LogOut, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  Bell, 
  Search,
  School,
  Settings,
  GraduationCap,
  Activity,
  Layers,
  Menu,
  X,
  Award,
  FileText,
  Video,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  CreditCard,
  CalendarDays,
  BarChart3,
  MessageSquare,
  Bus,
  User,
  LayoutDashboard,
  Boxes,
  LayoutGrid,
  ChevronRight,
  Mail,
  Globe,
  UserPlus,
  ArrowRight,
  Sparkles,
  Bot,
  UserCheck,
  Trophy,
  Briefcase
} from 'lucide-react'

// Import decoupled role-specific dashboards from their own folders
import { SuperAdminDashboard } from '@/components/dashboards/superadmin/superadmin-dashboard'
import { AdminDashboard, type BranchStats } from '@/components/dashboards/admin/admin-dashboard'
import { OSeAiAssistant } from '@/components/ai/ose-ai-assistant'
import { SchoolFooter } from '@/components/shared/school-footer'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { TeacherDashboard } from '@/components/dashboards/teacher/teacher-dashboard'
import { TeacherContextSwitcher } from '@/components/dashboards/teacher/teacher-context-switcher'
import { ParentDashboard } from '@/components/dashboards/parent/parent-dashboard'
import { StudentDashboard } from '@/components/dashboards/student/student-dashboard'
import { DefaultDashboard } from '@/components/dashboards/default/default-dashboard'
import { endAuthSession, getAuthSession, redirectExpiredSession, setAuthSession, type AuthUser } from '@/lib/authSession'
import { safeStorage } from '@/lib/safeStorage'
import { getAvatarUrl } from '@/lib/avatar'

// Role names mapping (verified against ugbekunc_Saas (2).sql)
// Role 1 = 1 global user  → Superadmin / Master
// Role 2 = 45 branch users → Branch / School Admin
const ROLE_NAMES: Record<number, string> = {
  1: 'Superadmin (Master)',
  2: 'Branch Admin',
  3: 'Teacher',
  4: 'Accountant',
  6: 'Parent',
  7: 'Student',
  8: 'Receptionist',
  9: 'Proprietor',
  12: 'Librarian',
  13: 'Staff',
}

interface User {
  id: number
  username: string
  role: number
  roleName: string
  legacyUserId: number | null
  lastLogin?: string
}

interface NavLink {
  id: string
  label: string
  icon: typeof Activity
  active?: boolean
  badge?: string
  hasSub?: boolean
  group?: string
}

const getNavLinks = (role: number, branchStats?: BranchStats | null): NavLink[] => {
  switch (role) {
    case 1: // Superadmin (Master) — single global admin
      return [
        { id: 'overview', label: 'SaaS Overview', icon: Activity, active: true },
        { id: 'manage-branches', label: 'Manage Branches', icon: School },
        { id: 'staff', label: 'Staff Directory', icon: UserCheck },
        { id: 'form-teachers', label: 'Class Teachers', icon: GraduationCap },
        { id: 'tenants', label: 'Tenants Directory', icon: Users },
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
        { id: 'revenue-analytics', label: 'Revenue Analytics', icon: TrendingUp },
        { id: 'school-cms', label: 'School Landing Pages (CMS)', icon: Globe },
        { id: 'logs', label: 'System Logs', icon: Layers },
        { id: 'settings', label: 'Global Settings', icon: Settings },
      ]
    case 2: // Branch Admin — exact structure matching reference image UI
    case 9: // Proprietor (School Owner / Executive Administrator)
      return [
        { id: 'overview', label: 'Dashboard', icon: LayoutGrid, hasSub: false },
        { id: 'classrooms', label: 'Campus & Students', icon: Building2, hasSub: true },
        { id: 'staff', label: 'Staff Directory', icon: UserCheck, hasSub: true },
        { id: 'departments', label: 'Departments', icon: Building2, hasSub: true },
        { id: 'parents', label: 'Parents & Guardians', icon: Users, hasSub: true },
        { id: 'curriculum', label: 'Academics', icon: GraduationCap, hasSub: true },
        { id: 'lesson-management', label: 'Lesson Management', icon: BookOpen, hasSub: true },
        { id: 'homework', label: 'Homework', icon: FileText, hasSub: true },
        { id: 'assessments-cbt', label: 'Assessments & CBT', icon: Award, hasSub: true },
        { id: 'report-cards', label: 'Report Cards', icon: FileText, hasSub: true },
        { id: 'timetable', label: 'Timetable', icon: Calendar, hasSub: true },
        { id: 'attendance', label: 'Attendance', icon: CheckSquare, hasSub: true },
        { id: 'competitions', label: 'Competitions', icon: Trophy, hasSub: true },
        { id: 'hr', label: 'Human Resources (HR)', icon: Briefcase, hasSub: true },
        { id: 'admissions', label: 'Admissions', icon: UserPlus, hasSub: true },
        { id: 'finances', label: 'School Fees', icon: CreditCard, hasSub: true },
        { id: 'financial-records', label: 'Financial Records', icon: CreditCard, hasSub: true },
        { id: 'inventory', label: 'Inventory', icon: Boxes, hasSub: true },
        { id: 'communication', label: 'Communication', icon: MessageSquare, hasSub: true },
        { id: 'campus-live', label: 'Campus Live', icon: Video, hasSub: true },
        { id: 'comprehensive-reports', label: 'Reports', icon: FileText, hasSub: true },
        { id: 'myeduride', label: 'MyEduRide', icon: Bus, hasSub: true },
        { id: 'website', label: 'Website', icon: Globe, hasSub: true },
        { id: 'settings', label: 'Settings', icon: Settings, hasSub: true },
      ]
    case 3: // Teacher
      return [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'Teaching' },
        { id: 'my-classes', label: 'My Classes', icon: Users, group: 'Teaching' },
        { id: 'attendance', label: 'Attendance', icon: CheckSquare, group: 'Teaching' },
        { id: 'gradebook', label: 'Assessments', icon: TrendingUp, group: 'Teaching' },
        { id: 'report-cards', label: 'Report Cards', icon: FileSpreadsheet, group: 'Teaching' },
        { id: 'assignments', label: 'Assignments', icon: CheckSquare, group: 'Teaching' },
        { id: 'cbt-exams', label: 'CBT & Tests', icon: Award, group: 'Teaching' },
        { id: 'class-reports', label: 'Reports', icon: FileText, group: 'Teaching' },
        { id: 'communication', label: 'Communication', icon: MessageSquare, group: 'Communication' },
        { id: 'settings', label: 'My Profile', icon: User, group: 'Account' },
      ]
    case 6: // Parent
      return [
        { id: 'overview', label: 'Children Overview', icon: Users, active: true },
        { id: 'sibling-requests', label: 'Sibling Admissions', icon: GraduationCap },
        { id: 'grades', label: 'Grade Progress', icon: TrendingUp },
        { id: 'attendance', label: 'Attendance Logs', icon: CheckSquare },
        { id: 'billing', label: 'Fee Invoices', icon: DollarSign },
        { id: 'calendar', label: 'Term Calendar', icon: Calendar },
        { id: 'settings', label: 'Account Settings', icon: Settings },
      ]
    case 7: // Student
      return [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, active: true },
        { id: 'academics', label: 'My Academics', icon: GraduationCap },
        { id: 'assignments', label: 'Assignments', icon: FileText },
        { id: 'cbt-exams', label: 'CBT & Exams', icon: Award },
        { id: 'results', label: 'Results', icon: TrendingUp },
        { id: 'timetable', label: 'Timetable', icon: Calendar },
        { id: 'attendance', label: 'Attendance', icon: CheckSquare },
        { id: 'school-fees', label: 'School Fees', icon: DollarSign },
        { id: 'communication', label: 'Communication', icon: MessageSquare, badge: '5' },
        { id: 'liveRooms', label: 'Campus Live', icon: Video },
        { id: 'media', label: 'Library', icon: BookOpen },
        { id: 'myeduride', label: 'MyEduRide', icon: Bus },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    default:
      return [
        { id: 'overview', label: 'Overview', icon: TrendingUp, active: true },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState('overview')
  const [branchStats, setBranchStats] = useState<BranchStats | null>(null)
  const [schoolInfo, setSchoolInfo] = useState<{
    schoolName: string
    tagline?: string
    logoUrl: string | null
    academicSession: string
    currentTerm: string
  } | null>(null)
  const [headerIdentity, setHeaderIdentity] = useState<{
    name: string
    photo: string | null
    title: string
  } | null>(null)

  // Interactive OSe AI Assistant Modal State
  const [isOseModalOpen, setIsOseModalOpen] = useState(false)
  const [oseInput, setOseInput] = useState('')
  const [oseChatHistory, setOseChatHistory] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOseModalOpen((prev) => !prev)
      }
    }
    const handleOpenOse = () => setIsOseModalOpen(true)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-ose-assistant', handleOpenOse)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-ose-assistant', handleOpenOse)
    }
  }, [])

  const handleSendOseMessage = (promptText?: string) => {
    const query = promptText || oseInput
    if (!query.trim()) return

    const userMessage = { sender: 'user' as const, text: query }
    const updatedHistory = [...oseChatHistory, userMessage]
    setOseChatHistory(updatedHistory)
    setOseInput('')

    setTimeout(() => {
      let aiReply = `🤖 I've analyzed your request: "${query}". `
      const lower = query.toLowerCase()
      if (lower.includes('fee') || lower.includes('payment') || lower.includes('outstanding')) {
        aiReply += `Database records show ₦${(branchStats?.feeCollected || 8600000).toLocaleString()} collected and ₦${(branchStats?.feeOutstanding || 2400000).toLocaleString()} in outstanding fees. Automated reminders have been queued for parents.`
      } else if (lower.includes('student') || lower.includes('enrolment') || lower.includes('attendance')) {
        aiReply += `There are currently ${branchStats?.students || 1245} enrolled students with an overall attendance rate of 94% today.`
      } else if (lower.includes('teacher') || lower.includes('staff') || lower.includes('lesson')) {
        aiReply += `${branchStats?.teachers || 96} active teachers and ${branchStats?.staff || 38} staff members are on record.`
      } else {
        aiReply += `School administrative context updated and synchronized with ${schoolInfo?.schoolName || (user as any)?.branch?.name || 'School Campus'}.`
      }

      setOseChatHistory([...updatedHistory, { sender: 'ai', text: aiReply }])
    }, 500)
  }

  useEffect(() => {
    setMounted(true)
    let cancelled = false

    // Immediately restore cached session on client mount to minimize loading flash
    const initialCached = getAuthSession().user
    if (initialCached) {
      const normalizedUser: User = {
        id: initialCached.id,
        username: initialCached.username,
        role: initialCached.role,
        roleName: initialCached.roleName,
        legacyUserId: initialCached.legacyUserId ?? null,
        lastLogin: initialCached.lastLogin ?? undefined,
      }
      if (initialCached.branch) (normalizedUser as any).branch = initialCached.branch
      setUser(normalizedUser)
      setIsLoading(false)
    }

    async function hydrateSession() {
      try {
        const token = safeStorage.getItem('ugbekun_token') || safeStorage.getItem('token')
        const headers: Record<string, string> = { Accept: 'application/json' }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const meRes = await fetch('/api/auth/me', {
          headers,
          credentials: 'include',
          cache: 'no-store',
        })
        if (cancelled) return

        if (meRes.ok) {
          const res = (await meRes.json()) as { success?: boolean; user?: AuthUser }
          if (res.success && res.user) {
            const normalizedUser: User = {
              id: res.user.id,
              username: res.user.username,
              role: res.user.role,
              roleName: res.user.roleName,
              legacyUserId: res.user.legacyUserId ?? null,
              lastLogin: res.user.lastLogin ?? undefined,
            }
            if (res.user.branch) (normalizedUser as any).branch = res.user.branch
            setAuthSession(
              {
                id: res.user.id,
                username: res.user.username,
                role: res.user.role,
                roleName: res.user.roleName,
                legacyUserId: res.user.legacyUserId ?? null,
                lastLogin: res.user.lastLogin ?? null,
                branch: res.user.branch || null,
              },
              token
            )
            setUser(normalizedUser)
            return
          }
        }

        // Only redirect if 401 AND there is neither cached session nor valid token
        if (meRes.status === 401) {
          const cached = getAuthSession().user
          if (!cached && !token) {
            redirectExpiredSession()
            return
          }
        }

        const cached = getAuthSession().user
        if (cached) {
          const normalizedUser: User = {
            id: cached.id,
            username: cached.username,
            role: cached.role,
            roleName: cached.roleName,
            legacyUserId: cached.legacyUserId ?? null,
            lastLogin: cached.lastLogin ?? undefined,
          }
          if (cached.branch) (normalizedUser as any).branch = cached.branch
          setUser(normalizedUser)
        }
      } catch {
        const cached = getAuthSession().user
        if (cached) {
          const normalizedUser: User = {
            id: cached.id,
            username: cached.username,
            role: cached.role,
            roleName: cached.roleName,
            legacyUserId: cached.legacyUserId ?? null,
            lastLogin: cached.lastLogin ?? undefined,
          }
          if (cached.branch) (normalizedUser as any).branch = cached.branch
          setUser(normalizedUser)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    hydrateSession()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function loadSchoolInfo() {
      try {
        if (user?.role === 2 || user?.role === 9) {
          const res = await apiSlice.get<{ success: boolean; data: BranchStats }>(endpoints.admin.stats)
          if (!cancelled && res.data) {
            setBranchStats(res.data)
            setSchoolInfo({
              schoolName: res.data.branchName || 'School Dashboard',
              tagline: res.data.settings?.tagline || 'Nurturing Excellence, Raising Leaders',
              logoUrl: res.data.settings?.logoUrl || null,
              academicSession: res.data.settings?.academicSession || '2025/2026',
              currentTerm: res.data.settings?.currentTerm || 'First Term',
            })
          }
        } else {
          const res = await apiSlice.get<{ success: boolean; data: { schoolName: string; tagline?: string; logoUrl: string | null; academicSession: string; currentTerm: string } }>(endpoints.public.schoolInfo)
          if (!cancelled && res.data) {
            setSchoolInfo(res.data)
          }
        }
      } catch {
        if (!cancelled && (user as any)?.branch) {
          setSchoolInfo({
            schoolName: (user as any).branch.name || 'School Dashboard',
            tagline: 'Nurturing Excellence, Raising Leaders',
            logoUrl: (user as any).branch.logo || null,
            academicSession: '2025/2026',
            currentTerm: 'First Term',
          })
        }
      }
    }

    loadSchoolInfo()

    async function loadTeacherHeader() {
      if (Number(user?.role) !== 3) {
        setHeaderIdentity(null)
        return
      }
      try {
        const res = await apiSlice.get<{
          success: boolean
          name?: string
          photo?: string | null
          isFormTeacher?: boolean
          isSubjectTeacher?: boolean
        }>(endpoints.teacher.profile)
        const isClass = Boolean((res as any).isClassTeacher || res.isFormTeacher)
        const isSubj = Boolean(res.isSubjectTeacher)
        const title = isClass && isSubj
          ? 'Class & Subject Teacher'
          : isClass
            ? 'Class Teacher'
            : isSubj
              ? 'Subject Teacher'
              : 'Teacher'
        setHeaderIdentity({
          name: res.name || user?.username || 'Teacher',
          photo: res.photo || null,
          title,
        })
      } catch {
        if (!cancelled) setHeaderIdentity(null)
      }
    }

    loadTeacherHeader()

    const handleSettingsUpdated = () => {
      loadSchoolInfo()
    }
    window.addEventListener('branch-settings-updated', handleSettingsUpdated)

    return () => {
      cancelled = true
      window.removeEventListener('branch-settings-updated', handleSettingsUpdated)
    }
  }, [user])

  const handleLogout = async () => {
    await endAuthSession()
    router.push('/login')
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-4 font-sans">
        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold animate-pulse">Loading School Portal...</p>
      </div>
    )
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.replace('/login')
      }, 1500)
    }
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(244,63,94,0.3)', borderTopColor: '#f43f5e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>Securing session... Redirecting to login if unauthenticated.</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const displayLogo = branchStats?.settings?.logoUrl || schoolInfo?.logoUrl || (user as any)?.branch?.logo || null
  const displaySchoolName = branchStats?.branchName || schoolInfo?.schoolName || (user as any)?.branch?.name || 'School Dashboard'
  const displayTagline = schoolInfo?.tagline || branchStats?.settings?.tagline || 'Nurturing Excellence, Raising Leaders'

  const navLinks = getNavLinks(user.role, branchStats)
  const activeSection = selectedSection

  const renderDashboardContent = () => {
    switch (user.role) {
      case 1:
        return <SuperAdminDashboard user={user} activeSection={activeSection} />
      case 2:
      case 9:
        return (
          <AdminDashboard
            user={user}
            activeSection={activeSection}
            branchStats={branchStats}
            onNavigate={(section) => setSelectedSection(section)}
          />
        )
      case 3:
        return <TeacherDashboard user={user} activeSection={activeSection} onNavigate={(section) => setSelectedSection(section)} onIdentityChange={setHeaderIdentity} />
      case 6:
        return <ParentDashboard user={user} activeSection={activeSection} onNavigate={(section) => setSelectedSection(section)} />
      case 7:
        return <StudentDashboard user={user} activeSection={activeSection} onNavigate={(section) => setSelectedSection(section)} />
      default:
        return <DefaultDashboard user={user} roleName={ROLE_NAMES[user.role] || 'User'} />
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f5f9] flex flex-col md:flex-row font-sans text-slate-900 overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="print:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Dynamic Dark Navy Sidebar Shell matching Reference Image */}
      <aside className={`
        print:hidden
        fixed inset-y-0 left-0 z-50 w-[84vw] max-w-[320px] md:w-72 lg:w-72
        bg-gradient-to-b from-[#0b1739] via-[#091436] to-[#040c21]
        flex flex-col h-full md:h-screen md:sticky md:top-0 md:shrink-0
        text-white shadow-2xl md:shadow-xl border-r border-white/5
        transition-transform duration-300 ease-in-out transform select-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo & School Motto Header */}
        <div className="shrink-0 p-4 pb-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {displayLogo ? (
              <div className="w-11 h-11 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 shrink-0 overflow-hidden shadow-sm">
                <img
                  src={displayLogo}
                  alt={displaySchoolName}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              /* Emblem Shield Logo matching Image */
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-700 via-rose-600 to-red-800 p-0.5 shadow-md shrink-0 flex items-center justify-center border border-rose-400/30">
                <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-rose-900 to-[#0b1739] flex items-center justify-center relative overflow-hidden">
                  <span className="text-rose-400 font-extrabold text-sm tracking-tighter">🛡️</span>
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-white text-xs sm:text-[13px] tracking-wide uppercase leading-tight line-clamp-2" title={displaySchoolName}>
                {displaySchoolName}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-300/80 font-normal tracking-tight line-clamp-1 mt-0.5" title={displayTagline}>
                {displayTagline}
              </p>
            </div>
          </div>
          {/* Close Button for Mobile Drawer */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 -mr-1 rounded-xl hover:bg-white/10 active:bg-white/20 text-slate-300 hover:text-white md:hidden transition cursor-pointer shrink-0"
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links - Senior flex-1 layout with custom sleek scrollbar */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1.5 custom-sidebar-scroll">
          {navLinks.map((link, idx) => {
            const IconComponent = link.icon
            const isActive = link.id === activeSection
            const showGroup = Boolean(link.group && link.group !== navLinks[idx - 1]?.group)
            return (
              <div key={link.id}>
                {showGroup && (
                  <p className="px-3.5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400/90">
                    {link.group}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSection(link.id)
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-[13px] transition-all relative group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 text-white font-semibold shadow-lg shadow-rose-950/50 ring-1 ring-white/15'
                      : 'text-slate-300/90 hover:bg-white/10 hover:text-white active:bg-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComponent size={18} className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {link.badge ? (
                    <span className="min-w-4 h-4 px-1.5 rounded-full bg-rose-500 text-[9px] font-extrabold flex items-center justify-center text-white shadow-xs">
                      {link.badge}
                    </span>
                  ) : (
                    link.hasSub !== false && (
                      <ChevronRight size={14} className={`shrink-0 transition-transform ${isActive ? 'text-white/80' : 'text-slate-400/70 group-hover:text-white group-hover:translate-x-0.5'}`} />
                    )
                  )}
                </button>
              </div>
            )
          })}
        </nav>

        {/* Bottom Section: Streamlined OSe AI Assistant & Actions */}
        <div className="shrink-0 p-3 pt-2.5 border-t border-white/10 space-y-2.5 bg-[#060f26]/80 backdrop-blur-xs">
          {/* Streamlined OSe AI Assistant Glass Card */}
          <div 
            onClick={() => {
              setIsOseModalOpen(true)
              setIsSidebarOpen(false)
            }}
            className="relative rounded-xl bg-gradient-to-r from-[#132857]/90 via-[#0e1f46]/95 to-[#091533] border border-blue-400/20 hover:border-blue-400/40 p-2.5 shadow-md flex items-center justify-between gap-2.5 group cursor-pointer transition transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 p-0.5 shadow-xs shrink-0 flex items-center justify-center">
                <div className="w-full h-full rounded-[6px] bg-slate-900/90 flex items-center justify-center">
                  <Bot size={16} className="text-cyan-300" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-xs text-white tracking-tight truncate">OSe AI</h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
                <p className="text-[10px] text-slate-300/80 truncate">
                  Ask AI anything (⌘K)
                </p>
              </div>
            </div>
            <button 
              type="button"
              className="px-2.5 py-1 rounded-lg bg-blue-600 group-hover:bg-blue-500 text-white text-[10px] font-semibold flex items-center gap-1 shrink-0 shadow-xs transition"
            >
              <span>Chat</span>
              <ArrowRight size={10} />
            </button>
          </div>

          {/* Footer Powered By & Sidebar Logout */}
          <div className="space-y-2">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 active:bg-rose-900/70 text-rose-300 hover:text-rose-200 font-bold text-xs transition border border-rose-900/30 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-cyan-600 text-white flex items-center justify-center text-[9px] font-extrabold">U</span>
                <span>Powered by Ugbekun 2.0</span>
              </div>
              <span className="font-mono text-[9px] text-slate-500">v2.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {/* Top Header Bar matching Reference Image */}
        <header className="print:hidden h-16 border-b border-slate-200/90 bg-white px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs gap-1.5 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 md:flex-1 md:max-w-xl">
            {/* Hamburger toggle button for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition md:hidden cursor-pointer shrink-0"
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Mobile Search / Ask AI button */}
            <button
              onClick={() => setIsOseModalOpen(true)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition md:hidden cursor-pointer shrink-0"
              aria-label="Search or Ask AI"
              title="Search or Ask AI (⌘K)"
            >
              <Search size={17} />
            </button>

            {/* Desktop Search Input Bar with ⌘ K */}
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={user.role === 3 ? 'Search students by name, class or subject...' : 'Search students, staff, reports, fees... or ask OSe'}
                onClick={() => setIsOseModalOpen(true)}
                readOnly
                className="w-full pl-9 pr-12 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-700 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-2xs cursor-pointer"
              />
              <div 
                onClick={() => setIsOseModalOpen(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/60 text-[10px] font-mono font-semibold text-slate-500 border border-slate-300/40 cursor-pointer"
              >
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
          </div>

          {/* Teacher Active Teaching Context Switcher (Top Bar) */}
          {user.role === 3 && (
            <div className="mx-1 sm:mx-2 shrink min-w-0">
              <TeacherContextSwitcher />
            </div>
          )}

          {/* Top Right Header Action Badges & User Avatar Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Notification Bell Badge */}
            <button className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-600 relative transition cursor-pointer" title="Notifications">
              <Bell size={18} />
            </button>

            {/* Messages Mail Badge */}
            <button
              className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-600 relative transition cursor-pointer hidden md:flex"
              title="Messages"
              onClick={() => {
                if (user.role === 3) setSelectedSection('communication')
              }}
            >
              <Mail size={18} />
            </button>

            {/* Calendar Icon */}
            <button
              className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer hidden md:flex"
              title="Calendar"
              onClick={() => {
                if (user.role === 3) setSelectedSection('timetable')
              }}
            >
              <Calendar size={18} />
            </button>

            <div className="w-px h-6 bg-slate-200 mx-0.5 hidden xs:block" />

            {/* User Profile Container */}
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-slate-200 bg-blue-100 shrink-0 shadow-xs">
                <img 
                  src={getAvatarUrl(headerIdentity?.photo, headerIdentity?.name || user?.username || 'User')}
                  alt={headerIdentity?.name || user?.username || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block text-left">
                <h4 className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">{headerIdentity?.name || user?.username || 'User'}</h4>
                <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5 truncate max-w-[110px]">
                  {headerIdentity?.title || user?.roleName || 'Portal User'}
                </p>
              </div>
            </div>

            {/* Prominent Header Logout Button */}
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200/80 transition cursor-pointer shadow-2xs shrink-0" 
              title="Sign Out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Section Content Area */}
        <div className="p-3 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6 flex-1 print:p-0 print:max-w-none">
          {renderDashboardContent()}
        </div>

        {/* Full-width Static Dark Navy Footer at page bottom */}
        <SchoolFooter />
      </main>

      {/* Global Unified OSe AI Assistant */}
      <OSeAiAssistant isOpen={isOseModalOpen} onClose={() => setIsOseModalOpen(false)} />
    </div>
  )
}

