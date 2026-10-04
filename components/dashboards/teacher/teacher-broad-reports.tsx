'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Table,
  CheckCircle2,
  Users,
  Award,
  TrendingUp,
  Calendar,
  Printer,
  Loader2,
  AlertCircle,
  Building2,
  BookOpen,
  Phone,
  Search,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'

interface AssignedClass {
  id: number
  name: string
  sections: Array<{ id: number; name: string }>
}

interface SubjectItem {
  id: number
  name: string
  subjectCode: string
}

interface TabulationRow {
  studentId: number
  name: string
  registerNo: string
  gender: string
  subjectScores: Record<number, number>
  totalScore: number
  averageScore: number
  position: number
}

interface ClassReportsData {
  classSummary: {
    classId: number
    className: string
    sectionId?: number
    sectionName: string
    totalStudents: number
    classAverage: number
    highestScore: number
    lowestScore: number
  }
  offeredSubjects: SubjectItem[]
  tabulation: TabulationRow[]
  attendanceOverview: {
    totalDaysRecorded: number
    averageAttendanceRate: number
  }
}

export function TeacherBroadReports() {
  const [classes, setClasses] = useState<AssignedClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'tabulation' | 'attendance' | 'performance' | 'directory'>('tabulation')

  const [reportsData, setReportsData] = useState<ClassReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterSearch, setFilterSearch] = useState('')

  // 1. Initial Load: Teacher's assigned classes
  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true)
        const res = await apiSlice.get<{ success: boolean; assignedClasses: AssignedClass[] }>(
          endpoints.teacher.roster
        )
        if (res.success && res.assignedClasses?.length > 0) {
          setClasses(res.assignedClasses)
          setSelectedClassId(String(res.assignedClasses[0].id))
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load assigned classes.')
      } finally {
        setLoading(false)
      }
    }
    loadClasses()
  }, [])

  // 2. Fetch Class Reports when selected class or section changes
  const fetchReports = async () => {
    if (!selectedClassId) return
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('classId', selectedClassId)
      if (selectedSectionId) params.append('sectionId', selectedSectionId)

      const res = await apiSlice.get<{ success: boolean } & ClassReportsData>(
        endpoints.teacher.classReports(params.toString())
      )

      if (res.success) {
        setReportsData(res)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load class reports.')
      setReportsData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClassId) {
      fetchReports()
    }
  }, [selectedClassId, selectedSectionId])

  // Print Tabulation Sheet
  const handlePrint = () => {
    window.print()
  }

  const currentSections = classes.find((c) => String(c.id) === String(selectedClassId))?.sections || []

  // Filtered rows for tabulation
  const filteredTabulation = (reportsData?.tabulation || []).filter((r) => {
    if (!filterSearch.trim()) return true
    const q = filterSearch.toLowerCase().trim()
    return r.name.toLowerCase().includes(q) || r.registerNo.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-200/60">
            <FileText size={14} />
            <span>Class Custody Academic Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Class Academic Reports</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Review tabulation sheets, cumulative class performance, and attendance records strictly scoped to the classes under your custody.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Class Selection & KPI Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Select Class <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value)
                setSelectedSectionId('')
              }}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={`c-${cls.id}`} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Sections</option>
              {currentSections.map((sec) => (
                <option key={`s-${sec.id}`} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="w-full h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {reportsData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Average</span>
              <span className="text-xl font-black text-blue-600">{reportsData.classSummary.classAverage}%</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Highest Score</span>
              <span className="text-xl font-black text-emerald-600">{reportsData.classSummary.highestScore}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lowest Score</span>
              <span className="text-xl font-black text-amber-600">{reportsData.classSummary.lowestScore}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
              <span className="text-xl font-black text-indigo-600">
                {reportsData.attendanceOverview.averageAttendanceRate}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* REPORT TYPE TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveTab('tabulation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tabulation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Table size={13} />
          <span>Tabulation Sheet</span>
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'performance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <TrendingUp size={13} />
          <span>Student Performance & Ranking</span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Calendar size={13} />
          <span>Attendance Intelligence</span>
        </button>
      </div>

      {/* TABULATION SHEET VIEW */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={28} />
          <p className="text-xs text-slate-500 font-medium">Generating class report...</p>
        </div>
      ) : reportsData ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Printable Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase">
                {reportsData.classSummary.className} ({reportsData.classSummary.sectionName}) — Tabulation Sheet
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Enrolled: {reportsData.classSummary.totalStudents} | Subjects Offered: {reportsData.offeredSubjects.length}
              </p>
            </div>

            <div className="relative w-full sm:w-64 print:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Filter student..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Reg No</th>
                  {reportsData.offeredSubjects.map((sub) => (
                    <th key={`th-sub-${sub.id}`} className="p-3 text-center">
                      <span className="block truncate max-w-[80px]" title={sub.name}>
                        {sub.subjectCode || sub.name}
                      </span>
                    </th>
                  ))}
                  <th className="p-3 text-center font-black bg-blue-50 text-blue-800">Total</th>
                  <th className="p-3 text-center font-black bg-blue-50 text-blue-800">Average %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTabulation.map((row) => (
                  <tr key={`tab-row-${row.studentId}`} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-center font-black">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          row.position === 1
                            ? 'bg-amber-100 text-amber-800'
                            : row.position === 2
                            ? 'bg-slate-200 text-slate-700'
                            : row.position === 3
                            ? 'bg-amber-50 text-amber-700'
                            : 'text-slate-500 font-normal'
                        }`}
                      >
                        {row.position}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{row.name}</td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{row.registerNo || 'N/A'}</td>

                    {reportsData.offeredSubjects.map((sub) => {
                      const score = row.subjectScores[sub.id]
                      return (
                        <td key={`score-${row.studentId}-${sub.id}`} className="p-3 text-center font-mono text-xs">
                          {score !== undefined ? (
                            <span className={score >= 50 ? 'text-slate-800 font-semibold' : 'text-rose-600 font-bold'}>
                              {score}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      )
                    })}

                    <td className="p-3 text-center font-mono font-black text-blue-700 bg-blue-50/40">
                      {row.totalScore}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-800 bg-blue-50/40">
                      {row.averageScore}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
          <Building2 className="mx-auto text-slate-300 mb-3" size={36} />
          <h4 className="text-sm font-bold text-slate-800">Select an Assigned Classroom</h4>
          <p className="text-xs text-slate-500 mt-1">
            Choose a class and section from the dropdown above to view the academic report.
          </p>
        </div>
      )}
    </div>
  )
}
