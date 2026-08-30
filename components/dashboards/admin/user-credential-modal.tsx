'use client'

import React, { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  X,
  ShieldCheck,
  User,
  AlertCircle
} from 'lucide-react'

interface UserCredentialModalProps {
  userId: number | null
  userName: string
  roleName?: string
  isOpen: boolean
  onClose: () => void
}

interface UserCredentialData {
  id: number
  username: string
  rawPassword: string
  role: number
  roleName: string
  name: string
  active: boolean
  branchId: number | null
}

export function UserCredentialModal({
  userId,
  userName,
  roleName,
  isOpen,
  onClose,
}: UserCredentialModalProps) {
  const [userData, setUserData] = useState<UserCredentialData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showRawPassword, setShowRawPassword] = useState(false)
  const [newPasswordInput, setNewPasswordInput] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchCredentials()
    } else {
      setUserData(null)
      setShowRawPassword(false)
      setNewPasswordInput('')
      setSuccessMsg(null)
      setErrorMsg(null)
    }
  }, [isOpen, userId])

  const fetchCredentials = async () => {
    if (!userId) return
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await apiSlice.get<{ success: boolean; user: UserCredentialData }>(
        endpoints.admin.userCredentials(userId)
      )
      if (res?.user) {
        setUserData(res.user)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch user credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setIsResetting(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      const res = await apiSlice.post<{
        success: boolean
        message: string
        credentials: { username: string; newPassword: string; roleName: string }
      }>(endpoints.admin.resetUserPassword(userId), {
        newPassword: newPasswordInput.trim() || undefined,
      })

      if (res?.success && res.credentials) {
        setSuccessMsg(res.message || 'Password reset successfully!')
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                rawPassword: res.credentials.newPassword,
              }
            : null
        )
        setNewPasswordInput('')
        setShowRawPassword(true)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.')
    } finally {
      setIsResetting(false)
    }
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Manage User Credentials</h3>
              <p className="text-xs text-slate-400 font-medium">View raw password & global reset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700 font-semibold">
              <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-800 font-semibold">
              <ShieldCheck size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw size={24} className="animate-spin text-blue-600" />
              <p className="text-xs font-semibold">Retrieving credentials...</p>
            </div>
          ) : (
            <>
              {/* User Summary Box */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0">
                  <User size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-slate-900 truncate">
                    {userData?.name || userName}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase tracking-wide">
                      {userData?.roleName || roleName || 'User'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium truncate">
                      ID: #{userId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raw Credentials View */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Current Account Credentials
                </label>

                {/* Username Row */}
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Username / Handle</p>
                    <p className="text-xs font-mono font-bold text-slate-900 truncate mt-0.5">
                      {userData?.username || '—'}
                    </p>
                  </div>
                  {userData?.username && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(userData.username, 'username')}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
                      title="Copy Username"
                    >
                      {copiedField === 'username' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>

                {/* Password Row */}
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Raw Password</p>
                    <p className="text-xs font-mono font-bold text-slate-900 truncate mt-0.5">
                      {showRawPassword
                        ? userData?.rawPassword || 'No raw password stored'
                        : '••••••••••••••••'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowRawPassword(!showRawPassword)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
                      title={showRawPassword ? 'Hide Password' : 'View Raw Password'}
                    >
                      {showRawPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    {userData?.rawPassword && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(userData.rawPassword, 'password')}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
                        title="Copy Password"
                      >
                        {copiedField === 'password' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Reset Section */}
              <form onSubmit={handleResetPassword} className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Global Password Reset
                </label>
                <p className="text-xs text-slate-500 leading-snug">
                  Type a custom new password or leave blank to auto-generate a secure password.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter new password (optional)"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
                  >
                    {isResetting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={14} />
                    )}
                    <span>Reset Password</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
