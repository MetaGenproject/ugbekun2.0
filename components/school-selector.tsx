'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronRight, Plus, Loader2 } from 'lucide-react'

interface SchoolItem {
  id: number | string
  code?: string
  name: string
  location: string
  letter: string
  color: string
  subdomain?: string | null
  customDomain?: string | null
  logoUrl?: string | null
}

export function SchoolSelector() {
  const [searchQuery, setSearchQuery] = useState('')
  const [schools, setSchools] = useState<SchoolItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadLiveSchools() {
      setIsLoading(true)
      try {
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '')
        const res = await fetch(`${backendUrl}/api/public/tenant/schools${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`)
        const json = await res.json()
        if (!isCancelled && json.success && Array.isArray(json.data)) {
          setSchools(json.data)
          if (json.data.length > 0 && !selectedSchoolId) {
            setSelectedSchoolId(json.data[0].id)
          }
        }
      } catch (err) {
        console.warn('Could not fetch live schools:', err)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      loadLiveSchools()
    }, 250)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [searchQuery])

  return (
    <div className="bg-[#0E1A42]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col justify-between h-full space-y-6">
      
      {/* Card Header */}
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1">
          Welcome!
        </h2>
        <p className="text-xs text-gray-300 font-medium">
          Select your school to continue
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search for your school..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
        />
      </div>

      {/* School Selection List */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Loader2 size={24} className="animate-spin text-sky-400" />
            <span className="text-xs font-semibold">Loading live school directory...</span>
          </div>
        ) : schools.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 space-y-2">
            <p>No registered schools found matching &ldquo;{searchQuery}&rdquo;.</p>
          </div>
        ) : (
          schools.map((school) => {
            const isSelected = selectedSchoolId === school.id
            return (
              <button
                key={school.id}
                type="button"
                onClick={() => setSelectedSchoolId(school.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-sky-400 bg-sky-500/15 shadow-lg shadow-sky-500/10'
                    : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {school.logoUrl ? (
                    <img
                      src={school.logoUrl}
                      alt={school.name}
                      className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${school.color}`}>
                      {school.letter}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-white leading-tight">
                      {school.name}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {school.location}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className={isSelected ? 'text-sky-400' : 'text-gray-400'} />
              </button>
            )
          })
        )}

        {/* My School Is Not Listed Option */}
        <a
          href="/subscribe?plan=starter"
          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 text-left transition-all duration-200 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl border border-dashed border-white/30 flex items-center justify-center text-gray-300 group-hover:text-white shrink-0">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white leading-tight">
                My school is not listed
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Register or sign up your school now
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-white" />
        </a>
      </div>

    </div>
  )
}
