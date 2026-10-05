'use client'

import { useState, useEffect, useRef } from 'react'
import {
  GraduationCap,
  BookOpen,
  ChevronDown,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'

export interface TeachingContext {
  id: string
  capacity: 'CLASS_TEACHER' | 'SUBJECT_TEACHER'
  classId: number
  className: string
  sectionId?: number
  sectionName?: string
  subjectId?: number
  subjectName?: string
}

interface TeacherProfileResponse {
  success: boolean
  isFormTeacher?: boolean
  isClassTeacher?: boolean
  isSubjectTeacher?: boolean
  formAllocations?: Array<{
    classId: number
    className: string
    sectionId: number
    sectionName: string
  }>
  subjectAssignments?: Array<{
    classId: number
    className: string
    sectionId: number
    sectionName: string
    subjectId: number
    subjectName: string
  }>
}

export function TeacherContextSwitcher({ onContextChange }: { onContextChange?: (ctx: TeachingContext) => void }) {
  const [contexts, setContexts] = useState<TeachingContext[]>([])
  const [activeContext, setActiveContext] = useState<TeachingContext | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Teacher Allocations & Build Available Contexts
  useEffect(() => {
    let mounted = true

    async function loadContexts() {
      try {
        setLoading(true)
        const res = await apiSlice.get<TeacherProfileResponse>(endpoints.teacher.profile)
        if (!mounted || !res.success) return

        const builtContexts: TeachingContext[] = []

        // Class Teacher contexts
        if (res.formAllocations && res.formAllocations.length > 0) {
          res.formAllocations.forEach((fa) => {
            builtContexts.push({
              id: `CT:${fa.classId}:${fa.sectionId}`,
              capacity: 'CLASS_TEACHER',
              classId: fa.classId,
              className: fa.className,
              sectionId: fa.sectionId,
              sectionName: fa.sectionName,
            })
          })
        }

        // Subject Teacher contexts
        if (res.subjectAssignments && res.subjectAssignments.length > 0) {
          // Group by class + section + subject
          res.subjectAssignments.forEach((sa) => {
            builtContexts.push({
              id: `ST:${sa.classId}:${sa.sectionId}:${sa.subjectId}`,
              capacity: 'SUBJECT_TEACHER',
              classId: sa.classId,
              className: sa.className,
              sectionId: sa.sectionId,
              sectionName: sa.sectionName,
              subjectId: sa.subjectId,
              subjectName: sa.subjectName,
            })
          })
        }

        if (builtContexts.length === 0) {
          // Fallback context if no specific allocations yet
          builtContexts.push({
            id: 'GENERAL:0:0',
            capacity: 'CLASS_TEACHER',
            classId: 0,
            className: 'My Assigned Class',
            sectionName: 'Main',
          })
        }

        setContexts(builtContexts)

        // Read stored active context from localStorage
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('ugbekun_teacher_active_context_id') : null
        const initial = builtContexts.find((c) => c.id === storedId) || builtContexts[0]

        setActiveContext(initial)
        if (typeof window !== 'undefined' && initial) {
          localStorage.setItem('ugbekun_teacher_active_context_id', initial.id)
          localStorage.setItem('ugbekun_teacher_active_context', JSON.stringify(initial))
          window.dispatchEvent(new CustomEvent('ugbekun-context-changed', { detail: initial }))
        }
        onContextChange?.(initial)
      } catch (err) {
        console.warn('[CONTEXT_SWITCHER] Could not load teacher contexts', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadContexts()

    return () => {
      mounted = false
    }
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectContext = (ctx: TeachingContext) => {
    setActiveContext(ctx)
    setIsOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ugbekun_teacher_active_context_id', ctx.id)
      localStorage.setItem('ugbekun_teacher_active_context', JSON.stringify(ctx))
      window.dispatchEvent(new CustomEvent('ugbekun-context-changed', { detail: ctx }))
    }
    onContextChange?.(ctx)
    toast.success(`Active Context: ${ctx.className} (${ctx.sectionName || 'All'}) · ${ctx.capacity === 'CLASS_TEACHER' ? 'Class Teacher' : 'Subject Teacher'}`)
  }

  if (loading || !activeContext) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-400 text-xs animate-pulse">
        <GraduationCap size={15} />
        <span>Loading Class...</span>
      </div>
    )
  }

  const isClassTeacher = activeContext.capacity === 'CLASS_TEACHER'
  const classTeacherContexts = contexts.filter((c) => c.capacity === 'CLASS_TEACHER')
  const subjectTeacherContexts = contexts.filter((c) => c.capacity === 'SUBJECT_TEACHER')
  const hasMultipleContexts = contexts.length > 1

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Switcher Top Bar Pill */}
      <button
        type="button"
        onClick={() => hasMultipleContexts && setIsOpen(!isOpen)}
        disabled={!hasMultipleContexts}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs ${
          isClassTeacher
            ? 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-200/80 text-blue-900'
            : 'bg-purple-50/70 hover:bg-purple-100/70 border-purple-200/80 text-purple-900'
        } ${hasMultipleContexts ? 'cursor-pointer' : 'cursor-default'}`}
        title={hasMultipleContexts ? 'Click to switch teaching classroom or role context' : 'Assigned Classroom'}
      >
        <div className={`p-1 rounded-lg ${isClassTeacher ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
          {isClassTeacher ? <GraduationCap size={13} /> : <BookOpen size={13} />}
        </div>

        <div className="text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-900 truncate max-w-[130px] sm:max-w-[170px]">
              {activeContext.className} {activeContext.sectionName ? `(${activeContext.sectionName})` : ''}
            </span>
            <span
              className={`text-[9px] uppercase px-1.5 py-0.2 rounded-full font-black tracking-wider ${
                isClassTeacher ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'
              }`}
            >
              {isClassTeacher ? 'Class Teacher' : 'Subject'}
            </span>
          </div>
          {activeContext.subjectName && (
            <span className="text-[10px] text-purple-700 font-semibold block truncate max-w-[150px]">
              {activeContext.subjectName}
            </span>
          )}
        </div>

        {hasMultipleContexts && (
          <ChevronDown
            size={14}
            className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        )}
      </button>

      {/* Switcher Contexts Dropdown Menu */}
      {isOpen && hasMultipleContexts && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200/90 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Switch Teaching Context
            </span>
            <span className="text-[10px] text-blue-600 font-bold">
              {contexts.length} Active {contexts.length === 1 ? 'Assignment' : 'Assignments'}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
            {/* GROUP 1: Class Teacher Contexts */}
            {classTeacherContexts.length > 0 && (
              <div className="space-y-1">
                <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <GraduationCap size={12} className="text-blue-600" />
                  <span>Class Teacher Rosters (All Subjects)</span>
                </div>
                {classTeacherContexts.map((ctx) => {
                  const isSelected = activeContext.id === ctx.id
                  return (
                    <button
                      key={ctx.id}
                      onClick={() => handleSelectContext(ctx)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200/70'
                          : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 truncate">
                            {ctx.className}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-semibold">
                            {ctx.sectionName || 'All'}
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-600 font-semibold block">
                          Full custody · Attendance · Reports
                        </span>
                      </div>
                      {isSelected && <Check size={16} className="text-blue-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}

            {/* GROUP 2: Subject Teacher Contexts */}
            {subjectTeacherContexts.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpen size={12} className="text-purple-600" />
                  <span>Subject Teacher Assignments</span>
                </div>
                {subjectTeacherContexts.map((ctx) => {
                  const isSelected = activeContext.id === ctx.id
                  return (
                    <button
                      key={ctx.id}
                      onClick={() => handleSelectContext(ctx)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200/70'
                          : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 truncate">
                            {ctx.className}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-semibold">
                            {ctx.sectionName || 'All'}
                          </span>
                        </div>
                        <span className="text-[10px] text-purple-700 font-bold block truncate">
                          Subject: {ctx.subjectName}
                        </span>
                      </div>
                      {isSelected && <Check size={16} className="text-purple-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
