'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Sparkles,
  Save,
  BookOpen,
  Trash2,
  Edit2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Download,
  Eye,
  Plus,
  Layers,
  Clock,
  Calendar,
  Award,
  Check,
  X,
  FileText,
  HelpCircle,
  School,
  Share2
} from 'lucide-react'

interface TeacherProfile {
  id: number
  name: string
  isSubjectTeacher?: boolean
  isFormTeacher?: boolean
  subjectAssignments?: Array<{
    classId: number
    className: string
    sectionId: number
    sectionName: string
    subjectId: number
    subjectName: string
  }>
}

interface LessonPlan {
  id: number
  teacherId: number
  classId: number
  subjectId: number
  coreTopic: string
  educationalObjectives: string | null
  materialLists: string | null
  teachingGuide: string | null
  assessmentCriteria: string | null
  classAssignments: string | null
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
  class: { name: string }
  subject: { name: string }
}

interface AiLessonPlannerProps {
  profile?: TeacherProfile
}

export function AiLessonPlanner({ profile }: AiLessonPlannerProps) {
  const [plans, setPlans] = useState<LessonPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Selector state
  const [selectedAllocationIdx, setSelectedAllocationIdx] = useState('0')
  const [coreTopic, setCoreTopic] = useState('')
  const [subTopic, setSubTopic] = useState('')
  const [duration, setDuration] = useState('45 Minutes')
  const [weekNo, setWeekNo] = useState('Week 3')
  const [isGenerating, setIsGenerating] = useState(false)

  // Draft Editor State
  const [isEditing, setIsEditing] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [objectives, setObjectives] = useState('')
  const [materials, setMaterials] = useState('')
  const [teachingGuide, setTeachingGuide] = useState('')
  const [assessments, setAssessments] = useState('')
  const [assignments, setAssignments] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED')
  const [isSaving, setIsSaving] = useState(false)

  // Preview Modal State
  const [previewPlan, setPreviewPlan] = useState<LessonPlan | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const showToast = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 4000)
  }

  const fetchPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; plans: LessonPlan[] }>(
        endpoints.teacher.lessonPlans
      )
      if (res.success && res.plans) {
        setPlans(res.plans)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load lesson plans.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleGenerateAI = async () => {
    if (!coreTopic.trim()) {
      alert('Please enter a core topic first.')
      return
    }

    const allocList = profile?.subjectAssignments || []
    const alloc = allocList[parseInt(selectedAllocationIdx)]
    if (!alloc) {
      alert('No valid class allocation found.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const res = await apiSlice.post<{ success: boolean; draft: any }>(
        endpoints.teacher.lessonPlanGenerate,
        {
          classId: alloc.classId,
          subjectId: alloc.subjectId,
          coreTopic: coreTopic.trim(),
          subTopic: subTopic.trim(),
          duration,
          weekNo
        }
      )

      if (res.success && res.draft) {
        setObjectives(res.draft.objectives || '')
        setMaterials(res.draft.materials || '')
        setTeachingGuide(res.draft.teachingGuide || '')
        setAssessments(res.draft.assessments || '')
        setAssignments(res.draft.assignments || '')
        setIsEditing(true)
        setEditingPlanId(null)
        setStatus('PUBLISHED')
        showToast('AI Curriculum Lesson Plan generated successfully!')
      }
    } catch (err: any) {
      setError(err.message || 'AI Lesson Plan generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePlan = async () => {
    if (!coreTopic.trim()) {
      alert('Core topic is required.')
      return
    }

    const allocList = profile?.subjectAssignments || []
    const alloc = allocList[parseInt(selectedAllocationIdx)]
    if (!alloc) {
      alert('No valid class allocation selected.')
      return
    }

    setIsSaving(true)
    try {
      if (editingPlanId) {
        const res = await apiSlice.put<{ success: boolean; plan: LessonPlan }>(
          endpoints.teacher.lessonPlanItem(editingPlanId),
          {
            coreTopic: coreTopic.trim(),
            objectives,
            materials,
            teachingGuide,
            assessments,
            assignments,
            status
          }
        )
        if (res.success) {
          showToast('Lesson plan updated successfully!')
          setIsEditing(false)
          setEditingPlanId(null)
          fetchPlans()
        }
      } else {
        const res = await apiSlice.post<{ success: boolean; plan: LessonPlan }>(
          endpoints.teacher.lessonPlans,
          {
            classId: alloc.classId,
            subjectId: alloc.subjectId,
            coreTopic: coreTopic.trim(),
            objectives,
            materials,
            teachingGuide,
            assessments,
            assignments,
            status
          }
        )
        if (res.success) {
          showToast('Lesson plan saved to curriculum database!')
          setIsEditing(false)
          fetchPlans()
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save lesson plan.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadPdf = async (plan: LessonPlan) => {
    setDownloadingId(plan.id)
    try {
      const filename = `Lesson_Plan_${plan.coreTopic.replace(/\s+/g, '_').slice(0, 25)}.pdf`
      await apiSlice.download(endpoints.teacher.downloadLessonPlanPdf(plan.id), filename)
      showToast('Lesson Plan PDF downloaded!')
    } catch (err: any) {
      alert(err.message || 'Failed to download Lesson Plan PDF.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDeletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lesson plan?')) return
    try {
      const res = await apiSlice.delete<{ success: boolean }>(endpoints.teacher.lessonPlanItem(id))
      if (res.success) {
        setPlans(plans.filter((p) => p.id !== id))
        showToast('Lesson plan deleted.')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete lesson plan.')
    }
  }

  const handleEditExisting = (plan: LessonPlan) => {
    setEditingPlanId(plan.id)
    setCoreTopic(plan.coreTopic)
    setObjectives(plan.educationalObjectives || '')
    setMaterials(plan.materialLists || '')
    setTeachingGuide(plan.teachingGuide || '')
    setAssessments(plan.assessmentCriteria || '')
    setAssignments(plan.classAssignments || '')
    setStatus(plan.status)
    setIsEditing(true)
  }

  const allocList = profile?.subjectAssignments || []

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={18} /> {actionSuccess}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={24} />
            AI Pedagogical Lesson Planner
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate Bloom’s Taxonomy curriculum lesson plans and export printable official PDFs in 1-Click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => {
                setEditingPlanId(null)
                setCoreTopic('')
                setObjectives('')
                setMaterials('')
                setTeachingGuide('')
                setAssessments('')
                setAssignments('')
                setIsEditing(true)
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> New Lesson Plan
            </button>
          )}
        </div>
      </div>

      {/* GENERATOR / BUILDER PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-600" />
            {isEditing ? (editingPlanId ? 'Edit Lesson Plan' : 'Pedagogical Lesson Plan Builder') : 'Create New AI Lesson Plan'}
          </h3>

          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Class & Subject Allocation *</label>
            <select
              value={selectedAllocationIdx}
              onChange={(e) => setSelectedAllocationIdx(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              {allocList.length > 0 ? (
                allocList.map((a, idx) => (
                  <option key={idx} value={idx}>
                    {a.className} {a.sectionName ? `(${a.sectionName})` : ''} - {a.subjectName}
                  </option>
                ))
              ) : (
                <option value="0">Basic Science (JSS 1)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Core Topic *</label>
            <input
              type="text"
              required
              placeholder="e.g. Photosynthesis & Respiration"
              value={coreTopic}
              onChange={(e) => setCoreTopic(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Topic (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Light Reaction and Chlorophyll"
              value={subTopic}
              onChange={(e) => setSubTopic(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Duration & Schedule</label>
            <div className="flex gap-2">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="40 Minutes">40 Mins</option>
                <option value="45 Minutes">45 Mins</option>
                <option value="60 Minutes">60 Mins</option>
                <option value="80 Minutes">80 Mins (Double)</option>
              </select>
              <select
                value={weekNo}
                onChange={(e) => setWeekNo(e.target.value)}
                className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="Week 1">Week 1</option>
                <option value="Week 2">Week 2</option>
                <option value="Week 3">Week 3</option>
                <option value="Week 4">Week 4</option>
                <option value="Week 5">Week 5</option>
                <option value="Week 6">Week 6</option>
                <option value="Week 7">Week 7</option>
                <option value="Week 8">Week 8</option>
                <option value="Week 9">Week 9</option>
                <option value="Week 10">Week 10</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Action Trigger */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateAI}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black rounded-2xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Generate Complete AI Lesson Plan
          </button>
        </div>

        {/* PEDAGOGICAL EDITING FIELDS (When open) */}
        {isEditing && (
          <div className="space-y-5 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
            {/* Section 1: Objectives */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                1. Behavioral Learning Objectives (Bloom's Taxonomy)
              </label>
              <textarea
                rows={4}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="By the end of this lesson, pupils should be able to: 1. Cognitive..., 2. Psychomotor..., 3. Affective..."
                className="w-full p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-sans"
              />
            </div>

            {/* Section 2: Materials */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                2. Instructional Materials & Audio-Visual Teaching Aids
              </label>
              <textarea
                rows={3}
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Itemized teaching aids, diagrams, charts, specimens, textbooks..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Section 3: Step-by-Step Procedure */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                3. Step-by-Step Instructional Procedure & Methodology
              </label>
              <textarea
                rows={7}
                value={teachingGuide}
                onChange={(e) => setTeachingGuide(e.target.value)}
                placeholder="Step 1: Set Induction (5 Mins)... Step 2: Presentation (15 Mins)... Step 3: Guided Practice (10 Mins)..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* Section 4 & 5: Assessment & Assignments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  4. Formative Assessment & Evaluation Criteria
                </label>
                <textarea
                  rows={4}
                  value={assessments}
                  onChange={(e) => setAssessments(e.target.value)}
                  placeholder="Oral diagnostic questions, in-class worksheet rubric..."
                  className="w-full p-3 bg-amber-50/40 border border-amber-200/80 rounded-2xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  5. Home Assignment & Extension Activity
                </label>
                <textarea
                  rows={4}
                  value={assignments}
                  onChange={(e) => setAssignments(e.target.value)}
                  placeholder="Textbook exercises, research inquiry challenge..."
                  className="w-full p-3 bg-purple-50/40 border border-purple-200/80 rounded-2xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Publication Status & Save Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Publication Status:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                >
                  <option value="PUBLISHED">Published to Syllabus</option>
                  <option value="DRAFT">Draft Mode</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSavePlan}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save Lesson Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SAVED LESSON PLANS ROSTER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
            Curriculum Lesson Plans Archive ({plans.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
            <p className="text-xs font-semibold">Loading lesson plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <BookOpen className="mx-auto text-slate-300" size={40} />
            <h4 className="text-sm font-bold text-slate-700">No lesson plans created yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the AI generator above to craft structured curriculum lesson plans with objectives, instructional sequences, and formative assessments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md">
                        {plan.subject?.name || 'Subject'}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                        {plan.class?.name || 'Class'}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        plan.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">{plan.coreTopic}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {plan.educationalObjectives || 'No objectives stated.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDownloadPdf(plan)}
                    disabled={downloadingId === plan.id}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {downloadingId === plan.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    Official PDF
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewPlan(plan)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Preview Lesson Plan"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleEditExisting(plan)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      title="Edit Plan"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Plan"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {previewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <BookOpen size={18} className="text-amber-400" />
                Lesson Plan: {previewPlan.coreTopic}
              </div>
              <button
                onClick={() => setPreviewPlan(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                  {previewPlan.subject?.name}
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
                  {previewPlan.class?.name}
                </span>
              </div>

              {previewPlan.educationalObjectives && (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-1">
                  <h5 className="text-xs font-black text-emerald-900">1. Behavioral Objectives</h5>
                  <p className="text-xs text-slate-800 whitespace-pre-line">{previewPlan.educationalObjectives}</p>
                </div>
              )}

              {previewPlan.materialLists && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <h5 className="text-xs font-black text-slate-900">2. Instructional Materials</h5>
                  <p className="text-xs text-slate-800 whitespace-pre-line">{previewPlan.materialLists}</p>
                </div>
              )}

              {previewPlan.teachingGuide && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
                  <h5 className="text-xs font-black text-indigo-900">3. Instructional Methodology</h5>
                  <p className="text-xs text-slate-800 whitespace-pre-line">{previewPlan.teachingGuide}</p>
                </div>
              )}

              {previewPlan.assessmentCriteria && (
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-1">
                  <h5 className="text-xs font-black text-amber-900">4. Formative Assessment</h5>
                  <p className="text-xs text-slate-800 whitespace-pre-line">{previewPlan.assessmentCriteria}</p>
                </div>
              )}

              {previewPlan.classAssignments && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-1">
                  <h5 className="text-xs font-black text-purple-900">5. Home Assignment</h5>
                  <p className="text-xs text-slate-800 whitespace-pre-line">{previewPlan.classAssignments}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => handleDownloadPdf(previewPlan)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} /> Download Official PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
