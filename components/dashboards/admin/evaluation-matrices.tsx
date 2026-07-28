'use client'

import { useState, useEffect } from 'react'
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
  BookOpen
} from 'lucide-react'

export interface AssessmentComponent {
  name: string
  code: string
  maxMarks: number
  passMarks: number
}

export interface EvaluationMatrixData {
  id: number
  name: string
  code: string
  description?: string | null
  totalMarks: number | string
  isDefault: boolean
  components: AssessmentComponent[]
  createdAt?: string
}

export function EvaluationMatrices() {
  const [matrices, setMatrices] = useState<EvaluationMatrixData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMatrixId, setEditingMatrixId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [totalMarks, setTotalMarks] = useState<number>(100)
  const [isDefault, setIsDefault] = useState(false)
  const [components, setComponents] = useState<AssessmentComponent[]>([
    { name: 'Continuous Assessment 1', code: 'CA1', maxMarks: 15, passMarks: 6 },
    { name: 'Continuous Assessment 2', code: 'CA2', maxMarks: 25, passMarks: 10 },
    { name: 'Terminal Examination', code: 'EXAM', maxMarks: 60, passMarks: 24 },
  ])
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
    try {
      const res = await apiSlice.get<{ success: boolean; matrices: EvaluationMatrixData[] }>(
        endpoints.admin.evaluationMatrices
      )
      if (res.success && res.matrices) {
        setMatrices(res.matrices)
      }
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load evaluation matrices.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingMatrixId(null)
    setName('')
    setCode('')
    setDescription('')
    setTotalMarks(100)
    setIsDefault(false)
    setComponents([
      { name: 'Continuous Assessment 1', code: 'CA1', maxMarks: 15, passMarks: 6 },
      { name: 'Continuous Assessment 2', code: 'CA2', maxMarks: 25, passMarks: 10 },
      { name: 'Terminal Examination', code: 'EXAM', maxMarks: 60, passMarks: 24 },
    ])
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
    setComponents(
      Array.isArray(matrix.components) && matrix.components.length > 0
        ? matrix.components
        : [{ name: 'Exam Component', code: 'EXAM', maxMarks: 100, passMarks: 40 }]
    )
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleAddComponentRow = () => {
    const nextNum = components.length + 1
    setComponents([
      ...components,
      {
        name: `Assessment Component ${nextNum}`,
        code: `CA${nextNum}`,
        maxMarks: 10,
        passMarks: 4,
      },
    ])
  }

  const handleRemoveComponentRow = (index: number) => {
    if (components.length <= 1) {
      setModalError('Evaluation matrix must have at least one component.')
      return
    }
    setComponents(components.filter((_, idx) => idx !== index))
  }

  const handleUpdateComponentField = (
    index: number,
    field: keyof AssessmentComponent,
    value: string | number
  ) => {
    const updated = [...components]
    updated[index] = {
      ...updated[index],
      [field]: field === 'maxMarks' || field === 'passMarks' ? Number(value) || 0 : value,
    }
    setComponents(updated)
  }

  const currentComponentTotal = components.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0)

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

    if (components.length === 0) {
      setModalError('At least one assessment component is required.')
      return
    }

    setIsSaving(true)
    setModalError(null)

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        totalMarks: Number(totalMarks) || 100,
        isDefault,
        components,
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
      setModalError(err instanceof Error ? err.message : 'Failed to save evaluation matrix.')
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
            <p className="text-xs sm:text-sm text-indigo-200/80 max-w-xl">
              Create, edit, and delete mark distribution matrices (CA1, CA2, Terminal Exam weights) even after creation.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus size={16} /> Create Evaluation Matrix
          </button>
        </div>
      </div>

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
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Assessment Target</p>
            <p className="text-2xl font-black text-slate-900">100 Marks</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Percent size={20} />
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600" /> {errorMsg}
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
            const matrixComponents = Array.isArray(matrix.components) ? matrix.components : []
            const calculatedTotal = matrixComponents.reduce((acc, c) => acc + (Number(c.maxMarks) || 0), 0)

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

                {/* Component Breakdown Table */}
                <div className="p-5 flex-1 space-y-3">
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Assessment Component Breakdown
                  </p>
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
                        {matrixComponents.map((c, idx) => (
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
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!matrix.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(matrix.id)}
                      className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition"
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <FileSpreadsheet size={18} /> {editingMatrixId ? 'Edit Evaluation Matrix' : 'Create Evaluation Matrix'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg text-white/80 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMatrix} className="p-6 space-y-5">
              {modalError && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Grid: Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-600">Matrix Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Secondary 40/60 Scheme"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Short Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EVAL-SS4060"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-600 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Continuous assessment split into CA1, CA2, and Final Exam"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              {/* Default Scheme Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isDefaultCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Set as default evaluation matrix for this branch
                </label>
              </div>

              {/* Assessment Components Builder Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">Mark Distribution Components</h4>
                    <p className="text-[10px] text-slate-500">Add or edit assessment weightings & pass marks</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                    currentComponentTotal === 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    Total: {currentComponentTotal} / 100 Marks
                  </span>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {components.map((comp, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 relative group">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Component Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. CA1"
                            value={comp.name}
                            onChange={(e) => handleUpdateComponentField(idx, 'name', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Code</label>
                          <input
                            type="text"
                            required
                            placeholder="CA1"
                            value={comp.code}
                            onChange={(e) => handleUpdateComponentField(idx, 'code', e.target.value.toUpperCase())}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 uppercase"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Max Marks</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={comp.maxMarks}
                            onChange={(e) => handleUpdateComponentField(idx, 'maxMarks', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-indigo-700 text-right"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Pass Marks</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            required
                            value={comp.passMarks}
                            onChange={(e) => handleUpdateComponentField(idx, 'passMarks', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 text-right"
                          />
                        </div>

                        <div className="col-span-2 flex justify-end pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveComponentRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove Component"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddComponentRow}
                  className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-indigo-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus size={14} /> Add Assessment Component Row
                </button>
              </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-slate-900">Delete Evaluation Matrix?</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Are you sure you want to delete <strong>{deletingMatrix.name}</strong> ({deletingMatrix.code})?
              This will remove this mark distribution scheme from the system.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingMatrix(null)}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMatrix}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
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
