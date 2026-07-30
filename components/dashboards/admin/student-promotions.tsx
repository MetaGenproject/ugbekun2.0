'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  ArrowRight,
  RefreshCw,
  Calendar,
  Layers,
  School,
  CheckSquare,
  Square,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

export interface ClassItem {
  id: number
  name: string
  sections?: { id: number; name: string }[]
}

export interface SectionItem {
  id: number
  name: string
}

export interface AcademicSessionItem {
  id: number
  name: string
}

export interface EnrolledStudent {
  enrollId: number
  studentId: number
  registerNo: string
  fullName: string
  gender: string
  roll: number
  currentClassId: number
  currentClassName: string
  currentSectionId: number
  currentSectionName: string
}

export interface PromotionLog {
  id: number
  studentId: number
  registerNo: string
  studentName: string
  fromClass: string
  toClass: string
  fromClassId: number
  toClassId: number
  action: 'PROMOTED' | 'REPEATED'
  promotedAt: string
  sessionId: number
}

export function StudentPromotions() {
  const [activeTab, setActiveTab] = useState<'promotion' | 'history'>('promotion')

  // Dropdown options
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [sessions, setSessions] = useState<AcademicSessionItem[]>([
    { id: 5, name: '2025/2026 Academic Session' },
    { id: 6, name: '2026/2027 Academic Session' }
  ])

  // Step 1 & 2: Source selection & students
  const [sourceClassId, setSourceClassId] = useState<string>('')
  const [sourceSectionId, setSourceSectionId] = useState<string>('ALL')
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)

  // Step 3: Target destination
  const [promotionAction, setPromotionAction] = useState<'PROMOTE' | 'REPEAT'>('PROMOTE')
  const [targetSessionId, setTargetSessionId] = useState<string>('6')
  const [targetClassId, setTargetClassId] = useState<string>('')
  const [targetSectionId, setTargetSectionId] = useState<string>('')

  // Step 4: Execution
  const [isExecuting, setIsExecuting] = useState(false)

  // History Tab
  const [historyLogs, setHistoryLogs] = useState<PromotionLog[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historySearch, setHistorySearch] = useState('')

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchClassesAndSections()
    fetchHistoryLogs()
  }, [])

  useEffect(() => {
    if (sourceClassId) {
      fetchClassStudents()
    } else {
      setStudents([])
      setSelectedStudentIds([])
    }
  }, [sourceClassId, sourceSectionId])

  const fetchClassesAndSections = async () => {
    try {
      const res = await apiSlice.get<{ success: boolean; classes: ClassItem[]; sections: SectionItem[] }>(
        endpoints.admin.classesSections
      )
      if (res.success) {
        const clsList = res.classes || []
        const secList = res.sections || []
        setClasses(clsList)
        setSections(secList)

        if (clsList.length > 0) {
          setSourceClassId(String(clsList[0].id))
          if (clsList.length > 1) {
            setTargetClassId(String(clsList[1].id))
          } else {
            setTargetClassId(String(clsList[0].id))
          }
        }
        if (secList.length > 0) {
          setTargetSectionId(String(secList[0].id))
        }
      }
    } catch (e) {
      console.error('Failed to load classes or sections:', e)
    }
  }

  const fetchClassStudents = async () => {
    if (!sourceClassId) return
    setIsLoadingStudents(true)
    try {
      const url = `${endpoints.admin.promotionsClassStudents}?classId=${sourceClassId}&sectionId=${sourceSectionId}`
      const res = await apiSlice.get<{ success: boolean; data: EnrolledStudent[] }>(url)
      if (res.success) {
        setStudents(res.data)
        // Select all by default for convenience
        setSelectedStudentIds(res.data.map((s) => s.studentId))
      }
    } catch (err: any) {
      console.error('Failed to fetch class students:', err)
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch class students.' })
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const fetchHistoryLogs = async () => {
    setIsLoadingHistory(true)
    try {
      let url = endpoints.admin.promotionsHistory
      if (historySearch.trim()) {
        url += `?search=${encodeURIComponent(historySearch)}`
      }
      const res = await apiSlice.get<{ success: boolean; data: PromotionLog[] }>(url)
      if (res.success) {
        setHistoryLogs(res.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch promotion history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Multi-select handlers
  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    return s.fullName.toLowerCase().includes(q) || s.registerNo.toLowerCase().includes(q)
  })

  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.includes(s.studentId))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = new Set(filteredStudents.map((s) => s.studentId))
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.has(id)))
    } else {
      const newIds = new Set([...selectedStudentIds, ...filteredStudents.map((s) => s.studentId)])
      setSelectedStudentIds(Array.from(newIds))
    }
  }

  const toggleSelectStudent = (studentId: number) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId))
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId])
    }
  }

  // Execution Handler
  const handleExecutePromotion = async () => {
    if (selectedStudentIds.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one student for promotion.' })
      return
    }

    if (!targetClassId || !targetSectionId || !targetSessionId) {
      setFeedback({ type: 'error', message: 'Please select Target Academic Session, Class, and Section.' })
      return
    }

    setIsExecuting(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(endpoints.admin.batchPromoteStudents, {
        studentIds: selectedStudentIds,
        targetClassId: parseInt(targetClassId, 10),
        targetSectionId: parseInt(targetSectionId, 10),
        targetSessionId: parseInt(targetSessionId, 10),
        action: promotionAction
      })

      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
        fetchClassStudents()
        fetchHistoryLogs()
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Batch promotion failed.' })
    } finally {
      setIsExecuting(false)
    }
  }

  const promotedCount = historyLogs.filter((h) => h.action === 'PROMOTED').length
  const repeatedCount = historyLogs.filter((h) => h.action === 'REPEATED').length

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <School size={16} /> Academic Desk
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Student Promotions Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Systematic class-by-class promotion and repeat management for student cohorts.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{students.length}</div>
            <div className="text-xs font-medium text-indigo-800">Source Class Cohort</div>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{promotedCount}</div>
            <div className="text-xs font-medium text-emerald-800">Promoted This Session</div>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <RefreshCw size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{repeatedCount}</div>
            <div className="text-xs font-medium text-amber-800">Repeated Students</div>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{sessions.length}</div>
            <div className="text-xs font-medium text-blue-800">Configured Sessions</div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-3 rounded-2xl border border-slate-100 shadow-sm">
        <button
          onClick={() => setActiveTab('promotion')}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer ${
            activeTab === 'promotion' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp size={18} /> Class Promotion Desk
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer ${
            activeTab === 'history' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck size={18} /> Comprehensive History Log ({historyLogs.length})
        </button>
      </div>

      {/* TAB 1: CLASS PROMOTION DESK */}
      {activeTab === 'promotion' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Source Selection & Student Table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Source Selection Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px]">1</span>
                Select Source Class Cohort
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Source Class *</label>
                  <select
                    value={sourceClassId}
                    onChange={(e) => setSourceClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Source Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Source Section</label>
                  <select
                    value={sourceSectionId}
                    onChange={(e) => setSourceSectionId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Student List Table */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b pb-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px]">2</span>
                  Select Students ({selectedStudentIds.length} of {students.length} selected)
                </div>

                <div className="relative w-full sm:w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {!sourceClassId ? (
                <div className="p-12 text-center text-slate-400">
                  <School size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">Please select a Source Class above to view enrolled students.</p>
                </div>
              ) : isLoadingStudents ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-medium">Loading class cohort...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Users size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">No students enrolled in this class cohort.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-500 font-semibold uppercase">
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
                          />
                        </th>
                        <th className="p-3">Register No</th>
                        <th className="p-3">Student Full Name</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Current Section</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredStudents.map((s) => {
                        const isSelected = selectedStudentIds.includes(s.studentId)
                        return (
                          <tr
                            key={s.studentId}
                            onClick={() => toggleSelectStudent(s.studentId)}
                            className={`cursor-pointer transition ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                          >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectStudent(s.studentId)}
                                className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
                              />
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-500">{s.registerNo}</td>
                            <td className="p-3 font-bold text-slate-900">{s.fullName}</td>
                            <td className="p-3 text-slate-500">{s.gender}</td>
                            <td className="p-3 text-slate-600 font-semibold">{s.currentSectionName}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Target Destination & Execute Button */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-3">
                <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px]">3</span>
                Target Promotion Destination
              </div>

              {/* Action Mode Toggle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Promotion Action *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPromotionAction('PROMOTE')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      promotionAction === 'PROMOTE'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp size={14} /> Promote Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromotionAction('REPEAT')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      promotionAction === 'REPEAT'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <RefreshCw size={14} /> Repeat Class
                  </button>
                </div>
              </div>

              {/* Target Session */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Academic Session *</label>
                <select
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Class */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Class {promotionAction === 'REPEAT' ? '(Current Class)' : '*'}
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Target Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Section *</label>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Target Section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                <div className="font-bold text-slate-800">Action Summary:</div>
                <div className="text-slate-600">
                  {promotionAction === 'PROMOTE' ? 'Promoting' : 'Repeating'} <strong className="text-indigo-600">{selectedStudentIds.length} student(s)</strong>
                </div>
              </div>

              {/* Execute Button */}
              <button
                type="button"
                onClick={handleExecutePromotion}
                disabled={isExecuting || selectedStudentIds.length === 0}
                className={`w-full py-3 px-4 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  promotionAction === 'PROMOTE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isExecuting ? (
                  <>Processing Promotion...</>
                ) : (
                  <>
                    <TrendingUp size={16} />
                    {promotionAction === 'PROMOTE' ? `Promote (${selectedStudentIds.length}) Students` : `Repeat (${selectedStudentIds.length}) Students`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPREHENSIVE PROMOTION HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or register number..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchHistoryLogs()}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={fetchHistoryLogs}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
            >
              Refresh Logs
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-500">Loading audit history...</p>
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
              <ShieldCheck size={40} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium text-slate-500">No promotion audit logs recorded yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-500 font-semibold uppercase">
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Register No</th>
                      <th className="p-4">Previous Class</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Promoted / New Class</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {historyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-900">{log.studentName}</td>
                        <td className="p-4 font-mono text-slate-500">{log.registerNo}</td>
                        <td className="p-4 font-semibold text-slate-600">{log.fromClass}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              log.action === 'PROMOTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-indigo-700">{log.toClass}</td>
                        <td className="p-4 text-slate-500">{new Date(log.promotedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
