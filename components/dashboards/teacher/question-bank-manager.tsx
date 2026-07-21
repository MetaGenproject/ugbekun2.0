'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '../../../lib/apiSlice'
import { Search, Plus, Trash, Check, FolderOpen, Send, Loader2, AlertCircle } from 'lucide-react'

interface QuestionBankItem {
  id: number
  questionText: string
  questionType: string
  options: any
  correctOption: string | null
  marks: number
  subjectId: number
  classId: number | null
  subject: {
    id: number
    name: string
  }
  class: {
    id: number
    name: string
  } | null
}

interface QuestionBankManagerProps {
  profile: any
  onImportToBuilder?: (questions: any[]) => void
}

export function QuestionBankManager({ profile, onImportToBuilder }: QuestionBankManagerProps) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('All')

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Create Question form
  const [isAdding, setIsAdding] = useState(false)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState('MCQ')
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(['', '', '', ''])
  const [newQuestionCorrect, setNewQuestionCorrect] = useState('')
  const [newQuestionMarks, setNewQuestionMarks] = useState(1)
  const [formSubjectId, setFormSubjectId] = useState<number>(0)
  const [formClassId, setFormClassId] = useState<string>('')

  // Distribute Modal state
  const [isDistributing, setIsDistributing] = useState(false)
  const [distributeTitle, setDistributeTitle] = useState('')
  const [distributePassingMark, setDistributePassingMark] = useState(50)
  const [distributeDuration, setDistributeDuration] = useState(30)
  const [distributeClassIds, setDistributeClassIds] = useState<number[]>([])
  const [distributeSubjectId, setDistributeSubjectId] = useState<number>(0)
  const [distributingStatus, setDistributingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [distributeExamDate, setDistributeExamDate] = useState<string>('')

  // Fetch all subjects taught by teacher to populate dropdowns
  const uniqueSubjectsMap = new Map<number, string>()
  ;(profile?.subjectAssignments || []).forEach((sa: any) => {
    uniqueSubjectsMap.set(sa.subjectId, sa.subjectName)
  })
  const subjects = Array.from(uniqueSubjectsMap.entries()).map(([id, name]) => ({ id, name }))

  // Fetch unique classes taught by teacher for distribution
  const uniqueClassesMap = new Map<number, string>()
  ;(profile?.subjectAssignments || []).forEach((sa: any) => {
    uniqueClassesMap.set(sa.classId, sa.className)
  })
  const classesList = Array.from(uniqueClassesMap.entries()).map(([id, name]) => ({ id, name }))

  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; items: QuestionBankItem[] }>(
        endpoints.teacher.questionBank
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

  // Set default subject ID on form when isAdding is toggled
  useEffect(() => {
    if (subjects.length > 0 && formSubjectId === 0) {
      setFormSubjectId(subjects[0].id)
    }
  }, [isAdding, subjects])

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubjectId === 'All' || q.subjectId === Number(selectedSubjectId)
    return matchesSearch && matchesSubject
  })

  // Handle Question Creation
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestionText.trim() || !formSubjectId) {
      alert('Question text and Subject are required.')
      return
    }

    const payload = {
      questionText: newQuestionText,
      questionType: newQuestionType.toLowerCase(),
      options: newQuestionType === 'MCQ' ? newQuestionOptions.filter(o => o.trim() !== '') : null,
      correctOption: newQuestionCorrect || null,
      marks: newQuestionMarks,
      subjectId: formSubjectId,
      classId: formClassId ? Number(formClassId) : null
    }

    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.teacher.questionBank,
        payload
      )
      if (res.success) {
        alert(res.message || 'Question saved to bank!')
        setIsAdding(false)
        setNewQuestionText('')
        setNewQuestionOptions(['', '', '', ''])
        setNewQuestionCorrect('')
        setNewQuestionMarks(1)
        fetchQuestions()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save question.')
    }
  }

  // Handle Question Deletion
  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question from the Question Bank?')) return
    try {
      const res = await apiSlice.delete<{ success: boolean }>(
        endpoints.teacher.questionBankItem(id)
      )
      if (res.success) {
        setQuestions(prev => prev.filter(q => q.id !== id))
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete question.')
    }
  }

  // Handle Toggle Selection
  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredQuestions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredQuestions.map(q => q.id))
    }
  }

  // Open distribution dialog for selected questions
  const openDistributeDialog = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one question to distribute.')
      return
    }

    // Determine subject of selected questions (default to first question's subject)
    const firstSelected = questions.find(q => q.id === selectedIds[0])
    if (firstSelected) {
      setDistributeSubjectId(firstSelected.subjectId)
    }
    
    setDistributeTitle('CBT Assessment - ' + new Date().toLocaleDateString())
    setDistributeClassIds([])
    setDistributeExamDate('')
    setDistributingStatus('idle')
    setIsDistributing(true)
  }

  // Distribute selected questions as CBT exam to multiple classes
  const handleDistribute = async () => {
    if (distributeClassIds.length === 0) {
      alert('Please select at least one class to distribute to.')
      return
    }
    if (!distributeTitle.trim()) {
      alert('CBT Exam Title is required.')
      return
    }

    setDistributingStatus('loading')

    // Prepare questions payload
    const selectedQuestions = questions.filter(q => selectedIds.includes(q.id))
    const formattedQuestions = selectedQuestions.map((q, idx) => ({
      id: `qb_${q.id}_${idx}`,
      type: q.questionType === 'mcq' ? 'MCQ' : q.questionType === 'tf' ? 'TF' : 'THEORY',
      questionText: q.questionText,
      options: q.options || [],
      correctAnswer: q.correctOption || '',
      points: q.marks || 1
    }))

    const payload = {
      title: distributeTitle,
      subjectId: distributeSubjectId,
      passingMark: distributePassingMark,
      duration: distributeDuration,
      questions: formattedQuestions,
      classIds: distributeClassIds,
      examDate: distributeExamDate || null
    }

    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.teacher.distributeExam,
        payload
      )
      if (res.success) {
        setDistributingStatus('success')
        setSelectedIds([])
        setTimeout(() => {
          setIsDistributing(false)
        }, 1500)
      } else {
        setDistributingStatus('error')
      }
    } catch (err) {
      console.error(err)
      setDistributingStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <FolderOpen className="text-blue-600" size={20} />
            Question Bank Repository
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Store, curate, and distribute standardized test questions instantly to multiple classrooms.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onImportToBuilder && selectedIds.length > 0 && (
            <button
              onClick={() => {
                const selectedQs = questions.filter(q => selectedIds.includes(q.id))
                onImportToBuilder(selectedQs)
                setSelectedIds([])
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} className="stroke-[2.5]" />
              Import ({selectedIds.length}) to Builder
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={openDistributeDialog}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={14} className="stroke-[2.5]" />
              Distribute CBT ({selectedIds.length} Questions)
            </button>
          )}

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" />
            {isAdding ? 'Close Builder' : 'New Bank Question'}
          </button>
        </div>
      </div>

      {/* Add New Question Section */}
      {isAdding && (
        <form onSubmit={handleCreateQuestion} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner">
          <h3 className="text-sm font-black text-slate-800">Add New Question to Bank</h3>
          
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Question Text</label>
              <textarea
                required
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Type your question content here..."
                rows={2}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-none"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Subject Scope</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
                >
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Target Grade (Optional)</label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="">General (No Class Target)</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Question Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['MCQ', 'Theory'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setNewQuestionType(t)
                      setNewQuestionCorrect('')
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${newQuestionType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Points / Weight</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={newQuestionMarks}
                onChange={(e) => setNewQuestionMarks(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              />
            </div>

            {newQuestionType === 'MCQ' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Correct Answer Option</label>
                <select
                  value={newQuestionCorrect}
                  onChange={(e) => setNewQuestionCorrect(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="">Select Correct Option</option>
                  {newQuestionOptions.map((opt, oIdx) => (
                    <option key={oIdx} value={opt || `Option ${String.fromCharCode(65 + oIdx)}`}>
                      {String.fromCharCode(65 + oIdx)}: {opt || `Option ${String.fromCharCode(65 + oIdx)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {newQuestionType === 'MCQ' && (
            <div className="space-y-2 pt-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">MCQ Options (Multiple Choice)</label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {newQuestionOptions.map((opt, oIdx) => (
                  <input
                    key={oIdx}
                    type="text"
                    required
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newQuestionOptions]
                      updated[oIdx] = e.target.value
                      setNewQuestionOptions(updated)
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-200/60">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/10 cursor-pointer"
            >
              Save to Question Bank
            </button>
          </div>
        </form>
      )}

      {/* Directory Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Search questions in bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition cursor-pointer"
          >
            <option value="All">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions Directory Grid/List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={28} />
            <p className="text-slate-400 text-xs font-bold">Accessing question bank...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-sm font-semibold">
            No questions found in the bank matching this search criteria.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide px-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Select All ({selectedIds.length} chosen)</span>
              </div>
              <span>Action / Details</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className={`py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 px-2 hover:bg-slate-50/70 transition rounded-xl ${selectedIds.includes(q.id) ? 'bg-blue-50/20 border-l-2 border-blue-500 pl-1.5' : ''}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-relaxed pr-6 pr-6 whitespace-pre-wrap break-words">
                        {q.questionText}
                      </p>
                      
                      {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 max-w-xl bg-slate-50 rounded-xl p-3 border border-slate-200/50 mt-2">
                          {q.options.map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                              <span className="w-5 h-5 rounded-full bg-slate-200/70 border border-slate-300/40 text-[9px] font-black text-slate-700 flex items-center justify-center shrink-0 uppercase">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {q.correctOption && (
                        <p className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/50 rounded-lg px-2.5 py-1 inline-block mt-2">
                          Correct Option: {q.correctOption}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end gap-2.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-md">
                        {q.subject.name}
                      </span>
                      {q.class && (
                        <span className="px-2 py-0.5 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-md">
                          {q.class.name}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {q.marks} Pt{q.marks === 1 ? '' : 's'} • {q.questionType.toUpperCase()}
                    </span>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition mt-1 cursor-pointer"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Distribution Modal */}
      {isDistributing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden transform transition duration-300 scale-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="text-blue-600" size={18} />
                Distribute CBT Exam/Test
              </h3>
              <button
                onClick={() => setIsDistributing(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {distributingStatus === 'success' ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
                  <Check size={24} className="stroke-[3]" />
                </div>
                <h4 className="text-sm font-black text-slate-800">Exam Distributed Successfully!</h4>
                <p className="text-xs text-slate-400 font-medium">
                  The online exam is now active for all chosen student sections.
                </p>
              </div>
            ) : distributingStatus === 'error' ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-sm">
                  <AlertCircle size={24} className="stroke-[3]" />
                </div>
                <h4 className="text-sm font-black text-slate-800">Distribution Failed</h4>
                <p className="text-xs text-slate-400 font-medium">
                  An error occurred while publishing the exam. Please try again.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">CBT Exam Title</label>
                  <input
                    type="text"
                    required
                    value={distributeTitle}
                    onChange={(e) => setDistributeTitle(e.target.value)}
                    placeholder="e.g. Science Midterm Exam"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Schedule Start Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={distributeExamDate}
                    onChange={(e) => setDistributeExamDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Passing Mark (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={distributePassingMark}
                      onChange={(e) => setDistributePassingMark(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={distributeDuration}
                      onChange={(e) => setDistributeDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Select Target Classrooms</label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2.5 space-y-2 bg-slate-50/50">
                    {classesList.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={distributeClassIds.includes(c.id)}
                          onChange={() => {
                            setDistributeClassIds(prev =>
                              prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]
                            )
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDistributing(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDistribute}
                    disabled={distributingStatus === 'loading' || distributeClassIds.length === 0}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    {distributingStatus === 'loading' && <Loader2 className="animate-spin" size={13} />}
                    Distribute Exam
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
