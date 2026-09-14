'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarRange,
  Star,
  X,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

interface AcademicSessionItem {
  id: number
  name: string
  isCurrent: boolean
  createdAt?: string
  updatedAt?: string | null
}

interface AcademicSessionResponse {
  success: boolean
  currentTerm?: string
  terms?: string[]
  sessions: AcademicSessionItem[]
  message?: string
}

const FALLBACK_TERMS = ['First Term', 'Second Term', 'Third Term']

export function AcademicSessionManager() {
  const [sessions, setSessions] = useState<AcademicSessionItem[]>([])
  const [terms, setTerms] = useState<string[]>(FALLBACK_TERMS)
  const [currentTerm, setCurrentTerm] = useState('First Term')
  const [loading, setLoading] = useState(true)
  const [savingTerm, setSavingTerm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicSessionItem | null>(null)
  const [name, setName] = useState('')
  const [makeCurrent, setMakeCurrent] = useState(false)
  const [formTerm, setFormTerm] = useState('First Term')
  const [submitting, setSubmitting] = useState(false)

  const [deleting, setDeleting] = useState<AcademicSessionItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const flash = (message: string, kind: 'ok' | 'err') => {
    if (kind === 'ok') {
      setSuccess(message)
      setError(null)
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(message)
      setSuccess(null)
    }
  }

  const loadSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<AcademicSessionResponse>(endpoints.admin.academicSessions)
      if (res.success) {
        setSessions(res.sessions || [])
        setTerms(res.terms?.length ? res.terms : FALLBACK_TERMS)
        if (res.currentTerm) setCurrentTerm(res.currentTerm)
      } else {
        flash(res.message || 'Failed to load academic sessions.', 'err')
      }
    } catch (err: any) {
      flash(err.message || 'Failed to load academic sessions.', 'err')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setMakeCurrent(sessions.length === 0)
    setFormTerm(currentTerm)
    setIsModalOpen(true)
  }

  const openEdit = (session: AcademicSessionItem) => {
    setEditing(session)
    setName(session.name)
    setMakeCurrent(session.isCurrent)
    setFormTerm(currentTerm)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      flash('Session name is required.', 'err')
      return
    }

    setSubmitting(true)
    try {
      if (editing) {
        await apiSlice.put(endpoints.admin.academicSession(editing.id), {
          name: name.trim(),
          isCurrent: makeCurrent,
          currentTerm: formTerm,
        })
        flash('Academic session updated.', 'ok')
      } else {
        await apiSlice.post(endpoints.admin.academicSessions, {
          name: name.trim(),
          isCurrent: makeCurrent,
          currentTerm: formTerm,
        })
        flash('Academic session created.', 'ok')
      }
      setIsModalOpen(false)
      await loadSessions()
    } catch (err: any) {
      flash(err.message || 'Failed to save academic session.', 'err')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetCurrent = async (session: AcademicSessionItem) => {
    try {
      await apiSlice.put(endpoints.admin.setCurrentAcademicSession(session.id), {
        currentTerm,
      })
      flash(`${session.name} is now the current session.`, 'ok')
      await loadSessions()
    } catch (err: any) {
      flash(err.message || 'Failed to set current session.', 'err')
    }
  }

  const handleSaveTerm = async () => {
    const current = sessions.find((session) => session.isCurrent)
    if (!current) {
      flash('Create and set a current session first.', 'err')
      return
    }
    setSavingTerm(true)
    try {
      await apiSlice.put(endpoints.admin.setCurrentAcademicSession(current.id), {
        currentTerm,
      })
      flash('Current term updated.', 'ok')
      await loadSessions()
    } catch (err: any) {
      flash(err.message || 'Failed to update current term.', 'err')
    } finally {
      setSavingTerm(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      await apiSlice.delete(endpoints.admin.academicSession(deleting.id))
      flash('Academic session deleted.', 'ok')
      setDeleting(null)
      await loadSessions()
    } catch (err: any) {
      flash(err.message || 'Failed to delete academic session.', 'err')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <CalendarRange size={18} className="text-slate-700" /> Academic Sessions
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Create, update, and delete sessions. Set the current session and term used across the school.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            <Plus size={14} /> New Session
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Current term</label>
            <select
              value={currentTerm}
              onChange={(e) => setCurrentTerm(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-bold"
            >
              {terms.map((term) => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSaveTerm}
            disabled={savingTerm}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
          >
            {savingTerm ? <Loader2 size={14} className="animate-spin" /> : 'Save current term'}
          </button>
        </div>

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 size={14} /> {success}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center space-y-2">
            <Loader2 size={22} className="animate-spin text-slate-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading academic sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm font-bold text-slate-700">No academic sessions yet</p>
            <p className="text-xs text-slate-500">Create the first session, for example 2026/2027.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="py-2 pr-3 font-bold">Session</th>
                  <th className="py-2 pr-3 font-bold">Status</th>
                  <th className="py-2 pr-3 font-bold">Created</th>
                  <th className="py-2 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-3 font-extrabold text-slate-900">{session.name}</td>
                    <td className="py-3 pr-3">
                      {session.isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">
                          <Star size={11} /> Current
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">Inactive</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-slate-500 font-medium">
                      {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!session.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleSetCurrent(session)}
                            className="px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 font-bold"
                          >
                            Set current
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(session)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                          title="Edit session"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(session)}
                          disabled={session.isCurrent}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 disabled:opacity-30"
                          title={session.isCurrent ? 'Cannot delete the current session' : 'Delete session'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-black text-slate-900">
                {editing ? 'Edit Academic Session' : 'Create Academic Session'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Session name <span className="text-rose-500">*</span></label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 2026/2027"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Term if set as current</label>
                <select
                  value={formTerm}
                  onChange={(e) => setFormTerm(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  {terms.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={makeCurrent}
                  onChange={(e) => setMakeCurrent(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Set as current academic session
              </label>
            </div>
            <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-50">
                {submitting ? 'Saving...' : editing ? 'Update session' : 'Create session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete academic session?</h3>
              <p className="text-xs text-slate-500">
                Delete <span className="font-bold text-slate-800">{deleting.name}</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleting(null)} className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={isDeleting} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
