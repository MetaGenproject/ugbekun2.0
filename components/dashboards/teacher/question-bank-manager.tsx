'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiSlice, endpoints } from '../../../lib/apiSlice'
import { HomeworkQuestionStudio, type HomeworkAllocation } from '@/components/dashboards/shared/homework-question-studio'
import {
  Search,
  Plus,
  Trash2,
  Check,
  FolderOpen,
  Folder,
  Edit3,
  Send,
  Loader2,
  AlertCircle,
  UploadCloud,
  Sparkles,
  FileText,
  HelpCircle,
  CheckCircle2,
  Layers,
  Filter,
  X,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  Clock,
  Calendar,
  Award,
  ChevronRight,
  ChevronLeft,
  Grid,
  List,
  FolderPlus,
  Users,
  Eye,
  Download,
  BarChart3,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface QuestionBankItem {
  id: number
  questionText: string
  questionType: string
  options: any
  correctOption: string | null
  marks: number
  subjectId: number
  classId: number | null
  subject?: {
    id: number
    name: string
    subjectCode?: string
  }
  class?: {
    id: number
    name: string
  } | null
  termName?: string | null
  topic?: string | null
  sourceType?: string | null
  difficulty?: string | null
  category?: string | null
  status?: string | null
}

interface OnlineExamItem {
  id: number
  title: string
  classId: number
  subjectId: number
  passingMark: number
  duration: number
  questions: any
  examDate: string | null
  createdAt: string
  class?: { id: number; name: string }
  subject?: { id: number; name: string }
  submissions?: Array<{ id: number; totalMark: number; createdAt: string }>
  startDate?: string | null
  endDate?: string | null
  shuffleQuestions?: boolean
  showResults?: boolean
}

interface QuestionBankManagerProps {
  profile?: any
  onImportToBuilder?: (questions: any[]) => void
  isAdmin?: boolean
}

function parseAikenClient(text?: string | null) {
  if (!text || typeof text !== 'string') return []
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const drafts: any[] = []
  let current: any = null

  const qNumRegex = /^(?:(?:question|q)\s*\d+[\s.:\-)]*|\d+[\s.:\-)])\s*(.*)/i
  const optRegex = /^(?:(?:\(|\[)?([a-eA-E])(?:\)|\]|\.|\:|\-)\s*)(.*)/
  const ansRegex = /^(?:ans(?:wer)?|correct(?:\s*option|\s*answer)?|key)\s*[:=\-]?\s*(?:option\s*)?(?:\(|\[)?([a-eA-E0-9]+)(?:\)|\])?/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check Answer: A or ANSWER: A or Key: A
    const ansMatch = line.match(ansRegex)
    if (ansMatch) {
      if (current && current.questionText && current.options.length >= 2) {
        current.correctOption = ansMatch[1].toUpperCase()
        drafts.push(current)
      }
      current = null
      continue
    }

    // Check Option: A. or A) or (A)
    const optMatch = line.match(optRegex)
    if (optMatch) {
      if (current) {
        current.options.push(optMatch[2].trim())
      }
      continue
    }

    // Question prompt line
    const qMatch = line.match(qNumRegex)
    const cleanPrompt = qMatch ? qMatch[1].trim() : line

    if (current) {
      if (current.options.length === 0) {
        current.questionText += ' ' + cleanPrompt
      } else {
        current = {
          questionText: cleanPrompt,
          questionType: 'mcq',
          options: [],
          correctOption: 'A',
          marks: 1.0,
        }
      }
    } else {
      current = {
        questionText: cleanPrompt,
        questionType: 'mcq',
        options: [],
        correctOption: 'A',
        marks: 1.0,
      }
    }
  }

  return drafts
}

function parseCsvClient(csvText?: string | null) {
  if (!csvText || typeof csvText !== 'string') return []
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const parseLine = (str: string) => {
    const result: string[] = []
    let cur = ''
    let insideQuote = false
    for (let i = 0; i < str.length; i++) {
      const c = str[i]
      if (c === '"') {
        if (insideQuote && str[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          insideQuote = !insideQuote
        }
      } else if (c === ',' && !insideQuote) {
        result.push(cur.trim())
        cur = ''
      } else {
        cur += c
      }
    }
    result.push(cur.trim())
    return result
  }

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''))
  const drafts: any[] = []

  const qIdx = headers.findIndex((h) => h.includes('question') || h === 'prompt' || h === 'text')
  const typeIdx = headers.findIndex((h) => h.includes('type'))
  const optAIdx = headers.findIndex((h) => h.includes('optiona') || h === 'a')
  const optBIdx = headers.findIndex((h) => h.includes('optionb') || h === 'b')
  const optCIdx = headers.findIndex((h) => h.includes('optionc') || h === 'c')
  const optDIdx = headers.findIndex((h) => h.includes('optiond') || h === 'd')
  const ansIdx = headers.findIndex((h) => h.includes('correct') || h.includes('answer') || h === 'ans')
  const marksIdx = headers.findIndex((h) => h.includes('mark') || h.includes('point') || h.includes('score'))

  if (qIdx === -1) return []

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i])
    if (!row[qIdx]) continue
    const options: string[] = []
    if (optAIdx !== -1 && row[optAIdx]) options.push(row[optAIdx])
    if (optBIdx !== -1 && row[optBIdx]) options.push(row[optBIdx])
    if (optCIdx !== -1 && row[optCIdx]) options.push(row[optCIdx])
    if (optDIdx !== -1 && row[optDIdx]) options.push(row[optDIdx])

    let correct = 'A'
    if (ansIdx !== -1 && row[ansIdx]) {
      const a = row[ansIdx].trim().toUpperCase()
      if (['A', 'B', 'C', 'D'].includes(a)) correct = a
    }

    drafts.push({
      questionText: row[qIdx],
      questionType: typeIdx !== -1 && row[typeIdx] ? row[typeIdx] : 'mcq',
      options: options.length >= 2 ? options : ['Option A', 'Option B'],
      correctOption: correct,
      marks: marksIdx !== -1 && !isNaN(Number(row[marksIdx])) ? Number(row[marksIdx]) : 1.0,
    })
  }

  return drafts
}

function parseJsonClient(raw: any) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const list = Array.isArray(parsed) ? parsed : parsed?.questions || parsed?.drafts || []
    if (!Array.isArray(list)) return []
    return list
      .map((item: any) => ({
        questionText: String(item.questionText || item.prompt || item.text || '').trim(),
        questionType: item.questionType || 'mcq',
        options: Array.isArray(item.options) ? item.options : ['Option A', 'Option B'],
        correctOption: String(item.correctOption || item.answer || 'A').toUpperCase(),
        marks: Number(item.marks) || 1.0,
      }))
      .filter((item: any) => item.questionText)
  } catch {
    return []
  }
}


function PaginationBar({
  page,
  pageSize,
  total,
  totalPages,
  noun,
  pageSizeOptions = [10, 20, 30, 50],
  onPage,
  onPageSize,
}: {
  page: number
  pageSize: number
  total: number
  totalPages: number
  noun: string
  pageSizeOptions?: number[]
  onPage: (page: number) => void
  onPageSize: (size: number) => void
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <span>Per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span>
          Showing <strong className="text-slate-900">{start}</strong>–<strong className="text-slate-900">{end}</strong> of{" "}
          <strong className="text-slate-900">{total}</strong> {noun}
        </span>
      </div>
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs transition"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <div className="px-3 py-1.5 text-xs font-black text-slate-800 bg-slate-100 rounded-xl">
          Page {page} of {totalPages}
        </div>
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs transition"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export function QuestionBankManager({ profile, onImportToBuilder, isAdmin }: QuestionBankManagerProps) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [onlineExams, setOnlineExams] = useState<OnlineExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingExams, setLoadingExams] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Subject Assignment Privileges Banner
  const [accessDeniedNotice, setAccessDeniedNotice] = useState<string | null>(null)

  // Performance Analytics & Marksheet Sync Modal State
  const [analyticsDistId, setAnalyticsDistId] = useState<number | null>(null)
  const [analyticsData, setAnalyticsData] = useState<any | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [isSyncingMarks, setIsSyncingMarks] = useState(false)
  const [maxScoreBase, setMaxScoreBase] = useState<number>(40)
  const [correctingStudentId, setCorrectingStudentId] = useState<number | null>(null)
  const [correctionScore, setCorrectionScore] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')
  const [isSavingCorrection, setIsSavingCorrection] = useState(false)

  const isAdminPortal = isAdmin === true || (
    isAdmin === undefined &&
    (Number(profile?.role) === 1 || Number(profile?.role) === 2 || Number(profile?.role) === 9) &&
    !profile?.teacherId &&
    !profile?.subjectAssignments &&
    !profile?.isSubjectTeacher &&
    !profile?.isFormTeacher
  )
  const bankListUrl = (queryString = "") => (isAdminPortal ? endpoints.admin.cbtQuestionBank(queryString || "?limit=5000") : endpoints.teacher.questionBank(queryString))
  const bankCreateUrl = () => (isAdminPortal ? endpoints.admin.cbtQuestionBank() : endpoints.teacher.questionBank())
  const bankItemUrl = (id: number) => (isAdminPortal ? endpoints.admin.cbtQuestionBankItem(id) : endpoints.teacher.questionBankItem(id))
  const bankImportUrl = isAdminPortal ? endpoints.admin.cbtQuestionBankImport : endpoints.teacher.questionBankImport
  const bankBulkUrl = isAdminPortal ? endpoints.admin.cbtQuestionBankBulk : endpoints.teacher.questionBankBulk
  const bankAiUrl = isAdminPortal ? endpoints.admin.cbtQuestionBankAiGenerate : endpoints.teacher.questionBankAiGenerate

  const allocations: HomeworkAllocation[] = useMemo(() => {
    const rows = Array.isArray(profile?.subjectAssignments) ? profile.subjectAssignments : []
    return rows.map((sa: any) => ({
      classId: sa.classId,
      className: sa.className,
      subjectId: sa.subjectId,
      subjectName: sa.subjectName,
      sectionName: sa.sectionName,
    }))
  }, [profile])

  // View tabs: 'studio' | 'folders' | 'pool' | 'assigned'
  const [activeTab, setActiveTab] = useState<'studio' | 'folders' | 'pool' | 'assigned'>('folders')
  const [selectedFolderSubjectId, setSelectedFolderSubjectId] = useState<number | null>(null)

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('All')
  const [selectedClassId, setSelectedClassId] = useState<string>('All')
  const [selectedTerm, setSelectedTerm] = useState<string>('All')
  const [folderSearchTerm, setFolderSearchTerm] = useState('')
  const [formTermName, setFormTermName] = useState('First Term')
  const [formTopic, setFormTopic] = useState('')
  const [importTermName, setImportTermName] = useState('First Term')

  // Available metadata
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string; subjectCode?: string }>>([])
  const [classesList, setClassesList] = useState<Array<{ id: number; name: string }>>([])

  // Selection Pool
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [isAssignTestModalOpen, setIsAssignTestModalOpen] = useState(false)

  // Assign to Class Form State
  const [editingOnlineExamId, setEditingOnlineExamId] = useState<number | null>(null)
  const [assignTitle, setAssignTitle] = useState('')
  const [assignSubjectId, setAssignSubjectId] = useState<number>(0)
  const [assignClassId, setAssignClassId] = useState<string>('')
  const [assignDuration, setAssignDuration] = useState<number | string>(30)
  const [assignPassingMark, setAssignPassingMark] = useState<number | string>(50)
  const [assignExamDate, setAssignExamDate] = useState<string>('')
  const [assignStartDate, setAssignStartDate] = useState('')
  const [assignEndDate, setAssignEndDate] = useState('')

  // Extend Sitting Deadline Modal State
  const [extendingExam, setExtendingExam] = useState<any | null>(null)
  const [extendStartDate, setExtendStartDate] = useState<string>('')
  const [extendEndDate, setExtendEndDate] = useState<string>('')
  const [isSubmittingExtension, setIsSubmittingExtension] = useState<boolean>(false)
  const [assignShuffle, setAssignShuffle] = useState(true)
  const [assignShowResults, setAssignShowResults] = useState(true)
  const [isPublishingExam, setIsPublishingExam] = useState(false)
  const [reviewDrafts, setReviewDrafts] = useState<any[]>([])
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewMeta, setReviewMeta] = useState<{ subjectId: number; classId: string; termName: string; sourceType: string; topic?: string }>({
    subjectId: 0,
    classId: '',
    termName: 'First Term',
    sourceType: 'UPLOAD',
  })
  const [isSavingDrafts, setIsSavingDrafts] = useState(false)
  const [selectedType, setSelectedType] = useState('All')

  // Pagination states
  const [folderPage, setFolderPage] = useState(1)
  const [folderPageSize, setFolderPageSize] = useState(12)
  const [questionPage, setQuestionPage] = useState(1)
  const [questionPageSize, setQuestionPageSize] = useState(20)

  // Single Question Form state
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<'mcq' | 'true_false'>('mcq')
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>([
    'Option A',
    'Option B',
    'Option C',
    'Option D',
  ])
  const [newQuestionCorrect, setNewQuestionCorrect] = useState('A')
  const [newQuestionMarks, setNewQuestionMarks] = useState(2.0)
  const [formSubjectId, setFormSubjectId] = useState<number>(0)
  const [formClassId, setFormClassId] = useState<string>('')
  const [formCategory, setFormCategory] = useState('')
  const [isSavingQuestion, setIsSavingQuestion] = useState(false)

  // Bulk Import Form state
  const [importFormat, setImportFormat] = useState<'aiken' | 'csv' | 'json'>('aiken')
  const [importText, setImportText] = useState('')
  const [importSubjectId, setImportSubjectId] = useState<number>(0)
  const [importClassId, setImportClassId] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [uploadedCsvFileName, setUploadedCsvFileName] = useState<string | null>(null)

  // AI Question Generator Form state
  const [aiTopic, setAiTopic] = useState('')
  const [aiSubjectId, setAiSubjectId] = useState<number>(0)
  const [aiClassLevel, setAiClassLevel] = useState('Junior Secondary (JSS)')
  const [aiCount, setAiCount] = useState(5)
  const [aiQuestionType, setAiQuestionType] = useState<'mcq' | 'true_false'>('mcq')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  const showNotification = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  // Fetch subjects & classes
  useEffect(() => {
    const loadSubjectsAndClasses = async () => {
      try {
        if (isAdminPortal) {
          const [subRes, clsRes] = await Promise.all([
            apiSlice.get<{ success: boolean; subjects: any[] }>(endpoints.admin.subjects),
            apiSlice.get<{ success: boolean; classes: any[] }>(endpoints.admin.classesSections),
          ])
          if (subRes.success && subRes.subjects) {
            setSubjects(subRes.subjects)
            if (subRes.subjects.length > 0) {
              setFormSubjectId(subRes.subjects[0].id)
              setImportSubjectId(subRes.subjects[0].id)
              setAiSubjectId(subRes.subjects[0].id)
              setAssignSubjectId(subRes.subjects[0].id)
            }
          }
          if (clsRes.success && clsRes.classes) {
            setClassesList(clsRes.classes)
            if (clsRes.classes.length > 0) {
              setAssignClassId(String(clsRes.classes[0].id))
              setFormClassId(String(clsRes.classes[0].id))
              setImportClassId(String(clsRes.classes[0].id))
            }
          }
        } else {
          // Strictly fetch teacher's assigned subjects and classes
          const [subRes, clsRes] = await Promise.all([
            apiSlice.get<{ success: boolean; subjects?: any[]; assignedSubjects?: any[] }>(endpoints.teacher.subjects).catch((err: any) => {
              if (err?.status === 403 || String(err?.message || '').toLowerCase().includes('forbidden') || String(err?.message || '').toLowerCase().includes('privilege')) {
                setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
              }
              return { success: false, subjects: [], assignedSubjects: [] }
            }),
            apiSlice.get<{ success: boolean; classes?: any[]; assignedClasses?: any[] }>(endpoints.teacher.roster).catch((err: any) => {
              if (err?.status === 403 || String(err?.message || '').toLowerCase().includes('forbidden') || String(err?.message || '').toLowerCase().includes('privilege')) {
                setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
              }
              return { success: false, classes: [], assignedClasses: [] }
            }),
          ])

          const rawTeacherSubjects = (subRes.assignedSubjects && subRes.assignedSubjects.length > 0)
            ? subRes.assignedSubjects.map((s: any) => ({
                id: s.subjectId || s.id,
                name: s.subjectName || s.name,
                subjectCode: s.subjectCode || s.code || ''
              }))
            : (Array.isArray(profile?.subjectAssignments) && profile.subjectAssignments.length > 0)
            ? profile.subjectAssignments.map((s: any) => ({
                id: s.subjectId,
                name: s.subjectName,
                subjectCode: s.subjectCode || ''
              }))
            : []

          const uniqueTeacherSubjects: Array<{ id: number; name: string; subjectCode?: string }> = Array.from(new Map(rawTeacherSubjects.map((s: any) => [s.id, s])).values()) as any
          setSubjects(uniqueTeacherSubjects)

          const rawTeacherClasses = (clsRes.assignedClasses && clsRes.assignedClasses.length > 0)
            ? clsRes.assignedClasses
            : (clsRes.classes && clsRes.classes.length > 0)
            ? clsRes.classes
            : (Array.isArray(profile?.subjectAssignments) && profile.subjectAssignments.length > 0)
            ? profile.subjectAssignments.map((s: any) => ({ id: s.classId, name: s.className }))
            : []

          const uniqueTeacherClasses: Array<{ id: number; name: string }> = Array.from(new Map(rawTeacherClasses.map((c: any) => [c.id, c])).values()) as any
          setClassesList(uniqueTeacherClasses)

          if (uniqueTeacherSubjects.length === 0) {
            setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
          } else {
            setAccessDeniedNotice(null)
            setFormSubjectId(uniqueTeacherSubjects[0].id)
            setImportSubjectId(uniqueTeacherSubjects[0].id)
            setAiSubjectId(uniqueTeacherSubjects[0].id)
            setAssignSubjectId(uniqueTeacherSubjects[0].id)
          }

          if (uniqueTeacherClasses.length > 0) {
            setAssignClassId(String(uniqueTeacherClasses[0].id))
            setFormClassId(String(uniqueTeacherClasses[0].id))
            setImportClassId(String(uniqueTeacherClasses[0].id))
          }
        }
      } catch (e: any) {
        if (e?.status === 403 || String(e?.message || '').toLowerCase().includes('forbidden') || String(e?.message || '').toLowerCase().includes('privilege')) {
          setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
        }
        console.error('Failed to load subjects or classes', e)
      }
    }
    loadSubjectsAndClasses()
  }, [isAdminPortal, profile])

  const fetchQuestions = async (queryOverrides?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; items: QuestionBankItem[]; message?: string }>(
        bankListUrl(queryOverrides)
      )
      if (res.success && res.items) {
        setQuestions(res.items)
      } else {
        if (String(res.message || '').toLowerCase().includes('forbidden') || String(res.message || '').toLowerCase().includes('privilege')) {
          setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
        } else {
          setError('Failed to load Question Bank items.')
        }
      }
    } catch (err: any) {
      if (err?.status === 403 || String(err?.message || '').toLowerCase().includes('forbidden') || String(err?.message || '').toLowerCase().includes('privilege')) {
        setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
      } else {
        setError(err instanceof Error ? err.message : 'Error fetching Question Bank.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchOnlineExams = async () => {
    setLoadingExams(true)
    try {
      if (isAdminPortal) {
        const res = await apiSlice.get<{ success: boolean; distributions?: any[] }>(
          endpoints.admin.cbtDistributions()
        )
        if (res.success && Array.isArray(res.distributions)) {
          setOnlineExams(
            res.distributions.map((d) => ({
              id: d.id,
              title: d.title,
              classId: d.classId,
              subjectId: d.subjectId,
              passingMark: d.passingMark,
              duration: d.duration,
              questions: Array.isArray(d.group?.questionIds) ? d.group.questionIds : [],
              examDate: d.startDate || null,
              createdAt: d.createdAt,
              class: d.class,
              subject: d.subject,
              submissions: [],
              startDate: d.startDate,
              endDate: d.endDate,
              shuffleQuestions: d.shuffleQuestions,
              showResults: d.showResults,
            }))
          )
        }
      } else {
        const res = await apiSlice.get<{ success: boolean; exams: OnlineExamItem[] }>(
          endpoints.teacher.onlineExams
        )
        if (res.success && res.exams) {
          setOnlineExams(res.exams)
        }
      }
    } catch (err: any) {
      if (err?.status === 403 || String(err?.message || '').toLowerCase().includes('forbidden') || String(err?.message || '').toLowerCase().includes('privilege')) {
        setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
      }
      console.error('Error fetching online exams:', err)
    } finally {
      setLoadingExams(false)
    }
  }

  // Open Performance Analytics Modal
  const openAnalyticsModal = async (distId: number) => {
    setAnalyticsDistId(distId)
    setLoadingAnalytics(true)
    try {
      const url = isAdminPortal
        ? endpoints.admin.cbtDistributionAnalytics(distId)
        : endpoints.teacher.cbtDistributionAnalytics(distId)
      const res = await apiSlice.get<{ success: boolean; message?: string } & any>(url)
      if (res.success) {
        setAnalyticsData(res)
      } else {
        alert(res.message || 'Failed to load CBT analytics.')
      }
    } catch (err: any) {
      if (err?.status === 403 || String(err?.message || '').toLowerCase().includes('forbidden') || String(err?.message || '').toLowerCase().includes('privilege')) {
        setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
      }
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
      const url = isAdminPortal
        ? endpoints.admin.cbtDistributionSyncMarks(analyticsDistId)
        : endpoints.teacher.cbtDistributionSyncMarks(analyticsDistId)
      const res = await apiSlice.post<{ success: boolean; message: string; syncCount: number }>(
        url,
        { maxScoreBase }
      )
      if (res.success) {
        showNotification(res.message || 'CBT scores recorded on report cards.')
        await openAnalyticsModal(analyticsDistId)
      } else {
        alert(res.message || 'Failed to sync marks.')
      }
    } catch (err: any) {
      if (err?.status === 403 || String(err?.message || '').toLowerCase().includes('forbidden') || String(err?.message || '').toLowerCase().includes('privilege')) {
        setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
      } else {
        alert(err instanceof Error ? err.message : 'Failed to sync marks to report cards.')
      }
    } finally {
      setIsSyncingMarks(false)
    }
  }

  const handleOverrideCbtMark = async (studentId: number) => {
    if (!analyticsDistId || !isAdminPortal) return
    if (!correctionScore.trim() || !correctionReason.trim()) {
      alert('Enter the corrected report-card CBT score and a reason.')
      return
    }
    setIsSavingCorrection(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.cbtDistributionOverrideMark(analyticsDistId),
        {
          studentId,
          cbtMark: Number(correctionScore),
          reason: correctionReason.trim(),
          maxScoreBase,
        }
      )
      if (res.success) {
        showNotification(res.message || 'CBT score corrected on the report card.')
        setCorrectingStudentId(null)
        setCorrectionScore('')
        setCorrectionReason('')
        await openAnalyticsModal(analyticsDistId)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to correct CBT score.')
    } finally {
      setIsSavingCorrection(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
    fetchOnlineExams()
  }, [])

  // Organize Questions by Subject into structured Folders
  const subjectFolders = useMemo(() => {
    const map = new Map<number, {
      subjectId: number
      subjectName: string
      subjectCode: string
      questionsCount: number
      classes: Set<string>
      mcqCount: number
      tfCount: number
      theoryCount: number
      totalMarks: number
      colorStyle: { bg: string; border: string; text: string; lightBg: string; badge: string }
    }>()

    const colorPresets = [
      { bg: 'bg-blue-600', border: 'border-blue-200', text: 'text-blue-700', lightBg: 'bg-blue-50/80', badge: 'bg-blue-100 text-blue-800' },
      { bg: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-700', lightBg: 'bg-emerald-50/80', badge: 'bg-emerald-100 text-emerald-800' },
      { bg: 'bg-purple-600', border: 'border-purple-200', text: 'text-purple-700', lightBg: 'bg-purple-50/80', badge: 'bg-purple-100 text-purple-800' },
      { bg: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700', lightBg: 'bg-amber-50/80', badge: 'bg-amber-100 text-amber-800' },
      { bg: 'bg-rose-500', border: 'border-rose-200', text: 'text-rose-700', lightBg: 'bg-rose-50/80', badge: 'bg-rose-100 text-rose-800' },
      { bg: 'bg-cyan-600', border: 'border-cyan-200', text: 'text-cyan-700', lightBg: 'bg-cyan-50/80', badge: 'bg-cyan-100 text-cyan-800' },
      { bg: 'bg-indigo-600', border: 'border-indigo-200', text: 'text-indigo-700', lightBg: 'bg-indigo-50/80', badge: 'bg-indigo-100 text-indigo-800' },
      { bg: 'bg-teal-600', border: 'border-teal-200', text: 'text-teal-700', lightBg: 'bg-teal-50/80', badge: 'bg-teal-100 text-teal-800' },
    ]

    // Pre-populate with all official subjects
    subjects.forEach((s, idx) => {
      map.set(s.id, {
        subjectId: s.id,
        subjectName: s.name,
        subjectCode: s.subjectCode || s.name.substring(0, 3).toUpperCase(),
        questionsCount: 0,
        classes: new Set<string>(),
        mcqCount: 0,
        tfCount: 0,
        theoryCount: 0,
        totalMarks: 0,
        colorStyle: colorPresets[idx % colorPresets.length],
      })
    })

    // Aggregate questions
    questions.forEach((q) => {
      let folder = map.get(q.subjectId)
      if (!folder) {
        folder = {
          subjectId: q.subjectId,
          subjectName: q.subject?.name || `Subject #${q.subjectId}`,
          subjectCode: q.subject?.subjectCode || 'SUB',
          questionsCount: 0,
          classes: new Set<string>(),
          mcqCount: 0,
          tfCount: 0,
          theoryCount: 0,
          totalMarks: 0,
          colorStyle: colorPresets[map.size % colorPresets.length],
        }
        map.set(q.subjectId, folder)
      }
      if (q.class?.name) folder.classes.add(q.class.name)

      // When class filter is applied on Folders view, filter item counts for that specific class
      if (selectedClassId !== 'All' && q.classId !== Number(selectedClassId)) {
        return
      }

      folder.questionsCount += 1
      folder.totalMarks += Number(q.marks || 1)
      const qType = String(q.questionType || '').toLowerCase()
      if (qType === 'mcq') folder.mcqCount += 1
      else if (qType === 'true_false' || qType === 'tf') folder.tfCount += 1
      else folder.theoryCount += 1
    })

    return Array.from(map.values())
  }, [subjects, questions, selectedClassId])

  // Filtered folder list
  const filteredFolders = useMemo(() => {
    return subjectFolders.filter((f) => {
      const matchSearch = f.subjectName.toLowerCase().includes(folderSearchTerm.toLowerCase()) ||
        f.subjectCode.toLowerCase().includes(folderSearchTerm.toLowerCase())
      return matchSearch
    })
  }, [subjectFolders, folderSearchTerm])

  const totalFolderPages = Math.max(1, Math.ceil(filteredFolders.length / folderPageSize))
  const paginatedFolders = useMemo(() => {
    const start = (folderPage - 1) * folderPageSize
    return filteredFolders.slice(start, start + folderPageSize)
  }, [filteredFolders, folderPage, folderPageSize])

  useEffect(() => {
    setFolderPage(1)
  }, [folderSearchTerm, selectedClassId])

  useEffect(() => {
    if (folderPage > totalFolderPages) {
      setFolderPage(totalFolderPages)
    }
  }, [folderPage, totalFolderPages])

  // Selected folder data
  const currentFolder = useMemo(() => {
    if (!selectedFolderSubjectId) return null
    return subjectFolders.find((f) => f.subjectId === selectedFolderSubjectId) || null
  }, [subjectFolders, selectedFolderSubjectId])

  // Filtered questions in the active folder or general pool
  const folderQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesFolder = selectedFolderSubjectId ? q.subjectId === selectedFolderSubjectId : true
      const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = selectedSubjectId === 'All' || q.subjectId === Number(selectedSubjectId)
      const matchesClass = selectedClassId === 'All' || q.classId === Number(selectedClassId)
      const matchesTerm = selectedTerm === 'All' || q.termName === selectedTerm
      const matchesType = selectedType === 'All' || q.questionType === selectedType
      return matchesFolder && matchesSearch && matchesSubject && matchesClass && matchesTerm && matchesType
    })
  }, [questions, selectedFolderSubjectId, searchTerm, selectedSubjectId, selectedClassId, selectedTerm, selectedType])

  const totalQuestionPages = Math.max(1, Math.ceil(folderQuestions.length / questionPageSize))
  const paginatedQuestions = useMemo(() => {
    const start = (questionPage - 1) * questionPageSize
    return folderQuestions.slice(start, start + questionPageSize)
  }, [folderQuestions, questionPage, questionPageSize])

  useEffect(() => {
    setQuestionPage(1)
  }, [searchTerm, selectedSubjectId, selectedClassId, selectedTerm, selectedType, selectedFolderSubjectId, activeTab])

  useEffect(() => {
    if (questionPage > totalQuestionPages) {
      setQuestionPage(totalQuestionPages)
    }
  }, [questionPage, totalQuestionPages])

  // Handle Question Selection for Pool
  const toggleSelectQuestion = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAllFolderQuestions = () => {
    const currentFolderIds = folderQuestions.map((q) => q.id)
    const allSelected = currentFolderIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentFolderIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentFolderIds])))
    }
  }

  // Selected Questions Payload
  const selectedQuestionsObjects = useMemo(() => {
    return questions.filter((q) => selectedIds.includes(q.id))
  }, [questions, selectedIds])

  const totalSelectedMarks = useMemo(() => {
    return selectedQuestionsObjects.reduce((acc, q) => acc + Number(q.marks || 1), 0)
  }, [selectedQuestionsObjects])

  const toLocalInput = (iso?: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  // Open Assign Modal with selected questions pre-filled
  const handleOpenAssignModal = () => {
    setEditingOnlineExamId(null)
    const approvedSelected = selectedQuestionsObjects.filter((q) => (q.status || 'APPROVED') === 'APPROVED')
    if (approvedSelected.length === 0) {
      alert('Select approved Question Bank items. Review AI/scanned/uploaded drafts and save them first.')
      return
    }
    if (approvedSelected.length !== selectedIds.length) {
      setSelectedIds(approvedSelected.map((q) => q.id))
    }
    const defaultSubject = currentFolder ? currentFolder.subjectId : (approvedSelected[0]?.subjectId || formSubjectId)
    const subjectObj = subjects.find(s => s.id === defaultSubject)
    setAssignSubjectId(defaultSubject)
    setAssignTitle(`${subjectObj?.name || 'Class'} CBT Assessment`)
    setIsAssignTestModalOpen(true)
  }

  // Open Extend Sitting Deadline Modal
  const handleOpenExtendModal = (exam: any) => {
    setExtendingExam(exam)
    const now = new Date()
    setExtendStartDate(toLocalInput(exam.startDate || exam.examDate || now.toISOString()))
    const currentEnd = exam.endDate ? new Date(exam.endDate) : null
    const baseDate = currentEnd && currentEnd > now ? currentEnd : now
    const defaultEnd = new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000)
    setExtendEndDate(toLocalInput(defaultEnd.toISOString()))
  }

  const applyQuickExtend = (amount: number, unit: 'hours' | 'days') => {
    const now = new Date()
    const ms = amount * (unit === 'days' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000)
    const currentEnd = extendingExam?.endDate ? new Date(extendingExam.endDate) : now
    const startPoint = currentEnd > now ? currentEnd : now
    const target = new Date(startPoint.getTime() + ms)
    setExtendEndDate(toLocalInput(target.toISOString()))
  }

  const handleSubmitExtend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!extendingExam) return
    if (!extendEndDate) {
      alert('Please specify the new closing date & time.')
      return
    }

    setIsSubmittingExtension(true)
    try {
      const payload: { startDate?: string; endDate: string } = {
        endDate: new Date(extendEndDate).toISOString(),
      }
      if (extendStartDate) {
        payload.startDate = new Date(extendStartDate).toISOString()
      }

      let res: { success: boolean; message?: string }
      if (isAdminPortal) {
        res = await apiSlice.post<{ success: boolean; message?: string }>(
          endpoints.admin.rescheduleCbtDistribution(extendingExam.id),
          payload
        )
      } else {
        res = await apiSlice.post<{ success: boolean; message?: string }>(
          endpoints.teacher.extendCbtDistribution(extendingExam.id),
          payload
        )
      }

      if (res.success) {
        showNotification(res.message || 'CBT sitting window successfully extended!')
        setExtendingExam(null)
        fetchOnlineExams()
      } else {
        alert(res.message || 'Failed to extend assessment deadline.')
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to extend assessment date.')
    } finally {
      setIsSubmittingExtension(false)
    }
  }

  // Open Edit Modal for an already distributed assessment
  const handleOpenEditOnlineExam = (exam: any) => {
    setEditingOnlineExamId(exam.id)
    setAssignTitle(exam.title || '')
    setAssignSubjectId(exam.subjectId || (subjects[0]?.id ?? 0))
    setAssignClassId(exam.classId ? String(exam.classId) : (classesList[0]?.id ? String(classesList[0].id) : ''))
    setAssignDuration(exam.duration || 30)
    setAssignPassingMark(exam.passingMark || 50)
    setAssignStartDate(toLocalInput(exam.startDate || exam.examDate))
    setAssignEndDate(toLocalInput(exam.endDate))
    setAssignExamDate(exam.examDate ? String(exam.examDate).slice(0, 10) : '')
    setAssignShuffle(exam.shuffleQuestions ?? true)
    setAssignShowResults(exam.showResults ?? true)
    setIsAssignTestModalOpen(true)
  }

  // Submit and Distribute CBT Assessment to Class
  const handlePublishCbtAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignTitle.trim() || !assignClassId || !assignSubjectId) {
      alert('Assessment Title, Class, and Subject are required.')
      return
    }

    if (!editingOnlineExamId && selectedQuestionsObjects.length === 0) {
      alert('No questions collected in this assessment.')
      return
    }

    setIsPublishingExam(true)
    try {
      const formattedQuestions = selectedQuestionsObjects.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        correctOption: q.correctOption,
        marks: q.marks,
      }))

      const payload: any = {
        title: assignTitle.trim(),
        classId: Number(assignClassId),
        subjectId: Number(assignSubjectId),
        passingMark: Number(assignPassingMark) || 50,
        duration: Number(assignDuration) || 30,
        startDate: assignStartDate ? new Date(assignStartDate).toISOString() : (assignExamDate ? new Date(assignExamDate).toISOString() : new Date().toISOString()),
        endDate: assignEndDate ? new Date(assignEndDate).toISOString() : null,
        examDate: assignStartDate ? new Date(assignStartDate).toISOString() : (assignExamDate ? new Date(assignExamDate).toISOString() : new Date().toISOString()),
        shuffleQuestions: assignShuffle,
        showResults: assignShowResults,
        isPublished: true,
      }

      if (selectedQuestionsObjects.length > 0) {
        payload.questionBankIds = selectedQuestionsObjects.filter((q) => (q.status || 'APPROVED') === 'APPROVED').map((q) => q.id)
        payload.questions = formattedQuestions
      }

      if (payload.endDate && payload.startDate && new Date(payload.endDate) <= new Date(payload.startDate)) {
        alert('Attempt period must close after it opens.')
        setIsPublishingExam(false)
        return
      }

      let res: { success: boolean; exam?: any; message?: string }
      if (editingOnlineExamId) {
        if (isAdminPortal) {
          res = await apiSlice.post<{ success: boolean; exam: any; message?: string }>(
            endpoints.admin.cbtDistributions(),
            { id: editingOnlineExamId, ...payload }
          )
        } else {
          res = await apiSlice.put<{ success: boolean; exam: any; message?: string }>(
            `${endpoints.teacher.onlineExams}/${editingOnlineExamId}`,
            payload
          )
        }
      } else {
        res = await apiSlice.post<{ success: boolean; exam: any; message?: string }>(
          isAdminPortal ? endpoints.admin.cbtDistributions() : endpoints.teacher.onlineExams,
          payload
        )
      }

      if (res.success) {
        showNotification(res.message || (editingOnlineExamId ? 'CBT Assessment successfully updated!' : 'CBT Assessment successfully distributed to classroom!'))
        setIsAssignTestModalOpen(false)
        setEditingOnlineExamId(null)
        setSelectedIds([])
        fetchOnlineExams()
        setActiveTab('assigned')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish CBT test.')
    } finally {
      setIsPublishingExam(false)
    }
  }

  // Delete Distributed Exam
  const handleDeleteOnlineExam = async (id: number) => {
    if (!confirm('Are you sure you want to delete this CBT assessment?')) return
    try {
      const deleteUrl = isAdminPortal ? `${endpoints.admin.cbtDistributions()}/${id}` : `${endpoints.teacher.onlineExams}/${id}`
      const res = await apiSlice.delete<{ success: boolean }>(deleteUrl)
      if (res.success) {
        setOnlineExams((prev) => prev.filter((ex) => ex.id !== id))
        showNotification('CBT Assessment deleted.')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete assessment.')
    }
  }

  // Handle Single Question Creation
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestionText.trim() || !formSubjectId || !formClassId) {
      alert('Question text, class, and subject are required so the item can be classified.')
      return
    }

    setIsSavingQuestion(true)
    try {
      const opts = newQuestionType === 'true_false' ? ['True', 'False'] : newQuestionOptions.filter(o => o.trim().length > 0)

      const payload = {
        questionText: newQuestionText.trim(),
        questionType: newQuestionType,
        options: opts,
        correctOption: newQuestionCorrect,
        marks: Number(newQuestionMarks) || 1.0,
        subjectId: formSubjectId,
        classId: Number(formClassId),
        termName: formTermName,
        topic: formTopic.trim() || null,
        sourceType: 'MANUAL',
        category: formCategory.trim() || null,
      }

      const res = await apiSlice.post<{ success: boolean; item: QuestionBankItem }>(
        bankCreateUrl(),
        payload
      )

      if (res.success && res.item) {
        setQuestions([res.item, ...questions])
        setIsAddModalOpen(false)
        setNewQuestionText('')
        setNewQuestionOptions(['Option A', 'Option B', 'Option C', 'Option D'])
        setFormCategory('')
        showNotification('Question created and added to Subject Folder!')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create question.')
    } finally {
      setIsSavingQuestion(false)
    }
  }

  // Handle Bulk Import
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importText.trim() || !importSubjectId || !importClassId) {
      showNotification('Import data, class, and subject are required so questions stay classified.')
      return
    }

    setIsImporting(true)
    try {
      // 1. Instant client-side parsing (0ms latency, zero network dependency, immune to Failed to fetch)
      let clientDrafts: any[] = []
      if (importFormat === 'aiken') {
        clientDrafts = parseAikenClient(importText)
      } else if (importFormat === 'csv') {
        clientDrafts = parseCsvClient(importText)
      } else if (importFormat === 'json') {
        clientDrafts = parseJsonClient(importText)
      }

      if (clientDrafts.length > 0) {
        setReviewMeta({
          subjectId: importSubjectId,
          classId: importClassId,
          termName: importTermName,
          sourceType: 'UPLOAD',
        })
        setReviewDrafts(clientDrafts)
        setIsImportModalOpen(false)
        setIsReviewModalOpen(true)
        showNotification(`Parsed ${clientDrafts.length} question(s) successfully. Review and edit before saving.`)
        return
      }

      // 2. Graceful server-side fallback if client-side parse yielded 0 items
      const res = await apiSlice.post<{ success: boolean; drafts?: any[]; count: number; message: string }>(
        bankImportUrl,
        {
          format: importFormat,
          data: importText,
          subjectId: importSubjectId,
          classId: Number(importClassId),
          termName: importTermName,
          sourceType: 'UPLOAD',
        }
      )

      if (res.success && Array.isArray(res.drafts) && res.drafts.length) {
        setReviewMeta({
          subjectId: importSubjectId,
          classId: importClassId,
          termName: importTermName,
          sourceType: 'UPLOAD',
        })
        setReviewDrafts(res.drafts)
        setIsImportModalOpen(false)
        setIsReviewModalOpen(true)
        showNotification(res.message || 'Review the uploaded questions before saving.')
      } else if (res.success) {
        showNotification(res.message || 'Questions imported.')
        setIsImportModalOpen(false)
        setImportText('')
        fetchQuestions()
      } else {
        showNotification('No valid questions could be parsed. Check question format (options A, B, C and Answer key).')
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to import questions. Please check format syntax.')
    } finally {
      setIsImporting(false)
    }
  }

  // Handle AI Question Generation
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiTopic.trim() || !aiSubjectId || !formClassId) {
      alert('Topic, subject, and class are required so generated questions stay classified.')
      return
    }

    setIsGeneratingAi(true)
    try {
      const res = await apiSlice.post<{ success: boolean; drafts?: any[]; questions?: any[]; message: string }>(
        bankAiUrl,
        {
          subjectId: aiSubjectId,
          classId: Number(formClassId),
          topic: aiTopic.trim(),
          classLevel: aiClassLevel,
          count: aiCount,
          questionType: aiQuestionType,
          termName: formTermName,
        }
      )

      const drafts = res.drafts || res.questions || []
      if (res.success && drafts.length) {
        setReviewMeta({
          subjectId: aiSubjectId,
          classId: formClassId,
          termName: formTermName,
          sourceType: 'AI',
          topic: aiTopic.trim(),
        })
        setReviewDrafts(drafts)
        setIsAiModalOpen(false)
        setIsReviewModalOpen(true)
        showNotification(res.message || 'Review the AI drafts before saving them to the Question Bank.')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate AI questions.')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const updateReviewDraft = (idx: number, patch: Record<string, any>) => {
    setReviewDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }

  const handleSaveReviewedDrafts = async () => {
    const usable = reviewDrafts.filter((q) => String(q.questionText || '').trim())
    if (!usable.length || !reviewMeta.subjectId) {
      showNotification('Edit at least one question before saving.')
      return
    }
    setIsSavingDrafts(true)
    try {
      const res = await apiSlice.post<{ success: boolean; count: number; message: string }>(bankBulkUrl, {
        subjectId: reviewMeta.subjectId,
        classId: reviewMeta.classId ? Number(reviewMeta.classId) : undefined,
        termName: reviewMeta.termName,
        topic: reviewMeta.topic,
        sourceType: reviewMeta.sourceType,
        questions: usable,
      })
      if (res.success) {
        showNotification(res.message || 'Questions saved to the Question Bank and approved for assignment.')
        setIsReviewModalOpen(false)
        setReviewDrafts([])
        setImportText('')
        setAiTopic('')
        fetchQuestions()
      } else {
        showNotification(res.message || 'Failed to save questions to the bank.')
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to save reviewed questions.')
    } finally {
      setIsSavingDrafts(false)
    }
  }

  // Handle Delete Question
  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question from the Question Bank?')) return
    try {
      const res = await apiSlice.delete<{ success: boolean }>(bankItemUrl(id))
      if (res.success) {
        setQuestions(questions.filter((q) => q.id !== id))
        setSelectedIds((prev) => prev.filter((item) => item !== id))
        showNotification('Question deleted.')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete question.')
    }
  }

  const loadSampleAiken = () => {
    setImportText(`What is the primary currency of Nigeria?
A. US Dollar
B. Nigerian Naira
C. British Pound
D. Euro
ANSWER: B

Which organ in the human body is responsible for pumping blood?
A. Lungs
B. Brain
C. Heart
D. Liver
ANSWER: C

The process by which green plants make their food using sunlight is called photosynthesis.
A. True
B. False
ANSWER: A`)
  }

  const downloadQuestionsCsvTemplate = () => {
    const csvContent =
      '\uFEFF' +
      'question_text,question_type,option_a,option_b,option_c,option_d,correct_option,marks,explanation,topic\n' +
      '"What is the primary function of the red blood cells?",mcq,"Produce antibodies","Carry oxygen throughout the body","Digest food nutrients","Filter waste in kidneys",B,2.0,"Red blood cells contain haemoglobin which binds and carries oxygen.","Circulatory System"\n' +
      '"Water boils at 100 degrees Celsius under standard atmospheric pressure.",true_false,"True","False","","",A,1.0,"At 1 atm pure water boils at exactly 100°C.","States of Matter"\n' +
      '"Solve for x: 3x + 15 = 45",mcq,"5","10","15","20",B,2.0,"3x = 45 - 15 = 30 so x = 10.","Linear Equations"\n' +
      '"Which Nigerian city is historically renowned as the Coal City?",mcq,"Lagos","Kano","Enugu","Ibadan",C,1.0,"Enugu is known as the Coal City due to its rich coal mining heritage.","Social Studies"\n' +
      '"Photosynthesis takes place in which plant cell organelle?",mcq,"Mitochondria","Ribosome","Chloroplast","Nucleus",C,2.0,"Chloroplasts contain chlorophyll and carry out photosynthesis.","Plant Biology"'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'ugbekun_questions_import_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showNotification('Official questions CSV template downloaded.')
  }

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        setImportText(content)
        setImportFormat('csv')
        showNotification(`Loaded ${file.name} successfully.`)
      }
    }
    reader.readAsText(file)
  }

  const loadSampleCsv = () => {
    setImportText(`question_text,question_type,option_a,option_b,option_c,option_d,correct_option,marks,explanation,topic
"What is the primary function of the red blood cells?",mcq,"Produce antibodies","Carry oxygen throughout the body","Digest food nutrients","Filter waste in kidneys",B,2.0,"Red blood cells contain haemoglobin which binds and carries oxygen.","Circulatory System"
"Water boils at 100 degrees Celsius under standard atmospheric pressure.",true_false,"True","False","","",A,1.0,"At 1 atm pure water boils at exactly 100°C.","States of Matter"
"Solve for x: 3x + 15 = 45",mcq,"5","10","15","20",B,2.0,"3x = 45 - 15 = 30 so x = 10.","Linear Equations"
"Which Nigerian city is historically renowned as the Coal City?",mcq,"Lagos","Kano","Enugu","Ibadan",C,1.0,"Enugu is known as the Coal City due to its rich coal mining heritage.","Social Studies"`)
  }

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Subject Assignment Privilege Notice Banner */}
      {accessDeniedNotice && (
        <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/95 p-5 sm:p-6 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-800 shrink-0 mt-0.5">
            <AlertCircle size={24} className="text-amber-800" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-black text-amber-950 uppercase tracking-wide">
              Subject Assignment Privileges Notice
            </h4>
            <p className="text-xs sm:text-sm text-amber-900 font-bold leading-relaxed">
              {accessDeniedNotice}
            </p>
            <p className="text-[11px] text-amber-700 font-medium">
              Only teachers actively assigned to subjects can create or upload CBT questions and assignments for their assigned subjects. Please contact your school administrator to configure your subject allocations.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
              {isAdminPortal ? 'School Admin Question Bank' : 'Teacher Assessment Suite'}
            </span>
            <span className="text-xs text-slate-400 font-bold">•</span>
            <span className="text-xs text-slate-500 font-semibold">{questions.length} Questions in Bank</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="text-amber-500" size={24} />
            CBT Examinations & Question Vault
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create by typing, upload, scan, or AI. Review AI/scanned items, then assign with a sitting window, shuffle, and result-release setting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadQuestionsCsvTemplate}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-300/80 text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download official questions spreadsheet format for offline bulk preparation"
          >
            <Download size={15} className="text-emerald-600" /> Download CSV Format
          </button>

          <button
            onClick={() => {
              if (!isAdminPortal && subjects.length === 0) {
                setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
                return
              }
              if (selectedFolderSubjectId) setImportSubjectId(selectedFolderSubjectId)
              setImportFormat('csv')
              setIsImportModalOpen(true)
            }}
            disabled={!isAdminPortal && subjects.length === 0}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud size={15} /> Bulk Import (Aiken/CSV)
          </button>

          <button
            onClick={() => {
              if (!isAdminPortal && subjects.length === 0) {
                setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
                return
              }
              setActiveTab('studio')
            }}
            disabled={!isAdminPortal && subjects.length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={15} /> AI / Scan / Upload
          </button>

          <button
            onClick={() => {
              if (!isAdminPortal && subjects.length === 0) {
                setAccessDeniedNotice("Accessed can not be granted meet Admin for the priveleges..")
                return
              }
              if (selectedFolderSubjectId) setFormSubjectId(selectedFolderSubjectId)
              setIsAddModalOpen(true)
            }}
            disabled={!isAdminPortal && subjects.length === 0}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> New Question
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('studio')
              setSelectedFolderSubjectId(null)
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'studio'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Sparkles size={15} />
            <span>Create with AI</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('folders')
              setSelectedFolderSubjectId(null)
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'folders' && selectedFolderSubjectId === null
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Folder size={15} />
            <span>Subject Folders ({subjectFolders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pool')
              setSelectedFolderSubjectId(null)
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'pool'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Layers size={15} />
            <span>All Question Pool ({questions.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('assigned')
              setSelectedFolderSubjectId(null)
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'assigned'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Send size={15} />
            <span>Assigned CBT Tests ({onlineExams.length})</span>
          </button>
        </div>

        {/* Selected Counter Button */}
        {selectedIds.length > 0 && (
          <button
            onClick={handleOpenAssignModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2 animate-bounce cursor-pointer"
          >
            <Sparkles size={15} />
            <span>Assign {selectedIds.length} Selected to Class</span>
          </button>
        )}
      </div>

      {activeTab === 'studio' && (
        <HomeworkQuestionStudio
          role={isAdminPortal ? 'admin' : 'teacher'}
          allocations={allocations}
          onBankSaved={() => fetchQuestions()}
        />
      )}

      {/* TAB 1: SUBJECT FOLDERS CABINET */}
      {activeTab === 'folders' && selectedFolderSubjectId === null && (
        <div className="space-y-6">
          {/* Search and Class Filter bar inside Folders */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search subject folders..."
                  value={folderSearchTerm}
                  onChange={(e) => setFolderSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="All">All Classes (Entire School)</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Click any subject folder to view its question files or collect questions to assign to classes.
            </div>
          </div>

          {/* Subject Folders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedFolders.map((folder) => {
              const classesArray = Array.from(folder.classes)

              return (
                <div
                  key={folder.subjectId}
                  onClick={() => {
                    setSelectedFolderSubjectId(folder.subjectId)
                    setSelectedSubjectId(String(folder.subjectId))
                  }}
                  className="group relative bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400 shadow-xs hover:shadow-xl transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer overflow-hidden"
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
                        {folder.questionsCount} Item{folder.questionsCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Subject Name */}
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                        {folder.subjectName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {folder.totalMarks} Total Marks in Pool
                      </p>
                    </div>

                    {/* Composition Breakdown */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                        {folder.mcqCount} MCQ
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                        {folder.tfCount} True/False
                      </span>
                      {folder.theoryCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                          {folder.theoryCount} Theory
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
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-amber-600">
                    <span>Open Subject Folder</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>

          {filteredFolders.length > 0 && (
            <PaginationBar
              page={folderPage}
              pageSize={folderPageSize}
              total={filteredFolders.length}
              totalPages={totalFolderPages}
              noun="subject folders"
              pageSizeOptions={[8, 12, 16, 24, 48]}
              onPage={setFolderPage}
              onPageSize={(sz) => {
                setFolderPageSize(sz)
                setFolderPage(1)
              }}
            />
          )}
        </div>
      )}

      {/* TAB 1 SUB-VIEW: INSIDE A SELECTED SUBJECT FOLDER */}
      {activeTab === 'folders' && selectedFolderSubjectId !== null && currentFolder && (
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
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
                      {currentFolder.subjectCode}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      Subject Vault Dossier
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
                    <FolderOpen className="text-amber-500" size={22} />
                    {currentFolder.subjectName}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={toggleSelectAllFolderQuestions}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckSquare size={14} className="text-blue-600" />
                  <span>
                    {folderQuestions.every(q => selectedIds.includes(q.id)) && folderQuestions.length > 0
                      ? 'Deselect All'
                      : 'Select All in Folder'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormSubjectId(currentFolder.subjectId)
                    setIsAddModalOpen(true)
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Add Question
                </button>
              </div>
            </div>

            {/* Folder Filter & Search Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder={`Search ${currentFolder.subjectName} questions...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500">Filter Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="All">All Classes</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-bold text-slate-500">Term:</span>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="All">All terms</option>
                  <option>First Term</option>
                  <option>Second Term</option>
                  <option>Third Term</option>
                </select>
                <span className="text-xs font-bold text-slate-500">Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="All">All types</option>
                  <option value="mcq">MCQ</option>
                  <option value="true_false">True / False</option>
                  <option value="theory">Theory</option>
                </select>
              </div>
            </div>
          </div>

          {/* Folder Questions Grid */}
          {folderQuestions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <BookOpen className="mx-auto text-slate-300" size={40} />
              <h3 className="text-sm font-bold text-slate-700">No questions in this folder yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add questions manually, import via Aiken/CSV, or generate curriculum-aligned questions with AI.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => {
                    setFormSubjectId(currentFolder.subjectId)
                    setIsAddModalOpen(true)
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Add Question
                </button>
                <button
                  onClick={() => {
                    setImportSubjectId(currentFolder.subjectId)
                    setIsImportModalOpen(true)
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Bulk Import
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedQuestions.map((q, idx) => {
                  const isSelected = selectedIds.includes(q.id)
                  const optionsList = Array.isArray(q.options) ? q.options : []
                  const globalIdx = (questionPage - 1) * questionPageSize + idx + 1

                  return (
                    <div
                      key={`folder-q-${q.id || idx}-${idx}`}
                    onClick={() => toggleSelectQuestion(q.id)}
                    className={`relative rounded-3xl border p-5 shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200/80 hover:border-amber-400'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelectQuestion(q.id)
                            }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {isSelected ? <Check size={14} /> : null}
                          </button>
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase">
                            {q.questionType}
                          </span>
                          {q.category && (
                            <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 text-[10px] font-bold rounded-md">
                              {q.category}
                            </span>
                          )}
                          {q.sourceType && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase">
                              {q.sourceType}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${(q.status || 'APPROVED') === 'APPROVED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                            {q.status || 'APPROVED'}
                          </span>
                          {q.class && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                              {q.class.name}
                            </span>
                          )}
                          {q.termName && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md">
                              {q.termName}
                            </span>
                          )}
                          {q.topic && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[10px] font-bold rounded-md">
                              {q.topic}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                            {q.marks} Mark{q.marks > 1 ? 's' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteQuestion(q.id)
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-900 leading-relaxed">
                        <span className="text-slate-400 mr-1.5">#{globalIdx}</span>
                        {q.questionText}
                      </p>

                      {optionsList.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {optionsList.map((opt: string, oIdx: number) => {
                            const letter = String.fromCharCode(65 + oIdx)
                            const isCorrect = q.correctOption === letter || q.correctOption === opt
                            return (
                              <div
                                key={oIdx}
                                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                    : 'bg-slate-50/80 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                                  {letter}
                                </span>
                                <span className="truncate">{opt}</span>
                                {isCorrect && <Check size={12} className="ml-auto text-emerald-600 shrink-0" />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Correct Key: <strong className="text-slate-800">{q.correctOption || 'A'}</strong></span>
                      <span className={isSelected ? 'text-blue-600 font-bold' : ''}>
                        {isSelected ? '✓ Selected for Collection' : 'Click to select'}
                      </span>
                    </div>
                  </div>
                )
              })}
              </div>

              {folderQuestions.length > 0 && (
                <PaginationBar
                  page={questionPage}
                  pageSize={questionPageSize}
                  total={folderQuestions.length}
                  totalPages={totalQuestionPages}
                  noun="questions"
                  pageSizeOptions={[10, 20, 30, 50]}
                  onPage={setQuestionPage}
                  onPageSize={(sz) => {
                    setQuestionPageSize(sz)
                    setQuestionPage(1)
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL QUESTIONS POOL (FLAT LIST) */}
      {activeTab === 'pool' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search questions across all subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <Filter size={14} /> Subject:
              </div>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="All">All Subjects ({questions.length})</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                Class:
              </div>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="All">All Classes</option>
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="text-xs font-bold text-slate-600">Term:</span>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="All">All terms</option>
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
              <span className="text-xs font-bold text-slate-600">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="All">All types</option>
                <option value="mcq">MCQ</option>
                <option value="true_false">True / False</option>
                <option value="theory">Theory</option>
              </select>
            </div>
          </div>

          {/* Question List */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="animate-spin text-amber-500" size={32} />
              <p className="text-xs font-semibold">Loading question bank items...</p>
            </div>
          ) : folderQuestions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <BookOpen className="mx-auto text-slate-300" size={40} />
              <h3 className="text-sm font-bold text-slate-700">No questions found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Get started by importing questions via Aiken standard format, CSV spreadsheet, or generate them automatically using the AI generator.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedQuestions.map((q, idx) => {
                  const isSelected = selectedIds.includes(q.id)
                  const optionsList = Array.isArray(q.options) ? q.options : []
                  const globalIdx = (questionPage - 1) * questionPageSize + idx + 1
                  return (
                    <div
                      key={`pool-q-${q.id || idx}-${idx}`}
                    onClick={() => toggleSelectQuestion(q.id)}
                    className={`rounded-3xl border p-5 shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200/80 hover:border-amber-400/60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelectQuestion(q.id)
                            }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {isSelected ? <Check size={14} /> : null}
                          </button>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-extrabold rounded-md">
                            {q.subject?.name || 'Subject'}
                          </span>
                          {q.class && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                              {q.class.name}
                            </span>
                          )}
                          {q.termName && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md">
                              {q.termName}
                            </span>
                          )}
                          {q.topic && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[10px] font-bold rounded-md">
                              {q.topic}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase">
                            {q.questionType}
                          </span>
                          {q.category && (
                            <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 text-[10px] font-bold rounded-md">
                              {q.category}
                            </span>
                          )}
                          {q.sourceType && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase">
                              {q.sourceType}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${(q.status || 'APPROVED') === 'APPROVED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                            {q.status || 'APPROVED'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                            {q.marks} Mark{q.marks > 1 ? 's' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteQuestion(q.id)
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-900 leading-relaxed">
                        <span className="text-slate-400 mr-1.5">#{globalIdx}</span> {q.questionText}
                      </p>

                      {optionsList.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {optionsList.map((opt: string, oIdx: number) => {
                            const letter = String.fromCharCode(65 + oIdx)
                            const isCorrect = q.correctOption === letter || q.correctOption === opt
                            return (
                              <div
                                key={oIdx}
                                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                    : 'bg-slate-50/80 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                                  {letter}
                                </span>
                                <span className="truncate">{opt}</span>
                                {isCorrect && <Check size={12} className="ml-auto text-emerald-600 shrink-0" />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Correct Key: <strong className="text-slate-800">{q.correctOption || 'A'}</strong></span>
                      <span>ID #{q.id}</span>
                    </div>
                  </div>
                )
              })}
              </div>

              {folderQuestions.length > 0 && (
                <PaginationBar
                  page={questionPage}
                  pageSize={questionPageSize}
                  total={folderQuestions.length}
                  totalPages={totalQuestionPages}
                  noun="questions"
                  pageSizeOptions={[10, 20, 30, 50]}
                  onPage={setQuestionPage}
                  onPageSize={(sz) => {
                    setQuestionPageSize(sz)
                    setQuestionPage(1)
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PUBLISHED CBT TESTS */}
      {activeTab === 'assigned' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Send className="text-blue-600" size={20} />
                  Published & Assigned CBT Assessments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live assessments distributed to classrooms with questions collected from the master vault.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('folders')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <FolderOpen size={14} /> Open Subject Folders to Assign New
              </button>
            </div>

            {loadingExams ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="animate-spin text-blue-600" size={28} />
                <p className="text-xs font-semibold">Loading assigned CBT tests...</p>
              </div>
            ) : onlineExams.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs italic space-y-2">
                <p>No CBT assessments distributed to classrooms yet.</p>
                <p className="text-slate-500 font-semibold">Select questions from any subject folder and click &quot;Assign to Class&quot; to publish.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {onlineExams.map((exam, idx) => {
                  const qCount = Array.isArray(exam.questions) ? exam.questions.length : 0
                  const subCount = exam.submissions?.length || 0

                  return (
                    <div
                      key={`exam-${exam.id || idx}-${idx}`}
                      className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/90 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                            {exam.subject?.name || 'General'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {exam.class?.name || 'Class'}
                            </span>
                            {exam.endDate && new Date(exam.endDate) < new Date() ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                                Closed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                Open
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                            {exam.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <Clock size={13} className="text-slate-400" />
                            <span>{exam.duration || 30} Mins</span>
                            <span>•</span>
                            <span>Pass Mark: {exam.passingMark}%</span>
                          </p>
                          {(exam.startDate || exam.endDate) && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              Opens {exam.startDate ? new Date(exam.startDate).toLocaleString() : '—'}
                              {exam.endDate ? ` · Closes ${new Date(exam.endDate).toLocaleString()}` : ''}
                            </p>
                          )}
                          {(exam.shuffleQuestions !== undefined || exam.showResults !== undefined) && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              {exam.shuffleQuestions === false ? 'Fixed order' : 'Random order'}
                              {' · '}
                              {exam.showResults === false ? 'Results later' : 'Results immediately'}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <span className="px-2.5 py-1 bg-white rounded-xl border border-slate-200 text-slate-700 font-bold">
                            {qCount} Questions Attached
                          </span>
                          <span className="px-2.5 py-1 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700 font-bold flex items-center gap-1">
                            <Users size={12} /> {subCount} Attempt{subCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openAnalyticsModal(exam.id)}
                            className="px-2.5 py-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                            title="View CBT Performance Analytics & Sync Marks"
                          >
                            <BarChart3 size={13} /> Analytics
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenExtendModal(exam)}
                            className="px-2.5 py-1 text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                            title="Extend Sitting Date / Deadline for Students"
                          >
                            <Calendar size={13} /> Extend Date
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditOnlineExam(exam)}
                            className="px-2.5 py-1 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                            title="Edit Assessment & Timing"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOnlineExam(exam.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Assessment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STICKY BOTTOM COLLECTOR ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/90 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-2xl border border-white/20 flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-xs font-black text-white">Questions Collected from Vault</p>
              <p className="text-[11px] text-slate-400">{totalSelectedMarks} Total Marks in this Batch</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-xs font-semibold cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleOpenAssignModal}
              className="px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={14} /> Assign & Distribute to Class
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: ASSIGN CBT TEST TO CLASS */}
      {isAssignTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Send size={18} className="text-amber-400" />
                {editingOnlineExamId ? 'Edit CBT Assessment & Settings' : 'Distribute CBT Assessment to Classroom'}
              </div>
              <button
                onClick={() => {
                  setIsAssignTestModalOpen(false)
                  setEditingOnlineExamId(null)
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublishCbtAssessment} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-extrabold block">
                    {editingOnlineExamId ? 'Editing Assessment' : `Collected Pool: ${selectedIds.length} Questions`}
                  </span>
                  <span className="text-[11px] text-blue-700">
                    {editingOnlineExamId ? 'Adjust title, duration, pass mark, dates or settings' : `Total Marks: ${totalSelectedMarks} pts`}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold">
                  {editingOnlineExamId ? 'Edit Mode' : 'Ready to Deploy'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assessment / Test Title *</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Basic Science Mid-Term CBT Test"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Subject *</label>
                  <select
                    value={assignSubjectId}
                    onChange={(e) => setAssignSubjectId(Number(e.target.value))}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={assignClassId}
                    onChange={(e) => setAssignClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opens (attempt window)</label>
                  <input
                    type="datetime-local"
                    value={assignStartDate}
                    onChange={(e) => setAssignStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Closes</label>
                  <input
                    type="datetime-local"
                    value={assignEndDate}
                    onChange={(e) => setAssignEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={assignDuration}
                    onChange={(e) => {
                      const val = e.target.value
                      setAssignDuration(val === '' ? '' : Math.max(1, parseInt(val, 10) || 0))
                    }}
                    onBlur={() => {
                      if (!assignDuration || Number(assignDuration) < 1) setAssignDuration(30)
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pass Mark (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={assignPassingMark}
                    onChange={(e) => {
                      const val = e.target.value
                      setAssignPassingMark(val === '' ? '' : Math.max(1, parseInt(val, 10) || 0))
                    }}
                    onBlur={() => {
                      if (!assignPassingMark || Number(assignPassingMark) < 1) setAssignPassingMark(50)
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={assignExamDate}
                    onChange={(e) => setAssignExamDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={assignShuffle} onChange={(e) => setAssignShuffle(e.target.checked)} className="rounded border-slate-300" />
                Present questions in random order
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={assignShowResults} onChange={(e) => setAssignShowResults(e.target.checked)} className="rounded border-slate-300" />
                Show answers / results immediately after submission
              </label>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignTestModalOpen(false)
                    setEditingOnlineExamId(null)
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishingExam}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPublishingExam ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {editingOnlineExamId ? 'Save Changes' : 'Publish & Assign to Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: BULK IMPORT (AIKEN / CSV / JSON) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <UploadCloud size={18} className="text-amber-400" /> Bulk Import Questions into Subject Folder
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 flex-wrap">
                <span className="text-xs font-bold text-slate-700 mr-2">Format:</span>
                <button
                  type="button"
                  onClick={() => { setImportFormat('aiken'); if (!importText) loadSampleAiken() }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    importFormat === 'aiken' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Aiken (.txt standard)
                </button>
                <button
                  type="button"
                  onClick={() => { setImportFormat('csv'); if (!importText) loadSampleCsv() }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    importFormat === 'csv' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  CSV Table (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => setImportFormat('json')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    importFormat === 'json' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  JSON (.json)
                </button>

                <div className="ml-auto flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={downloadQuestionsCsvTemplate}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition cursor-pointer"
                    title="Download official questions spreadsheet template for Excel / Google Sheets"
                  >
                    <Download size={13} /> Download CSV Format
                  </button>
                  <button
                    type="button"
                    onClick={importFormat === 'aiken' ? loadSampleAiken : loadSampleCsv}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer ml-1"
                  >
                    Load Sample
                  </button>
                </div>
              </div>

              {/* Dedicated CSV Template & Direct File Upload Banner */}
              {importFormat === 'csv' && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-2xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Download size={16} />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-emerald-950">Official Questions CSV Format</h5>
                        <p className="text-[11px] text-emerald-800 font-medium">
                          Download template, fill in Microsoft Excel or Google Sheets, then upload the file directly.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={downloadQuestionsCsvTemplate}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download size={13} /> Download Format
                      </button>
                      <label className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                        <UploadCloud size={13} /> {uploadedCsvFileName ? 'Change File' : 'Upload File'}
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleCsvFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-1 text-[10px] text-emerald-900 font-mono bg-white/70 px-2.5 py-1.5 rounded-lg border border-emerald-200/50 flex flex-wrap items-center gap-1">
                    <strong className="text-emerald-950 font-sans">Columns:</strong>
                    <span>question_text</span> • <span>question_type (mcq / true_false)</span> • <span>option_a</span> • <span>option_b</span> • <span>option_c</span> • <span>option_d</span> • <span>correct_option (A/B/C/D)</span> • <span>marks</span> • <span>explanation</span> • <span>topic</span>
                  </div>

                  {uploadedCsvFileName && (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 animate-in fade-in">
                      <span className="truncate">Loaded: <strong className="font-mono text-emerald-950">{uploadedCsvFileName}</strong></span>
                      <button
                        type="button"
                        onClick={() => { setUploadedCsvFileName(null); setImportText('') }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        title="Remove loaded file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Subject Folder *</label>
                  <select
                    value={importSubjectId}
                    onChange={(e) => setImportSubjectId(Number(e.target.value))}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class *</label>
                  <select
                    value={importClassId}
                    onChange={(e) => setImportClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">Select class</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Term *</label>
                  <select
                    value={importTermName}
                    onChange={(e) => setImportTermName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {importFormat === 'csv' ? 'CSV Content (or Paste / Upload above) *' : `Paste ${importFormat.toUpperCase()} Data *`}
                  </label>
                  {importText.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {importText.split('\n').filter((l) => l.trim()).length} lines
                    </span>
                  )}
                </div>
                <textarea
                  rows={8}
                  required
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your questions content here formatted strictly according to chosen standard..."
                  className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  Parse for review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI QUESTION GENERATOR */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 to-violet-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Sparkles size={18} className="text-yellow-300" /> AI Question Generator
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAiGenerate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Subject *</label>
                  <select
                    value={aiSubjectId}
                    onChange={(e) => setAiSubjectId(Number(e.target.value))}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grade / Level</label>
                  <select
                    value={aiClassLevel}
                    onChange={(e) => setAiClassLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="Junior Secondary (JSS)">Junior Secondary (JSS)</option>
                    <option value="Senior Secondary (SSS)">Senior Secondary (SSS)</option>
                    <option value="Primary School">Primary School</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class *</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">Select class</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Term *</label>
                  <select
                    value={formTermName}
                    onChange={(e) => setFormTermName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Curriculum Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Photosynthesis, Quadratic Equations, Parts of Speech"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Question Type</label>
                  <select
                    value={aiQuestionType}
                    onChange={(e) => setAiQuestionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="mcq">Multiple Choice (4 options)</option>
                    <option value="true_false">True / False</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Number of Questions</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAi}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Generate for review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div>
                <div className="flex items-center gap-2 font-black text-sm">
                  <Eye size={18} className="text-amber-400" /> Review before saving
                </div>
                <p className="text-[11px] text-white/70 mt-1 font-medium">
                  AI-generated, scanned, and uploaded questions must be edited here, then saved. After save they are approved for class assignment.
                </p>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-500">
                Source: {reviewMeta.sourceType} · Term: {reviewMeta.termName}
                {reviewMeta.topic ? ` · Topic: ${reviewMeta.topic}` : ''}
              </p>
              {reviewDrafts.map((q, idx) => {
                const options = Array.isArray(q.options) && q.options.length ? q.options : ['', '', '', '']
                return (
                  <div key={`review-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-700">Question {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setReviewDrafts((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={q.questionText || ''}
                      onChange={(e) => updateReviewDraft(idx, { questionText: e.target.value })}
                      className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden"
                      placeholder="Question stem"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <select
                        value={q.questionType || 'mcq'}
                        onChange={(e) => updateReviewDraft(idx, { questionType: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value="mcq">MCQ</option>
                        <option value="true_false">True / False</option>
                        <option value="theory">Theory</option>
                      </select>
                      <input
                        value={q.category || ''}
                        onChange={(e) => updateReviewDraft(idx, { category: e.target.value })}
                        placeholder="Category (optional)"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      />
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={q.marks ?? 1}
                        onChange={(e) => updateReviewDraft(idx, { marks: parseFloat(e.target.value) || 1 })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                    {(q.questionType || 'mcq') !== 'theory' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {options.map((opt: string, oIdx: number) => {
                          const letter = String.fromCharCode(65 + oIdx)
                          return (
                            <div key={oIdx} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateReviewDraft(idx, { correctOption: letter })}
                                className={`w-7 h-7 rounded-lg text-[10px] font-black shrink-0 ${
                                  (q.correctOption || 'A') === letter
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600'
                                }`}
                              >
                                {letter}
                              </button>
                              <input
                                value={opt}
                                onChange={(e) => {
                                  const next = [...options]
                                  next[oIdx] = e.target.value
                                  updateReviewDraft(idx, { options: next })
                                }}
                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReviewedDrafts}
                disabled={isSavingDrafts}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingDrafts ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save to Question Bank
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE SINGLE QUESTION */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Plus size={18} className="text-amber-400" /> Create Question
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Folder *</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(Number(e.target.value))}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class *</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">Select class</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Term *</label>
                  <select
                    value={formTermName}
                    onChange={(e) => setFormTermName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
                  <input
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="e.g. Fractions"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <input
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Objective, Comprehension, Essay"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question Prompt *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the question text here..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="qtype"
                      checked={newQuestionType === 'mcq'}
                      onChange={() => setNewQuestionType('mcq')}
                    />
                    Multiple Choice
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="qtype"
                      checked={newQuestionType === 'true_false'}
                      onChange={() => setNewQuestionType('true_false')}
                    />
                    True / False
                  </label>
                </div>
              </div>

              {newQuestionType === 'mcq' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Answer Options</label>
                  {newQuestionOptions.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx)
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 text-[11px] font-black flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const copy = [...newQuestionOptions]
                            copy[idx] = e.target.value
                            setNewQuestionOptions(copy)
                          }}
                          placeholder={`Option ${letter}`}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correct Key *</label>
                  <select
                    value={newQuestionCorrect}
                    onChange={(e) => setNewQuestionCorrect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  >
                    {newQuestionType === 'mcq' ? (
                      <>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </>
                    ) : (
                      <>
                        <option value="A">True</option>
                        <option value="B">False</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marks / Points</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={newQuestionMarks}
                    onChange={(e) => setNewQuestionMarks(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuestion}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingQuestion ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXTEND CBT DEADLINE / RESCHEDULE */}
      {extendingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-5 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black">Extend Assessment Window</h3>
                  <p className="text-xs text-blue-200">
                    Grant additional time or reopen sitting access for students
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExtendingExam(null)}
                className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitExtend} className="p-6 space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Assessment Details
                </span>
                <h4 className="text-sm font-black text-slate-900">{extendingExam.title}</h4>
                <p className="text-xs text-slate-500">
                  {extendingExam.class?.name || 'Class'} &bull; {extendingExam.subject?.name || 'Subject'}
                </p>
                {extendingExam.endDate && (
                  <p className="text-xs text-amber-700 font-bold pt-1">
                    Previous End Date: {new Date(extendingExam.endDate).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Quick Extend Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Quick Extension Presets</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyQuickExtend(24, 'hours')}
                    className="py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-bold transition text-slate-700 cursor-pointer"
                  >
                    +24 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickExtend(3, 'days')}
                    className="py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-bold transition text-slate-700 cursor-pointer"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickExtend(7, 'days')}
                    className="py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-bold transition text-slate-700 cursor-pointer"
                  >
                    +1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickExtend(14, 'days')}
                    className="py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-bold transition text-slate-700 cursor-pointer"
                  >
                    +2 Weeks
                  </button>
                </div>
              </div>

              {/* Date Time Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Start Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={extendStartDate}
                    onChange={(e) => setExtendStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    New Closing Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={extendEndDate}
                    onChange={(e) => setExtendEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Students will be able to take the exam until this deadline.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtendingExam(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExtension}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingExtension ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Confirm & Extend Deadline
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CBT TEST PERFORMANCE ANALYTICS & MARKSHEET SCORE SYNC */}
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

                  {analyticsData.pendingCount > 0 && (
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{analyticsData.pendingCount} student{analyticsData.pendingCount === 1 ? '' : 's'} have not submitted</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Extend deadline or sitting date for students who missed their sitting.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const examToExtend = onlineExams.find((e) => e.id === analyticsDistId)
                          setAnalyticsDistId(null)
                          setAnalyticsData(null)
                          if (examToExtend) handleOpenExtendModal(examToExtend)
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar size={14} /> Extend deadline
                      </button>
                    </div>
                  )}

                  {/* Marksheet Sync Action Card */}
                  <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <TrendingUp size={16} className="text-amber-600" />
                          Report Card & Marksheet Sync
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Submitted CBT scores sync automatically to the subject marksheet. Use this manual sync button to record any missing student attempts or re-calculate scaled continuous assessment scores.
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
                          Record missing scores
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Student Submissions Matrix */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Pupil Submissions Matrix ({analyticsData.students?.length || 0})
                    </h4>

                    <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200/80">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs font-bold">Student Name</TableHead>
                            <TableHead className="text-xs font-bold">Reg No</TableHead>
                            <TableHead className="text-xs font-bold">Status</TableHead>
                            <TableHead className="text-xs font-bold">CBT Score (%)</TableHead>
                            <TableHead className="text-xs font-bold">Report Card (/ {maxScoreBase})</TableHead>
                            <TableHead className="text-xs font-bold">Submitted At</TableHead>
                            {isAdminPortal && <TableHead className="text-xs font-bold">Action</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(analyticsData.students) && analyticsData.students.map((st: any) => (
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
                              <TableCell className="text-xs">
                                <div className="font-mono font-black text-slate-800">
                                  {st.reportCbtMark != null && st.reportCbtMark !== '' ? st.reportCbtMark : '-'}
                                </div>
                                {st.cbtSource === 'ADMIN_OVERRIDE' ? (
                                  <span className="text-[10px] font-bold text-amber-700">Admin corrected</span>
                                ) : st.onReportCard ? (
                                  <span className="text-[10px] font-bold text-emerald-700">On report card</span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Not recorded yet</span>
                                )}
                              </TableCell>
                              <TableCell className="text-slate-500 text-[11px]">
                                {st.submittedAt ? new Date(st.submittedAt).toLocaleDateString() : '-'}
                              </TableCell>
                              {isAdminPortal && (
                                <TableCell>
                                  {correctingStudentId === st.studentId ? (
                                    <div className="space-y-1.5 min-w-[180px]">
                                      <input
                                        type="number"
                                        min={0}
                                        max={maxScoreBase}
                                        step="0.1"
                                        value={correctionScore}
                                        onChange={(e) => setCorrectionScore(e.target.value)}
                                        placeholder={`Score / ${maxScoreBase}`}
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                      />
                                      <input
                                        type="text"
                                        value={correctionReason}
                                        onChange={(e) => setCorrectionReason(e.target.value)}
                                        placeholder="Reason for correction"
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                      />
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          disabled={isSavingCorrection}
                                          onClick={() => handleOverrideCbtMark(st.studentId)}
                                          className="px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg disabled:opacity-50"
                                        >
                                          {isSavingCorrection ? 'Saving' : 'Save'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCorrectingStudentId(null)
                                            setCorrectionScore('')
                                            setCorrectionReason('')
                                          }}
                                          className="px-2 py-1 text-[10px] font-bold text-slate-500"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCorrectingStudentId(st.studentId)
                                        setCorrectionScore(st.reportCbtMark || '')
                                        setCorrectionReason('')
                                      }}
                                      className="px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit3 size={12} /> Edit
                                    </button>
                                  )}
                                </TableCell>
                              )}
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
