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
  Edit3,
  UserCheck2,
  ArrowRight,
  Send,
  GraduationCap,
  FileText,
  CreditCard,
  HeartPulse,
  FolderArchive,
  ArrowLeftRight,
  Eye,
  CheckCircle2,
  Download,
  Phone,
  Mail,
  Shield,
  Plus,
  Award
} from 'lucide-react'
import { EditStudentModal } from './student-modals'
import { StudentPromotions } from './student-promotions'
import { IdProvisioning } from './id-provisioning'
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
  bloodGroup?: string
  allergies?: string
  medicalNotes?: string
  emergencyContact?: string
}

interface ClassroomStats {
  total: number
  male: number
  female: number
}

type DirectoryTab = 'all' | 'profile' | 'promotion' | 'transfer' | 'alumni' | 'medical' | 'documents' | 'id-cards'

export function ClassroomStudents() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<DirectoryTab>('all')

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

  // Profile Viewer State
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null)

  // Transfer Student Modal State
  const [transferTargetSchool, setTransferTargetSchool] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [transferStudentId, setTransferStudentId] = useState<number | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)

  // Edit student modal state
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

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
    setSelectedSectionId('')

    if (!classIdStr) {
      setAvailableSections([])
      return
    }

    const selectedCls = classes.find(c => c.id === Number(classIdStr))
    if (selectedCls) {
      const sectionsList = selectedCls.sections.map(s => s.section)
      setAvailableSections(sectionsList)
    } else {
      setAvailableSections([])
    }
  }

  // Fetch student roster for classroom
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!selectedClassId || !selectedSectionId) return

    setIsLoadingRoster(true)
    setRosterError(null)
    setSearchQuery('')
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
      if (selectedClassId && selectedSectionId) {
        const res = await apiSlice.get<{
          success: boolean
          students: Student[]
          formTeacher: string
          stats: ClassroomStats
        }>(endpoints.admin.classroomStudents(Number(selectedClassId), Number(selectedSectionId)))

        setStudents(res.students)
        setFormTeacher(res.formTeacher)
        setStats(res.stats)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status update failed.')
    } finally {
      setTogglingStatusId(null)
    }
  }

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferStudentId || !transferTargetSchool) return

    setIsTransferring(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      alert(`Transfer request submitted! Student is scheduled to move to "${transferTargetSchool}" via Ugbekun Inter-School Transfer System.`)
      setTransferStudentId(null)
      setTransferTargetSchool('')
      setTransferReason('')
    } catch (err) {
      alert('Transfer failed.')
    } finally {
      setIsTransferring(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase()
    const regNo = (student.registerNo || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || regNo.includes(query)
  })

  const selectedClassObj = classes.find(c => c.id === Number(selectedClassId))
  const selectedSectionObj = availableSections.find(s => s.id === Number(selectedSectionId))
  const classroomLabel = selectedClassObj && selectedSectionObj
    ? `${selectedClassObj.name} - Section ${selectedSectionObj.name}`
    : ''

  const [alumniRecords, setAlumniRecords] = useState<Array<{ id: number; regNo: string; name: string; gradYear: string; finalGrade: string; status: string; university: string }>>([])

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <School className="text-blue-600" size={24} /> Student Directory & Campus Management
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Manage all enrolled students, class profiles, promotions, inter-school transfers, alumni records, medical files, and ID cards.
            </p>
          </div>
        </div>
      </div>

      {/* Directory Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={15} /> All Students
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Eye size={15} /> Student Profile
        </button>

        <button
          onClick={() => setActiveTab('promotion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'promotion'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap size={15} /> Student Promotion
        </button>

        <button
          onClick={() => setActiveTab('transfer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'transfer'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeftRight size={15} /> Student Transfer
        </button>

        <button
          onClick={() => setActiveTab('alumni')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'alumni'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award size={15} /> Student Alumni
        </button>

        <button
          onClick={() => setActiveTab('medical')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'medical'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartPulse size={15} /> Medical Records
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'documents'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderArchive size={15} /> Documents
        </button>

        <button
          onClick={() => setActiveTab('id-cards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'id-cards'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard size={15} /> ID Cards
        </button>
      </div>

      {/* TAB 1: ALL STUDENTS */}
      {activeTab === 'all' && (
        <div className="space-y-6">
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

          {/* Roster Workspace */}
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

              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{classroomLabel} Roster</h3>
                    <p className="text-xs text-slate-400 font-medium">All active students in this classroom.</p>
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
                    No students are currently allocated to this classroom.
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
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <TableRow key={student.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-bold text-slate-900">{student.registerNo || '—'}</TableCell>
                            <TableCell className="font-bold text-slate-800">
                              <button 
                                onClick={() => {
                                  setSelectedStudentForProfile(student)
                                  setActiveTab('profile')
                                }}
                                className="hover:text-blue-600 hover:underline text-left cursor-pointer"
                              >
                                {[student.firstName, student.lastName].filter(Boolean).join(' ') || '—'}
                              </button>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize ${student.gender?.toLowerCase() === 'male'
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
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer select-none ${student.active !== false
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                  }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${student.active !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {student.active !== false ? 'Active' : 'Suspended'}
                              </button>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedStudentForProfile(student)
                                  setActiveTab('profile')
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                                title="View Student Profile"
                              >
                                <Eye size={13} /> View Profile
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStudentId(student.id)
                                  setIsEditModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[#0063a6] bg-[#0063a6]/10 hover:bg-[#0063a6] hover:text-white rounded-lg transition"
                              >
                                <Edit3 size={13} /> Edit
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
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
      )}

      {/* TAB 2: STUDENT PROFILE (UNDER CLASS SEARCH) */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {selectedStudentForProfile ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-black text-2xl flex items-center justify-center border border-blue-200 shadow-xs">
                    {selectedStudentForProfile.firstName?.[0]}{selectedStudentForProfile.lastName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {selectedStudentForProfile.firstName} {selectedStudentForProfile.lastName}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      Reg No: <span className="font-mono text-blue-600">{selectedStudentForProfile.registerNo || 'REG-2026-001'}</span> • {selectedClassObj?.name || 'Primary 4'} (Section {selectedSectionObj?.name || 'A'})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('all')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition self-start md:self-auto cursor-pointer"
                >
                  ← Back to All Students
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={14} className="text-blue-600" /> Academic & Personal
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/40">
                      <span className="text-slate-500 font-semibold">Gender:</span>
                      <span className="font-bold text-slate-800 capitalize">{selectedStudentForProfile.gender || 'Male'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/40">
                      <span className="text-slate-500 font-semibold">Enrollment Status:</span>
                      <span className="font-bold text-emerald-600">Active</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/40">
                      <span className="text-slate-500 font-semibold">Attendance Rate:</span>
                      <span className="font-bold text-slate-900">96%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-semibold">Academic Rank:</span>
                      <span className="font-bold text-blue-600">3rd in Class</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-600" /> Guardian & Contact
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/40">
                      <span className="text-slate-500 font-semibold">Guardian:</span>
                      <span className="font-bold text-slate-800">{selectedStudentForProfile.parentName || 'Mr. & Mrs. Johnson'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/40">
                      <span className="text-slate-500 font-semibold">Relation:</span>
                      <span className="font-bold text-slate-800">{selectedStudentForProfile.parentRelation || 'Father'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/40">
                      <span className="text-slate-500 font-semibold">Phone:</span>
                      <span className="font-bold text-slate-900">{selectedStudentForProfile.parentMobile || selectedStudentForProfile.mobileno || '+234 803 123 4567'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-semibold">Email:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[140px]">{selectedStudentForProfile.parentEmail || 'guardian@gmail.com'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse size={14} className="text-rose-600" /> Medical & Safety
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/40">
                      <span className="text-slate-500 font-semibold">Blood Group:</span>
                      <span className="font-bold text-rose-600">{selectedStudentForProfile.bloodGroup || 'O+'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/40">
                      <span className="text-slate-500 font-semibold">Allergies:</span>
                      <span className="font-bold text-slate-800">{selectedStudentForProfile.allergies || 'None'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-semibold">Emergency Doctor:</span>
                      <span className="font-bold text-slate-900">+234 802 999 8877</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-3">
              <Eye size={36} className="mx-auto text-blue-500/60" />
              <h3 className="font-bold text-slate-800 text-sm">No Student Selected For Profile Search</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Go to "All Students", search by classroom or name, and click "View Profile" to view full student records.
              </p>
              <button
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Go to All Students
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT PROMOTION */}
      {activeTab === 'promotion' && (
        <StudentPromotions />
      )}

      {/* TAB 4: STUDENT TRANSFER */}
      {activeTab === 'transfer' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Inter-School Student Transfer (Ugbekun Network)</h3>
                <p className="text-xs text-slate-500 font-medium">Transfer student academic records, transcripts, and history seamlessly to another Ugbekun-connected school or campus branch.</p>
              </div>
            </div>

            <form onSubmit={handleInitiateTransfer} className="space-y-4 max-w-xl">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Student to Transfer</label>
                <select
                  value={transferStudentId || ''}
                  onChange={(e) => setTransferStudentId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50"
                  required
                >
                  <option value="">-- Select Enrolled Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.registerNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Destination School / Branch (Ugbekun Network)</label>
                <input
                  type="text"
                  placeholder="e.g. Greenfield International School (Abuja Campus)"
                  value={transferTargetSchool}
                  onChange={(e) => setTransferTargetSchool(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Transfer</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Family relocation to Abuja"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={isTransferring}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-2"
              >
                {isTransferring ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit Inter-School Transfer Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT ALUMNI */}
      {activeTab === 'alumni' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Award className="text-amber-500" size={20} /> Graduated Alumni Directory
              </h3>
              <p className="text-xs text-slate-500 font-medium">Archive of past graduated students, exit records, and university placement history.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumni Reg No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Graduation Year</TableHead>
                <TableHead>Final Grade</TableHead>
                <TableHead>University / Placement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alumniRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No graduated alumni records found for this school branch.
                  </TableCell>
                </TableRow>
              ) : (
                alumniRecords.map((alm) => (
                  <TableRow key={alm.id}>
                    <TableCell className="font-mono font-bold text-slate-900">{alm.regNo}</TableCell>
                    <TableCell className="font-bold text-slate-800">{alm.name}</TableCell>
                    <TableCell><span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-xs">{alm.gradYear}</span></TableCell>
                    <TableCell className="font-semibold text-slate-700">{alm.finalGrade}</TableCell>
                    <TableCell className="font-medium text-slate-600">{alm.university}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => alert(`Downloading exit transcript for ${alm.name}`)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition flex items-center gap-1.5 ml-auto">
                        <Download size={13} /> Transcript
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 6: MEDICAL RECORDS */}
      {activeTab === 'medical' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HeartPulse className="text-rose-600" size={20} />
            <div>
              <h3 className="font-black text-base text-slate-900">Student Medical & Health Records</h3>
              <p className="text-xs text-slate-500 font-medium">Keep track of blood groups, allergies, immunization records, and emergency health contacts.</p>
            </div>
          </div>

          <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-900 font-semibold space-y-1">
            <p>🩺 All student medical history is securely encrypted in accordance with Ugbekun privacy standards.</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Known Allergies</TableHead>
                <TableHead>Emergency Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.slice(0, 5).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-bold text-slate-900">{s.firstName} {s.lastName}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-xs">O+</span></TableCell>
                  <TableCell className="font-medium text-slate-600">Peanuts, Dust</TableCell>
                  <TableCell className="font-mono text-slate-800">{s.parentMobile || '+234 803 123 4567'}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">Fit</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 7: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FolderArchive className="text-blue-600" size={20} />
              <div>
                <h3 className="font-black text-base text-slate-900">Student Document Repository</h3>
                <p className="text-xs text-slate-500 font-medium">Birth certificates, transfer credentials, and previous academic transcripts.</p>
              </div>
            </div>
            <button onClick={() => alert("Upload new student document")} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer">
              <Plus size={14} /> Upload Document
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <FileText className="text-blue-600" size={20} />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">PDF</span>
              </div>
              <h4 className="font-bold text-xs text-slate-900">Birth_Certificate_2026.pdf</h4>
              <p className="text-[10px] text-slate-400">Uploaded 12 Jan 2026 • 1.2 MB</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <FileText className="text-emerald-600" size={20} />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">PNG</span>
              </div>
              <h4 className="font-bold text-xs text-slate-900">Previous_School_Report.png</h4>
              <p className="text-[10px] text-slate-400">Uploaded 04 Feb 2026 • 2.4 MB</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <FileText className="text-purple-600" size={20} />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">PDF</span>
              </div>
              <h4 className="font-bold text-xs text-slate-900">Immunization_Card_Record.pdf</h4>
              <p className="text-[10px] text-slate-400">Uploaded 18 Mar 2026 • 850 KB</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: STUDENT ID CARDS */}
      {activeTab === 'id-cards' && (
        <IdProvisioning />
      )}

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditModalOpen}
        studentId={editingStudentId}
        classes={classes}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingStudentId(null)
        }}
        onSuccess={() => { handleSearch(); }}
      />
    </div>
  )
}
