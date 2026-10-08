'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { HomeworkQuestionStudio } from '@/components/dashboards/shared/homework-question-studio'
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  Grid,
  HelpCircle,
  Layers,
  List,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  Square,
  Trash2,
  Users,
  X,
} from 'lucide-react'

type HomeworkTab = 'assigned' | 'bank' | 'create'
type BankViewMode = 'folders' | 'list'

interface BankItem {
  id: number
  questionText: string
  questionType: string
  subjectId?: number
  classId?: number
  subject?: { id: number; name: string }
  class?: { id: number; name: string } | null
  termName?: string | null
  topic?: string | null
  sourceType?: string | null
  marks: number
  options?: string[]
  correctOption?: string
  status?: string
}

interface HomeworkRow {
  id: number
  title: string
  description?: string | null
  dueDate: string
  termName?: string | null
  classId?: number
  subjectId?: number
  class?: { id: number; name: string }
  subject?: { id: number; name: string }
  submissions?: Array<{ id: number; score?: number | null }>
  questions?: any[]
  questionBankIds?: number[]
  createdAt?: string
}

interface ClassOption {
  id: number
  name: string
}

interface SubjectOption {
  id: number
  name: string
  subjectCode?: string
}

interface SubmissionRecord {
  id: number
  studentId: number
  homeworkId: number
  score: number | null
  feedback?: string | null
  answers?: any
  createdAt: string
  student?: {
    id: number
    firstName: string
    lastName: string
    registerNo: string
    photo?: string | null
  }
}

interface EnrolledStudent {
  id: number
  firstName: string
  lastName: string
  registerNo: string
  photo?: string | null
}

export function HomeworkManagement() {
  const [activeTab, setActiveTab] = useState<HomeworkTab>('assigned')
  const [bankViewMode, setBankViewMode] = useState<BankViewMode>('folders')
  const [bankItems, setBankItems] = useState<BankItem[]>([])
  const [homeworks, setHomeworks] = useState<HomeworkRow[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])

  // Loaders & errors
  const [loadingBank, setLoadingBank] = useState(false)
  const [loadingHw, setLoadingHw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Filters & Search
  const [filterTerm, setFilterTerm] = useState('All')
  const [filterClass, setFilterClass] = useState('All')
  const [bankSearch, setBankSearch] = useState('')
  const [selectedFolderKey, setSelectedFolderKey] = useState<string | null>(null)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([])

  // Studio Key
  const [studioKey, setStudioKey] = useState(0)

  // Allocate Homework Modal State
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false)
  const [allocateTitle, setAllocateTitle] = useState('')
  const [allocateClassId, setAllocateClassId] = useState<string>('')
  const [allocateSubjectId, setAllocateSubjectId] = useState<string>('')
  const [allocateDueDate, setAllocateDueDate] = useState('')
  const [allocateTermName, setAllocateTermName] = useState('First Term')
  const [allocateDescription, setAllocateDescription] = useState('')
  const [isAllocating, setIsAllocating] = useState(false)

  // Quick Create Question Modal State
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false)
  const [newQText, setNewQText] = useState('')
  const [newQType, setNewQType] = useState<'mcq' | 'true_false' | 'theory'>('mcq')
  const [newQOptions, setNewQOptions] = useState<string[]>(['Option A', 'Option B', 'Option C', 'Option D'])
  const [newQCorrect, setNewQCorrect] = useState('A')
  const [newQMarks, setNewQMarks] = useState<number | string>(2)
  const [newQClassId, setNewQClassId] = useState<string>('')
  const [newQSubjectId, setNewQSubjectId] = useState<string>('')
  const [newQTopic, setNewQTopic] = useState('')
  const [newQTerm, setNewQTerm] = useState('First Term')
  const [isSavingNewQ, setIsSavingNewQ] = useState(false)

  // Submissions & Performance Modal State
  const [selectedHomeworkForReview, setSelectedHomeworkForReview] = useState<HomeworkRow | null>(null)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([])
  const [submissionTab, setSubmissionTab] = useState<'submitted' | 'unsubmitted' | 'questions'>('submitted')
  const [submissionSearch, setSubmissionSearch] = useState('')

  // Student Answers Review Drawer / Modal
  const [inspectingSubmission, setInspectingSubmission] = useState<SubmissionRecord | null>(null)
  const [gradingScore, setGradingScore] = useState<string>('')
  const [gradingFeedback, setGradingFeedback] = useState<string>('')
  const [isSavingGrade, setIsSavingGrade] = useState(false)

  const showToast = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 4000)
  }

  // Load Classes and Subjects for selection
  useEffect(() => {
    Promise.all([
      apiSlice.get<{ success: boolean; classes: ClassOption[] }>(endpoints.admin.classesSections).catch(() => null),
      apiSlice.get<{ success: boolean; subjects: SubjectOption[] }>(endpoints.admin.subjects).catch(() => null),
    ]).then(([clsRes, subRes]) => {
      if (clsRes?.classes) setClasses(clsRes.classes)
      if (subRes?.subjects) setSubjects(subRes.subjects)
    })
  }, [])

  const fetchBank = async () => {
    setLoadingBank(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; items: BankItem[] }>(endpoints.admin.cbtQuestionBank('?limit=5000'))
      setBankItems(res.items || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load Question Bank.')
    } finally {
      setLoadingBank(false)
    }
  }

  const fetchHomeworks = async () => {
    setLoadingHw(true)
    try {
      const res = await apiSlice.get<{ success: boolean; homeworks: HomeworkRow[] }>(endpoints.admin.homeworks)
      setHomeworks(res.homeworks || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load homeworks.')
    } finally {
      setLoadingHw(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'bank') fetchBank()
    if (activeTab === 'assigned') fetchHomeworks()
  }, [activeTab])

  // Subject & Class Folders grouping
  const folders = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string
        classId: number | null
        className: string
        subjectId: number | null
        subjectName: string
        questions: BankItem[]
        totalMarks: number
        mcqCount: number
        tfCount: number
        theoryCount: number
        topics: Set<string>
        terms: Set<string>
      }
    >()

    for (const item of bankItems) {
      const cId = item.class?.id || item.classId || null
      const cName = item.class?.name || (cId ? classes.find((c) => c.id === cId)?.name : 'General Class') || 'General Class'
      const sId = item.subject?.id || item.subjectId || null
      const sName = item.subject?.name || (sId ? subjects.find((s) => s.id === sId)?.name : 'General Subject') || 'General Subject'

      const folderKey = `${cId ?? 'any'}_${sId ?? 'any'}`

      if (!map.has(folderKey)) {
        map.set(folderKey, {
          key: folderKey,
          classId: cId,
          className: cName,
          subjectId: sId,
          subjectName: sName,
          questions: [],
          totalMarks: 0,
          mcqCount: 0,
          tfCount: 0,
          theoryCount: 0,
          topics: new Set<string>(),
          terms: new Set<string>(),
        })
      }

      const folder = map.get(folderKey)!
      folder.questions.push(item)
      folder.totalMarks += Number(item.marks || 1)

      const type = (item.questionType || '').toLowerCase()
      if (type === 'mcq') folder.mcqCount += 1
      else if (type === 'true_false' || type === 'tf') folder.tfCount += 1
      else folder.theoryCount += 1

      if (item.topic) folder.topics.add(item.topic)
      if (item.termName) folder.terms.add(item.termName)
    }

    return Array.from(map.values())
  }, [bankItems, classes, subjects])

  // Filtered Folders
  const filteredFolders = useMemo(() => {
    return folders.filter((folder) => {
      const termOk = filterTerm === 'All' || folder.terms.has(filterTerm)
      const classOk = filterClass === 'All' || String(folder.classId) === filterClass
      const q = bankSearch.trim().toLowerCase()
      const searchOk =
        !q ||
        folder.className.toLowerCase().includes(q) ||
        folder.subjectName.toLowerCase().includes(q) ||
        Array.from(folder.topics).some((t) => t.toLowerCase().includes(q))
      return termOk && classOk && searchOk
    })
  }, [folders, filterTerm, filterClass, bankSearch])

  // Active folder questions if inside a folder
  const currentFolder = useMemo(() => {
    if (!selectedFolderKey) return null
    return folders.find((f) => f.key === selectedFolderKey) || null
  }, [folders, selectedFolderKey])

  // Filtered bank items for flat list or folder view
  const currentFolderQuestions = useMemo(() => {
    const list = currentFolder ? currentFolder.questions : bankItems
    return list.filter((item) => {
      const termOk = filterTerm === 'All' || item.termName === filterTerm
      const classOk = filterClass === 'All' || String(item.class?.id || item.classId) === filterClass
      const q = bankSearch.trim().toLowerCase()
      const searchOk =
        !q ||
        item.questionText.toLowerCase().includes(q) ||
        (item.subject?.name || '').toLowerCase().includes(q) ||
        (item.class?.name || '').toLowerCase().includes(q) ||
        (item.topic || '').toLowerCase().includes(q)
      return termOk && classOk && searchOk
    })
  }, [currentFolder, bankItems, filterTerm, filterClass, bankSearch])

  // Selection helpers
  const toggleSelectQuestion = (id: number) => {
    setSelectedQuestionIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleSelectAllCurrent = () => {
    const currentIds = currentFolderQuestions.map((q) => q.id)
    const allSelected = currentIds.every((id) => selectedQuestionIds.includes(id))
    if (allSelected) {
      setSelectedQuestionIds((prev) => prev.filter((id) => !currentIds.includes(id)))
    } else {
      setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...currentIds])))
    }
  }

  const totalSelectedMarks = useMemo(() => {
    return bankItems
      .filter((q) => selectedQuestionIds.includes(q.id))
      .reduce((sum, q) => sum + Number(q.marks || 1), 0)
  }, [bankItems, selectedQuestionIds])

  // Open Allocate Modal pre-filled
  const openAllocateModal = (folder?: typeof currentFolder) => {
    if (folder) {
      setAllocateClassId(folder.classId ? String(folder.classId) : (classes[0]?.id ? String(classes[0].id) : ''))
      setAllocateSubjectId(folder.subjectId ? String(folder.subjectId) : (subjects[0]?.id ? String(subjects[0].id) : ''))
      setAllocateTitle(`${folder.subjectName} Homework Assignment`)
      if (selectedQuestionIds.length === 0) {
        setSelectedQuestionIds(folder.questions.map((q) => q.id))
      }
    } else {
      const selectedItems = bankItems.filter((q) => selectedQuestionIds.includes(q.id))
      const first = selectedItems[0]
      if (first) {
        setAllocateClassId(first.class?.id ? String(first.class.id) : (classes[0]?.id ? String(classes[0].id) : ''))
        setAllocateSubjectId(first.subject?.id ? String(first.subject.id) : (subjects[0]?.id ? String(subjects[0].id) : ''))
        setAllocateTitle(`${first.subject?.name || 'Class'} Homework`)
      } else {
        setAllocateClassId(classes[0]?.id ? String(classes[0].id) : '')
        setAllocateSubjectId(subjects[0]?.id ? String(subjects[0].id) : '')
        setAllocateTitle('Homework Assignment')
      }
    }
    const defaultDue = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    setAllocateDueDate(defaultDue.toISOString().slice(0, 16))
    setIsAllocateModalOpen(true)
  }

  // Handle Allocate Homework Submission
  const handleAllocateHomework = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocateTitle.trim() || !allocateClassId || !allocateSubjectId || !allocateDueDate) {
      alert('Please fill in title, target class, subject, and due date.')
      return
    }
    if (selectedQuestionIds.length === 0) {
      alert('Please select at least one question from the Question Bank to assign.')
      return
    }

    setIsAllocating(true)
    try {
      const res = await apiSlice.post<{ success: boolean; homework: any; message?: string }>(endpoints.admin.homeworks, {
        title: allocateTitle.trim(),
        description: allocateDescription.trim() || null,
        classId: Number(allocateClassId),
        subjectId: Number(allocateSubjectId),
        dueDate: new Date(allocateDueDate).toISOString(),
        termName: allocateTermName,
        questionBankIds: selectedQuestionIds,
      })

      if (res.success) {
        showToast(res.message || 'Homework allocated and published to the classroom!')
        setIsAllocateModalOpen(false)
        setSelectedQuestionIds([])
        fetchHomeworks()
        setActiveTab('assigned')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to allocate homework.')
    } finally {
      setIsAllocating(false)
    }
  }

  // Quick Save Question to Bank
  const handleQuickCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQText.trim() || !newQClassId || !newQSubjectId) {
      alert('Question text, class, and subject are required.')
      return
    }

    setIsSavingNewQ(true)
    try {
      const opts = newQType === 'true_false' ? ['True', 'False'] : newQType === 'mcq' ? newQOptions.filter((o) => o.trim().length > 0) : []
      const payload = {
        questionText: newQText.trim(),
        questionType: newQType,
        options: opts,
        correctOption: newQType === 'theory' ? null : newQCorrect,
        marks: Number(newQMarks) || 1,
        classId: Number(newQClassId),
        subjectId: Number(newQSubjectId),
        topic: newQTopic.trim() || null,
        termName: newQTerm,
        sourceType: 'MANUAL',
      }

      const res = await apiSlice.post<{ success: boolean; item: BankItem }>(endpoints.admin.cbtQuestionBank(''), payload)
      if (res.success) {
        showToast('Question created and classified into Question Bank folder!')
        setIsQuickCreateModalOpen(false)
        setNewQText('')
        setNewQTopic('')
        fetchBank()
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save question to bank.')
    } finally {
      setIsSavingNewQ(false)
    }
  }

  // Fetch Submissions & Analytics for a specific homework
  const handleOpenPerformanceModal = async (hw: HomeworkRow) => {
    setSelectedHomeworkForReview(hw)
    setLoadingSubmissions(true)
    setSubmissionTab('submitted')
    try {
      const res = await apiSlice.get<{
        success: boolean
        homework?: any
        submissions?: SubmissionRecord[]
        enrolledStudents?: EnrolledStudent[]
      }>(endpoints.admin.homeworkSubmissions(hw.id))

      if (res.success) {
        setSubmissions(res.submissions || [])
        setEnrolledStudents(res.enrolledStudents || [])
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load homework submissions.')
    } finally {
      setLoadingSubmissions(false)
    }
  }

  // Delete Homework
  const handleDeleteHomework = async (id: number) => {
    if (!confirm('Are you sure you want to delete this homework assignment and its student records?')) return
    try {
      const res = await apiSlice.delete<{ success: boolean; message?: string }>(endpoints.admin.deleteHomework(id))
      if (res.success) {
        setHomeworks((prev) => prev.filter((h) => h.id !== id))
        showToast(res.message || 'Homework deleted successfully.')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete homework.')
    }
  }

  // Save Manual Grade / Feedback
  const handleSaveGrade = async (submissionId: number) => {
    setIsSavingGrade(true)
    try {
      const res = await apiSlice.post<{ success: boolean; submission: any; message?: string }>(
        endpoints.admin.gradeHomework(submissionId),
        {
          score: gradingScore !== '' ? Number(gradingScore) : null,
          feedback: gradingFeedback.trim() || null,
        }
      )
      if (res.success) {
        showToast('Grade & feedback updated successfully!')
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, score: res.submission.score, feedback: res.submission.feedback } : s))
        )
        if (inspectingSubmission?.id === submissionId) {
          setInspectingSubmission((prev) =>
            prev ? { ...prev, score: res.submission.score, feedback: res.submission.feedback } : null
          )
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save grade.')
    } finally {
      setIsSavingGrade(false)
    }
  }

  // Analytics KPI Computations
  const analyticsSummary = useMemo(() => {
    const totalEnrolled = enrolledStudents.length || submissions.length
    const submittedCount = submissions.length
    const submissionRate = totalEnrolled > 0 ? Math.round((submittedCount / totalEnrolled) * 100) : 0
    const pendingCount = Math.max(0, totalEnrolled - submittedCount)

    const scored = submissions.filter((s) => s.score !== null && !isNaN(Number(s.score)))
    const scores = scored.map((s) => Number(s.score))

    const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
    const highScore = scores.length > 0 ? Math.max(...scores) : 0
    const lowScore = scores.length > 0 ? Math.min(...scores) : 0
    const passCount = scores.filter((score) => score >= 50).length
    const passRate = scores.length > 0 ? Math.round((passCount / scores.length) * 100) : 0

    return {
      totalEnrolled,
      submittedCount,
      submissionRate,
      pendingCount,
      avgScore,
      highScore,
      lowScore,
      passRate,
    }
  }, [enrolledStudents, submissions])

  // Unsubmitted students list
  const unsubmittedStudentsList = useMemo(() => {
    const submittedStudentIds = new Set(submissions.map((s) => s.studentId))
    return enrolledStudents.filter((st) => !submittedStudentIds.has(st.id))
  }, [enrolledStudents, submissions])

  // Filtered submissions in table
  const filteredSubmissions = useMemo(() => {
    const q = submissionSearch.trim().toLowerCase()
    return submissions.filter((sub) => {
      if (!q) return true
      const fullName = `${sub.student?.firstName || ''} ${sub.student?.lastName || ''}`.toLowerCase()
      const reg = (sub.student?.registerNo || '').toLowerCase()
      return fullName.includes(q) || reg.includes(q)
    })
  }, [submissions, submissionSearch])

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* SUCCESS TOAST NOTIFICATION */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-3">
          <CheckCircle2 size={18} />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* HEADER HERO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-linear-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase text-purple-200 border border-white/10">
            <Sparkles size={13} className="text-amber-400" /> Academic Homework Hub
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <FileText className="text-purple-400" size={28} /> Homework & Question Folders
          </h1>
          <p className="text-purple-100/80 text-xs md:text-sm max-w-2xl font-medium leading-relaxed">
            Classify questions into Subject & Class folders, allocate homework to any classroom, and inspect student performance & scores in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setNewQClassId(classes[0]?.id ? String(classes[0].id) : '')
              setNewQSubjectId(subjects[0]?.id ? String(subjects[0].id) : '')
              setIsQuickCreateModalOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 cursor-pointer"
          >
            <Plus size={15} /> Add Single Question
          </button>
          <button
            onClick={() => {
              setStudioKey((k) => k + 1)
              setActiveTab('create')
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-black shadow-lg hover:shadow-purple-500/25 transition cursor-pointer"
          >
            <Sparkles size={15} className="text-amber-300" /> AI Assignment Studio
          </button>
        </div>
      </div>

      {/* TOP TAB NAVIGATION */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 backdrop-blur-md border border-slate-200/80 rounded-2xl">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'assigned'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Assigned Homework</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'assigned' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {homeworks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'bank'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Folder size={15} />
          <span>Question Bank & Folders</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'bank' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {folders.length} Folders · {bankItems.length} Qs
          </span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'create'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Sparkles size={15} />
          <span>AI / Paper Extraction</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ASSIGNED HOMEWORK */}
      {/* ========================================================================= */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="font-black text-slate-900 text-base">Published Homework & Class Submissions</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Review active assignments, check student turn-in rates, examine answer choices, and grade responses.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('bank')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition cursor-pointer self-start sm:self-auto"
            >
              <Plus size={14} /> Allocate from Question Bank
            </button>
          </div>

          {loadingHw ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="inline animate-spin mb-2 text-purple-600" size={28} />
              <p className="text-xs font-semibold">Loading assigned homework...</p>
            </div>
          ) : homeworks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <FileText size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">No Homework Assigned Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Open the Question Bank folders to allocate questions to classrooms, or use the AI Studio to create and assign homework.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('bank')}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer transition"
              >
                Browse Question Folders
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeworks.map((hw) => {
                const subCount = hw.submissions?.length || 0
                const qCount = Array.isArray(hw.questionBankIds)
                  ? hw.questionBankIds.length
                  : Array.isArray(hw.questions)
                    ? hw.questions.length
                    : 0
                const isPastDue = new Date(hw.dueDate).getTime() < Date.now()

                return (
                  <article
                    key={hw.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 text-[11px] font-black border border-purple-100">
                          {hw.subject?.name || 'Subject'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {hw.class?.name || 'All Classes'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-sm leading-snug line-clamp-1">{hw.title}</h4>
                        {hw.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{hw.description}</p>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar size={12} className="text-slate-400" /> Due Date:
                          </span>
                          <span
                            className={`font-bold ${isPastDue ? 'text-rose-600' : 'text-slate-900'}`}
                            title={new Date(hw.dueDate).toLocaleString()}
                          >
                            {new Date(hw.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Layers size={12} className="text-slate-400" /> Questions:
                          </span>
                          <span className="font-bold text-slate-900">{qCount} Questions</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Users size={12} className="text-slate-400" /> Student Attempts:
                          </span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {subCount} Submitted
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPerformanceModal(hw)}
                        className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <BarChart2 size={13} /> View Submissions & Scores
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHomework(hw.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Delete Assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUESTION BANK & FOLDERS */}
      {/* ========================================================================= */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          {/* SEARCH & CONTROLS TOOLBAR */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <FolderOpen className="text-purple-600" size={20} />
                  {currentFolder ? `Folder: ${currentFolder.className} - ${currentFolder.subjectName}` : 'Class & Subject Question Folders'}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  {currentFolder
                    ? `Showing ${currentFolderQuestions.length} questions classified under this class & subject.`
                    : 'Each folder houses verified questions organized by classroom level and academic subject.'}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setBankViewMode('folders')
                      setSelectedFolderKey(null)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      bankViewMode === 'folders' && !selectedFolderKey ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <Grid size={13} /> Folders View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBankViewMode('list')
                      setSelectedFolderKey(null)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      bankViewMode === 'list' && !selectedFolderKey ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <List size={13} /> All Questions List
                  </button>
                </div>
              </div>
            </div>

            {/* FILTER ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Search questions, topics or folders..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="All">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="All">All Academic Terms</option>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
          </div>

          {/* BREADCRUMB WHEN INSIDE A FOLDER */}
          {selectedFolderKey && currentFolder && (
            <div className="flex items-center justify-between bg-purple-50/80 border border-purple-200/80 px-5 py-3 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                <button
                  type="button"
                  onClick={() => setSelectedFolderKey(null)}
                  className="hover:underline flex items-center gap-1 text-purple-700 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Folders
                </button>
                <span>/</span>
                <span className="text-slate-900">{currentFolder.className}</span>
                <span>•</span>
                <span className="text-purple-800">{currentFolder.subjectName}</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-950 text-[10px] font-black">
                  {currentFolder.questions.length} Questions
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAllocateModal(currentFolder)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Send size={13} /> Allocate Folder to Class
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {loadingBank ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="inline animate-spin mb-2 text-purple-600" size={28} />
              <p className="text-xs font-semibold">Loading questions and folder catalog...</p>
            </div>
          ) : null}

          {/* VIEW MODE A: FOLDERS GRID (ROOT) */}
          {!loadingBank && bankViewMode === 'folders' && !selectedFolderKey && (
            <div>
              {filteredFolders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                  <Folder className="mx-auto text-slate-300" size={40} />
                  <h4 className="text-sm font-bold text-slate-700">No Question Folders Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your class or term filter, or add questions to create your first subject folder.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFolders.map((f) => (
                    <div
                      key={f.key}
                      className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-purple-400/80 hover:shadow-md transition flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black group-hover:scale-105 transition">
                            <Folder size={20} />
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-800 border border-purple-100">
                            {f.className}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900 leading-snug group-hover:text-purple-700 transition">
                            {f.subjectName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                            <span>{f.questions.length} Questions</span>
                            <span>•</span>
                            <span>{f.totalMarks} Total Marks</span>
                          </p>
                        </div>

                        {/* Topics tags preview */}
                        {f.topics.size > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {Array.from(f.topics)
                              .slice(0, 3)
                              .map((topic, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold truncate max-w-[130px]"
                                >
                                  {topic}
                                </span>
                              ))}
                            {f.topics.size > 3 && (
                              <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[10px] font-medium">
                                +{f.topics.size - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Question type composition */}
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                          <span>{f.mcqCount} MCQ</span>
                          <span>•</span>
                          <span>{f.tfCount} T/F</span>
                          <span>•</span>
                          <span>{f.theoryCount} Theory</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedFolderKey(f.key)}
                          className="flex-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FolderOpen size={13} /> Open Folder
                        </button>
                        <button
                          type="button"
                          onClick={() => openAllocateModal(f)}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                          title="Assign questions in this folder to a class"
                        >
                          <Send size={13} /> Allocate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE B: QUESTIONS LIST (INSIDE FOLDER OR FLAT LIST) */}
          {!loadingBank && (bankViewMode === 'list' || selectedFolderKey) && (
            <div className="space-y-3">
              {/* SELECT ALL TOOLBAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAllCurrent}
                    className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-700 cursor-pointer"
                  >
                    {currentFolderQuestions.length > 0 &&
                    currentFolderQuestions.every((q) => selectedQuestionIds.includes(q.id)) ? (
                      <CheckSquare size={16} className="text-purple-600" />
                    ) : (
                      <Square size={16} className="text-slate-400" />
                    )}
                    Select All in View ({currentFolderQuestions.length})
                  </button>

                  {selectedQuestionIds.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[11px] font-black">
                      {selectedQuestionIds.length} Selected ({totalSelectedMarks} pts)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedQuestionIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openAllocateModal()}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send size={13} /> Allocate {selectedQuestionIds.length} Questions to Class
                    </button>
                  )}
                </div>
              </div>

              {currentFolderQuestions.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500">
                  No questions match your current search and filters.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentFolderQuestions.map((q) => {
                    const isSelected = selectedQuestionIds.includes(q.id)
                    return (
                      <article
                        key={q.id}
                        onClick={() => toggleSelectQuestion(q.id)}
                        className={`rounded-2xl border p-4 transition cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-purple-50/50 border-purple-400 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="pt-0.5">
                          {isSelected ? (
                            <CheckSquare size={18} className="text-purple-600 shrink-0" />
                          ) : (
                            <Square size={18} className="text-slate-300 hover:text-slate-500 shrink-0" />
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase">
                              {q.questionType}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {q.class?.name || 'Class'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {q.subject?.name || 'Subject'}
                            </span>
                            {q.termName && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                {q.termName}
                              </span>
                            )}
                            {q.topic && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-medium">
                                Topic: {q.topic}
                              </span>
                            )}
                            <span className="ml-auto text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                              {q.marks} mark{q.marks === 1 ? '' : 's'}
                            </span>
                          </div>

                          <p className="text-sm text-slate-900 font-semibold leading-relaxed">{q.questionText}</p>

                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {q.options.map((opt, idx) => {
                                const letter = String.fromCharCode(65 + idx)
                                const isCorrect = q.correctOption === letter
                                return (
                                  <div
                                    key={idx}
                                    className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 ${
                                      isCorrect
                                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold'
                                        : 'bg-slate-50 text-slate-700 border border-slate-100'
                                    }`}
                                  >
                                    <span
                                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {letter}
                                    </span>
                                    <span>{opt}</span>
                                    {isCorrect && <Check size={12} className="ml-auto text-emerald-600" />}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CREATE ASSIGNMENT VIA STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <HomeworkQuestionStudio
          key={studioKey}
          role="admin"
          onBankSaved={() => fetchBank()}
          onAssigned={() => {
            fetchHomeworks()
            setActiveTab('assigned')
          }}
          onCancel={() => setActiveTab('assigned')}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALLOCATE HOMEWORK TO CLASSROOM */}
      {/* ========================================================================= */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-purple-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Send size={18} className="text-amber-400" /> Allocate Homework to Classroom
              </div>
              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAllocateHomework} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-extrabold block">
                    {selectedQuestionIds.length} Questions Selected from Bank
                  </span>
                  <span className="text-[11px] text-purple-700">Total Marks: {totalSelectedMarks} points</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-black">
                  Admin Allocation
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Homework Title *</label>
                <input
                  type="text"
                  required
                  value={allocateTitle}
                  onChange={(e) => setAllocateTitle(e.target.value)}
                  placeholder="e.g. Mathematics Practice - Algebraic Terms"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Classroom *</label>
                  <select
                    value={allocateClassId}
                    onChange={(e) => setAllocateClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">Select Target Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">As school admin, you can allocate to all classes.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                  <select
                    value={allocateSubjectId}
                    onChange={(e) => setAllocateSubjectId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={allocateDueDate}
                    onChange={(e) => setAllocateDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Term</label>
                  <select
                    value={allocateTermName}
                    onChange={(e) => setAllocateTermName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={2}
                  value={allocateDescription}
                  onChange={(e) => setAllocateDescription(e.target.value)}
                  placeholder="Optional guidance or chapter reference for students..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAllocating}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAllocating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Publish & Allocate to Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK CREATE QUESTION CLASSIFIED TO FOLDER */}
      {/* ========================================================================= */}
      {isQuickCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Plus size={18} className="text-purple-400" /> Add Classified Question to Bank
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCreateModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickCreateQuestion} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question Text *</label>
                <textarea
                  required
                  rows={3}
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder="Enter the question text here..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={newQClassId}
                    onChange={(e) => setNewQClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                  <select
                    value={newQSubjectId}
                    onChange={(e) => setNewQSubjectId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Question Type</label>
                  <select
                    value={newQType}
                    onChange={(e) => setNewQType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="theory">Theory / Free Text</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newQMarks}
                    onChange={(e) => setNewQMarks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Term</label>
                  <select
                    value={newQTerm}
                    onChange={(e) => setNewQTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
              </div>

              {newQType === 'mcq' && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block">Multiple Choice Options</span>
                  <div className="grid grid-cols-2 gap-2">
                    {newQOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...newQOptions]
                            next[i] = e.target.value
                            setNewQOptions(next)
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Correct Option:</span>
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <label key={letter} className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="quickQCorrect"
                          value={letter}
                          checked={newQCorrect === letter}
                          onChange={() => setNewQCorrect(letter)}
                        />
                        {letter}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic (Optional)</label>
                <input
                  type="text"
                  value={newQTopic}
                  onChange={(e) => setNewQTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, Fractions, Verbs"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewQ}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingNewQ ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Save Question to Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMISSIONS & PERFORMANCE ANALYTICS */}
      {/* ========================================================================= */}
      {selectedHomeworkForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-4xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[90vh]">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <BarChart2 size={18} className="text-amber-400" />
                  <h3 className="font-black text-sm">Homework Submissions & Student Performance</h3>
                </div>
                <p className="text-xs text-purple-200 font-medium">
                  {selectedHomeworkForReview.title} · {selectedHomeworkForReview.class?.name} ·{' '}
                  {selectedHomeworkForReview.subject?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedHomeworkForReview(null)
                  setInspectingSubmission(null)
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* PERFORMANCE METRICS KPI BAR */}
            <div className="p-5 bg-purple-50/70 border-b border-purple-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 shrink-0 text-center">
              <div className="p-3 bg-white rounded-2xl border border-purple-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Enrolled</span>
                <span className="text-lg font-black text-slate-900">{analyticsSummary.totalEnrolled}</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-purple-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Submitted</span>
                <span className="text-lg font-black text-emerald-700">{analyticsSummary.submittedCount}</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-purple-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Turn-in Rate</span>
                <span className="text-lg font-black text-purple-700">{analyticsSummary.submissionRate}%</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-purple-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Pending</span>
                <span className="text-lg font-black text-rose-600">{analyticsSummary.pendingCount}</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-purple-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Avg Score</span>
                <span className="text-lg font-black text-indigo-700">{analyticsSummary.avgScore}</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-purple-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">High Score</span>
                <span className="text-lg font-black text-amber-600">{analyticsSummary.highScore}</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-purple-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Pass Rate</span>
                <span className="text-lg font-black text-teal-700">{analyticsSummary.passRate}%</span>
              </div>
            </div>

            {/* MODAL TABS & SEARCH */}
            <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubmissionTab('submitted')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    submissionTab === 'submitted'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Attempted ({submissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionTab('unsubmitted')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    submissionTab === 'unsubmitted'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Unsubmitted ({unsubmittedStudentsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionTab('questions')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    submissionTab === 'questions'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Assignment Questions ({Array.isArray(selectedHomeworkForReview.questions) ? selectedHomeworkForReview.questions.length : Array.isArray(selectedHomeworkForReview.questionBankIds) ? selectedHomeworkForReview.questionBankIds.length : 0})
                </button>
              </div>

              {submissionTab === 'submitted' && (
                <div className="relative w-full sm:w-56">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    placeholder="Search student or reg no..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* TAB CONTENTS (SCROLLABLE) */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingSubmissions ? (
                <div className="py-20 text-center text-slate-400">
                  <Loader2 className="inline animate-spin mb-2 text-purple-600" size={28} />
                  <p className="text-xs font-semibold">Loading student submissions & answers...</p>
                </div>
              ) : (
                <>
                  {/* TAB A: ATTEMPTED STUDENTS */}
                  {submissionTab === 'submitted' && (
                    <div>
                      {filteredSubmissions.length === 0 ? (
                        <div className="py-16 text-center text-xs text-slate-500">
                          No students found matching your criteria.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredSubmissions.map((sub) => {
                            const scoreNum = sub.score !== null ? Number(sub.score) : null
                            return (
                              <div
                                key={sub.id}
                                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 font-black flex items-center justify-center text-xs shrink-0">
                                    {(sub.student?.firstName?.[0] || 'S') + (sub.student?.lastName?.[0] || '')}
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-slate-900 text-xs">
                                      {sub.student?.firstName} {sub.student?.lastName}
                                    </h5>
                                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                                      <span>Reg No: {sub.student?.registerNo || 'N/A'}</span>
                                      <span>•</span>
                                      <span>Submitted: {new Date(sub.createdAt).toLocaleDateString()}</span>
                                    </p>
                                    {sub.feedback && (
                                      <p className="text-[10px] text-purple-700 italic mt-0.5">
                                        &ldquo;{sub.feedback}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center">
                                  <div className="text-right">
                                    <span
                                      className={`px-3 py-1 rounded-xl text-xs font-black inline-block ${
                                        scoreNum === null
                                          ? 'bg-slate-100 text-slate-700'
                                          : scoreNum >= 70
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : scoreNum >= 50
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {scoreNum !== null ? `Score: ${scoreNum}` : 'Ungraded'}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectingSubmission(sub)
                                      setGradingScore(sub.score !== null ? String(sub.score) : '')
                                      setGradingFeedback(sub.feedback || '')
                                    }}
                                    className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye size={13} /> Review Answers
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB B: UNATTEMPTED STUDENTS */}
                  {submissionTab === 'unsubmitted' && (
                    <div className="space-y-3">
                      {unsubmittedStudentsList.length === 0 ? (
                        <div className="py-16 text-center text-xs text-emerald-700 font-bold bg-emerald-50 rounded-2xl border border-emerald-100">
                          🎉 Fantastic! 100% of students in this class have submitted this homework.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {unsubmittedStudentsList.map((st) => (
                            <div
                              key={st.id}
                              className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                                  {(st.firstName?.[0] || 'S') + (st.lastName?.[0] || '')}
                                </div>
                                <div>
                                  <h6 className="font-bold text-xs text-slate-800">
                                    {st.firstName} {st.lastName}
                                  </h6>
                                  <span className="text-[10px] text-slate-400">Reg: {st.registerNo || 'N/A'}</span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[10px] font-bold border border-rose-100">
                                Pending
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB C: ASSIGNMENT QUESTIONS BREAKDOWN */}
                  {submissionTab === 'questions' && (
                    <div className="space-y-3">
                      {Array.isArray(selectedHomeworkForReview.questions) && selectedHomeworkForReview.questions.length > 0 ? (
                        selectedHomeworkForReview.questions.map((q: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span>Question {idx + 1} ({q.type || q.questionType || 'MCQ'})</span>
                              <span className="text-purple-700 font-black">{q.points || q.marks || 1} mark(s)</span>
                            </div>
                            <p className="text-xs text-slate-900 font-semibold">{q.questionText}</p>
                            {Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                {q.options.map((opt: string, oi: number) => {
                                  const letter = String.fromCharCode(65 + oi)
                                  const isCorrect = (q.correctAnswer || q.correctOption) === letter
                                  return (
                                    <div
                                      key={oi}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] ${
                                        isCorrect
                                          ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                                          : 'bg-white text-slate-600 border border-slate-200'
                                      }`}
                                    >
                                      {letter}. {opt} {isCorrect && '✓ (Key)'}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-xs text-slate-400">
                          Questions snapshot loaded from Question Bank item records.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL: DETAILED STUDENT ANSWERS REVIEW & GRADING */}
      {/* ========================================================================= */}
      {inspectingSubmission && selectedHomeworkForReview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h4 className="font-black text-sm">
                  Review Submission: {inspectingSubmission.student?.firstName} {inspectingSubmission.student?.lastName}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Reg No: {inspectingSubmission.student?.registerNo} · Submitted {new Date(inspectingSubmission.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSubmission(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* STUDENT ANSWERS BREAKDOWN */}
              <div className="space-y-3">
                <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Student Answers</h5>
                {Array.isArray(selectedHomeworkForReview.questions) && selectedHomeworkForReview.questions.length > 0 ? (
                  selectedHomeworkForReview.questions.map((q: any, idx: number) => {
                    const studentAnsObj = Array.isArray(inspectingSubmission.answers)
                      ? inspectingSubmission.answers.find((a: any) => String(a.questionId) === String(q.id))
                      : null
                    const studentAnsText = studentAnsObj?.answerText || 'No answer submitted'
                    const correctKey = String(q.correctAnswer || q.correctOption || '').trim().toUpperCase()
                    const isMatch = correctKey && String(studentAnsText).trim().toUpperCase() === correctKey

                    return (
                      <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Question {idx + 1}</span>
                          <span className="text-[11px] font-bold text-slate-500">{q.marks || q.points || 1} mark(s)</span>
                        </div>
                        <p className="text-xs text-slate-800 font-semibold">{q.questionText}</p>

                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Student Answer:</span>
                            <span
                              className={`font-black px-2 py-0.5 rounded-md ${
                                isMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {studentAnsText}
                            </span>
                          </div>
                          {correctKey && (
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span>Correct Key:</span>
                              <span className="font-bold text-emerald-700">{correctKey}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <span className="font-bold block mb-1 text-slate-700">Raw Submitted Answers:</span>
                    <pre className="text-[11px] text-slate-600 whitespace-pre-wrap font-mono">
                      {JSON.stringify(inspectingSubmission.answers, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* GRADING & FEEDBACK SECTION */}
              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3">
                <h5 className="font-extrabold text-xs text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={14} /> Adjust Score & Teacher Commentary
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Score</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={gradingScore}
                      onChange={(e) => setGradingScore(e.target.value)}
                      placeholder="e.g. 85"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Feedback / Remark</label>
                    <input
                      type="text"
                      value={gradingFeedback}
                      onChange={(e) => setGradingFeedback(e.target.value)}
                      placeholder="e.g. Excellent problem solving!"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveGrade(inspectingSubmission.id)}
                    disabled={isSavingGrade}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingGrade ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Save Grade & Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
