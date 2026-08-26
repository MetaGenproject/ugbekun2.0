'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '../../../lib/apiSlice'
import {
  Search,
  Plus,
  Trash2,
  Check,
  FolderOpen,
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
  ArrowRight
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

interface QuestionBankManagerProps {
  profile?: any
  onImportToBuilder?: (questions: any[]) => void
}

export function QuestionBankManager({ profile, onImportToBuilder }: QuestionBankManagerProps) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('All')
  const [selectedClassId, setSelectedClassId] = useState<string>('All')

  // Available metadata
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([])
  const [classesList, setClassesList] = useState<Array<{ id: number; name: string }>>([])

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

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
          }
        }
        if (clsRes.success && clsRes.classes) {
          setClassesList(clsRes.classes)
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

  useEffect(() => {
    fetchQuestions()
  }, [])

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubjectId === 'All' || q.subjectId === Number(selectedSubjectId)
    const matchesClass = selectedClassId === 'All' || q.classId === Number(selectedClassId)
    return matchesSearch && matchesSubject && matchesClass
  })

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
        showNotification('Question created and added to Question Bank!')
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
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="text-amber-500" size={24} />
            Master Question Bank & Importers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build, import from Aiken/CSV, or AI-generate curriculum questions for CBT exams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud size={15} /> Bulk Import (Aiken / CSV)
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={15} /> AI Question Generator
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} /> New Question
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search questions or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
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
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="mx-auto text-slate-300" size={40} />
          <h3 className="text-sm font-bold text-slate-700">No questions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by importing questions via Aiken standard format, CSV spreadsheet, or generate them automatically using the AI generator.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Bulk Import
            </button>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              AI Generator
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.map((q, idx) => {
            const optionsList = Array.isArray(q.options) ? q.options : []
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400/60 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
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
                        onClick={() => handleDeleteQuestion(q.id)}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {optionsList.map((opt: string, optIdx: number) => {
                        const optLetter = String.fromCharCode(65 + optIdx)
                        const isCorrect = String(q.correctOption).toUpperCase() === optLetter || (q.questionType === 'true_false' && q.correctOption === (optIdx === 0 ? 'A' : 'B'))
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-xl text-[11px] font-medium border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-bold'
                                : 'bg-slate-50 border-slate-100 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {optLetter}
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

      {/* MODAL 1: BULK IMPORT (AIKEN / CSV / JSON) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <UploadCloud size={18} className="text-amber-400" /> Bulk Import Questions
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Subject *</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Class (Optional)</label>
                  <select
                    value={importClassId}
                    onChange={(e) => setImportClassId(e.target.value)}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paste {importFormat.toUpperCase()} Data
                </label>
                <textarea
                  rows={9}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  required
                  placeholder={`Paste your ${importFormat} content here...`}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Import Questions to Bank
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
                <Sparkles size={18} className="text-amber-400" /> AI Curriculum Question Generator
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAiGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Topic / Curriculum Module *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algebra & Linear Equations, Photosynthesis, West African History..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class Level</label>
                  <select
                    value={aiClassLevel}
                    onChange={(e) => setAiClassLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="Primary (Nursery - Basic 6)">Primary (Nursery - Basic 6)</option>
                    <option value="Junior Secondary (JSS 1-3)">Junior Secondary (JSS 1-3)</option>
                    <option value="Senior Secondary (SSS 1-3)">Senior Secondary (SSS 1-3)</option>
                    <option value="WAEC / NECO Standards">WAEC / NECO Standards</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Question Count</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value, 10) || 5)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="aiQType"
                      checked={aiQuestionType === 'mcq'}
                      onChange={() => setAiQuestionType('mcq')}
                    />
                    Multiple Choice (4 Options)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="aiQType"
                      checked={aiQuestionType === 'true_false'}
                      onChange={() => setAiQuestionType('true_false')}
                    />
                    True / False
                  </label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
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
