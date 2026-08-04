import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Cloud, Headphones, Landmark } from 'lucide-react'
import { UgbekunLogo } from '@/components/logo'
import { SchoolSelector } from '@/components/school-selector'
import { LoginForm } from '@/components/login-form'

export const metadata: Metadata = {
  title: 'Login - Ugbekun School Management System',
  description: 'Sign in to access your Ugbekun school management portal',
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen bg-[#081026] text-white overflow-x-hidden flex flex-col justify-between">
      
      {/* Exact Match Background Campus Image with Deep Blue Vignette Overlay */}
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

        {/* Center Dual Cards Container */}
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-10">
          {/* Left: School Selector Card */}
          <div className="lg:col-span-6">
            <SchoolSelector />
          </div>

          {/* Right: Sign In Form Card */}
          <div className="lg:col-span-6">
            <LoginForm />
          </div>
        </div>

        {/* Bottom CTA: Sign Up Your School */}
        <div className="text-center mb-10">
          <p className="text-xs text-gray-300 font-medium mb-3">
            Don&apos;t have a school account?
          </p>
          <Link
            href="/subscribe?plan=starter"
            className="inline-flex items-center gap-4 px-6 py-3.5 bg-gradient-to-r from-red-500/15 via-rose-500/15 to-pink-500/15 border border-pink-500/50 hover:border-pink-500/80 rounded-2xl text-white transition-all transform hover:-translate-y-0.5 shadow-xl group max-w-md w-full justify-center"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Landmark size={20} className="text-pink-400" />
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-white block leading-tight">
                Sign Up Your School
              </span>
              <span className="text-[11px] text-gray-300">
                School sign up only
              </span>
            </div>
          </Link>
        </div>

        {/* Footer Strip */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          {/* Badges */}
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

          {/* Copyright & Metagen Badge */}
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
