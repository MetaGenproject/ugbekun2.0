'use client'

import { useState } from 'react'
import {
  FileText,
  Sparkles,
  Award,
  Heart,
  Activity,
  History,
  Printer,
  Download,
  Loader2,
  CheckCircle2,
  Bot,
  UserCheck,
  Building2,
  Search,
  Star,
  Check,
  Send,
  Sliders
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

type ReportCardTab = 'generate' | 'ai-comments' | 'psychomotor' | 'affective' | 'history'

interface StudentReportPreview {
  id: string
  studentName: string
  admissionNo: string
  className: string
  gender: string
  totalMarks: number
  average: number
  grade: string
  position: string
  attendance: string
  psychomotorScore: string
  affectiveScore: string
  teacherComment: string
  principalComment: string
}

export function ReportCardManagement() {
  const [activeTab, setActiveTab] = useState<ReportCardTab>('generate')
  const [selectedClass, setSelectedClass] = useState('Primary 4 Gold')
  const [searchQuery, setSearchQuery] = useState('')

  // AI Comment Generator State
  const [aiStudentName, setAiStudentName] = useState('Chinedu Joseph Okafor')
  const [aiAverage, setAiAverage] = useState('92.5')
  const [isGeneratingComments, setIsGeneratingComments] = useState(false)
  const [teacherComment, setTeacherComment] = useState('Chinedu is an exceptionally diligent pupil who demonstrated mastery in Quantitative Reasoning and Science this term. Keep up the brilliant performance!')
  const [principalComment, setPrincipalComment] = useState('An outstanding academic result. Promoted with distinction!')

  // Sample Students for Reports
  const [reports, setReports] = useState<StudentReportPreview[]>([
    { id: 'REP-01', studentName: 'Chinedu Joseph Okafor', admissionNo: 'UG-2026-001', className: 'Primary 4 Gold', gender: 'Male', totalMarks: 740, average: 92.5, grade: 'A1', position: '1st out of 30', attendance: '58 / 60 Days', psychomotorScore: '5/5 Excellent', affectiveScore: '5/5 Excellent', teacherComment: 'Outstanding performance!', principalComment: 'Promoted with distinction.' },
    { id: 'REP-02', studentName: 'Amina Abubakar Bello', admissionNo: 'UG-2026-002', className: 'Primary 4 Gold', gender: 'Female', totalMarks: 720, average: 90.0, grade: 'A1', position: '2nd out of 30', attendance: '60 / 60 Days', psychomotorScore: '5/5 Excellent', affectiveScore: '5/5 Excellent', teacherComment: 'Brilliant & well behaved.', principalComment: 'Excellent result!' },
    { id: 'REP-03', studentName: 'David Oluwaseun Adeleke', admissionNo: 'UG-2026-003', className: 'Primary 4 Gold', gender: 'Male', totalMarks: 656, average: 82.0, grade: 'B2', position: '3rd out of 30', attendance: '56 / 60 Days', psychomotorScore: '4/5 Very Good', affectiveScore: '4/5 Very Good', teacherComment: 'Good effort, can improve in Math.', principalComment: 'Good progress.' },
  ])

  // Psychomotor & Affective State
  const [psychomotorRatings, setPsychomotorRatings] = useState<Record<string, Record<string, number>>>({
    'Chinedu Joseph Okafor': { Handwriting: 5, Games: 4, Crafts: 5, Verbal: 5 },
    'Amina Abubakar Bello': { Handwriting: 5, Games: 5, Crafts: 4, Verbal: 5 }
  })

  const [affectiveRatings, setAffectiveRatings] = useState<Record<string, Record<string, number>>>({
    'Chinedu Joseph Okafor': { Punctuality: 5, Neatness: 5, Politeness: 5, Leadership: 5 },
    'Amina Abubakar Bello': { Punctuality: 5, Neatness: 5, Politeness: 5, Leadership: 4 }
  })

  const handleGenerateAiComments = (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingComments(true)
    setTimeout(() => {
      const avg = Number(aiAverage) || 85
      if (avg >= 80) {
        setTeacherComment(`${aiStudentName} has shown exceptional intellectual curiosity and consistently high performance across all subjects. A model pupil in class.`)
        setPrincipalComment(`An exemplary result. Recommended for academic honors.`)
      } else {
        setTeacherComment(`${aiStudentName} demonstrates good steady progress. With additional focus on problem-solving exercises, higher attainment will be achieved.`)
        setPrincipalComment(`Satisfactory progress. Encouraged to aim higher next term.`)
      }
      setIsGeneratingComments(false)
    }, 900)
  }

  const handleRatingChange = (type: 'psychomotor' | 'affective', name: string, trait: string, score: number) => {
    if (type === 'psychomotor') {
      setPsychomotorRatings(prev => ({
        ...prev,
        [name]: { ...prev[name], [trait]: score }
      }))
    } else {
      setAffectiveRatings(prev => ({
        ...prev,
        [name]: { ...prev[name], [trait]: score }
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-rose-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-rose-600" size={24} /> Report Cards & Behavioral Assessment
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Batch report card generation, AI automated comments, psychomotor & affective traits rating, and report history archives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai-comments')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles size={15} className="text-amber-400" /> AI Comment Engine
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Printer size={15} /> Batch Print Reports
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'generate' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText size={15} /> Generate Report Cards
        </button>

        <button
          onClick={() => setActiveTab('ai-comments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'ai-comments' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles size={15} className="text-amber-300" /> AI Comments
        </button>

        <button
          onClick={() => setActiveTab('psychomotor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'psychomotor' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity size={15} /> Psychomotor Assessment
        </button>

        <button
          onClick={() => setActiveTab('affective')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'affective' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart size={15} /> Affective Assessment
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'history' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History size={15} /> Report History
        </button>
      </div>

      {/* TAB 1: GENERATE REPORT CARDS */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Termly Student Report Cards</h3>
              <p className="text-xs text-slate-400 font-medium">Select class stream to preview and batch print official report cards.</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
              >
                <option value="Primary 4 Gold">Primary 4 Gold</option>
                <option value="Primary 5 Diamond">Primary 5 Diamond</option>
                <option value="SSS 1 Science A">SSS 1 Science A</option>
              </select>

              <button
                onClick={() => alert(`Batch printing report cards for ${selectedClass}...`)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Printer size={14} /> Print All ({reports.length})
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Report Card Template Preview Cards */}
            {reports.map((r) => (
              <div key={r.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{r.studentName}</h4>
                    <p className="text-[10px] font-mono text-slate-400">{r.admissionNo} • {r.className}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">{r.grade}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">AVERAGE</span>
                    <span className="font-mono font-black text-slate-900">{r.average}%</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">POSITION</span>
                    <span className="font-bold text-indigo-700">{r.position}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600">
                  <p><strong>Attendance:</strong> {r.attendance}</p>
                  <p className="truncate"><strong>Teacher Note:</strong> {r.teacherComment}</p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    onClick={() => alert(`Printing official report card for ${r.studentName}...`)}
                    className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Printer size={13} /> View & Print Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AI COMMENTS */}
      {activeTab === 'ai-comments' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 1/3: Form Generator */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bot size={20} className="text-amber-500" />
              <div>
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">OSe AI Report Commenter</h3>
                <p className="text-[11px] text-slate-400 font-medium font-medium">Auto-generate teacher & principal report comments.</p>
              </div>
            </div>

            <form onSubmit={handleGenerateAiComments} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Student Name</label>
                <input
                  type="text"
                  value={aiStudentName}
                  onChange={e => setAiStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Overall Term Average (%)</label>
                <input
                  type="number"
                  value={aiAverage}
                  onChange={e => setAiAverage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingComments}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isGeneratingComments ? <Loader2 size={14} className="animate-spin text-amber-400" /> : <Sparkles size={14} className="text-amber-400" />} Generate AI Remarks
              </button>
            </form>
          </div>

          {/* Right 2/3: Generated Remarks */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Sparkles size={14} className="text-amber-500" /> Generated Report Card Remarks
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-rose-600" /> Form Teacher Remarks
                </h4>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{teacherComment}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Award size={14} className="text-indigo-600" /> Principal / Head Teacher Remarks
                </h4>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{principalComment}</p>
              </div>

              <button
                onClick={() => alert('Comments saved to report card profile!')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} /> Attach Remarks to Student Report Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PSYCHOMOTOR ASSESSMENT */}
      {activeTab === 'psychomotor' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Activity className="text-rose-600" size={20} /> Psychomotor Skills Rating (1 - 5 Scale)
              </h3>
              <p className="text-xs text-slate-500 font-medium">Evaluate physical skills, handwriting, sports, and technical crafts.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Handwriting (1-5)</TableHead>
                <TableHead>Games & Sports (1-5)</TableHead>
                <TableHead>Crafts & Drawing (1-5)</TableHead>
                <TableHead>Verbal Fluency (1-5)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['Chinedu Joseph Okafor', 'Amina Abubakar Bello', 'David Oluwaseun Adeleke'].map((name) => (
                <TableRow key={name}>
                  <TableCell className="font-bold text-slate-900">{name}</TableCell>
                  {['Handwriting', 'Games', 'Crafts', 'Verbal'].map((trait) => (
                    <TableCell key={trait}>
                      <select
                        value={psychomotorRatings[name]?.[trait] || 5}
                        onChange={e => handleRatingChange('psychomotor', name, trait, Number(e.target.value))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-slate-50"
                      >
                        <option value={5}>5 - Excellent</option>
                        <option value={4}>4 - Very Good</option>
                        <option value={3}>3 - Good</option>
                        <option value={2}>2 - Fair</option>
                        <option value={1}>1 - Poor</option>
                      </select>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 4: AFFECTIVE ASSESSMENT */}
      {activeTab === 'affective' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Heart className="text-rose-600" size={20} /> Affective Traits & Character Rating (1 - 5 Scale)
              </h3>
              <p className="text-xs text-slate-500 font-medium font-medium">Evaluate punctuality, neatness, politeness, leadership, and emotional stability.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Punctuality (1-5)</TableHead>
                <TableHead>Neatness (1-5)</TableHead>
                <TableHead>Politeness (1-5)</TableHead>
                <TableHead>Leadership (1-5)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['Chinedu Joseph Okafor', 'Amina Abubakar Bello', 'David Oluwaseun Adeleke'].map((name) => (
                <TableRow key={name}>
                  <TableCell className="font-bold text-slate-900">{name}</TableCell>
                  {['Punctuality', 'Neatness', 'Politeness', 'Leadership'].map((trait) => (
                    <TableCell key={trait}>
                      <select
                        value={affectiveRatings[name]?.[trait] || 5}
                        onChange={e => handleRatingChange('affective', name, trait, Number(e.target.value))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-slate-50"
                      >
                        <option value={5}>5 - Excellent</option>
                        <option value={4}>4 - Very Good</option>
                        <option value={3}>3 - Good</option>
                        <option value={2}>2 - Fair</option>
                        <option value={1}>1 - Poor</option>
                      </select>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 5: REPORT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <History className="text-rose-600" size={20} /> Historical Report Cards Archive
              </h3>
              <p className="text-xs text-slate-500 font-medium">Access past session report cards for re-printing or student transcripts.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session & Term</TableHead>
                <TableHead>Class Stream</TableHead>
                <TableHead>Total Students</TableHead>
                <TableHead>Publication Date</TableHead>
                <TableHead className="text-right">Archive Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableHead className="font-mono font-bold text-slate-800">2025/2026 • 1st Term</TableHead>
                <TableCell className="font-bold text-slate-900">Primary 4 Gold</TableCell>
                <TableCell className="font-mono text-xs text-slate-700">30 Students</TableCell>
                <TableCell className="text-xs text-slate-500">2026-08-01</TableCell>
                <TableCell className="text-right">
                  <button onClick={() => alert('Downloading 1st Term Archive PDF...')} className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition">
                    Download Archive PDF
                  </button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="font-mono font-bold text-slate-800">2024/2025 • 3rd Term</TableHead>
                <TableCell className="font-bold text-slate-900">Primary 3 Gold</TableCell>
                <TableCell className="font-mono text-xs text-slate-700">28 Students</TableCell>
                <TableCell className="text-xs text-slate-500">2025-07-20</TableCell>
                <TableCell className="text-right">
                  <button onClick={() => alert('Downloading 3rd Term Archive PDF...')} className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition">
                    Download Archive PDF
                  </button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
