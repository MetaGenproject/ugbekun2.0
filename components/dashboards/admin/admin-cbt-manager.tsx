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
  Share2,
  BarChart3,
  TrendingUp,
  RefreshCw,
  ArrowUpRight
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

interface AnalyticsData {
  distribution: CbtDistributionItem
  totalEnrolled: number
  submittedCount: number
  pendingCount: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passRate: number
  questionsCount: number
  students: Array<{
    studentId: number
    studentName: string
    registerNo: string
    isSubmitted: boolean
    totalMark: number | null
    submittedAt: string | null
  }>
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
  const [notification, setNotification] = useState<string | null>(null)

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

  // Analytics & Marksheet Sync Modal State
  const [analyticsDistId, setAnalyticsDistId] = useState<number | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [isSyncingMarks, setIsSyncingMarks] = useState(false)
  const [maxScoreBase, setMaxScoreBase] = useState(40)

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

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
    } catch (err) {
      console.error('Error loading config:', err)
      setError('Failed to load classes or subjects.')
    } finally {
      setLoadingConfig(false)
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
      console.error('Error loading distributions:', err)
    } finally {
      setLoadingDistributions(false)
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
      console.error('Error loading question groups:', err)
    } finally {
      setLoadingGroups(false)
    }
  }

  const fetchExams = async () => {
    try {
      const res = await apiSlice.get<{ success: boolean; exams: OnlineExam[] }>(
        endpoints.admin.onlineExams
      )
      if (res.success && res.exams) {
        setExams(res.exams)
      }
    } catch (err) {
      console.error('Error loading online exams:', err)
    }
  }

  // Toggle Publish
  const handleTogglePublish = async (dist: CbtDistributionItem) => {
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.toggleCbtDistributionPublish(dist.id),
        { isPublished: !dist.isPublished }
      )
      if (res.success) {
        setDistributions(
          distributions.map((d) => (d.id === dist.id ? { ...d, isPublished: !dist.isPublished } : d))
        )
        showToast(res.message || 'CBT status updated.')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update publication status.')
    }
  }

  // Delete Distribution
  const handleDeleteDistribution = async (id: number) => {
    if (!confirm('Are you sure you want to delete this CBT distribution?')) return
    try {
      const res = await apiSlice.delete<{ success: boolean }>(
        endpoints.admin.cbtDistributionDetail(id)
      )
      if (res.success) {
        setDistributions(distributions.filter((d) => d.id !== id))
        showToast('CBT distribution deleted.')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete distribution.')
    }
  }

  // Handle Save Question Group
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupTitle.trim() || !groupSubjectId) {
      alert('Title and Subject are required.')
      return
    }

    setIsSavingGroup(true)
    try {
      const payload = {
        id: editingGroupId || undefined,
        title: groupTitle.trim(),
        groupCode: groupCode.trim() || `GRP-${Date.now().toString().slice(-4)}`,
        description: groupDescription.trim() || null,
        subjectId: Number(groupSubjectId),
      }

      const res = await apiSlice.post<{ success: boolean; group: QuestionGroupItem }>(
        endpoints.admin.cbtGroups(),
        payload
      )

      if (res.success) {
        fetchGroups()
        setIsGroupModalOpen(false)
        setEditingGroupId(null)
        setGroupTitle('')
        setGroupCode('')
        setGroupDescription('')
        showToast('Question group saved successfully!')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save question group.')
    } finally {
      setIsSavingGroup(false)
    }
  }

  // Handle Save Distribution
  const handleSaveDistribution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!distTitle.trim() || !distClassId || !distSubjectId) {
      alert('Title, Class, and Subject are required.')
      return
    }

    setIsSavingDist(true)
    try {
      const payload = {
        id: editingDistId || undefined,
        title: distTitle.trim(),
        classId: Number(distClassId),
        sectionId: distSectionId ? Number(distSectionId) : null,
        subjectId: Number(distSubjectId),
        groupId: distGroupId ? Number(distGroupId) : null,
        duration: Number(distDuration) || 30,
        passingMark: Number(distPassingMark) || 50,
        shuffleQuestions: distShuffle,
        showResults: distShowResults,
        isPublished: distPublished,
        instructions: distInstructions.trim() || null,
      }

      const res = await apiSlice.post<{ success: boolean; distribution: CbtDistributionItem }>(
        endpoints.admin.cbtDistributions(),
        payload
      )

      if (res.success) {
        fetchDistributions()
        setIsDistModalOpen(false)
        setEditingDistId(null)
        setDistTitle('')
        setDistInstructions('')
        showToast('CBT Assessment distributed to class successfully!')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to distribute CBT test.')
    } finally {
      setIsSavingDist(false)
    }
  }

  // Open Analytics Modal
  const openAnalyticsModal = async (distId: number) => {
    setAnalyticsDistId(distId)
    setLoadingAnalytics(true)
    try {
      const res = await apiSlice.get<{ success: boolean } & AnalyticsData>(
        endpoints.admin.cbtDistributionAnalytics(distId)
      )
      if (res.success) {
        setAnalyticsData(res)
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // Handle Marksheet Sync
  const handleSyncMarks = async () => {
    if (!analyticsDistId) return
    setIsSyncingMarks(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string; syncedCount: number }>(
        endpoints.admin.cbtDistributionSyncMarks(analyticsDistId),
        { maxScoreBase }
      )
      if (res.success) {
        showToast(res.message || `Scores synced into official report cards!`)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to sync marks to report cards.')
    } finally {
      setIsSyncingMarks(false)
    }
  }

  const activeSectionsForClass = classes.find((c) => String(c.id) === String(distClassId))?.sections || []

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={18} /> {notification}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="text-amber-500" size={24} />
            CBT Online Examination & Auto-Grading Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build question banks, distribute randomized CBT tests to classrooms, and auto-sync scores directly to report cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'distributions' && (
            <button
              onClick={() => {
                setEditingDistId(null)
                setDistTitle('')
                setDistInstructions('')
                setIsDistModalOpen(true)
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> Distribute New CBT Test
            </button>
          )}

          {activeTab === 'groups' && (
            <button
              onClick={() => {
                setEditingGroupId(null)
                setGroupTitle('')
                setGroupCode(`GRP-${Date.now().toString().slice(-4)}`)
                setGroupDescription('')
                setIsGroupModalOpen(true)
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> Create Question Bundle
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('distributions')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'distributions'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send size={15} /> Active Test Distributions ({distributions.length})
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'bank'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle size={15} /> Question Bank & Importers
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'groups'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers size={15} /> Question Bundles ({questionGroups.length})
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'exams'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={15} /> Legacy Exams Schedule ({exams.length})
        </button>
      </div>

      {/* TAB 1: DISTRIBUTIONS */}
      {activeTab === 'distributions' && (
        <div className="space-y-4">
          {loadingDistributions ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="animate-spin text-amber-500" size={32} />
              <p className="text-xs font-semibold">Loading CBT distributions...</p>
            </div>
          ) : distributions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Award className="mx-auto text-slate-300" size={40} />
              <h3 className="text-sm font-bold text-slate-700">No active CBT test distributions</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Schedule and distribute a timed CBT test to a target classroom and stream to allow pupils to take online assessments.
              </p>
              <button
                onClick={() => setIsDistModalOpen(true)}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
              >
                Distribute Test Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {distributions.map((dist) => (
                <div
                  key={dist.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400/60 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-black rounded-md">
                        {dist.subject?.name || 'Subject'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          dist.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {dist.isPublished ? 'Live for Students' : 'Draft / Unpublished'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">{dist.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                        <School size={13} className="text-slate-400" />
                        {dist.class?.name || 'All Classes'} {dist.section?.name ? `(${dist.section.name})` : ''}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1"><Clock size={12} /> Duration:</span>
                        <strong className="text-slate-900">{dist.duration} Minutes</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1"><Award size={12} /> Pass Mark:</span>
                        <strong className="text-slate-900">{dist.passingMark}%</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1"><Shuffle size={12} /> Shuffled:</span>
                        <strong className="text-slate-900">{dist.shuffleQuestions ? 'Enabled' : 'No'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openAnalyticsModal(dist.id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <BarChart3 size={13} /> Analytics & Marksheet Sync
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePublish(dist)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          dist.isPublished ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                        title={dist.isPublished ? 'Unpublish Test' : 'Publish Live'}
                      >
                        {dist.isPublished ? <X size={14} /> : <Check size={14} />}
                      </button>
                      <button
                        onClick={() => handleDeleteDistribution(dist.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Distribution"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUESTION BANK & IMPORTERS */}
      {activeTab === 'bank' && <QuestionBankManager profile={{ role: 1 }} />}

      {/* TAB 3: QUESTION BUNDLES */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {loadingGroups ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="animate-spin text-amber-500" size={32} />
              <p className="text-xs font-semibold">Loading question bundles...</p>
            </div>
          ) : questionGroups.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Layers className="mx-auto text-slate-300" size={40} />
              <h3 className="text-sm font-bold text-slate-700">No question bundles created</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Group questions into cohesive bundles (e.g. Midterm Test Bundle, Revision Mock) for easy distribution.
              </p>
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
              >
                Create Bundle Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionGroups.map((grp) => (
                <div
                  key={grp.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md">
                        {grp.groupCode}
                      </span>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md">
                        {grp.subject?.name || 'Subject'}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900">{grp.title}</h4>
                    {grp.description && <p className="text-xs text-slate-500">{grp.description}</p>}

                    <div className="pt-2 text-xs font-bold text-slate-600">
                      {Array.isArray(grp.questionIds) ? grp.questionIds.length : 0} Question(s) Linked
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setDistGroupId(String(grp.id))
                        setDistSubjectId(String(grp.subjectId))
                        setDistTitle(grp.title)
                        setIsDistModalOpen(true)
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition cursor-pointer"
                    >
                      Distribute As Exam
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LEGACY EXAMS */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Award size={18} className="text-amber-500" /> Active Scheduled Online Exams ({exams.length})
          </h3>

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

      {/* MODAL 1: DISTRIBUTE CBT TEST */}
      {isDistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Send size={18} className="text-amber-400" /> Distribute CBT Assessment to Classroom
              </div>
              <button
                onClick={() => setIsDistModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDistribution} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JSS1 Mathematics Midterm CBT Test"
                  value={distTitle}
                  onChange={(e) => setDistTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Classroom *</label>
                  <select
                    value={distClassId}
                    onChange={(e) => {
                      setDistClassId(e.target.value)
                      setDistSectionId('')
                    }}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section / Stream</label>
                  <select
                    value={distSectionId}
                    onChange={(e) => setDistSectionId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">All Sections</option>
                    {activeSectionsForClass.map((sec: any) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                  <select
                    value={distSubjectId}
                    onChange={(e) => setDistSubjectId(e.target.value)}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Question Bundle</label>
                  <select
                    value={distGroupId}
                    onChange={(e) => setDistGroupId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">Use Subject Question Bank</option>
                    {questionGroups
                      .filter((g) => !distSubjectId || g.subjectId === Number(distSubjectId))
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title} ({g.groupCode})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={distDuration}
                    onChange={(e) => setDistDuration(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passing Mark (%)</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={distPassingMark}
                    onChange={(e) => setDistPassingMark(parseInt(e.target.value, 10) || 50)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={distShuffle}
                    onChange={(e) => setDistShuffle(e.target.checked)}
                    className="rounded-md text-amber-500"
                  />
                  Shuffle Questions (Anti-Cheat)
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={distShowResults}
                    onChange={(e) => setDistShowResults(e.target.checked)}
                    className="rounded-md text-amber-500"
                  />
                  Show Instant Results on Submit
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={distPublished}
                    onChange={(e) => setDistPublished(e.target.checked)}
                    className="rounded-md text-emerald-500"
                  />
                  Publish Live Immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDistModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDist}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingDist ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Distribute Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ANALYTICS & MARKSHEET SCORE SYNC */}
      {analyticsDistId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <BarChart3 size={18} className="text-amber-400" /> CBT Test Performance Analytics & Marksheet Sync
              </div>
              <button
                onClick={() => { setAnalyticsDistId(null); setAnalyticsData(null) }}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loadingAnalytics ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <Loader2 className="animate-spin text-amber-500" size={32} />
                  <p className="text-xs font-semibold">Loading test analytics...</p>
                </div>
              ) : analyticsData ? (
                <>
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500">Total Enrolled</span>
                      <p className="text-xl font-black text-slate-900">{analyticsData.totalEnrolled}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500">Completed</span>
                      <p className="text-xl font-black text-emerald-600">{analyticsData.submittedCount}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500">Average Score</span>
                      <p className="text-xl font-black text-indigo-600">{analyticsData.averageScore}%</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500">Pass Rate</span>
                      <p className="text-xl font-black text-amber-600">{analyticsData.passRate}%</p>
                    </div>
                  </div>

                  {/* Marksheet Sync Action Card */}
                  <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <TrendingUp size={16} className="text-amber-600" />
                          1-Click CBT Marksheet Synchronization
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Sync all student CBT scores directly into their official academic term grade report card (<code className="text-slate-800">cbtMark</code>).
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-xl border border-slate-200 text-xs">
                          <span className="text-slate-500 font-bold text-[10px]">Max Scale:</span>
                          <select
                            value={maxScoreBase}
                            onChange={(e) => setMaxScoreBase(Number(e.target.value))}
                            className="font-bold text-slate-800 focus:outline-hidden"
                          >
                            <option value={40}>40 Marks (Standard CBT/CA)</option>
                            <option value={30}>30 Marks</option>
                            <option value={20}>20 Marks</option>
                            <option value={100}>100 Marks (Direct %)</option>
                          </select>
                        </div>

                        <button
                          onClick={handleSyncMarks}
                          disabled={isSyncingMarks || analyticsData.submittedCount === 0}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSyncingMarks ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                          Sync to Report Cards
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Student Submissions Roster */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Pupil Submissions Matrix ({analyticsData.students.length})
                    </h4>

                    <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200/80">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs font-bold">Student Name</TableHead>
                            <TableHead className="text-xs font-bold">Reg No</TableHead>
                            <TableHead className="text-xs font-bold">Status</TableHead>
                            <TableHead className="text-xs font-bold">CBT Score (%)</TableHead>
                            <TableHead className="text-xs font-bold">Submitted At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analyticsData.students.map((st) => (
                            <TableRow key={st.studentId}>
                              <TableCell className="font-bold text-slate-900 text-xs">
                                {st.studentName}
                              </TableCell>
                              <TableCell className="text-slate-500 text-xs font-mono">
                                {st.registerNo}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    st.isSubmitted
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {st.isSubmitted ? 'Submitted' : 'Pending'}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono font-black text-xs text-slate-800">
                                {st.totalMark !== null ? `${st.totalMark}%` : '-'}
                              </TableCell>
                              <TableCell className="text-slate-500 text-[11px]">
                                {st.submittedAt ? new Date(st.submittedAt).toLocaleDateString() : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
