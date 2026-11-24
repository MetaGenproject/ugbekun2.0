'use client'

import { useEffect, useState } from 'react'
import {
  Globe,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

export interface SuperadminDomainRecord {
  branchId: number
  name: string
  code?: string | null
  schoolName?: string
  subdomain: string | null
  suggestedSubdomain?: string
  subdomainUrl?: string
  customDomain: string | null
  customDomainUrl?: string | null
  domainStatus: string
  verificationToken: string
  dnsTarget: string
  sslStatus: string
  domainVerifiedAt?: string | null
  cnameMatch?: boolean
  txtMatch?: boolean
  records?: {
    cname?: string[]
    txt?: string[]
    a?: string[]
  }
  message?: string
}

interface SuperadminDomainPanelProps {
  branchId: number
  theme?: 'dark' | 'light'
  onUpdated?: (record: SuperadminDomainRecord) => void
}

export function SuperadminDomainPanel({
  branchId,
  theme = 'dark',
  onUpdated,
}: SuperadminDomainPanelProps) {
  const isDark = theme === 'dark'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [activating, setActivating] = useState(false)

  const [record, setRecord] = useState<SuperadminDomainRecord | null>(null)
  const [subdomainInput, setSubdomainInput] = useState('')
  const [customDomainInput, setCustomDomainInput] = useState('')
  const [probeResult, setProbeResult] = useState<SuperadminDomainRecord | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const loadDomain = async () => {
    setLoading(true)
    setFeedback(null)
    setProbeResult(null)
    try {
      const res = await apiSlice.get<{ success: boolean; data: SuperadminDomainRecord[] }>(
        endpoints.superadmin.domains,
        { cacheBust: true }
      )
      if (res?.success && Array.isArray(res.data)) {
        const match = res.data.find((d) => Number(d.branchId) === Number(branchId)) || null
        setRecord(match)
        setSubdomainInput(match?.subdomain || '')
        setCustomDomainInput(match?.customDomain || '')
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to load domain settings.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (branchId) loadDomain()
  }, [branchId])

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      const res = await apiSlice.put<{ success: boolean; message: string; data: SuperadminDomainRecord }>(
        endpoints.superadmin.updateDomain(branchId),
        { subdomain: subdomainInput.trim(), customDomain: customDomainInput.trim() }
      )
      if (res?.success && res.data) {
        setRecord(res.data)
        setSubdomainInput(res.data.subdomain || '')
        setCustomDomainInput(res.data.customDomain || '')
        setFeedback({ type: 'success', text: res.message || 'Domain settings saved.' })
        onUpdated?.(res.data)
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to save domain settings.' })
    } finally {
      setSaving(false)
    }
  }

  const handleVerifyDns = async () => {
    setVerifying(true)
    setFeedback(null)
    try {
      const res = await apiSlice.post<{ success: boolean; data: SuperadminDomainRecord }>(
        endpoints.superadmin.verifyDomainDns(branchId),
        { subdomain: subdomainInput.trim(), customDomain: customDomainInput.trim() }
      )
      if (res?.success && res.data) {
        setRecord(res.data)
        setProbeResult(res.data)
        setSubdomainInput(res.data.subdomain || '')
        setCustomDomainInput(res.data.customDomain || '')
        const isActive = res.data.domainStatus === 'ACTIVE'
        setFeedback({
          type: isActive ? 'success' : 'error',
          text:
            res.data.message ||
            (isActive
              ? 'DNS verified and custom domain activated!'
              : 'DNS records did not match expected CNAME/TXT target yet.'),
        })
        onUpdated?.(res.data)
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'DNS verification failed.' })
    } finally {
      setVerifying(false)
    }
  }

  const handleForceActivate = async () => {
    setActivating(true)
    setFeedback(null)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string; data: SuperadminDomainRecord }>(
        endpoints.superadmin.forceActivateDomain(branchId),
        { subdomain: subdomainInput.trim(), customDomain: customDomainInput.trim() }
      )
      if (res?.success && res.data) {
        setRecord(res.data)
        setSubdomainInput(res.data.subdomain || '')
        setCustomDomainInput(res.data.customDomain || '')
        setFeedback({ type: 'success', text: res.message || 'Domain forcefully activated and live.' })
        onUpdated?.(res.data)
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to activate domain.' })
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center gap-2 py-10 rounded-2xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}
      >
        <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
        <span className="text-xs font-semibold">Loading domain & DNS configuration...</span>
      </div>
    )
  }

  const status = record?.domainStatus || 'PENDING_VERIFICATION'
  const isActive = status === 'ACTIVE'
  const isMisconfigured = status === 'MISCONFIGURED'

  const containerCls = isDark
    ? 'space-y-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl'
    : 'space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4'

  const labelCls = isDark ? 'text-xs font-bold text-slate-300' : 'text-xs font-bold text-slate-700'
  const inputCls = isDark
    ? 'w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500'
    : 'w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

  const subCardCls = isDark
    ? 'rounded-2xl bg-slate-950/90 border border-slate-800 p-4 space-y-2.5'
    : 'rounded-xl bg-white border border-slate-200 p-3.5 space-y-2'

  const effectivePreviewSub = (subdomainInput || record?.suggestedSubdomain || '').trim()

  return (
    <div className={containerCls}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-100 text-blue-700'}`}>
            <Globe size={18} />
          </div>
          <div>
            <h3 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Custom Domain, Subdomain & DNS Verification
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Bind a dedicated domain or `.ugbekun.edu.ng` subdomain to this school portal.
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border ${
            isActive
              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
              : isMisconfigured
                ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
          }`}
        >
          {isActive ? <CheckCircle2 size={13} /> : isMisconfigured ? <AlertCircle size={13} /> : <AlertTriangle size={13} />}
          {status}
        </span>
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
            feedback.type === 'success'
              ? isDark
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedback.type === 'error'
                ? isDark
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
                : isDark
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subdomain */}
        <div className="space-y-1.5">
          <label className={labelCls}>Platform Subdomain</label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={subdomainInput}
              onChange={(e) => setSubdomainInput(e.target.value)}
              placeholder={record?.suggestedSubdomain || 'e.g. bsda'}
              className={inputCls}
            />
            <span className={`text-xs font-semibold whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              .ugbekun.edu.ng
            </span>
          </div>
          {effectivePreviewSub && (
            <a
              href={`https://${effectivePreviewSub}.ugbekun.edu.ng`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-[11px] font-semibold hover:underline ${
                isDark ? 'text-cyan-400' : 'text-blue-600'
              }`}
            >
              <span>https://{effectivePreviewSub}.ugbekun.edu.ng</span>
              <ExternalLink size={11} />
            </a>
          )}
        </div>

        {/* Custom Domain */}
        <div className="space-y-1.5">
          <label className={labelCls}>Custom Domain (Without https://)</label>
          <input
            type="text"
            value={customDomainInput}
            onChange={(e) => setCustomDomainInput(e.target.value)}
            placeholder="e.g. brytestardivineacademy.com"
            className={inputCls}
          />
          {customDomainInput.trim() && (
            <a
              href={`https://${customDomainInput.trim().replace(/^https?:\/\//i, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-[11px] font-semibold hover:underline ${
                isDark ? 'text-cyan-400' : 'text-blue-600'
              }`}
            >
              <span>https://{customDomainInput.trim().replace(/^https?:\/\//i, '')}</span>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* DNS Instructions */}
      {record && (
        <div className={subCardCls}>
          <div className={`text-xs font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            DNS Records Required for External Verification
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="min-w-0">
                <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>CNAME Target</div>
                <div className={`font-mono font-bold truncate ${isDark ? 'text-cyan-300' : 'text-slate-900'}`}>{record.dnsTarget}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('cname', record.dnsTarget)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${isDark ? 'border-slate-700 text-slate-300 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-white'}`}
                title="Copy CNAME target"
              >
                {copiedKey === 'cname' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>

            <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="min-w-0">
                <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TXT Verification Token</div>
                <div className={`font-mono font-bold truncate ${isDark ? 'text-amber-300' : 'text-slate-900'}`}>{record.verificationToken}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('txt', record.verificationToken)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${isDark ? 'border-slate-700 text-slate-300 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-white'}`}
                title="Copy TXT token"
              >
                {copiedKey === 'txt' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          {probeResult && (
            <div className={`pt-2 border-t text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-2 ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
              <div>CNAME Match: <strong className={probeResult.cnameMatch ? 'text-emerald-500' : 'text-rose-500'}>{probeResult.cnameMatch ? 'Yes' : 'No'}</strong></div>
              <div>TXT Match: <strong className={probeResult.txtMatch ? 'text-emerald-500' : 'text-rose-500'}>{probeResult.txtMatch ? 'Yes' : 'No'}</strong></div>
              <div className="truncate">A Records: <strong>{probeResult.records?.a?.join(', ') || 'None'}</strong></div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || verifying || activating}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer disabled:opacity-50 ${
            isDark
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>Save Domain</span>
        </button>

        <button
          type="button"
          onClick={handleVerifyDns}
          disabled={saving || verifying || activating || !customDomainInput.trim()}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer disabled:opacity-50 ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
          }`}
        >
          {verifying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          <span>Verify DNS</span>
        </button>

        <button
          type="button"
          onClick={handleForceActivate}
          disabled={saving || verifying || activating || (!customDomainInput.trim() && !subdomainInput.trim())}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer disabled:opacity-50"
          title="Immediately mark custom domain ACTIVE (use after PipeOps/DNS is already routed)"
        >
          {activating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          <span>Force Activate</span>
        </button>

        <span className={`ml-auto inline-flex items-center gap-1 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <ShieldCheck size={13} className="text-emerald-500" />
          SSL: {record?.sslStatus || 'PENDING'}
        </span>
      </div>
    </div>
  )
}

