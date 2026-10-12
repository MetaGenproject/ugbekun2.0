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
  AlertCircle,
  Sparkles,
  Lock,
  AtSign,
  Save,
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

function generateQuickPassword(length = 10): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
  let pass = ''
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
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
  const [isSaving, setIsSaving] = useState(false)
  const [showRawPassword, setShowRawPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Edit fields
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchCredentials()
    } else {
      setUserData(null)
      setShowRawPassword(false)
      setShowNewPassword(false)
      setUsernameInput('')
      setPasswordInput('')
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
        endpoints.admin.userCredentials(userId, roleName)
      )
      if (res?.user) {
        setUserData(res.user)
        setUsernameInput(res.user.username || '')
        setPasswordInput('')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch user credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    const trimmedUsername = usernameInput.trim()
    const trimmedPassword = passwordInput.trim()

    if (!trimmedUsername) {
      setErrorMsg('Username cannot be empty.')
      return
    }

    if (trimmedUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.')
      return
    }

    if (trimmedPassword && trimmedPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.')
      return
    }

    setIsSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      const res = await apiSlice.post<{
        success: boolean
        message: string
        credentials: { username: string; newPassword: string; roleName: string }
      }>(endpoints.admin.resetUserPassword(userId), {
        username: trimmedUsername !== userData?.username ? trimmedUsername : undefined,
        newPassword: trimmedPassword || undefined,
        roleHint: roleName,
      })

      if (res?.success && res.credentials) {
        setSuccessMsg(res.message || 'Credentials updated successfully!')
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                username: res.credentials.username || trimmedUsername,
                rawPassword: res.credentials.newPassword || prev.rawPassword,
              }
            : null
        )
        setUsernameInput(res.credentials.username || trimmedUsername)
        setPasswordInput('')
        setShowRawPassword(true)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update credentials.')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (!isOpen) return null

  const isStudent = (userData?.roleName || roleName)?.toLowerCase() === 'student'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Create & Manage Credentials</h3>
              <p className="text-xs text-slate-400 font-medium">Set custom username & password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700 font-semibold animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-800 font-semibold animate-in fade-in">
              <ShieldCheck size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw size={24} className="animate-spin text-blue-600" />
              <p className="text-xs font-semibold">Retrieving account credentials...</p>
            </div>
          ) : (
            <>
              {/* User Profile Header Box */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-base shrink-0">
                  <User size={22} />
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
                      User ID: #{userData?.id || userId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Active Credentials Display */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Active Login Credentials
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Current Username */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Current Username</p>
                      <p className="text-xs font-mono font-bold text-slate-900 truncate mt-0.5">
                        {userData?.username || '—'}
                      </p>
                    </div>
                    {userData?.username && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(userData.username, 'username')}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer shrink-0"
                        title="Copy Username"
                      >
                        {copiedField === 'username' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Current Password */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Current Password</p>
                      <p className="text-xs font-mono font-bold text-slate-900 truncate mt-0.5">
                        {showRawPassword
                          ? userData?.rawPassword || '••••••••'
                          : '••••••••••••'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowRawPassword(!showRawPassword)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
                        title={showRawPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showRawPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      {userData?.rawPassword && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(userData.rawPassword, 'password')}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
                          title="Copy Password"
                        >
                          {copiedField === 'password' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit / Create New Credentials Form */}
              <form onSubmit={handleSaveCredentials} className="space-y-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Create / Update Credentials
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Changes apply immediately
                  </span>
                </div>

                {/* 1. Username Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <AtSign size={13} className="text-blue-600" /> New / Custom Username
                    </label>
                    {userData?.username && usernameInput !== userData.username && (
                      <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Modified
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. semilore.shotayo, semilore2026, or student reg #"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                  <p className="text-[11px] text-slate-500">
                    The student uses this handle to sign into the CBT portal or student dashboard.
                  </p>
                </div>

                {/* 2. Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Lock size={13} className="text-blue-600" /> New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password (or leave blank to keep current)"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordInput(isStudent ? 'student123' : 'password123')
                        setShowNewPassword(true)
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                      title="Set to standard student password"
                    >
                      <Sparkles size={11} /> {isStudent ? 'Standard (student123)' : 'Default (password123)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordInput(generateQuickPassword())
                        setShowNewPassword(true)
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition cursor-pointer"
                      title="Generate random secure password"
                    >
                      <RefreshCw size={11} /> Generate Random
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Saving Credentials...</span>
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        <span>Save & Apply New Credentials</span>
                      </>
                    )}
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

