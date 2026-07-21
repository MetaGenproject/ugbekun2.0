'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { safeStorage } from '@/lib/safeStorage'

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Front-end Username Validation
    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      setErrorMsg('Username is required.')
      return
    }

    if (trimmedUsername.length < 2) {
      setErrorMsg('Username must be at least 2 characters long.')
      return
    }

    setIsLoading(true)
    setErrorMsg('')

    try {
      const data = await apiSlice.post(endpoints.auth.login, { username: trimmedUsername, password })

      if (!data || !data.token || !data.user) {
        throw new Error('Invalid credentials or empty server response.')
      }

      // Save token and user details to safeStorage
      safeStorage.setItem('ugbekun_token', data.token)
      safeStorage.setItem('ugbekun_user', JSON.stringify(data.user))

      // Redirect to role-based dashboard
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
    <div className="space-y-8">
      {/* Logo */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Link href="/" className="hover:opacity-80 transition duration-200">
            <Image
              src="/ugbekun-logo.png"
              alt="Ugbekun"
              width={140}
              height={45}
              className="h-12 w-auto cursor-pointer"
              priority
            />
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
        <p className="text-foreground/60 text-sm font-medium">Sign in to your school management account</p>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm animate-shake">
          <AlertCircle size={18} className="shrink-0" />
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username/Email Field */}
        <div>
          <label htmlFor="login" className="block text-sm font-semibold text-foreground mb-2">
            Username or Email
          </label>
          <input
            id="login"
            type="text"
            placeholder="username or email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition text-sm"
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition text-sm pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border border-border/50 bg-muted/30 accent-primary cursor-pointer"
            />
            <span className="text-sm text-foreground/70">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
            Forgot password?
          </Link>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 hover:shadow-md transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Removed Google Sign In as requested */}

      {/* Sign Up Link */}
      <div className="text-center pt-4 border-t border-border/30">
        <p className="text-sm text-foreground/60">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
