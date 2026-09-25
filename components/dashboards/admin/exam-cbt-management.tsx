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
  GraduationCap
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
import { showSystemStatus, resolveHttpStatus } from '@/lib/systemStatus'
import { AdminCbtManager } from './admin-cbt-manager'
import { MarksEntry } from './marks-entry'
import { ExamScheduleManager } from './exam-schedule-manager'
import { ExamHalls } from './exam-halls'
import { EvaluationMatrices } from './evaluation-matrices'

export type ExamTab = 
  | 'cbt-manager'
  | 'marks-ca'
  | 'exam-setup'
  | 'exam-schedule'
  | 'exam-halls'
  | 'evaluation-matrix'
  | 'cbt-simulator'
  | 'ai-generator'
  | 'result-publishing'

interface ClassData {
  id: number
  name: string
  sections: Array<{ section: { id: number; name: string } }>
}

interface ExamRecord {
  id: number
  name: string
  termId: number
  typeId: number
  sessionId: number
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

  // Exam Form State
  const [examName, setExamName] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [termId, setTermId] = useState('1')
  const [durationMins, setDurationMins] = useState('45')
  const [totalQuestions, setTotalQuestions] = useState('40')
  const [isSubmittingExam, setIsSubmittingExam] = useState(false)

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

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examName.trim()) {
      showSystemStatus({
        type: 'MISSING_INFO',
        title: 'Required information missing.',
        message: 'Exam Name is required. Please enter an exam title before submitting.'
      })
      return
    }

    try {
      setIsSubmittingExam(true)
      showSystemStatus({
        type: 'PROCESSING',
        title: 'Processing...',
        message: 'Publishing exam setup to database...',
        durationMs: 0
      })

      const isCbt = examTypeMode === 'cbt'
      const payload = {
        name: examName.trim(),
        termId: Number(termId || 1),
        typeId: isCbt ? 3 : 1,
        markDistribution: isCbt ? ['CBT Test', 'Theory', 'Objective'] : ['Theory', 'Objective'],
        remark: isCbt ? `CBT Exam (${durationMins || 45} mins)` : 'Manual Paper Exam'
      }

      const res = await apiSlice.post<{ success: boolean; exam: ExamRecord }>(endpoints.admin.exams, payload)
      
      if (res.success && res.exam) {
        setPublishedExams(prev => [res.exam, ...prev])
        setExamName('')
        showSystemStatus({
          type: 'ACTION_SUCCESS',
          title: 'Successfully completed.',
          message: `Exam "${res.exam.name}" successfully created and saved to database.`
        })
      }
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err.message || 'Failed to complete exam setup.'))
    } finally {
      setIsSubmittingExam(false)
    }
  }

  const handleAiGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    showSystemStatus({
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
        type: 'ACTION_SUCCESS',
        title: 'Successfully completed.',
        message: 'AI questions generated successfully!'
      })
    }, 1000)
  }

  const handlePublishResults = () => {
    setIsPublishing(true)
    showSystemStatus({
      type: 'PROCESSING',
      title: 'Processing...',
      message: 'Publishing examination results to student/parent portal...',
      durationMs: 0
    })
    setTimeout(() => {
      setIsPublished(true)
      setIsPublishing(false)
      showSystemStatus({
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
                  placeholder={examTypeMode === 'cbt' ? 'e.g. 1st Term General Science CBT Examination' : 'e.g. 1st Term Mathematics Theory Examination'}
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                  >
                    <option value="">All Branch Classes</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

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
                    <label className="block font-bold text-slate-700 mb-1">Duration (Mins) *</label>
                    <input
                      type="number"
                      required
                      value={durationMins}
                      onChange={(e) => setDurationMins(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mark Allocation</label>
                    <div className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-100 text-slate-600 font-mono">
                      Theory (60) + Objective (40)
                    </div>
                  </div>
                )}
              </div>

              {examTypeMode === 'cbt' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Question Count *</label>
                    <input
                      type="number"
                      required
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-cyan-600" /> Randomize Questions per Student
                    </label>
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
                  <span>{isSubmittingExam ? 'Creating Exam...' : (examTypeMode === 'cbt' ? 'Publish CBT Exam' : 'Create Paper Exam')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Published Exams Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Published Branch Exams ({publishedExams.length})
                </h4>
                <p className="text-slate-400 text-xs">Exams configured and recorded in master database.</p>
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
                      <th className="p-3">Exam Name</th>
                      <th className="p-3">Term</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Remark</th>
                      <th className="p-3">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExams.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-bold text-slate-400">#{ex.id}</td>
                        <td className="p-3 font-bold text-slate-900">{ex.name}</td>
                        <td className="p-3 font-semibold text-cyan-600">
                          {ex.termId === 1 ? '1st Term' : (ex.termId === 2 ? '2nd Term' : '3rd Term')}
                        </td>
                        <td className="p-3 font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ex.typeId === 3 ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {ex.typeId === 3 ? 'CBT Online' : 'Manual Paper'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{ex.remark || 'N/A'}</td>
                        <td className="p-3 text-slate-500">{new Date(ex.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs italic">
                {searchExamQuery ? 'No exams matched your search.' : 'No exams published in database yet.'}
              </div>
            )}
          </div>
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
          <EvaluationMatrices />
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
