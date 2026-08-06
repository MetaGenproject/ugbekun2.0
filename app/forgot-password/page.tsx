'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  KeyRound, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Cloud, 
  Headphones, 
  Loader2 
} from 'lucide-react'
import { UgbekunLogo } from '@/components/logo'
import { apiSlice, endpoints } from '@/lib/apiSlice'

export default function ForgotPasswordPage() {
  const router = useRouter()

  // Step state: 1 = Request Code, 2 = Verify Code & Reset, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Form input states
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // System states
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [demoCode, setDemoCode] = useState('')

  // Handle Step 1: Request Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const input = emailOrUsername.trim()
    if (!input) {
      setErrorMsg('Please enter your username or email address.')
      return
    }

    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const data = await apiSlice.post<{ success: boolean; message: string; demoCode?: string }>(
        endpoints.auth.forgotPassword,
        { emailOrUsername: input }
      )

      if (data.success) {
        setSuccessMsg(data.message || 'Reset code sent! Check your inbox.')
        if (data.demoCode) {
          setDemoCode(data.demoCode)
        }
        setStep(2)
      } else {
        throw new Error(data.message || 'Failed to send reset code.')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Account not found or network connection error.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = resetCode.trim()
    const pass = newPassword.trim()
    const confirm = confirmPassword.trim()

    if (!code) {
      setErrorMsg('Verification code is required.')
      return
    }
    if (!pass) {
      setErrorMsg('New password is required.')
      return
    }
    if (pass.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.')
      return
    }
    if (pass !== confirm) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const data = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.auth.resetPassword,
        {
          emailOrUsername: emailOrUsername.trim(),
          token: code,
          newPassword: pass,
        }
      )

      if (data.success) {
        setSuccessMsg(data.message || 'Password successfully updated!')
        setStep(3)
      } else {
        throw new Error(data.message || 'Password reset failed.')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Incorrect verification code or expired token.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-[#081026] text-white overflow-x-hidden flex flex-col justify-between">
      
      {/* Background Campus Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-bg.png"
          alt="School Campus Background"
          fill
          className="object-cover object-center opacity-100 filter brightness-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#081026]/35 via-[#0B1536]/25 to-[#081026]/45" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col justify-between">
        
        {/* Top Centered Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <UgbekunLogo size="lg" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-300 tracking-wide">
            Empowering Schools. Connecting Communities. Building Futures.
          </p>
        </div>

        {/* Center Card */}
        <div className="max-w-md mx-auto w-full my-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 text-gray-900 shadow-2xl border border-gray-100 space-y-6">
            
            {/* Step 1: Request Code */}
            {step === 1 && (
              <>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <KeyRound size={28} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Forgot Password?
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    No worries! Enter your username or email address below to receive a 6-digit reset code.
                  </p>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-medium">
                    <AlertCircle size={16} className="shrink-0 text-rose-500" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Username or Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter username or email"
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500 hover:from-blue-700 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <span>Send Reset Code</span>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                    <ArrowLeft size={14} />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </>
            )}

            {/* Step 2: Verification Code & New Password */}
            {step === 2 && (
              <>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Lock size={28} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Reset Password
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Enter the 6-digit code sent to your account and choose a new password.
                  </p>
                </div>

                {successMsg && (
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    <p>{successMsg}</p>
                    {demoCode && (
                      <p className="mt-1 text-[11px] font-mono text-emerald-800">
                        Verification Code: <strong>{demoCode}</strong>
                      </p>
                    )}
                  </div>
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-medium">
                    <AlertCircle size={16} className="shrink-0 text-rose-500" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      6-Digit Reset Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 849204"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono font-bold text-sm tracking-widest text-gray-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Create new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Retype new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500 hover:from-blue-700 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <span>Reset Password & Sign In</span>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-gray-500 hover:underline"
                  >
                    Resend code or change account
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Success Screen */}
            {step === 3 && (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={36} />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    Password Reset!
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Your account password has been updated successfully.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all block text-center"
                >
                  Sign In Now
                </Link>
              </div>
            )}

          </div>
        </div>

        {/* Footer Strip */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-sky-400" />
              <span>Secure & Reliable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cloud size={16} className="text-sky-400" />
              <span>Cloud Based</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Headphones size={16} className="text-purple-400" />
              <span>24/7 Support</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
            <span>© 2026 Ugbekun School Management System. All rights reserved.</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span>Powered by Metagen Project</span>
              <div className="w-5 h-5 rounded bg-gradient-to-r from-blue-600 to-pink-600 flex items-center justify-center text-white font-bold text-[10px]">
                M
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
