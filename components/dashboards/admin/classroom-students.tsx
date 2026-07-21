'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { 
  Search, 
  School, 
  Users, 
  Loader2, 
  Info,
  SlidersHorizontal,
  UserCheck,
  TrendingUp,
  UserCheck2
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

interface Section {
  id: number
  name: string
}

interface ClassData {
  id: number
  name: string
  nameNumeric: string
  isEcd: boolean
  sections: {
    section: Section
  }[]
}

interface Student {
  id: number
  registerNo: string | null
  firstName: string | null
  lastName: string | null
  gender: string | null
  mobileno: string | null
  email: string | null
  parentName: string | null
  parentRelation: string | null
  parentMobile: string | null
  parentEmail: string | null
  active?: boolean
}

interface ClassroomStats {
  total: number
  male: number
  female: number
}

export function ClassroomStudents() {
  // Load data dropdowns
  const [classes, setClasses] = useState<ClassData[]>([])
  const [availableSections, setAvailableSections] = useState<Section[]>([])
  const [isLoadingMeta, setIsLoadingMeta] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)

  // Filters selected
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

  // Loaded students & stats
  const [students, setStudents] = useState<Student[]>([])
  const [formTeacher, setFormTeacher] = useState<string>('Unassigned')
  const [stats, setStats] = useState<ClassroomStats>({ total: 0, male: 0, female: 0 })
  
  // Roster status
  const [isLoadingRoster, setIsLoadingRoster] = useState(false)
  const [rosterError, setRosterError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Inline filter query
  const [searchQuery, setSearchQuery] = useState('')

  // Load Classes & Sections configurations
  useEffect(() => {
    async function loadMeta() {
      setIsLoadingMeta(true)
      setMetaError(null)
      try {
        const res = await apiSlice.get<{ success: boolean; classes: ClassData[] }>(
          endpoints.admin.classesSections
        )
        setClasses(res.classes)
      } catch (err) {
        setMetaError(err instanceof Error ? err.message : 'Failed to load classroom filters.')
      } finally {
        setIsLoadingMeta(false)
      }
    }
    loadMeta()
  }, [])

  // Update sections list when class selection changes
  const handleClassChange = (classIdStr: string) => {
    setSelectedClassId(classIdStr)
    setSelectedSectionId('') // Reset section selection
    
    if (!classIdStr) {
      setAvailableSections([])
      return
    }

    const selectedCls = classes.find(c => c.id === Number(classIdStr))
    if (selectedCls) {
      // Map allocated sections
      const sectionsList = selectedCls.sections.map(s => s.section)
      setAvailableSections(sectionsList)
    } else {
      setAvailableSections([])
    }
  }

  // Fetch student roster for classroom
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId || !selectedSectionId) return

    setIsLoadingRoster(true)
    setRosterError(null)
    setSearchQuery('') // Reset search query on new classroom search
    try {
      const res = await apiSlice.get<{
        success: boolean
        students: Student[]
        formTeacher: string
        stats: ClassroomStats
      }>(endpoints.admin.classroomStudents(Number(selectedClassId), Number(selectedSectionId)))
      
      setStudents(res.students)
      setFormTeacher(res.formTeacher)
      setStats(res.stats)
      setHasSearched(true)
    } catch (err) {
      setRosterError(err instanceof Error ? err.message : 'Failed to fetch student roster.')
    } finally {
      setIsLoadingRoster(false)
    }
  }

  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null)

  const handleToggleStudentStatus = async (studentId: number) => {
    setTogglingStatusId(studentId)
    try {
      await apiSlice.post(endpoints.admin.toggleStudentStatus(studentId), {})
      // Re-fetch the roster
      const res = await apiSlice.get<{
        success: boolean
        students: Student[]
        formTeacher: string
        stats: ClassroomStats
      }>(endpoints.admin.classroomStudents(Number(selectedClassId), Number(selectedSectionId)))
      
      setStudents(res.students)
      setFormTeacher(res.formTeacher)
      setStats(res.stats)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status update failed.')
    } finally {
      setTogglingStatusId(null)
    }
  }

  // Filter students array in UI based on inline search input
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase()
    const regNo = (student.registerNo || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || regNo.includes(query)
  })

  // Selected class & section text descriptors for displays
  const selectedClassObj = classes.find(c => c.id === Number(selectedClassId))
  const selectedSectionObj = availableSections.find(s => s.id === Number(selectedSectionId))
  const classroomLabel = selectedClassObj && selectedSectionObj 
    ? `${selectedClassObj.name} - Section ${selectedSectionObj.name}`
    : ''

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <School className="text-blue-600" size={24} /> Classrooms Directory
          </h1>
          <p className="text-slate-500 text-sm font-medium">Search for classrooms, view form teacher allocations, and manage enrolled students.</p>
        </div>
      </div>

      {/* Classroom Filter Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <SlidersHorizontal size={16} className="text-slate-400" />
          <h3 className="text-sm font-black text-slate-800">Select Classroom</h3>
        </div>

        {metaError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 font-semibold">
            {metaError}
          </div>
        )}

        <form onSubmit={handleSearch} className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={e => handleClassChange(e.target.value)}
              disabled={isLoadingMeta || isLoadingRoster}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 disabled:opacity-50 font-semibold text-slate-700"
              required
            >
              <option value="">-- Select Class --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Section</label>
            <select
              value={selectedSectionId}
              onChange={e => setSelectedSectionId(e.target.value)}
              disabled={isLoadingMeta || isLoadingRoster || !selectedClassId}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 disabled:opacity-50 font-semibold text-slate-700"
              required
            >
              <option value="">
                {!selectedClassId ? 'Select class first' : '-- Select Section --'}
              </option>
              {availableSections.map(sec => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!selectedClassId || !selectedSectionId || isLoadingRoster}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-blue-500/10 disabled:opacity-50 h-10 select-none active:scale-[0.98]"
          >
            {isLoadingRoster ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={14} />
                Search Classroom
              </>
            )}
          </button>
        </form>
      </div>

      {/* Roster & Stats Workspace */}
      {rosterError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-semibold">
          Error: {rosterError}
        </div>
      )}

      {isLoadingRoster ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-slate-500 text-sm font-semibold">Retrieving classroom roster...</p>
        </div>
      ) : hasSearched ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Classroom Information Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Form Teacher</p>
                <p className="text-lg font-black text-slate-900 mt-1 truncate max-w-[180px]">{formTeacher}</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                <UserCheck size={18} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Enrolled Students</p>
                <p className="text-lg font-black text-slate-900 mt-1">{stats.total} students</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-slate-600">
                <Users size={18} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Male Count</p>
                <p className="text-lg font-black text-emerald-800 mt-1">{stats.male} males</p>
              </div>
              <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600">
                <TrendingUp size={18} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Female Count</p>
                <p className="text-lg font-black text-purple-800 mt-1">{stats.female} females</p>
              </div>
              <div className="p-3 rounded-lg border border-purple-100 bg-purple-50 text-purple-600">
                <TrendingUp size={18} className="stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Student Roster Table Panel */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            
            {/* Table Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">{classroomLabel} Roster</h3>
                <p className="text-xs text-slate-400 font-medium">All students currently active in this classroom.</p>
              </div>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Filter by name or reg no..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm font-semibold bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                <Info size={24} className="text-slate-400" />
                No students are currently allocated to this classroom for this academic year.
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm font-semibold bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                <Search size={24} className="text-slate-400" />
                No matching students found in this classroom roster.
              </div>
            ) : (
              <div className="overflow-x-auto">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Reg. No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Parent / Guardian</TableHead>
                      <TableHead>Contact Details</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-slate-900">{student.registerNo || '—'}</TableCell>
                        <TableCell className="font-bold text-slate-800">
                          {[student.firstName, student.lastName].filter(Boolean).join(' ') || '—'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize ${
                            student.gender?.toLowerCase() === 'male'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : student.gender?.toLowerCase() === 'female'
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : 'bg-slate-50 text-slate-700 border-slate-100'
                          }`}>
                            {student.gender || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-800">{student.parentName || '—'}</div>
                          {student.parentRelation && (
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{student.parentRelation}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-medium text-slate-600">{student.parentMobile || student.mobileno || '—'}</div>
                          <div className="text-xs text-slate-400">{student.parentEmail || student.email || '—'}</div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleStudentStatus(student.id)}
                            disabled={togglingStatusId === student.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer select-none ${
                              student.active !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                            }`}
                            title={student.active !== false ? "Click to suspend student" : "Click to activate student"}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${student.active !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {student.active !== false ? 'Active' : 'Suspended'}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>
                    Showing {filteredStudents.length} of {students.length} student{students.length === 1 ? '' : 's'} in {classroomLabel}.
                  </TableCaption>
                </Table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center text-slate-500 font-medium flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
            <School size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="text-slate-800 font-bold text-sm">No classroom selected</h4>
            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-normal">
              Select an academic Class and Section from the filter dropdowns above and click Search to display the roster.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
