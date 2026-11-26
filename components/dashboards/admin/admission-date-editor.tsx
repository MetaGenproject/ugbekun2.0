'use client'

import { useId, useState } from 'react'
import { Calendar, Check, Edit3, Loader2, X } from 'lucide-react'

function formatAdmissionDateLabel(dateKey?: string | null): string {
  if (!dateKey) return 'Not set'
  const clean = dateKey.slice(0, 10)
  const parts = clean.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return clean
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface AdmissionDateInlineEditorProps {
  value?: string | null
  studentName?: string
  onSave: (nextDate: string) => Promise<void>
}

/**
 * Explicit inline editor for a student's admission / attendance-start date.
 * Uses an explicit Save submit action (no auto-save on input change) so table browsing stays safe.
 */
export function AdmissionDateInlineEditor({
  value,
  studentName,
  onSave,
}: AdmissionDateInlineEditorProps) {
  const inputId = useId()
  const initialDate = value ? value.slice(0, 10) : ''
  const [editing, setEditing] = useState(false)
  const [draftDate, setDraftDate] = useState(initialDate)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setDraftDate(value ? value.slice(0, 10) : '')
    setError(null)
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draftDate) {
      setError('Select a valid date')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(draftDate)
      setEditing(false)
    } catch (err: any) {
      setError(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-1 min-w-[180px]">
        <label htmlFor={inputId} className="sr-only">
          Admission date for {studentName || 'student'}
        </label>
        <div className="flex items-center gap-1">
          <input
            id={inputId}
            name="admissionDate"
            type="date"
            value={draftDate}
            onChange={(e) => {
              setDraftDate(e.target.value)
              if (error) setError(null)
            }}
            required
            aria-invalid={Boolean(error)}
            className="px-2 py-1 text-[11px] font-semibold text-slate-900 bg-white border border-blue-300 rounded-lg focus:outline-2 focus:outline-blue-600"
          />
          <button
            type="submit"
            disabled={saving}
            aria-label={`Save admission date${studentName ? ` for ${studentName}` : ''}`}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition cursor-pointer"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            aria-label="Cancel editing admission date"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
        {error && (
          <span role="status" className="text-[10px] font-bold text-rose-600">
            {error}
          </span>
        )}
      </form>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 group">
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 whitespace-nowrap">
        <Calendar size={12} className="text-slate-400 shrink-0" aria-hidden="true" />
        {formatAdmissionDateLabel(value)}
      </span>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Edit admission date${studentName ? ` for ${studentName}` : ''}`}
        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
      >
        <Edit3 size={12} />
      </button>
    </div>
  )
}

