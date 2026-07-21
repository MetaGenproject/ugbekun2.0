'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { QuestionBankManager } from '../teacher/question-bank-manager'
import {
  Calendar,
  Clock,
  Trash2,
  Edit2,
  FolderOpen,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Award,
  ListFilter,
  Users
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

interface OnlineExam {
  id: number
  title: string
  classId: number
  subjectId: number
  passingMark: number
  duration: number
  examDate: string | null
  createdAt: string
  class: {
    id: number
    name: string
  }
  subject: {
    id: number
    name: string
  }
}

interface Submission {
  id: number
  student: {
    id: number
    firstName: string
    lastName: string
    registerNo: string
  }
  totalMark: number
  createdAt: string
  submittedAt: string | null
}

export function AdminCbtManager() {
  const [activeTab, setActiveTab] = useState<'exams' | 'bank'>('exams')
  
  // Data lists
  const [exams, setExams] = useState<OnlineExam[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  
  // Loaders & Errors
  const [loadingExams, setLoadingExams] = useState(true)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modals state
  const [editingExam, setEditingExam] = useState<OnlineExam | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPassingMark, setEditPassingMark] = useState(50)
  const [editDuration, setEditDuration] = useState(30)
  const [editExamDate, setEditExamDate] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const [viewingSubmissionsExam, setViewingSubmissionsExam] = useState<OnlineExam | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  // Load configuration (Classes and Subjects)
  const loadConfig = async () => {
    setLoadingConfig(true)
    try {
      const [classRes, subjectRes] = await Promise.all([
        apiSlice.get<{ success: boolean; classes: any[] }>(endpoints.admin.classesSections),
        apiSlice.get<{ success: boolean; subjects: any[] }>(endpoints.admin.subjects)
      ])
      
      if (classRes.success && classRes.classes) {
        setClasses(classRes.classes)
      }
      if (subjectRes.success && subjectRes.subjects) {
        setSubjects(subjectRes.subjects)
      }
    } catch (err) {
      console.error('[ADMIN CBT] Config fetch error:', err)
    } finally {
      setLoadingConfig(false)
    }
  }

  // Load exams
  const loadExams = async () => {
    setLoadingExams(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; exams: OnlineExam[] }>(
        endpoints.teacher.onlineExams
      )
      if (res.success && res.exams) {
        setExams(res.exams)
      } else {
        setError('Failed to fetch online exams.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching exams.')
    } finally {
      setLoadingExams(false)
    }
  }

  useEffect(() => {
    loadConfig()
    loadExams()
  }, [])

  // Action: Open Edit timing modal
  const openEditModal = (exam: OnlineExam) => {
    setEditingExam(exam)
    setEditTitle(exam.title)
    setEditPassingMark(exam.passingMark)
    setEditDuration(exam.duration)
    
    // Format Date ISO for datetime-local value (YYYY-MM-DDTHH:MM)
    if (exam.examDate) {
      const d = new Date(exam.examDate)
      // Account for local timezone offset
      const tzOffset = d.getTimezoneOffset() * 60000
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16)
      setEditExamDate(localISOTime)
    } else {
      setEditExamDate('')
    }
    setUpdatingStatus('idle')
  }

  // Action: Submit updated timings
  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExam) return

    setUpdatingStatus('loading')
    try {
      const res = await apiSlice.put<{ success: boolean }>(
        endpoints.teacher.onlineExamItem(editingExam.id),
        {
          title: editTitle,
          passingMark: editPassingMark,
          duration: editDuration,
          examDate: editExamDate || null
        }
      )
      if (res.success) {
        setUpdatingStatus('success')
        loadExams()
        setTimeout(() => {
          setEditingExam(null)
        }, 1200)
      } else {
        setUpdatingStatus('error')
      }
    } catch (err) {
      console.error(err)
      setUpdatingStatus('error')
    }
  }

  // Action: Delete online exam
  const handleDeleteExam = async (examId: number) => {
    if (!confirm('Are you sure you want to delete this scheduled CBT exam? This will permanently delete student submissions for this assessment.')) return
    try {
      const res = await apiSlice.delete<{ success: boolean }>(
        endpoints.teacher.onlineExamItem(examId)
      )
      if (res.success) {
        setExams(prev => prev.filter(x => x.id !== examId))
      }
    } catch (err) {
      console.error(err)
      alert('Failed to delete CBT exam.')
    }
  }

  // Action: View student submissions
  const handleViewSubmissions = async (exam: OnlineExam) => {
    setViewingSubmissionsExam(exam)
    setLoadingSubmissions(true)
    setSubmissions([])
    try {
      const res = await apiSlice.get<{ success: boolean; submissions: Submission[] }>(
        endpoints.teacher.onlineExamSubmissions(exam.id)
      )
      if (res.success && res.submissions) {
        setSubmissions(res.submissions)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  // Cartesian Product mapping to reuse QuestionBankManager:
  // Since Admins manage the entire school, we construct class-subject pairs dynamically
  // so that the admin is allowed to distribute standard questions for any class and subject.
  const adminProfile = {
    subjectAssignments: subjects.flatMap(sub =>
      classes.map(cls => ({
        subjectId: sub.id,
        subjectName: sub.name,
        classId: cls.id,
        className: cls.name
      }))
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 p-6 md:p-8 shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="px-2.5 py-1 text-xs font-bold text-blue-300 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-sm inline-block">
              CBT TIMINGS & SCHEDULING
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">CBT Assessment Control Room</h1>
            <p className="text-slate-400 text-xs max-w-xl font-semibold leading-relaxed">
              Plan school-wide examinations, allocate Question Bank resources, schedule assessment release times, and review grading reports.
            </p>
          </div>

          <div className="flex bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl gap-1 shrink-0 shadow-lg">
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === 'exams'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scheduled Exams
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === 'bank'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Question Bank
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'exams' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ListFilter className="text-blue-600" size={18} />
                Branch CBT Schedules
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Manage start timings, duration constraints, and view student completion logs.
              </p>
            </div>
            
            <button
              onClick={loadExams}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Refresh List
            </button>
          </div>

          {loadingExams ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={28} />
              <p className="text-slate-400 text-xs font-bold">Synchronizing exam list...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-500 font-bold text-xs bg-rose-50 border border-rose-100 rounded-2xl flex flex-col items-center justify-center gap-2">
              <AlertCircle size={24} />
              <span>{error}</span>
            </div>
          ) : exams.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Calendar size={22} />
              </div>
              <p className="text-slate-400 text-xs font-bold">No online exams scheduled yet.</p>
              <p className="text-slate-400 text-[10px] font-semibold mt-1">Use the Question Bank tab to select questions and distribute them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide">CBT Title</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide">Classroom</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide">Subject</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide">Duration</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide">Scheduled Start</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((ex) => {
                    const isUpcoming = ex.examDate ? new Date(ex.examDate).getTime() > Date.now() : false
                    return (
                      <TableRow key={ex.id} className="hover:bg-slate-50/50 transition">
                        <TableCell className="font-bold text-slate-800 text-xs max-w-[200px] truncate">{ex.title}</TableCell>
                        <TableCell className="font-semibold text-slate-600 text-xs">{ex.class?.name || 'General'}</TableCell>
                        <TableCell className="font-semibold text-slate-600 text-xs">
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-md text-[10px] font-bold">
                            {ex.subject?.name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-600 text-xs">{ex.duration} mins</TableCell>
                        <TableCell className="font-bold text-slate-700 text-xs">
                          {ex.examDate ? (
                            <span className="flex items-center gap-1.5">
                              <Clock size={12} className="text-violet-500" />
                              {new Date(ex.examDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold italic">Immediate / Always Available</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {ex.examDate ? (
                            isUpcoming ? (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-violet-50 border border-violet-200 text-violet-700 rounded-full">
                                Scheduled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full">
                                Live
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-blue-50 border border-blue-200 text-blue-700 rounded-full">
                              Active
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => handleViewSubmissions(ex)}
                              title="View student completions"
                              className="px-2 py-1 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Users size={11} />
                              Completions
                            </button>
                            
                            <button
                              onClick={() => openEditModal(ex)}
                              title="Edit exam timings"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-200 cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              onClick={() => handleDeleteExam(ex.id)}
                              title="Delete exam"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableCaption>{exams.length} active CBT assessment schedule{exams.length === 1 ? '' : 's'}.</TableCaption>
              </Table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6">
          <QuestionBankManager profile={adminProfile} />
        </div>
      )}

      {/* TIMING CONFIGURATION MODAL */}
      {editingExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden transform transition duration-300 scale-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="text-blue-600" size={18} />
                Edit CBT Timings & Schedule
              </h3>
              <button
                onClick={() => setEditingExam(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {updatingStatus === 'success' ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
                  <CheckCircle2 size={24} className="stroke-[3]" />
                </div>
                <h4 className="text-sm font-black text-slate-800">Exam Timings Updated!</h4>
                <p className="text-xs text-slate-400 font-medium">
                  The schedule configurations have been broadcasted.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpdateExam} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">CBT Assessment Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Passing Mark (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={editPassingMark}
                      onChange={(e) => setEditPassingMark(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Scheduled Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={editExamDate}
                    onChange={(e) => setEditExamDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition cursor-pointer"
                  />
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">If blank, the exam is immediately open to students and doesn't locked.</p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingExam(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStatus === 'loading'}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    {updatingStatus === 'loading' && <Loader2 className="animate-spin" size={13} />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* COMPLETIONS / SUBMISSIONS DIALOG */}
      {viewingSubmissionsExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden transform transition duration-300 scale-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="text-indigo-600" size={18} />
                  Student Completions Report
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                  {viewingSubmissionsExam.title} · {viewingSubmissionsExam.subject?.name} · {viewingSubmissionsExam.class?.name}
                </p>
              </div>
              <button
                onClick={() => setViewingSubmissionsExam(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-indigo-600" size={28} />
                <p className="text-slate-400 text-xs font-bold">Retrieving completion logs...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <User size={20} />
                </div>
                <p className="text-slate-400 text-xs font-bold">No submissions received yet.</p>
                <p className="text-[9px] text-slate-400 font-semibold mt-1">Students will appear here once they complete and submit their attempts.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide">Register No</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide">Student Name</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide">Submitted At</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wide text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-slate-50/50 transition">
                        <TableCell className="font-bold text-slate-800 text-xs">{sub.student.registerNo || 'N/A'}</TableCell>
                        <TableCell className="font-semibold text-slate-600 text-xs">
                          {sub.student.lastName}, {sub.student.firstName}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-500 text-xs">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell className="font-black text-right text-xs">
                          <span className={`px-2 py-0.5 rounded-md ${sub.totalMark >= viewingSubmissionsExam.passingMark ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                            {sub.totalMark} marks
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingSubmissionsExam(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
