'use client'

import { useEffect, useState } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { School } from 'lucide-react'

interface SchoolInfoData {
  schoolName: string
  logoUrl: string | null
  academicSession: string
  currentTerm: string
}

export function SchoolHeader() {
  const [info, setInfo] = useState<SchoolInfoData | null>(null)

  useEffect(() => {
    async function loadInfo() {
      try {
        const res = await apiSlice.get<{ success: boolean; data: SchoolInfoData }>(endpoints.admin.schoolInfo)
        if (res.data) setInfo(res.data)
      } catch (err) {
        console.error('Error fetching school info:', err)
      }
    }
    loadInfo()

    const handleUpdate = () => loadInfo()
    window.addEventListener('branch-settings-updated', handleUpdate)
    return () => window.removeEventListener('branch-settings-updated', handleUpdate)
  }, [])

  if (!info) return null

  return (
    <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {/* School Logo */}
        {info.logoUrl ? (
          <div className="w-14 h-14 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden shadow-sm">
            <img
              src={info.logoUrl}
              alt={info.schoolName}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#001a4e] text-white shadow-sm shrink-0">
            <School size={24} className="stroke-[2.5]" />
          </div>
        )}

        {/* School Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-slate-900 tracking-tight truncate">{info.schoolName}</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            {info.currentTerm} ({info.academicSession})
          </p>
        </div>
      </div>
    </div>
  )
}
