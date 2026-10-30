'use client'

import { useState, useEffect } from 'react'
import {
  Award,
  Laptop,
  FileSpreadsheet,
  Monitor,
  HelpCircle,
  Sparkles,
  Cpu,
  Globe,
  Edit3,
  Calendar,
  Building2,
  CheckCircle2,
  Play,
  Search,
  Plus,
  Loader2,
  Bot,
  Send,
  Download,
  BarChart3,
  Users,
  Clock,
  Shield,
  FileCheck,
  Printer,
  Check,
  AlertCircle,
  Layers,
  GraduationCap,
  Trash2,
  X
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { showSystemStatus, resolveHttpStatus, dismissSystemStatus } from '@/lib/systemStatus'
import { AdminCbtManager } from './admin-cbt-manager'
import { MarksEntry } from './marks-entry'
import { ExamScheduleManager } from './exam-schedule-manager'
import { ExamHalls } from './exam-halls'
import { EvaluationMatrices } from './evaluation-matrices'
import { GradingScales } from './grading-scales'

export type ExamTab = 
  | 'cbt-manager'
  | 'marks-ca'
  | 'exam-setup'
  | 'exam-schedule'
  | 'exam-halls'
  | 'evaluation-matrix'
  | 'grading-scales'
  | 'cbt-simulator'
  | 'ai-generator'
  | 'result-publishing'

interface ClassData {
  id: number
  name: string
  sections: Array<{ section: { id: number; name: string } }>
}

interface ManualBreakdownItem {
  componentName: string
  marks: number | string
  averageMark?: number | string
}

interface ExamRecord {
  id: number
  name: string
  termId: number
  typeId: number
  sessionId: number
  examCategory?: string
  cbtTotalMarks?: number | null
  totalQuestionCount?: number | null
  manualMarksBreakdown?: ManualBreakdownItem[] | null
  createdAt: string
  remark?: string
}

interface ExamCbtManagementProps {
  initialTab?: string
}

export function ExamCbtManagement({ initialTab }: ExamCbtManagementProps) {
  // Normalize initialTab if older or alternate tab names are passed
  const resolveInitialTab = (tab?: string): ExamTab => {
    if (!tab) return 'cbt-manager'
    if (tab === 'cbt' || tab === 'cbt-exams' || tab === 'cbt-manager' || tab === 'online-exams') return 'cbt-manager'
    if (tab === 'marks-entry' || tab === 'marks-ca' || tab === 'ca-entry') return 'marks-ca'
    if (tab === 'exam-setup' || tab === 'exam-setup-manual' || tab === 'exam-setup-cbt') return 'exam-setup'
    if (tab === 'exam-schedule' || tab === 'exam-timetable') return 'exam-schedule'
    if (tab === 'exam-halls' || tab === 'exam-hall') return 'exam-halls'
    if (tab === 'evaluation-matrix' || tab === 'evaluation-matrices') return 'evaluation-matrix'
    if (tab === 'grading-scales' || tab === 'grading-scale' || tab === 'grading') return 'grading-scales'
    if (tab === 'cbt-exam' || tab === 'cbt-simulator') return 'cbt-simulator'
    if (tab === 'ai-generator') return 'ai-generator'
    if (tab === 'result-publishing' || tab === 'results-processing') return 'result-publishing'
    return 'cbt-manager'
  }

  const [activeTab, setActiveTab] = useState<ExamTab>(resolveInitialTab(initialTab))
  const [examTypeMode, setExamTypeMode] = useState<'cbt' | 'manual'>('cbt')
  const [searchExamQuery, setSearchExamQuery] = useState('')

  // Data State
  const [classesList, setClassesList] = useState<ClassData[]>([])
  const [publishedExams, setPublishedExams] = useState<ExamRecord[]>([])
  const [loadingExams, setLoadingExams] = useState(true)

  // Exam Form State (Exam Master Stage 1)
  const [examName, setExamName] = useState('')
  const [termId, setTermId] = useState('1')
  const [cbtTotalMarks, setCbtTotalMarks] = useState('10')
  const [totalQuestions, setTotalQuestions] = useState('20')
  const [manualBreakdown, setManualBreakdown] = useState<ManualBreakdownItem[]>([
    { componentName: 'Theory / CA', marks: 10, averageMark: 5 },
    { componentName: 'Practical / Project', marks: 10, averageMark: 5 },
  ])
  const [manualAverageMark, setManualAverageMark] = useState('10')
  const [isSubmittingExam, setIsSubmittingExam] = useState(false)
  const [deletingExamId, setDeletingExamId] = useState<number | null>(null)

  // Exam Edit Modal State
  const [editingExam, setEditingExam] = useState<ExamRecord | null>(null)
  const [editFormName, setEditFormName] = useState('')
  const [editFormTermId, setEditFormTermId] = useState('1')
  const [editFormCategory, setEditFormCategory] = useState<'cbt' | 'manual'>('cbt')
  const [editFormCbtMarks, setEditFormCbtMarks] = useState('10')
  const [editFormQuestions, setEditFormQuestions] = useState('20')
  const [editFormManualBreakdown, setEditFormManualBreakdown] = useState<ManualBreakdownItem[]>([
    { componentName: 'Theory / CA', marks: 10, averageMark: 5 },
    { componentName: 'Practical / Project', marks: 10, averageMark: 5 },
  ])
  const [editFormManualAverageMark, setEditFormManualAverageMark] = useState('10')
  const [isUpdatingExam, setIsUpdatingExam] = useState(false)

  // CBT Exam Simulator State
  const [cbtSimulatorQuestions, setCbtSimulatorQuestions] = useState<Array<{ id: number; q: string; options: string[]; correct: string }>>([
    {
      id: 1,
      q: 'Which organelle is known as the powerhouse of the eukaryotic cell?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
      correct: 'Mitochondria'
    },
    {
      id: 2,
      q: 'Solve for x in the algebraic equation: 3x - 7 = 14',
      options: ['x = 5', 'x = 7', 'x = 8', 'x = 21'],
      correct: 'x = 7'
    },
    {
      id: 3,
      q: 'What is the balanced equation representing plant photosynthesis?',
      options: ['6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O', '2H₂ + O₂ → 2H₂O', 'NaCl + H₂O → NaOH + HCl'],
      correct: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂'
    },
    {
      id: 4,
      q: 'Which Nigerian state is widely acclaimed as the "Heart Beat of the Nation"?',
      options: ['Lagos State', 'Edo State', 'Delta State', 'Ogun State'],
      correct: 'Edo State'
    }
  ])
  const [currentCbtQ, setCurrentCbtQ] = useState(0)
  const [selectedAns, setSelectedAns] = useState<Record<number, string>>({})
  const [cbtSubmitted, setCbtSubmitted] = useState(false)

  // AI Question Generator State
  const [aiSubject, setAiSubject] = useState('Mathematics')
  const [aiTopic, setAiTopic] = useState('Algebra & Equations')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiQuestions, setAiQuestions] = useState<Array<{ q: string; options: string[]; ans: string }>>([])

  // Results Publishing State
  const [isPublished, setIsPublished] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Fetch classes and exams on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingExams(true)
        const [clsRes, examRes] = await Promise.all([
          apiSlice.get<{ success: boolean; classes: ClassData[] }>(endpoints.admin.classesSections).catch(() => null),
          apiSlice.get<{ success: boolean; exams: ExamRecord[] }>(endpoints.admin.exams).catch(() => null),
        ])
        if (clsRes?.classes) setClassesList(clsRes.classes)
        if (examRes?.exams) setPublishedExams(examRes.exams)
      } catch (err) {
        console.error('[EXAM SETUP] Error loading setup data:', err)
      } finally {
        setLoadingExams(false)
      }
    }
    loadData()
  }, [])

  const addManualRow = () => {
    setManualBreakdown((prev) => [
      ...prev,
      { componentName: `Theory Component ${prev.length + 1}`, marks: 10, averageMark: 5 }
    ])
  }

  const removeManualRow = (index: number) => {
    if (manualBreakdown.length <= 1) return
    setManualBreakdown((prev) => prev.filter((_, i) => i !== index))
  }

  const updateManualRow = (index: number, field: 'componentName' | 'marks' | 'averageMark', value: any) => {
    setManualBreakdown((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        if (field === 'marks') {
          const newMarks = value === '' ? '' : Math.max(1, Number(value) || 0)
          return {
            ...item,
            marks: newMarks,
            averageMark: item.averageMark !== undefined ? (typeof item.averageMark === 'number' && typeof newMarks === 'number' ? Math.min(item.averageMark, newMarks) : item.averageMark) : (typeof newMarks === 'number' ? Math.round(newMarks / 2) : 5)
          }
        }
        if (field === 'averageMark') {
          return { ...item, averageMark: value === '' ? '' : Math.max(0, Number(value) || 0) }
        }
        return { ...item, [field]: value }
      })
    )
  }

  const handleDeleteExam = async (examId: number) => {
    if (!confirm('Are you sure you want to delete this Exam Master definition?')) return
    try {
      setDeletingExamId(examId)
      const res = await apiSlice.delete<{ success: boolean; message: string }>(`${endpoints.admin.exams}/${examId}`)
      if (res.success) {
        setPublishedExams((prev) => prev.filter((e) => e.id !== examId))
        showSystemStatus({
          type: 'ACTION_SUCCESS',
          title: 'Exam Deleted',
          message: 'The Exam Master setup was removed successfully.'
        })
      }
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err.message || 'Failed to delete exam.'))
    } finally {
      setDeletingExamId(null)
    }
  }

  const handleOpenEditModal = (ex: ExamRecord) => {
    setEditingExam(ex)
    setEditFormName(ex.name)
    setEditFormTermId(String(ex.termId || 1))
    const isCbt = ex.examCategory === 'CBT' || ex.typeId === 3
    setEditFormCategory(isCbt ? 'cbt' : 'manual')
    setEditFormCbtMarks(String(ex.cbtTotalMarks || 10))
    setEditFormQuestions(String(ex.totalQuestionCount || 20))
    const parsedAvgFromRemark = ex.remark?.match(/Average:\s*([0-9.]+)/i)?.[1]
    if (Array.isArray(ex.manualMarksBreakdown) && ex.manualMarksBreakdown.length > 0) {
      setEditFormManualBreakdown(
        ex.manualMarksBreakdown.map((m: any) => ({
          componentName: m.componentName || 'Component',
          marks: Number(m.marks) || 10,
          averageMark: m.averageMark !== undefined ? Number(m.averageMark) : Math.round((Number(m.marks) || 10) / 2)
        }))
      )
      const sumOfComponentAvgs = ex.manualMarksBreakdown.reduce((sum: number, it: any) => sum + (Number(it.averageMark) || 0), 0)
      setEditFormManualAverageMark(parsedAvgFromRemark || (sumOfComponentAvgs > 0 ? String(sumOfComponentAvgs) : '10'))
    } else {
      setEditFormManualBreakdown([
        { componentName: 'Theory / CA', marks: 10, averageMark: 5 },
        { componentName: 'Practical / Project', marks: 10, averageMark: 5 }
      ])
      setEditFormManualAverageMark(parsedAvgFromRemark || '10')
    }
  }

  const addEditManualRow = () => {
    setEditFormManualBreakdown((prev) => [
      ...prev,
      { componentName: `Theory Component ${prev.length + 1}`, marks: 10, averageMark: 5 }
    ])
  }

  const removeEditManualRow = (index: number) => {
    if (editFormManualBreakdown.length <= 1) return
    setEditFormManualBreakdown((prev) => prev.filter((_, i) => i !== index))
  }

  const updateEditManualRow = (index: number, field: 'componentName' | 'marks' | 'averageMark', value: any) => {
    setEditFormManualBreakdown((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        if (field === 'marks') {
          const newMarks = value === '' ? '' : Math.max(1, Number(value) || 0)
          return {
            ...item,
            marks: newMarks,
            averageMark: item.averageMark !== undefined ? (typeof item.averageMark === 'number' && typeof newMarks === 'number' ? Math.min(item.averageMark, newMarks) : item.averageMark) : (typeof newMarks === 'number' ? Math.round(newMarks / 2) : 5)
          }
        }
        if (field === 'averageMark') {
          return { ...item, averageMark: value === '' ? '' : Math.max(0, Number(value) || 0) }
        }
        return { ...item, [field]: value }
      })
    )
  }

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExam) return

    if (!editFormName.trim()) {
      showSystemStatus({
        type: 'MISSING_INFO',
        title: 'Required information missing.',
        message: 'Exam Title is required. Please enter an exam title before submitting.'
      })
      return
    }

    const isCbt = editFormCategory === 'cbt'
    if (isCbt) {
      if (!editFormCbtMarks || Number(editFormCbtMarks) <= 0) {
        showSystemStatus({
          type: 'MISSING_INFO',
          title: 'Valid CBT Total Marks required.',
          message: 'Please specify total CBT marks (must be greater than 0).'
        })
        return
      }
      if (!editFormQuestions || Number(editFormQuestions) <= 0) {
        showSystemStatus({
          type: 'MISSING_INFO',
          title: 'Total Question Count required.',
          message: 'Please set the approved question count cap for this exam.'
        })
        return
      }
    } else {
      if (editFormManualBreakdown.length === 0) {
        showSystemStatus({
          type: 'MISSING_INFO',
          title: 'Marks distribution required.',
          message: 'Add at least one mark allocation component for this manual paper exam.'
        })
        return
      }
    }

    let statusId: string | undefined
    try {
      setIsUpdatingExam(true)
      statusId = showSystemStatus({
        type: 'PROCESSING',
        title: 'Updating...',
        message: `Saving changes to Exam Master "${editFormName}"...`,
        durationMs: 0
      })

      const sanitizedEditManualBreakdown = editFormManualBreakdown.map((item) => ({
        componentName: item.componentName.trim() || 'Component',
        marks: Number(item.marks) || 10,
        averageMark: item.averageMark !== undefined && item.averageMark !== '' ? Number(item.averageMark) : Math.round((Number(item.marks) || 10) / 2)
      }))

      const payload = {
        name: editFormName.trim(),
        termId: Number(editFormTermId || 1),
        examCategory: isCbt ? 'CBT' : 'MANUAL',
        cbtTotalMarks: isCbt ? Number(editFormCbtMarks) : null,
        totalQuestionCount: isCbt ? Number(editFormQuestions) : null,
        manualMarksBreakdown: !isCbt ? sanitizedEditManualBreakdown : null,
        remark: isCbt
          ? `CBT Exam (${editFormCbtMarks} Marks - Cap: ${editFormQuestions} Qs)`
          : `Manual Paper Exam (Average: ${editFormManualAverageMark || 10} Marks)`
      }

      const res = await apiSlice.put<{ success: boolean; exam: ExamRecord; message?: string }>(
        `${endpoints.admin.exams}/${editingExam.id}`,
        payload
      )

      if (res.success && res.exam) {
        setPublishedExams((prev) =>
          prev.map((e) => (e.id === editingExam.id ? { ...e, ...res.exam } : e))
        )
        setEditingExam(null)
        showSystemStatus({
          id: statusId,
          type: 'ACTION_SUCCESS',
          title: 'Exam Master Updated',
          message: `Exam Master "${res.exam.name}" was successfully updated.`
        })
      }
    } catch (err: any) {
      showSystemStatus({
        ...resolveHttpStatus(500, err?.message || 'Failed to update exam definition.'),
        id: statusId
      })
    } finally {
      setIsUpdatingExam(false)
    }
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examName.trim()) {
      showSystemStatus({
        type: 'MISSING_INFO',
        title: 'Required information missing.',
        message: 'Exam Title is required. Please enter an exam title before submitting.'
      })
      return
    }

    const isCbt = examTypeMode === 'cbt'
    if (isCbt) {
      if (!cbtTotalMarks || Number(cbtTotalMarks) <= 0) {
        showSystemStatus({
          type: 'MISSING_INFO',
          title: 'Valid CBT Total Marks required.',
          message: 'Please specify total CBT marks (must be greater than 0).'
        })
        return
      }
      if (!totalQuestions || Number(totalQuestions) <= 0) {
        showSystemStatus({
          type: 'MISSING_INFO',
          title: 'Total Question Count required.',
          message: 'Please set the approved question count cap for this exam.'
        })
        return
      }
    } else {
      if (manualBreakdown.length === 0) {
        showSystemStatus({
          type: 'MISSING_INFO',
          title: 'Marks distribution required.',
          message: 'Add at least one mark allocation component for this manual paper exam.'
        })
        return
      }
    }

    let statusId: string | undefined
    try {
      setIsSubmittingExam(true)
      statusId = showSystemStatus({
        type: 'PROCESSING',
        title: 'Processing...',
        message: 'Registering Exam Master definition in database...',
        durationMs: 0
      })

      const sanitizedManualBreakdown = manualBreakdown.map((item) => ({
        componentName: item.componentName.trim() || 'Component',
        marks: Number(item.marks) || 10,
        averageMark: item.averageMark !== undefined && item.averageMark !== '' ? Number(item.averageMark) : Math.round((Number(item.marks) || 10) / 2)
      }))

      const payload = {
        name: examName.trim(),
        termId: Number(termId || 1),
        examCategory: isCbt ? 'CBT' : 'MANUAL',
        cbtTotalMarks: isCbt ? Number(cbtTotalMarks) : null,
        totalQuestionCount: isCbt ? Number(totalQuestions) : null,
        manualMarksBreakdown: !isCbt ? sanitizedManualBreakdown : null,
        remark: isCbt
          ? `CBT Exam (${cbtTotalMarks} Marks - Cap: ${totalQuestions} Qs)`
          : `Manual Paper Exam (Average: ${manualAverageMark || 10} Marks)`
      }

      const res = await apiSlice.post<{ success: boolean; exam: ExamRecord }>(endpoints.admin.exams, payload)
      
      if (res.success && res.exam) {
        setPublishedExams(prev => [res.exam, ...prev])
        setExamName('')
        showSystemStatus({
          id: statusId,
          type: 'ACTION_SUCCESS',
          title: 'Exam Master Initialized',
          message: `Exam Master "${res.exam.name}" successfully created.`
        })
      }
    } catch (err: any) {
      showSystemStatus({
        ...resolveHttpStatus(500, err.message || 'Failed to complete exam setup.'),
        id: statusId
      })
    } finally {
      setIsSubmittingExam(false)
    }
  }

  const handleAiGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    const statusId = showSystemStatus({
      type: 'PROCESSING',
      title: 'Processing...',
      message: `Generating AI questions for ${aiSubject}...`,
      durationMs: 0
    })
    setTimeout(() => {
      setAiQuestions([
        { q: `If 2x - 4 = 12, what is the value of x?`, options: ['x = 6', 'x = 8', 'x = 10', 'x = 4'], ans: 'x = 8' },
        { q: `Factorize completely: x² - 9`, options: ['(x-3)(x+3)', '(x-9)(x+1)', '(x-3)²', '(x+3)²'], ans: '(x-3)(x+3)' },
        { q: `What is the gradient of the line y = 4x + 7?`, options: ['4', '7', '1/4', '-4'], ans: '4' },
      ])
      setIsGenerating(false)
      showSystemStatus({
        id: statusId,
        type: 'ACTION_SUCCESS',
        title: 'Successfully completed.',
        message: 'AI questions generated successfully!'
      })
    }, 1000)
  }

  const handlePublishResults = () => {
    setIsPublishing(true)
    const statusId = showSystemStatus({
      type: 'PROCESSING',
      title: 'Processing...',
      message: 'Publishing examination results to student/parent portal...',
      durationMs: 0
    })
    setTimeout(() => {
      setIsPublished(true)
      setIsPublishing(false)
      showSystemStatus({
        id: statusId,
        type: 'SUCCESS',
        title: 'Successfully completed.',
        message: 'Examination results published to Ugbekun Portal! SMS and EduChat notifications dispatched.'
      })
    }, 1000)
  }

  const filteredExams = publishedExams.filter(e => 
    !searchExamQuery || e.name.toLowerCase().includes(searchExamQuery.toLowerCase()) ||
    (e.remark && e.remark.toLowerCase().includes(searchExamQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-cyan-100/50 via-blue-50/30 to-transparent rounded-full blur-3xl opacity-70" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-xl shadow-sm">
                <Award size={22} />
              </span>
              Assessments & CBT Suite
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              Unified command center for Online CBT tests, Question Bank, Continuous Assessment (CA) marks, Exam Timetables, Exam Halls, and Evaluation Matrices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('cbt-manager')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'cbt-manager'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Monitor size={15} className="text-cyan-400" /> CBT Engine
            </button>
            <button
              onClick={() => setActiveTab('marks-ca')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'marks-ca'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <FileSpreadsheet size={15} className="text-emerald-500" /> CA & Marks
            </button>
            <button
              onClick={() => setActiveTab('exam-setup')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'exam-setup'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Plus size={15} className="text-blue-500" /> Master Setup
            </button>
            <button
              onClick={() => setActiveTab('ai-generator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'ai-generator'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800'
              }`}
            >
              <Sparkles size={15} /> AI Generator
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('cbt-manager')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'cbt-manager' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Monitor size={14} /> CBT & Online Exams
        </button>

        <button
          onClick={() => setActiveTab('marks-ca')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'marks-ca' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet size={14} /> CA & Marks Entry
        </button>

        <button
          onClick={() => setActiveTab('exam-setup')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'exam-setup' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Edit3 size={14} /> Master Exam Setup
        </button>

        <button
          onClick={() => setActiveTab('exam-schedule')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'exam-schedule' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar size={14} /> Exam Timetable
        </button>

        <button
          onClick={() => setActiveTab('exam-halls')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'exam-halls' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 size={14} /> Exam Halls
        </button>

        <button
          onClick={() => setActiveTab('evaluation-matrix')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'evaluation-matrix' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers size={14} /> Evaluation Matrix
        </button>

        <button
          onClick={() => setActiveTab('grading-scales')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'grading-scales' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award size={14} /> Grading Scales
        </button>

        <button
          onClick={() => setActiveTab('cbt-simulator')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'cbt-simulator' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Play size={14} /> CBT Simulator
        </button>

        <button
          onClick={() => setActiveTab('ai-generator')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ai-generator' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles size={14} /> AI Generator
        </button>

        <button
          onClick={() => setActiveTab('result-publishing')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'result-publishing' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck size={14} /> Result Publishing
        </button>
      </div>

      {/* 1. CBT & ONLINE EXAMS (AdminCbtManager) */}
      {activeTab === 'cbt-manager' && (
        <div className="space-y-4">
          <AdminCbtManager />
        </div>
      )}

      {/* 2. CONTINUOUS ASSESSMENT & MARKS ENTRY (MarksEntry) */}
      {activeTab === 'marks-ca' && (
        <div className="space-y-4">
          <MarksEntry />
        </div>
      )}

      {/* 3. MASTER EXAM SETUP & PUBLISHED EXAMS */}
      {activeTab === 'exam-setup' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Create Academic Examination</h3>
                <p className="text-xs text-slate-500">Configure unified examinations for manual paper writing or automated CBT assessment.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setExamTypeMode('cbt')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    examTypeMode === 'cbt' ? 'bg-white text-cyan-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💻 CBT Online
                </button>
                <button
                  type="button"
                  onClick={() => setExamTypeMode('manual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    examTypeMode === 'manual' ? 'bg-white text-cyan-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 Manual Paper
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder={examTypeMode === 'cbt' ? 'e.g. CBT 1, CBT Mid-Term, Terminal CBT Exam' : 'e.g. Mid-Term Written CA, Terminal Theory Examination'}
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Term *</label>
                  <select
                    value={termId}
                    onChange={(e) => setTermId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                  >
                    <option value="1">1st Term</option>
                    <option value="2">2nd Term</option>
                    <option value="3">3rd Term</option>
                  </select>
                </div>

                {examTypeMode === 'cbt' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CBT Total Marks * (Governing Mark)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={cbtTotalMarks}
                      onChange={(e) => setCbtTotalMarks(e.target.value)}
                      placeholder="e.g. 10 or 20"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Duration is configured during question distribution sittings.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">Manual Exam Average Mark *</label>
                      <span className="text-[10px] text-slate-400">
                        Total Sum: <strong className="text-cyan-700 font-mono">{manualBreakdown.reduce((sum, item) => sum + (Number(item.marks) || 0), 0)} Marks</strong>
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        required
                        min={0}
                        max={200}
                        step="any"
                        value={manualAverageMark}
                        onChange={(e) => setManualAverageMark(e.target.value)}
                        placeholder="e.g. 10 or 12.5"
                        className="w-full px-3 py-2 pr-28 border border-emerald-300 rounded-xl text-xs bg-emerald-50/40 font-bold text-emerald-900 focus:outline-emerald-500 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const sumAvg = manualBreakdown.reduce((sum, item) => sum + (Number(item.averageMark !== undefined && item.averageMark !== '' ? item.averageMark : (Number(item.marks) || 0) / 2) || 0), 0)
                          setManualAverageMark(String(Number(sumAvg.toFixed(1))))
                        }}
                        className="absolute right-1.5 px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Auto-calculate average benchmark from component rows below"
                      >
                        <span>⚡ Auto (Sum)</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Benchmark average mark for this paper. Enter manually or click ⚡ Auto (Sum).
                    </p>
                  </div>
                )}
              </div>

              {examTypeMode === 'cbt' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approved Question Count * (Hard Cap)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={200}
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                  />
                  <p className="text-[10px] text-amber-600 font-medium mt-1">
                    ⚠️ Validation Rule: Question uploads or distribution bundles exceeding this count will be blocked automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-bold text-slate-800">Marks Distribution Builder</label>
                      <p className="text-[10px] text-slate-400">Define component names, max allocable marks, and average benchmark marks.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-200">
                        Avg: {manualBreakdown.length > 0 ? (manualBreakdown.reduce((sum, item) => sum + (Number(item.averageMark !== undefined && item.averageMark !== '' ? item.averageMark : (Number(item.marks) || 0) / 2) || 0), 0)).toFixed(1) : 0} Marks
                      </span>
                      <button
                        type="button"
                        onClick={addManualRow}
                        className="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-[11px] flex items-center gap-1 transition"
                      >
                        <Plus size={12} /> Add Component
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="hidden sm:flex items-center gap-2 px-1 text-[10px] font-bold text-slate-400 uppercase">
                      <span className="flex-1">Component Name</span>
                      <span className="w-28 text-right pr-2">Max Marks</span>
                      <span className="w-28 text-right pr-2">Average Mark</span>
                      {manualBreakdown.length > 1 && <span className="w-7"></span>}
                    </div>

                    {manualBreakdown.map((row, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-0 bg-slate-50 sm:bg-transparent rounded-xl border sm:border-0 border-slate-100">
                        <input
                          type="text"
                          required
                          value={row.componentName}
                          onChange={(e) => updateManualRow(idx, 'componentName', e.target.value)}
                          placeholder="e.g. Theory/CA or Practical"
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 w-28">
                            <input
                              type="number"
                              required
                              min={1}
                              max={100}
                              value={row.marks}
                              onChange={(e) => updateManualRow(idx, 'marks', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-right"
                            />
                            <span className="text-slate-400 font-bold text-[10px]">Max</span>
                          </div>

                          <div className="flex items-center gap-1 w-28">
                            <input
                              type="number"
                              required
                              min={0}
                              max={Number(row.marks) || 100}
                              step="any"
                              value={row.averageMark !== undefined && row.averageMark !== '' ? row.averageMark : Math.round((Number(row.marks) || 10) / 2)}
                              onChange={(e) => updateManualRow(idx, 'averageMark', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-emerald-200 bg-emerald-50/50 rounded-xl text-xs font-semibold text-right text-emerald-800"
                            />
                            <span className="text-emerald-600 font-bold text-[10px]">Avg</span>
                          </div>

                          {manualBreakdown.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeManualRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Remove Component"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingExam}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-2"
                >
                  {isSubmittingExam ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{isSubmittingExam ? 'Creating Exam Master...' : (examTypeMode === 'cbt' ? 'Save CBT Exam Master' : 'Save Manual Exam Master')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Published Exams Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Exam Master Definitions ({publishedExams.length})
                </h4>
                <p className="text-slate-400 text-xs">Governing assessment definitions for CBT and manual evaluation.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchExamQuery}
                  onChange={(e) => setSearchExamQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {loadingExams ? (
              <div className="py-8 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                <Loader2 size={16} className="animate-spin text-cyan-600" />
                <span>Loading exams records...</span>
              </div>
            ) : filteredExams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b">
                    <tr>
                      <th className="p-3">Exam ID</th>
                      <th className="p-3">Exam Title</th>
                      <th className="p-3">Term</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Marks Allocation</th>
                      <th className="p-3">Question Cap</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExams.map((ex) => {
                      const isCbt = ex.examCategory === 'CBT' || ex.typeId === 3
                      return (
                        <tr key={ex.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-mono font-bold text-slate-400">#{ex.id}</td>
                          <td className="p-3 font-bold text-slate-900">{ex.name}</td>
                          <td className="p-3 font-semibold text-cyan-600">
                            {ex.termId === 1 ? '1st Term' : (ex.termId === 2 ? '2nd Term' : '3rd Term')}
                          </td>
                          <td className="p-3 font-mono">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isCbt ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isCbt ? '💻 CBT' : '📝 MANUAL'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {isCbt ? (
                              <span>{ex.cbtTotalMarks ? `${ex.cbtTotalMarks} Marks` : 'N/A'}</span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-slate-700">
                                  {Array.isArray(ex.manualMarksBreakdown) && ex.manualMarksBreakdown.length > 0
                                    ? ex.manualMarksBreakdown.map((m: any) => `${m.componentName} (${m.marks}m${m.averageMark !== undefined ? `, avg:${m.averageMark}m` : ''})`).join(' + ')
                                    : 'Manual Scheme'}
                                </span>
                                {ex.remark?.match(/Average:\s*([0-9.]+)/i)?.[1] && (
                                  <span className="text-[10px] text-emerald-700 font-bold font-mono">
                                    Benchmark Avg: {ex.remark.match(/Average:\s*([0-9.]+)/i)?.[1]} Marks
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {isCbt && ex.totalQuestionCount ? (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-bold text-slate-700">
                                {ex.totalQuestionCount} Qs Max
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(ex)}
                                className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg hover:bg-cyan-50 transition cursor-pointer"
                                title="Edit Exam Master Definition"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={deletingExamId === ex.id}
                                onClick={() => handleDeleteExam(ex.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                title="Delete Exam Master"
                              >
                                {deletingExamId === ex.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs italic">
                {searchExamQuery ? 'No exams matched your search.' : 'No exams published in database yet.'}
              </div>
            )}
          </div>

          {/* EDIT EXAM MASTER MODAL */}
          {editingExam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col my-8">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                      <Edit3 size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Edit Exam Master Definition</h3>
                      <p className="text-[11px] text-slate-500 font-medium font-mono">
                        Exam ID #{editingExam.id}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingExam(null)}
                    className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleUpdateExam} className="p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditFormCategory('cbt')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        editFormCategory === 'cbt' ? 'bg-white text-cyan-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      💻 CBT Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormCategory('manual')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        editFormCategory === 'manual' ? 'bg-white text-cyan-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📝 Manual Paper
                    </button>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Exam Title *</label>
                    <input
                      type="text"
                      required
                      value={editFormName}
                      onChange={(e) => setEditFormName(e.target.value)}
                      placeholder="e.g. CBT 1, CBT Mid-Term, Terminal CBT Exam"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Academic Term *</label>
                      <select
                        value={editFormTermId}
                        onChange={(e) => setEditFormTermId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                      >
                        <option value="1">1st Term</option>
                        <option value="2">2nd Term</option>
                        <option value="3">3rd Term</option>
                      </select>
                    </div>

                    {editFormCategory === 'cbt' ? (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">CBT Total Marks *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={100}
                          value={editFormCbtMarks}
                          onChange={(e) => setEditFormCbtMarks(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-bold text-slate-700">Manual Exam Average Mark *</label>
                          <span className="text-[10px] text-slate-400">
                            Total Sum: <strong className="text-cyan-700 font-mono">{editFormManualBreakdown.reduce((sum, item) => sum + (Number(item.marks) || 0), 0)} Marks</strong>
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            required
                            min={0}
                            max={200}
                            step="any"
                            value={editFormManualAverageMark}
                            onChange={(e) => setEditFormManualAverageMark(e.target.value)}
                            placeholder="e.g. 10 or 12.5"
                            className="w-full px-3 py-2 pr-28 border border-emerald-300 rounded-xl text-xs bg-emerald-50/40 font-bold text-emerald-900 focus:outline-emerald-500 focus:bg-white transition"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const sumAvg = editFormManualBreakdown.reduce((sum, item) => sum + (Number(item.averageMark !== undefined && item.averageMark !== '' ? item.averageMark : (Number(item.marks) || 0) / 2) || 0), 0)
                              setEditFormManualAverageMark(String(Number(sumAvg.toFixed(1))))
                            }}
                            className="absolute right-1.5 px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Auto-calculate average benchmark from component rows below"
                          >
                            <span>⚡ Auto (Sum)</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Benchmark average mark for this paper. Enter manually or click ⚡ Auto (Sum).
                        </p>
                      </div>
                    )}
                  </div>

                  {editFormCategory === 'cbt' ? (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Approved Question Count * (Hard Cap)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={200}
                        value={editFormQuestions}
                        onChange={(e) => setEditFormQuestions(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                      />
                      <p className="text-[10px] text-amber-600 font-medium mt-1">
                        ⚠️ Validation Rule: Question uploads or distribution bundles exceeding this count will be blocked automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-bold text-slate-800">Marks Distribution Builder</label>
                          <p className="text-[10px] text-slate-400">Define component names, max allocable marks, and average benchmark marks.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-200">
                            Avg: {editFormManualBreakdown.length > 0 ? (editFormManualBreakdown.reduce((sum, item) => sum + (Number(item.averageMark !== undefined && item.averageMark !== '' ? item.averageMark : (Number(item.marks) || 0) / 2) || 0), 0)).toFixed(1) : 0} Marks
                          </span>
                          <button
                            type="button"
                            onClick={addEditManualRow}
                            className="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-[11px] flex items-center gap-1 transition"
                          >
                            <Plus size={12} /> Add Component
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        <div className="hidden sm:flex items-center gap-2 px-1 text-[10px] font-bold text-slate-400 uppercase">
                          <span className="flex-1">Component Name</span>
                          <span className="w-28 text-right pr-2">Max Marks</span>
                          <span className="w-28 text-right pr-2">Average Mark</span>
                          {editFormManualBreakdown.length > 1 && <span className="w-7"></span>}
                        </div>

                        {editFormManualBreakdown.map((row, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-0 bg-slate-50 sm:bg-transparent rounded-xl border sm:border-0 border-slate-100">
                            <input
                              type="text"
                              required
                              value={row.componentName}
                              onChange={(e) => updateEditManualRow(idx, 'componentName', e.target.value)}
                              placeholder="e.g. Theory/CA or Practical"
                              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                            />
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 w-28">
                                <input
                                  type="number"
                                  required
                                  min={1}
                                  max={100}
                                  value={row.marks}
                                  onChange={(e) => updateEditManualRow(idx, 'marks', e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-right"
                                />
                                <span className="text-slate-400 font-bold text-[10px]">Max</span>
                              </div>

                              <div className="flex items-center gap-1 w-28">
                                <input
                                  type="number"
                                  required
                                  min={0}
                                  max={Number(row.marks) || 100}
                                  step="any"
                                  value={row.averageMark !== undefined && row.averageMark !== '' ? row.averageMark : Math.round((Number(row.marks) || 10) / 2)}
                                  onChange={(e) => updateEditManualRow(idx, 'averageMark', e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-emerald-200 bg-emerald-50/50 rounded-xl text-xs font-semibold text-right text-emerald-800"
                                />
                                <span className="text-emerald-600 font-bold text-[10px]">Avg</span>
                              </div>

                              {editFormManualBreakdown.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeEditManualRow(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                  title="Remove Component"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modal Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingExam(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingExam}
                      className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isUpdatingExam ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      <span>{isUpdatingExam ? 'Saving Changes...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. EXAM TIMETABLE & SCHEDULE */}
      {activeTab === 'exam-schedule' && (
        <div className="space-y-4">
          <ExamScheduleManager />
        </div>
      )}

      {/* 5. EXAM HALLS */}
      {activeTab === 'exam-halls' && (
        <div className="space-y-4">
          <ExamHalls />
        </div>
      )}

      {/* 6. EVALUATION MATRIX */}
      {activeTab === 'evaluation-matrix' && (
        <div className="space-y-4">
          <EvaluationMatrices onGoToExamSetup={() => setActiveTab('exam-setup')} />
        </div>
      )}

      {/* 6.5. GRADING SCALES & BENCHMARKS */}
      {activeTab === 'grading-scales' && (
        <div className="space-y-4">
          <GradingScales />
        </div>
      )}

      {/* 7. CBT EXAM PORTAL SIMULATOR */}
      {activeTab === 'cbt-simulator' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">CBT Live Exam Simulator</h3>
              <p className="text-xs text-slate-500">Interactive preview of student testing experience with timer, navigation, and submission.</p>
            </div>
            <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-bold rounded-full">
              ⏱️ Time Remaining: 42:18
            </span>
          </div>

          {!cbtSubmitted ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Question {currentCbtQ + 1} of {cbtSimulatorQuestions.length}</span>
                <p className="font-bold text-slate-900 text-sm mt-1">{cbtSimulatorQuestions[currentCbtQ]?.q}</p>
              </div>

              <div className="space-y-2">
                {cbtSimulatorQuestions[currentCbtQ]?.options?.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAns({ ...selectedAns, [currentCbtQ]: opt })}
                    className={`w-full p-3 rounded-xl border text-left font-semibold transition cursor-pointer ${
                      selectedAns[currentCbtQ] === opt ? 'bg-cyan-50 border-cyan-500 text-cyan-900' : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  disabled={currentCbtQ === 0}
                  onClick={() => setCurrentCbtQ(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>

                {currentCbtQ === cbtSimulatorQuestions.length - 1 ? (
                  <button
                    onClick={() => {
                      setCbtSubmitted(true)
                      showSystemStatus({
                        type: 'ACTION_SUCCESS',
                        title: 'Successfully completed.',
                        message: 'CBT Exam submitted successfully!'
                      })
                    }}
                    className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    Submit Exam
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentCbtQ(prev => prev + 1)}
                    className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Exam Session Submitted!</h4>
              <p className="text-xs text-slate-500">Your score has been logged automatically in the portal.</p>
              <button
                onClick={() => { setCbtSubmitted(false); setCurrentCbtQ(0); setSelectedAns({}); }}
                className="px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Restart Simulator
              </button>
            </div>
          )}
        </div>
      )}

      {/* 8. AI QUESTION GENERATOR */}
      {activeTab === 'ai-generator' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4 text-xs">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="text-cyan-600" size={20} /> AI Question & Test Generator
          </h3>
          <p className="text-slate-500">Automatically compose curriculum-aligned test questions and export directly to question bank.</p>

          <form onSubmit={handleAiGenerate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Topic</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition flex items-center gap-2"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>{isGenerating ? 'Generating...' : 'Generate Questions'}</span>
            </button>
          </form>

          {aiQuestions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900">Generated Questions:</h4>
              {aiQuestions.map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-900">{idx + 1}. {q.q}</p>
                  <p className="text-[11px] text-slate-500">Options: {q.options.join(' | ')}</p>
                  <p className="text-[11px] font-bold text-emerald-600">Correct Answer: {q.ans}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 9. RESULT PUBLISHING */}
      {activeTab === 'result-publishing' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto text-center space-y-4 text-xs">
          <Award size={36} className="text-cyan-600 mx-auto" />
          <h3 className="font-black text-base text-slate-900">Publish Term Examination Results</h3>
          <p className="text-slate-500">Publishing makes exam report cards visible on the Student and Parent portals with EduChat alerts.</p>

          <button
            onClick={handlePublishResults}
            disabled={isPublishing || isPublished}
            className={`px-6 py-3 rounded-xl text-white font-bold text-xs shadow-md transition cursor-pointer ${
              isPublished ? 'bg-emerald-600' : 'bg-cyan-600 hover:bg-cyan-700'
            }`}
          >
            {isPublishing ? 'Publishing Results...' : (isPublished ? 'Results Published' : 'Publish Results Now')}
          </button>
        </div>
      )}
    </div>
  )
}
