'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Play, ShieldCheck, Zap, Headphones, Layout, TrendingUp, Clock, Globe, Users } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-[#060B18] text-white">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-8">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Smarter Schools. <br />
              <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-sky-300 bg-clip-text text-transparent">
                Stronger
              </span>{' '}
              <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-purple-400 bg-clip-text text-transparent">
                Futures.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed">
              Ugbekun is an all-in-one school management system that simplifies school operations, enhances learning, and connects schools, teachers, parents and students.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/subscribe?plan=starter"
                className="px-7 py-3.5 bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-full shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm sm:text-base"
              >
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <button 
                onClick={() => {
                  const demoSection = document.getElementById('why-us')
                  demoSection?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold rounded-full transition-all flex items-center gap-2 text-sm sm:text-base"
              >
                <span className="w-6 h-6 rounded-full border border-white/40 inline-flex items-center justify-center">
                  <Play size={12} className="fill-white translate-x-[0.5px]" />
                </span>
                Watch Demo
              </button>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs sm:text-sm font-medium text-gray-300">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-sky-400" />
                <span>Secure & Reliable</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-pink-400" />
                <span>Easy to Use</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones size={18} className="text-purple-400" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image + Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative ring */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-blue-500 to-pink-500 opacity-30 blur-lg" />
              
              <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-[#0F172A]">
                <Image
                  src="/hero-students.png"
                  alt="African students using tablet"
                  width={600}
                  height={600}
                  className="w-full h-[420px] sm:h-[480px] object-cover object-center"
                  priority
                />
              </div>

              {/* Floating Stat Overlay Card */}
              <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-white/95 backdrop-blur-md border border-white/60 text-gray-900 rounded-2xl p-4 sm:p-5 shadow-2xl max-w-[285px] sm:max-w-[320px] animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">
                        Trusted by
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full shrink-0">
                        <TrendingUp size={10} className="text-emerald-600" /> +38% MoM
                      </span>
                    </div>
                    <div className="text-base font-black text-gray-950 leading-tight mt-0.5">
                      500+ Schools
                    </div>
                    <span className="font-semibold text-gray-600 block text-xs mt-0.5">
                      Across Nigeria &amp; Growing
                    </span>
                  </div>
                </div>

                {/* Sparkline chart SVG */}
                <div className="mt-3.5 pt-2.5 border-t border-gray-100">
                  <div className="relative w-full h-11">
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox="0 0 260 52"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="hero-stat-sparkline" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.30" />
                          <stop offset="70%" stopColor="#F43F5E" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Gradient Fill under path */}
                      <path
                        d="M 8 38 C 45 38, 72 32, 105 30 C 138 28, 168 20, 200 14 C 215 11, 230 10, 246 10 L 246 48 L 8 48 Z"
                        fill="url(#hero-stat-sparkline)"
                      />
                      {/* Stroke Path */}
                      <path
                        d="M 8 38 C 45 38, 72 32, 105 30 C 138 28, 168 20, 200 14 C 215 11, 230 10, 246 10"
                        fill="none"
                        stroke="#F43F5E"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Live Glowing Anchor Dot - stationary breathing pulse (zero position shift) */}
                      <circle cx="246" cy="10" r="8" fill="#F43F5E" opacity="0.25" className="animate-pulse" />
                      <circle cx="246" cy="10" r="4.5" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium mt-1">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Active Adoption
                    </span>
                    <span className="font-semibold text-gray-700">36 States Covered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Bottom Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-8 border-t border-white/10">
          
          {/* Card 1 */}
          <div className="bg-[#0B132B]/80 border border-white/10 hover:border-blue-500/40 rounded-2xl p-6 transition-all hover:bg-[#0B132B] group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layout size={22} className="text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">All-in-One Platform</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Manage academics, communication, finance, students & more in one secure platform.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0B132B]/80 border border-white/10 hover:border-pink-500/40 rounded-2xl p-6 transition-all hover:bg-[#0B132B] group">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp size={22} className="text-pink-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Improve Performance</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Real-time insights that help schools make smarter, data-driven decisions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0B132B]/80 border border-white/10 hover:border-purple-500/40 rounded-2xl p-6 transition-all hover:bg-[#0B132B] group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock size={22} className="text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Save Time & Money</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Automate tasks, reduce paperwork and focus on what matters most—student success.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-[#0B132B]/80 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-6 transition-all hover:bg-[#0B132B] group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe size={22} className="text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Accessible Anywhere</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Cloud-based system accessible on any device, anytime, anywhere.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
