'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Users,
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Check,
  UserCheck,
  MapPin,
  Laptop,
  ShieldCheck,
  Activity
} from 'lucide-react'

export interface TeacherOption {
  id: number
  name: string
  email?: string
}

export interface ExamHallData {
  id: number
  name: string
  code: string
  capacity: number
  location?: string | null
  facilities?: string | null
  status: 'ACTIVE' | 'MAINTENANCE' | 'IN_USE'
  invigilatorId?: number | null
  invigilator?: { id: number; name: string; email?: string; phone?: string } | null
  createdAt?: string
}

export function ExamHalls() {
  const [halls, setHalls] = useState<ExamHallData[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'IN_USE'>('ALL')

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHallId, setEditingHallId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [capacity, setCapacity] = useState<number>(60)
  const [location, setLocation] = useState('')
  const [facilities, setFacilities] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'MAINTENANCE' | 'IN_USE'>('ACTIVE')
  const [invigilatorId, setInvigilatorId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Delete Confirmation Modal
  const [deletingHall, setDeletingHall] = useState<ExamHallData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const [hallsRes, staffRes] = await Promise.all([
        apiSlice.get<{ success: boolean; halls: ExamHallData[] }>(endpoints.admin.examHalls),
        apiSlice.get<{ success: boolean; data: { teachers: TeacherOption[] } }>(endpoints.admin.teachersStaff),
      ])

      if (hallsRes.success && hallsRes.halls) {
        setHalls(hallsRes.halls)
      }

      if (staffRes.success && staffRes.data?.teachers) {
        setTeachers(staffRes.data.teachers)
      }
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load exam halls.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHalls = async () => {
    try {
      const res = await apiSlice.get<{ success: boolean; halls: ExamHallData[] }>(endpoints.admin.examHalls)
      if (res.success && res.halls) {
        setHalls(res.halls)
      }
    } catch (err) {
      console.error('Failed to refetch exam halls:', err)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingHallId(null)
    setName('')
    setCode('')
    setCapacity(60)
    setLocation('')
    setFacilities('')
    setStatus('ACTIVE')
    setInvigilatorId('')
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (hall: ExamHallData) => {
    setEditingHallId(hall.id)
    setName(hall.name)
    setCode(hall.code)
    setCapacity(hall.capacity || 50)
    setLocation(hall.location || '')
    setFacilities(hall.facilities || '')
    setStatus(hall.status)
    setInvigilatorId(hall.invigilatorId ? String(hall.invigilatorId) : '')
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleSaveHall = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setModalError('Please enter a Hall Name.')
      return
    }
    if (!code.trim()) {
      setModalError('Please enter a Hall Code.')
      return
    }

    setIsSaving(true)
    setModalError(null)

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        capacity: Number(capacity) || 50,
        location: location.trim() || undefined,
        facilities: facilities.trim() || undefined,
        status,
        invigilatorId: invigilatorId ? Number(invigilatorId) : undefined,
      }

      if (editingHallId) {
        await apiSlice.put(endpoints.admin.examHallDetail(editingHallId), payload)
        setSuccessMsg('Exam Hall updated successfully.')
      } else {
        await apiSlice.post(endpoints.admin.examHalls, payload)
        setSuccessMsg('Exam Hall created successfully.')
      }

      await fetchHalls()
      setIsModalOpen(false)
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: any) {
      setModalError(err instanceof Error ? err.message : 'Failed to save exam hall.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteHall = async () => {
    if (!deletingHall) return
    setIsDeleting(true)
    try {
      await apiSlice.delete(endpoints.admin.examHallDetail(deletingHall.id))
      await fetchHalls()
      setDeletingHall(null)
      setSuccessMsg('Exam Hall deleted.')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete exam hall.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredHalls = halls.filter((hall) => {
    const matchesSearch =
      hall.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hall.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hall.location && hall.location.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'ALL' || hall.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalCapacity = halls.reduce((sum, h) => sum + (h.capacity || 0), 0)
  const activeHallsCount = halls.filter((h) => h.status === 'ACTIVE').length

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 border border-white/15">
              <Building2 size={14} className="text-blue-300" /> Examination Venues & Facilities
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Exam Hall Creation</h1>
            <p className="text-xs sm:text-sm text-blue-200/80 max-w-xl">
              Define physical examination halls, CBT labs, seating capacity limits, and assign invigilator staff.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus size={16} /> Create Exam Hall
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Exam Venues</p>
            <p className="text-2xl font-black text-slate-900">{halls.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-[#0063a6] rounded-xl border border-blue-100">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Seating Capacity</p>
            <p className="text-2xl font-black text-slate-900">{totalCapacity.toLocaleString()} Seats</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active & Ready Halls</p>
            <p className="text-2xl font-black text-emerald-600">{activeHallsCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search hall name, code, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0063a6]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'ACTIVE', 'MAINTENANCE', 'IN_USE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-[#0063a6] text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
              }`}
            >
              {st === 'ALL' ? 'All Halls' : st === 'IN_USE' ? 'In Use' : st}
            </button>
          ))}
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

      {/* Exam Hall Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
          <Loader2 size={24} className="animate-spin text-[#0063a6] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading exam halls...</p>
        </div>
      ) : filteredHalls.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
          <Building2 size={32} className="text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Exam Halls Found</p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Create New Hall
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHalls.map((hall) => {
            const statusConfig = {
              ACTIVE: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
              MAINTENANCE: { label: 'Maintenance', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
              IN_USE: { label: 'In Use', bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
            }[hall.status] || { label: hall.status, bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' }

            return (
              <div
                key={hall.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Header */}
                <div className="p-5 space-y-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                          {hall.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${statusConfig.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{hall.name}</h3>
                    </div>

                    <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-50 text-[#0063a6] border border-blue-100 shrink-0">
                      {hall.capacity} Seats
                    </span>
                  </div>

                  {hall.location && (
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <MapPin size={13} className="text-[#0063a6]" /> {hall.location}
                    </p>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-5 space-y-3 flex-1">
                  {/* Invigilator */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned Invigilator</p>
                    {hall.invigilator ? (
                      <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <UserCheck size={16} className="text-[#0063a6]" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{hall.invigilator.name}</p>
                          {hall.invigilator.phone && (
                            <p className="text-[10px] text-slate-400">{hall.invigilator.phone}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No supervisor assigned</p>
                    )}
                  </div>

                  {/* Facilities */}
                  {hall.facilities && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Facilities & Features</p>
                      <p className="text-xs text-slate-600 font-semibold bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                        {hall.facilities}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditModal(hall)}
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 size={13} /> Edit Details
                  </button>
                  <button
                    onClick={() => setDeletingHall(hall)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <Building2 size={18} /> {editingHallId ? 'Edit Exam Hall' : 'Create Exam Hall'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg text-white/80 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveHall} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-600">Hall Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CBT Centre Lab A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0063a6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Hall Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HALL-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#0063a6] uppercase"
                  />
                </div>
              </div>

              {/* Capacity & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Seating Capacity <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="50"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0063a6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Venue Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0063a6]"
                  >
                    <option value="ACTIVE">🟢 Active & Ready</option>
                    <option value="MAINTENANCE">🟡 Under Maintenance</option>
                    <option value="IN_USE">🟣 Currently In Use</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Location / Building Floor</label>
                <input
                  type="text"
                  placeholder="e.g. Block B, Ground Floor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 outline-none focus:border-[#0063a6]"
                />
              </div>

              {/* Assigned Invigilator */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Assigned Invigilator / Chief Supervisor</label>
                <select
                  value={invigilatorId}
                  onChange={(e) => setInvigilatorId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0063a6]"
                >
                  <option value="">Select Staff / Teacher (Optional)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.email ? `(${t.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Facilities */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Facilities & Features</label>
                <textarea
                  rows={3}
                  placeholder="e.g. 60 Computer Workstations, Air Conditioned, CCTV Monitored, UPS Backup"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 outline-none focus:border-[#0063a6] resize-none"
                />
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
                  className="flex-1 px-4 py-2.5 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Exam Hall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingHall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-slate-900">Delete Exam Hall?</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Are you sure you want to delete <strong>{deletingHall.name}</strong> ({deletingHall.code})?
              This will remove this venue from examination hall management.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingHall(null)}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteHall}
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
