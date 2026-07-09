'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, AlertTriangle, ShieldCheck, Award, User, School, Calendar, FileText, RefreshCw } from 'lucide-react'
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

export default function VerifyPage() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VerifyResult | null>(null)

  const performVerification = async () => {
    setLoading(true)
    setError(null)
    try {
      // Direct call to public verify endpoint
      const res = await fetch(`${BASE_URL}/verify/${token}`)
      const data = await res.json()
      
      if (res.status === 404) {
        setError('This verification token is invalid or has expired.')
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

  useEffect(() => {
    if (token) {
      performVerification()
    }
  }, [token])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative z-10 animate-fade-in-up">
        {/* Portal Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-3 animate-pulse-glow">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Ugbekun Public Registry</h1>
          <p className="text-xs text-slate-400 mt-1">Secured Credential Verification Portal</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-sm text-slate-400">Verifying security token against ledger...</p>
          </div>
        )}

        {error && (
          <div className="border border-red-500/30 bg-red-950/20 rounded-xl p-6 text-center animate-scale-in">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-400">Verification Failed</h3>
            <p className="text-sm text-slate-300 mt-2">{error}</p>
            <button
              onClick={performVerification}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            >
              Retry Check
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-scale-in">
            {/* Status Indicator */}
            {result.status === 'active' ? (
              <div className="flex items-center gap-3 border border-emerald-500/30 bg-emerald-950/20 rounded-xl p-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-400 text-sm">AUTHENTIC & ACTIVE</h4>
                  <p className="text-xs text-slate-300">This credential is officially active and recognized.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 border border-red-500/30 bg-red-950/20 rounded-xl p-4">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-400 text-sm">CREDENTIAL {result.status.toUpperCase()}</h4>
                  <p className="text-xs text-slate-300">
                    {result.revokedReason ? `Reason: ${result.revokedReason}` : 'This credential has been deactivated.'}
                  </p>
                </div>
              </div>
            )}

            {/* Profile Info block */}
            <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-5 space-y-4">
              {result.type === 'id_card' ? (
                <>
                  <div className="flex items-center gap-4">
                    {result.photo ? (
                      <img
                        src={result.photo}
                        alt={result.name}
                        className="w-16 h-16 rounded-xl border border-slate-700 object-cover bg-slate-800"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{result.name}</h3>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">
                        {result.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-4 space-y-2.5 text-xs text-slate-300">
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
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 shrink-0">
                      <Award className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{result.title}</h3>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-500/20">
                        {result.certificateType?.replace('_', ' ') || 'Certificate'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-4 space-y-2.5 text-xs text-slate-300">
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
                      <div className="border-t border-slate-800/80 pt-3 mt-3">
                        <span className="text-slate-500 block mb-1">Award Citation:</span>
                        <p className="italic text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
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
