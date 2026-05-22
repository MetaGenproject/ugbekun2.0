'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/ugbekun-logo.png"
            alt="Ugbekun"
            width={140}
            height={45}
            className="h-12 w-auto"
          />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
        <p className="text-foreground/60 text-sm">Sign in to your school management account</p>
      </div>

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
            placeholder="username or email@school.edu"
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
          className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:shadow-lg transition-all duration-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/30" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-background text-foreground/60">Or continue with</span>
        </div>
      </div>

      {/* Social Login Options */}
      <div className="grid grid-cols-2 gap-3">
        <button className="px-4 py-3 border border-border/50 rounded-lg hover:bg-muted/50 transition text-sm font-medium text-foreground flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
        <button className="px-4 py-3 border border-border/50 rounded-lg hover:bg-muted/50 transition text-sm font-medium text-foreground flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </button>
      </div>

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
