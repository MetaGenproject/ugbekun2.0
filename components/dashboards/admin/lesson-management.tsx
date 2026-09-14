'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { AiLessonNoteStudio, type LessonNoteDraft } from '@/components/dashboards/shared/ai-lesson-note-studio'
import {
  BookOpen,
  Sparkles,
  Calendar,
  CheckCircle2,
  Download,
  Loader2,
  X,
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

type LessonTab = 'ai-notes' | 'scheme-of-work' | 'weekly-planner' | 'lesson-approval'

interface AdminLessonPlan {
  id: number
  coreTopic: string
  status: string
  createdAt: string
  educationalObjectives?: string | null
  materialLists?: string | null
  teachingGuide?: string | null
  assessmentCriteria?: string | null
  classAssignments?: string | null
  entryBehavior?: string | null
  aiInstruction?: string | null
  sourceMaterial?: string | null
  sourceFileName?: string | null
  subTopic?: string | null
  duration?: string | null
  weekNo?: string | null
  reviewerNote?: string | null
  teacherId: number
  classId: number
  subjectId: number
  teacher?: { id: number; name: string }
  class?: { id: number; name: string }
  subject?: { id: number; name: string }
}

function statusTone(status: string) {
  if (status === 'APPROVED' || status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'PENDING_APPROVAL') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (status === 'REVISION') return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function statusLabel(status: string) {
  if (status === 'PENDING_APPROVAL' || status === 'PUBLISHED') return 'Pending approval'
  if (status === 'APPROVED') return 'Approved'
  if (status === 'REVISION') return 'Revision'
  return 'Draft'
}

export function LessonManagement() {
  const [activeTab, setActiveTab] = useState<LessonTab>('ai-notes')
  const [plans, setPlans] = useState<AdminLessonPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reviewPlan, setReviewPlan] = useState<AdminLessonPlan | null>(null)
  const [revisionNote, setRevisionNote] = useState('')
  const [actingId, setActingId] = useState<number | null>(null)
  const [studioKey, setStudioKey] = useState(0)
  const [studioPlan, setStudioPlan] = useState<LessonNoteDraft | null>(null)

  const fetchPlans = async () => {
    setLoadingPlans(true)
    setActionError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; plans: AdminLessonPlan[] }>(endpoints.admin.lessonPlans())
      setPlans(res.plans || [])
    } catch (err: any) {
      setActionError(err.message || 'Failed to load lesson notes.')
    } finally {
      setLoadingPlans(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'lesson-approval') {
      fetchPlans()
    }
  }, [activeTab])

  const pendingPlans = useMemo(() => {
    const rank: Record<string, number> = {
      PENDING_APPROVAL: 0,
      PUBLISHED: 0,
      REVISION: 1,
      DRAFT: 2,
      APPROVED: 3,
    }
    return [...plans].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
  }, [plans])

  const toDraft = (plan: AdminLessonPlan): LessonNoteDraft => ({
    id: plan.id,
    classId: plan.classId,
    subjectId: plan.subjectId,
    teacherId: plan.teacherId,
    coreTopic: plan.coreTopic,
    subTopic: plan.subTopic,
    duration: plan.duration,
    weekNo: plan.weekNo,
    educationalObjectives: plan.educationalObjectives,
    materialLists: plan.materialLists,
    teachingGuide: plan.teachingGuide,
    assessmentCriteria: plan.assessmentCriteria,
    classAssignments: plan.classAssignments,
    entryBehavior: plan.entryBehavior,
    aiInstruction: plan.aiInstruction,
    sourceMaterial: plan.sourceMaterial,
    sourceFileName: plan.sourceFileName,
    status: plan.status as LessonNoteDraft['status'],
    reviewerNote: plan.reviewerNote,
  })

  const handleApprove = async (id: number) => {
    setActingId(id)
    setActionError(null)
    try {
      await apiSlice.post(endpoints.admin.approveLessonPlan(id), {})
      await fetchPlans()
      setReviewPlan(null)
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve lesson note.')
    } finally {
      setActingId(null)
    }
  }

  const handleRevision = async (id: number) => {
    if (!revisionNote.trim()) {
      setActionError('Enter a revision note so the teacher knows what to correct.')
      return
    }
    setActingId(id)
    setActionError(null)
    try {
      await apiSlice.post(endpoints.admin.reviseLessonPlan(id), { reviewerNote: revisionNote.trim() })
      await fetchPlans()
      setReviewPlan(null)
      setRevisionNote('')
    } catch (err: any) {
      setActionError(err.message || 'Failed to request revision.')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="text-emerald-600" size={24} /> Lesson Management Suite
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Upload or scan material, instruct the AI, generate a draft, edit it, then save for approval. Notes are not official until a supervisor approves them.
            </p>
          </div>

          <button
            onClick={() => {
              setStudioPlan(null)
              setStudioKey((k) => k + 1)
              setActiveTab('ai-notes')
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer self-start md:self-auto shrink-0"
          >
            <Sparkles size={15} className="text-amber-400" /> New AI Lesson Note
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('ai-notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'ai-notes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles size={15} className="text-amber-300" /> AI Lesson Notes
        </button>

        <button
          onClick={() => setActiveTab('scheme-of-work')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'scheme-of-work' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={15} /> Scheme of Work
        </button>

        <button
          onClick={() => setActiveTab('weekly-planner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'weekly-planner' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar size={15} /> Weekly Planner
        </button>

        <button
          onClick={() => setActiveTab('lesson-approval')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'lesson-approval' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 size={15} /> Lesson Approval
        </button>
      </div>

      {/* TAB 1: AI LESSON NOTES */}
      {activeTab === 'ai-notes' && (
        <AiLessonNoteStudio
          key={studioKey}
          role="admin"
          initialPlan={studioPlan}
          onSaved={() => fetchPlans()}
        />
      )}

      {/* TAB 2: SCHEME OF WORK */}
      {activeTab === 'scheme-of-work' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="text-emerald-600" size={20} /> Termly Scheme of Work (12 Weeks)
              </h3>
              <p className="text-xs text-slate-500 font-medium">1st Term Academic Syllabus breakdown aligned with national NERDC standards.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Topic Title</TableHead>
                <TableHead>Learning Objectives</TableHead>
                <TableHead>Teacher Learning Aids</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { week: 'Week 1', topic: 'Revision & Diagnostic Test', obj: 'Assess pupil entry knowledge', aids: 'Question Cards', status: 'Completed' },
                { week: 'Week 2', topic: 'Fractions & Decimals', obj: 'Understand proper & improper fractions', aids: 'Fraction Charts', status: 'Completed' },
                { week: 'Week 3', topic: 'Addition of Like Fractions', obj: 'Solve like fraction additions', aids: 'Visual Boards', status: 'In Progress' },
                { week: 'Week 4', topic: 'Subtraction of Unlike Fractions', obj: 'Find LCM and subtract fractions', aids: 'Worksheets', status: 'Upcoming' },
                { week: 'Week 5', topic: 'Decimals & Percentages', obj: 'Convert decimals into percentages', aids: 'Digital Charts', status: 'Upcoming' },
              ].map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono font-black text-emerald-700">{row.week}</TableCell>
                  <TableCell className="font-bold text-slate-900">{row.topic}</TableCell>
                  <TableCell className="text-xs text-slate-600">{row.obj}</TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">{row.aids}</TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      row.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      row.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: WEEKLY PLANNER */}
      {activeTab === 'weekly-planner' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Calendar className="text-emerald-600" size={20} /> Teacher Weekly Lesson Planner
              </h3>
              <p className="text-xs text-slate-500 font-medium">Day-by-day timetable schedule and classroom activity planning.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => (
              <div key={day} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                <h4 className="font-black text-xs text-slate-900 uppercase border-b border-slate-200 pb-1.5">{day}</h4>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                  <p className="font-bold text-slate-900">Period 1 (08:30 AM)</p>
                  <p className="text-[11px] text-emerald-700 font-semibold">Mathematics • Primary 4</p>
                  <p className="text-[10px] text-slate-500">Topic: Fractions</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                  <p className="font-bold text-slate-900">Period 4 (11:00 AM)</p>
                  <p className="text-[11px] text-blue-700 font-semibold">Basic Science • Primary 3</p>
                  <p className="text-[10px] text-slate-500">Topic: Living Things</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LESSON APPROVAL */}
      {activeTab === 'lesson-approval' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={20} /> Principal & Supervisor Lesson Note Approval
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Review the teacher&apos;s edited draft, approve it as an official school record, or send it back for correction.
              </p>
            </div>
          </div>

          {actionError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <p className="text-xs font-semibold text-rose-700">{actionError}</p>
              <button
                type="button"
                onClick={() => fetchPlans()}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-800 text-[11px] font-bold"
              >
                Retry
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right min-w-[220px]">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingPlans ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-400 font-medium text-xs">
                    <Loader2 className="inline animate-spin mr-2" size={14} /> Loading lesson notes…
                  </TableCell>
                </TableRow>
              ) : pendingPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-400 font-medium text-xs">
                    {actionError ? 'Could not load lesson notes. Use Retry above.' : 'No teacher lesson notes submitted for review yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                pendingPlans.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-mono font-bold text-slate-700">LN-{note.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{note.teacher?.name || '—'}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">{note.subject?.name || '—'}</TableCell>
                    <TableCell className="text-xs text-slate-600">{note.class?.name || '—'}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{note.coreTopic}</TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(note.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusTone(note.status)}`}>
                        {statusLabel(note.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setReviewPlan(note)
                            setRevisionNote(note.reviewerNote || '')
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => {
                            setStudioPlan(toDraft(note))
                            setStudioKey((k) => k + 1)
                            setActiveTab('ai-notes')
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                        >
                          Edit
                        </button>
                        {note.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleApprove(note.id)}
                            disabled={actingId === note.id}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      {reviewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="font-black text-sm">{reviewPlan.coreTopic}</div>
              <button onClick={() => setReviewPlan(null)} className="p-1 hover:bg-white/10 rounded-lg text-white/70">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-slate-500">
                {reviewPlan.teacher?.name} • {reviewPlan.subject?.name} • {reviewPlan.class?.name}
              </p>
              {reviewPlan.educationalObjectives && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <h5 className="text-[11px] font-black text-emerald-900 mb-1">Objectives</h5>
                  <p className="text-xs whitespace-pre-line">{reviewPlan.educationalObjectives}</p>
                </div>
              )}
              {reviewPlan.teachingGuide && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="text-[11px] font-black text-slate-900 mb-1">Procedure</h5>
                  <p className="text-xs whitespace-pre-line">{reviewPlan.teachingGuide}</p>
                </div>
              )}
              {reviewPlan.assessmentCriteria && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <h5 className="text-[11px] font-black text-amber-900 mb-1">Evaluation</h5>
                  <p className="text-xs whitespace-pre-line">{reviewPlan.assessmentCriteria}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Revision note (required to send back)</label>
                <textarea
                  rows={3}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  placeholder="Tell the teacher what to correct before this can become an official record."
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  onClick={() => apiSlice.download(endpoints.admin.downloadLessonPlanPdf(reviewPlan.id), `Lesson_Note_${reviewPlan.id}.pdf`)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
                >
                  <Download size={13} /> PDF
                </button>
                {reviewPlan.status !== 'APPROVED' && (
                  <>
                    <button
                      onClick={() => handleRevision(reviewPlan.id)}
                      disabled={actingId === reviewPlan.id}
                      className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold disabled:opacity-50"
                    >
                      Send for revision
                    </button>
                    <button
                      onClick={() => handleApprove(reviewPlan.id)}
                      disabled={actingId === reviewPlan.id}
                      className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                    >
                      Approve as official record
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
