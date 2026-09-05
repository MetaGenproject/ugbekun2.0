'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Calendar,
  Clock,
  BookOpen,
  School,
  Layers,
  Printer,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  RefreshCw,
} from 'lucide-react'

interface TimetableSlot {
  id: number
  dayOfWeek: string
  startTime: string
  endTime: string
  type: string
  title?: string | null
  class?: { id: number; name: string }
  section?: { id: number; name: string }
  subject?: { id: number; name: string; subjectCode?: string }
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
}

export function TeacherTimetableView() {
  const [selectedDay, setSelectedDay] = useState<string>('ALL')
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [grouped, setGrouped] = useState<Record<string, TimetableSlot[]>>({
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
  })
  const [totalPeriods, setTotalPeriods] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchTimetable()
  }, [])

  const fetchTimetable = async () => {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await apiSlice.get<{
        success: boolean
        slots: TimetableSlot[]
        grouped: Record<string, TimetableSlot[]>
        totalWeeklyPeriods: number
      }>(endpoints.teacher.timetable())

      if (res.success) {
        setSlots(res.slots || [])
        setGrouped(res.grouped || { MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [], FRIDAY: [] })
        setTotalPeriods(res.totalWeeklyPeriods || 0)
      } else {
        setErrorMsg('Unable to retrieve published timetable.')
      }
    } catch (err: any) {
      setErrorMsg('Failed to load published timetable.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSlots = selectedDay === 'ALL'
    ? slots
    : (grouped[selectedDay] || [])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                My Teaching Timetable & Schedule
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                Official weekly lesson periods published by school administration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 font-bold text-xs flex items-center gap-2">
              <Clock size={14} className="text-indigo-600" />
              <span>{totalPeriods} Teaching Periods / Week</span>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer size={14} /> Print Schedule
            </button>

            <button
              onClick={fetchTimetable}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Day Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setSelectedDay('ALL')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedDay === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Days
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedDay === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {slots.length}
          </span>
        </button>

        {DAYS.map((d) => {
          const count = grouped[d]?.length || 0
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedDay === d
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {DAY_LABELS[d]}
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedDay === d ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Slots Display */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
          <span>Loading your teaching schedule...</span>
        </div>
      ) : slots.length === 0 ? (
        <div className="py-20 text-center text-slate-500 text-xs font-medium bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mx-auto">
            <Clock size={24} />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900">No Published Timetable Yet</h3>
          <p className="max-w-md mx-auto text-slate-400">
            The school administration has not yet published the teaching timetable for this academic session. Please check back once the timetable is released.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(selectedDay === 'ALL' ? DAYS : [selectedDay as any]).map((day: any) => {
            const daySlots = grouped[day] || []
            if (selectedDay === 'ALL' && daySlots.length === 0) return null

            return (
              <div key={day} className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                    {DAY_LABELS[day]}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {daySlots.length} Periods
                  </span>
                </div>

                {daySlots.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs font-medium">
                    No periods scheduled for this day.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20 shadow-2xs space-y-2 hover:border-indigo-300 transition"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                          <Clock size={13} className="text-indigo-600" />
                          <span>
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>

                        <div>
                          <div className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
                            <BookOpen size={14} className="text-indigo-600 shrink-0" />
                            <span className="line-clamp-1">{slot.subject?.name || slot.title || 'Lesson Period'}</span>
                          </div>
                          {slot.subject?.subjectCode && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                              {slot.subject.subjectCode}
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-600 font-bold">
                          <span className="flex items-center gap-1">
                            <School size={12} className="text-slate-400" />
                            {slot.class?.name || 'Class'}
                          </span>
                          {slot.section?.name && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Layers size={11} className="text-slate-400" />
                              Arm {slot.section.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
