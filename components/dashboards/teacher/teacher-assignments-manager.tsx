'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
  Trash2,
  FileUp,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Filter,
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
  attachmentUrl?: string | null
  attachmentName?: string | null
  submissionMode?: 'ONLINE_QUESTIONS' | 'FILE_UPLOAD' | 'OFFLINE'
  maxMarks?: number
  submissionsCount?: number
  markedCount?: number
  totalStudents?: number
}

interface SubmissionRow {
  studentId: number
  name: string
  firstName?: string
  lastName?: string
  registerNo: string
  gender?: string
  sectionName?: string
  submissionId: number | null
  submitted?: boolean
  status: 'MARKED' | 'AWAITING_MARKING' | 'NOT_SUBMITTED' | 'MISSING'
  score: number | null
  maxScore: number
  feedback: string | null
  submittedAt: string | null
  fileUrl?: string | null
  fileName?: string | null
  fileAttachment?: {
    fileUrl: string
    fileName: string
    fileType?: string
  } | null
  submissionType?: string
  answers?: any
}

interface QuestionDraft {
  id: string
  questionText: string
  type: 'MCQ' | 'TF' | 'THEORY'
  options: string[]
  correctAnswer: string
  points: number
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
  const [assignmentMode, setAssignmentMode] = useState<'ONLINE_QUESTIONS' | 'FILE_UPLOAD' | 'OFFLINE'>('ONLINE_QUESTIONS')

  // Online Questions Builder State
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      id: 'q-1',
      questionText: '',
      type: 'MCQ',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      points: 5,
    },
  ])

  // Teacher Question Document Attachment State ("Upload for Download")
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Grading / Inspection View State
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [savingGrades, setSavingGrades] = useState(false)
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null)
  const [submissionSearch, setSubmissionSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MARKED' | 'AWAITING_MARKING' | 'NOT_SUBMITTED'>('ALL')

  // Access / Privilege Notice State
  const [accessNotice, setAccessNotice] = useState<string | null>(null)

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
            : []
          
          const uniqueSubjects = Array.from(new Map(rawSubjects.map((s: any) => [s.id, s])).values())
          setSubjects(uniqueSubjects as any)
          if (uniqueSubjects.length > 0) {
            setNewSubjectId(String(uniqueSubjects[0].id))
            setAccessNotice(null)
          } else {
            setAccessNotice("Accessed can not be granted meet Admin for the priveleges..")
          }
        } else {
          setAccessNotice("Accessed can not be granted meet Admin for the priveleges..")
        }

        if (hwRes.success && hwRes.homeworks) {
          setHomeworks(hwRes.homeworks)
        }
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err || '')
        if (msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('privilege') || (err as any)?.status === 403) {
          setAccessNotice("Accessed can not be granted meet Admin for the priveleges..")
        } else {
          toast.error(msg || 'Failed to load assignments.')
        }
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
      if (ctx.subjectId) {
        setNewSubjectId(String(ctx.subjectId))
      }
    }

    window.addEventListener('ugbekun-context-changed', handleContextSwitch)
    return () => window.removeEventListener('ugbekun-context-changed', handleContextSwitch)
  }, [])

  // Auto-calculate total points if in ONLINE_QUESTIONS mode
  useEffect(() => {
    if (assignmentMode === 'ONLINE_QUESTIONS') {
      const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0)
      if (totalPoints > 0) {
        setNewMaxMarks(String(totalPoints))
      }
    }
  }, [questions, assignmentMode])

  // Question draft management handlers
  const handleAddQuestion = () => {
    const nextNum = questions.length + 1
    setQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        questionText: '',
        type: 'MCQ',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        points: 5,
      },
    ])
  }

  const handleRemoveQuestion = (id: string) => {
    if (questions.length <= 1) {
      toast.error('You need at least one question.')
      return
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handleUpdateQuestion = (id: string, updates: Partial<QuestionDraft>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        const updated = { ...q, ...updates }
        // If type changed to TF, set default options
        if (updates.type === 'TF') {
          updated.options = ['True', 'False']
          if (updated.correctAnswer !== 'True' && updated.correctAnswer !== 'False') {
            updated.correctAnswer = 'True'
          }
        } else if (updates.type === 'THEORY') {
          updated.options = []
          updated.correctAnswer = ''
        }
        return updated
      })
    )
  }

  const handleOptionChange = (qId: string, optIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q
        const nextOptions = [...q.options]
        const oldOpt = nextOptions[optIndex]
        nextOptions[optIndex] = val
        let nextCorrect = q.correctAnswer
        if (q.correctAnswer === oldOpt) {
          nextCorrect = val
        }
        return { ...q, options: nextOptions, correctAnswer: nextCorrect }
      })
    )
  }

  const handleAddOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q
        if (q.options.length >= 6) {
          toast.error('Maximum 6 options allowed.')
          return q
        }
        const letter = String.fromCharCode(65 + q.options.length)
        return { ...q, options: [...q.options, `Option ${letter}`] }
      })
    )
  }

  const handleRemoveOption = (qId: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q
        if (q.options.length <= 2) {
          toast.error('At least 2 options required for MCQ.')
          return q
        }
        const nextOptions = q.options.filter((_, idx) => idx !== optIndex)
        let nextCorrect = q.correctAnswer
        if (!nextOptions.includes(nextCorrect)) {
          nextCorrect = nextOptions[0]
        }
        return { ...q, options: nextOptions, correctAnswer: nextCorrect }
      })
    )
  }

  // Teacher Question Document / Worksheet Uploader Handler ("Upload for Download")
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit.')
      return
    }

    try {
      setUploadingAttachment(true)
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1]
        try {
          const res = await apiSlice.post<{ success: boolean; url: string; fileName?: string }>(
            endpoints.teacher.uploadHomework,
            {
              base64: base64Data,
              mime: file.type || 'application/octet-stream',
              fileName: file.name,
            }
          )
          if (res.success && res.url) {
            setAttachmentUrl(res.url)
            setAttachmentName(file.name)
            toast.success(`Attached "${file.name}" successfully!`)
          } else {
            toast.error('Failed to attach document.')
          }
        } catch (err: any) {
          toast.error(err.message || 'Error uploading assignment attachment.')
        } finally {
          setUploadingAttachment(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setUploadingAttachment(false)
      toast.error('Could not process attachment.')
    }
  }

  // Create new assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newClassId || !newSubjectId || !newDueDate) {
      toast.error('Please complete all required fields.')
      return
    }

    // Validate questions if online questions mode
    if (assignmentMode === 'ONLINE_QUESTIONS') {
      const emptyQ = questions.find((q) => !q.questionText.trim())
      if (emptyQ) {
        toast.error('Please enter the question text for all set questions.')
        return
      }
    }

    try {
      setCreating(true)

      const payloadQuestions =
        assignmentMode === 'ONLINE_QUESTIONS'
          ? questions.map((q) => ({
              questionText: q.questionText.trim(),
              type: q.type,
              questionType: q.type.toLowerCase(),
              options: q.type === 'MCQ' || q.type === 'TF' ? q.options : [],
              correctAnswer: q.correctAnswer,
              points: Number(q.points) || 1,
            }))
          : []

      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim() || `Complete assignment as instructed (${assignmentMode === 'FILE_UPLOAD' ? 'Document Upload & Write-up' : assignmentMode === 'ONLINE_QUESTIONS' ? 'Online Interactive Questions' : 'Offline Manual Submission'})`,
        classId: Number(newClassId),
        subjectId: Number(newSubjectId),
        dueDate: newDueDate,
        maxMarks: Number(newMaxMarks) || 20,
        submissionMode: assignmentMode,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        questions: payloadQuestions,
      }

      const res = await apiSlice.post<{ success: boolean; homework: HomeworkItem; message?: string }>(
        endpoints.teacher.homeworks,
        payload
      )

      if (res.success) {
        toast.success('Assignment published successfully!')
        setShowCreateModal(false)
        setNewTitle('')
        setNewDescription('')
        setAttachmentUrl(null)
        setAttachmentName(null)
        setQuestions([
          {
            id: 'q-1',
            questionText: '',
            type: 'MCQ',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            points: 5,
          },
        ])
        // Refresh homeworks list
        const refreshed = await apiSlice.get<{ success: boolean; homeworks: HomeworkItem[] }>(
          endpoints.teacher.homeworks
        )
        if (refreshed.success && refreshed.homeworks) setHomeworks(refreshed.homeworks)
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
    setStatusFilter('ALL')
    setSubmissionSearch('')
    try {
      setLoadingSubmissions(true)
      const res = await apiSlice.get<{
        success: boolean
        submissions: SubmissionRow[]
        homework?: any
      }>(endpoints.teacher.homeworkSubmissions(hw.id))

      if (res.success) {
        setSubmissions(res.submissions || [])
        if (res.homework) {
          setSelectedHomework((prev) => (prev ? { ...prev, ...res.homework } : hw))
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load submissions.')
    } finally {
      setLoadingSubmissions(false)
    }
  }

  // Handle score change in submissions table
  const handleScoreChange = (studentId: number, scoreVal: string) => {
    const num = scoreVal === '' ? null : Math.max(0, Number(scoreVal))
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s
        return {
          ...s,
          score: num,
          status: num !== null ? 'MARKED' : (s.submitted || s.submittedAt ? 'AWAITING_MARKING' : 'NOT_SUBMITTED'),
        }
      })
    )
  }

  // Handle feedback change in submissions table
  const handleFeedbackChange = (studentId: number, text: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, feedback: text } : s))
    )
  }

  // Save single student score
  const handleSaveSingleGrade = async (studentId: number) => {
    const st = submissions.find((s) => s.studentId === studentId)
    if (!st || !selectedHomework) return

    try {
      setSavingStudentId(studentId)
      const res = await apiSlice.post<{ success: boolean; message?: string }>(
        endpoints.teacher.batchGradeHomework(selectedHomework.id),
        {
          grades: [
            {
              studentId: st.studentId,
              score: st.score !== null ? Number(st.score) : null,
              feedback: st.feedback || 'Marked by teacher',
            },
          ],
        }
      )

      if (res.success) {
        toast.success(`Score for ${st.name} saved!`)
        setSubmissions((prev) =>
          prev.map((s) =>
            s.studentId === studentId
              ? { ...s, status: s.score !== null ? 'MARKED' : s.status }
              : s
          )
        )
      } else {
        toast.error(res.message || 'Failed to save score.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving score.')
    } finally {
      setSavingStudentId(null)
    }
  }

  // Save all graded submissions in batch
  const handleSaveAllGrades = async () => {
    if (!selectedHomework) return

    try {
      setSavingGrades(true)
      const gradesPayload = submissions
        .filter((s) => s.score !== null && s.score !== undefined)
        .map((s) => ({
          studentId: s.studentId,
          score: Number(s.score),
          feedback: s.feedback || 'Marked by teacher',
        }))

      if (gradesPayload.length === 0) {
        toast.error('No scores have been filled in to save.')
        return
      }

      const res = await apiSlice.post<{ success: boolean; message?: string }>(
        endpoints.teacher.batchGradeHomework(selectedHomework.id),
        { grades: gradesPayload }
      )

      if (res.success) {
        toast.success('Assignment scores saved! Updated records are now visible to parents.')
        // Reload submissions
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

  // KPI Metrics Calculation
  const totalRosterCount = submissions.length
  const markedStudentsCount = submissions.filter((s) => s.status === 'MARKED').length
  const awaitingMarkingCount = submissions.filter((s) => s.status === 'AWAITING_MARKING').length
  const notAttemptedCount = submissions.filter((s) => s.status === 'NOT_SUBMITTED' || s.status === 'MISSING').length

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // 1. Search Query
      if (submissionSearch.trim()) {
        const q = submissionSearch.toLowerCase().trim()
        const matchName = (s.name || '').toLowerCase().includes(q)
        const matchReg = (s.registerNo || '').toLowerCase().includes(q)
        if (!matchName && !matchReg) return false
      }

      // 2. Status Pill Filter
      if (statusFilter === 'MARKED') return s.status === 'MARKED'
      if (statusFilter === 'AWAITING_MARKING') return s.status === 'AWAITING_MARKING'
      if (statusFilter === 'NOT_SUBMITTED') return s.status === 'NOT_SUBMITTED' || s.status === 'MISSING'

      return true
    })
  }, [submissions, submissionSearch, statusFilter])

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Access / Privileges Notice Banner */}
      {accessNotice && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/95 p-4 sm:p-5 shadow-xs flex items-start gap-3.5 animate-in fade-in">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
            <AlertCircle size={22} className="text-amber-700" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-950">Subject Assignment Privileges Notice</h4>
            <p className="text-xs sm:text-sm text-amber-800 font-medium mt-0.5">
              {accessNotice}
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2 border border-indigo-200/60">
            <ListTodo size={14} />
            <span>Interactive Online & Document Assignments</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assignment Management</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Set online questions manually, upload worksheets for students to download & submit write-ups, inspect student document uploads, and enter scores with instant parent portal synchronization.
          </p>
        </div>

        <button
          onClick={() => {
            if (subjects.length === 0) {
              setAccessNotice("Accessed can not be granted meet Admin for the priveleges..")
              return
            }
            setShowCreateModal(true)
            setAssignmentMode('ONLINE_QUESTIONS')
          }}
          disabled={subjects.length === 0}
          className="h-11 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-xs hover:shadow cursor-pointer shrink-0 disabled:cursor-not-allowed"
          title={subjects.length === 0 ? "Accessed can not be granted meet Admin for the priveleges.." : "New Assignment"}
        >
          <Plus size={16} />
          <span>New Assignment</span>
        </button>
      </div>

      {/* VIEW: INSPECT SUBMISSIONS OR ASSIGNMENTS LIST */}
      {selectedHomework ? (
        <div className="space-y-6">
          {/* Submissions Detail Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedHomework(null)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition flex items-center gap-1"
                >
                  ← Back to Assignments
                </button>
                <span className="text-xs text-slate-300">•</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px]">
                  {selectedHomework.className}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-extrabold text-[11px]">
                  {selectedHomework.subjectName}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 tracking-tight pt-1">{selectedHomework.title}</h2>
              {selectedHomework.description && (
                <p className="text-xs text-slate-500 max-w-2xl">{selectedHomework.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  Due Date: <strong className="text-slate-900">{new Date(selectedHomework.dueDate).toLocaleDateString()}</strong>
                </span>
                <span>•</span>
                <span>
                  Max Score: <strong className="text-slate-900">{selectedHomework.maxMarks || 20} pts</strong>
                </span>
                {selectedHomework.attachmentUrl && (
                  <>
                    <span>•</span>
                    <a
                      href={selectedHomework.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      <Download size={13} />
                      <span>Attached Worksheet ({selectedHomework.attachmentName || 'Download'})</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={handleSaveAllGrades}
                disabled={savingGrades || loadingSubmissions}
                className="h-11 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingGrades ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving All Scores...</span>
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

          {/* 4 KPI SUMMARY CARDS: Total, Attempted & Graded, Pending Review, Not Attempted */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Class Enrolled */}
            <div
              onClick={() => setStatusFilter('ALL')}
              className={`p-5 rounded-2xl border transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/40'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Class Roster
                </span>
                <Users size={16} className={statusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black">{totalRosterCount}</span>
                <span className={`text-[11px] font-semibold ${statusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Students Enrolled
                </span>
              </div>
            </div>

            {/* Attempted & Graded */}
            <div
              onClick={() => setStatusFilter('MARKED')}
              className={`p-5 rounded-2xl border transition cursor-pointer ${
                statusFilter === 'MARKED'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                  : 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'MARKED' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  Attempted & Graded
                </span>
                <CheckCircle2 size={16} className={statusFilter === 'MARKED' ? 'text-white' : 'text-emerald-600'} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-black ${statusFilter === 'MARKED' ? 'text-white' : 'text-emerald-950'}`}>
                  {markedStudentsCount}
                </span>
                <span className={`text-[11px] font-semibold ${statusFilter === 'MARKED' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  {totalRosterCount > 0 ? `${Math.round((markedStudentsCount / totalRosterCount) * 100)}% graded` : '0%'}
                </span>
              </div>
            </div>

            {/* Pending Marking / Awaiting Score */}
            <div
              onClick={() => setStatusFilter('AWAITING_MARKING')}
              className={`p-5 rounded-2xl border transition cursor-pointer ${
                statusFilter === 'AWAITING_MARKING'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'AWAITING_MARKING' ? 'text-amber-100' : 'text-amber-700'}`}>
                  Pending Marking
                </span>
                <Clock size={16} className={statusFilter === 'AWAITING_MARKING' ? 'text-white' : 'text-amber-600'} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-black ${statusFilter === 'AWAITING_MARKING' ? 'text-white' : 'text-amber-950'}`}>
                  {awaitingMarkingCount}
                </span>
                <span className={`text-[11px] font-semibold ${statusFilter === 'AWAITING_MARKING' ? 'text-amber-100' : 'text-amber-700'}`}>
                  Awaiting Teacher Score
                </span>
              </div>
            </div>

            {/* Not Attempted */}
            <div
              onClick={() => setStatusFilter('NOT_SUBMITTED')}
              className={`p-5 rounded-2xl border transition cursor-pointer ${
                statusFilter === 'NOT_SUBMITTED'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                  : 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'NOT_SUBMITTED' ? 'text-rose-100' : 'text-rose-700'}`}>
                  Not Attempted
                </span>
                <AlertCircle size={16} className={statusFilter === 'NOT_SUBMITTED' ? 'text-white' : 'text-rose-600'} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-black ${statusFilter === 'NOT_SUBMITTED' ? 'text-white' : 'text-rose-950'}`}>
                  {notAttemptedCount}
                </span>
                <span className={`text-[11px] font-semibold ${statusFilter === 'NOT_SUBMITTED' ? 'text-rose-100' : 'text-rose-700'}`}>
                  No Submission Yet
                </span>
              </div>
            </div>
          </div>

          {/* Submissions Table Box */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Filter Tabs & Search Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100/80 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({totalRosterCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('MARKED')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'MARKED' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Attempted & Graded ({markedStudentsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('AWAITING_MARKING')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'AWAITING_MARKING' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Pending Marking ({awaitingMarkingCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('NOT_SUBMITTED')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'NOT_SUBMITTED' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Not Attempted ({notAttemptedCount})</span>
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  placeholder="Search student by name or reg no..."
                  className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Submissions Roster Table */}
            {loadingSubmissions ? (
              <div className="p-16 text-center">
                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-3" size={28} />
                <p className="text-xs text-slate-500 font-medium">Loading class submissions roster...</p>
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
                      <th className="p-4 text-center">Student Write-up / File</th>
                      <th className="p-4 text-center w-32">Score (Max: {selectedHomework.maxMarks || 20})</th>
                      <th className="p-4">Teacher Comment</th>
                      <th className="p-4 text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubmissions.map((st, idx) => {
                      const hasUploadedFile = Boolean(st.fileAttachment?.fileUrl || st.fileUrl)
                      const downloadLink = st.fileAttachment?.fileUrl || st.fileUrl || ''
                      const displayFileName = st.fileAttachment?.fileName || st.fileName || 'Download Write-up'

                      return (
                        <tr key={`sub-st-${st.studentId}`} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-4 font-mono text-slate-600 font-semibold">{st.registerNo || 'N/A'}</td>
                          <td className="p-4">
                            <span className="font-bold text-slate-900 block">{st.name}</span>
                            {st.sectionName && (
                              <span className="text-[10px] text-slate-400">Section: {st.sectionName}</span>
                            )}
                          </td>

                          {/* Status Indicator */}
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                                st.status === 'MARKED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : st.status === 'AWAITING_MARKING'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  st.status === 'MARKED'
                                    ? 'bg-emerald-600'
                                    : st.status === 'AWAITING_MARKING'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              <span>
                                {st.status === 'MARKED'
                                  ? 'Marked'
                                  : st.status === 'AWAITING_MARKING'
                                  ? 'Pending Marking'
                                  : 'Not Attempted'}
                              </span>
                            </span>
                          </td>

                          {/* Student File Attachment (PDF, Word, Image) */}
                          <td className="p-4 text-center">
                            {hasUploadedFile ? (
                              <a
                                href={downloadLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition border border-indigo-200 shadow-2xs"
                                title="Click to download student write-up"
                              >
                                <Download size={13} />
                                <span className="truncate max-w-[130px]">{displayFileName}</span>
                              </a>
                            ) : st.submitted || st.submittedAt ? (
                              <span className="text-[11px] text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-lg font-semibold">
                                Online Answers
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No upload</span>
                            )}
                          </td>

                          {/* Score Input */}
                          <td className="p-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max={selectedHomework.maxMarks || 20}
                              value={st.score ?? ''}
                              onChange={(e) => handleScoreChange(st.studentId, e.target.value)}
                              placeholder="—"
                              className="w-20 h-9 text-center font-bold font-mono text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>

                          {/* Teacher Feedback / Comment */}
                          <td className="p-4">
                            <input
                              type="text"
                              value={st.feedback || ''}
                              onChange={(e) => handleFeedbackChange(st.studentId, e.target.value)}
                              placeholder="Remarks, e.g. Good effort, review question 3"
                              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>

                          {/* Action Button */}
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleSaveSingleGrade(st.studentId)}
                              disabled={savingStudentId === st.studentId}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                              title="Save this score"
                            >
                              {savingStudentId === st.studentId ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Save size={14} />
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-500 text-xs">
                No student records matching current status filter.
              </div>
            )}
          </div>
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
                    <th className="p-4 text-center">Marked / Submitted</th>
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
                          <span className="text-emerald-700">{hw.markedCount ?? 0}</span>
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
                          <span>View Roster & Mark</span>
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
                Click &apos;New Assignment&apos; above to assign homework or upload worksheets for your classrooms.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL (Online Questions, Upload for Download, Offline) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ListTodo className="text-indigo-600" size={18} />
                  <span>Create Assignment</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publish online interactive questions or upload worksheets for student write-up submissions.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-5 text-xs">
              {/* Assignment Mode Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Assignment Delivery Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('ONLINE_QUESTIONS')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      assignmentMode === 'ONLINE_QUESTIONS'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-xs">
                      <Sparkles size={14} className="text-indigo-600 shrink-0" />
                      <span>Online Questions</span>
                    </div>
                    <p className="text-[10.5px] mt-1 text-slate-500 leading-tight">
                      Set questions manually (MCQ, True/False, Theory).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignmentMode('FILE_UPLOAD')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      assignmentMode === 'FILE_UPLOAD'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-xs">
                      <FileUp size={14} className="text-indigo-600 shrink-0" />
                      <span>Upload for Download</span>
                    </div>
                    <p className="text-[10.5px] mt-1 text-slate-500 leading-tight">
                      Attach worksheet; students download & upload write-up.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignmentMode('OFFLINE')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      assignmentMode === 'OFFLINE'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-xs">
                      <BookOpen size={14} className="text-indigo-600 shrink-0" />
                      <span>Offline Assignment</span>
                    </div>
                    <p className="text-[10.5px] mt-1 text-slate-500 leading-tight">
                      Take-home or physical exercise book grading.
                    </p>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assignment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Mathematics — Linear Equations & Angles Assignment"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Class & Subject Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
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
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    {subjects.map((s) => (
                      <option key={`s-opt-${s.id}`} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date & Max Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Score (Total Points)</label>
                  <input
                    type="number"
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Instructions / Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide instructions, pages to read, or guidance for students..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* WORKSHEET / QUESTION DOCUMENT ATTACHMENT SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-extrabold text-slate-800 text-xs">
                      {assignmentMode === 'FILE_UPLOAD'
                        ? 'Attach Question Worksheet / Prompt Document *'
                        : 'Attach Reference Material / Question Sheet (Optional)'}
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Students can download this file (PDF, Word, or Image) to view questions.
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAttachment}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    {uploadingAttachment ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={13} />
                        <span>Choose File</span>
                      </>
                    )}
                  </button>
                </div>

                {attachmentUrl && (
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-indigo-200 text-xs">
                    <div className="flex items-center gap-2">
                      <FileCheck size={16} className="text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate max-w-[280px]">
                        {attachmentName || 'Attachment Uploaded'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentUrl(null)
                        setAttachmentName(null)
                      }}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* ONLINE QUESTIONS STUDIO SECTION (If Mode is ONLINE_QUESTIONS) */}
              {assignmentMode === 'ONLINE_QUESTIONS' && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <Sparkles size={14} className="text-indigo-600" />
                        <span>Interactive Questions ({questions.length})</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Manually set questions with marks for student online quiz submission.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                    >
                      <Plus size={13} />
                      <span>Add Question</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {questions.map((q, qIdx) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                              {qIdx + 1}
                            </span>
                            <span className="font-extrabold text-slate-800 text-xs">Question #{qIdx + 1}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-slate-500 font-bold">Marks:</span>
                              <input
                                type="number"
                                min="1"
                                value={q.points}
                                onChange={(e) => handleUpdateQuestion(q.id, { points: Number(e.target.value) || 1 })}
                                className="w-14 h-7 text-center font-bold text-xs rounded-lg border border-slate-200"
                              />
                            </div>

                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(q.id)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete Question"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Question Type Selection */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-slate-500">Type:</label>
                          <select
                            value={q.type}
                            onChange={(e) => handleUpdateQuestion(q.id, { type: e.target.value as any })}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <option value="MCQ">Multiple Choice (MCQ)</option>
                            <option value="TF">True / False</option>
                            <option value="THEORY">Theory / Short Answer</option>
                          </select>
                        </div>

                        {/* Question Text */}
                        <div>
                          <textarea
                            rows={2}
                            required
                            value={q.questionText}
                            onChange={(e) => handleUpdateQuestion(q.id, { questionText: e.target.value })}
                            placeholder={`Type Question #${qIdx + 1} here...`}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          />
                        </div>

                        {/* MCQ Options Builder */}
                        {q.type === 'MCQ' && (
                          <div className="space-y-2 pt-1">
                            <label className="text-[11px] font-bold text-slate-600 block">
                              Options & Correct Answer (Select the radio of the correct choice):
                            </label>
                            <div className="space-y-1.5">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = q.correctAnswer === opt
                                return (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct-${q.id}`}
                                      checked={isCorrect}
                                      onChange={() => handleUpdateQuestion(q.id, { correctAnswer: opt })}
                                      className="cursor-pointer text-indigo-600"
                                      title="Mark as correct answer"
                                    />
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                                    />
                                    {q.options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOption(q.id, optIdx)}
                                        className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
                                      >
                                        <X size={13} />
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            {q.options.length < 6 && (
                              <button
                                type="button"
                                onClick={() => handleAddOption(q.id)}
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer pt-1"
                              >
                                <Plus size={12} />
                                <span>Add Option</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* True / False Selection */}
                        {q.type === 'TF' && (
                          <div className="flex items-center gap-4 pt-1">
                            <span className="text-[11px] font-bold text-slate-600">Correct Answer:</span>
                            {['True', 'False'].map((tf) => (
                              <label key={tf} className="flex items-center gap-1.5 cursor-pointer font-bold text-xs">
                                <input
                                  type="radio"
                                  name={`tf-${q.id}`}
                                  checked={q.correctAnswer === tf}
                                  onChange={() => handleUpdateQuestion(q.id, { correctAnswer: tf })}
                                  className="text-indigo-600"
                                />
                                <span>{tf}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {creating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Publishing...</span>
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
