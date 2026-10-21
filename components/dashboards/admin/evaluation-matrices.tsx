'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Check,
  Star,
  Percent,
  Layers,
  Award,
  BookOpen,
  Lock,
  Monitor,
  FileText,
  Calculator,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react'

export interface AssessmentComponent {
  name: string
  code: string
  maxMarks: number
  passMarks: number
}

export interface MatrixFeedItem {
  id?: number
  componentName: string
  componentType: 'CBT' | 'MANUAL'
  weightMarks: number
  examMasterId?: number | null
  examMaster?: {
    id: number
    name: string
    examCategory?: string
    cbtTotalMarks?: number | null
    totalQuestionCount?: number | null
  } | null
}

export interface MatrixColumnConfig {
  id?: number
  columnKey: string
  columnLabel: string
  maxMarks: number
  passMarks?: number
  displayOrder?: number
  feedItems: MatrixFeedItem[]
}

export interface EvaluationMatrixData {
  id: number
  name: string
  code: string
  description?: string | null
  totalMarks: number | string
  isDefault: boolean
  components: AssessmentComponent[]
  columns?: MatrixColumnConfig[]
  classes?: Array<{ id: number; name: string }>
  createdAt?: string
}

interface EvaluationMatricesProps {
  onGoToExamSetup?: () => void
}

export function EvaluationMatrices({ onGoToExamSetup }: EvaluationMatricesProps = {}) {
  const [matrices, setMatrices] = useState<EvaluationMatrixData[]>([])
  const [classes, setClasses] = useState<Array<{ id: number; name: string; usesScores?: boolean; isEcd?: boolean }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Hard Dependency Gate state (HTTP 412)
  const [isGateLocked, setIsGateLocked] = useState(false)
  const [examMasters, setExamMasters] = useState<any[]>([])

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMatrixId, setEditingMatrixId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [totalMarks, setTotalMarks] = useState<number>(100)
  const [isDefault, setIsDefault] = useState(false)

  // Builder Mode: 'multiRollup' (Hybrid CBT + Manual) vs 'standard'
  const [activeTabMode, setActiveTabMode] = useState<'multiRollup' | 'standard'>('multiRollup')
  const [isCbtMode, setIsCbtMode] = useState(true)

  // Standard simple components
  const [components, setComponents] = useState<AssessmentComponent[]>([
    { name: 'Continuous Assessment 1', code: 'CA1', maxMarks: 15, passMarks: 6 },
    { name: 'Continuous Assessment 2', code: 'CA2', maxMarks: 25, passMarks: 10 },
    { name: 'Terminal Examination', code: 'EXAM', maxMarks: 60, passMarks: 24 },
  ])

  // Multi-component rollup columns
  const [builderColumns, setBuilderColumns] = useState<MatrixColumnConfig[]>([
    {
      columnKey: 'CA1',
      columnLabel: 'Continuous Assessment 1',
      maxMarks: 20,
      passMarks: 8,
      feedItems: [
        { componentName: 'CBT 1', componentType: 'CBT', weightMarks: 10, examMasterId: null },
        { componentName: 'Manual Theory 1', componentType: 'MANUAL', weightMarks: 10 },
      ],
    },
    {
      columnKey: 'CA2',
      columnLabel: 'Continuous Assessment 2',
      maxMarks: 20,
      passMarks: 8,
      feedItems: [
        { componentName: 'CBT 2', componentType: 'CBT', weightMarks: 10, examMasterId: null },
        { componentName: 'Manual Theory 2', componentType: 'MANUAL', weightMarks: 10 },
      ],
    },
    {
      columnKey: 'EXAM',
      columnLabel: 'Terminal Examination',
      maxMarks: 60,
      passMarks: 24,
      feedItems: [
        { componentName: 'CBT Terminal Exam', componentType: 'CBT', weightMarks: 40, examMasterId: null },
        { componentName: 'Written Theory Exam', componentType: 'MANUAL', weightMarks: 20 },
      ],
    },
  ])

  // Interactive Live Preview Simulation State (Section 3)
  const [simRawCbtScore, setSimRawCbtScore] = useState<number>(18)
  const [simRawCbtTotal, setSimRawCbtTotal] = useState<number>(20)
  const [simTheoryScore, setSimTheoryScore] = useState<number>(8.5)
  const [simTheoryTotal, setSimTheoryTotal] = useState<number>(10)

  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Delete Confirmation Modal
  const [deletingMatrix, setDeletingMatrix] = useState<EvaluationMatrixData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchMatrices()
  }, [])

  const fetchMatrices = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    setIsGateLocked(false)

    try {
      const [res, examRes, classRes] = await Promise.all([
        apiSlice.get<{ success: boolean; matrices: EvaluationMatrixData[] }>(
          endpoints.admin.evaluationMatrices
        ),
        apiSlice.get<{ success: boolean; exams: any[] }>(endpoints.admin.exams).catch(() => ({ success: false, exams: [] })),
        apiSlice.get<{ success: boolean; classes: Array<{ id: number; name: string; usesScores?: boolean; isEcd?: boolean }> }>(
          endpoints.admin.classesSections
        ).catch(() => ({ success: false, classes: [] })),
      ])

      if (res.success && res.matrices) {
        setMatrices(res.matrices)
      }
      if (examRes.success && examRes.exams) {
        setExamMasters(examRes.exams)
      }
      if (classRes.success && classRes.classes) {
        setClasses(classRes.classes)
      }
    } catch (err: any) {
      if (
        err.status === 412 ||
        err.code === 'EXAM_MASTER_REQUIRED' ||
        (err.message && err.message.toLowerCase().includes('exam master'))
      ) {
        setIsGateLocked(true)
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load evaluation matrices.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const applyPresetScheme = (type: 'standard100' | 'ca40' | 'ca30' | 'hybridCbt100') => {
    if (type === 'hybridCbt100') {
      setName('Primary Hybrid Scheme (100 Marks: CBT + Theory)')
      setCode('HYB-100')
      setDescription('Multi-component scheme: CA1 (10 CBT + 10 Theory), CA2 (10 CBT + 10 Theory), Exam (40 CBT + 20 Theory).')
      setTotalMarks(100)
      setActiveTabMode('multiRollup')
      setIsCbtMode(true)
      setBuilderColumns([
        {
          columnKey: 'CA1',
          columnLabel: 'Continuous Assessment 1',
          maxMarks: 20,
          passMarks: 8,
          feedItems: [
            { componentName: 'CBT 1', componentType: 'CBT', weightMarks: 10 },
            { componentName: 'Manual Theory 1', componentType: 'MANUAL', weightMarks: 10 },
          ],
        },
        {
          columnKey: 'CA2',
          columnLabel: 'Continuous Assessment 2',
          maxMarks: 20,
          passMarks: 8,
          feedItems: [
            { componentName: 'CBT 2', componentType: 'CBT', weightMarks: 10 },
            { componentName: 'Manual Theory 2', componentType: 'MANUAL', weightMarks: 10 },
          ],
        },
        {
          columnKey: 'EXAM',
          columnLabel: 'Terminal Examination',
          maxMarks: 60,
          passMarks: 24,
          feedItems: [
            { componentName: 'CBT Terminal Exam', componentType: 'CBT', weightMarks: 40 },
            { componentName: 'Written Theory Exam', componentType: 'MANUAL', weightMarks: 20 },
          ],
        },
      ])
    } else if (type === 'standard100') {
      setName('Standard Term Scheme (100 Marks)')
      setCode('STD100')
      setDescription('Standard 40% Continuous Assessment (CA1: 15, CA2: 25) and 60% Terminal Examination.')
      setTotalMarks(100)
      setComponents([
        { name: 'Continuous Assessment 1', code: 'CA1', maxMarks: 15, passMarks: 6 },
        { name: 'Continuous Assessment 2', code: 'CA2', maxMarks: 25, passMarks: 10 },
        { name: 'Terminal Examination', code: 'EXAM', maxMarks: 60, passMarks: 24 },
      ])
      setActiveTabMode('standard')
    } else if (type === 'ca40') {
      setName('Continuous Assessment Only (40/40 Marks)')
      setCode('CA40')
      setDescription('Mid-term Continuous Assessment only scheme (CA1: 20 marks, CA2: 20 marks = 40 Marks total).')
      setTotalMarks(40)
      setComponents([
        { name: 'Continuous Assessment 1', code: 'CA1', maxMarks: 20, passMarks: 8 },
        { name: 'Continuous Assessment 2', code: 'CA2', maxMarks: 20, passMarks: 8 },
      ])
      setActiveTabMode('standard')
    } else if (type === 'ca30') {
      setName('Continuous Assessment Only (30/30 Marks)')
      setCode('CA30')
      setDescription('Continuous Assessment score only (CA1: 15 marks, CA2: 15 marks = 30 Marks total).')
      setTotalMarks(30)
      setComponents([
        { name: 'Continuous Assessment 1', code: 'CA1', maxMarks: 15, passMarks: 6 },
        { name: 'Continuous Assessment 2', code: 'CA2', maxMarks: 15, passMarks: 6 },
      ])
      setActiveTabMode('standard')
    }
    setModalError(null)
  }

  const handleOpenCreateModal = () => {
    setEditingMatrixId(null)
    setName('')
    setCode('')
    setDescription('')
    setTotalMarks(100)
    setIsDefault(false)
    setActiveTabMode('multiRollup')
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (matrix: EvaluationMatrixData) => {
    setEditingMatrixId(matrix.id)
    setName(matrix.name)
    setCode(matrix.code)
    setDescription(matrix.description || '')
    setTotalMarks(Number(matrix.totalMarks) || 100)
    setIsDefault(matrix.isDefault)

    if (Array.isArray(matrix.columns) && matrix.columns.length > 0) {
      setActiveTabMode('multiRollup')
      setBuilderColumns(
        matrix.columns.map((col) => ({
          id: col.id,
          columnKey: col.columnKey,
          columnLabel: col.columnLabel,
          maxMarks: Number(col.maxMarks) || 0,
          passMarks: Number(col.passMarks) || 0,
          feedItems: Array.isArray(col.feedItems)
            ? col.feedItems.map((fi) => ({
                id: fi.id,
                componentName: fi.componentName,
                componentType: (fi.componentType || 'MANUAL') as 'CBT' | 'MANUAL',
                weightMarks: Number(fi.weightMarks) || 0,
                examMasterId: fi.examMasterId || null,
              }))
            : [],
        }))
      )
    } else {
      setActiveTabMode('standard')
      setComponents(
        Array.isArray(matrix.components) && matrix.components.length > 0
          ? matrix.components
          : [{ name: 'Exam Component', code: 'EXAM', maxMarks: 100, passMarks: 40 }]
      )
    }

    setModalError(null)
    setIsModalOpen(true)
  }

  // Column operations in multiRollup mode
  const handleAddRollupColumn = () => {
    const nextIdx = builderColumns.length + 1
    const key = `CA${nextIdx}`
    setBuilderColumns([
      ...builderColumns,
      {
        columnKey: key,
        columnLabel: `Continuous Assessment ${nextIdx}`,
        maxMarks: 20,
        passMarks: 8,
        feedItems: [
          { componentName: `CBT ${nextIdx}`, componentType: 'CBT', weightMarks: 10 },
          { componentName: `Manual Theory ${nextIdx}`, componentType: 'MANUAL', weightMarks: 10 },
        ],
      },
    ])
  }

  const handleRemoveRollupColumn = (idx: number) => {
    if (builderColumns.length <= 1) {
      setModalError('At least one assessment column is required.')
      return
    }
    setBuilderColumns(builderColumns.filter((_, i) => i !== idx))
  }

  const handleUpdateRollupColumn = (idx: number, field: string, val: any) => {
    const updated = [...builderColumns]
    updated[idx] = { ...updated[idx], [field]: val }
    setBuilderColumns(updated)
  }

  const handleAddFeedItem = (colIdx: number) => {
    const updated = [...builderColumns]
    updated[colIdx].feedItems.push({
      componentName: 'Sub-Component',
      componentType: isCbtMode ? 'CBT' : 'MANUAL',
      weightMarks: 5,
      examMasterId: null,
    })
    setBuilderColumns(updated)
  }

  const handleRemoveFeedItem = (colIdx: number, itemIdx: number) => {
    const updated = [...builderColumns]
    if (updated[colIdx].feedItems.length <= 1) {
      setModalError('Each column must have at least one feed component.')
      return
    }
    updated[colIdx].feedItems = updated[colIdx].feedItems.filter((_, i) => i !== itemIdx)
    setBuilderColumns(updated)
  }

  const handleUpdateFeedItem = (colIdx: number, itemIdx: number, field: string, val: any) => {
    const updated = [...builderColumns]
    const curItem: any = updated[colIdx].feedItems[itemIdx]
    curItem[field] = val
    if (field === 'examMasterId' && val) {
      const match = examMasters.find((ex) => ex.id === Number(val))
      if (match) {
        curItem.componentName = match.name
      }
    }
    setBuilderColumns(updated)
  }

  const currentTotalCalculated = useMemo(() => {
    if (activeTabMode === 'multiRollup') {
      return builderColumns.reduce((sum, col) => sum + (Number(col.maxMarks) || 0), 0)
    }
    return components.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0)
  }, [activeTabMode, builderColumns, components])

  // Real-Time Preview Simulation Calculation (Section 3)
  const simWeightedCbtScore = useMemo(() => {
    if (simRawCbtTotal <= 0) return 0
    return Number(((simRawCbtScore / simRawCbtTotal) * 10).toFixed(2))
  }, [simRawCbtScore, simRawCbtTotal])

  const simTotalCa1 = useMemo(() => {
    return Number((simWeightedCbtScore + simTheoryScore).toFixed(2))
  }, [simWeightedCbtScore, simTheoryScore])

  const handleSaveMatrix = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setModalError('Please enter a Matrix Name.')
      return
    }
    if (!code.trim()) {
      setModalError('Please enter a Matrix Code.')
      return
    }

    setIsSaving(true)
    setModalError(null)

    try {
      const payload: any = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        totalMarks: Number(totalMarks) > 0 ? Number(totalMarks) : currentTotalCalculated,
        isDefault,
      }

      if (activeTabMode === 'multiRollup') {
        payload.columns = builderColumns.map((col, idx) => ({
          columnKey: col.columnKey.trim().toUpperCase(),
          columnLabel: col.columnLabel.trim(),
          maxMarks: Number(col.maxMarks) || 0,
          passMarks: Number(col.passMarks) || 0,
          displayOrder: idx + 1,
          feedItems: col.feedItems.map((item) => ({
            componentName: item.componentName.trim(),
            componentType: isCbtMode ? item.componentType : 'MANUAL',
            weightMarks: Number(item.weightMarks) || 0,
            examMasterId: isCbtMode && item.componentType === 'CBT' && item.examMasterId ? Number(item.examMasterId) : null,
          })),
        }))
        payload.totalMarks = builderColumns.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0)
      } else {
        payload.components = components
      }

      if (editingMatrixId) {
        await apiSlice.put(endpoints.admin.evaluationMatrixDetail(editingMatrixId), payload)
        setSuccessMsg('Evaluation Matrix updated successfully.')
      } else {
        await apiSlice.post(endpoints.admin.evaluationMatrices, payload)
        setSuccessMsg('Evaluation Matrix created successfully.')
      }

      await fetchMatrices()
      setIsModalOpen(false)
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: any) {
      if (err.status === 412 || err.code === 'EXAM_MASTER_REQUIRED') {
        setIsGateLocked(true)
        setIsModalOpen(false)
      } else {
        setModalError(err instanceof Error ? err.message : 'Failed to save evaluation matrix.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetDefault = async (matrixId: number) => {
    try {
      await apiSlice.post(endpoints.admin.setEvaluationMatrixDefault(matrixId), {})
      await fetchMatrices()
      setSuccessMsg('Default evaluation matrix updated.')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      console.error('Failed to set default matrix:', err)
    }
  }

  const handleDeleteMatrix = async () => {
    if (!deletingMatrix) return
    setIsDeleting(true)
    try {
      await apiSlice.delete(endpoints.admin.evaluationMatrixDetail(deletingMatrix.id))
      await fetchMatrices()
      setDeletingMatrix(null)
      setSuccessMsg('Evaluation matrix deleted.')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete matrix.')
    } finally {
      setIsDeleting(false)
    }
  }

  const defaultMatrix = matrices.find((m) => m.isDefault)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 border border-white/15">
              <FileSpreadsheet size={14} className="text-indigo-300" /> Academic Evaluation Schemes
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Evaluation Matrices</h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 max-w-xl leading-relaxed">
              Define assessment structures (CA1, CA2, Terminal Exam) with multi-component rollups combining CBT Online tests and Teacher Theory marks.
            </p>
          </div>

          {!isGateLocked && (
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer shrink-0"
            >
              <Plus size={16} /> Create Evaluation Matrix
            </button>
          )}
        </div>
      </div>

      {/* HARD DEPENDENCY GATE BLOCKER (Scenario A) */}
      {isGateLocked ? (
        <div className="bg-white rounded-3xl border border-amber-200/90 p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-5 my-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-3.5 py-1 rounded-full border border-amber-200">
              Stage 1 Prerequisite Gate
            </span>
            <h3 className="text-xl font-black text-slate-900 pt-1">Evaluation Matrix Locked</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              No Exam Master definition was found. You must create an Exam Master definition before Evaluation Matrix becomes accessible.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (onGoToExamSetup) {
                  onGoToExamSetup()
                } else {
                  window.location.hash = '#exam-setup'
                }
              }}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer inline-flex items-center gap-2"
            >
              <Plus size={16} /> Create Exam Master Definition
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active Matrices</p>
                <p className="text-2xl font-black text-slate-900">{matrices.length}</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Layers size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Default Branch Matrix</p>
                <p className="text-sm font-black text-indigo-600 truncate max-w-[180px]">
                  {defaultMatrix ? defaultMatrix.name : 'None Assigned'}
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <Star size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Evaluation Mode</p>
                <p className="text-sm font-black text-emerald-700">
                  Hybrid CBT + Manual Theory
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Percent size={20} />
              </div>
            </div>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="p-3.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-3.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" /> {errorMsg}
            </div>
          )}

          {/* Phase 5: Qualitative Comment-Based Classrooms Callout */}
          {classes.some((c) => c.usesScores === false || c.isEcd === true) && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/90 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <Info className="text-emerald-700 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1 text-xs">
                  <h4 className="font-black text-emerald-950 uppercase tracking-wider">
                    Qualitative Early Childhood Classrooms
                  </h4>
                  <p className="text-emerald-800/90 leading-relaxed">
                    <strong>This class uses qualitative developmental comments. Numerical matrices are disabled.</strong>{' '}
                    The following classrooms evaluate qualitative learning milestones with 1–5 ratings instead of numeric matrix formulas:
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 shrink-0 md:max-w-md">
                {classes
                  .filter((c) => c.usesScores === false || c.isEcd === true)
                  .map((cls) => (
                    <span
                      key={cls.id}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold"
                    >
                      {cls.name} (Qualitative)
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Matrices Grid */}
          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
              <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading evaluation matrices...</p>
            </div>
          ) : matrices.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
              <FileSpreadsheet size={32} className="text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Evaluation Matrices Created Yet</p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
              >
                Create First Matrix
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matrices.map((matrix) => {
                const hasColumns = Array.isArray(matrix.columns) && matrix.columns.length > 0
                const calculatedTotal = hasColumns
                  ? matrix.columns!.reduce((acc, c) => acc + (Number(c.maxMarks) || 0), 0)
                  : Array.isArray(matrix.components)
                    ? matrix.components.reduce((acc, c) => acc + (Number(c.maxMarks) || 0), 0)
                    : 100

                return (
                  <div
                    key={matrix.id}
                    className={`bg-white rounded-2xl border ${
                      matrix.isDefault ? 'border-indigo-400 ring-2 ring-indigo-500/10' : 'border-slate-200/80'
                    } shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between overflow-hidden group`}
                  >
                    {/* Matrix Header */}
                    <div className="p-5 space-y-3 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                              {matrix.code}
                            </span>
                            {matrix.isDefault && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <Star size={10} className="fill-amber-400 text-amber-500" /> Default Scheme
                              </span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-base leading-snug">{matrix.name}</h3>
                        </div>

                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                          {calculatedTotal} Marks
                        </span>
                      </div>

                      {matrix.description && (
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                          {matrix.description}
                        </p>
                      )}
                    </div>

                    {/* Breakdown Table: Structured Columns with Multi-Component Rollup */}
                    <div className="p-5 flex-1 space-y-3">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {hasColumns ? 'Multi-Component Rollup Scheme' : 'Assessment Component Breakdown'}
                      </p>

                      {hasColumns ? (
                        <div className="space-y-2">
                          {matrix.columns!.map((col, idx) => (
                            <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-1.5 text-xs">
                              <div className="flex items-center justify-between font-bold text-slate-800">
                                <span className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-mono">
                                    {col.columnKey}
                                  </span>
                                  <span>{col.columnLabel}</span>
                                </span>
                                <span className="text-indigo-700 font-black">{col.maxMarks} Marks</span>
                              </div>
                              {Array.isArray(col.feedItems) && col.feedItems.length > 0 && (
                                <div className="pl-2 space-y-0.5 border-l-2 border-indigo-200">
                                  {col.feedItems.map((fi, fiIdx) => (
                                    <div key={fiIdx} className="text-[11px] text-slate-600 flex items-center justify-between">
                                      <span className="flex items-center gap-1">
                                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${fi.componentType === 'CBT' ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'}`}>
                                          {fi.componentType}
                                        </span>
                                        <span>{fi.componentName}</span>
                                      </span>
                                      <span className="font-semibold">{fi.weightMarks} pts</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200/60 overflow-hidden bg-slate-50/50">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/70 border-b border-slate-200/60 text-slate-500 font-bold">
                              <tr>
                                <th className="p-2.5">Component</th>
                                <th className="p-2.5 text-center">Code</th>
                                <th className="p-2.5 text-right">Max</th>
                                <th className="p-2.5 text-right">Pass</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/40 text-slate-700 font-semibold">
                              {matrix.components.map((c, idx) => (
                                <tr key={idx} className="hover:bg-white/80 transition">
                                  <td className="p-2.5 font-bold text-slate-800">{c.name}</td>
                                  <td className="p-2.5 text-center font-mono text-[11px] text-slate-500">{c.code}</td>
                                  <td className="p-2.5 text-right font-black text-indigo-700">{c.maxMarks}</td>
                                  <td className="p-2.5 text-right text-slate-500">{c.passMarks}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                      {!matrix.isDefault ? (
                        <button
                          onClick={() => handleSetDefault(matrix.id)}
                          className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition cursor-pointer"
                          title="Set as Branch Default"
                        >
                          <Star size={13} /> Set Default
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Active Default
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(matrix)}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => setDeletingMatrix(matrix)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <FileSpreadsheet size={18} className="text-indigo-400" />
                <span>{editingMatrixId ? 'Edit Evaluation Matrix' : 'Configure Evaluation Matrix Scheme'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg text-white/80 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMatrix} className="p-6 space-y-5 text-xs">
              {modalError && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Mode Selection & Non-CBT Isolation Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTabMode('multiRollup')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                      activeTabMode === 'multiRollup' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    <Layers size={14} /> Multi-Component Rollup (CBT + Theory)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabMode('standard')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                      activeTabMode === 'standard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    <FileText size={14} /> Simple Scheme
                  </button>
                </div>

                {/* Scenario C: Non-CBT Isolation Switcher */}
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <label className="text-[11px] font-bold text-slate-600">School CBT Capability:</label>
                  <button
                    type="button"
                    onClick={() => setIsCbtMode(!isCbtMode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ${
                      isCbtMode ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Monitor size={12} /> {isCbtMode ? 'CBT Enabled' : 'Paper-Only (Non-CBT)'}
                  </button>
                </div>
              </div>

              {/* Quick Preset Schemes */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                  <Sparkles size={12} className="text-indigo-600" /> Quick Scheme Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPresetScheme('hybridCbt100')}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    ⚡ Hybrid CBT + Manual (100: CA1 20, CA2 20, Exam 60)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetScheme('standard100')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-700 hover:text-white text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    📝 Standard Simple (100 Marks)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetScheme('ca40')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    🎯 CA Only (40 Marks)
                  </button>
                </div>
              </div>

              {/* Name & Short Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Scheme Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary 5 Gold Term 1 Assessment Scheme"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Scheme Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRI5-T1"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-indigo-500 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Continuous assessment and terminal exam component mapping"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-500"
                />
              </div>

              {/* Default checkbox */}
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Set as default evaluation matrix for this branch
              </label>

              {/* MULTI-COMPONENT ROLLUP BUILDER (Scenario B) */}
              {activeTabMode === 'multiRollup' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-black text-slate-900">Multi-Component Columns & Sub-Item Feed</h4>
                      <p className="text-[11px] text-slate-500">Configure report card columns (e.g. CA1 = CBT 1 + Manual Theory 1)</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-black border border-indigo-100">
                      Target Total: {currentTotalCalculated} Marks
                    </span>
                  </div>

                  <div className="space-y-3">
                    {builderColumns.map((col, colIdx) => (
                      <div key={colIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={col.columnKey}
                              onChange={(e) => handleUpdateRollupColumn(colIdx, 'columnKey', e.target.value.toUpperCase())}
                              className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase text-slate-900 text-center"
                              placeholder="KEY"
                            />
                            <input
                              type="text"
                              value={col.columnLabel}
                              onChange={(e) => handleUpdateRollupColumn(colIdx, 'columnLabel', e.target.value)}
                              className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                              placeholder="Column Label"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-[11px] font-bold">Max Marks:</span>
                            <input
                              type="number"
                              min={1}
                              value={col.maxMarks}
                              onChange={(e) => handleUpdateRollupColumn(colIdx, 'maxMarks', Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-indigo-700 text-center"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveRollupColumn(colIdx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              title="Remove Column"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Sub-item Feed Mapping (Section 2 & 3) */}
                        <div className="space-y-2 pl-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Sub-Components Feeding Into {col.columnKey}:
                          </p>
                          {col.feedItems.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                              <input
                                type="text"
                                value={item.componentName}
                                onChange={(e) => handleUpdateFeedItem(colIdx, itemIdx, 'componentName', e.target.value)}
                                placeholder="Component Name (e.g. CBT 1)"
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                              />

                              {isCbtMode ? (
                                <select
                                  value={item.componentType}
                                  onChange={(e) => handleUpdateFeedItem(colIdx, itemIdx, 'componentType', e.target.value)}
                                  className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                                >
                                  <option value="CBT">CBT</option>
                                  <option value="MANUAL">MANUAL</option>
                                </select>
                              ) : (
                                <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                                  MANUAL PAPER
                                </span>
                              )}

                              {isCbtMode && item.componentType === 'CBT' && (
                                <select
                                  value={item.examMasterId || ''}
                                  onChange={(e) => handleUpdateFeedItem(colIdx, itemIdx, 'examMasterId', e.target.value)}
                                  className="flex-1 px-2 py-1 bg-cyan-50/60 border border-cyan-200 rounded-lg text-xs font-semibold text-cyan-900"
                                >
                                  <option value="">-- Link to CBT Exam Master --</option>
                                  {examMasters
                                    .filter((em) => !em.examCategory || em.examCategory === 'CBT')
                                    .map((em) => (
                                      <option key={em.id} value={em.id}>
                                        {em.name} ({em.cbtTotalMarks || 'Auto'} Marks)
                                      </option>
                                    ))}
                                </select>
                              )}

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-bold text-slate-400">Weight:</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.weightMarks}
                                  onChange={(e) => handleUpdateFeedItem(colIdx, itemIdx, 'weightMarks', Number(e.target.value))}
                                  className="w-14 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-indigo-700 text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFeedItem(colIdx, itemIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddFeedItem(colIdx)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 pt-0.5 cursor-pointer"
                          >
                            <Plus size={12} /> Add Sub-Component
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddRollupColumn}
                      className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-indigo-600 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus size={14} /> Add Rollup Column (e.g. CA3, Practicals)
                    </button>
                  </div>

                  {/* REAL-TIME PREVIEW SIMULATION (Section 3) */}
                  <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl space-y-3 mt-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Calculator size={16} className="text-indigo-400" />
                        <span className="font-black text-xs text-white">Live Calculation Simulator (Student: Chinedu Okafor)</span>
                      </div>
                      <span className="text-[10px] text-indigo-200/80 font-mono">Dynamic Scaling Preview</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1">
                        <span className="text-indigo-300 font-bold block">1. Raw CBT Test Score</span>
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="number"
                            value={simRawCbtScore}
                            onChange={(e) => setSimRawCbtScore(Number(e.target.value))}
                            className="w-12 px-1.5 py-0.5 bg-black/40 border border-white/20 rounded text-center text-white font-black"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            value={simRawCbtTotal}
                            onChange={(e) => setSimRawCbtTotal(Number(e.target.value))}
                            className="w-12 px-1.5 py-0.5 bg-black/40 border border-white/20 rounded text-center text-white/70 font-semibold"
                          />
                        </div>
                        <span className="text-[10px] text-cyan-300 font-mono block">
                          Scaled (10 pts): {simWeightedCbtScore} marks
                        </span>
                      </div>

                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1">
                        <span className="text-indigo-300 font-bold block">2. Teacher Theory Score</span>
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="number"
                            step="0.5"
                            value={simTheoryScore}
                            onChange={(e) => setSimTheoryScore(Number(e.target.value))}
                            className="w-12 px-1.5 py-0.5 bg-black/40 border border-white/20 rounded text-center text-white font-black"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            value={simTheoryTotal}
                            onChange={(e) => setSimTheoryTotal(Number(e.target.value))}
                            className="w-12 px-1.5 py-0.5 bg-black/40 border border-white/20 rounded text-center text-white/70 font-semibold"
                          />
                        </div>
                        <span className="text-[10px] text-amber-300 font-mono block">
                          Direct: {simTheoryScore} marks
                        </span>
                      </div>

                      <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 space-y-1 flex flex-col justify-between">
                        <span className="text-emerald-300 font-black block">CA1 Column Total</span>
                        <div className="text-lg font-black text-emerald-400">
                          {simTotalCa1} / 20.0 Marks
                        </div>
                        <span className="text-[10px] text-emerald-200/80">
                          {((simTotalCa1 / 20) * 100).toFixed(1)}% (Excellent)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STANDARD SIMPLE COMPONENTS MODE */}
              {activeTabMode === 'standard' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-black text-slate-900">Standard Components</h4>
                      <p className="text-[11px] text-slate-500">Simple flat assessment components</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-black border border-indigo-100">
                      Total: {currentTotalCalculated} Marks
                    </span>
                  </div>

                  <div className="space-y-2">
                    {components.map((comp, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Component Name</label>
                          <input
                            type="text"
                            required
                            value={comp.name}
                            onChange={(e) => {
                              const updated = [...components]
                              updated[idx].name = e.target.value
                              setComponents(updated)
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Code</label>
                          <input
                            type="text"
                            required
                            value={comp.code}
                            onChange={(e) => {
                              const updated = [...components]
                              updated[idx].code = e.target.value.toUpperCase()
                              setComponents(updated)
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 uppercase"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Max</label>
                          <input
                            type="number"
                            min={1}
                            value={comp.maxMarks}
                            onChange={(e) => {
                              const updated = [...components]
                              updated[idx].maxMarks = Number(e.target.value)
                              setComponents(updated)
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-indigo-700 text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Pass</label>
                          <input
                            type="number"
                            min={0}
                            value={comp.passMarks}
                            onChange={(e) => {
                              const updated = [...components]
                              updated[idx].passMarks = Number(e.target.value)
                              setComponents(updated)
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 text-center"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (components.length <= 1) return
                              setComponents(components.filter((_, i) => i !== idx))
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = components.length + 1
                      setComponents([
                        ...components,
                        { name: `Component ${nextNum}`, code: `CA${nextNum}`, maxMarks: 10, passMarks: 4 },
                      ])
                    }}
                    className="w-full py-2 border-2 border-dashed border-slate-200 text-indigo-600 font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Add Component Row
                  </button>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Evaluation Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMatrix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-slate-900">Delete Evaluation Matrix?</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Are you sure you want to delete <strong>{deletingMatrix.name}</strong> ({deletingMatrix.code})?
              This will remove this mark distribution scheme from the system.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingMatrix(null)}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMatrix}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
