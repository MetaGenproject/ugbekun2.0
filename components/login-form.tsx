'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, Lock, User } from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { setAuthSession } from '@/lib/authSession'

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sessionEnded, setSessionEnded] = useState(false)
  const [postLoginPath, setPostLoginPath] = useState('/dashboard')
  const [tenantBranding, setTenantBranding] = useState<{
    isCustomDomain: boolean
    schoolName: string
    tagline: string
    logoUrl: string | null
    primaryColor: string
    secondaryColor: string
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('reason') === 'session') setSessionEnded(true)
    const next = params.get('next') || ''
    if (next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login')) {
      setPostLoginPath(next)
    }
  }, [])

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '')
        const host = typeof window !== 'undefined' ? window.location.hostname : ''
        const res = await fetch(`${backendUrl}/api/public/tenant/branding?domain=${host}`)
        const json = await res.json()
        if (json.success && json.data?.isCustomDomain) {
          setTenantBranding(json.data)
        }
      } catch {
        // Fall back to default
      }
    }
    fetchBranding()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Support Safari / iOS iCloud Keychain autofill by reading DOM elements if state hasn't fired onChange
    const form = e.currentTarget
    const domUsername = (form.elements.namedItem('username') as HTMLInputElement)?.value ||
                        (form.elements.namedItem('login-username') as HTMLInputElement)?.value || ''
    const domPassword = (form.elements.namedItem('password') as HTMLInputElement)?.value ||
                        (form.elements.namedItem('login-password') as HTMLInputElement)?.value || ''

    const effectiveUsername = (domUsername || username).trim()
    const effectivePassword = (domPassword || password).trim()

    if (!effectiveUsername) {
      setErrorMsg('Username is required.')
      return
    }

    if (effectiveUsername.length < 2) {
      setErrorMsg('Username must be at least 2 characters long.')
      return
    }

    if (!effectivePassword) {
      setErrorMsg('Password is required.')
      return
    }

    setIsLoading(true)
    setErrorMsg('')

    try {
      const data = await apiSlice.post(endpoints.auth.login, { username: effectiveUsername, password: effectivePassword })

      if (!data || !data.user) {
        throw new Error('Invalid credentials or empty server response.')
      }

      const receivedToken = data.token || null

      // Construct user payload for storage
      const userToStore = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
        roleName: data.user.roleName,
        legacyUserId: data.user.legacyUserId || null,
        lastLogin: data.user.lastLogin || null,
        branch: data.user.branch ? {
          id: data.user.branch.id,
          name: data.user.branch.name,
          code: data.user.branch.code,
        } : null,
      }

      // Persist user profile and token across all 5 fallback tiers (memory, localStorage, sessionStorage, cookie, window.name)
      setAuthSession(userToStore, receivedToken)

      const destination = postLoginPath || '/dashboard'

      // Client-side router navigation preserves in-memory session heap (no destructive page reload)
      try {
        router.replace(destination)
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = destination
        }
      }

      // Safety timeout: if client router does not complete within 1000ms, use top-level navigation
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          if (window.location.pathname.startsWith('/login')) {
            window.location.href = destination
          }
        }, 1000)
      }
    } catch (err: any) {
      console.error('Login error:', err)

      const friendlyMsg = err && typeof err === 'object' && err.message
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Network connection error. Is the backend server running?'

      setErrorMsg(friendlyMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-9 text-gray-900 shadow-2xl flex flex-col justify-center h-full">
      <div className="w-full space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          {tenantBranding?.logoUrl ? (
            <div className="flex justify-center mb-2">
              <img src={tenantBranding.logoUrl} alt={tenantBranding.schoolName} className="w-14 h-14 object-cover rounded-2xl border border-gray-200 shadow" />
            </div>
          ) : tenantBranding?.isCustomDomain ? (
            <div className="flex justify-center mb-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow"
                style={{ background: tenantBranding.primaryColor || '#003da5' }}
              >
                SCH
              </div>
            </div>
          ) : null}

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
            {tenantBranding?.schoolName ? `${tenantBranding.schoolName} Portal` : 'Welcome Back!'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mb-3">
            {tenantBranding?.tagline || 'Sign in to access your account'}
          </p>
          
          {/* Security Indicator */}
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] text-gray-500 font-medium">
            <Lock size={12} className="text-emerald-500" />
            <span>Secure institutional login with multi-tenant encryption.</span>
          </div>
        </div>

        {/* Session ended */}
        {sessionEnded && !errorMsg && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0 text-amber-600" />
            <p>Your session ended. Sign in again to continue.</p>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          
          {/* Username */}
          <div>
            <label htmlFor="login-username" className="block text-xs font-bold text-gray-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="login-username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[16px] sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[16px] sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            <div className="text-right mt-1.5">
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Primary Sign In Button — inline styles for old browser compat */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: isLoading
                ? 'rgba(99,102,241,0.5)'
                : 'linear-gradient(to right, #2563eb, #4f46e5, #f43f5e)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '12px',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isLoading ? 0.65 : 1,
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            {isLoading ? (
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <>
                <Lock size={14} />
                <span>Sign In</span>
              </>
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>

        {/* Footer Support Notice */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-gray-400 font-medium">
            Need help signing in? <span className="text-gray-600 font-semibold">Contact your school administrator</span>
          </p>
        </div>
      </div>
    </div>
  )
}
