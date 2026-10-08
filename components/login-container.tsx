'use client'

import { useState } from 'react'
import { School, ChevronDown, ChevronUp } from 'lucide-react'
import { SchoolSelector } from '@/components/school-selector'
import { LoginForm } from '@/components/login-form'

export function LoginContainer() {
  const [showMobileSchools, setShowMobileSchools] = useState(false)

  return (
    <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch mb-8 sm:mb-10">
      {/* School Selector Card: Hidden by default on Mobile, always visible side-by-side on Desktop */}
      <div
        className={`lg:col-span-6 transition-all duration-300 ${
          showMobileSchools ? 'block order-2 lg:order-1' : 'hidden lg:block lg:order-1'
        }`}
      >
        <SchoolSelector />
      </div>

      {/* Sign In Form Card: Primary focus at the top on Mobile, right side on Desktop */}
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-none mx-auto lg:col-span-6 order-1 lg:order-2 flex flex-col space-y-4">
        <LoginForm />

        {/* Mobile-only subtle toggle button to browse schools if needed */}
        <div className="text-center lg:hidden pt-1">
          <button
            type="button"
            onClick={() => setShowMobileSchools((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sky-300 hover:text-sky-200 text-xs font-semibold border border-white/15 transition shadow-sm active:scale-98"
          >
            <School size={15} />
            <span>{showMobileSchools ? 'Hide School Directory' : 'Browse Registered Schools'}</span>
            {showMobileSchools ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
