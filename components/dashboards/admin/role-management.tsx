'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  ShieldCheck,
  Plus,
  Search,
  Loader2,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
  X,
  Check,
  Building2,
  Lock,
  Sparkles
} from 'lucide-react'

export interface StaffRoleItem {
  id: number | string
  roleCode: number
  name: string
  description?: string | null
  isSystem: boolean
  staffCount: number
}

export function RoleManagement() {
  const [roles, setRoles] = useState<StaffRoleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all')

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<StaffRoleItem | null>(null)

  // Form States
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Delete Confirmation State
  const [deletingRole, setDeletingRole] = useState<StaffRoleItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    setIsLoading(true)
    try {
      const res = await apiSlice.get<{ success: boolean; roles: StaffRoleItem[] }>(endpoints.admin.roles)
      if (res.success && res.roles) {
        setRoles(res.roles)
      }
    } catch (err) {
      console.error('Failed to load staff roles:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreateModal = () => {
    setRoleName('')
    setRoleDescription('')
    setModalError(null)
    setIsCreateModalOpen(true)
  }

  const handleOpenEditModal = (role: StaffRoleItem) => {
    if (role.isSystem) return
    setEditingRole(role)
    setRoleName(role.name)
    setRoleDescription(role.description || '')
    setModalError(null)
    setIsEditModalOpen(true)
  }

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim()) {
      setModalError('Role name is required.')
      return
    }

    setIsSubmitting(true)
    setModalError(null)

    try {
      if (isEditModalOpen && editingRole) {
        // Update custom role
        await apiSlice.put(endpoints.admin.roleDetail(editingRole.id), {
          name: roleName.trim(),
          description: roleDescription.trim() || undefined,
        })
      } else {
        // Create new role
        await apiSlice.post(endpoints.admin.roles, {
          name: roleName.trim(),
          description: roleDescription.trim() || undefined,
        })
      }

      await fetchRoles()
      setIsCreateModalOpen(false)
      setIsEditModalOpen(false)
      setEditingRole(null)
    } catch (err: any) {
      setModalError(err instanceof Error ? err.message : 'Failed to save staff role.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!deletingRole || deletingRole.isSystem) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await apiSlice.delete(endpoints.admin.roleDetail(deletingRole.id))
      await fetchRoles()
      setDeletingRole(null)
    } catch (err: any) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete staff role.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered Roles
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))

    if (filterType === 'system') return matchesSearch && role.isSystem
    if (filterType === 'custom') return matchesSearch && !role.isSystem
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0063a6] via-[#004d80] to-[#003659] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/15">
              <ShieldCheck size={14} className="text-blue-300" /> Administrative Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Staff Role Management</h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
              Create, configure, and assign custom staff roles tailored to your school structure.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-3 bg-white hover:bg-blue-50 text-[#0063a6] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <Plus size={16} /> Create Custom Role
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search role name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 outline-none focus:border-[#0063a6] transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Roles ({roles.length})
          </button>
          <button
            onClick={() => setFilterType('system')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              filterType === 'system' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            System Default ({roles.filter((r) => r.isSystem).length})
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              filterType === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Custom Roles ({roles.filter((r) => !r.isSystem).length})
          </button>
        </div>
      </div>

      {/* Roles Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
          <Loader2 size={24} className="animate-spin text-[#0063a6] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading staff roles catalog...</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 space-y-3">
          <ShieldCheck size={32} className="text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No staff roles found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or filter selections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  role.isSystem ? 'bg-[#0063a6]' : 'bg-purple-600'
                }`}
              />

              <div className="space-y-3 pt-1">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base group-hover:text-[#0063a6] transition">
                      {role.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Code #{role.roleCode}</span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      role.isSystem
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-purple-50 text-purple-700 border border-purple-100'
                    }`}
                  >
                    {role.isSystem ? <Lock size={10} /> : <Sparkles size={10} />}
                    {role.isSystem ? 'System Default' : 'Custom Role'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 min-h-[36px] line-clamp-2 leading-relaxed">
                  {role.description || 'Standard administrative operational role.'}
                </p>
              </div>

              {/* Footer Details */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  <Users size={13} className="text-slate-400" />
                  <span>{role.staffCount} {role.staffCount === 1 ? 'Member' : 'Members'}</span>
                </div>

                {!role.isSystem && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(role)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0063a6] rounded-lg transition"
                      title="Edit Custom Role"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingRole(role)}
                      className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition"
                      title="Delete Custom Role"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Custom Role Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="text-[#0063a6]" size={18} />
                {isEditModalOpen ? 'Edit Custom Role' : 'Create Custom Staff Role'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setIsEditModalOpen(false)
                  setEditingRole(null)
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">
                  Role Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bursar, School Nurse, IT Administrator"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0063a6] transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Role Description</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe key duties and permissions for this role..."
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0063a6] transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setIsEditModalOpen(false)
                    setEditingRole(null)
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#0063a6] hover:bg-[#003da5] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> {isEditModalOpen ? 'Update Role' : 'Create Role'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={22} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Custom Role?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <span className="font-bold text-slate-800">'{deletingRole.name}'</span>? This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingRole(null)
                  setDeleteError(null)
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRole}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
