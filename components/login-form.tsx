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
  const [tenantBranding, setTenantBranding] = useState<{
    isCustomDomain: boolean
    schoolName: string
    tagline: string
    logoUrl: string | null
    primaryColor: string
    secondaryColor: string
  } | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Front-end Username & Password Validation (Strip whitespace)
    const trimmedUsername = username.trim().replace(/\s+/g, '')
    const trimmedPassword = password.trim()

    if (!trimmedUsername) {
      setErrorMsg('Username is required.')
      return
    }

    if (trimmedUsername.length < 2) {
      setErrorMsg('Username must be at least 2 characters long.')
      return
    }

    if (!trimmedPassword) {
      setErrorMsg('Password is required.')
      return
    }

    setIsLoading(true)
    setErrorMsg('')

    try {
      const data = await apiSlice.post(endpoints.auth.login, { username: trimmedUsername, password: trimmedPassword })

      if (!data || !data.token || !data.user) {
        throw new Error('Invalid credentials or empty server response.')
      }

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

      // Persist auth session (writes to localStorage, sessionStorage, document.cookie & window.name)
      setAuthSession(data.token, userToStore)

      // Client-side navigation preserves memorySession (JS context stays alive — critical for old browsers)
      router.push('/dashboard')
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
    <div className="bg-white rounded-3xl p-6 sm:p-8 text-gray-900 shadow-2xl flex flex-col justify-between h-full space-y-5">
      
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

        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
          {tenantBranding?.schoolName ? `${tenantBranding.schoolName} Portal` : 'Welcome Back!'}
        </h2>
        <p className="text-xs text-gray-500 font-medium mb-3">
          {tenantBranding?.tagline || 'Sign in to access your account'}
        </p>
        
        {/* Security Indicator */}
        <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <Lock size={12} className="text-emerald-500" />
          <span>Secure institutional login with multi-tenant encryption.</span>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-medium">
          <AlertCircle size={16} className="shrink-0 text-rose-500" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Username */}
        <div>
          <label htmlFor="login-username" className="block text-xs font-bold text-gray-700 mb-1.5">
            Username
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="login-username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
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
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
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

      {/* Divider */}
      <div className="relative flex items-center justify-center my-2">
        <div className="border-t border-gray-100 w-full" />
        <span className="bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest absolute">
          OR
        </span>
      </div>

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={() => alert('Google Sign-In is configured for authorized school SSO domains.')}
        className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2.5"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Sign in with Google</span>
      </button>

    </div>
  )
}
