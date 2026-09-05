'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiSlice, endpoints } from '../../../lib/apiSlice'
import {
  Search,
  Plus,
  Trash2,
  Check,
  FolderOpen,
  Folder,
  Send,
  Loader2,
  AlertCircle,
  UploadCloud,
  Sparkles,
  FileText,
  HelpCircle,
  CheckCircle2,
  Layers,
  Filter,
  X,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  Clock,
  Calendar,
  Award,
  ChevronRight,
  Grid,
  List,
  FolderPlus,
  Users,
  Eye
} from 'lucide-react'

interface QuestionBankItem {
  id: number
  questionText: string
  questionType: string
  options: any
  correctOption: string | null
  marks: number
  subjectId: number
  classId: number | null
  subject?: {
    id: number
    name: string
    subjectCode?: string
  }
  class?: {
    id: number
    name: string
  } | null
}

interface OnlineExamItem {
  id: number
  title: string
  classId: number
  subjectId: number
  passingMark: number
  duration: number
  questions: any
  examDate: string | null
  createdAt: string
  class?: { id: number; name: string }
  subject?: { id: number; name: string }
  submissions?: Array<{ id: number; totalMark: number; createdAt: string }>
}

interface QuestionBankManagerProps {
  profile?: any
  onImportToBuilder?: (questions: any[]) => void
}

export function QuestionBankManager({ profile, onImportToBuilder }: QuestionBankManagerProps) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [onlineExams, setOnlineExams] = useState<OnlineExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingExams, setLoadingExams] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // View tabs: 'folders' (organized subject files) | 'pool' (flat search) | 'assigned' (published CBT tests)
  const [activeTab, setActiveTab] = useState<'folders' | 'pool' | 'assigned'>('folders')
  const [selectedFolderSubjectId, setSelectedFolderSubjectId] = useState<number | null>(null)

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('All')
  const [selectedClassId, setSelectedClassId] = useState<string>('All')
  const [folderSearchTerm, setFolderSearchTerm] = useState('')

  // Available metadata
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string; subjectCode?: string }>>([])
  const [classesList, setClassesList] = useState<Array<{ id: number; name: string }>>([])

  // Selection Pool
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [isAssignTestModalOpen, setIsAssignTestModalOpen] = useState(false)

  // Assign to Class Form State
  const [assignTitle, setAssignTitle] = useState('')
  const [assignSubjectId, setAssignSubjectId] = useState<number>(0)
  const [assignClassId, setAssignClassId] = useState<string>('')
  const [assignDuration, setAssignDuration] = useState<number>(30)
  const [assignPassingMark, setAssignPassingMark] = useState<number>(50)
  const [assignExamDate, setAssignExamDate] = useState<string>('')
  const [isPublishingExam, setIsPublishingExam] = useState(false)

  // Single Question Form state
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<'mcq' | 'true_false'>('mcq')
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>([
    'Option A',
    'Option B',
    'Option C',
    'Option D',
  ])
  const [newQuestionCorrect, setNewQuestionCorrect] = useState('A')
  const [newQuestionMarks, setNewQuestionMarks] = useState(2.0)
  const [formSubjectId, setFormSubjectId] = useState<number>(0)
  const [formClassId, setFormClassId] = useState<string>('')
  const [isSavingQuestion, setIsSavingQuestion] = useState(false)

  // Bulk Import Form state
  const [importFormat, setImportFormat] = useState<'aiken' | 'csv' | 'json'>('aiken')
  const [importText, setImportText] = useState('')
  const [importSubjectId, setImportSubjectId] = useState<number>(0)
  const [importClassId, setImportClassId] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)

  // AI Question Generator Form state
  const [aiTopic, setAiTopic] = useState('')
  const [aiSubjectId, setAiSubjectId] = useState<number>(0)
  const [aiClassLevel, setAiClassLevel] = useState('Junior Secondary (JSS)')
  const [aiCount, setAiCount] = useState(5)
  const [aiQuestionType, setAiQuestionType] = useState<'mcq' | 'true_false'>('mcq')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  const showNotification = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  // Fetch subjects & classes
  useEffect(() => {
    const loadSubjectsAndClasses = async () => {
      try {
        const [subRes, clsRes] = await Promise.all([
          apiSlice.get<{ success: boolean; subjects: any[] }>(endpoints.teacher.subjects),
          apiSlice.get<{ success: boolean; classes: any[] }>(endpoints.teacher.classesSections),
        ])
        if (subRes.success && subRes.subjects) {
          setSubjects(subRes.subjects)
          if (subRes.subjects.length > 0) {
            setFormSubjectId(subRes.subjects[0].id)
            setImportSubjectId(subRes.subjects[0].id)
            setAiSubjectId(subRes.subjects[0].id)
            setAssignSubjectId(subRes.subjects[0].id)
          }
        }
        if (clsRes.success && clsRes.classes) {
          setClassesList(clsRes.classes)
          if (clsRes.classes.length > 0) {
            setAssignClassId(String(clsRes.classes[0].id))
          }
        }
      } catch (e) {
        console.error('Failed to load subjects or classes', e)
      }
    }
    loadSubjectsAndClasses()
  }, [])

  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; items: QuestionBankItem[] }>(
        endpoints.teacher.questionBank()
      )
      if (res.success && res.items) {
        setQuestions(res.items)
      } else {
        setError('Failed to load Question Bank items.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching Question Bank.')
    } finally {
      setLoading(false)
    }
  }

  const fetchOnlineExams = async () => {
    setLoadingExams(true)
    try {
      const res = await apiSlice.get<{ success: boolean; exams: OnlineExamItem[] }>(
        endpoints.teacher.onlineExams
      )
      if (res.success && res.exams) {
        setOnlineExams(res.exams)
      }
    } catch (err) {
      console.error('Error fetching online exams:', err)
    } finally {
      setLoadingExams(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
    fetchOnlineExams()
  }, [])

  // Organize Questions by Subject into structured Folders
  const subjectFolders = useMemo(() => {
    const map = new Map<number, {
      subjectId: number
      subjectName: string
      subjectCode: string
      questionsCount: number
      classes: Set<string>
      mcqCount: number
      tfCount: number
      theoryCount: number
      totalMarks: number
      colorStyle: { bg: string; border: string; text: string; lightBg: string; badge: string }
    }>()

    const colorPresets = [
      { bg: 'bg-blue-600', border: 'border-blue-200', text: 'text-blue-700', lightBg: 'bg-blue-50/80', badge: 'bg-blue-100 text-blue-800' },
      { bg: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-700', lightBg: 'bg-emerald-50/80', badge: 'bg-emerald-100 text-emerald-800' },
      { bg: 'bg-purple-600', border: 'border-purple-200', text: 'text-purple-700', lightBg: 'bg-purple-50/80', badge: 'bg-purple-100 text-purple-800' },
      { bg: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700', lightBg: 'bg-amber-50/80', badge: 'bg-amber-100 text-amber-800' },
      { bg: 'bg-rose-500', border: 'border-rose-200', text: 'text-rose-700', lightBg: 'bg-rose-50/80', badge: 'bg-rose-100 text-rose-800' },
      { bg: 'bg-cyan-600', border: 'border-cyan-200', text: 'text-cyan-700', lightBg: 'bg-cyan-50/80', badge: 'bg-cyan-100 text-cyan-800' },
      { bg: 'bg-indigo-600', border: 'border-indigo-200', text: 'text-indigo-700', lightBg: 'bg-indigo-50/80', badge: 'bg-indigo-100 text-indigo-800' },
      { bg: 'bg-teal-600', border: 'border-teal-200', text: 'text-teal-700', lightBg: 'bg-teal-50/80', badge: 'bg-teal-100 text-teal-800' },
    ]

    // Pre-populate with all official subjects
    subjects.forEach((s, idx) => {
      map.set(s.id, {
        subjectId: s.id,
        subjectName: s.name,
        subjectCode: s.subjectCode || s.name.substring(0, 3).toUpperCase(),
        questionsCount: 0,
        classes: new Set<string>(),
        mcqCount: 0,
        tfCount: 0,
        theoryCount: 0,
        totalMarks: 0,
        colorStyle: colorPresets[idx % colorPresets.length],
      })
    })

    // Aggregate questions
    questions.forEach((q) => {
      let folder = map.get(q.subjectId)
      if (!folder) {
        folder = {
          subjectId: q.subjectId,
          subjectName: q.subject?.name || `Subject #${q.subjectId}`,
          subjectCode: q.subject?.subjectCode || 'SUB',
          questionsCount: 0,
          classes: new Set<string>(),
          mcqCount: 0,
          tfCount: 0,
          theoryCount: 0,
          totalMarks: 0,
          colorStyle: colorPresets[map.size % colorPresets.length],
        }
        map.set(q.subjectId, folder)
      }
      folder.questionsCount += 1
      folder.totalMarks += Number(q.marks || 1)
      if (q.class?.name) folder.classes.add(q.class.name)
      const qType = String(q.questionType || '').toLowerCase()
      if (qType === 'mcq') folder.mcqCount += 1
      else if (qType === 'true_false' || qType === 'tf') folder.tfCount += 1
      else folder.theoryCount += 1
    })

    return Array.from(map.values())
  }, [subjects, questions])

  // Filtered folder list
  const filteredFolders = useMemo(() => {
    return subjectFolders.filter((f) => {
      const matchSearch = f.subjectName.toLowerCase().includes(folderSearchTerm.toLowerCase()) ||
        f.subjectCode.toLowerCase().includes(folderSearchTerm.toLowerCase())
      return matchSearch
    })
  }, [subjectFolders, folderSearchTerm])

  // Selected folder data
  const currentFolder = useMemo(() => {
    if (!selectedFolderSubjectId) return null
    return subjectFolders.find((f) => f.subjectId === selectedFolderSubjectId) || null
  }, [subjectFolders, selectedFolderSubjectId])

  // Filtered questions in the active folder or general pool
  const folderQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesFolder = selectedFolderSubjectId ? q.subjectId === selectedFolderSubjectId : true
      const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = selectedSubjectId === 'All' || q.subjectId === Number(selectedSubjectId)
      const matchesClass = selectedClassId === 'All' || q.classId === Number(selectedClassId)
      return matchesFolder && matchesSearch && matchesSubject && matchesClass
    })
  }, [questions, selectedFolderSubjectId, searchTerm, selectedSubjectId, selectedClassId])

  // Handle Question Selection for Pool
  const toggleSelectQuestion = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAllFolderQuestions = () => {
    const currentFolderIds = folderQuestions.map((q) => q.id)
    const allSelected = currentFolderIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentFolderIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentFolderIds])))
    }
  }

  // Selected Questions Payload
  const selectedQuestionsObjects = useMemo(() => {
    return questions.filter((q) => selectedIds.includes(q.id))
  }, [questions, selectedIds])

  const totalSelectedMarks = useMemo(() => {
    return selectedQuestionsObjects.reduce((acc, q) => acc + Number(q.marks || 1), 0)
  }, [selectedQuestionsObjects])

  // Open Assign Modal with selected questions pre-filled
  const handleOpenAssignModal = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least 1 question from the pool to assign.')
      return
    }
    const defaultSubject = currentFolder ? currentFolder.subjectId : (selectedQuestionsObjects[0]?.subjectId || formSubjectId)
    const subjectObj = subjects.find(s => s.id === defaultSubject)
    setAssignSubjectId(defaultSubject)
    setAssignTitle(`${subjectObj?.name || 'Class'} CBT Assessment`)
    setIsAssignTestModalOpen(true)
  }

  // Submit and Distribute CBT Assessment to Class
  const handlePublishCbtAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignTitle.trim() || !assignClassId || !assignSubjectId) {
      alert('Assessment Title, Class, and Subject are required.')
      return
    }

    if (selectedQuestionsObjects.length === 0) {
      alert('No questions collected in this assessment.')
      return
    }

    setIsPublishingExam(true)
    try {
      const formattedQuestions = selectedQuestionsObjects.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        correctOption: q.correctOption,
        marks: q.marks,
      }))

      const payload = {
        title: assignTitle.trim(),
        classId: Number(assignClassId),
        subjectId: Number(assignSubjectId),
        passingMark: Number(assignPassingMark) || 50,
        duration: Number(assignDuration) || 30,
        questions: formattedQuestions,
        examDate: assignExamDate ? new Date(assignExamDate).toISOString() : new Date().toISOString(),
      }

      const res = await apiSlice.post<{ success: boolean; exam: any; message?: string }>(
        endpoints.teacher.onlineExams,
        payload
      )

      if (res.success) {
        showNotification(res.message || 'CBT Assessment successfully distributed to classroom!')
        setIsAssignTestModalOpen(false)
        setSelectedIds([])
        fetchOnlineExams()
        setActiveTab('assigned')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish CBT test.')
    } finally {
      setIsPublishingExam(false)
    }
  }

  // Delete Distributed Exam
  const handleDeleteOnlineExam = async (id: number) => {
    if (!confirm('Are you sure you want to delete this CBT assessment?')) return
    try {
      const res = await apiSlice.delete<{ success: boolean }>(`${endpoints.teacher.onlineExams}/${id}`)
      if (res.success) {
        setOnlineExams((prev) => prev.filter((ex) => ex.id !== id))
        showNotification('CBT Assessment deleted.')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete assessment.')
    }
  }

  // Handle Single Question Creation
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestionText.trim() || !formSubjectId) {
      alert('Question text and Subject are required.')
      return
    }

    setIsSavingQuestion(true)
    try {
      const opts = newQuestionType === 'true_false' ? ['True', 'False'] : newQuestionOptions.filter(o => o.trim().length > 0)

      const payload = {
        questionText: newQuestionText.trim(),
        questionType: newQuestionType,
        options: opts,
        correctOption: newQuestionCorrect,
        marks: Number(newQuestionMarks) || 1.0,
        subjectId: formSubjectId,
        classId: formClassId ? Number(formClassId) : null,
      }

      const res = await apiSlice.post<{ success: boolean; item: QuestionBankItem }>(
        endpoints.teacher.questionBank(),
        payload
      )

      if (res.success && res.item) {
        setQuestions([res.item, ...questions])
        setIsAddModalOpen(false)
        setNewQuestionText('')
        setNewQuestionOptions(['Option A', 'Option B', 'Option C', 'Option D'])
        showNotification('Question created and added to Subject Folder!')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create question.')
    } finally {
      setIsSavingQuestion(false)
    }
  }

  // Handle Bulk Import
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importText.trim() || !importSubjectId) {
      alert('Import data and Subject are required.')
      return
    }

    setIsImporting(true)
    try {
      const res = await apiSlice.post<{ success: boolean; count: number; message: string }>(
        endpoints.teacher.questionBankImport,
        {
          format: importFormat,
          data: importText,
          subjectId: importSubjectId,
          classId: importClassId ? Number(importClassId) : null,
        }
      )

      if (res.success) {
        showNotification(res.message || `Successfully imported questions!`)
        setIsImportModalOpen(false)
        setImportText('')
        fetchQuestions()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import questions. Please check format syntax.')
    } finally {
      setIsImporting(false)
    }
  }

  // Handle AI Question Generation
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiTopic.trim() || !aiSubjectId) {
      alert('Topic and Subject are required for AI generation.')
      return
    }

    setIsGeneratingAi(true)
    try {
      const res = await apiSlice.post<{ success: boolean; count: number; message: string }>(
        endpoints.teacher.questionBankAiGenerate,
        {
          subjectId: aiSubjectId,
          topic: aiTopic.trim(),
          classLevel: aiClassLevel,
          count: aiCount,
          questionType: aiQuestionType,
        }
      )

      if (res.success) {
        showNotification(res.message || `AI successfully generated questions!`)
        setIsAiModalOpen(false)
        setAiTopic('')
        fetchQuestions()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate AI questions.')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // Handle Delete Question
  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question from the Question Bank?')) return
    try {
      const res = await apiSlice.delete<{ success: boolean }>(endpoints.teacher.questionBankItem(id))
      if (res.success) {
        setQuestions(questions.filter((q) => q.id !== id))
        setSelectedIds((prev) => prev.filter((item) => item !== id))
        showNotification('Question deleted.')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete question.')
    }
  }

  const loadSampleAiken = () => {
    setImportText(`What is the primary currency of Nigeria?
A. US Dollar
B. Nigerian Naira
C. British Pound
D. Euro
ANSWER: B

Which organ in the human body is responsible for pumping blood?
A. Lungs
B. Brain
C. Heart
D. Liver
ANSWER: C

The process by which green plants make their food using sunlight is called photosynthesis.
A. True
B. False
ANSWER: A`)
  }

  const loadSampleCsv = () => {
    setImportText(`question_text,question_type,option_a,option_b,option_c,option_d,correct_option,marks
"What is 15 multiplied by 4?",mcq,"45","50","60","75",C,2.0
"Water boils at 100 degrees Celsius at standard atmospheric pressure.",true_false,"True","False","","",A,1.0
"Which of the following is a primary color in art?",mcq,"Green","Orange","Red","Purple",C,2.0`)
  }

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
              Teacher Assessment Suite
            </span>
            <span className="text-xs text-slate-400 font-bold">•</span>
            <span className="text-xs text-slate-500 font-semibold">{questions.length} Questions in Bank</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="text-amber-500" size={24} />
            CBT Examinations & Question Vault
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Organize questions into subject dossiers, pick from the pool, and deploy timed CBT assessments to your classes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (selectedFolderSubjectId) setImportSubjectId(selectedFolderSubjectId)
              setIsImportModalOpen(true)
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud size={15} /> Bulk Import (Aiken/CSV)
          </button>

          <button
            onClick={() => {
              if (selectedFolderSubjectId) setAiSubjectId(selectedFolderSubjectId)
              setIsAiModalOpen(true)
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={15} /> AI Generator
          </button>

          <button
            onClick={() => {
              if (selectedFolderSubjectId) setFormSubjectId(selectedFolderSubjectId)
              setIsAddModalOpen(true)
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} /> New Question
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('folders')
              setSelectedFolderSubjectId(null)
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'folders' && selectedFolderSubjectId === null
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Folder size={15} />
            <span>Subject Folders ({subjectFolders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pool')
              setSelectedFolderSubjectId(null)
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'pool'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Layers size={15} />
            <span>All Question Pool ({questions.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('assigned')
              setSelectedFolderSubjectId(null)
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'assigned'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Send size={15} />
            <span>Assigned CBT Tests ({onlineExams.length})</span>
          </button>
        </div>

        {/* Selected Counter Button */}
        {selectedIds.length > 0 && (
          <button
            onClick={handleOpenAssignModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2 animate-bounce cursor-pointer"
          >
            <Sparkles size={15} />
            <span>Assign {selectedIds.length} Selected to Class</span>
          </button>
        )}
      </div>

      {/* TAB 1: SUBJECT FOLDERS CABINET */}
      {activeTab === 'folders' && selectedFolderSubjectId === null && (
        <div className="space-y-6">
          {/* Search bar inside Folders */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search subject folders..."
                value={folderSearchTerm}
                onChange={(e) => setFolderSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Click any subject folder to view its question files or collect questions to assign to classes.
            </div>
          </div>

          {/* Subject Folders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredFolders.map((folder) => {
              const classesArray = Array.from(folder.classes)

              return (
                <div
                  key={folder.subjectId}
                  onClick={() => {
                    setSelectedFolderSubjectId(folder.subjectId)
                    setSelectedSubjectId(String(folder.subjectId))
                  }}
                  className="group relative bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400 shadow-xs hover:shadow-xl transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer overflow-hidden"
                >
                  {/* Folder Top Tab Effect */}
                  <div className="absolute top-0 right-0 w-24 h-6 bg-slate-100 rounded-bl-2xl border-l border-b border-slate-200/80 flex items-center justify-center">
                    <span className="text-[10px] font-black text-slate-500 tracking-wider">
                      {folder.subjectCode}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Folder Icon & Counter */}
                    <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-2xl ${folder.colorStyle.lightBg} border ${folder.colorStyle.border} flex items-center justify-center text-slate-800 shadow-xs group-hover:scale-110 transition-transform`}>
                        <FolderOpen size={28} className={folder.colorStyle.text} />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-extrabold text-xs">
                        {folder.questionsCount} Item{folder.questionsCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Subject Name */}
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                        {folder.subjectName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {folder.totalMarks} Total Marks in Pool
                      </p>
                    </div>

                    {/* Composition Breakdown */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                        {folder.mcqCount} MCQ
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                        {folder.tfCount} True/False
                      </span>
                      {folder.theoryCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                          {folder.theoryCount} Theory
                        </span>
                      )}
                    </div>

                    {/* Class Levels */}
                    {classesArray.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                        {classesArray.slice(0, 3).map((cls, cIdx) => (
                          <span key={cIdx} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold">
                            {cls}
                          </span>
                        ))}
                        {classesArray.length > 3 && (
                          <span className="text-[9px] text-slate-400 font-bold">
                            +{classesArray.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Open Folder Action */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-amber-600">
                    <span>Open Subject Folder</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 1 SUB-VIEW: INSIDE A SELECTED SUBJECT FOLDER */}
      {activeTab === 'folders' && selectedFolderSubjectId !== null && currentFolder && (
        <div className="space-y-6">
          {/* Breadcrumb & Folder Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFolderSubjectId(null)}
                  className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  <ArrowLeft size={16} />
                  <span>All Folders</span>
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
                      {currentFolder.subjectCode}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      Subject Vault Dossier
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
                    <FolderOpen className="text-amber-500" size={22} />
                    {currentFolder.subjectName}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={toggleSelectAllFolderQuestions}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckSquare size={14} className="text-blue-600" />
                  <span>
                    {folderQuestions.every(q => selectedIds.includes(q.id)) && folderQuestions.length > 0
                      ? 'Deselect All'
                      : 'Select All in Folder'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormSubjectId(currentFolder.subjectId)
                    setIsAddModalOpen(true)
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Add Question
                </button>
              </div>
            </div>

            {/* Folder Filter & Search Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder={`Search ${currentFolder.subjectName} questions...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500">Filter Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="All">All Classes</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Folder Questions Grid */}
          {folderQuestions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <BookOpen className="mx-auto text-slate-300" size={40} />
              <h3 className="text-sm font-bold text-slate-700">No questions in this folder yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add questions manually, import via Aiken/CSV, or generate curriculum-aligned questions with AI.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => {
                    setFormSubjectId(currentFolder.subjectId)
                    setIsAddModalOpen(true)
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Add Question
                </button>
                <button
                  onClick={() => {
                    setImportSubjectId(currentFolder.subjectId)
                    setIsImportModalOpen(true)
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Bulk Import
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {folderQuestions.map((q, idx) => {
                const isSelected = selectedIds.includes(q.id)
                const optionsList = Array.isArray(q.options) ? q.options : []

                return (
                  <div
                    key={`folder-q-${q.id || idx}-${idx}`}
                    onClick={() => toggleSelectQuestion(q.id)}
                    className={`relative rounded-3xl border p-5 shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200/80 hover:border-amber-400'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelectQuestion(q.id)
                            }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {isSelected ? <Check size={14} /> : null}
                          </button>
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase">
                            {q.questionType}
                          </span>
                          {q.class && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                              {q.class.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                            {q.marks} Mark{q.marks > 1 ? 's' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteQuestion(q.id)
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-900 leading-relaxed">
                        <span className="text-slate-400 mr-1.5">#{idx + 1}</span>
                        {q.questionText}
                      </p>

                      {optionsList.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {optionsList.map((opt: string, oIdx: number) => {
                            const letter = String.fromCharCode(65 + oIdx)
                            const isCorrect = q.correctOption === letter || q.correctOption === opt
                            return (
                              <div
                                key={oIdx}
                                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                    : 'bg-slate-50/80 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                                  {letter}
                                </span>
                                <span className="truncate">{opt}</span>
                                {isCorrect && <Check size={12} className="ml-auto text-emerald-600 shrink-0" />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Correct Key: <strong className="text-slate-800">{q.correctOption || 'A'}</strong></span>
                      <span className={isSelected ? 'text-blue-600 font-bold' : ''}>
                        {isSelected ? '✓ Selected for Collection' : 'Click to select'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL QUESTIONS POOL (FLAT LIST) */}
      {activeTab === 'pool' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search questions across all subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <Filter size={14} /> Subject:
              </div>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="All">All Subjects ({questions.length})</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                Class:
              </div>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="All">All Classes</option>
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question List */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="animate-spin text-amber-500" size={32} />
              <p className="text-xs font-semibold">Loading question bank items...</p>
            </div>
          ) : folderQuestions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <BookOpen className="mx-auto text-slate-300" size={40} />
              <h3 className="text-sm font-bold text-slate-700">No questions found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Get started by importing questions via Aiken standard format, CSV spreadsheet, or generate them automatically using the AI generator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {folderQuestions.map((q, idx) => {
                const isSelected = selectedIds.includes(q.id)
                const optionsList = Array.isArray(q.options) ? q.options : []
                return (
                  <div
                    key={`pool-q-${q.id || idx}-${idx}`}
                    onClick={() => toggleSelectQuestion(q.id)}
                    className={`rounded-3xl border p-5 shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200/80 hover:border-amber-400/60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelectQuestion(q.id)
                            }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {isSelected ? <Check size={14} /> : null}
                          </button>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-extrabold rounded-md">
                            {q.subject?.name || 'Subject'}
                          </span>
                          {q.class && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                              {q.class.name}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase">
                            {q.questionType}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                            {q.marks} Mark{q.marks > 1 ? 's' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteQuestion(q.id)
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-900 leading-relaxed">
                        <span className="text-slate-400 mr-1.5">#{idx + 1}</span> {q.questionText}
                      </p>

                      {optionsList.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {optionsList.map((opt: string, oIdx: number) => {
                            const letter = String.fromCharCode(65 + oIdx)
                            const isCorrect = q.correctOption === letter || q.correctOption === opt
                            return (
                              <div
                                key={oIdx}
                                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                    : 'bg-slate-50/80 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                                  {letter}
                                </span>
                                <span className="truncate">{opt}</span>
                                {isCorrect && <Check size={12} className="ml-auto text-emerald-600 shrink-0" />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Correct Key: <strong className="text-slate-800">{q.correctOption || 'A'}</strong></span>
                      <span>ID #{q.id}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PUBLISHED CBT TESTS */}
      {activeTab === 'assigned' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Send className="text-blue-600" size={20} />
                  Published & Assigned CBT Assessments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live assessments distributed to classrooms with questions collected from the master vault.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('folders')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <FolderOpen size={14} /> Open Subject Folders to Assign New
              </button>
            </div>

            {loadingExams ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="animate-spin text-blue-600" size={28} />
                <p className="text-xs font-semibold">Loading assigned CBT tests...</p>
              </div>
            ) : onlineExams.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs italic space-y-2">
                <p>No CBT assessments distributed to classrooms yet.</p>
                <p className="text-slate-500 font-semibold">Select questions from any subject folder and click &quot;Assign to Class&quot; to publish.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {onlineExams.map((exam, idx) => {
                  const qCount = Array.isArray(exam.questions) ? exam.questions.length : 0
                  const subCount = exam.submissions?.length || 0

                  return (
                    <div
                      key={`exam-${exam.id || idx}-${idx}`}
                      className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/90 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                            {exam.subject?.name || 'General'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {exam.class?.name || 'Class'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                            {exam.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <Clock size={13} className="text-slate-400" />
                            <span>{exam.duration || 30} Mins</span>
                            <span>•</span>
                            <span>Pass Mark: {exam.passingMark}%</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <span className="px-2.5 py-1 bg-white rounded-xl border border-slate-200 text-slate-700 font-bold">
                            {qCount} Questions Attached
                          </span>
                          <span className="px-2.5 py-1 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700 font-bold flex items-center gap-1">
                            <Users size={12} /> {subCount} Attempt{subCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteOnlineExam(exam.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Assessment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STICKY BOTTOM COLLECTOR ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/90 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-2xl border border-white/20 flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-xs font-black text-white">Questions Collected from Vault</p>
              <p className="text-[11px] text-slate-400">{totalSelectedMarks} Total Marks in this Batch</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-xs font-semibold cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleOpenAssignModal}
              className="px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={14} /> Assign & Distribute to Class
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: ASSIGN CBT TEST TO CLASS */}
      {isAssignTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Send size={18} className="text-amber-400" /> Distribute CBT Assessment to Classroom
              </div>
              <button
                onClick={() => setIsAssignTestModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublishCbtAssessment} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-extrabold block">Collected Pool: {selectedIds.length} Questions</span>
                  <span className="text-[11px] text-blue-700">Total Marks: {totalSelectedMarks} pts</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold">
                  Ready to Deploy
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assessment / Test Title *</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Basic Science Mid-Term CBT Test"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Subject *</label>
                  <select
                    value={assignSubjectId}
                    onChange={(e) => setAssignSubjectId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={assignClassId}
                    onChange={(e) => setAssignClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={assignDuration}
                    onChange={(e) => setAssignDuration(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pass Mark (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={assignPassingMark}
                    onChange={(e) => setAssignPassingMark(parseInt(e.target.value) || 50)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={assignExamDate}
                    onChange={(e) => setAssignExamDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignTestModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishingExam}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPublishingExam ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Publish & Assign to Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: BULK IMPORT (AIKEN / CSV / JSON) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <UploadCloud size={18} className="text-amber-400" /> Bulk Import Questions into Subject Folder
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 flex-wrap">
                <span className="text-xs font-bold text-slate-700 mr-2">Format:</span>
                <button
                  type="button"
                  onClick={() => { setImportFormat('aiken'); if (!importText) loadSampleAiken() }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    importFormat === 'aiken' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Aiken (.txt standard)
                </button>
                <button
                  type="button"
                  onClick={() => { setImportFormat('csv'); if (!importText) loadSampleCsv() }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    importFormat === 'csv' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  CSV Table (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => setImportFormat('json')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    importFormat === 'json' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  JSON (.json)
                </button>

                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={importFormat === 'aiken' ? loadSampleAiken : loadSampleCsv}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Load Sample
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Subject Folder *</label>
                  <select
                    value={importSubjectId}
                    onChange={(e) => setImportSubjectId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class Level (Optional)</label>
                  <select
                    value={importClassId}
                    onChange={(e) => setImportClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">All Classes / Universal</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paste {importFormat.toUpperCase()} Data *
                </label>
                <textarea
                  rows={8}
                  required
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your questions content here formatted strictly according to chosen standard..."
                  className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  Import Questions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI QUESTION GENERATOR */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 to-violet-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Sparkles size={18} className="text-yellow-300" /> AI Question Generator
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAiGenerate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Subject *</label>
                  <select
                    value={aiSubjectId}
                    onChange={(e) => setAiSubjectId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grade / Level</label>
                  <select
                    value={aiClassLevel}
                    onChange={(e) => setAiClassLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="Junior Secondary (JSS)">Junior Secondary (JSS)</option>
                    <option value="Senior Secondary (SSS)">Senior Secondary (SSS)</option>
                    <option value="Primary School">Primary School</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Curriculum Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Photosynthesis, Quadratic Equations, Parts of Speech"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Question Type</label>
                  <select
                    value={aiQuestionType}
                    onChange={(e) => setAiQuestionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="mcq">Multiple Choice (4 options)</option>
                    <option value="true_false">True / False</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Number of Questions</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAi}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Generate & Save Questions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE SINGLE QUESTION */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Plus size={18} className="text-amber-400" /> Create Question
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Folder *</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class Level</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">All / Any Class</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question Prompt *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the question text here..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="qtype"
                      checked={newQuestionType === 'mcq'}
                      onChange={() => setNewQuestionType('mcq')}
                    />
                    Multiple Choice
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="qtype"
                      checked={newQuestionType === 'true_false'}
                      onChange={() => setNewQuestionType('true_false')}
                    />
                    True / False
                  </label>
                </div>
              </div>

              {newQuestionType === 'mcq' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Answer Options</label>
                  {newQuestionOptions.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx)
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 text-[11px] font-black flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const copy = [...newQuestionOptions]
                            copy[idx] = e.target.value
                            setNewQuestionOptions(copy)
                          }}
                          placeholder={`Option ${letter}`}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correct Key *</label>
                  <select
                    value={newQuestionCorrect}
                    onChange={(e) => setNewQuestionCorrect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  >
                    {newQuestionType === 'mcq' ? (
                      <>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </>
                    ) : (
                      <>
                        <option value="A">True</option>
                        <option value="B">False</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marks / Points</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={newQuestionMarks}
                    onChange={(e) => setNewQuestionMarks(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuestion}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingQuestion ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
