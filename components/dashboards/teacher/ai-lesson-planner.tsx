'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { Sparkles, Save, BookOpen, Trash2, Edit2, AlertCircle, Loader2, CheckCircle } from 'lucide-react'

interface TeacherProfile {
  id: number
  name: string
  isSubjectTeacher: boolean
  isFormTeacher: boolean
  subjectAssignments: Array<{
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
  profile: TeacherProfile
}

export function AiLessonPlanner({ profile }: AiLessonPlannerProps) {
  const [plans, setPlans] = useState<LessonPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Selector state
  const [selectedAllocationIdx, setSelectedAllocationIdx] = useState('0')
  const [coreTopic, setCoreTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Draft Editor State
  const [isEditing, setIsEditing] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [objectives, setObjectives] = useState('')
  const [materials, setMaterials] = useState('')
  const [teachingGuide, setTeachingGuide] = useState('')
  const [assessments, setAssessments] = useState('')
  const [assignments, setAssignments] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT')

  const fetchPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; plans: LessonPlan[] }>(
        `${endpoints.teacher.gradebookSheet.split('/gradebook')[0]}/lesson-plan`
      )
      if (res.success) {
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

    const alloc = profile.subjectAssignments[parseInt(selectedAllocationIdx)]
    if (!alloc) {
      alert('No valid class allocation found.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setActionSuccess(null)

    try {
      const url = `${endpoints.teacher.gradebookSheet.split('/gradebook')[0]}/lesson-plan/generate`
      const res = await apiSlice.post<{ success: boolean; draft: any }>(url, {
        classId: alloc.classId,
        subjectId: alloc.subjectId,
        coreTopic
      })

      if (res.success && res.draft) {
        setObjectives(res.draft.objectives || '')
        setMaterials(res.draft.materials || '')
        setTeachingGuide(res.draft.teachingGuide || '')
        setAssessments(res.draft.assessments || '')
        setAssignments(res.draft.assignments || '')
        setIsEditing(true)
        setEditingPlanId(null)
        setStatus('DRAFT')
        setActionSuccess('AI Draft curriculum generated successfully!')
      } else {
        setError('Failed to generate AI plan.')
      }
    } catch (err: any) {
      setError(err.message || 'Deepseek AI failed to compile the draft.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePlan = async () => {
    const alloc = profile.subjectAssignments[parseInt(selectedAllocationIdx)]
    if (!alloc) return

    setError(null)
    setActionSuccess(null)

    try {
      const url = `${endpoints.teacher.gradebookSheet.split('/gradebook')[0]}/lesson-plan`
      let res

      if (editingPlanId) {
        // PUT update
        res = await apiSlice.put<{ success: boolean }>(`${url}/${editingPlanId}`, {
          coreTopic,
          objectives,
          materials,
          teachingGuide,
          assessments,
          assignments,
          status
        })
      } else {
        // POST create
        res = await apiSlice.post<{ success: boolean }>(url, {
          classId: alloc.classId,
          subjectId: alloc.subjectId,
          coreTopic,
          objectives,
          materials,
          teachingGuide,
          assessments,
          assignments,
          status
        })
      }

      if (res.success) {
        setActionSuccess(`Lesson plan successfully saved as ${status}.`)
        setIsEditing(false)
        setEditingPlanId(null)
        setCoreTopic('')
        fetchPlans()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson plan.')
    }
  }

  const handleEditClick = (plan: LessonPlan) => {
    const allocIdx = profile.subjectAssignments.findIndex(
      (a) => a.classId === plan.classId && a.subjectId === plan.subjectId
    )
    if (allocIdx !== -1) {
      setSelectedAllocationIdx(String(allocIdx))
    }
    setCoreTopic(plan.coreTopic)
    setObjectives(plan.educationalObjectives || '')
    setMaterials(plan.materialLists || '')
    setTeachingGuide(plan.teachingGuide || '')
    setAssessments(plan.assessmentCriteria || '')
    setAssignments(plan.classAssignments || '')
    setStatus(plan.status)
    setEditingPlanId(plan.id)
    setIsEditing(true)
  }

  const handleDeleteClick = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this lesson plan?')) return
    setError(null)
    setActionSuccess(null)
    try {
      const url = `${endpoints.teacher.gradebookSheet.split('/gradebook')[0]}/lesson-plan/${planId}`
      const res = await apiSlice.delete<{ success: boolean; message?: string }>(url)
      if (res.success) {
        setActionSuccess('Lesson plan deleted successfully.')
        fetchPlans()
      } else {
        setError(res.message || 'Failed to delete lesson plan.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete lesson plan.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-violet-800 via-indigo-700 to-purple-800 p-6 md:p-8 shadow-md overflow-hidden text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-white/25 rounded-full border border-white/30 shadow-sm inline-block">
            AI Co-Pilot Workspace
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Lesson Planner</h1>
          <p className="text-white/80 text-sm max-w-xl font-medium">
            Draft objectives, materials, activities, and assignments instantly using Deepseek engine. Edit and authorize before launching.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-xs">
          <AlertCircle size={18} className="text-rose-600" />
          {error}
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-xs">
          <CheckCircle size={18} className="text-emerald-600" />
          {actionSuccess}
        </div>
      )}

      {/* Control Panel: Generation and Existing list */}
      {!isEditing ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Generation form */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Sparkles size={16} className="text-violet-600" /> Generate New Lesson
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Target Class & Subject</label>
                <select
                  value={selectedAllocationIdx}
                  onChange={(e) => setSelectedAllocationIdx(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-violet-500 focus:outline-none cursor-pointer"
                >
                  {profile.subjectAssignments.map((alloc, idx) => (
                    <option key={idx} value={idx}>
                      {alloc.className} • {alloc.subjectName} ({alloc.sectionName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Core Topic</label>
                <input
                  type="text"
                  value={coreTopic}
                  onChange={(e) => setCoreTopic(e.target.value)}
                  placeholder="e.g. Intro to Quadratic Equations"
                  className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="w-full py-2.5 bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-800 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Analyzing syllabus...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate Syllabus Canvas
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Previous Lesson Plans List */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <BookOpen size={16} className="text-slate-600" /> Syllabus Archives
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 gap-2">
                <Loader2 size={24} className="animate-spin text-violet-600" />
                <p className="text-xs text-slate-400 font-semibold">Loading archives...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto text-slate-200 mb-2" size={32} />
                <p className="text-xs text-slate-400 font-semibold">No syllabus canvas drafts yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {plans.map((plan) => (
                  <div key={plan.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                          plan.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {plan.status}
                        </span>
                        <h4 className="text-xs font-black text-slate-800 line-clamp-1">{plan.coreTopic}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {plan.class.name} • {plan.subject.name}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(plan)}
                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(plan.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Staged AI Draft editor workspace */
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="px-2 py-0.5 text-[10px] font-bold text-violet-700 bg-violet-50 rounded-md border border-violet-100 uppercase tracking-wide inline-block mb-1">
                Editing Draft Canvas
              </span>
              <h2 className="text-lg font-black text-slate-800">
                {coreTopic}
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="DRAFT">Keep as Draft</option>
                <option value="PUBLISHED">Authorize & Publish</option>
              </select>

              <button
                onClick={handleSavePlan}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                <Save size={13} /> Save Plan
              </button>

              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditingPlanId(null)
                  setCoreTopic('')
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Educational Objectives</label>
                <textarea
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  rows={4}
                  className="w-full p-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Teaching Materials List</label>
                <textarea
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  rows={4}
                  className="w-full p-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Assessments Rubric & Evaluation</label>
                <textarea
                  value={assessments}
                  onChange={(e) => setAssessments(e.target.value)}
                  rows={4}
                  className="w-full p-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Step-by-Step Teaching Guide (Timeline)</label>
                <textarea
                  value={teachingGuide}
                  onChange={(e) => setTeachingGuide(e.target.value)}
                  rows={9}
                  className="w-full p-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Classroom Tasks & Homework Assignment</label>
                <textarea
                  value={assignments}
                  onChange={(e) => setAssignments(e.target.value)}
                  rows={4}
                  className="w-full p-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
