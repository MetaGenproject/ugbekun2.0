'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Circle,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import type { BranchStats } from './admin-dashboard'

interface OnboardingSetupChecklistProps {
  stats?: BranchStats | null
  onNavigateTab?: (tabKey: string) => void
}

interface ChecklistStep {
  id: string
  title: string
  description: string
  icon: any
  tabKey: string
  isCompleted: boolean
}

export function OnboardingSetupChecklist({ stats, onNavigateTab }: OnboardingSetupChecklistProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Step Completion State
  const [hasProfile, setHasProfile] = useState(false)
  const [hasClasses, setHasClasses] = useState(false)
  const [hasTeachers, setHasTeachers] = useState(false)
  const [hasStudents, setHasStudents] = useState(false)
  const [hasFees, setHasFees] = useState(false)

  useEffect(() => {
    async function inspectOnboardingState() {
      try {
        if (stats?.settings?.schoolName) {
          setHasProfile(true)
        }

        if (stats?.teachers && stats.teachers > 0) setHasTeachers(true)
        if (stats?.students && stats.students > 0) setHasStudents(true)
        if (stats?.classes && stats.classes > 0) setHasClasses(true)
        if (stats?.feeExpected && stats.feeExpected > 0) setHasFees(true)

        // Query API to double-check real database status
        const [clsRes, tchRes, stuRes] = await Promise.all([
          apiSlice.get<{ success: boolean; classes?: any[]; data?: any }>(endpoints.admin.classesSections).catch(() => null),
          apiSlice.get<{ success: boolean; data?: { teachers?: any[] } }>(endpoints.admin.teachersStaff).catch(() => null),
          apiSlice.get<{ success: boolean; data?: { students?: any[] } }>(endpoints.admin.studentsParents).catch(() => null),
        ])

        if (clsRes?.classes && clsRes.classes.length > 0) setHasClasses(true)
        if (tchRes?.data?.teachers && tchRes.data.teachers.length > 0) setHasTeachers(true)
        if (stuRes?.data?.students && stuRes.data.students.length > 0) setHasStudents(true)
      } catch (err) {
        console.error('Error inspecting setup checklist state:', err)
      }
    }
    inspectOnboardingState()
  }, [stats])

  const checklistSteps: ChecklistStep[] = [
    {
      id: 'profile',
      title: '1. School Profile & Branding',
      description: 'Upload school logo, address, motto, and official bank details.',
      icon: Building2,
      tabKey: 'settings',
      isCompleted: hasProfile,
    },
    {
      id: 'classes',
      title: '2. Academic Classes & Sections',
      description: 'Seed Nursery, Primary, JSS, and SSS classes and sections.',
      icon: BookOpen,
      tabKey: 'curriculum',
      isCompleted: hasClasses,
    },
    {
      id: 'teachers',
      title: '3. Staff & Teacher Onboarding',
      description: 'Add teachers and assign form classes & subject allocations.',
      icon: Users,
      tabKey: 'staff',
      isCompleted: hasTeachers,
    },
    {
      id: 'students',
      title: '4. Student & Parent Enrollment',
      description: 'Enrol students individually or via bulk CSV import.',
      icon: GraduationCap,
      tabKey: 'admissions',
      isCompleted: hasStudents,
    },
    {
      id: 'fees',
      title: '5. Fee Structure & Invoices',
      description: 'Configure tuition fee items and batch generate term invoices.',
      icon: CreditCard,
      tabKey: 'finances',
      isCompleted: hasFees,
    },
  ]

  const completedCount = checklistSteps.filter((s) => s.isCompleted).length
  const progressPercent = Math.round((completedCount / checklistSteps.length) * 100)

  const handleStepClick = (tabKey: string) => {
    if (onNavigateTab) {
      onNavigateTab(tabKey)
    }
  }

  return (
    <div className="relative rounded-2xl border border-cyan-200/80 bg-gradient-to-r from-cyan-900 via-slate-900 to-indigo-950 p-5 shadow-md text-white overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-400 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Top Progress Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  Guided School Onboarding Checklist
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/30 text-cyan-200 border border-cyan-400/40">
                  {completedCount} of 5 Completed ({progressPercent}%)
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                Complete these essential steps so your school can run smoothly before academic resumption.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="self-start md:self-auto px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>{isCollapsed ? 'Show Steps' : 'Minimize'}</span>
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/60">
          <div
            className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Expandable Steps Grid */}
        {!isCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {checklistSteps.map((step) => {
              const IconComp = step.icon
              return (
                <div
                  key={step.id}
                  onClick={() => handleStepClick(step.tabKey)}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between space-y-3 transition cursor-pointer hover:scale-[1.02] active:scale-[0.99] ${
                    step.isCompleted
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100 hover:border-emerald-400'
                      : 'bg-slate-900/70 border-slate-700/80 text-slate-200 hover:border-cyan-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-1.5 rounded-lg ${step.isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-cyan-400'}`}>
                        <IconComp size={16} />
                      </div>
                      {step.isCompleted ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={12} /> Done
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                          <Circle size={10} /> Pending
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-xs text-white leading-snug">{step.title}</h3>
                      <p className="text-[11px] text-slate-300 mt-1 leading-normal line-clamp-2">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStepClick(step.tabKey)
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition ${
                      step.isCompleted
                        ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/30'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                    }`}
                  >
                    <span>{step.isCompleted ? 'Review Step' : 'Start Step'}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
