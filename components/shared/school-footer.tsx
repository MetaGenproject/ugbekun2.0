'use client'

import { useSchoolBranding } from '@/lib/schoolBrandingContext'
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube
} from 'lucide-react'

export function SchoolFooter() {
  const { branding } = useSchoolBranding()

  const hasSocials = Boolean(
    branding.facebookUrl ||
    branding.instagramUrl ||
    branding.twitterUrl ||
    branding.linkedinUrl ||
    branding.youtubeUrl
  )

  const rawWhatsapp = branding.whatsappNo ? branding.whatsappNo.replace(/[^0-9]/g, '') : null

  return (
    <footer
      className="mt-6 border-t border-slate-200/80 bg-white/90 backdrop-blur-xs py-3 px-4 sm:px-6 rounded-xl shadow-2xs space-y-2.5"
      style={{ borderTop: `2px solid ${branding.primaryColor || '#0f172a'}` }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* School Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg p-0.5 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden bg-slate-50 shadow-2xs">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.schoolName}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 size={16} className="text-slate-600" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-tight">{branding.schoolName}</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">{branding.tagline}</p>
          </div>
        </div>

        {/* Quick Contact Details & Socials */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-semibold">
          {branding.phone && (
            <a href={`tel:${branding.phone}`} className="flex items-center gap-1 hover:text-slate-900 transition">
              <Phone size={13} className="text-slate-400" />
              <span>{branding.phone}</span>
            </a>
          )}
          {branding.email && (
            <a href={`mailto:${branding.email}`} className="flex items-center gap-1 hover:text-slate-900 transition">
              <Mail size={13} className="text-slate-400" />
              <span>{branding.email}</span>
            </a>
          )}
          {branding.website && (
            <a
              href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-slate-900 transition"
            >
              <Globe size={13} className="text-slate-400" />
              <span>Website</span>
            </a>
          )}
          {rawWhatsapp && (
            <a
              href={`https://wa.me/${rawWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold transition"
            >
              <MessageCircle size={13} />
              <span>WhatsApp</span>
            </a>
          )}
          {hasSocials && (
            <div className="flex items-center gap-2 ml-2 border-l border-slate-200 pl-3">
              {branding.facebookUrl && (
                <a href={branding.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:opacity-80 transition" title="Facebook">
                  <Facebook size={14} />
                </a>
              )}
              {branding.instagramUrl && (
                <a href={branding.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:opacity-80 transition" title="Instagram">
                  <Instagram size={14} />
                </a>
              )}
              {branding.twitterUrl && (
                <a href={branding.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:opacity-80 transition" title="Twitter / X">
                  <Twitter size={14} />
                </a>
              )}
              {branding.linkedinUrl && (
                <a href={branding.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:opacity-80 transition" title="LinkedIn">
                  <Linkedin size={14} />
                </a>
              )}
              {branding.youtubeUrl && (
                <a href={branding.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:opacity-80 transition" title="YouTube">
                  <Youtube size={14} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium text-slate-500 gap-1">
        <p>© {new Date().getFullYear()} {branding.schoolName}. All rights reserved.</p>
        <p className="font-semibold" style={{ color: branding.secondaryColor || '#0284c7' }}>
          Powered by Ugbekun 2.0 Management System
        </p>
      </div>
    </footer>
  )
}
