'use client'

import { CheckCircle2, Search, Bell, Users, GraduationCap, Calendar, CreditCard, ChevronRight } from 'lucide-react'
import { UgbekunLogo } from '@/components/logo'

export function WhyUs() {
  return (
    <section id="why-us" className="py-24 bg-white border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Why Schools Love Ugbekun */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block mb-3">
                WHY SCHOOLS LOVE UGBEKUN
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Built for{' '}
                <span className="text-blue-600">Schools.</span> <br />
                Loved by{' '}
                <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                  Users.
                </span>
              </h2>
            </div>

            <div className="space-y-6">
              
              <div className="flex items-start gap-4">
                <CheckCircle2 size={22} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">User Friendly</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Simple, intuitive interface for all users.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 size={22} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Secure & Compliant</h3>
                  <p className="text-xs text-gray-600 mt-0.5">We prioritize the security and privacy of your data.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 size={22} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Customizable</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Tailored to fit the unique needs of your school.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 size={22} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Scalable</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Perfect for small schools and large institutions.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 size={22} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Excellent Support</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Our team is always ready to help you succeed.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Interactive Dashboard Mockup Frame */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl bg-gray-900 shadow-2xl p-2 sm:p-3 border border-gray-800">
              
              {/* Top window buttons */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-800/60 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] text-gray-400 font-mono ml-2">Ugbekun School Dashboard v2.0</span>
              </div>

              {/* Dashboard Content Container */}
              <div className="bg-slate-50 rounded-xl overflow-hidden text-gray-800 grid grid-cols-12 min-h-[440px]">
                
                {/* Sidebar */}
                <div className="col-span-3 bg-[#0B132B] text-gray-300 p-3 space-y-4 hidden sm:block text-xs">
                  <div className="pb-3 border-b border-white/10">
                    <UgbekunLogo size="sm" href="" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-[11px]">
                      <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-[11px] text-gray-400">
                      <span>Students</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-[11px] text-gray-400">
                      <span>Academics</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-[11px] text-gray-400">
                      <span>Attendance</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-[11px] text-gray-400">
                      <span>Examinations</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-[11px] text-gray-400">
                      <span>Finance</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-[11px] text-gray-400">
                      <span>Communication</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-[11px] text-gray-400">
                      <span>Library</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-[11px] text-gray-400">
                      <span>Transport</span>
                    </div>
                  </div>
                </div>

                {/* Main Area */}
                <div className="col-span-12 sm:col-span-9 p-4 space-y-4 bg-slate-50">
                  
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <h4 className="font-bold text-gray-900 text-sm">Dashboard</h4>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Bell size={16} className="text-gray-500" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-[10px]">MJ</div>
                        <span className="font-semibold text-gray-800 text-[11px]">Mrs. Johnson</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    
                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xl shadow-gray-200/50 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Users size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold block">1,245</span>
                        <span className="text-[9px] text-gray-400">Students</span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xl shadow-gray-200/50 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <GraduationCap size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold block">56</span>
                        <span className="text-[9px] text-gray-400">Teachers</span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xl shadow-gray-200/50 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold block">88%</span>
                        <span className="text-[9px] text-gray-400">Attendance</span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xl shadow-gray-200/50 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold block">₦4,560,000</span>
                        <span className="text-[9px] text-gray-400">Fees Collected</span>
                      </div>
                    </div>

                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-12 gap-3">
                    {/* Line chart widget */}
                    <div className="col-span-8 bg-white p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-700">Attendance Overview</span>
                        <span className="text-[9px] text-blue-600 font-semibold">Weekly</span>
                      </div>
                      <svg className="w-full h-24 text-blue-500" viewBox="0 0 300 80">
                        <path 
                          d="M 0 60 Q 40 20, 80 45 T 160 30 T 240 50 T 300 15" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5" 
                        />
                        <path 
                          d="M 0 60 Q 40 20, 80 45 T 160 30 T 240 50 T 300 15 L 300 80 L 0 80 Z" 
                          fill="currentColor" 
                          opacity="0.08" 
                        />
                      </svg>
                      <div className="flex justify-between text-[8px] text-gray-400 pt-1">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                      </div>
                    </div>

                    {/* Donut chart widget */}
                    <div className="col-span-4 bg-white p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-gray-700">Students by Class</span>
                      <div className="relative w-16 h-16 mx-auto my-1">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#2563EB" strokeWidth="4" strokeDasharray="40, 100" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#EC4899" strokeWidth="4" strokeDasharray="25, 100" strokeDashoffset="-40" />
                        </svg>
                      </div>
                      <div className="text-[8px] space-y-0.5 text-gray-500">
                        <div className="flex items-center justify-between"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-600" />JSS 1</span><span>35%</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" />JSS 2</span><span>25%</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Activities Strip */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-700 block mb-1.5">Recent Activities</span>
                      <div className="space-y-1.5 text-[9px] text-gray-600">
                        <div className="flex items-center justify-between"><span className="truncate">New student admitted</span><span className="text-gray-400">2m ago</span></div>
                        <div className="flex items-center justify-between"><span className="truncate">Fees payment received</span><span className="text-gray-400">10m ago</span></div>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-700 block mb-1.5">Upcoming Events</span>
                      <div className="space-y-1.5 text-[9px] text-gray-600">
                        <div className="flex items-center justify-between"><span className="truncate">PTA Meeting</span><span className="text-blue-600 font-semibold">Tomorrow</span></div>
                        <div className="flex items-center justify-between"><span className="truncate">Mid Term Exams</span><span className="text-gray-400">Fri, Aug 7</span></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
