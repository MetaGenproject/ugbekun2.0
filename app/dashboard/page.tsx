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
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { TeacherDashboard } from '@/components/dashboards/teacher/teacher-dashboard'
import { ParentDashboard } from '@/components/dashboards/parent/parent-dashboard'
import { StudentDashboard } from '@/components/dashboards/student/student-dashboard'
import { DefaultDashboard } from '@/components/dashboards/default/default-dashboard'
import { clearAuthSession, getAuthSession, setAuthSession } from '@/lib/authSession'
import { safeStorage } from '@/lib/safeStorage'

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
}

const getNavLinks = (role: number, branchStats?: BranchStats | null): NavLink[] => {
  switch (role) {
    case 1: // Superadmin (Master) — single global admin
      return [
        { id: 'overview', label: 'SaaS Overview', icon: Activity, active: true },
        { id: 'manage-branches', label: 'Manage Branches', icon: School },
        { id: 'tenants', label: 'Tenants Directory', icon: Users },
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
        { id: 'revenue-analytics', label: 'Revenue Analytics', icon: TrendingUp },
        { id: 'school-cms', label: 'School Landing Pages (CMS)', icon: Globe },
        { id: 'logs', label: 'System Logs', icon: Layers },
        { id: 'settings', label: 'Global Settings', icon: Settings },
      ]
    case 2: // Branch Admin — exact structure matching reference image UI
      return [
        { id: 'overview', label: 'Dashboard', icon: LayoutGrid, hasSub: false },
        { id: 'classrooms', label: 'Campus & Students', icon: Building2, hasSub: true },
        { id: 'staff', label: 'Staff Directory', icon: UserCheck, hasSub: true },
        { id: 'departments', label: 'Departments', icon: Building2, hasSub: true },
        { id: 'parents', label: 'Parents & Guardians', icon: Users, hasSub: true },
        { id: 'curriculum', label: 'Academics', icon: GraduationCap, hasSub: true },
        { id: 'lesson-management', label: 'Lesson Management', icon: BookOpen, hasSub: true },
        { id: 'homework', label: 'Homework', icon: FileText, hasSub: true },
        { id: 'examinations-cbt', label: 'Examinations & CBT', icon: Award, hasSub: true },
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
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, active: true },
        { id: 'my-classes', label: 'My Classes', icon: Users },
        { id: 'my-subjects', label: 'My Subjects', icon: BookOpen },
        { id: 'ai-planner', label: 'Lesson Plan', icon: FileText },
        { id: 'assignments', label: 'Assignments', icon: CheckSquare },
        { id: 'cbt-exams', label: 'CBT / Tests', icon: Award },
        { id: 'gradebook', label: 'Scores Entry', icon: TrendingUp },
        { id: 'roster', label: 'My Students', icon: UserCheck },
        { id: 'attendance', label: 'Attendance', icon: Calendar },
        { id: 'class-reports', label: 'Class Reports', icon: FileSpreadsheet },
        { id: 'subject-reports', label: 'Subject Reports', icon: BarChart3 },
        { id: 'attrition', label: 'Performance Overview', icon: Activity },
        { id: 'communication', label: 'Messages', icon: MessageSquare, badge: '12' },
        { id: 'announcements', label: 'Announcements', icon: Bell },
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

const recoverAuthFromUrl = (): { token: string; user: User } | null => {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const authParam = params.get('auth')
  if (!authParam) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(authParam))
    if (parsed?.token && parsed?.user) {
      return { token: parsed.token, user: parsed.user }
    }
  } catch (e) {
    // ignore invalid fallback payload
  }

  return null
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
    const authSession = getAuthSession()

    if (authSession.token && authSession.user) {
      const normalizedUser: User = {
        id: authSession.user.id,
        username: authSession.user.username,
        role: authSession.user.role,
        roleName: authSession.user.roleName,
        legacyUserId: authSession.user.legacyUserId ?? null,
        lastLogin: authSession.user.lastLogin ?? undefined,
      }
      if (authSession.user.branch) {
        ;(normalizedUser as any).branch = authSession.user.branch
      }

      setUser(normalizedUser)
      setIsLoading(false)
      return
    }

    const fallbackAuth = recoverAuthFromUrl()
    if (fallbackAuth?.token && fallbackAuth?.user) {
      const normalizedUser: User = {
        id: fallbackAuth.user.id,
        username: fallbackAuth.user.username,
        role: fallbackAuth.user.role,
        roleName: fallbackAuth.user.roleName,
        legacyUserId: fallbackAuth.user.legacyUserId ?? null,
        lastLogin: fallbackAuth.user.lastLogin ?? undefined,
      }
      if ((fallbackAuth.user as any).branch) {
        ;(normalizedUser as any).branch = (fallbackAuth.user as any).branch
      }

      setAuthSession(fallbackAuth.token, fallbackAuth.user)
      setUser(normalizedUser)
      setIsLoading(false)
      return
    }

    const token = safeStorage.getItem('ugbekun_token')
    const userDataStr = safeStorage.getItem('ugbekun_user')

    if (token && userDataStr) {
      try {
        const parsedUser = JSON.parse(userDataStr)
        if (parsedUser && typeof parsedUser === 'object' && parsedUser.id && parsedUser.role) {
          setUser(parsedUser)
          setIsLoading(false)
          return
        }
      } catch (e) {
        // ignore invalid payload
      }
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function loadSchoolInfo() {
      try {
        if (user?.role === 2) {
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

    const handleSettingsUpdated = () => {
      loadSchoolInfo()
    }
    window.addEventListener('branch-settings-updated', handleSettingsUpdated)

    return () => {
      cancelled = true
      window.removeEventListener('branch-settings-updated', handleSettingsUpdated)
    }
  }, [user])

  const handleLogout = () => {
    clearAuthSession()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-4 font-sans">
        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold animate-pulse">Loading School Portal...</p>
      </div>
    )
  }

  if (!user) {
    // No session found — redirect to login
    if (typeof window !== 'undefined') {
      window.location.replace('/login')
    }
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Redirecting to login…</p>
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
        return (
          <AdminDashboard
            user={user}
            activeSection={activeSection}
            branchStats={branchStats}
            onNavigate={(section) => setSelectedSection(section)}
          />
        )
      case 3:
        return <TeacherDashboard user={user} activeSection={activeSection} onNavigate={(section) => setSelectedSection(section)} />
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
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Dynamic Dark Navy Sidebar Shell matching Reference Image */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0b1739] via-[#091436] to-[#040c21] flex flex-col justify-between p-4 text-white shadow-2xl
        transition-transform duration-300 ease-in-out transform select-none
        md:translate-x-0 md:static md:shadow-none md:flex md:shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Logo & School Motto Header */}
          <div className="flex items-center justify-between pt-1 px-2">
            <div className="flex items-center gap-3 min-w-0">
              {displayLogo ? (
                <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 shrink-0 overflow-hidden shadow-sm">
                  <img
                    src={displayLogo}
                    alt={displaySchoolName}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                /* Emblem Shield Logo matching Image */
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-700 via-rose-600 to-red-800 p-0.5 shadow-md shrink-0 flex items-center justify-center border border-rose-400/30">
                  <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-rose-900 to-[#0b1739] flex items-center justify-center relative overflow-hidden">
                    <span className="text-rose-400 font-extrabold text-xs tracking-tighter">🛡️</span>
                  </div>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-extrabold text-white text-xs tracking-wider uppercase leading-tight truncate" title={displaySchoolName}>
                  {displaySchoolName}
                </h2>
                <p className="text-[10px] text-slate-300/80 font-medium tracking-tight truncate mt-0.5" title={displayTagline}>
                  {displayTagline}
                </p>
              </div>
            </div>
            {/* Close Button for Mobile Drawer */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white md:hidden transition cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 px-1">
            {navLinks.map((link, idx) => {
              const IconComponent = link.icon
              const isActive = link.id === activeSection
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedSection(link.id)
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all relative group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white font-semibold shadow-md shadow-red-950/50'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComponent size={17} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {link.hasSub !== false && (
                    <ChevronRight size={14} className={`shrink-0 ${isActive ? 'text-white/80' : 'text-slate-400 opacity-60 group-hover:opacity-100'}`} />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section: OSe AI Assistant Glass Card & Powered By Footer */}
        <div className="space-y-3 pt-3 px-1 border-t border-white/10">
          {/* OSe AI Assistant Widget matching Image */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#132857]/90 via-[#0e1f46]/95 to-[#091533] border border-blue-400/20 p-3.5 shadow-xl text-center space-y-2 overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              {/* Cute 3D Robot Graphic */}
              <div className="w-12 h-12 mb-1 relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-500/30 flex items-center justify-center animate-bounce-subtle">
                  <div className="w-full h-full rounded-[14px] bg-slate-900/90 backdrop-blur-xs flex items-center justify-center border border-white/20">
                    <Bot size={22} className="text-cyan-300" />
                  </div>
                </div>
              </div>
              <h4 className="font-bold text-xs text-white tracking-tight flex items-center gap-1">
                Hi, I'm OSe 👋
              </h4>
              <span className="text-[10px] font-semibold text-blue-300/90 block mb-1">
                Your AI Assistant
              </span>
              <p className="text-[10px] text-slate-300/80 leading-relaxed font-normal mb-2 max-w-[180px]">
                I can help you get insights, answer questions and manage your school efficiently.
              </p>
              <button 
                onClick={() => setIsOseModalOpen(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-semibold py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5 shadow-sm transition transform hover:scale-[1.02] cursor-pointer"
              >
                <span>Chat with OSe</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Footer Powered By Metagen Project & Sidebar Logout */}
          <div className="space-y-2 px-2 pt-1">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs transition border border-rose-900/40 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-rose-600 text-white flex items-center justify-center text-[9px] font-extrabold">M</span>
                <span className="text-[10px] text-slate-400 font-medium">Powered by Metagen Project</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar matching Reference Image */}
        <header className="h-16 border-b border-slate-200/90 bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Hamburger toggle button for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition md:hidden cursor-pointer shrink-0"
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Search Input Bar with ⌘ K */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search students, staff, reports, fees... or ask OSe"
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

          {/* Top Right Header Action Badges & User Avatar Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell Badge */}
            <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 relative transition cursor-pointer" title="Notifications">
              <Bell size={19} />
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                12
              </span>
            </button>

            {/* Messages Mail Badge */}
            <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 relative transition cursor-pointer" title="Messages">
              <Mail size={19} />
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                8
              </span>
            </button>

            {/* Calendar Icon */}
            <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer" title="Calendar">
              <Calendar size={19} />
            </button>

            <div className="w-px h-7 bg-slate-200 mx-0.5 sm:mx-1" />

            {/* User Profile Container */}
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 bg-blue-100 shrink-0 shadow-xs">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=2563eb&color=ffffff&bold=true`} 
                  alt={user?.username || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block text-left">
                <h4 className="text-xs font-bold text-slate-800 leading-tight">{user?.username || 'User'}</h4>
                <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">{user?.roleName || 'Portal User'}</p>
              </div>
            </div>

            {/* Prominent Header Logout Button */}
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200/80 transition cursor-pointer shadow-2xs shrink-0" 
              title="Sign Out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Section Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {renderDashboardContent()}
        </div>
      </main>

      {/* Global Unified OSe AI Assistant */}
      <OSeAiAssistant isOpen={isOseModalOpen} onClose={() => setIsOseModalOpen(false)} />
    </div>
  )
}

