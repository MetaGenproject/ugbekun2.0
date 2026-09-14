'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { HomeworkQuestionStudio } from '@/components/dashboards/shared/homework-question-studio'
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react'

type HomeworkTab = 'assigned' | 'bank' | 'create'

interface BankItem {
  id: number
  questionText: string
  questionType: string
  subject?: { name: string }
  class?: { name: string } | null
  termName?: string | null
  topic?: string | null
  sourceType?: string | null
  marks: number
}

interface HomeworkRow {
  id: number
  title: string
  dueDate: string
  termName?: string | null
  class?: { name: string }
  subject?: { name: string }
  submissions?: Array<{ id: number }>
  questions?: any[]
  questionBankIds?: number[]
}

export function HomeworkManagement() {
  const [activeTab, setActiveTab] = useState<HomeworkTab>('assigned')
  const [bankItems, setBankItems] = useState<BankItem[]>([])
  const [homeworks, setHomeworks] = useState<HomeworkRow[]>([])
  const [loadingBank, setLoadingBank] = useState(false)
  const [loadingHw, setLoadingHw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterTerm, setFilterTerm] = useState('All')
  const [bankSearch, setBankSearch] = useState('')
  const [studioKey, setStudioKey] = useState(0)

  const fetchBank = async () => {
    setLoadingBank(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; items: BankItem[] }>(endpoints.admin.cbtQuestionBank('?limit=100'))
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
      setError(err.message || 'Failed to load homework.')
    } finally {
      setLoadingHw(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'bank') fetchBank()
    if (activeTab === 'assigned') fetchHomeworks()
  }, [activeTab])

  const filteredBank = useMemo(
    () =>
      bankItems.filter((item) => {
        const termOk = filterTerm === 'All' || item.termName === filterTerm
        const q = bankSearch.trim().toLowerCase()
        const searchOk =
          !q ||
          item.questionText.toLowerCase().includes(q) ||
          (item.subject?.name || '').toLowerCase().includes(q) ||
          (item.class?.name || '').toLowerCase().includes(q) ||
          (item.topic || '').toLowerCase().includes(q)
        return termOk && searchOk
      }),
    [bankItems, filterTerm, bankSearch]
  )

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="text-purple-600" size={24} /> Homework & Question Bank
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create questions, keep them labelled by class, subject and term, then assign homework.
          </p>
        </div>
        {activeTab !== 'create' && (
          <button
            onClick={() => {
              setStudioKey((k) => k + 1)
              setActiveTab('create')
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold"
          >
            <Plus size={16} /> New assignment
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl">
        {([
          ['assigned', 'Assigned homework', CheckCircle2],
          ['bank', 'Question Bank', BookOpen],
          ['create', 'Create', Sparkles],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0 ${
              activeTab === id ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

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

      {activeTab === 'bank' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900">School Question Bank</h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Search question, subject or class"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">
                <option value="All">All terms</option>
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
            </div>
          </div>
          {loadingBank ? (
            <p className="text-sm text-slate-400 py-10 text-center"><Loader2 className="inline animate-spin mr-2" size={16} /> Loading bank…</p>
          ) : filteredBank.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No questions yet. Use <button type="button" onClick={() => setActiveTab('create')} className="font-semibold text-purple-700">New assignment</button> to create some.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBank.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-xs font-semibold">{item.subject?.name || 'Subject'}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">{item.class?.name || 'Class'}</span>
                    {item.termName && <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-medium">{item.termName}</span>}
                    {item.topic && <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-xs">{item.topic}</span>}
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs text-slate-500 uppercase">{item.sourceType || 'manual'}</span>
                    <span className="ml-auto text-xs font-semibold text-slate-500">{item.marks} mark{item.marks === 1 ? '' : 's'}</span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed">{item.questionText}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'assigned' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900">Assigned homework</h3>
          {loadingHw ? (
            <p className="text-sm text-slate-400 py-10 text-center"><Loader2 className="inline animate-spin mr-2" size={16} /> Loading…</p>
          ) : homeworks.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-slate-500">No homework assigned yet.</p>
              <button type="button" onClick={() => setActiveTab('create')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 text-white text-sm font-bold">
                <Plus size={16} /> Create the first assignment
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {homeworks.map((hw) => (
                <article key={hw.id} className="rounded-2xl border border-slate-200 p-5 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 text-xs font-semibold">{hw.subject?.name}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">{hw.class?.name}</span>
                    {hw.termName && <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium">{hw.termName}</span>}
                  </div>
                  <h4 className="font-bold text-slate-900">{hw.title}</h4>
                  <p className="text-sm text-slate-500">
                    Due {new Date(hw.dueDate).toLocaleDateString()} · {Array.isArray(hw.questionBankIds) ? hw.questionBankIds.length : Array.isArray(hw.questions) ? hw.questions.length : 0} questions · {hw.submissions?.length || 0} submissions
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
