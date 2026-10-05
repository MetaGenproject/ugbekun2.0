'use client'

import { useState, useEffect } from 'react'
import {
  ListTodo,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Upload,
  Download,
  Eye,
  Save,
  AlertCircle,
  X,
  ExternalLink,
  BookOpen,
  Users,
  Search,
  Check,
  FileCheck,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'

interface AssignedClass {
  id: number
  name: string
  sections: Array<{ id: number; name: string }>
}

interface AssignedSubject {
  id: number
  name: string
}

interface HomeworkItem {
  id: number
  title: string
  description?: string
  className: string
  subjectName: string
  dueDate: string
  questions?: any
  submissionsCount?: number
  markedCount?: number
  totalStudents?: number
}

interface SubmissionRow {
  studentId: number
  name: string
  registerNo: string
  gender: string
  submissionId: number | null
  status: 'MARKED' | 'AWAITING_MARKING' | 'NOT_SUBMITTED' | 'MISSING'
  score: number | null
  maxScore: number
  feedback: string | null
  submittedAt: string | null
  fileAttachment?: {
    fileUrl: string
    fileName: string
    fileType?: string
  } | null
  answersCount?: number
}

export function TeacherAssignmentsManager() {
  // Selector Options
  const [classes, setClasses] = useState<AssignedClass[]>([])
  const [subjects, setSubjects] = useState<AssignedSubject[]>([])

  // Assignments List
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([])
  const [loadingList, setLoadingList] = useState(true)

  // Create Assignment Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newClassId, setNewClassId] = useState('')
  const [newSubjectId, setNewSubjectId] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newMaxMarks, setNewMaxMarks] = useState('20')
  const [assignmentMode, setAssignmentMode] = useState<'OFFLINE' | 'ONLINE_UPLOAD'>('OFFLINE')

  // Grading / Inspection View
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [savingGrades, setSavingGrades] = useState(false)
  const [submissionSearch, setSubmissionSearch] = useState('')

  // Load classes, subjects, and assignments on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingList(true)
        const [classesRes, subjectsRes, hwRes] = await Promise.all([
          apiSlice.get<{ success: boolean; assignedClasses: AssignedClass[] }>(endpoints.teacher.roster).catch(() => ({ success: false, assignedClasses: [] })),
          apiSlice.get<{ success: boolean; subjects: AssignedSubject[]; assignedSubjects?: any[] }>(endpoints.teacher.subjects).catch(() => ({ success: false, subjects: [], assignedSubjects: [] })),
          apiSlice.get<{ success: boolean; homeworks: HomeworkItem[] }>(endpoints.teacher.homeworks).catch(() => ({ success: false, homeworks: [] })),
        ])

        if (classesRes.success && classesRes.assignedClasses && classesRes.assignedClasses.length > 0) {
          setClasses(classesRes.assignedClasses)

          let initialClassId = String(classesRes.assignedClasses[0].id)
          try {
            const storedJson = typeof window !== 'undefined' ? localStorage.getItem('ugbekun_teacher_active_context') : null
            if (storedJson) {
              const ctx = JSON.parse(storedJson)
              if (ctx.classId && classesRes.assignedClasses.some((c) => c.id === ctx.classId)) {
                initialClassId = String(ctx.classId)
              }
            }
          } catch {
            // ignore
          }
          setNewClassId(initialClassId)
        }

        if (subjectsRes.success) {
          const rawSubjects = (subjectsRes.assignedSubjects && subjectsRes.assignedSubjects.length > 0)
            ? subjectsRes.assignedSubjects.map((s: any) => ({ id: s.subjectId || s.id, name: s.subjectName || s.name }))
            : (subjectsRes.subjects || [])
          
          const uniqueSubjects = Array.from(new Map(rawSubjects.map((s: any) => [s.id, s])).values())
          setSubjects(uniqueSubjects as any)
          if (uniqueSubjects.length > 0) {
            setNewSubjectId(String(uniqueSubjects[0].id))
          }
        }

        if (hwRes.success && hwRes.homeworks) {
          setHomeworks(hwRes.homeworks)
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load assignments.')
      } finally {
        setLoadingList(false)
      }
    }

    loadData()
  }, [])

  // Listen to Top Bar Context Switcher
  useEffect(() => {
    const handleContextSwitch = (e: any) => {
      const ctx = e.detail
      if (!ctx || !ctx.classId) return
      setNewClassId(String(ctx.classId))
    }

    window.addEventListener('ugbekun-context-changed', handleContextSwitch)
    return () => window.removeEventListener('ugbekun-context-changed', handleContextSwitch)
  }, [])

  // Create new assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newClassId || !newSubjectId || !newDueDate) {
      toast.error('Please complete all required fields.')
      return
    }

    try {
      setCreating(true)
      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim() || `Complete assignment as instructed (${assignmentMode} submission)`,
        classId: Number(newClassId),
        subjectId: Number(newSubjectId),
        dueDate: newDueDate,
        totalMarks: Number(newMaxMarks) || 20,
        submissionMode: assignmentMode,
      }

      const res = await apiSlice.post<{ success: boolean; homework: HomeworkItem; message?: string }>(
        endpoints.teacher.homeworks,
        payload
      )

      if (res.success) {
        toast.success('Assignment published successfully.')
        setShowCreateModal(false)
        setNewTitle('')
        setNewDescription('')
        // Refresh list
        const refreshed = await apiSlice.get<{ success: boolean; homeworks: HomeworkItem[] }>(
          endpoints.teacher.homeworks
        )
        if (refreshed.success) setHomeworks(refreshed.homeworks)
      } else {
        toast.error(res.message || 'Failed to create assignment.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error creating assignment.')
    } finally {
      setCreating(false)
    }
  }

  // Open homework submissions inspection sheet
  const handleOpenSubmissions = async (hw: HomeworkItem) => {
    setSelectedHomework(hw)
    try {
      setLoadingSubmissions(true)
      const res = await apiSlice.get<{
        success: boolean
        submissions: SubmissionRow[]
      }>(endpoints.teacher.homeworkSubmissions(hw.id))

      if (res.success) {
        setSubmissions(res.submissions || [])
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load submissions.')
    } finally {
      setLoadingSubmissions(false)
    }
  }

  // Handle score change in submissions grading table
  const handleScoreChange = (studentId: number, scoreVal: string) => {
    const num = scoreVal === '' ? null : Math.max(0, Number(scoreVal) || 0)
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s
        return {
          ...s,
          score: num,
          status: num !== null ? 'MARKED' : (s.submittedAt ? 'AWAITING_MARKING' : 'NOT_SUBMITTED'),
        }
      })
    )
  }

  // Handle feedback comment change in submissions grading table
  const handleFeedbackChange = (studentId: number, text: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, feedback: text } : s))
    )
  }

  // Save all graded submissions in batch
  const handleSaveAllGrades = async () => {
    if (!selectedHomework) return

    try {
      setSavingGrades(true)
      const gradesPayload = submissions
        .filter((s) => s.score !== null)
        .map((s) => ({
          studentId: s.studentId,
          score: Number(s.score),
          feedback: s.feedback || 'Marked',
        }))

      const res = await apiSlice.post<{ success: boolean; message?: string }>(
        endpoints.teacher.batchGradeHomework(selectedHomework.id),
        { grades: gradesPayload }
      )

      if (res.success) {
        toast.success('Assignment grades saved! Results are now visible to parents.')
        // Refresh submissions
        handleOpenSubmissions(selectedHomework)
      } else {
        toast.error(res.message || 'Failed to save grades.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error committing grades.')
    } finally {
      setSavingGrades(false)
    }
  }

  // Filtered submissions list
  const filteredSubmissions = submissions.filter((s) => {
    if (!submissionSearch.trim()) return true
    const q = submissionSearch.toLowerCase().trim()
    return s.name.toLowerCase().includes(q) || s.registerNo.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2 border border-indigo-200/60">
            <ListTodo size={14} />
            <span>Online & Offline Assignments</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assignment Management</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Create online and offline homework, inspect student file uploads (PDF, Word, Images), manually enter marks, and instantly publish scores to the Parent Dashboard.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="h-11 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-xs hover:shadow cursor-pointer"
        >
          <Plus size={16} />
          <span>New Assignment</span>
        </button>
      </div>

      {/* VIEW: INSPECT SUBMISSIONS OR ASSIGNMENT LIST */}
      {selectedHomework ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Submissions Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setSelectedHomework(null)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer transition"
                >
                  ← Back to Assignments
                </button>
                <span className="text-xs font-bold text-slate-400">•</span>
                <span className="text-xs font-bold text-indigo-700">{selectedHomework.className}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">{selectedHomework.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Subject: <span className="font-bold text-slate-700">{selectedHomework.subjectName}</span> | Due Date:{' '}
                <span className="font-bold text-slate-700">
                  {new Date(selectedHomework.dueDate).toLocaleDateString()}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleSaveAllGrades}
                disabled={savingGrades || loadingSubmissions}
                className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingGrades ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving Grades...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save All Scores</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Submissions Search & Status Filter */}
          <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                placeholder="Search student or reg no..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Marked
              </span>
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Awaiting Marking
              </span>
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Not Submitted
              </span>
            </div>
          </div>

          {/* Submissions Table */}
          {loadingSubmissions ? (
            <div className="p-16 text-center">
              <Loader2 className="animate-spin text-indigo-600 mx-auto mb-3" size={28} />
              <p className="text-xs text-slate-500 font-medium">Loading class submissions...</p>
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">Reg No</th>
                    <th className="p-4">Student</th>
                    <th className="p-4 text-center">Submission Status</th>
                    <th className="p-4 text-center">File Attachment</th>
                    <th className="p-4 text-center w-28">Score (Max: 20)</th>
                    <th className="p-4">Teacher Feedback / Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((st, idx) => (
                    <tr key={`sub-st-${st.studentId}`} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="p-4 font-mono text-slate-600 font-semibold">{st.registerNo || 'N/A'}</td>
                      <td className="p-4 font-bold text-slate-900">{st.name}</td>

                      {/* Status Indicator */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            st.status === 'MARKED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : st.status === 'AWAITING_MARKING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              st.status === 'MARKED'
                                ? 'bg-blue-600'
                                : st.status === 'AWAITING_MARKING'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>
                            {st.status === 'MARKED'
                              ? 'Marked'
                              : st.status === 'AWAITING_MARKING'
                              ? 'Submitted — Awaiting Marking'
                              : 'Not Submitted'}
                          </span>
                        </span>
                      </td>

                      {/* Student File Attachment (PDF, Word, Image) */}
                      <td className="p-4 text-center">
                        {st.fileAttachment ? (
                          <a
                            href={st.fileAttachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition border border-indigo-200"
                          >
                            <ExternalLink size={12} />
                            <span className="truncate max-w-[120px]">{st.fileAttachment.fileName}</span>
                          </a>
                        ) : st.submittedAt ? (
                          <span className="text-[11px] text-slate-500 italic">Online text/quiz</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No upload</span>
                        )}
                      </td>

                      {/* Score Input */}
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={20}
                          value={st.score ?? ''}
                          onChange={(e) => handleScoreChange(st.studentId, e.target.value)}
                          placeholder="—"
                          className="w-20 h-9 text-center font-bold font-mono text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Teacher Comment */}
                      <td className="p-4">
                        <input
                          type="text"
                          value={st.feedback || ''}
                          onChange={(e) => handleFeedbackChange(st.studentId, e.target.value)}
                          placeholder="e.g. Excellent work / Needs improvement"
                          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500 text-xs">
              No students enrolled in this assignment&apos;s class.
            </div>
          )}
        </div>
      ) : (
        /* ASSIGNMENTS LIST VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>My Assignments</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
                {homeworks.length}
              </span>
            </h3>
          </div>

          {loadingList ? (
            <div className="p-16 text-center">
              <Loader2 className="animate-spin text-indigo-600 mx-auto mb-3" size={28} />
              <p className="text-xs text-slate-500 font-medium">Loading assignments...</p>
            </div>
          ) : homeworks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">Assignment Title</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4 text-center">Submissions / Marked</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {homeworks.map((hw) => (
                    <tr key={`hw-${hw.id}`} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{hw.title}</span>
                        {hw.description && (
                          <span className="text-[11px] text-slate-400 line-clamp-1">{hw.description}</span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-indigo-600">{hw.className}</td>
                      <td className="p-4 text-slate-700 font-medium">{hw.subjectName}</td>
                      <td className="p-4 text-slate-600 font-mono">
                        {new Date(hw.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                          <span>{hw.markedCount ?? 0}</span>
                          <span className="text-slate-400">/</span>
                          <span>{hw.submissionsCount ?? 0} Submitted</span>
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenSubmissions(hw)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye size={13} />
                          <span>Mark & Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <ListTodo className="mx-auto text-slate-300 mb-3" size={36} />
              <h4 className="text-sm font-bold text-slate-800">No Assignments Created Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click &apos;New Assignment&apos; above to assign homework to your classrooms.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ListTodo className="text-indigo-600" size={18} />
                Create New Assignment
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assignment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Mathematics — Holiday Assignment"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={`c-opt-${c.id}`} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    {subjects.map((s) => (
                      <option key={`s-opt-${s.id}`} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Submission Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('OFFLINE')}
                    className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition ${
                      assignmentMode === 'OFFLINE'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Offline (Paper / Manual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('ONLINE_UPLOAD')}
                    className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition ${
                      assignmentMode === 'ONLINE_UPLOAD'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Student File Upload (PDF/Doc)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Details of exercises, pages, or tasks to complete..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Publish Assignment</span>
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
