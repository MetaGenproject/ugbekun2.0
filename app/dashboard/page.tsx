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
  X
} from 'lucide-react'

// Import decoupled role-specific dashboards from their own folders
import { SuperAdminDashboard } from '@/components/dashboards/superadmin/superadmin-dashboard'
import { AdminDashboard } from '@/components/dashboards/admin/admin-dashboard'
import { TeacherDashboard } from '@/components/dashboards/teacher/teacher-dashboard'
import { ParentDashboard } from '@/components/dashboards/parent/parent-dashboard'
import { StudentDashboard } from '@/components/dashboards/student/student-dashboard'
import { DefaultDashboard } from '@/components/dashboards/default/default-dashboard'

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

const getNavLinks = (role: number) => {
  switch (role) {
    case 1: // Superadmin (Master) — single global admin
      return [
        { label: 'SaaS Overview', icon: Activity, active: true },
        { label: 'Manage Branches', icon: School },
        { label: 'Tenants Directory', icon: Users },
        { label: 'Subscriptions', icon: DollarSign },
        { label: 'System Logs', icon: Layers },
        { label: 'Global Settings', icon: Settings },
      ]
    case 2: // Branch Admin — one per school branch
      return [
        { label: 'Admin Overview', icon: TrendingUp, active: true },
        { label: 'Students & Parents', icon: Users },
        { label: 'Teachers & Staff', icon: GraduationCap },
        { label: 'Admissions Desk', icon: CheckSquare },
        { label: 'Fees & Finances', icon: DollarSign },
        { label: 'Curriculum Planner', icon: BookOpen },
        { label: 'Branch Settings', icon: Settings },
      ]
    case 3: // Teacher
      return [
        { label: 'My Classroom', icon: BookOpen, active: true },
        { label: 'Student Roster', icon: Users },
        { label: 'Gradebook & Exams', icon: TrendingUp },
        { label: 'Attendance Tracker', icon: CheckSquare },
        { label: 'School Calendar', icon: Calendar },
        { label: 'Personal Settings', icon: Settings },
      ]
    case 6: // Parent
      return [
        { label: 'Children Overview', icon: Users, active: true },
        { label: 'Grade Progress', icon: TrendingUp },
        { label: 'Attendance Logs', icon: CheckSquare },
        { label: 'Fee Invoices', icon: DollarSign },
        { label: 'Term Calendar', icon: Calendar },
        { label: 'Account Settings', icon: Settings },
      ]
    case 7: // Student
      return [
        { label: 'My Studies', icon: BookOpen, active: true },
        { label: 'Assignments Tracker', icon: CheckSquare },
        { label: 'Grade Sheet & GPA', icon: TrendingUp },
        { label: 'Timetable Schedule', icon: Calendar },
        { label: 'Platform Settings', icon: Settings },
      ]
    default:
      return [
        { label: 'Overview', icon: TrendingUp, active: true },
        { label: 'Settings', icon: Settings },
      ]
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    // Check authentication token and user context
    const token = localStorage.getItem('ugbekun_token')
    const userDataStr = localStorage.getItem('ugbekun_user')

    if (!token || !userDataStr) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userDataStr)
      setUser(parsedUser)
    } catch (e) {
      localStorage.removeItem('ugbekun_token')
      localStorage.removeItem('ugbekun_user')
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('ugbekun_token')
    localStorage.removeItem('ugbekun_user')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading dashboard portal...</p>
      </div>
    )
  }

  if (!user) return null

  // Switch content panel based on active logged-in user role
  // Role 1 = Superadmin (Master) | Role 2 = Branch Admin | Role 3 = Teacher
  // Role 6 = Parent | Role 7 = Student
  const renderDashboardContent = () => {
    switch (user.role) {
      case 1: // Superadmin (Master)
        return <SuperAdminDashboard user={user} />
      case 2: // Branch Admin
        return <AdminDashboard user={user} />
      case 3: // Teacher
        return <TeacherDashboard user={user} />
      case 6: // Parent
        return <ParentDashboard user={user} />
      case 7: // Student
        return <StudentDashboard user={user} />
      default:
        return <DefaultDashboard user={user} roleName={ROLE_NAMES[user.role] || 'User'} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Semi-transparent backdrop for mobile sidebar drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Dynamic Sidebar Shell */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between p-6 shadow-xl 
        transition-transform duration-300 ease-in-out transform
        md:translate-x-0 md:static md:shadow-sm md:flex md:shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                <School size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-lg tracking-tight block">Ugbekun 2.0</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SaaS SMP Portal</p>
              </div>
            </div>
            {/* Close Button on Mobile Drawer */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 md:hidden transition cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {getNavLinks(user.role).map((link, idx) => {
              const IconComponent = link.icon
              return (
                <a
                  key={idx}
                  href="#"
                  onClick={() => setIsSidebarOpen(false)} // Close sidebar drawer when clicking a link on mobile
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                    link.active
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <IconComponent size={18} className="shrink-0" />
                  {link.label}
                </a>
              )
            })}
          </nav>
        </div>

        {/* Profile Card & Session End Controls */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm uppercase">
              {user.username.substring(0, 2)}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm text-slate-900 truncate">{user.username}</h4>
              <p className="text-xs text-slate-400 truncate font-semibold">{ROLE_NAMES[user.role] || 'User'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm transition border border-rose-100 cursor-pointer"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Dynamic Header */}
        <header className="h-16 border-b border-slate-200/80 bg-white/80 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-40 flex">
          <div className="flex items-center gap-2 w-full max-w-xs sm:w-96">
            {/* Hamburger menu button for mobile view */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition mr-1 md:hidden cursor-pointer shrink-0 animate-fade-in"
              aria-label="Toggle Sidebar"
            >
              <Menu size={22} className="stroke-[2.5]" />
            </button>

            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search school databases, resources..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative transition">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
            </button>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-800 hidden sm:block">{user.username}</span>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs uppercase shadow-sm">
                {user.username.substring(0, 2)}
              </div>
            </div>
            <button onClick={handleLogout} className="md:hidden p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Decoupled Dashboard Content Rendering */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderDashboardContent()}
        </div>
      </main>
    </div>
  )
}
