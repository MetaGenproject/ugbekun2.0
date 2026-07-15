'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, Loader2, ShieldCheck, HelpCircle } from 'lucide-react'
import { endpoints } from '@/lib/apiSlice'

export function BranchSettings() {
  const [weeklyMintLimit, setWeeklyMintLimit] = useState<number>(5000)
  const [termStartDate, setTermStartDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadConfig = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('ugbekun_token') || localStorage.getItem('token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch(`${endpoints.health.replace('/health', '')}/admin/gamification/config`, {
        headers
      })
      const data = await res.json()
      if (data.success && data.config) {
        setWeeklyMintLimit(data.config.weeklyMintLimit)
        if (data.config.termStartDate) {
          setTermStartDate(new Date(data.config.termStartDate).toISOString().split('T')[0])
        }
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Failed to load branch gamification settings.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const token = localStorage.getItem('ugbekun_token') || localStorage.getItem('token')
      const res = await fetch(`${endpoints.health.replace('/health', '')}/admin/gamification/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          weeklyMintLimit,
          termStartDate: termStartDate || null
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save settings.' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error saving gamification configuration.' })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Loading Branch Settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Settings size={20} className="text-blue-600" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Gamification Engine Setup</h3>
            <p className="text-xs text-slate-400 mt-0.5">Control the weekly point minting budgets and timeline triggers.</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                Weekly Point Mint Limit
                <span className="cursor-help" title="Maximum positive points that can be awarded in this branch each week.">
                  <HelpCircle size={14} className="text-slate-400" />
                </span>
              </label>
              <input
                type="number"
                min={0}
                value={weeklyMintLimit}
                onChange={(e) => setWeeklyMintLimit(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                Term Start Date
                <span className="cursor-help" title="Used to check timeliness of term-start tasks like lesson plans.">
                  <HelpCircle size={14} className="text-slate-400" />
                </span>
              </label>
              <input
                type="date"
                value={termStartDate}
                onChange={(e) => setTermStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Double-Sided Ledger Safeguard</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                All transactions are verified against the weekly mint limit. If a teacher or student action would exceed this limit, the system pauses minting to prevent inflation until settings are adjusted or the week rolls over.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Save Configuration Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
