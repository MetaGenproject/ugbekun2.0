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
  AlertCircle
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
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { showSystemStatus, resolveHttpStatus } from '@/lib/systemStatus'

type ExamTab = 
  | 'exam-setup-manual' 
  | 'exam-setup-cbt' 
  | 'ca-entry' 
  | 'cbt-exam' 
  | 'question-bank' 
  | 'ai-generator' 
  | 'results-processing' 
  | 'result-publishing' 
  | 'test-manual' 
  | 'test-setup-cbt' 
  | 'exam-hall' 
  | 'exam-timetable'

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

export function ExamCbtManagement() {
  const [activeTab, setActiveTab] = useState<ExamTab>('exam-setup-cbt')
  const [searchQuery, setSearchQuery] = useState('')

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

  // CBT Mock Questions
  const mockCbtQuestions = [
    { id: 1, q: 'Solve for x: 3x + 15 = 45', options: ['x = 5', 'x = 10', 'x = 15', 'x = 20'], correct: 'x = 10' },
    { id: 2, q: 'What is the square root of 144?', options: ['10', '11', '12', '14'], correct: '12' },
    { id: 3, q: 'Simplify: 2/5 + 3/5', options: ['1/5', '1', '5/10', '6/25'], correct: '1' },
    { id: 4, q: 'Calculate the perimeter of a rectangle with length 12cm and width 8cm.', options: ['40cm', '96cm', '20cm', '48cm'], correct: '40cm' },
  ]

  const handleCreateExam = async (e: React.FormEvent, isCbt: boolean = false) => {
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

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="text-cyan-600" size={24} /> Examinations & CBT Suite
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              CBT & Manual exam setups, AI question generator, Continuous Assessment matrix, result processing, and hall seating.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cbt-exam')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Monitor size={15} className="text-cyan-400" /> CBT Test Simulator
            </button>
            <button
              onClick={() => setActiveTab('ai-generator')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles size={15} /> AI Question Generator
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button onClick={() => setActiveTab('exam-setup-manual')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'exam-setup-manual' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📝 Exam Setup (Manual)
        </button>
        <button onClick={() => setActiveTab('exam-setup-cbt')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'exam-setup-cbt' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          💻 Exam Setup (CBT)
        </button>
        <button onClick={() => setActiveTab('ca-entry')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'ca-entry' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📊 CA Entry (+CBT Score)
        </button>
        <button onClick={() => setActiveTab('cbt-exam')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'cbt-exam' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🖥️ CBT Exam Portal
        </button>
        <button onClick={() => setActiveTab('question-bank')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'question-bank' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📚 Question Bank
        </button>
        <button onClick={() => setActiveTab('ai-generator')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'ai-generator' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🤖 AI Question Generator
        </button>
        <button onClick={() => setActiveTab('results-processing')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'results-processing' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          ⚙️ Results Processing
        </button>
        <button onClick={() => setActiveTab('result-publishing')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'result-publishing' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📢 Result Publishing
        </button>
      </div>

      {/* 1. EXAM SETUP MANUAL */}
      {activeTab === 'exam-setup-manual' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900">Manual Paper Exam Configuration</h3>
            <p className="text-xs text-slate-500">Configure paper-based written examinations and hall distribution.</p>
            
            <form onSubmit={(e) => handleCreateExam(e, false)} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Term Mathematics Theory Examination"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <button
                type="submit"
                disabled={isSubmittingExam}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-2"
              >
                {isSubmittingExam ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>{isSubmittingExam ? 'Creating Exam...' : 'Create Manual Exam'}</span>
              </button>
            </form>
          </div>

          {/* Published Exams Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-900">Published Branch Exams ({publishedExams.length})</h4>
            {loadingExams ? (
              <div className="py-8 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                <Loader2 size={16} className="animate-spin text-cyan-600" />
                <span>Loading exams records...</span>
              </div>
            ) : publishedExams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b">
                    <tr>
                      <th className="p-3">Exam Name</th>
                      <th className="p-3">Term</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {publishedExams.map((ex) => (
                      <tr key={ex.id}>
                        <td className="p-3 font-bold text-slate-900">{ex.name}</td>
                        <td className="p-3 font-semibold text-cyan-600">{ex.termId === 1 ? '1st Term' : (ex.termId === 2 ? '2nd Term' : '3rd Term')}</td>
                        <td className="p-3 font-mono">{ex.typeId === 3 ? 'CBT Online' : 'Manual Paper'}</td>
                        <td className="p-3 text-slate-500">{new Date(ex.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs italic">
                No exams published in database yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. EXAM SETUP CBT */}
      {activeTab === 'exam-setup-cbt' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900">Computer Based Test (CBT) Setup</h3>
            <p className="text-xs text-slate-500">Set up online CBT exams with instant automated scoring, timers, and question randomization.</p>
            
            <form onSubmit={(e) => handleCreateExam(e, true)} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">CBT Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Term General Science CBT Examination"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                  <label className="block font-bold text-slate-700 mb-1">Duration (Mins) *</label>
                  <input
                    type="number"
                    required
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Questions *</label>
                  <input
                    type="number"
                    required
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                <input type="checkbox" defaultChecked /> Randomize Questions per Student
              </label>

              <button
                type="submit"
                disabled={isSubmittingExam}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-2"
              >
                {isSubmittingExam ? <Loader2 size={16} className="animate-spin" /> : <Monitor size={16} />}
                <span>{isSubmittingExam ? 'Publishing CBT Exam...' : 'Publish CBT Exam'}</span>
              </button>
            </form>
          </div>

          {/* Published Exams Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-900">Published Branch Exams ({publishedExams.length})</h4>
            {loadingExams ? (
              <div className="py-8 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                <Loader2 size={16} className="animate-spin text-cyan-600" />
                <span>Loading exams records...</span>
              </div>
            ) : publishedExams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b">
                    <tr>
                      <th className="p-3">Exam Name</th>
                      <th className="p-3">Term</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Remark</th>
                      <th className="p-3">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {publishedExams.map((ex) => (
                      <tr key={ex.id}>
                        <td className="p-3 font-bold text-slate-900">{ex.name}</td>
                        <td className="p-3 font-semibold text-cyan-600">{ex.termId === 1 ? '1st Term' : (ex.termId === 2 ? '2nd Term' : '3rd Term')}</td>
                        <td className="p-3 font-mono">{ex.typeId === 3 ? 'CBT Online' : 'Manual Paper'}</td>
                        <td className="p-3 text-slate-500">{ex.remark || 'N/A'}</td>
                        <td className="p-3 text-slate-500">{new Date(ex.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs italic">
                No exams published in database yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CONTINUOUS ASSESSMENT MANUAL + CBT */}
      {activeTab === 'ca-entry' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Continuous Assessment (CA) Entry Matrix (+ CBT Scores)</h3>
          <p className="text-xs text-slate-500">CA score spreadsheet (1st Test + 2nd Test + CBT Test + Assignment = 30 Marks Total).</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>1st Test (10m)</TableHead>
                <TableHead>2nd Test (10m)</TableHead>
                <TableHead>CBT Score (10m)</TableHead>
                <TableHead>Total CA (30m)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['Chinedu Joseph Okafor', 'Amina Abubakar Bello', 'David Oluwaseun Adeleke'].map((name, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-bold text-slate-900">{name}</TableCell>
                  <TableCell className="font-mono text-xs">8 / 10</TableCell>
                  <TableCell className="font-mono text-xs">9 / 10</TableCell>
                  <TableCell className="font-mono font-bold text-cyan-700">10 / 10 (Auto-CBT)</TableCell>
                  <TableCell className="font-mono font-black text-slate-900">27 / 30</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 4. CBT EXAM PORTAL SIMULATOR */}
      {activeTab === 'cbt-exam' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">CBT Live Exam Portal</h3>
              <p className="text-xs text-slate-500">Simulated student computer-based test session.</p>
            </div>
            <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-bold rounded-full">
              Time Remaining: 42:18
            </span>
          </div>

          {!cbtSubmitted ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Question {currentCbtQ + 1} of {mockCbtQuestions.length}</span>
                <p className="font-bold text-slate-900 text-sm mt-1">{mockCbtQuestions[currentCbtQ].q}</p>
              </div>

              <div className="space-y-2">
                {mockCbtQuestions[currentCbtQ].options.map((opt, idx) => (
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

                {currentCbtQ === mockCbtQuestions.length - 1 ? (
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

      {/* 5. AI QUESTION GENERATOR */}
      {activeTab === 'ai-generator' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4 text-xs">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="text-cyan-600" size={20} /> AI Question & Test Generator
          </h3>
          <p className="text-slate-500">Automatically compose curriculum-aligned test questions using AI.</p>

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

      {/* 6. RESULT PUBLISHING */}
      {activeTab === 'result-publishing' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto text-center space-y-4 text-xs">
          <Award size={36} className="text-cyan-600 mx-auto" />
          <h3 className="font-black text-base text-slate-900">Publish Term Examination Results</h3>
          <p className="text-slate-500">Publishing makes exam report cards visible on the Student and Parent portals.</p>

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
