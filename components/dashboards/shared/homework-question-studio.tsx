'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  ScanLine,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

export interface HomeworkAllocation {
  classId: number
  className: string
  subjectId: number
  subjectName: string
  sectionName?: string
}

interface DraftQuestion {
  questionText: string
  questionType: string
  options: string[]
  correctOption: string
  marks: number
}

const STEPS = [
  { id: 1, label: 'Prepare', hint: 'Source, class and instruction' },
  { id: 2, label: 'Review', hint: 'Edit, then save to the bank' },
  { id: 3, label: 'Assign', hint: 'Send to the class' },
]

const TERMS = ['First Term', 'Second Term', 'Third Term']

async function fileToUpload(file: File) {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return { name: file.name, mime: file.type, base64 }
}

interface StudioProps {
  role: 'admin' | 'teacher'
  allocations?: HomeworkAllocation[]
  onBankSaved?: (items: any[]) => void
  onAssigned?: (homework: any) => void
  onCancel?: () => void
}

export function HomeworkQuestionStudio({ role, allocations = [], onBankSaved, onAssigned, onCancel }: StudioProps) {
  const isAdmin = role === 'admin'
  const extractUrl = isAdmin ? endpoints.admin.cbtQuestionBankExtract : endpoints.teacher.questionBankExtract
  const bulkUrl = isAdmin ? endpoints.admin.cbtQuestionBankBulk : endpoints.teacher.questionBankBulk
  const assignUrl = isAdmin ? endpoints.admin.homeworks : endpoints.teacher.homeworks

  const [step, setStep] = useState(1)
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([])
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([])
  const [classId, setClassId] = useState(String(allocations[0]?.classId || ''))
  const [subjectId, setSubjectId] = useState(String(allocations[0]?.subjectId || ''))
  const [allocationIdx, setAllocationIdx] = useState('0')
  const [termName, setTermName] = useState('First Term')
  const [topic, setTopic] = useState('')
  const [questionType, setQuestionType] = useState('mcq')
  const [category, setCategory] = useState('')
  const [count, setCount] = useState('5')
  const [instruction, setInstruction] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [uploads, setUploads] = useState<Array<{ name: string; mime: string; base64: string }>>([])
  const [fileNames, setFileNames] = useState<string[]>([])
  const [drafts, setDrafts] = useState<DraftQuestion[]>([])
  const [savedItems, setSavedItems] = useState<any[]>([])
  const [hwTitle, setHwTitle] = useState('')
  const [hwDueDate, setHwDueDate] = useState('')
  const [hwDescription, setHwDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    Promise.all([
      apiSlice.get<{ success: boolean; classes: Array<{ id: number; name: string }> }>(endpoints.admin.classesSections),
      apiSlice.get<{ success: boolean; subjects: Array<{ id: number; name: string }> }>(endpoints.admin.subjects),
    ])
      .then(([classRes, subjectRes]) => {
        if (classRes.classes?.length) {
          setClasses(classRes.classes)
          setClassId((cur) => cur || String(classRes.classes[0].id))
        }
        if (subjectRes.subjects?.length) {
          setSubjects(subjectRes.subjects)
          setSubjectId((cur) => cur || String(subjectRes.subjects[0].id))
        }
      })
      .catch((err) => setError(err.message || 'Failed to load classes or subjects.'))
  }, [isAdmin])

  const selectedClassName = useMemo(() => {
    if (!isAdmin) return allocations[Number(allocationIdx)]?.className || ''
    return classes.find((c) => String(c.id) === classId)?.name || ''
  }, [isAdmin, allocations, allocationIdx, classes, classId])

  const selectedSubjectName = useMemo(() => {
    if (!isAdmin) return allocations[Number(allocationIdx)]?.subjectName || ''
    return subjects.find((s) => String(s.id) === subjectId)?.name || ''
  }, [isAdmin, allocations, allocationIdx, subjects, subjectId])

  const resolvedIds = () => {
    if (isAdmin) return { classId: Number(classId), subjectId: Number(subjectId) }
    const alloc = allocations[Number(allocationIdx)]
    return { classId: alloc?.classId || 0, subjectId: alloc?.subjectId || 0 }
  }

  const goTo = (next: number) => {
    setError(null)
    setSuccess(null)
    setStep(next)
  }

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    const next = [...uploads]
    const names = [...fileNames]
    for (const file of Array.from(fileList).slice(0, 4 - next.length)) {
      if (file.size > 8 * 1024 * 1024) continue
      next.push(await fileToUpload(file))
      names.push(file.name)
    }
    setUploads(next)
    setFileNames(names)
  }

  const handleGenerate = async () => {
    const ids = resolvedIds()
    if (!ids.subjectId || !ids.classId) {
      setError('Choose the class and subject first so questions stay classified.')
      return
    }
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiSlice.post<{ success: boolean; drafts?: DraftQuestion[]; message?: string }>(extractUrl, {
        ...ids,
        className: selectedClassName,
        subjectName: selectedSubjectName,
        termName,
        topic: topic.trim() || 'Core Concepts',
        questionType,
        count: Number(count) || 5,
        instruction: instruction.trim(),
        pastedText: pastedText.trim(),
        sourceMaterial: pastedText.trim(),
        uploads,
      })
      setDrafts(res.drafts || [])
      setSuccess('Drafts are ready. Check each one, then save them to the Question Bank.')
      goTo(2)
    } catch (err: any) {
      setError(err.message || 'AI processing failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleWriteMyself = () => {
    const ids = resolvedIds()
    if (!ids.subjectId || !ids.classId) {
      setError('Choose the class and subject first so questions stay classified.')
      return
    }
    setDrafts([{ questionText: '', questionType, options: ['', '', '', ''], correctOption: 'A', marks: 1 }])
    setSuccess(null)
    goTo(2)
  }

  const handleSaveBank = async () => {
    const ids = resolvedIds()
    const valid = drafts.filter((d) => d.questionText.trim())
    if (!valid.length) {
      setError('Keep at least one question with text before saving.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await apiSlice.post<{ success: boolean; items: any[]; message?: string }>(bulkUrl, {
        ...ids,
        termName,
        topic: topic.trim() || null,
        category: category.trim() || null,
        instruction: instruction.trim(),
        sourceType: uploads.length ? (fileNames.some((n) => /\.(png|jpe?g|webp)$/i.test(n)) ? 'SCAN' : 'UPLOAD') : instruction ? 'AI' : 'MANUAL',
        sourceFileName: fileNames[0] || null,
        questions: valid,
      })
      setSavedItems(res.items || [])
      setSuccess(res.message || 'Saved to the Question Bank. You can now assign them.')
      goTo(3)
      onBankSaved?.(res.items || [])
    } catch (err: any) {
      setError(err.message || 'Failed to save to Question Bank.')
    } finally {
      setBusy(false)
    }
  }

  const handleAssign = async () => {
    const ids = resolvedIds()
    if (!hwTitle.trim() || !hwDueDate) {
      setError('Add a title and due date before assigning.')
      return
    }
    if (!savedItems.length) {
      setError('Save questions to the Question Bank before assigning.')
      goTo(2)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await apiSlice.post<{ success: boolean; homework: any; message?: string }>(assignUrl, {
        title: hwTitle.trim(),
        description: hwDescription.trim(),
        dueDate: hwDueDate,
        ...ids,
        termName,
        questionBankIds: savedItems.map((item) => item.id),
      })
      setSuccess(res.message || 'Homework assigned from the Question Bank.')
      onAssigned?.(res.homework)
    } catch (err: any) {
      setError(err.message || 'Failed to assign homework.')
    } finally {
      setBusy(false)
    }
  }

  const fieldClass = 'w-full px-3.5 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
  const labelClass = 'text-sm font-semibold text-slate-700 block mb-1.5'

  if (!isAdmin && !allocations.length) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        You can only create or assign questions for classes you teach. Ask your school admin to allocate a class and subject first.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" /> New homework
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Add a worksheet, tell the AI what you need, check the questions, save them to the bank, then assign to the class.
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="shrink-0 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Close
          </button>
        )}
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STEPS.map((item) => {
          const done = step > item.id
          const active = step === item.id
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (item.id < step || (item.id === 2 && drafts.length) || (item.id === 3 && savedItems.length)) goTo(item.id)
                }}
                className={`w-full text-left rounded-2xl border px-4 py-3 flex items-center gap-3 transition ${
                  active
                    ? 'border-purple-300 bg-purple-50'
                    : done
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    active ? 'bg-purple-600 text-white' : done ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {done ? <Check size={16} /> : item.id}
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">{item.label}</span>
                  <span className="block text-xs text-slate-500">{item.hint}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {success}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900">1. Source material <span className="font-medium text-slate-400">(optional)</span></h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-6 cursor-pointer min-h-32">
                <Upload size={22} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-800">Upload a worksheet</span>
                <span className="text-xs text-slate-500">PDF, image or text · up to 8MB</span>
                <input type="file" accept=".pdf,.txt,.md,image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
              </label>
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-6 cursor-pointer min-h-32">
                <Camera size={22} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-800">Scan with camera</span>
                <span className="text-xs text-slate-500">Photo of a printed paper</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
              </label>
            </div>
            {fileNames.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fileNames.map((name, idx) => (
                  <span key={`${name}-${idx}`} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                    <ScanLine size={14} /> {name}
                    <button type="button" className="text-slate-400 hover:text-rose-600" onClick={() => { setUploads(uploads.filter((_, i) => i !== idx)); setFileNames(fileNames.filter((_, i) => i !== idx)) }}><X size={14} /></button>
                  </span>
                ))}
              </div>
            )}
            <textarea rows={4} value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="Or paste the questions / textbook excerpt here…" className={`${fieldClass} font-normal`} />
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900">2. Where these questions belong</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              {isAdmin ? (
                <>
                  <div>
                    <label className={labelClass}>Class</label>
                    <select value={classId} onChange={(e) => setClassId(e.target.value)} className={fieldClass}>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Subject</label>
                    <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={fieldClass}>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className={labelClass}>Your class and subject</label>
                  <select value={allocationIdx} onChange={(e) => setAllocationIdx(e.target.value)} className={fieldClass}>
                    {allocations.map((al, idx) => (
                      <option key={`${al.classId}-${al.subjectId}-${idx}`} value={idx}>
                        {al.className}{al.sectionName ? ` (${al.sectionName})` : ''} · {al.subjectName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>Term</label>
                <select value={termName} onChange={(e) => setTermName(e.target.value)} className={fieldClass}>
                  {TERMS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Topic</label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Fractions" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Question type</label>
                <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className={fieldClass}>
                  <option value="mcq">Multiple choice</option>
                  <option value="theory">Theory / short answer</option>
                  <option value="true_false">True / False</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Objective, Essay" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>How many questions</label>
                <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(e.target.value)} className={fieldClass} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900">3. Tell the AI what to do <span className="font-medium text-slate-400">(optional)</span></h4>
            <textarea
              rows={4}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Extract 8 questions from this scan. Keep the original numbers. Add 2 application items."
              className={`${fieldClass} font-normal`}
            />
          </section>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
            Saving as <span className="font-semibold text-slate-900">{selectedSubjectName}</span> · <span className="font-semibold text-slate-900">{selectedClassName}</span> · <span className="font-semibold text-slate-900">{termName}</span>
            {topic ? <> · {topic}</> : null}
          </div>
          {drafts.length === 0 && (
            <p className="text-sm text-slate-500">No drafts yet. Add a question below, or go back and generate from a worksheet.</p>
          )}
          {drafts.map((draft, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Question {idx + 1}</span>
                <button type="button" onClick={() => setDrafts(drafts.filter((_, i) => i !== idx))} className="text-sm font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1">
                  <Trash2 size={14} /> Remove
                </button>
              </div>
              <div>
                <label className={labelClass}>Question text</label>
                <textarea rows={3} value={draft.questionText} onChange={(e) => setDrafts(drafts.map((d, i) => i === idx ? { ...d, questionText: e.target.value } : d))} className={`${fieldClass} font-normal`} />
              </div>
              {draft.questionType !== 'theory' && (
                <div className="space-y-2">
                  <label className={labelClass}>Options</label>
                  {(draft.options || []).map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <input value={opt} onChange={(e) => {
                        const options = [...(draft.options || [])]
                        options[oIdx] = e.target.value
                        setDrafts(drafts.map((d, i) => i === idx ? { ...d, options } : d))
                      }} className={fieldClass} />
                    </div>
                  ))}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Correct answer</label>
                  <input value={draft.correctOption} onChange={(e) => setDrafts(drafts.map((d, i) => i === idx ? { ...d, correctOption: e.target.value } : d))} placeholder="e.g. A" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Marks</label>
                  <input type="number" value={draft.marks} onChange={(e) => setDrafts(drafts.map((d, i) => i === idx ? { ...d, marks: Number(e.target.value) } : d))} className={fieldClass} />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDrafts([...drafts, { questionText: '', questionType, options: ['', '', '', ''], correctOption: 'A', marks: 1 }])}
            className="text-sm font-semibold text-purple-700 inline-flex items-center gap-1.5"
          >
            <Plus size={16} /> Add another question
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 max-w-xl">
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
            {savedItems.length} question{savedItems.length === 1 ? '' : 's'} saved for {selectedSubjectName} · {selectedClassName} · {termName}.
          </p>
          <div>
            <label className={labelClass}>Assignment title</label>
            <input value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} placeholder="e.g. Fractions worksheet" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Due date</label>
            <input type="date" value={hwDueDate} onChange={(e) => setHwDueDate(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Instructions for students <span className="font-medium text-slate-400">(optional)</span></label>
            <textarea rows={3} value={hwDescription} onChange={(e) => setHwDescription(e.target.value)} placeholder="What should students do?" className={`${fieldClass} font-normal`} />
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          disabled={step === 1 || busy}
          onClick={() => goTo(Math.max(1, step - 1))}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {step === 1 && (
            <>
              <button type="button" disabled={busy} onClick={handleWriteMyself} className="px-5 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Write questions myself
              </button>
              <button type="button" disabled={busy} onClick={handleGenerate} className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {busy ? 'Generating…' : 'Generate questions'}
              </button>
            </>
          )}
          {step === 2 && (
            <button type="button" disabled={busy} onClick={handleSaveBank} className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save to Question Bank
            </button>
          )}
          {step === 3 && (
            <button type="button" disabled={busy || !savedItems.length} onClick={handleAssign} className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:opacity-50">
              {busy ? 'Assigning…' : 'Assign to class'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
