'use client'

import Image from 'next/image'
import { Building2, Users2, GraduationCap } from 'lucide-react'

export function ImpactSection() {
  return (
    <section id="about" className="relative py-24 bg-[#060B18] text-white overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <Image
          src="/about-bg.png"
          alt="Classroom background"
          fill
          className="object-cover object-center"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Text */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20 inline-block">
              ABOUT UGBEKUN
            </span>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Empowering Education <br />
              <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                Across Africa
              </span>
            </h2>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              Ugbekun is a leading school management system designed to help schools work smarter, not harder. We are on a mission to transform education in Africa through technology by providing schools with the tools they need to manage their operations efficiently and deliver quality education.
            </p>
          </div>

          {/* Right Column: 3 White Stat Cards */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* Stat 1 */}
              <div className="bg-white/95 backdrop-blur-md border border-white/20 text-gray-900 rounded-2xl p-6 shadow-xl text-center flex flex-col items-center justify-center transform hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <Building2 size={24} />
                </div>
                <span className="text-3xl font-extrabold text-gray-900 mb-1">500+</span>
                <span className="text-sm font-bold text-gray-800">Schools</span>
                <span className="text-xs text-gray-500 mt-1">Trust Ugbekun</span>
              </div>

              {/* Stat 2 */}
              <div className="bg-white/95 backdrop-blur-md border border-white/20 text-gray-900 rounded-2xl p-6 shadow-xl text-center flex flex-col items-center justify-center transform hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Users2 size={24} />
                </div>
                <span className="text-3xl font-extrabold text-gray-900 mb-1">50,000+</span>
                <span className="text-sm font-bold text-gray-800">Users</span>
                <span className="text-xs text-gray-500 mt-1">Across Africa</span>
              </div>

              {/* Stat 3 */}
              <div className="bg-white/95 backdrop-blur-md border border-white/20 text-gray-900 rounded-2xl p-6 shadow-xl text-center flex flex-col items-center justify-center transform hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <GraduationCap size={24} />
                </div>
                <span className="text-3xl font-extrabold text-gray-900 mb-1">1M+</span>
                <span className="text-sm font-bold text-gray-800">Students</span>
                <span className="text-xs text-gray-500 mt-1">Managed Daily</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
