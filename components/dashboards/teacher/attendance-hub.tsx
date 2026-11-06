'use client'

import React, { useState, useEffect } from 'react'
import {
  CheckSquare,
  CalendarDays,
  CalendarRange,
  FileSpreadsheet,
  Users,
  Sparkles,
} from 'lucide-react'
import AttendanceRegister from './attendance-register'
import TeacherDailyAttendance from './teacher-daily-attendance'
import TeacherMonthlyAttendance from './teacher-monthly-attendance'
import TeacherTermlyAttendance from './teacher-termly-attendance'
import { getLagosDateKey } from '@/lib/dateUtils'

export type AttendanceTab = 'register' | 'daily' | 'monthly' | 'termly'

interface FormAllocation {
  classId: number
  className: string
  sectionId: number
  sectionName: string
  sessionId?: number
}

interface AttendanceHubProps {
  formAllocations?: FormAllocation[]
  schoolName?: string
  teacherName?: string
  initialTab?: AttendanceTab
}

export default function AttendanceHub({
  formAllocations = [],
  schoolName,
  teacherName,
  initialTab = 'register',
}: AttendanceHubProps) {
  const [activeTab, setActiveTab] = useState<AttendanceTab>(initialTab)
  const [selectedFormIdx, setSelectedFormIdx] = useState<number>(0)

  // Synchronize initialTab if parent activeSection changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Common date states
  const [currentDate, setCurrentDate] = useState<string>(() => getLagosDateKey())
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const today = getLagosDateKey()
    return today.slice(0, 7) // 'YYYY-MM'
  })
  const [currentTermId, setCurrentTermId] = useState<number>(1)

  const activeForm = formAllocations[selectedFormIdx] || formAllocations[0]

  const tabs: { id: AttendanceTab; label: string; icon: React.ElementType; badge?: string }[] = [
    {
      id: 'register',
      label: 'Mark Roll Call',
      icon: CheckSquare,
      badge: 'Live',
    },
    {
      id: 'daily',
      label: 'Daily Report',
      icon: CalendarDays,
    },
    {
      id: 'monthly',
      label: 'Monthly Report',
      icon: CalendarRange,
    },
    {
      id: 'termly',
      label: 'Termly Broadsheet',
      icon: FileSpreadsheet,
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 font-sans">
      {/* Sub-menu Navigation Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Attendance Intelligence &amp; Reports
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Form teacher roll call register, daily highlighted signals, monthly 1..31 calendar grid, and termly attendance broadsheets.
            </p>
          </div>

          {/* Sub-menu Tabs (Scrollable on mobile) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto no-scrollbar scroll-smooth w-full md:w-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'register' && (
        <AttendanceRegister
          formAllocations={formAllocations as any}
          schoolName={schoolName}
          teacherName={teacherName}
          selectedFormIdx={selectedFormIdx}
          onSelectFormIdx={setSelectedFormIdx}
        />
      )}

      {activeTab === 'daily' && (
        <TeacherDailyAttendance
          formAllocations={formAllocations}
          selectedFormIdx={selectedFormIdx}
          onSelectFormIdx={setSelectedFormIdx}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
      )}

      {activeTab === 'monthly' && (
        <TeacherMonthlyAttendance
          formAllocations={formAllocations}
          selectedFormIdx={selectedFormIdx}
          onSelectFormIdx={setSelectedFormIdx}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}

      {activeTab === 'termly' && (
        <TeacherTermlyAttendance
          formAllocations={formAllocations}
          selectedFormIdx={selectedFormIdx}
          onSelectFormIdx={setSelectedFormIdx}
          currentTermId={currentTermId}
          onTermChange={setCurrentTermId}
        />
      )}
    </div>
  )
}
