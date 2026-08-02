'use client'

import { useState } from 'react'
import {
  FileText,
  Plus,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Clock,
  Search,
  BookOpen,
  Download,
  Loader2,
  Bot,
  Send,
  BarChart3,
  Users,
  Award,
  Calendar,
  FileCheck,
  Upload,
  Check,
  AlertTriangle
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

type HomeworkTab = 'create' | 'ai-generator' | 'question-bank' | 'assigned-classes' | 'submissions' | 'reports'

interface HomeworkTask {
  id: string
  title: string
  subject: string
  targetClass: string
  dueDate: string
  maxScore: number
  submissionCount: number
  totalStudents: number
  status: 'active' | 'closed'
}

interface QuestionItem {
  id: string
  subject: string
  topic: string
  type: 'Multiple Choice' | 'Essay' | 'Short Answer'
  questionText: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

interface SubmissionItem {
  id: string
  studentName: string
  className: string
  homeworkTitle: string
  submittedAt: string
  score?: number
  maxScore: number
  status: 'graded' | 'pending' | 'late'
}

export function HomeworkManagement() {
  const [activeTab, setActiveTab] = useState<HomeworkTab>('create')
  const [searchQuery, setSearchQuery] = useState('')

  // Create Homework Form State
  const [hwTitle, setHwTitle] = useState('')
  const [hwSubject, setHwSubject] = useState('Mathematics')
  const [hwClass, setHwClass] = useState('Primary 4')
  const [hwDueDate, setHwDueDate] = useState('')
  const [hwMaxScore, setHwMaxScore] = useState('20')
  const [hwInstructions, setHwInstructions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // AI Homework Generator State
  const [aiSubject, setAiSubject] = useState('Basic Science')
  const [aiClass, setAiClass] = useState('Primary 3')
  const [aiTopic, setAiTopic] = useState('Living & Non-Living Things')
  const [aiCount, setAiCount] = useState('5')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<Array<{ q: string; options?: string[]; ans: string }>>([])

  // Sample Datasets
  const [homeworkTasks, setHomeworkTasks] = useState<HomeworkTask[]>([
    { id: 'HW-2026-01', title: 'Fractions & Decimals Problem Set', subject: 'Mathematics', targetClass: 'Primary 4 Gold', dueDate: '2026-08-05', maxScore: 20, submissionCount: 28, totalStudents: 30, status: 'active' },
    { id: 'HW-2026-02', title: 'Essay: My Memorable Holiday', subject: 'English Language', targetClass: 'Primary 5 Diamond', dueDate: '2026-08-04', maxScore: 20, submissionCount: 25, totalStudents: 29, status: 'active' },
    { id: 'HW-2026-03', title: 'Classification of Living Organisms', subject: 'Basic Science', targetClass: 'Primary 3 Silver', dueDate: '2026-08-06', maxScore: 15, submissionCount: 20, totalStudents: 29, status: 'active' },
    { id: 'HW-2026-04', title: 'Newtonian Physics Practice Exercises', subject: 'Physics', targetClass: 'SSS 1 Science A', dueDate: '2026-08-07', maxScore: 25, submissionCount: 34, totalStudents: 38, status: 'active' },
  ])

  const [questionBank, setQuestionBank] = useState<QuestionItem[]>([
    { id: 'Q-101', subject: 'Mathematics', topic: 'Fractions', type: 'Multiple Choice', questionText: 'Which of the following is an improper fraction?', difficulty: 'Easy' },
    { id: 'Q-102', subject: 'English Language', topic: 'Nouns', type: 'Short Answer', questionText: 'Underline the proper nouns in the sentence provided.', difficulty: 'Easy' },
    { id: 'Q-103', subject: 'Basic Science', topic: 'Living Things', type: 'Multiple Choice', questionText: 'Which organelle is responsible for cellular respiration?', difficulty: 'Medium' },
    { id: 'Q-104', subject: 'Physics', topic: 'Motion', type: 'Essay', questionText: 'State and explain Newton’s Second Law of Motion with mathematical proof.', difficulty: 'Hard' },
  ])

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([
    { id: 'SUB-01', studentName: 'Chinedu Joseph Okafor', className: 'Primary 4 Gold', homeworkTitle: 'Fractions & Decimals Problem Set', submittedAt: '2026-08-01 14:20', score: 18, maxScore: 20, status: 'graded' },
    { id: 'SUB-02', studentName: 'Amina Abubakar Bello', className: 'Primary 5 Diamond', homeworkTitle: 'Essay: My Memorable Holiday', submittedAt: '2026-08-01 16:45', score: 19, maxScore: 20, status: 'graded' },
    { id: 'SUB-03', studentName: 'David Oluwaseun Adeleke', className: 'Primary 3 Silver', homeworkTitle: 'Classification of Living Organisms', submittedAt: '2026-08-02 09:10', score: undefined, maxScore: 15, status: 'pending' },
    { id: 'SUB-04', studentName: 'Emeka Victor Nnamdi', className: 'SSS 1 Science A', homeworkTitle: 'Newtonian Physics Practice Exercises', submittedAt: '2026-08-02 11:30', score: undefined, maxScore: 25, status: 'pending' },
  ])

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hwTitle || !hwDueDate) return

    setIsSubmitting(true)
    setTimeout(() => {
      const newTask: HomeworkTask = {
        id: `HW-2026-0${homeworkTasks.length + 1}`,
        title: hwTitle,
        subject: hwSubject,
        targetClass: hwClass,
        dueDate: hwDueDate,
        maxScore: Number(hwMaxScore) || 20,
        submissionCount: 0,
        totalStudents: 35,
        status: 'active'
      }

      setHomeworkTasks(prev => [newTask, ...prev])
      setIsSubmitting(false)
      alert(`Homework "${hwTitle}" created and assigned to ${hwClass}!`)
      setHwTitle('')
      setHwDueDate('')
      setHwInstructions('')
      setActiveTab('assigned-classes')
    }, 600)
  }

  const handleGenerateAiHomework = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiTopic) return

    setIsGenerating(true)
    setTimeout(() => {
      setGeneratedQuestions([
        { q: `What is the primary characteristic of ${aiTopic}?`, options: ['Ability to grow and reproduce', 'Inability to move', 'Made of metal', 'None of the above'], ans: 'Ability to grow and reproduce' },
        { q: `Identify which of the following belongs to ${aiTopic}.`, options: ['Plants and animals', 'Wooden chairs', 'Plastic bottles', 'Calculators'], ans: 'Plants and animals' },
        { q: `State two main differences between living and non-living things regarding respiration.`, ans: 'Living things respire to produce energy, whereas non-living things do not.' },
        { q: `Fill in the blank: All living organisms require __________ for survival and growth.`, ans: 'Water & Nutrients' },
        { q: `Explain why a car is classified as non-living even though it can move.`, ans: 'A car does not reproduce, grow biologically, or undergo metabolic respiration.' },
      ])
      setIsGenerating(false)
    }, 1000)
  }

  const handleGradeSubmission = (subId: string, scoreStr: string) => {
    const scoreVal = Number(scoreStr)
    setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, score: scoreVal, status: 'graded' } : s))
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-amber-600" size={24} /> Homework & Assignment Management
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Create homework assignments, generate AI question sets, manage question banks, track submissions, and evaluate performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai-generator')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles size={15} className="text-amber-400" /> AI Homework Generator
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Plus size={15} /> Create Homework
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'create' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus size={14} /> Homework Creation
        </button>

        <button
          onClick={() => setActiveTab('ai-generator')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'ai-generator' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles size={14} className="text-amber-300" /> AI Homework Generator
        </button>

        <button
          onClick={() => setActiveTab('question-bank')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'question-bank' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle size={14} /> Question Bank
        </button>

        <button
          onClick={() => setActiveTab('assigned-classes')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'assigned-classes' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={14} /> Assigned to Classes
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'submissions' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck size={14} /> Submissions List
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'reports' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={14} /> Homework Reports
        </button>
      </div>

      {/* TAB 1: HOMEWORK CREATION */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Create Homework Assignment</h3>
              <p className="text-xs text-slate-500 font-medium">Compose homework tasks and assign directly to student class streams.</p>
            </div>
          </div>

          <form onSubmit={handleCreateHomework} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Homework Assignment Title *</label>
              <input
                type="text"
                placeholder="e.g. Fractions & Decimals Problem Set 1"
                value={hwTitle}
                onChange={e => setHwTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
                <select
                  value={hwSubject}
                  onChange={e => setHwSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="English Language">English Language</option>
                  <option value="Basic Science">Basic Science</option>
                  <option value="Physics">Physics</option>
                  <option value="Financial Accounting">Financial Accounting</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Class Stream</label>
                <select
                  value={hwClass}
                  onChange={e => setHwClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                >
                  <option value="Primary 1 Gold">Primary 1 Gold</option>
                  <option value="Primary 3 Silver">Primary 3 Silver</option>
                  <option value="Primary 4 Gold">Primary 4 Gold</option>
                  <option value="Primary 5 Diamond">Primary 5 Diamond</option>
                  <option value="SSS 1 Science A">SSS 1 Science A</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Due Submission Date *</label>
                <input
                  type="date"
                  value={hwDueDate}
                  onChange={e => setHwDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Maximum Score Marks</label>
                <input
                  type="number"
                  placeholder="20"
                  value={hwMaxScore}
                  onChange={e => setHwMaxScore(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Homework Instructions & Questions</label>
              <textarea
                rows={4}
                placeholder="Type assignment questions or attachment guidelines..."
                value={hwInstructions}
                onChange={e => setHwInstructions(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Publish & Assign Homework
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: AI HOMEWORK GENERATOR */}
      {activeTab === 'ai-generator' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 1/3: Generator Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bot size={20} className="text-amber-500" />
              <div>
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">OSe AI Homework Engine</h3>
                <p className="text-[11px] text-slate-400 font-medium">Generate auto-graded homework questions instantly.</p>
              </div>
            </div>

            <form onSubmit={handleGenerateAiHomework} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
                <select
                  value={aiSubject}
                  onChange={e => setAiSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                >
                  <option value="Basic Science">Basic Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English Language">English Language</option>
                  <option value="Physics">Physics</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Class Level</label>
                <select
                  value={aiClass}
                  onChange={e => setAiClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                >
                  <option value="Primary 1">Primary 1</option>
                  <option value="Primary 3">Primary 3</option>
                  <option value="Primary 5">Primary 5</option>
                  <option value="SSS 1">SSS 1</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Living & Non-Living Things"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin text-amber-400" /> : <Sparkles size={14} className="text-amber-400" />} Generate Questions with AI
              </button>
            </form>
          </div>

          {/* Right 2/3: Generated Questions Display */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4 min-h-[460px]">
            {generatedQuestions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-xs">
                    ✓ OSe AI Generated Question Set ({generatedQuestions.length} Questions)
                  </span>
                  <button
                    onClick={() => alert('Exporting Questions to Homework Assignment...')}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    Assign to Class
                  </button>
                </div>
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {generatedQuestions.map((q, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <p className="font-bold text-xs text-slate-900">{idx + 1}. {q.q}</p>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-1.5 pl-3 text-xs text-slate-600">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx}>• {opt}</div>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-200/60">Correct Answer: {q.ans}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center my-auto py-16 text-center text-slate-400 space-y-2">
                <Sparkles size={32} className="text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No Questions Generated Yet</p>
                <p className="text-[11px] text-slate-400 max-w-sm">Enter a topic on the left panel and click "Generate Questions with AI" to create homework questions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QUESTION BANK */}
      {activeTab === 'question-bank' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="text-amber-600" size={20} /> Master Homework Question Bank ({questionBank.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">Curated repository of reusable homework questions categorized by topic and difficulty level.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Q ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Question Type</TableHead>
                <TableHead>Question Preview</TableHead>
                <TableHead>Difficulty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionBank.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono font-bold text-amber-700">{q.id}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{q.subject}</TableCell>
                  <TableCell className="text-xs text-slate-600">{q.topic}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{q.type}</span></TableCell>
                  <TableCell className="font-medium text-slate-900 text-xs truncate max-w-xs">{q.questionText}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' :
                      q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {q.difficulty}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 4: ASSIGNED TO CLASSES */}
      {activeTab === 'assigned-classes' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="text-amber-600" size={20} /> Active Homework Assigned to Classes
              </h3>
              <p className="text-xs text-slate-500 font-medium">Currently active assignments with submission counts and due date countdowns.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Ref</TableHead>
                <TableHead>Homework Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Target Class</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {homeworkTasks.map((hw) => (
                <TableRow key={hw.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{hw.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{hw.title}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">{hw.subject}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">{hw.targetClass}</span></TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">{hw.dueDate}</TableCell>
                  <TableCell className="font-mono font-bold text-slate-900">{hw.submissionCount} / {hw.totalStudents}</TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => setActiveTab('submissions')} className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg transition">
                      View Submissions
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 5: HOMEWORK SUBMISSION LIST */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <FileCheck className="text-amber-600" size={20} /> Student Homework Submissions List
              </h3>
              <p className="text-xs text-slate-500 font-medium">Review student homework submissions, grade answers, and record scores.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sub ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class Stream</TableHead>
                <TableHead>Homework Title</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Grade Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-mono font-bold text-slate-700">{sub.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{sub.studentName}</TableCell>
                  <TableCell className="text-xs text-slate-600">{sub.className}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{sub.homeworkTitle}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{sub.submittedAt}</TableCell>
                  <TableCell className="font-mono font-black text-slate-900">
                    {sub.score !== undefined ? `${sub.score} / ${sub.maxScore}` : 'Not Graded'}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => {
                        const s = prompt(`Enter score for ${sub.studentName} (out of ${sub.maxScore}):`, '18')
                        if (s) handleGradeSubmission(sub.id, s)
                      }}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition"
                    >
                      {sub.score !== undefined ? 'Update Score' : 'Grade Submission'}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 6: HOMEWORK REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-amber-600" size={20} /> Homework Analytics & Submission Reports
              </h3>
              <p className="text-xs text-slate-500 font-medium">Assignment completion rates, average scores, and class submission trends.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Assigned Tasks</p>
              <p className="text-2xl font-black text-slate-900 mt-1">24 Active</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Average Completion Rate</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">89.4%</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-amber-50">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Average Class Score</p>
              <p className="text-2xl font-black text-amber-950 mt-1">84.2%</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-blue-50">
              <p className="text-[11px] font-bold text-blue-700 uppercase">Graded Submissions</p>
              <p className="text-2xl font-black text-blue-950 mt-1">107 Total</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
