'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface Branch {
  id: number
  name: string
  code: string
  logo?: string | null
}

export function SchoolHeader() {
  const [branch, setBranch] = useState<Branch | null>(null)

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('ugbekun_user') : null
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.branch) {
          setBranch(user.branch)
        }
      } catch (err) {
        console.error('Error parsing user data:', err)
      }
    }
  }, [])

  if (!branch) {
    return null
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-100/50 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {/* School Logo */}
        {branch.logo ? (
          <div className="relative h-16 w-16 flex-shrink-0">
            <Image
              src={branch.logo}
              alt={`${branch.name} logo`}
              fill
              className="object-contain"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#001a4e] shadow-sm">
            <div className="text-xl font-extrabold text-white">
              {branch.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* School Info */}
        <div className="flex-1">
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight">{branch.name}</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">School Code: {branch.code}</p>
        </div>
      </div>
    </div>
  )
}
