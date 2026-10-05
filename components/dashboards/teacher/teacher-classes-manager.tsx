'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Search,
  Filter,
  Loader2,
  Mail,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  Building2,
  ArrowRight,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'
import { getAvatarUrl } from '@/lib/avatar'

interface AssignedSection {
  id: number
  name: string
}

interface AssignedClass {
  id: number
  name: string
  sections: AssignedSection[]
}

interface StudentRecord {
  id: number
  firstName: string
  lastName: string
  registerNo: string
  gender: string
  photo: string | null
  className: string
  sectionName: string
  parent: {
    id: number
    name: string
    fatherName?: string | null
    motherName?: string | null
    mobileno?: string | null
    email?: string | null
  } | null
}

interface TeacherClassesManagerProps {
  onNavigate?: (section: string) => void
  onSelectClassForReports?: (classId: number, sectionId?: number) => void
}

export function TeacherClassesManager({
  onNavigate,
  onSelectClassForReports,
}: TeacherClassesManagerProps) {
  // Filter States
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [studentSearchQuery, setStudentSearchQuery] = useState('')

  // Data States
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)

  // Message Parent Modal
  const [showMsgModal, setShowMsgModal] = useState(false)
  const [selectedParent, setSelectedParent] = useState<{ id: number; name: string; studentName: string } | null>(null)
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  // Initial fetch of teacher's assigned classes and initial roster
  const fetchClassesAndRoster = async () => {
    try {
      setLoading(true)
      const res = await apiSlice.get<{
        success: boolean
        students: StudentRecord[]
        assignedClasses?: AssignedClass[]
      }>(endpoints.teacher.roster)

      if (res.success) {
        setStudents(res.students || [])
        if (res.assignedClasses && res.assignedClasses.length > 0) {
          setAssignedClasses(res.assignedClasses)

          let initialClassId = String(res.assignedClasses[0].id)
          let initialSectionId = ''
          try {
            const storedJson = typeof window !== 'undefined' ? localStorage.getItem('ugbekun_teacher_active_context') : null
            if (storedJson) {
              const ctx = JSON.parse(storedJson)
              if (ctx.classId && res.assignedClasses.some((c) => c.id === ctx.classId)) {
                initialClassId = String(ctx.classId)
                initialSectionId = ctx.sectionId ? String(ctx.sectionId) : ''
              }
            }
          } catch {
            // ignore
          }

          setSelectedClassId(initialClassId)
          setSelectedSectionId(initialSectionId)
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load assigned classes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClassesAndRoster()
  }, [])

  // Listen to Top Bar Context Switcher
  useEffect(() => {
    const handleContextSwitch = (e: any) => {
      const ctx = e.detail
      if (!ctx || !ctx.classId) return
      setSelectedClassId(String(ctx.classId))
      setSelectedSectionId(ctx.sectionId ? String(ctx.sectionId) : '')
    }

    window.addEventListener('ugbekun-context-changed', handleContextSwitch)
    return () => window.removeEventListener('ugbekun-context-changed', handleContextSwitch)
  }, [])

  // Available sections for current selected class
  const currentSections = useMemo(() => {
    if (!selectedClassId) return []
    const cls = assignedClasses.find((c) => String(c.id) === String(selectedClassId))
    return cls?.sections || []
  }, [assignedClasses, selectedClassId])

  // Handle Filter / Search Button Click
  const handleApplyFilter = async () => {
    try {
      setFiltering(true)
      const params = new URLSearchParams()
      if (selectedClassId) params.append('classId', selectedClassId)
      if (selectedSectionId) params.append('sectionId', selectedSectionId)
      if (studentSearchQuery.trim()) params.append('search', studentSearchQuery.trim())

      const res = await apiSlice.get<{
        success: boolean
        students: StudentRecord[]
        assignedClasses?: AssignedClass[]
      }>(endpoints.teacher.rosterFiltered(params.toString()))

      if (res.success) {
        setStudents(res.students || [])
        if (res.assignedClasses) {
          setAssignedClasses(res.assignedClasses)
        }
        toast.success(`Loaded ${res.students.length} student${res.students.length === 1 ? '' : 's'}`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to filter students.')
    } finally {
      setFiltering(false)
    }
  }

  // Client-side quick filter for fast live typing in search box
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return students
    const q = studentSearchQuery.toLowerCase().trim()
    return students.filter((s) => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
      const regNo = (s.registerNo || '').toLowerCase()
      const parentName = (s.parent?.name || '').toLowerCase()
      const parentPhone = (s.parent?.mobileno || '').toLowerCase()
      return fullName.includes(q) || regNo.includes(q) || parentName.includes(q) || parentPhone.includes(q)
    })
  }, [students, studentSearchQuery])

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Reset to first page when search filter or dataset changes
  useEffect(() => {
    setCurrentPage(1)
  }, [studentSearchQuery, selectedClassId, selectedSectionId, students.length])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredStudents.length)
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(startIndex, endIndex)
  }, [filteredStudents, startIndex, endIndex])

  // Send Parent Message
  const handleSendParentMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParent || !msgSubject.trim() || !msgBody.trim()) {
      toast.error('Please enter message subject and body.')
      return
    }

    try {
      setSendingMsg(true)
      const res = await apiSlice.post<{ success: boolean; message?: string }>(endpoints.teacher.sendMessage, {
        receiverId: selectedParent.id,
        receiverRole: 6, // Parent Role
        subject: msgSubject.trim(),
        body: msgBody.trim(),
      })

      if (res.success) {
        toast.success(`Notice delivered to ${selectedParent.name}`)
        setShowMsgModal(false)
        setMsgSubject('')
        setMsgBody('')
      } else {
        toast.error(res.message || 'Failed to send message.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to deliver message.')
    } finally {
      setSendingMsg(false)
    }
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-200/60">
            <Users size={14} />
            <span>Class Custody & Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Classes & Students</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Select and manage the classrooms assigned directly to your custody. Access student records, report cards, and parent communication channels.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Assigned Classes</span>
            <span className="text-lg font-black text-slate-800">{assignedClasses.length}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">Total Enrolled</span>
            <span className="text-lg font-black text-blue-700">{students.length}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Filter size={16} className="text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter By Assigned Class & Section</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Class Dropdown */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Select Class <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value)
                  setSelectedSectionId('') // Reset section on class change
                }}
                className="w-full h-11 px-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
              >
                {assignedClasses.length === 0 ? (
                  <option value="">No Classes Assigned</option>
                ) : (
                  assignedClasses.map((cls) => (
                    <option key={`cls-${cls.id}`} value={cls.id}>
                      {cls.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Section Dropdown */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full h-11 px-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
            >
              <option value="">All Sections</option>
              {currentSections.map((sec) => (
                <option key={`sec-${sec.id}`} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter / Search Button */}
          <div className="sm:col-span-5 flex items-center gap-2">
            <button
              onClick={handleApplyFilter}
              disabled={filtering || loading || assignedClasses.length === 0}
              className="h-11 flex-1 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
            >
              {filtering ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Loading Class...</span>
                </>
              ) : (
                <>
                  <Filter size={15} />
                  <span>FILTER / SEARCH</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Student Search Bar */}
        <div className="pt-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder="🔍 Search student by name, admission number or student ID..."
              className="w-full h-11 pl-10 pr-4 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />
            {studentSearchQuery && (
              <button
                onClick={() => setStudentSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STUDENTS ROSTER TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>Enrolled Students</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">
                {filteredStudents.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Only students enrolled in your assigned classrooms are visible.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('gradebook')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Building2 size={13} className="text-blue-600" />
                  <span>Enter Assessments</span>
                </button>
                <button
                  onClick={() => onNavigate('report-cards')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet size={13} />
                  <span>Report Cards</span>
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={28} />
            <p className="text-xs text-slate-500 font-medium">Loading your students...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="p-4">Reg No / ID</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Class & Section</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Parent / Guardian</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((st, idx) => (
                  <tr key={`st-${st.id}-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono text-slate-600 text-[11px] font-semibold">
                      {st.registerNo || `REG-${st.id}`}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden shrink-0 border border-blue-200">
                          <img
                            src={getAvatarUrl(st.photo, `${st.firstName} ${st.lastName}`)}
                            alt={`${st.firstName} ${st.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {st.firstName} {st.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: #{st.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200/60">
                        {st.className} {st.sectionName ? `(${st.sectionName})` : ''}
                      </span>
                    </td>
                    <td className="p-4 capitalize text-slate-600 font-medium">{st.gender || 'N/A'}</td>
                    <td className="p-4">
                      {st.parent ? (
                        <div>
                          <span className="font-bold text-slate-900 block">{st.parent.name}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {st.parent.fatherName ? `Father: ${st.parent.fatherName}` : (st.parent.motherName ? `Mother: ${st.parent.motherName}` : 'Guardian')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Parent Linked</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {st.parent?.mobileno ? (
                        <a
                          href={`tel:${st.parent.mobileno}`}
                          className="hover:text-blue-600 flex items-center gap-1 font-semibold"
                        >
                          <Phone size={11} className="text-slate-400" />
                          <span>{st.parent.mobileno}</span>
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {st.parent && (
                          <button
                            onClick={() => {
                              setSelectedParent({
                                id: st.parent!.id,
                                name: st.parent!.name,
                                studentName: `${st.firstName} ${st.lastName}`,
                              })
                              setShowMsgModal(true)
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer inline-flex items-center gap-1.5"
                            title="Message Guardian"
                          >
                            <Mail size={12} />
                            <span>Message</span>
                          </button>
                        )}
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate('report-cards')}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer inline-flex items-center gap-1"
                            title="View Report Card"
                          >
                            <FileSpreadsheet size={12} />
                            <span>Report</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredStudents.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Showing</span>
                <span className="font-bold text-slate-900 font-mono">
                  {filteredStudents.length === 0 ? 0 : startIndex + 1}–{endIndex}
                </span>
                <span>of</span>
                <span className="font-bold text-slate-900 font-mono">{filteredStudents.length}</span>
                <span>students</span>

                <span className="text-slate-300 mx-2">|</span>

                <label className="text-slate-500 font-medium">Per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prevPage = arr[idx - 1]
                      return (
                        <div key={`page-${p}`} className="flex items-center">
                          {prevPage && p - prevPage > 1 && (
                            <span className="px-1 text-slate-400 font-bold">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`h-8 min-w-[32px] px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                              currentPage === p
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white'
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      )
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
          </>
        ) : (
          <div className="p-16 text-center">
            <Users className="mx-auto text-slate-300 mb-3" size={36} />
            <h4 className="text-sm font-bold text-slate-800">No Students Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No students match your filter in the selected class and section.
            </p>
          </div>
        )}
      </div>

      {/* MESSAGE PARENT MODAL */}
      {showMsgModal && selectedParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="text-indigo-600" size={18} />
                Send Message to Guardian
              </h3>
              <button
                onClick={() => setShowMsgModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendParentMessage} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Parent / Guardian</label>
                <input
                  type="text"
                  readOnly
                  value={`${selectedParent.name} (Parent of ${selectedParent.studentName})`}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  placeholder="e.g. Academic Performance / Attendance Update"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Content *</label>
                <textarea
                  rows={4}
                  required
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Type your message to the parent here..."
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMsgModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sendingMsg ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send Notice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
