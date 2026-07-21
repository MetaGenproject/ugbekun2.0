'use client'

import { useState } from 'react'
import { CheckCircle2, AlertTriangle, ShieldCheck, Award, User, RefreshCw, Search } from 'lucide-react'
import { BASE_URL } from '@/lib/apiSlice'

interface VerifyResult {
  valid: boolean
  type: 'id_card' | 'certificate'
  cardNumber?: string
  certificateNo?: string
  certificateType?: string
  status: string
  name: string
  role?: string
  photo?: string
  title?: string
  description?: string
  branchName: string
  issuedAt: string
  expiresAt?: string
  revokedAt?: string
  revokedReason?: string
}

export default function VerifySearchPage() {
  const [tokenInput, setTokenInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [searched, setSearched] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const queryToken = tokenInput.trim()
    if (!queryToken) return

    setLoading(true)
    setError(null)
    setResult(null)
    setSearched(true)

    try {
      // URL encode query token in case it has slashes (e.g. CERT/MTGA/2026/0001)
      const res = await fetch(`${BASE_URL}/verify/${encodeURIComponent(queryToken)}`)
      const data = await res.json()
      
      if (res.status === 404) {
        setError('This verification token or credential number is invalid or has expired.')
      } else if (!res.ok) {
        setError(data.message || 'Verification check failed.')
      } else {
        setResult(data)
      }
    } catch (err) {
      console.error(err)
      setError('Unable to connect to verification server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative z-10 animate-fade-in-up">
        {/* Portal Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Ugbekun Public Registry</h1>
          <p className="text-xs text-slate-400 mt-1">Secured Credential Verification Portal</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleVerify} className="space-y-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Credential Token or Number</label>
            <div className="relative flex items-center bg-slate-950/80 border border-slate-800 focus-within:border-emerald-500/80 rounded-xl px-3 py-2.5 transition">
              <input
                type="text"
                placeholder="Enter Token, Card No, or Certificate No..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500 pr-8"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Verify Credential
          </button>
        </form>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-slate-400">Querying institutional ledger...</p>
          </div>
        )}

        {searched && error && !loading && (
          <div className="border border-red-500/30 bg-red-950/20 rounded-xl p-5 text-center animate-scale-in">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-red-400">Verification Failed</h3>
            <p className="text-xs text-slate-300 mt-1">{error}</p>
          </div>
        )}

        {searched && result && !loading && (
          <div className="space-y-6 animate-scale-in">
            {/* Status Indicator */}
            {result.status === 'active' ? (
              <div className="flex items-center gap-3 border border-emerald-500/30 bg-emerald-950/20 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-400 text-xs">AUTHENTIC & ACTIVE</h4>
                  <p className="text-[11px] text-slate-300">This credential is officially active and recognized.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 border border-red-500/30 bg-red-950/20 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-400 text-xs">CREDENTIAL {result.status.toUpperCase()}</h4>
                  <p className="text-[11px] text-slate-300">
                    {result.revokedReason ? `Reason: ${result.revokedReason}` : 'This credential has been deactivated.'}
                  </p>
                </div>
              </div>
            )}

            {/* Profile Info block */}
            <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-4 space-y-3">
              {result.type === 'id_card' ? (
                <>
                  <div className="flex items-center gap-3">
                    {result.photo ? (
                      <img
                        src={result.photo}
                        alt={result.name}
                        className="w-12 h-12 rounded-lg border border-slate-700 object-cover bg-slate-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">{result.name}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">
                        {result.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Card Number:</span>
                      <span className="font-semibold text-slate-200">{result.cardNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">School Branch:</span>
                      <span className="font-semibold text-slate-200">{result.branchName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date Issued:</span>
                      <span className="font-semibold text-slate-200">
                        {new Date(result.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {result.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Expires:</span>
                        <span className="font-semibold text-slate-200">
                          {new Date(result.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400 shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">{result.title}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-bold uppercase tracking-wider rounded border border-blue-500/20">
                        {result.certificateType?.replace('_', ' ') || 'Certificate'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Recipient Name:</span>
                      <span className="font-semibold text-slate-200">{result.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Certificate No:</span>
                      <span className="font-semibold text-slate-200">{result.certificateNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">School Branch:</span>
                      <span className="font-semibold text-slate-200">{result.branchName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date of Award:</span>
                      <span className="font-semibold text-slate-200">
                        {new Date(result.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {result.description && (
                      <div className="border-t border-slate-800/80 pt-2 mt-2">
                        <span className="text-slate-555 block mb-1">Award Citation:</span>
                        <p className="italic text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800 text-[11px]">
                          "{result.description}"
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="text-center mt-6 text-[10px] text-slate-500 max-w-xs leading-relaxed relative z-10">
        Ugbekun 2.0 uses cryptographic tokens to anchor institutional credentials.
        For support, contact your school administration.
      </div>
    </div>
  )
}
