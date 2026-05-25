'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

export function SignupForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('2') // Default to Branch Admin (Role 2)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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
    setSuccessMsg('')

    try {
      const data = await apiSlice.post(endpoints.auth.register, {
        username: trimmedUsername,
        password,
        role: parseInt(role)
      })

      setSuccessMsg(data.message || 'Registration successful! Redirecting to login...')
      
      // Auto-redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      console.error('Registration error:', err)
      setErrorMsg(err.message || 'Network connection error. Is the backend server running?')
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
        <p className="text-foreground/60 text-sm font-medium">Join the Ugbekun school management network</p>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-center gap-3 p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-sm animate-fade-in">
          <CheckCircle size={18} className="shrink-0" />
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm animate-shake">
          <AlertCircle size={18} className="shrink-0" />
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-2">
            Desired Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Choose username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition text-sm"
          />
        </div>

        {/* Role Selector Field */}
        <div>
          <label htmlFor="role" className="block text-sm font-semibold text-foreground mb-2">
            Register As
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition text-sm bg-white cursor-pointer"
          >
            <option value="2">Branch / School Admin</option>
            <option value="3">Teacher</option>
            <option value="6">Parent / Guardian</option>
            <option value="7">Student</option>
          </select>
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

        {/* Register Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:shadow-lg transition-all duration-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Registering...
            </span>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      {/* Log In Link */}
      <div className="text-center pt-4 border-t border-border/30">
        <p className="text-sm text-foreground/60">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
