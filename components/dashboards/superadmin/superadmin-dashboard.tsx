'use client'

import { useEffect, useState } from 'react'
import { 
  School, 
  Users, 
  GraduationCap, 
  UserCheck,
  Activity, 
  Cpu, 
  Database, 
  Layers, 
  RefreshCw,
  Pencil,
  Trash2,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react'
import { AddSchoolForm } from './add-school-form'
import { EditBranchForm, type BranchDetails } from './edit-branch-form'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
  }
  activeSection?: string
}

interface PlatformStats {
  branches: number
  activeBranches: number
  students: number
  teachers: number
  parents: number
  users: number
}

function formatCount(value: number, label: string) {
  return `${value.toLocaleString()} ${label}`
}

export function SuperAdminDashboard({ user, activeSection: activeSectionProp }: DashboardProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const [branches, setBranches] = useState<BranchDetails[]>([])
  const [branchesError, setBranchesError] = useState<string | null>(null)
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)
  const [editingBranch, setEditingBranch] = useState<BranchDetails | null>(null)
  const [deletingBranch, setDeletingBranch] = useState<BranchDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const activeSection = activeSectionProp || 'overview'
  const isManageBranches = activeSection === 'manage-branches'

  const refreshBranches = async () => {
    setIsLoadingBranches(true)
    setBranchesError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; data: BranchDetails[] }>(
        endpoints.superadmin.branches
      )
      setBranches(res.data || [])
    } catch (err) {
      setBranchesError(err instanceof Error ? err.message : 'Failed to load branch list')
    } finally {
      setIsLoadingBranches(false)
    }
  }

  useEffect(() => {
    if (isManageBranches) {
      refreshBranches()
    }
  }, [isManageBranches])

  const handleDeleteBranch = async () => {
    if (!deletingBranch) return
    setIsDeleting(true)
    setActionMessage(null)
    try {
      const res = await apiSlice.delete<{ success: boolean; message: string }>(
        endpoints.superadmin.branch(deletingBranch.id)
      )
      setActionMessage(res.message || 'Branch deleted.')
      setDeletingBranch(null)
      await refreshBranches()
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to delete branch')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(format)
    setActionMessage(null)
    try {
      const stamp = new Date().toISOString().slice(0, 10)
      if (format === 'csv') {
        await apiSlice.download(endpoints.superadmin.exportCsv, `ugbekun-branches-${stamp}.csv`)
      } else {
        await apiSlice.download(endpoints.superadmin.exportPdf, `ugbekun-branches-${stamp}.pdf`)
      }
      setActionMessage(`Branch list exported as ${format.toUpperCase()}.`)
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : `Failed to export ${format.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      setIsLoadingStats(true)
      setStatsError(null)
      try {
        const res = await apiSlice.get<{ success: boolean; data: PlatformStats }>(
          endpoints.superadmin.stats
        )
        if (!cancelled) setStats(res.data)
      } catch (err) {
        if (!cancelled) {
          setStatsError(err instanceof Error ? err.message : 'Failed to load stats')
        }
      } finally {
        if (!cancelled) setIsLoadingStats(false)
      }
    }

    loadStats()
    return () => { cancelled = true }
  }, [])

  const statCards = [
    {
      label: 'Tenant Branches',
      value: isLoadingStats ? '…' : formatCount(stats?.activeBranches ?? 0, 'Active'),
      sub: stats ? `${stats.branches.toLocaleString()} total` : null,
      icon: School,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      label: 'Students',
      value: isLoadingStats ? '…' : formatCount(stats?.students ?? 0, 'Enrolled'),
      icon: GraduationCap,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      label: 'Teachers',
      value: isLoadingStats ? '…' : formatCount(stats?.teachers ?? 0, 'Active'),
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Parents / Guardians',
      value: isLoadingStats ? '…' : formatCount(stats?.parents ?? 0, 'Registered'),
      sub: stats ? `${stats.users.toLocaleString()} platform logins` : null,
      icon: Users,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ]

  const activities = [
    { desc: 'Legacy branch, student, teacher and parent data imported from ugbekunc_Saas SQL dumps', time: 'Synced' },
    { desc: `Superadmin "${user.username}" viewing live platform statistics`, time: 'Now' },
    { desc: 'Global database query performance optimizations applied', time: '2 hours ago' },
  ]

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 space-y-2.5">
          <span className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-full border border-blue-100 shadow-sm inline-block">
            Academic Year 2026
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            SaaS Platform Superadmin
          </h1>
          <p className="text-slate-500 text-sm max-w-xl font-medium">
            Role 1 · Single master account — global control across all Ugbekun school tenants.
          </p>
        </div>
      </div>

      {isManageBranches ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Manage Branches</h2>
              <p className="text-sm text-slate-500">Browse, edit, export, or remove tenant school branches.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting !== null || branches.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-semibold text-sm transition"
              >
                {exporting === 'csv' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                Export CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null || branches.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-semibold text-sm transition"
              >
                {exporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Export PDF
              </button>
              <button
                onClick={() => setIsAddOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-extrabold text-sm shadow-sm shadow-blue-500/20"
              >
                Add School / Branch
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 font-medium">
              {actionMessage}
            </div>
          )}

          {branchesError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
              Could not load branch list: {branchesError}
            </div>
          )}

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm overflow-x-auto">
            {isLoadingBranches ? (
              <div className="p-8 text-center text-slate-500">Loading branches...</div>
            ) : branches.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No branches found yet. Add a new school branch to begin.</div>
            ) : (
              <Table className="border-separate border-spacing-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Parents</TableHead>
                    <TableHead>Teachers</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Branch Admin</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-semibold text-slate-900">{branch.name}</TableCell>
                      <TableCell>{branch.code || '—'}</TableCell>
                      <TableCell>{branch.students.toLocaleString()}</TableCell>
                      <TableCell>{branch.parents.toLocaleString()}</TableCell>
                      <TableCell>{branch.teachers.toLocaleString()}</TableCell>
                      <TableCell>{branch.staff.toLocaleString()}</TableCell>
                      <TableCell>{branch.adminName || '—'}</TableCell>
                      <TableCell>{[branch.city, branch.state].filter(Boolean).join(', ') || branch.address || '—'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${branch.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {branch.active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingBranch(branch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-700 text-xs font-semibold transition"
                            title="Edit branch"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingBranch(branch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                            title="Delete branch"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>{branches.length} branch{branches.length === 1 ? '' : 'es'} displayed.</TableCaption>
              </Table>
            )}
          </div>
        </>
      ) : (
        <>
          {statsError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
              Could not load live stats: {statsError}. Run the legacy import script if the database is empty.
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-extrabold text-sm shadow-sm shadow-blue-500/20"
            >
              Add School / Branch
            </button>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((stat, idx) => {
              const IconComp = stat.icon
              return (
                <div 
                  key={idx} 
                  className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition duration-300 flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{stat.value}</p>
                    {stat.sub && (
                      <p className="text-[11px] font-semibold text-slate-400">{stat.sub}</p>
                    )}
                  </div>
                  <div className={`p-3.5 rounded-xl border ${stat.color} transition duration-300 group-hover:scale-105 shadow-sm`}>
                    <IconComp size={20} className="stroke-[2.5]" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Activities & Health */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Recent Platform Activities</h3>
              </div>
              <div className="space-y-3.5">
                {activities.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm hover:bg-slate-100/50 transition">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="flex-1 flex flex-col sm:flex-row sm:justify-between gap-1.5">
                      <p className="text-sm font-semibold text-slate-700">{act.desc}</p>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Diagnostic */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">SaaS System Health</h3>
              </div>
              <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Connection Link Statuses</p>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <Database size={16} className="text-blue-500" />
                    Postgres Link
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">Online</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <Layers size={16} className="text-violet-500" />
                    Redis Caching
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">Connected</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <RefreshCw size={16} className="text-amber-500 animate-spin" />
                    ETL Scheduler
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border-blue-100 rounded-full shadow-sm">Active</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isAddOpen && (
        <AddSchoolForm
          onClose={() => setIsAddOpen(false)}
          onAdded={() => {
            setIsAddOpen(false)
            if (isManageBranches) {
              refreshBranches()
            }
          }}
        />
      )}

      {editingBranch && (
        <EditBranchForm
          branch={editingBranch}
          onClose={() => setEditingBranch(null)}
          onSaved={(updated) => {
            setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
            setActionMessage(`Branch "${updated.name}" updated successfully.`)
          }}
        />
      )}

      <AlertDialog open={!!deletingBranch} onOpenChange={(open) => !open && !isDeleting && setDeletingBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete branch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deletingBranch?.name}</strong> and all tenant-scoped
              students, parents, teachers, and subscriptions linked to this branch. Branch admin logins
              for this school will be deactivated. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteBranch()
              }}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Branch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
