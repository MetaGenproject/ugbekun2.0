'use client'

import { useState } from 'react'
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
  Check
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

export function ExamCbtManagement() {
  const [activeTab, setActiveTab] = useState<ExamTab>('exam-setup-cbt')
  const [searchQuery, setSearchQuery] = useState('')

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

  // CBT Mock Questions
  const mockCbtQuestions = [
    { id: 1, q: 'Solve for x: 3x + 15 = 45', options: ['x = 5', 'x = 10', 'x = 15', 'x = 20'], correct: 'x = 10' },
    { id: 2, q: 'What is the square root of 144?', options: ['10', '11', '12', '14'], correct: '12' },
    { id: 3, q: 'Simplify: 2/5 + 3/5', options: ['1/5', '1', '5/10', '6/25'], correct: '1' },
    { id: 4, q: 'Calculate the perimeter of a rectangle with length 12cm and width 8cm.', options: ['40cm', '96cm', '20cm', '48cm'], correct: '40cm' },
  ]

  const handleAiGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setTimeout(() => {
      setAiQuestions([
        { q: `If 2x - 4 = 12, what is the value of x?`, options: ['x = 6', 'x = 8', 'x = 10', 'x = 4'], ans: 'x = 8' },
        { q: `Factorize completely: x² - 9`, options: ['(x-3)(x+3)', '(x-9)(x+1)', '(x-3)²', '(x+3)²'], ans: '(x-3)(x+3)' },
        { q: `What is the gradient of the line y = 4x + 7?`, options: ['4', '7', '1/4', '-4'], ans: '4' },
      ])
      setIsGenerating(false)
    }, 1000)
  }

  const handlePublishResults = () => {
    setIsPublishing(true)
    setTimeout(() => {
      setIsPublished(true)
      setIsPublishing(false)
      alert('1st Term Examination Results published to Ugbekun Portal! SMS and EduChat notifications dispatched to all parents.')
    }, 1000)
  }

  return (
    <div className="space-y-6">
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

      {/* 12 Sub-Module Tabs Bar */}
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
        <button onClick={() => setActiveTab('test-manual')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'test-manual' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          ✍️ Test Score (Manual)
        </button>
        <button onClick={() => setActiveTab('test-setup-cbt')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'test-setup-cbt' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🧪 Test Setup CBT
        </button>
        <button onClick={() => setActiveTab('exam-hall')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'exam-hall' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🏫 Exam Hall Seating
        </button>
        <button onClick={() => setActiveTab('exam-timetable')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'exam-timetable' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🗓️ Exam Timetable
        </button>
      </div>

      {/* 1. EXAM SETUP MANUAL */}
      {activeTab === 'exam-setup-manual' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Manual Paper Exam Configuration</h3>
          <p className="text-xs text-slate-500">Configure paper-based written examinations and hall distribution.</p>
          <form onSubmit={e => { e.preventDefault(); alert('Manual Exam Created!'); }} className="space-y-3">
            <input type="text" placeholder="Exam Title (e.g. 1st Term Mathematics Theory)" className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 font-semibold" required />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Target Class (e.g. Primary 4)" className="px-3 py-2 border rounded-xl text-xs bg-slate-50" required />
              <input type="date" className="px-3 py-2 border rounded-xl text-xs bg-slate-50" required />
            </div>
            <button type="submit" className="px-4 py-2 bg-cyan-600 text-white font-bold text-xs rounded-xl">Create Manual Exam</button>
          </form>
        </div>
      )}

      {/* 2. EXAM SETUP CBT */}
      {activeTab === 'exam-setup-cbt' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Computer Based Test (CBT) Setup</h3>
          <p className="text-xs text-slate-500">Set up online CBT exams with instant automated scoring, timers, and question randomization.</p>
          <form onSubmit={e => { e.preventDefault(); alert('CBT Exam Created!'); }} className="space-y-3">
            <input type="text" placeholder="CBT Exam Name (e.g. 1st Term General Science CBT)" className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 font-semibold" required />
            <div className="grid grid-cols-3 gap-3">
              <select className="px-3 py-2 border rounded-xl text-xs bg-slate-50"><option>Primary 4</option><option>SSS 1</option></select>
              <input type="number" placeholder="Duration (Mins)" className="px-3 py-2 border rounded-xl text-xs bg-slate-50" defaultValue={45} />
              <input type="number" placeholder="Total Qs" className="px-3 py-2 border rounded-xl text-xs bg-slate-50" defaultValue={40} />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
              <input type="checkbox" defaultChecked /> Randomize Questions per Student
            </label>
            <button type="submit" className="px-4 py-2 bg-cyan-600 text-white font-bold text-xs rounded-xl">Publish CBT Exam</button>
          </form>
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
              <p className="text-xs text-slate-500 font-medium">Student CBT Examination Interface with Live Countdown Timer.</p>
            </div>
            <span className="font-mono font-bold text-xs bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
              ⏱ Time Left: 34:12
            </span>
          </div>

          {!cbtSubmitted ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="font-extrabold text-sm text-slate-900">Question {currentCbtQ + 1} of {mockCbtQuestions.length}:</p>
                <p className="text-xs font-semibold text-slate-800">{mockCbtQuestions[currentCbtQ].q}</p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {mockCbtQuestions[currentCbtQ].options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedAns({ ...selectedAns, [currentCbtQ]: opt })}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                        selectedAns[currentCbtQ] === opt ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={currentCbtQ === 0}
                  onClick={() => setCurrentCbtQ(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-100 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Previous Q
                </button>
                {currentCbtQ < mockCbtQuestions.length - 1 ? (
                  <button onClick={() => setCurrentCbtQ(prev => prev + 1)} className="px-4 py-2 bg-cyan-600 text-white font-bold text-xs rounded-xl">Next Q</button>
                ) : (
                  <button onClick={() => setCbtSubmitted(true)} className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">Submit Exam</button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
              <h4 className="font-black text-slate-900 text-lg">CBT Exam Submitted Successfully!</h4>
              <p className="text-xs font-bold text-emerald-800">Your Score: 4 / 4 (100%) • Auto-Graded by OSe Engine</p>
              <button onClick={() => { setCbtSubmitted(false); setCurrentCbtQ(0); setSelectedAns({}); }} className="mt-2 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Retake Demo CBT</button>
            </div>
          )}
        </div>
      )}

      {/* 5. QUESTION BANK */}
      {activeTab === 'question-bank' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Master Question Bank Repository</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Q ID</TableHead><TableHead>Subject</TableHead><TableHead>Question Text</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
            <TableBody>
              {mockCbtQuestions.map(q => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono font-bold text-cyan-700">Q-EXM-0{q.id}</TableCell>
                  <TableCell className="font-bold text-slate-800">Mathematics</TableCell>
                  <TableCell className="text-xs font-medium text-slate-900">{q.q}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">MCQ</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 6. AI QUESTION GENERATOR */}
      {activeTab === 'ai-generator' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={18} /> OSe AI Exam Question Generator
          </h3>
          <form onSubmit={handleAiGenerate} className="space-y-3">
            <input type="text" value={aiSubject} onChange={e => setAiSubject(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 font-semibold" placeholder="Subject" />
            <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 font-semibold" placeholder="Topic Title" />
            <button type="submit" disabled={isGenerating} className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-2">
              {isGenerating ? <Loader2 size={14} className="animate-spin text-amber-400" /> : <Sparkles size={14} className="text-amber-400" />} Generate Exam Questions
            </button>
          </form>

          {aiQuestions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="font-bold text-xs text-slate-900 uppercase">Generated Question Items ({aiQuestions.length})</h4>
              {aiQuestions.map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1">
                  <p className="font-bold text-slate-900">{idx + 1}. {q.q}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold">Answer: {q.ans}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. RESULTS PROCESSING */}
      {activeTab === 'results-processing' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Termly Results Processing Engine</h3>
          <p className="text-xs text-slate-500">Computes final weighted scores: (30% CA + 70% Exam = 100%), GPA grades, and position ranks.</p>
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>CA (30m)</TableHead><TableHead>Exam (70m)</TableHead><TableHead>Total (100%)</TableHead><TableHead>Grade</TableHead><TableHead>Rank</TableHead></TableRow></TableHeader>
            <TableBody>
              {[
                { name: 'Chinedu Joseph Okafor', ca: 27, exam: 65, total: 92, grade: 'A1', rank: '1st' },
                { name: 'Amina Abubakar Bello', ca: 28, exam: 62, total: 90, grade: 'A1', rank: '2nd' },
                { name: 'David Oluwaseun Adeleke', ca: 24, exam: 58, total: 82, grade: 'B2', rank: '3rd' },
              ].map(r => (
                <TableRow key={r.name}>
                  <TableCell className="font-bold text-slate-900">{r.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.ca}</TableCell>
                  <TableCell className="font-mono text-xs">{r.exam}</TableCell>
                  <TableCell className="font-mono font-black text-slate-900">{r.total}%</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">{r.grade}</span></TableCell>
                  <TableCell className="font-bold text-indigo-700">{r.rank}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 8. RESULT PUBLISHING */}
      {activeTab === 'result-publishing' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto text-center space-y-4">
          <Globe size={32} className="text-cyan-600 mx-auto" />
          <h3 className="font-black text-base text-slate-900">Publish 1st Term Results to Ugbekun Portal</h3>
          <p className="text-xs text-slate-500 font-medium">When published, parents and students can securely view report cards online.</p>

          <button
            onClick={handlePublishResults}
            disabled={isPublishing || isPublished}
            className={`px-6 py-3 rounded-xl text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 mx-auto ${
              isPublished ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isPublishing ? <Loader2 size={16} className="animate-spin" /> : isPublished ? <Check size={16} /> : <Globe size={16} />}
            {isPublished ? 'Results Published & Broadcast Dispatched' : 'Publish Report Cards Now'}
          </button>
        </div>
      )}

      {/* 9. TEST SCORE MANUAL */}
      {activeTab === 'test-manual' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Manual Weekly Test Score Entry</h3>
          <p className="text-xs text-slate-500 font-medium">Fast score entry grid for weekly class quizzes.</p>
          <Table>
            <TableHeader><TableRow><TableHead>Student Name</TableHead><TableHead>Class</TableHead><TableHead>Test Score (20m)</TableHead></TableRow></TableHeader>
            <TableBody>
              {['Chinedu Joseph Okafor', 'Amina Abubakar Bello', 'David Oluwaseun Adeleke'].map((name, i) => (
                <TableRow key={i}>
                  <TableCell className="font-bold text-slate-900">{name}</TableCell>
                  <TableCell className="text-xs text-slate-600">Primary 4</TableCell>
                  <TableCell><input type="number" defaultValue={16 + i} className="w-20 px-2 py-1 border rounded text-xs font-mono font-bold" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 10. TEST SETUP CBT */}
      {activeTab === 'test-setup-cbt' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Short Quiz CBT Setup</h3>
          <input type="text" placeholder="Quiz Title (e.g. Weekly Quiz 3)" className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50" />
          <button onClick={() => alert('CBT Quiz Created!')} className="px-4 py-2 bg-cyan-600 text-white font-bold text-xs rounded-xl">Create Quiz CBT</button>
        </div>
      )}

      {/* 11. EXAM HALL */}
      {activeTab === 'exam-hall' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Exam Hall & Desk Allocation</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {['Main Multipurpose Hall A (120 Desks)', 'Science Lab CBT Center (60 Computers)', 'Library Extension (40 Desks)'].map((hall, i) => (
              <div key={i} className="p-4 border rounded-2xl bg-slate-50 space-y-2">
                <h4 className="font-bold text-xs text-slate-900">{hall}</h4>
                <p className="text-[11px] text-slate-500">Invigilator: Mrs. Victoria Adams</p>
                <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">Allocated</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12. EXAM TIMETABLE */}
      {activeTab === 'exam-timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Examination Timetable (CBT & Manual)</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Date & Time</TableHead><TableHead>Subject</TableHead><TableHead>Class</TableHead><TableHead>Type</TableHead><TableHead>Venue</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell className="font-mono text-xs">2026-08-10 09:00 AM</TableCell><TableCell className="font-bold">Mathematics</TableCell><TableCell>Primary 4</TableCell><TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700">CBT</span></TableCell><TableCell>CBT Center</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">2026-08-10 11:30 AM</TableCell><TableCell className="font-bold">English Essay</TableCell><TableCell>Primary 4</TableCell><TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">Manual</span></TableCell><TableCell>Hall A</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
