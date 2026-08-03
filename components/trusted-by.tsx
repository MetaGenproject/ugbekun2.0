'use client'

import { ChevronRight } from 'lucide-react'

const schoolsList = [
  {
    name: 'Greensprings School',
    color: 'border-emerald-200 text-emerald-800 bg-emerald-50/50',
    iconBg: 'bg-emerald-600 text-white',
    letter: 'G',
  },
  {
    name: 'British International School',
    color: 'border-blue-200 text-blue-900 bg-blue-50/50',
    iconBg: 'bg-blue-800 text-white',
    letter: 'B',
  },
  {
    name: 'Corona Schools Trust Council',
    color: 'border-rose-200 text-rose-900 bg-rose-50/50',
    iconBg: 'bg-rose-700 text-white',
    letter: 'C',
  },
  {
    name: 'Grange School',
    color: 'border-sky-200 text-sky-900 bg-sky-50/50',
    iconBg: 'bg-sky-700 text-white',
    letter: 'G',
  },
  {
    name: 'Hallmark International School',
    color: 'border-amber-200 text-amber-900 bg-amber-50/50',
    iconBg: 'bg-amber-700 text-white',
    letter: 'H',
  },
]

export function TrustedBySection() {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-8">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500">
            TRUSTED BY LEADING SCHOOLS
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {schoolsList.map((school) => (
            <div
              key={school.name}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition hover:shadow-md ${school.color}`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${school.iconBg}`}>
                {school.letter}
              </div>
              <span>{school.name}</span>
            </div>
          ))}

          {/* And 500+ more schools button */}
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition">
            <span>And 500+ more schools</span>
            <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </section>
  )
}
