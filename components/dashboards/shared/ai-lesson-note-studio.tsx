'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  ScanLine,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'

export type LessonNoteStatus = 'DRAFT' | 'PUBLISHED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REVISION'

export interface LessonNoteAllocation {
  classId: number
  className: string
  subjectId: number
  subjectName: string
  sectionName?: string
}

export interface LessonNoteDraft {
  id?: number
  classId?: number
  subjectId?: number
  teacherId?: number
  coreTopic?: string
  subTopic?: string | null
  duration?: string | null
  weekNo?: string | null
  educationalObjectives?: string | null
  materialLists?: string | null
  teachingGuide?: string | null
  assessmentCriteria?: string | null
  classAssignments?: string | null
  entryBehavior?: string | null
  aiInstruction?: string | null
  sourceMaterial?: string | null
  sourceFileName?: string | null
  status?: LessonNoteStatus
  reviewerNote?: string | null
}

interface StudioProps {
  role: 'admin' | 'teacher'
  allocations?: LessonNoteAllocation[]
  initialPlan?: LessonNoteDraft | null
  onSaved?: (plan: any) => void
  onCancel?: () => void
}

const STEPS = [
  { id: 1, label: 'Upload / Scan' },
  { id: 2, label: 'Give Instruction' },
  { id: 3, label: 'AI Generates' },
  { id: 4, label: 'Review / Edit' },
  { id: 5, label: 'Save for Approval' },
]

async function fileToUpload(file: File) {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return { name: file.name, mime: file.type, base64 }
}

export function AiLessonNoteStudio({ role, allocations = [], initialPlan = null, onSaved, onCancel }: StudioProps) {
  const isAdmin = role === 'admin'
  const generateUrl = isAdmin ? endpoints.admin.generateLessonPlan : endpoints.teacher.lessonPlanGenerate
  const activeStepClass = isAdmin
    ? 'bg-emerald-600 text-white border-transparent'
    : 'bg-indigo-600 text-white border-transparent'
  const primarySaveClass = isAdmin
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : 'bg-indigo-600 hover:bg-indigo-700 text-white'

  const [step, setStep] = useState(initialPlan?.id || initialPlan?.teachingGuide ? 4 : 1)
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([])
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([])
  const [teachers, setTeachers] = useState<Array<{ id: number; name: string }>>([])
  const [teacherId, setTeacherId] = useState(String(initialPlan?.teacherId || ''))
  const [classId, setClassId] = useState(String(initialPlan?.classId || allocations[0]?.classId || ''))
  const [subjectId, setSubjectId] = useState(String(initialPlan?.subjectId || allocations[0]?.subjectId || ''))
  const [allocationIdx, setAllocationIdx] = useState('0')
  const [coreTopic, setCoreTopic] = useState(initialPlan?.coreTopic || '')
  const [subTopic, setSubTopic] = useState(initialPlan?.subTopic || '')
  const [duration, setDuration] = useState(initialPlan?.duration || '45 Minutes')
  const [weekNo, setWeekNo] = useState(initialPlan?.weekNo || 'Week 3')
  const [instruction, setInstruction] = useState(initialPlan?.aiInstruction || '')
  const [pastedText, setPastedText] = useState(initialPlan?.sourceMaterial || '')
  const [uploads, setUploads] = useState<Array<{ name: string; mime: string; base64: string }>>([])
  const [fileNames, setFileNames] = useState<string[]>(initialPlan?.sourceFileName ? [initialPlan.sourceFileName] : [])
  const [objectives, setObjectives] = useState(initialPlan?.educationalObjectives || '')
  const [materials, setMaterials] = useState(initialPlan?.materialLists || '')
  const [entryBehavior, setEntryBehavior] = useState(initialPlan?.entryBehavior || '')
  const [teachingGuide, setTeachingGuide] = useState(initialPlan?.teachingGuide || '')
  const [assessments, setAssessments] = useState(initialPlan?.assessmentCriteria || '')
  const [assignments, setAssignments] = useState(initialPlan?.classAssignments || '')
  const [planId, setPlanId] = useState<number | null>(initialPlan?.id || null)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const locked = initialPlan?.status === 'APPROVED'

  useEffect(() => {
    if (isAdmin || !allocations.length) return
    const idx = allocations.findIndex(
      (a) => String(a.classId) === String(initialPlan?.classId) && String(a.subjectId) === String(initialPlan?.subjectId)
    )
    if (idx >= 0) setAllocationIdx(String(idx))
  }, [isAdmin, allocations, initialPlan])

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    ;(async () => {
      try {
        const classRes = await apiSlice.get<{ success: boolean; classes: Array<{ id: number; name: string }> }>(
          endpoints.admin.classesSections
        )
        if (cancelled) return
        if (classRes.classes?.length) {
          setClasses(classRes.classes)
          setClassId((current) => current || String(classRes.classes[0].id))
        }

        const subjectRes = await apiSlice.get<{ success: boolean; subjects: Array<{ id: number; name: string }> }>(
          endpoints.admin.subjects
        )
        if (cancelled) return
        if (subjectRes.subjects?.length) {
          setSubjects(subjectRes.subjects)
          setSubjectId((current) => current || String(subjectRes.subjects[0].id))
        }

        const teacherRes = await apiSlice.get<{
          success: boolean
          data: { teachers: Array<{ id: number; name: string }> }
        }>(endpoints.admin.teachersStaff)
        if (cancelled) return
        if (teacherRes.data?.teachers?.length) {
          setTeachers(teacherRes.data.teachers)
          setTeacherId((current) => current || String(teacherRes.data.teachers[0].id))
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load classes, subjects, or teachers.')
      }
    })()
    return () => {
      cancelled = true
    }
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
    if (isAdmin) {
      return { classId: Number(classId), subjectId: Number(subjectId), teacherId: Number(teacherId) }
    }
    const alloc = allocations[Number(allocationIdx)]
    return { classId: alloc?.classId || 0, subjectId: alloc?.subjectId || 0, teacherId: 0 }
  }

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    setError(null)
    const next = [...uploads]
    const names = [...fileNames]
    for (const file of Array.from(fileList).slice(0, 4 - next.length)) {
      if (file.size > 8 * 1024 * 1024) {
        setError(`${file.name} is larger than 8MB.`)
        continue
      }
      next.push(await fileToUpload(file))
      names.push(file.name)
    }
    setUploads(next)
    setFileNames(names)
  }

  const handleGenerate = async () => {
    if (!coreTopic.trim()) {
      setError('Enter a lesson topic before generating.')
      setStep(2)
      return
    }
    const ids = resolvedIds()
    if (!ids.classId || !ids.subjectId) {
      setError('Select a class and subject first.')
      setStep(2)
      return
    }

    setBusy(true)
    setError(null)
    try {
      const res = await apiSlice.post<{ success: boolean; draft?: any; lessonPlan?: any }>(generateUrl, {
        classId: ids.classId,
        subjectId: ids.subjectId,
        className: selectedClassName,
        subjectName: selectedSubjectName,
        coreTopic: coreTopic.trim(),
        subTopic: subTopic.trim() || undefined,
        duration,
        weekNo,
        instruction: instruction.trim(),
        pastedText: pastedText.trim(),
        sourceMaterial: pastedText.trim(),
        uploads,
      })
      const draft = res.draft || res.lessonPlan || {}
      setObjectives(draft.objectives || draft.educationalObjectives || '')
      setMaterials(draft.materials || draft.materialLists || '')
      setTeachingGuide(draft.teachingGuide || '')
      setAssessments(draft.assessments || draft.assessmentCriteria || '')
      setAssignments(draft.assignments || draft.classAssignments || '')
      setEntryBehavior(draft.entryBehavior || '')
      if (draft.coreTopic) setCoreTopic(String(draft.coreTopic))
      if (draft.sourceMaterial) setPastedText(draft.sourceMaterial)
      setSuccess('AI draft ready. Review and correct it before saving. It is not an official record yet.')
      setStep(4)
    } catch (err: any) {
      setError(err.message || 'AI generation failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async (status: 'DRAFT' | 'PENDING_APPROVAL') => {
    if (locked) {
      setError('Approved lesson notes cannot be edited. Ask a supervisor to send it back for revision.')
      return
    }
    if (!coreTopic.trim()) {
      setError('A lesson topic is required.')
      return
    }
    const ids = resolvedIds()
    if (!ids.classId || !ids.subjectId) {
      setError('Select a class and subject first.')
      return
    }
    if (isAdmin && !ids.teacherId) {
      setError('Assign a teacher before saving.')
      return
    }

    setSaving(true)
    setError(null)
    const payload = {
      teacherId: ids.teacherId || undefined,
      classId: ids.classId,
      subjectId: ids.subjectId,
      coreTopic: coreTopic.trim(),
      subTopic: subTopic.trim() || null,
      duration,
      weekNo,
      instruction: instruction.trim(),
      aiInstruction: instruction.trim(),
      sourceMaterial: pastedText.trim() || null,
      sourceFileName: fileNames[0] || null,
      educationalObjectives: objectives,
      materialLists: materials,
      teachingGuide,
      assessmentCriteria: assessments,
      classAssignments: assignments,
      entryBehavior,
      status,
    }

    try {
      const res = planId
        ? await apiSlice.put<{ success: boolean; plan: any; message?: string }>(
            isAdmin ? endpoints.admin.lessonPlanItem(planId) : endpoints.teacher.lessonPlanItem(planId),
            payload
          )
        : await apiSlice.post<{ success: boolean; plan: any; message?: string }>(
            isAdmin ? endpoints.admin.createLessonPlan : endpoints.teacher.lessonPlans,
            payload
          )
      if (res.success && res.plan) {
        setPlanId(res.plan.id)
        setSuccess(res.message || (status === 'DRAFT' ? 'Draft saved. Not an official school record.' : 'Saved for approval. Not an official school record yet.'))
        setStep(5)
        onSaved?.(res.plan)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson note.')
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-400'
  const labelClass = 'text-xs font-bold text-slate-700 block mb-1'

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2`}>
            <Sparkles size={16} className={isAdmin ? 'text-amber-500' : 'text-indigo-600'} />
            AI Lesson Note Studio
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Upload or scan material, tell the AI what to create, generate a draft, edit it, then save for approval. Nothing becomes an official school record until a supervisor approves it.
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs font-bold text-slate-400 hover:text-slate-700">
            Close
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {STEPS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStep(item.id)}
            className={`rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wide border transition ${
              step === item.id
                ? activeStepClass
                : item.id < step
                  ? 'bg-slate-900 text-white border-transparent'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            {item.id}. {item.label}
          </button>
        ))}
      </div>

      {locked && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={14} /> This note is already approved as an official school record and cannot be edited here.
        </div>
      )}
      {initialPlan?.status === 'REVISION' && initialPlan.reviewerNote && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="font-black">Revision requested:</span> {initialPlan.reviewerNote}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={14} /> {success}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 cursor-pointer hover:bg-slate-100">
              <Upload size={22} className="text-slate-500" />
              <span className="text-xs font-black text-slate-800">Upload existing material</span>
              <span className="text-[11px] text-slate-500">PDF, images, or text files up to 8MB</span>
              <input
                ref={uploadRef}
                type="file"
                accept=".pdf,.txt,.md,image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 cursor-pointer hover:bg-slate-100">
              <Camera size={22} className="text-slate-500" />
              <span className="text-xs font-black text-slate-800">Scan teaching material</span>
              <span className="text-[11px] text-slate-500">Use the camera to capture a page or board</span>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          {fileNames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {fileNames.map((name, idx) => (
                <span key={`${name}-${idx}`} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                  <ScanLine size={12} /> {name}
                  <button
                    type="button"
                    onClick={() => {
                      setUploads(uploads.filter((_, i) => i !== idx))
                      setFileNames(fileNames.filter((_, i) => i !== idx))
                    }}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div>
            <label className={labelClass}>Or paste source text</label>
            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste scheme of work, textbook excerpt, previous note, or scanned OCR text…"
              className={`${fieldClass} font-normal leading-relaxed`}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            {isAdmin ? (
              <>
                <div>
                  <label className={labelClass}>Teacher *</label>
                  <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={fieldClass}>
                    <option value="">Select teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Class *</label>
                  <select value={classId} onChange={(e) => setClassId(e.target.value)} className={fieldClass}>
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Subject *</label>
                  <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={fieldClass}>
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <label className={labelClass}>Class & subject allocation *</label>
                <select
                  value={allocationIdx}
                  onChange={(e) => setAllocationIdx(e.target.value)}
                  className={fieldClass}
                >
                  {allocations.map((al, idx) => (
                    <option key={`${al.classId}-${al.subjectId}-${idx}`} value={idx}>
                      {al.className}{al.sectionName ? ` (${al.sectionName})` : ''} • {al.subjectName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className={fieldClass}>
                <option value="35 Minutes">35 Minutes</option>
                <option value="40 Minutes">40 Minutes</option>
                <option value="45 Minutes">45 Minutes</option>
                <option value="80 Minutes">80 Minutes</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Week</label>
              <select value={weekNo} onChange={(e) => setWeekNo(e.target.value)} className={fieldClass}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <option key={i} value={`Week ${i + 1}`}>Week {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Topic *</label>
              <input value={coreTopic} onChange={(e) => setCoreTopic(e.target.value)} placeholder="e.g. Fractions & Decimals" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Sub-topic</label>
              <input value={subTopic} onChange={(e) => setSubTopic(e.target.value)} placeholder="Optional focus area" className={fieldClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Tell the AI what to create</label>
            <textarea
              rows={5}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Example: Rewrite this scanned note as a 40-minute Primary 4 lesson with 3 Bloom objectives, a 10-minute group activity, and 5 evaluation questions. Keep the original examples."
              className={`${fieldClass} font-normal leading-relaxed`}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-1">
            <p><span className="font-black">Topic:</span> {coreTopic || 'Not set'}</p>
            <p><span className="font-black">Class / Subject:</span> {selectedClassName || '—'} • {selectedSubjectName || '—'}</p>
            <p><span className="font-black">Material:</span> {fileNames.length ? fileNames.join(', ') : pastedText.trim() ? 'Pasted source text' : 'None — generate from topic and instruction'}</p>
            <p><span className="font-black">Instruction:</span> {instruction.trim() || 'Create a complete classroom-ready lesson note.'}</p>
          </div>
          <button
            type="button"
            disabled={busy || locked}
            onClick={handleGenerate}
            className={`w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {busy ? <Loader2 size={15} className="animate-spin text-amber-400" /> : <Sparkles size={15} className="text-amber-400" />}
            {busy ? 'Generating draft…' : 'Generate lesson note'}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-[11px] text-slate-500 font-medium">
            Correct the AI draft before it is saved. This is still your working copy.
          </p>
          <div>
            <label className={labelClass}>Topic</label>
            <input value={coreTopic} onChange={(e) => setCoreTopic(e.target.value)} disabled={locked} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Entry behaviour</label>
            <textarea rows={2} value={entryBehavior} onChange={(e) => setEntryBehavior(e.target.value)} disabled={locked} className={`${fieldClass} font-normal`} />
          </div>
          <div>
            <label className={labelClass}>1. Objectives</label>
            <textarea rows={3} value={objectives} onChange={(e) => setObjectives(e.target.value)} disabled={locked} className={`${fieldClass} font-normal`} />
          </div>
          <div>
            <label className={labelClass}>2. Instructional materials</label>
            <textarea rows={2} value={materials} onChange={(e) => setMaterials(e.target.value)} disabled={locked} className={`${fieldClass} font-normal`} />
          </div>
          <div>
            <label className={labelClass}>3. Teaching procedure</label>
            <textarea rows={6} value={teachingGuide} onChange={(e) => setTeachingGuide(e.target.value)} disabled={locked} className={`${fieldClass} font-normal font-mono`} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>4. Evaluation</label>
              <textarea rows={4} value={assessments} onChange={(e) => setAssessments(e.target.value)} disabled={locked} className={`${fieldClass} font-normal`} />
            </div>
            <div>
              <label className={labelClass}>5. Assignment</label>
              <textarea rows={4} value={assignments} onChange={(e) => setAssignments(e.target.value)} disabled={locked} className={`${fieldClass} font-normal`} />
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p className="text-xs font-black text-slate-900">{coreTopic || 'Untitled lesson note'}</p>
            <p className="text-[11px] text-slate-500">{selectedClassName} • {selectedSubjectName} • {duration} • {weekNo}</p>
            <p className="text-[11px] text-slate-600 whitespace-pre-line line-clamp-6">{objectives || 'No objectives yet.'}</p>
          </div>
          <p className="text-[11px] text-slate-500">
            Save as draft to keep working, or submit for supervisor approval. Either way, this is not an official school record until it is approved.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={saving || locked}
              onClick={() => handleSave('DRAFT')}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save draft
            </button>
            <button
              type="button"
              disabled={saving || locked}
              onClick={() => handleSave('PENDING_APPROVAL')}
              className={`flex-1 py-2.5 rounded-xl ${primarySaveClass} font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Save for approval
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep(Math.max(1, step - 1))}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 disabled:opacity-40"
        >
          <ArrowLeft size={14} /> Back
        </button>
        {step < 5 && (
          <button
            type="button"
            onClick={() => {
              if (step === 3 && !teachingGuide && !locked) {
                handleGenerate()
                return
              }
              setStep(Math.min(5, step + 1))
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-800"
          >
            {step === 3 ? 'Generate' : 'Next'} <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
