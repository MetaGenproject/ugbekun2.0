'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Award,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Check,
  Star,
  Layers,
  Sparkles,
  BookmarkCheck,
  Percent,
} from 'lucide-react'

export interface GradingRangeData {
  grade: string
  minScore: number
  maxScore: number
  gpaPoint?: number | null
  remark?: string | null
}

export interface GradingScaleData {
  id: number
  name: string
  code: string
  description?: string | null
  systemType: string
  maxGpa?: number | null
  passMark: number
  isDefault: boolean
  ranges: GradingRangeData[]
  createdAt?: string
}

export interface ClassOption {
  id: number
  name: string
  classNumeric?: number
}

export function GradingScales() {
  const [scales, setScales] = useState<GradingScaleData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingScaleId, setEditingScaleId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [systemType, setSystemType] = useState('PERCENTAGE')
  const [maxGpa, setMaxGpa] = useState<number>(5.0)
  const [passMark, setPassMark] = useState<number>(50)
  const [isDefault, setIsDefault] = useState(false)
  const [ranges, setRanges] = useState<GradingRangeData[]>([
    { grade: 'A', minScore: 70, maxScore: 100, gpaPoint: 5.0, remark: 'Excellent' },
    { grade: 'B', minScore: 60, maxScore: 69, gpaPoint: 4.0, remark: 'Very Good' },
    { grade: 'C', minScore: 50, maxScore: 59, gpaPoint: 3.0, remark: 'Credit' },
    { grade: 'D', minScore: 45, maxScore: 49, gpaPoint: 2.0, remark: 'Pass' },
    { grade: 'E', minScore: 40, maxScore: 44, gpaPoint: 1.0, remark: 'Fair' },
    { grade: 'F', minScore: 0, maxScore: 39, gpaPoint: 0.0, remark: 'Fail' },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Delete Confirmation Modal
  const [deletingScale, setDeletingScale] = useState<GradingScaleData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Class Allocation Modal
  const [allocatingScale, setAllocatingScale] = useState<GradingScaleData | null>(null)
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([])
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([])
  const [isAllocating, setIsAllocating] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)

  useEffect(() => {
    fetchScales()
  }, [])

  const fetchScales = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await apiSlice.get<{ success: boolean; scales: GradingScaleData[] }>(
        endpoints.admin.gradingScales
      )
      if (res.success && res.scales) {
        setScales(res.scales)
      }
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load grading scales.')
    } finally {
      setIsLoading(false)
    }
  }

  const applyPresetScheme = (type: 'waec' | 'gpa5' | 'primary' | 'cambridge') => {
    if (type === 'waec') {
      setName('WAEC / Secondary Standard Scale')
      setCode('WAEC-STD')
      setDescription('Standard 6-tier grading scale (A, B, C, D, E, F) with 50% pass mark.')
      setSystemType('PERCENTAGE')
      setMaxGpa(5.0)
      setPassMark(50)
      setRanges([
        { grade: 'A', minScore: 70, maxScore: 100, gpaPoint: 5.0, remark: 'Excellent' },
        { grade: 'B', minScore: 60, maxScore: 69, gpaPoint: 4.0, remark: 'Very Good' },
        { grade: 'C', minScore: 50, maxScore: 59, gpaPoint: 3.0, remark: 'Credit' },
        { grade: 'D', minScore: 45, maxScore: 49, gpaPoint: 2.0, remark: 'Pass' },
        { grade: 'E', minScore: 40, maxScore: 44, gpaPoint: 1.0, remark: 'Fair' },
        { grade: 'F', minScore: 0, maxScore: 39, gpaPoint: 0.0, remark: 'Fail' },
      ])
    } else if (type === 'gpa5') {
      setName('Tertiary / 5.0 GPA Scale')
      setCode('GPA5-STD')
      setDescription('Weighted 5.0 GPA grading scale with honors grade boundaries.')
      setSystemType('GPA')
      setMaxGpa(5.0)
      setPassMark(45)
      setRanges([
        { grade: 'A', minScore: 70, maxScore: 100, gpaPoint: 5.0, remark: 'First Class Honors' },
        { grade: 'B', minScore: 60, maxScore: 69, gpaPoint: 4.0, remark: 'Second Class Upper' },
        { grade: 'C', minScore: 50, maxScore: 59, gpaPoint: 3.0, remark: 'Second Class Lower' },
        { grade: 'D', minScore: 45, maxScore: 49, gpaPoint: 2.0, remark: 'Third Class' },
        { grade: 'E', minScore: 40, maxScore: 44, gpaPoint: 1.0, remark: 'Pass' },
        { grade: 'F', minScore: 0, maxScore: 39, gpaPoint: 0.0, remark: 'Fail' },
      ])
    } else if (type === 'primary') {
      setName('Primary / Basic School Scale')
      setCode('PRI-STD')
      setDescription('Descriptive grade criteria tailored for nursery and primary foundations.')
      setSystemType('PERCENTAGE')
      setMaxGpa(4.0)
      setPassMark(50)
      setRanges([
        { grade: 'Distinction', minScore: 80, maxScore: 100, gpaPoint: 4.0, remark: 'Outstanding Mastery' },
        { grade: 'Credit', minScore: 65, maxScore: 79, gpaPoint: 3.0, remark: 'High Competency' },
        { grade: 'Merit', minScore: 50, maxScore: 64, gpaPoint: 2.0, remark: 'Satisfactory Progress' },
        { grade: 'Pass', minScore: 40, maxScore: 49, gpaPoint: 1.0, remark: 'Basic Threshold' },
        { grade: 'Needs Help', minScore: 0, maxScore: 39, gpaPoint: 0.0, remark: 'Requires Attention' },
      ])
    } else if (type === 'cambridge') {
      setName('Cambridge / IGCSE Scale')
      setCode('CAMB-STD')
      setDescription('International benchmark scale ranging from A* down to Ungraded.')
      setSystemType('LETTER_GRADE')
      setMaxGpa(5.0)
      setPassMark(50)
      setRanges([
        { grade: 'A*', minScore: 90, maxScore: 100, gpaPoint: 5.0, remark: 'Star Distinction' },
        { grade: 'A', minScore: 80, maxScore: 89, gpaPoint: 4.5, remark: 'Distinction' },
        { grade: 'B', minScore: 70, maxScore: 79, gpaPoint: 4.0, remark: 'Merit' },
        { grade: 'C', minScore: 60, maxScore: 69, gpaPoint: 3.0, remark: 'Credit' },
        { grade: 'D', minScore: 50, maxScore: 59, gpaPoint: 2.0, remark: 'Pass' },
        { grade: 'E', minScore: 40, maxScore: 49, gpaPoint: 1.0, remark: 'Bare Pass' },
        { grade: 'U', minScore: 0, maxScore: 39, gpaPoint: 0.0, remark: 'Ungraded' },
      ])
    }
  }

  const handleOpenCreateModal = () => {
    setEditingScaleId(null)
    setName('')
    setCode('')
    setDescription('')
    setSystemType('PERCENTAGE')
    setMaxGpa(5.0)
    setPassMark(50)
    setIsDefault(scales.length === 0)
    setRanges([
      { grade: 'A', minScore: 70, maxScore: 100, gpaPoint: 5.0, remark: 'Excellent' },
      { grade: 'B', minScore: 60, maxScore: 69, gpaPoint: 4.0, remark: 'Very Good' },
      { grade: 'C', minScore: 50, maxScore: 59, gpaPoint: 3.0, remark: 'Credit' },
      { grade: 'D', minScore: 45, maxScore: 49, gpaPoint: 2.0, remark: 'Pass' },
      { grade: 'E', minScore: 40, maxScore: 44, gpaPoint: 1.0, remark: 'Fair' },
      { grade: 'F', minScore: 0, maxScore: 39, gpaPoint: 0.0, remark: 'Fail' },
    ])
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (scale: GradingScaleData) => {
    setEditingScaleId(scale.id)
    setName(scale.name)
    setCode(scale.code)
    setDescription(scale.description || '')
    setSystemType(scale.systemType || 'PERCENTAGE')
    setMaxGpa(Number(scale.maxGpa) || 5.0)
    setPassMark(Number(scale.passMark) || 50)
    setIsDefault(scale.isDefault)
    setRanges(scale.ranges && scale.ranges.length > 0 ? scale.ranges : [])
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleAddRange = () => {
    setRanges([
      ...ranges,
      { grade: 'N/A', minScore: 0, maxScore: 0, gpaPoint: 0, remark: '' },
    ])
  }

  const handleRemoveRange = (index: number) => {
    if (ranges.length <= 1) {
      setModalError('A grading scale must have at least one score range.')
      return
    }
    const updated = [...ranges]
    updated.splice(index, 1)
    setRanges(updated)
  }

  const handleRangeChange = (index: number, field: keyof GradingRangeData, val: any) => {
    const updated = [...ranges]
    updated[index] = {
      ...updated[index],
      [field]: field === 'minScore' || field === 'maxScore' || field === 'gpaPoint' ? Number(val) : val,
    }
    setRanges(updated)
  }

  const handleSaveScale = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!name.trim()) {
      setModalError('Please enter a scale title.')
      return
    }
    if (!code.trim()) {
      setModalError('Please enter a scale unique code.')
      return
    }
    if (ranges.length === 0) {
      setModalError('Please define at least one grade tier range.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        systemType,
        maxGpa: Number(maxGpa) || 5.0,
        passMark: Number(passMark) || 50,
        isDefault,
        ranges,
      }

      if (editingScaleId) {
        const res = await apiSlice.put<{ success: boolean; scale: GradingScaleData }>(
          endpoints.admin.gradingScaleDetail(editingScaleId),
          payload
        )
        if (res.success) {
          setSuccessMsg('Grading scale updated successfully.')
          setIsModalOpen(false)
          fetchScales()
        }
      } else {
        const res = await apiSlice.post<{ success: boolean; scale: GradingScaleData }>(
          endpoints.admin.gradingScales,
          payload
        )
        if (res.success) {
          setSuccessMsg('Grading scale created successfully.')
          setIsModalOpen(false)
          fetchScales()
        }
      }
    } catch (err: any) {
      setModalError(err instanceof Error ? err.message : 'Failed to save grading scale.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      const res = await apiSlice.post<{ success: boolean }>(
        endpoints.admin.setGradingScaleDefault(id),
        {}
      )
      if (res.success) {
        setSuccessMsg('Default grading scale updated.')
        fetchScales()
      }
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to set default scale.')
    }
  }

  const handleDeleteScale = async () => {
    if (!deletingScale) return
    setIsDeleting(true)
    try {
      const res = await apiSlice.delete<{ success: boolean }>(
        endpoints.admin.gradingScaleDetail(deletingScale.id)
      )
      if (res.success) {
        setSuccessMsg('Grading scale removed successfully.')
        setDeletingScale(null)
        fetchScales()
      }
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete grading scale.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenAssignModal = async (scale: GradingScaleData) => {
    setAllocatingScale(scale)
    setSelectedClassIds([])
    setLoadingClasses(true)
    try {
      const res = await apiSlice.get<{ success: boolean; classes?: ClassOption[]; classList?: ClassOption[] }>(
        endpoints.admin.classes
      )
      const list = res.classes || res.classList || []
      setAvailableClasses(list)
    } catch (err) {
      console.error('Failed to load classes for scale assignment:', err)
    } finally {
      setLoadingClasses(false)
    }
  }

  const handleToggleClassSelection = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    )
  }

  const handleSaveClassAllocation = async () => {
    if (!allocatingScale || selectedClassIds.length === 0) return
    setIsAllocating(true)
    try {
      const res = await apiSlice.post<{ success: boolean }>(
        endpoints.admin.assignClassGradingScale,
        {
          gradingScaleId: allocatingScale.id,
          classIds: selectedClassIds,
        }
      )
      if (res.success) {
        setSuccessMsg(`Grading scale assigned to ${selectedClassIds.length} classes.`)
        setAllocatingScale(null)
      }
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to assign grading scale to classes.')
    } finally {
      setIsAllocating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/20 text-xs font-semibold uppercase tracking-wider">
              <Award size={13} />
              Academic Standards & Evaluation
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Grading Scales & GPA Benchmarks
            </h1>
            <p className="text-blue-200/80 text-xs md:text-sm max-w-2xl leading-relaxed">
              Define score-to-grade ranges (e.g. 70-100 = A, 60-69 = B), letter marks, GPA point weights,
              and performance remarks. Seamlessly assigned across classes or applied as school-wide defaults.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer self-start md:self-auto shrink-0"
          >
            <Plus size={16} />
            <span>Create Grading Scale</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Grid of Scales */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={28} />
          <p className="text-xs text-slate-500 font-medium">Loading grading benchmarks...</p>
        </div>
      ) : scales.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Award size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Grading Scales Configured</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Create your first grading scale or load standard templates to standardize score evaluations across student report cards and score sheets.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Create New Scale
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scales.map((scale) => (
            <div
              key={scale.id}
              className={`bg-white rounded-3xl border transition shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                scale.isDefault ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Card Top */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {scale.code}
                      </span>
                      {scale.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                          <Star size={10} fill="currentColor" /> Branch Default
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{scale.name}</h3>
                    {scale.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{scale.description}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pass Benchmark</span>
                    <span className="text-base font-black text-slate-800">{scale.passMark}%</span>
                  </div>
                </div>

                {/* Score Ranges Badges */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Grade Boundaries</span>
                    <span>{scale.ranges?.length || 0} Tiers</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(scale.ranges || []).map((r, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/50 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                              r.grade.toUpperCase() === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.grade.toUpperCase() === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : r.grade.toUpperCase() === 'C'
                                ? 'bg-indigo-100 text-indigo-800'
                                : r.grade.toUpperCase() === 'D' || r.grade.toUpperCase() === 'E'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {r.grade}
                          </span>
                          <div>
                            <span className="font-mono font-bold text-slate-700">
                              {r.minScore}-{r.maxScore}%
                            </span>
                            {r.remark && (
                              <span className="block text-[10px] text-slate-400 truncate max-w-[80px]">
                                {r.remark}
                              </span>
                            )}
                          </div>
                        </div>

                        {r.gpaPoint !== null && r.gpaPoint !== undefined && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {r.gpaPoint} pts
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenAssignModal(scale)}
                    className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
                    title="Assign to Classes"
                  >
                    <BookmarkCheck size={15} />
                    <span>Assign Classes</span>
                  </button>

                  {!scale.isDefault && (
                    <button
                      onClick={() => handleSetDefault(scale.id)}
                      className="p-2 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
                      title="Set as Default Scale"
                    >
                      <Star size={15} />
                      <span>Set Default</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(scale)}
                    className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                    title="Edit Scale"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDeletingScale(scale)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Scale"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 md:p-8 my-8 relative">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingScaleId ? 'Edit Grading Scale' : 'Create Grading Scale'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure grade letters, percentage cutoffs, and GPA conversion points.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mt-5 p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600" /> Quick Presets:
              </span>
              <button
                type="button"
                onClick={() => applyPresetScheme('waec')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-100/60 border border-blue-200 text-blue-800 text-[11px] font-bold transition cursor-pointer"
              >
                WAEC / Secondary (A-F)
              </button>
              <button
                type="button"
                onClick={() => applyPresetScheme('gpa5')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-100/60 border border-blue-200 text-blue-800 text-[11px] font-bold transition cursor-pointer"
              >
                Tertiary 5.0 GPA
              </button>
              <button
                type="button"
                onClick={() => applyPresetScheme('primary')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-100/60 border border-blue-200 text-blue-800 text-[11px] font-bold transition cursor-pointer"
              >
                Primary School Standard
              </button>
              <button
                type="button"
                onClick={() => applyPresetScheme('cambridge')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-100/60 border border-blue-200 text-blue-800 text-[11px] font-bold transition cursor-pointer"
              >
                Cambridge / IGCSE (A*-U)
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveScale} className="mt-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Scale Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Standard WAEC Scale"
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Scale Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. WAEC-STD"
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">System Type</label>
                  <select
                    value={systemType}
                    onChange={(e) => setSystemType(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="GPA">Grade Point Average (GPA)</option>
                    <option value="LETTER_GRADE">Letter Grade Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pass Mark Benchmark (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={passMark}
                    onChange={(e) => setPassMark(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max GPA Weight</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={maxGpa}
                    onChange={(e) => setMaxGpa(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes on when to use this grading scale..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Score Ranges Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Grade Boundaries ({ranges.length} Tiers)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddRange}
                    className="h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus size={14} /> Add Tier
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Grade Letter</th>
                        <th className="p-3">Min %</th>
                        <th className="p-3">Max %</th>
                        <th className="p-3">GPA Point</th>
                        <th className="p-3">Performance Remark</th>
                        <th className="p-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ranges.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <input
                              type="text"
                              required
                              value={r.grade}
                              onChange={(e) => handleRangeChange(idx, 'grade', e.target.value)}
                              className="w-20 h-8 px-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 uppercase"
                              placeholder="A"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={r.minScore}
                              onChange={(e) => handleRangeChange(idx, 'minScore', e.target.value)}
                              className="w-20 h-8 px-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={r.maxScore}
                              onChange={(e) => handleRangeChange(idx, 'maxScore', e.target.value)}
                              className="w-20 h-8 px-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.1"
                              value={r.gpaPoint ?? 0}
                              onChange={(e) => handleRangeChange(idx, 'gpaPoint', e.target.value)}
                              className="w-20 h-8 px-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={r.remark || ''}
                              onChange={(e) => handleRangeChange(idx, 'remark', e.target.value)}
                              placeholder="e.g. Excellent"
                              className="w-full h-8 px-2 border border-slate-200 rounded-lg text-xs text-slate-800"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRange(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition cursor-pointer"
                              title="Remove Tier"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultScale"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isDefaultScale" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Set as school-wide branch default scale
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{editingScaleId ? 'Update Scale' : 'Save Scale'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLASS ALLOCATION MODAL */}
      {allocatingScale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Scale to Classes</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link <strong>{allocatingScale.name}</strong> to specific classes.
                </p>
              </div>
              <button
                onClick={() => setAllocatingScale(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600">
                Select the classes that should automatically evaluate student marks and report cards using this scale:
              </p>

              {loadingClasses ? (
                <div className="py-8 text-center">
                  <Loader2 className="animate-spin text-blue-600 mx-auto mb-2" size={24} />
                  <p className="text-xs text-slate-400">Loading classes...</p>
                </div>
              ) : availableClasses.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No classes found.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 p-1">
                  {availableClasses.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls.id)
                    return (
                      <div
                        key={cls.id}
                        onClick={() => handleToggleClassSelection(cls.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-900'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-bold text-xs">{cls.name}</span>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setAllocatingScale(null)}
                className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClassAllocation}
                disabled={isAllocating || selectedClassIds.length === 0}
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isAllocating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Assign to ({selectedClassIds.length}) Classes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingScale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Grading Scale?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Are you sure you want to remove <strong>{deletingScale.name}</strong>? Classes assigned to this scale will automatically fall back to the school-wide default.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingScale(null)}
                className="h-10 px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteScale}
                disabled={isDeleting}
                className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
