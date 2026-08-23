'use client'

import { useState, useEffect } from 'react'
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Sliders,
  Server,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react'

interface DomainConfigData {
  branchId: number
  branchName: string
  branchCode: string
  subdomain: string
  subdomainUrl: string
  customDomain: string | null
  customDomainUrl: string | null
  domainStatus: 'ACTIVE' | 'PENDING_VERIFICATION' | 'MISCONFIGURED' | 'SSL_PROVISIONING'
  verificationToken: string
  dnsTarget: string
  sslStatus: string
  domainVerifiedAt: string | null
  dnsInstructions: {
    cname: {
      type: string
      host: string
      target: string
      ttl: string
    }
    txt: {
      type: string
      host: string
      value: string
      ttl: string
    }
  }
}

export function DomainSettingsTab() {
  const [config, setConfig] = useState<DomainConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [subdomainInput, setSubdomainInput] = useState('')
  const [customDomainInput, setCustomDomainInput] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [probeResult, setProbeResult] = useState<any | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  const getAdminToken = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('token') || ''
  }

  const fetchDomainConfig = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const token = getAdminToken()
      const res = await fetch(`${backendUrl}/api/admin/domain/config`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success && json.data) {
        setConfig(json.data)
        setSubdomainInput(json.data.subdomain || '')
        setCustomDomainInput(json.data.customDomain || '')
      } else {
        throw new Error(json.message || 'Failed to load domain config.')
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error connecting to domain service.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDomainConfig()
  }, [])

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  const handleUpdateDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setProbeResult(null)

    try {
      const token = getAdminToken()
      const res = await fetch(`${backendUrl}/api/admin/domain/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subdomain: subdomainInput,
          customDomain: customDomainInput
        })
      })

      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: 'Domain configuration updated successfully.' })
        await fetchDomainConfig()
      } else {
        throw new Error(json.message || 'Failed to update domain.')
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating domain.' })
    } finally {
      setSaving(false)
    }
  }

  const handleVerifyDns = async () => {
    setVerifying(true)
    setMessage(null)
    setProbeResult(null)

    try {
      const token = getAdminToken()
      const res = await fetch(`${backendUrl}/api/admin/domain/verify-dns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const json = await res.json()
      if (json.success && json.data) {
        setProbeResult(json.data)
        if (json.data.verified) {
          setMessage({ type: 'success', text: 'DNS verified! Your custom domain is now active with automated SSL.' })
        } else {
          setMessage({ type: 'error', text: json.data.message || 'DNS verification failed. Check records.' })
        }
        await fetchDomainConfig()
      } else {
        throw new Error(json.message || 'Verification probe failed.')
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error probing DNS records.' })
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm font-semibold">Loading domain configuration...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. DOMAIN STATUS HERO BANNER */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Globe size={14} />
              <span>Multi-Tenant Domain Infrastructure</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              School Subdomain & Custom Vanity Domain
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl">
              Connect your own custom school website address (e.g. <span className="text-cyan-300 font-mono">portal.myschool.com</span>) or use your dedicated Ugbekun platform subdomain.
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-3">
            {config?.domainStatus === 'ACTIVE' ? (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-md">
                <CheckCircle2 size={16} />
                <span>Domain Active & SSL Secured</span>
              </div>
            ) : config?.customDomain ? (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-md">
                <Clock size={16} />
                <span>DNS Verification Pending</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold shadow-md">
                <CheckCircle2 size={16} />
                <span>Platform Subdomain Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div
            className={`flex items-center space-x-3 p-4 rounded-2xl text-sm font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* 2. FORM: SUBDOMAIN & CUSTOM DOMAIN CONFIGURATION */}
      <form onSubmit={handleUpdateDomain} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Platform Subdomain */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Platform Subdomain (Zero-Config)
            </label>
            <p className="text-xs text-slate-400">
              Instant URL for student, parent, and staff access with pre-installed SSL.
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                value={subdomainInput}
                onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="schoolslug"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
              />
              <span className="text-xs text-slate-400 font-bold whitespace-nowrap">.ugbekun.edu.ng</span>
            </div>

            {config?.subdomainUrl && (
              <div className="pt-2">
                <a
                  href={config.subdomainUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>Visit: {config.subdomainUrl}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* Custom Vanity Domain */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              2. Custom School Vanity Domain (Optional)
            </label>
            <p className="text-xs text-slate-400">
              e.g. <span className="text-cyan-300 font-mono">portal.greenwoodacademy.com</span> or <span className="text-cyan-300 font-mono">sms.myschool.edu.ng</span>
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value.toLowerCase().replace(/^https?:\/\//, ''))}
                placeholder="portal.yourschool.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {config?.customDomainUrl && (
              <div className="pt-2 flex items-center justify-between">
                <a
                  href={config.customDomainUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>Visit: {config.customDomainUrl}</span>
                  <ExternalLink size={12} />
                </a>

                <span className="text-[11px] text-slate-400 font-medium">
                  Status: <strong className="text-white">{config.domainStatus}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>Save Domain Settings</span>
          </button>
        </div>
      </form>

      {/* 3. DNS CONFIGURATION INSTRUCTION CARDS (WHEN CUSTOM DOMAIN IS SPECIFIED) */}
      {config?.customDomain && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-lg font-bold text-white">DNS Configuration Instructions</h4>
              <p className="text-xs text-slate-400">
                Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, Whogohost) and add these 2 DNS records:
              </p>
            </div>

            {/* Probe Button */}
            <button
              onClick={handleVerifyDns}
              disabled={verifying}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg hover:scale-105 transition-all disabled:opacity-50"
            >
              {verifying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Verify DNS Records Now</span>
            </button>
          </div>

          {/* DNS Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Record 1: CNAME Routing */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold font-mono">
                  Record 1: CNAME
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Traffic Routing</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Host / Name:</span>
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg font-mono text-white">
                    <span>{config.dnsInstructions.cname.host}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(config.dnsInstructions.cname.host, 'cname-host')}
                      className="text-slate-400 hover:text-cyan-400 p-1"
                    >
                      {copiedKey === 'cname-host' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Value / Target:</span>
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg font-mono text-cyan-300">
                    <span>{config.dnsInstructions.cname.target}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(config.dnsInstructions.cname.target, 'cname-target')}
                      className="text-slate-400 hover:text-cyan-400 p-1"
                    >
                      {copiedKey === 'cname-target' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Record 2: TXT Verification */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold font-mono">
                  Record 2: TXT
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Domain Ownership Challenge</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Host / Name:</span>
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg font-mono text-white">
                    <span>{config.dnsInstructions.txt.host}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(config.dnsInstructions.txt.host, 'txt-host')}
                      className="text-slate-400 hover:text-cyan-400 p-1"
                    >
                      {copiedKey === 'txt-host' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">TXT Value:</span>
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg font-mono text-cyan-300 overflow-x-auto">
                    <span className="truncate mr-2">{config.dnsInstructions.txt.value}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(config.dnsInstructions.txt.value, 'txt-val')}
                      className="text-slate-400 hover:text-cyan-400 p-1 flex-shrink-0"
                    >
                      {copiedKey === 'txt-val' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Probe Diagnostics */}
          {probeResult && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-white flex items-center space-x-2">
                <Server size={14} className="text-cyan-400" />
                <span>Live Nameserver Diagnostics:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-400">
                <div>CNAME Detected: <span className="text-white">{probeResult.records?.cname?.join(', ') || 'None'}</span></div>
                <div>TXT Detected: <span className="text-white">{probeResult.records?.txt?.length || 0} records</span></div>
                <div>Status: <span className={probeResult.verified ? 'text-emerald-400' : 'text-amber-400'}>{probeResult.message}</span></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
