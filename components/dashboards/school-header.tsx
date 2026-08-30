'use client'

import { useSchoolBranding } from '@/lib/schoolBrandingContext'
import { School, MessageCircle, Globe } from 'lucide-react'

export function SchoolHeader() {
  const { branding, isLoading } = useSchoolBranding()

  if (isLoading) return null

  const rawWhatsapp = branding.whatsappNo ? branding.whatsappNo.replace(/[^0-9]/g, '') : null

  return (
    <div
      className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all"
      style={{ borderLeft: `5px solid ${branding.primaryColor || '#0f172a'}` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* School Logo */}
          {branding.logoUrl ? (
            <div className="w-14 h-14 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden shadow-2xs">
              <img
                src={branding.logoUrl}
                alt={branding.schoolName}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-sm shrink-0"
              style={{ backgroundColor: branding.primaryColor || '#0f172a' }}
            >
              <School size={24} className="stroke-[2.5]" />
            </div>
          )}

          {/* School Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-slate-900 tracking-tight truncate">{branding.schoolName}</h2>
            <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">{branding.tagline}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider"
                style={{ backgroundColor: branding.secondaryColor || '#0284c7' }}
              >
                {branding.currentTerm} ({branding.academicSession})
              </span>
            </div>
          </div>
        </div>

        {/* Action Contacts */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {branding.website && (
            <a
              href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Globe size={13} /> Website
            </a>
          )}
          {rawWhatsapp && (
            <a
              href={`https://wa.me/${rawWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
