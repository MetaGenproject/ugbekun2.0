'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  BookOpen,
  GraduationCap,
  Users,
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  FileSpreadsheet,
  HelpCircle,
  Eye,
  X,
  Loader2,
  Sparkles,
  RefreshCw,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { showSystemStatus } from '@/lib/systemStatus'

export interface AssignedSubject {
  id: number
  subjectId: number
  subjectName: string
  subjectCode: string
  subjectType: string
  subjectAuthor?: string | null
  classId: number
  className: string
  sectionId: number
  sectionName: string
  studentCount: number
  createdAt?: string
}

export interface SubjectsKpi {
  totalAssignedSubjects: number
  totalClassesTaught: number
  totalStudentsOffering: number
}

export interface SubjectStudent {
  id: number
  registerNo: string
  fullName: string
  gender: string
  photo?: string | null
  roll?: number
}

interface TeacherSubjectsHubProps {
  profile?: any
  onNavigate?: (section: string) => void
}

export function TeacherSubjectsHub({ profile, onNavigate }: TeacherSubjectsHubProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubject[]>([])
  const [kpi, setKpi] = useState<SubjectsKpi>({
    totalAssignedSubjects: 0,
    totalClassesTaught: 0,
    totalStudentsOffering: 0,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Modal State for Roster
  const [selectedSubjectForRoster, setSelectedSubjectForRoster] = useState<AssignedSubject | null>(null)
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [rosterStudents, setRosterStudents] = useState<SubjectStudent[]>([])

  const fetchSubjects = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await apiSlice.get<{
        success: boolean
        assignedSubjects?: AssignedSubject[]
        kpi?: SubjectsKpi
      }>(endpoints.teacher.subjects)

      if (res.success && res.assignedSubjects) {
        setAssignedSubjects(res.assignedSubjects)
        if (res.kpi) {
          setKpi(res.kpi)
        } else {
          // Derive KPI if not explicitly returned
          const uniqueSubj = new Set(res.assignedSubjects.map((s) => s.subjectId)).size
          const uniqueClass = new Set(res.assignedSubjects.map((s) => `${s.classId}-${s.sectionId}`)).size
          const totalStud = res.assignedSubjects.reduce((acc, curr) => acc + curr.studentCount, 0)
          setKpi({
            totalAssignedSubjects: uniqueSubj,
            totalClassesTaught: uniqueClass,
            totalStudentsOffering: totalStud,
          })
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch assigned subjects:', err)
      showSystemStatus({
        type: 'UNABLE',
        title: 'Error Loading Subjects',
        message: err.message || 'Unable to retrieve assigned subject allocations.',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  // Unique Classes list for Filter Dropdown
  const classFilterOptions = useMemo(() => {
    const map = new Map<string, string>()
    assignedSubjects.forEach((s) => {
      const label = `${s.className} ${s.sectionName ? `(${s.sectionName})` : ''}`.trim()
      map.set(String(s.classId), label)
    })
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
  }, [assignedSubjects])

  // Filtered assigned subjects
  const filteredSubjects = useMemo(() => {
    return assignedSubjects.filter((s) => {
      const matchesSearch =
        s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sectionName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesClass = selectedClassFilter === 'ALL' || String(s.classId) === selectedClassFilter

      return matchesSearch && matchesClass
    })
  }, [assignedSubjects, searchQuery, selectedClassFilter])

  // Open Roster Modal
  const handleOpenRoster = async (subject: AssignedSubject) => {
    setSelectedSubjectForRoster(subject)
    setLoadingRoster(true)
    setRosterStudents([])

    try {
      // Endpoint to get roster for this assignId
      const url = `${endpoints.teacher.subjects}/${subject.id}/students`
      const res = await apiSlice.get<{
        success: boolean
        students: SubjectStudent[]
      }>(url)

      if (res.success && res.students) {
        setRosterStudents(res.students)
      } else {
        setRosterStudents([])
      }
    } catch (err: any) {
      console.error('Failed to fetch roster for subject:', err)
      // Fallback: fetch roster by class and section if assignId endpoint isn't loaded yet
      try {
        const fallbackUrl = `${endpoints.teacher.students}?classId=${subject.classId}&sectionId=${subject.sectionId}`
        const fallbackRes = await apiSlice.get<{ success: boolean; students: any[] }>(fallbackUrl)
        if (fallbackRes.success && fallbackRes.students) {
          setRosterStudents(
            fallbackRes.students.map((st) => ({
              id: st.id,
              registerNo: st.registerNo || `REG-${st.id}`,
              fullName: `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || 'Student',
              gender: st.gender || 'N/A',
              photo: st.photo,
              roll: st.roll,
            }))
          )
        }
      } catch {
        setRosterStudents([])
      }
    } finally {
      setLoadingRoster(false)
    }
  }

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-400/20">
              <Sparkles size={14} className="text-blue-400" />
              Academic Allocation Directory
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              My Assigned Subjects & Student Cohorts
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Overview of all academic subjects allocated to your teaching schedule, active student offering metrics per classroom, and quick access to Gradebooks & Question Banks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchSubjects(true)}
              disabled={refreshing || loading}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2 border border-white/15"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Allocations'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Assigned Subjects */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Subjects</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{kpi.totalAssignedSubjects}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-inner">
              <BookOpen size={28} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500 gap-1.5 font-medium">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Active Curriculum Modules</span>
          </div>
        </div>

        {/* Card 2: Classes Taught */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Cohorts</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{kpi.totalClassesTaught}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
              <GraduationCap size={28} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500 gap-1.5 font-medium">
            <CheckCircle2 size={14} className="text-indigo-500" />
            <span>Distinct Class Sections</span>
          </div>
        </div>

        {/* Card 3: Enrolled Students */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrolled Students</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{kpi.totalStudentsOffering}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-inner">
              <Users size={28} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500 gap-1.5 font-medium">
            <UserCheck size={14} className="text-purple-500" />
            <span>Offering Your Assigned Subjects</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter, Search, & View Toggle */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subject name, code, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
          />
        </div>

        {/* Filters & View Controls */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">All Classrooms</option>
              {classFilterOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon size={15} />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-4 shadow-xs">
          <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-extrabold text-slate-700">Loading Assigned Subjects...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-3 shadow-xs">
          <BookMarked size={48} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">No Assigned Subjects Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedClassFilter !== 'ALL'
              ? 'No subjects match your current search criteria. Try resetting filters.'
              : 'You have not been allocated any subjects in the active academic session yet. Contact your School Admin for subject allocation.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              {/* Card Header */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black tracking-wide border border-blue-200/60 uppercase">
                    {sub.subjectCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {sub.subjectType || 'Core'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {sub.subjectName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <GraduationCap size={15} className="text-slate-400 shrink-0" />
                    <span className="text-xs font-extrabold text-slate-700">
                      {sub.className} {sub.sectionName ? `(${sub.sectionName})` : ''}
                    </span>
                  </div>
                </div>

                {/* Enrolled Students Badge */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students Offering</p>
                      <p className="text-sm font-black text-slate-900">{sub.studentCount} Students</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRoster(sub)}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="View Student Roster"
                  >
                    <Eye size={14} />
                    <span>Roster</span>
                  </button>
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigate?.('gradebook')}
                  className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <FileSpreadsheet size={14} />
                  <span>Gradebook</span>
                </button>

                <button
                  onClick={() => onNavigate?.('question-bank')}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <HelpCircle size={14} />
                  <span>Question Bank</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="p-4">#</th>
                  <th className="p-4">Subject Code</th>
                  <th className="p-4">Subject Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Class & Section</th>
                  <th className="p-4 text-center">Enrolled Students</th>
                  <th className="p-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700">
                {filteredSubjects.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-black border border-blue-200/60 text-[11px]">
                        {sub.subjectCode}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-slate-900 text-sm">{sub.subjectName}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                        {sub.subjectType || 'Core'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-slate-800">
                        {sub.className} {sub.sectionName ? `(${sub.sectionName})` : ''}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-black text-xs border border-purple-200/60">
                        <Users size={13} />
                        {sub.studentCount} offering
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenRoster(sub)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>Roster</span>
                        </button>
                        <button
                          onClick={() => onNavigate?.('gradebook')}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <FileSpreadsheet size={13} />
                          <span>Gradebook</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roster Modal */}
      {selectedSubjectForRoster && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider">
                  {selectedSubjectForRoster.subjectCode} &bull; {selectedSubjectForRoster.className} ({selectedSubjectForRoster.sectionName})
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Students Offering {selectedSubjectForRoster.subjectName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubjectForRoster(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {loadingRoster ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Loading Enrolled Student Roster...</p>
                </div>
              ) : rosterStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  No active students found in {selectedSubjectForRoster.className} ({selectedSubjectForRoster.sectionName}).
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2 pb-1">
                    <span>Student Name & Registration No</span>
                    <span>Gender</span>
                  </div>

                  {rosterStudents.map((st, idx) => (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">{st.fullName}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">{st.registerNo}</p>
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                        {st.gender}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Total Enrolled: <strong className="text-slate-900">{rosterStudents.length} Students</strong>
              </span>
              <button
                onClick={() => setSelectedSubjectForRoster(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
