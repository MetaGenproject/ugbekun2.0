'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Share2,
  Folder,
  FolderOpen,
  ChevronRight,
  ArrowLeft,
  Search,
  Filter,
  Users
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

  // Archive Organization & Folder State (like CBT/Test session)
  const [archiveViewMode, setArchiveViewMode] = useState<'folders' | 'all'>('folders')
  const [selectedFolderSubjectId, setSelectedFolderSubjectId] = useState<number | null>(null)
  const [folderSearchTerm, setFolderSearchTerm] = useState('')
  const [planSearchTerm, setPlanSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState<string>('All')
  const [filterStatus, setFilterStatus] = useState<string>('All')

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

  // Organize Lesson Plans by Subject into structured Folders
  const subjectFolders = useMemo(() => {
    const map = new Map<number, {
      subjectId: number
      subjectName: string
      subjectCode: string
      plansCount: number
      publishedCount: number
      draftCount: number
      classes: Set<string>
      colorStyle: { bg: string; border: string; text: string; lightBg: string; badge: string }
    }>()

    const colorPresets = [
      { bg: 'bg-indigo-600', border: 'border-indigo-200', text: 'text-indigo-700', lightBg: 'bg-indigo-50/80', badge: 'bg-indigo-100 text-indigo-800' },
      { bg: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-700', lightBg: 'bg-emerald-50/80', badge: 'bg-emerald-100 text-emerald-800' },
      { bg: 'bg-blue-600', border: 'border-blue-200', text: 'text-blue-700', lightBg: 'bg-blue-50/80', badge: 'bg-blue-100 text-blue-800' },
      { bg: 'bg-purple-600', border: 'border-purple-200', text: 'text-purple-700', lightBg: 'bg-purple-50/80', badge: 'bg-purple-100 text-purple-800' },
      { bg: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700', lightBg: 'bg-amber-50/80', badge: 'bg-amber-100 text-amber-800' },
      { bg: 'bg-rose-500', border: 'border-rose-200', text: 'text-rose-700', lightBg: 'bg-rose-50/80', badge: 'bg-rose-100 text-rose-800' },
      { bg: 'bg-cyan-600', border: 'border-cyan-200', text: 'text-cyan-700', lightBg: 'bg-cyan-50/80', badge: 'bg-cyan-100 text-cyan-800' },
      { bg: 'bg-teal-600', border: 'border-teal-200', text: 'text-teal-700', lightBg: 'bg-teal-50/80', badge: 'bg-teal-100 text-teal-800' },
    ]

    // Pre-populate with teacher's assigned subjects if available
    profile?.subjectAssignments?.forEach((sa, idx) => {
      if (!map.has(sa.subjectId)) {
        map.set(sa.subjectId, {
          subjectId: sa.subjectId,
          subjectName: sa.subjectName,
          subjectCode: sa.subjectName.substring(0, 3).toUpperCase(),
          plansCount: 0,
          publishedCount: 0,
          draftCount: 0,
          classes: new Set<string>([sa.className]),
          colorStyle: colorPresets[idx % colorPresets.length],
        })
      } else {
        map.get(sa.subjectId)?.classes.add(sa.className)
      }
    })

    // Aggregate all plans
    plans.forEach((plan) => {
      let folder = map.get(plan.subjectId)
      if (!folder) {
        folder = {
          subjectId: plan.subjectId,
          subjectName: plan.subject?.name || `Subject #${plan.subjectId}`,
          subjectCode: (plan.subject?.name || 'SUB').substring(0, 3).toUpperCase(),
          plansCount: 0,
          publishedCount: 0,
          draftCount: 0,
          classes: new Set<string>(),
          colorStyle: colorPresets[map.size % colorPresets.length],
        }
        map.set(plan.subjectId, folder)
      }
      folder.plansCount += 1
      if (plan.status === 'PUBLISHED') folder.publishedCount += 1
      else folder.draftCount += 1
      if (plan.class?.name) folder.classes.add(plan.class.name)
    })

    return Array.from(map.values())
  }, [profile, plans])

  // Filtered folder list for search
  const filteredFolders = useMemo(() => {
    return subjectFolders.filter((f) => {
      const matchSearch =
        f.subjectName.toLowerCase().includes(folderSearchTerm.toLowerCase()) ||
        f.subjectCode.toLowerCase().includes(folderSearchTerm.toLowerCase())
      return matchSearch
    })
  }, [subjectFolders, folderSearchTerm])

  // Selected folder data
  const currentFolder = useMemo(() => {
    if (!selectedFolderSubjectId) return null
    return subjectFolders.find((f) => f.subjectId === selectedFolderSubjectId) || null
  }, [subjectFolders, selectedFolderSubjectId])

  // Classes list for filtering
  const classesFilterList = useMemo(() => {
    const classSet = new Set<string>()
    plans.forEach((p) => {
      if (p.class?.name) classSet.add(p.class.name)
    })
    profile?.subjectAssignments?.forEach((sa) => {
      if (sa.className) classSet.add(sa.className)
    })
    return Array.from(classSet)
  }, [plans, profile])

  // Filtered plans inside a folder or in all plans view
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchFolder = selectedFolderSubjectId ? plan.subjectId === selectedFolderSubjectId : true
      const matchSearch =
        plan.coreTopic.toLowerCase().includes(planSearchTerm.toLowerCase()) ||
        (plan.educationalObjectives && plan.educationalObjectives.toLowerCase().includes(planSearchTerm.toLowerCase()))
      const matchClass = filterClass === 'All' || plan.class?.name === filterClass
      const matchStatus = filterStatus === 'All' || plan.status === filterStatus
      return matchFolder && matchSearch && matchClass && matchStatus
    })
  }, [plans, selectedFolderSubjectId, planSearchTerm, filterClass, filterStatus])

  const handleGenerateAI = async () => {
    if (!coreTopic.trim()) {
      alert('Please enter a core lesson topic.')
      return
    }

    const alloc = profile?.subjectAssignments?.[parseInt(selectedAllocationIdx)]
    if (!alloc) {
      alert('Please select a valid subject allocation.')
      return
    }

    setIsGenerating(true)
    setError(null)
    try {
      const res = await apiSlice.post<{ success: boolean; lessonPlan: any }>(
        endpoints.teacher.lessonPlanGenerate,
        {
          subjectName: alloc.subjectName,
          className: alloc.className,
          coreTopic: coreTopic.trim(),
          subTopic: subTopic.trim() || undefined,
          duration,
          weekNo,
        }
      )

      if (res.success && res.lessonPlan) {
        const lp = res.lessonPlan
        setObjectives(lp.educationalObjectives || '')
        setMaterials(lp.materialLists || '')
        setTeachingGuide(lp.teachingGuide || '')
        setAssessments(lp.assessmentCriteria || '')
        setAssignments(lp.classAssignments || '')
        setIsEditing(true)
        showToast('AI Curriculum Lesson Plan generated successfully!')
      }
    } catch (err: any) {
      setError(err.message || 'AI Lesson Plan generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePlan = async () => {
    const alloc = profile?.subjectAssignments?.[parseInt(selectedAllocationIdx)]
    if (!alloc) {
      alert('Please select a valid class and subject allocation.')
      return
    }

    if (!coreTopic.trim()) {
      alert('Core lesson topic is required.')
      return
    }

    setIsSaving(true)
    try {
      if (editingPlanId) {
        const res = await apiSlice.put<{ success: boolean; plan: LessonPlan }>(
          endpoints.teacher.lessonPlanItem(editingPlanId),
          {
            coreTopic,
            educationalObjectives: objectives,
            materialLists: materials,
            teachingGuide,
            assessmentCriteria: assessments,
            classAssignments: assignments,
            status,
          }
        )
        if (res.success) {
          setPlans(plans.map((p) => (p.id === editingPlanId ? res.plan : p)))
          showToast('Lesson plan updated successfully!')
          setIsEditing(false)
          setEditingPlanId(null)
        }
      } else {
        const res = await apiSlice.post<{ success: boolean; plan: LessonPlan }>(
          endpoints.teacher.lessonPlans,
          {
            classId: alloc.classId,
            subjectId: alloc.subjectId,
            coreTopic,
            educationalObjectives: objectives,
            materialLists: materials,
            teachingGuide,
            assessmentCriteria: assessments,
            classAssignments: assignments,
            status,
          }
        )
        if (res.success) {
          setPlans([res.plan, ...plans])
          showToast('Lesson plan saved to curriculum database!')
          setIsEditing(false)
          setCoreTopic('')
          setSubTopic('')
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save lesson plan.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadPdf = async (plan: LessonPlan) => {
    try {
      setDownloadingId(plan.id)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Quick shortcut: create new plan for this subject folder
  const handleCreateNewForSubject = (subjectId: number) => {
    const allocIdx = profile?.subjectAssignments?.findIndex((sa) => sa.subjectId === subjectId)
    if (allocIdx !== undefined && allocIdx >= 0) {
      setSelectedAllocationIdx(String(allocIdx))
    }
    setEditingPlanId(null)
    setCoreTopic('')
    setSubTopic('')
    setObjectives('')
    setMaterials('')
    setTeachingGuide('')
    setAssessments('')
    setAssignments('')
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const allocList = profile?.subjectAssignments || []

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={18} /> {actionSuccess}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-extrabold text-[10px] uppercase tracking-wider">
              Pedagogical Framework
            </span>
            <span className="text-xs text-slate-400 font-bold">•</span>
            <span className="text-xs text-slate-500 font-semibold">{plans.length} Lesson Plans in Archive</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={24} />
            AI Pedagogical Lesson Planner & Archive
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate Bloom’s Taxonomy curriculum lesson plans, organize dossiers by subject folder, and export printable official PDFs.
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
              onClick={() => {
                setIsEditing(false)
                setEditingPlanId(null)
              }}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              Close Editor
            </button>
          )}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Class & Subject Allocation *
            </label>
            <select
              value={selectedAllocationIdx}
              onChange={(e) => setSelectedAllocationIdx(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {allocList.map((al, idx) => (
                <option key={idx} value={idx}>
                  {al.className} ({al.sectionName}) &bull; {al.subjectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              <option value="35 Minutes">35 Minutes (Primary)</option>
              <option value="45 Minutes">45 Minutes (Secondary Standard)</option>
              <option value="80 Minutes">80 Minutes (Double Practical)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Academic Week</label>
            <select
              value={weekNo}
              onChange={(e) => setWeekNo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              {Array.from({ length: 14 }).map((_, i) => (
                <option key={i} value={`Week ${i + 1}`}>
                  Week {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Core Topic *</label>
            <input
              type="text"
              required
              placeholder="e.g. Chemical Bonding: Covalent & Ionic"
              value={coreTopic}
              onChange={(e) => setCoreTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Topic / Focus Area</label>
            <input
              type="text"
              placeholder="e.g. Electron sharing in Carbon Dioxide and Methane"
              value={subTopic}
              onChange={(e) => setSubTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Generate Action Button */}
        {!isEditing && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate Complete AI Lesson Plan
            </button>
          </div>
        )}

        {/* Pedagogical Draft Editor Sections */}
        {isEditing && (
          <div className="pt-4 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Award size={14} className="text-emerald-600" />
                1. Behavioral Objectives (Cognitive, Affective, Psychomotor)
              </label>
              <textarea
                rows={3}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="By the end of this lesson, pupils should be able to: 1. Cognitive..., 2. Psychomotor..., 3. Affective..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Layers size={14} className="text-blue-600" />
                2. Instructional Materials & Resources
              </label>
              <textarea
                rows={2}
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Charts, Flashcards, Atomic model kits, Periodic table, Realia..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Clock size={14} className="text-purple-600" />
                3. Instructional Methodology & Step-by-Step Delivery
              </label>
              <textarea
                rows={5}
                value={teachingGuide}
                onChange={(e) => setTeachingGuide(e.target.value)}
                placeholder="Step 1: Introduction & Prior Knowledge activation (5 mins)&#10;Step 2: Core Concept Presentation (15 mins)&#10;Step 3: Guided Practice (15 mins)&#10;Step 4: Independent Practice & Evaluation (10 mins)"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-amber-600" />
                  4. Formative Assessment & Evaluation Criteria
                </label>
                <textarea
                  rows={3}
                  value={assessments}
                  onChange={(e) => setAssessments(e.target.value)}
                  placeholder="Quick quiz questions, Oral checks, whiteboard response..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <FileText size={14} className="text-rose-600" />
                  5. Home Study Assignment & Extension Activity
                </label>
                <textarea
                  rows={3}
                  value={assignments}
                  onChange={(e) => setAssignments(e.target.value)}
                  placeholder="Exercises on page 42, Research question for next class..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed text-slate-800 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700">Status:</span>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="lpstatus"
                    checked={status === 'PUBLISHED'}
                    onChange={() => setStatus('PUBLISHED')}
                  />
                  Published
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="lpstatus"
                    checked={status === 'DRAFT'}
                    onChange={() => setStatus('DRAFT')}
                  />
                  Draft
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setEditingPlanId(null)
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePlan}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Lesson Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CURRICULUM LESSON PLANS ARCHIVE (FOLDER SYSTEM LIKE CBT/TEST) */}
      <div className="space-y-6">
        {/* Archive Section Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Folder className="text-amber-500" size={18} />
              Curriculum Lesson Plans Archive ({plans.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Organized subject dossiers containing curriculum lesson notes, behavioral objectives, and printable PDFs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setArchiveViewMode('folders')
                setSelectedFolderSubjectId(null)
              }}
              className={`px-3.5 py-1.5 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                archiveViewMode === 'folders' && selectedFolderSubjectId === null
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Folder size={14} />
              <span>Subject Folders ({subjectFolders.length})</span>
            </button>

            <button
              onClick={() => {
                setArchiveViewMode('all')
                setSelectedFolderSubjectId(null)
              }}
              className={`px-3.5 py-1.5 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                archiveViewMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Layers size={14} />
              <span>All Lesson Plans ({plans.length})</span>
            </button>
          </div>
        </div>

        {/* 1. SUBJECT FOLDERS CABINET (GRID OF FOLDERS) */}
        {archiveViewMode === 'folders' && selectedFolderSubjectId === null && (
          <div className="space-y-6">
            {/* Search Bar for Folders */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search subject folders..."
                  value={folderSearchTerm}
                  onChange={(e) => setFolderSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="text-xs font-semibold text-slate-500">
                Click any subject folder to view and manage its curriculum lesson plan dossiers.
              </div>
            </div>

            {/* Folder Grid */}
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="animate-spin text-indigo-600" size={28} />
                <p className="text-xs font-semibold">Loading curriculum folders...</p>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <BookOpen className="mx-auto text-slate-300" size={40} />
                <h4 className="text-sm font-bold text-slate-700">No subject folders found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create a new lesson plan above to automatically file it into its subject curriculum folder.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredFolders.map((folder, idx) => {
                  const classesArray = Array.from(folder.classes)

                  return (
                    <div
                      key={`subj-folder-${folder.subjectId}-${idx}`}
                      onClick={() => setSelectedFolderSubjectId(folder.subjectId)}
                      className="group relative bg-white rounded-3xl border border-slate-200/90 hover:border-indigo-400 shadow-xs hover:shadow-xl transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer overflow-hidden"
                    >
                      {/* Folder Top Tab Effect */}
                      <div className="absolute top-0 right-0 w-24 h-6 bg-slate-100 rounded-bl-2xl border-l border-b border-slate-200/80 flex items-center justify-center">
                        <span className="text-[10px] font-black text-slate-500 tracking-wider">
                          {folder.subjectCode}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Folder Icon & Counter */}
                        <div className="flex items-center justify-between">
                          <div className={`w-14 h-14 rounded-2xl ${folder.colorStyle.lightBg} border ${folder.colorStyle.border} flex items-center justify-center text-slate-800 shadow-xs group-hover:scale-110 transition-transform`}>
                            <FolderOpen size={28} className={folder.colorStyle.text} />
                          </div>
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-extrabold text-xs">
                            {folder.plansCount} Plan{folder.plansCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Subject Name */}
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {folder.subjectName}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Curriculum Subject Folder
                          </p>
                        </div>

                        {/* Composition Breakdown */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold text-slate-500">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {folder.publishedCount} Published
                          </span>
                          {folder.draftCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-bold">
                              {folder.draftCount} Drafts
                            </span>
                          )}
                        </div>

                        {/* Class Levels */}
                        {classesArray.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                            {classesArray.slice(0, 3).map((cls, cIdx) => (
                              <span key={cIdx} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold">
                                {cls}
                              </span>
                            ))}
                            {classesArray.length > 3 && (
                              <span className="text-[9px] text-slate-400 font-bold">
                                +{classesArray.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Open Folder Action */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                        <span>Open Folder Dossier</span>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. INSIDE A SELECTED SUBJECT FOLDER */}
        {archiveViewMode === 'folders' && selectedFolderSubjectId !== null && currentFolder && (
          <div className="space-y-6">
            {/* Breadcrumb & Folder Header Banner */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderSubjectId(null)}
                    className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    <ArrowLeft size={16} />
                    <span>All Folders</span>
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-bold text-[11px]">
                        {currentFolder.subjectCode}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        Curriculum Lesson Plans Archive
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
                      <FolderOpen className="text-indigo-600" size={22} />
                      {currentFolder.subjectName} Dossier
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                    {currentFolder.plansCount} Lesson Plan{currentFolder.plansCount !== 1 ? 's' : ''}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCreateNewForSubject(currentFolder.subjectId)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus size={14} /> New Plan for {currentFolder.subjectName}
                  </button>
                </div>
              </div>

              {/* Inside Folder Filter Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder={`Search ${currentFolder.subjectName} topics...`}
                    value={planSearchTerm}
                    onChange={(e) => setPlanSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                  <span className="text-xs font-bold text-slate-500">Filter Class:</span>
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                  >
                    <option value="All">All Classes</option>
                    {classesFilterList.map((c, cIdx) => (
                      <option key={cIdx} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <span className="text-xs font-bold text-slate-500">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                  >
                    <option value="All">All Statuses</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Plans Grid inside Folder */}
            {filteredPlans.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <BookOpen className="mx-auto text-slate-300" size={40} />
                <h4 className="text-sm font-bold text-slate-700">No lesson plans found in this folder</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Craft a curriculum lesson plan for {currentFolder.subjectName} using the AI generator above.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleCreateNewForSubject(currentFolder.subjectId)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Create Lesson Plan
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlans.map((plan, idx) => (
                  <div
                    key={`folder-plan-${plan.id}-${idx}`}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md">
                            {plan.subject?.name || 'Subject'}
                          </span>
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
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
        )}

        {/* 3. ALL LESSON PLANS STREAM (FLAT VIEW) */}
        {archiveViewMode === 'all' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search all lesson plan topics..."
                  value={planSearchTerm}
                  onChange={(e) => setPlanSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                <span className="text-xs font-bold text-slate-500">Class:</span>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="All">All Classes</option>
                  {classesFilterList.map((c, cIdx) => (
                    <option key={cIdx} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="All">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>

            {/* Plans List */}
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="animate-spin text-indigo-600" size={28} />
                <p className="text-xs font-semibold">Loading lesson plans...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <BookOpen className="mx-auto text-slate-300" size={40} />
                <h4 className="text-sm font-bold text-slate-700">No lesson plans found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Use the AI generator above to craft structured curriculum lesson plans with objectives, instructional sequences, and formative assessments.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlans.map((plan, idx) => (
                  <div
                    key={`all-plan-${plan.id}-${idx}`}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md">
                            {plan.subject?.name || 'Subject'}
                          </span>
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
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
