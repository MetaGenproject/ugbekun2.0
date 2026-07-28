'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { QuestionBankManager } from '../teacher/question-bank-manager'
import {
  Calendar,
  Clock,
  Trash2,
  Edit2,
  FolderOpen,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Award,
  ListFilter,
  Users,
  Plus,
  Layers,
  BookOpen,
  School,
  Shuffle,
  Eye,
  Check,
  X,
  FileQuestion,
  Sparkles,
  HelpCircle,
  Share2
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

interface OnlineExam {
  id: number
  title: string
  classId: number
  subjectId: number
  passingMark: number
  duration: number
  examDate: string | null
  createdAt: string
  class: {
    id: number
    name: string
  }
  subject: {
    id: number
    name: string
  }
}

interface QuestionGroupItem {
  id: number
  title: string
  description?: string | null
  groupCode: string
  subjectId: number
  questionIds: number[]
  subject?: { id: number; name: string; subjectCode: string }
  createdAt?: string
}

interface CbtDistributionItem {
  id: number
  title: string
  instructions?: string | null
  duration: number
  passingMark: number
  isPublished: boolean
  shuffleQuestions: boolean
  showResults: boolean
  groupId?: number | null
  classId: number
  sectionId?: number | null
  subjectId: number
  startDate?: string | null
  endDate?: string | null
  class?: { id: number; name: string }
  section?: { id: number; name: string }
  subject?: { id: number; name: string; subjectCode?: string }
  group?: { id: number; title: string; groupCode: string; questionIds?: number[] }
}

interface Submission {
  id: number
  student: {
    id: number
    firstName: string
    lastName: string
    registerNo: string
  }
  totalMark: number
  createdAt: string
  submittedAt: string | null
}

export function AdminCbtManager() {
  const [activeTab, setActiveTab] = useState<'distributions' | 'groups' | 'bank' | 'exams'>('distributions')

  // Core setup list data
  const [exams, setExams] = useState<OnlineExam[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [questionGroups, setQuestionGroups] = useState<QuestionGroupItem[]>([])
  const [distributions, setDistributions] = useState<CbtDistributionItem[]>([])

  // Loaders
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [loadingDistributions, setLoadingDistributions] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Question Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [groupTitle, setGroupTitle] = useState('')
  const [groupCode, setGroupCode] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupSubjectId, setGroupSubjectId] = useState('')
  const [isSavingGroup, setIsSavingGroup] = useState(false)

  // Distribution Modal State
  const [isDistModalOpen, setIsDistModalOpen] = useState(false)
  const [editingDistId, setEditingDistId] = useState<number | null>(null)
  const [distTitle, setDistTitle] = useState('')
  const [distClassId, setDistClassId] = useState('')
  const [distSectionId, setDistSectionId] = useState('')
  const [distSubjectId, setDistSubjectId] = useState('')
  const [distGroupId, setDistGroupId] = useState('')
  const [distDuration, setDistDuration] = useState(30)
  const [distPassingMark, setDistPassingMark] = useState(50)
  const [distShuffle, setDistShuffle] = useState(true)
  const [distShowResults, setDistShowResults] = useState(true)
  const [distPublished, setDistPublished] = useState(true)
  const [distInstructions, setDistInstructions] = useState('')
  const [isSavingDist, setIsSavingDist] = useState(false)

  // Submission view
  const [viewingSubmissionsExam, setViewingSubmissionsExam] = useState<OnlineExam | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    if (activeTab === 'groups') {
      fetchGroups()
    } else if (activeTab === 'distributions') {
      fetchDistributions()
    } else if (activeTab === 'exams') {
      fetchExams()
    }
  }, [activeTab])

  const loadConfig = async () => {
    setLoadingConfig(true)
    try {
      const [classRes, subjectRes] = await Promise.all([
        apiSlice.get<{ success: boolean; classes: any[] }>(endpoints.admin.classesSections),
        apiSlice.get<{ success: boolean; subjects: any[] }>(endpoints.admin.subjects),
      ])

      if (classRes.success && classRes.classes) {
        setClasses(classRes.classes)
        if (classRes.classes.length > 0) {
          setDistClassId(String(classRes.classes[0].id))
        }
      }

      if (subjectRes.success && subjectRes.subjects) {
        setSubjects(subjectRes.subjects)
        if (subjectRes.subjects.length > 0) {
          setDistSubjectId(String(subjectRes.subjects[0].id))
          setGroupSubjectId(String(subjectRes.subjects[0].id))
        }
      }

      fetchDistributions()
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration.')
    } finally {
      setLoadingConfig(false)
    }
  }

  const fetchGroups = async () => {
    setLoadingGroups(true)
    try {
      const res = await apiSlice.get<{ success: boolean; groups: QuestionGroupItem[] }>(
        endpoints.admin.cbtGroups()
      )
      if (res.success && res.groups) {
        setQuestionGroups(res.groups)
      }
    } catch (err) {
      console.error('Failed to fetch question groups:', err)
    } finally {
      setLoadingGroups(false)
    }
  }

  const fetchDistributions = async () => {
    setLoadingDistributions(true)
    try {
      const res = await apiSlice.get<{ success: boolean; distributions: CbtDistributionItem[] }>(
        endpoints.admin.cbtDistributions()
      )
      if (res.success && res.distributions) {
        setDistributions(res.distributions)
      }
    } catch (err) {
      console.error('Failed to fetch CBT distributions:', err)
    } finally {
      setLoadingDistributions(false)
    }
  }

  const fetchExams = async () => {
    try {
      const res = await apiSlice.get<{ success: boolean; data: { onlineExams: OnlineExam[] } }>(
        endpoints.admin.onlineExams
      )
      if (res.success && res.data?.onlineExams) {
        setExams(res.data.onlineExams)
      }
    } catch (err) {
      console.error('Failed to fetch online exams:', err)
    }
  }

  // --- Group Actions ---
  const handleOpenCreateGroup = () => {
    setEditingGroupId(null)
    setGroupTitle('')
    setGroupCode('')
    setGroupDescription('')
    setGroupSubjectId(subjects.length > 0 ? String(subjects[0].id) : '')
    setIsGroupModalOpen(true)
  }

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupTitle.trim() || !groupSubjectId) return
    setIsSavingGroup(true)

    try {
      await apiSlice.post(endpoints.admin.cbtGroups(), {
        id: editingGroupId || undefined,
        title: groupTitle.trim(),
        groupCode: groupCode.trim().toUpperCase() || undefined,
        description: groupDescription.trim() || undefined,
        subjectId: Number(groupSubjectId),
      })

      await fetchGroups()
      setIsGroupModalOpen(false)
    } catch (err) {
      console.error('Failed to save question group:', err)
    } finally {
      setIsSavingGroup(false)
    }
  }

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question group?')) return
    try {
      await apiSlice.delete(endpoints.admin.cbtGroupDetail(id))
      await fetchGroups()
    } catch (err) {
      console.error('Failed to delete group:', err)
    }
  }

  // --- Distribution Actions ---
  const handleOpenCreateDist = () => {
    setEditingDistId(null)
    setDistTitle('')
    setDistClassId(classes.length > 0 ? String(classes[0].id) : '')
    setDistSectionId('')
    setDistSubjectId(subjects.length > 0 ? String(subjects[0].id) : '')
    setDistGroupId(questionGroups.length > 0 ? String(questionGroups[0].id) : '')
    setDistDuration(30)
    setDistPassingMark(50)
    setDistShuffle(true)
    setDistShowResults(true)
    setDistPublished(true)
    setDistInstructions('')
    setIsDistModalOpen(true)
  }

  const handleSaveDist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!distTitle.trim() || !distClassId || !distSubjectId) return
    setIsSavingDist(true)

    try {
      await apiSlice.post(endpoints.admin.cbtDistributions(), {
        id: editingDistId || undefined,
        title: distTitle.trim(),
        classId: Number(distClassId),
        sectionId: distSectionId ? Number(distSectionId) : undefined,
        subjectId: Number(distSubjectId),
        groupId: distGroupId ? Number(distGroupId) : undefined,
        duration: Number(distDuration) || 30,
        passingMark: Number(distPassingMark) || 50,
        shuffleQuestions: distShuffle,
        showResults: distShowResults,
        isPublished: distPublished,
        instructions: distInstructions.trim() || undefined,
      })

      await fetchDistributions()
      setIsDistModalOpen(false)
    } catch (err) {
      console.error('Failed to save distribution:', err)
    } finally {
      setIsSavingDist(false)
    }
  }

  const handleTogglePublish = async (dist: CbtDistributionItem) => {
    try {
      await apiSlice.post(endpoints.admin.toggleCbtDistributionPublish(dist.id), {
        isPublished: !dist.isPublished,
      })
      await fetchDistributions()
    } catch (err) {
      console.error('Failed to toggle publish:', err)
    }
  }

  const handleDeleteDist = async (id: number) => {
    if (!confirm('Are you sure you want to remove this CBT test distribution?')) return
    try {
      await apiSlice.delete(endpoints.admin.cbtDistributionDetail(id))
      await fetchDistributions()
    } catch (err) {
      console.error('Failed to delete distribution:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-purple-200 border border-white/15">
              <Award size={14} className="text-purple-300" /> Computer-Based Test (CBT) Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">CBT Distribution & Question Grouping</h1>
            <p className="text-xs sm:text-sm text-purple-100/80 max-w-xl">
              Bundle questions into categorized test packs and distribute CBT assessments directly to classroom portals with time controls and passing thresholds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeTab === 'distributions' && (
              <button
                onClick={handleOpenCreateDist}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Send size={15} /> Distribute Test to Class
              </button>
            )}
            {activeTab === 'groups' && (
              <button
                onClick={handleOpenCreateGroup}
                className="px-4 py-2.5 bg-white text-[#0063a6] hover:bg-blue-50 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Plus size={15} /> Create Question Pack
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('distributions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'distributions'
              ? 'bg-[#0063a6] text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
          }`}
        >
          <Send size={14} /> Class Question Distributions ({distributions.length})
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'groups'
              ? 'bg-[#0063a6] text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
          }`}
        >
          <FolderOpen size={14} /> Question Group Bundles ({questionGroups.length})
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'bank'
              ? 'bg-[#0063a6] text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
          }`}
        >
          <HelpCircle size={14} /> Question Bank Items
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'exams'
              ? 'bg-[#0063a6] text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
          }`}
        >
          <Award size={14} /> Scheduled Exams Roster
        </button>
      </div>

      {/* Tab 1: Class Question Distributions */}
      {activeTab === 'distributions' && (
        <div className="space-y-4">
          {loadingDistributions ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
              <Loader2 size={24} className="animate-spin text-[#0063a6] mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading CBT distributions...</p>
            </div>
          ) : distributions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
              <Send size={32} className="text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No CBT Distributions Found</p>
              <button
                onClick={handleOpenCreateDist}
                className="px-4 py-2 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                + Distribute First CBT Test
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {distributions.map((dist) => (
                <div
                  key={dist.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono bg-purple-50 text-purple-700 border-purple-200">
                        {dist.subject?.subjectCode || 'CBT'}
                      </span>
                      <button
                        onClick={() => handleTogglePublish(dist)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition ${
                          dist.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dist.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {dist.isPublished ? 'Live on Portal' : 'Draft Mode'}
                      </button>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{dist.title}</h3>
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1">
                        <School size={13} className="text-[#0063a6]" /> {dist.class?.name || 'Class'} {dist.section ? `(${dist.section.name})` : ''}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-[#0063a6]" /> {dist.duration} Mins
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award size={13} className="text-purple-600" /> {dist.passingMark}% Pass
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Shuffle size={13} className="text-indigo-600" /> {dist.shuffleQuestions ? 'Shuffled Questions' : 'Sequential Order'}
                      </div>
                    </div>

                    {dist.group && (
                      <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] font-bold text-indigo-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FolderOpen size={13} className="text-indigo-600" /> {dist.group.title}
                        </span>
                        <span className="font-mono text-[10px] text-indigo-600">{dist.group.groupCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDeleteDist(dist.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Question Group Bundles */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {loadingGroups ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
              <Loader2 size={24} className="animate-spin text-[#0063a6] mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading question groups...</p>
            </div>
          ) : questionGroups.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
              <FolderOpen size={32} className="text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Question Group Bundles Found</p>
              <button
                onClick={handleOpenCreateGroup}
                className="px-4 py-2 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                + Create Question Pack
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {questionGroups.map((grp) => (
                <div
                  key={grp.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                        {grp.groupCode}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                        {grp.questionIds?.length || 0} Questions
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">{grp.title}</h3>

                    {grp.subject && (
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                        <BookOpen size={13} className="text-[#0063a6]" /> {grp.subject.name} ({grp.subject.subjectCode})
                      </p>
                    )}

                    {grp.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed font-medium">
                        {grp.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDeleteGroup(grp.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Question Bank */}
      {activeTab === 'bank' && <QuestionBankManager profile={{ role: 1 }} />}

      {/* Tab 4: Scheduled Exams Roster */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Award size={16} className="text-[#0063a6]" /> Active Scheduled Online Exams
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Exams synced from academic schedule or published directly to classrooms.
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Title</TableHead>
                <TableHead>Classroom</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Passing Mark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                    No scheduled exams found.
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((ex) => (
                  <TableRow key={ex.id}>
                    <TableCell className="font-bold text-slate-900">{ex.title}</TableCell>
                    <TableCell>{ex.class?.name || '-'}</TableCell>
                    <TableCell>{ex.subject?.name || '-'}</TableCell>
                    <TableCell>{ex.duration} Mins</TableCell>
                    <TableCell>{ex.passingMark}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Question Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white">
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <FolderOpen size={18} /> {editingGroupId ? 'Edit Question Group' : 'Create Question Group'}
              </h2>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg text-white/80 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Group Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Physics Quiz Pack"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0063a6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Group Code</label>
                  <input
                    type="text"
                    placeholder="e.g. GRP-PHY-01"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#0063a6] uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Subject <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={groupSubjectId}
                    onChange={(e) => setGroupSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0063a6]"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.subjectCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Description & Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Standard practice question pack for mid-term exams."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 outline-none focus:border-[#0063a6] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  disabled={isSavingGroup}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGroup}
                  className="flex-1 px-4 py-2.5 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isSavingGroup ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Question Pack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit CBT Distribution Modal */}
      {isDistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <Send size={18} /> {editingDistId ? 'Edit CBT Distribution' : 'Distribute CBT Test to Class'}
              </h2>
              <button
                onClick={() => setIsDistModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg text-white/80 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDist} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Test Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Term 1 Mathematics CBT Assessment"
                  value={distTitle}
                  onChange={(e) => setDistTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                />
              </div>

              {/* Class & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Target Class <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={distClassId}
                    onChange={(e) => setDistClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Subject <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={distSubjectId}
                    onChange={(e) => setDistSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.subjectCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Group Pack */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Question Group Pack (Optional)</label>
                <select
                  value={distGroupId}
                  onChange={(e) => setDistGroupId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-purple-600"
                >
                  <option value="">Select Question Pack</option>
                  {questionGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.groupCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration & Passing Mark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={distDuration}
                    onChange={(e) => setDistDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Passing Mark (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={distPassingMark}
                    onChange={(e) => setDistPassingMark(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Options Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={distShuffle}
                    onChange={(e) => setDistShuffle(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <span>Shuffle question order for students</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={distPublished}
                    onChange={(e) => setDistPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <span>Publish live on Student CBT Portal</span>
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDistModalOpen(false)}
                  disabled={isSavingDist}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDist}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isSavingDist ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Distribute to Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
