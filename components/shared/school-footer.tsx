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
    <footer className="w-full mt-auto bg-gradient-to-r from-[#0b1739] via-[#091436] to-[#040c21] border-t border-blue-900/60 px-6 py-4 text-white shadow-xl font-sans">
      <div className="max-w-[1440px] mx-auto space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* School Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl p-0.5 flex items-center justify-center border border-white/20 shrink-0 overflow-hidden bg-white/10 backdrop-blur-md shadow-xs">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.schoolName}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <Building2 size={18} className="text-cyan-300" />
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white leading-tight tracking-wide">{branding.schoolName}</h4>
              <p className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">{branding.tagline}</p>
            </div>
          </div>

          {/* Quick Contact Details & Socials */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-200 font-semibold">
            {branding.phone && (
              <a href={`tel:${branding.phone}`} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white transition">
                <Phone size={13} className="text-cyan-400" />
                <span>{branding.phone}</span>
              </a>
            )}
            {branding.email && (
              <a href={`mailto:${branding.email}`} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white transition">
                <Mail size={13} className="text-cyan-400" />
                <span>{branding.email}</span>
              </a>
            )}
            {branding.website && (
              <a
                href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white transition"
              >
                <Globe size={13} className="text-cyan-400" />
                <span>Website</span>
              </a>
            )}
            {rawWhatsapp && (
              <a
                href={`https://wa.me/${rawWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold transition"
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </a>
            )}
            {hasSocials && (
              <div className="flex items-center gap-2.5 ml-1 border-l border-white/15 pl-3">
                {branding.facebookUrl && (
                  <a href={branding.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-white transition" title="Facebook">
                    <Facebook size={15} />
                  </a>
                )}
                {branding.instagramUrl && (
                  <a href={branding.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-white transition" title="Instagram">
                    <Instagram size={15} />
                  </a>
                )}
                {branding.twitterUrl && (
                  <a href={branding.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-white transition" title="Twitter / X">
                    <Twitter size={15} />
                  </a>
                )}
                {branding.linkedinUrl && (
                  <a href={branding.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-white transition" title="LinkedIn">
                    <Linkedin size={15} />
                  </a>
                )}
                {branding.youtubeUrl && (
                  <a href={branding.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-white transition" title="YouTube">
                    <Youtube size={15} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium text-slate-400 gap-1.5">
          <p>© {new Date().getFullYear()} {branding.schoolName}. All rights reserved.</p>
          <p className="font-extrabold text-cyan-400">
            Powered by Ugbekun 2.0 Management System
          </p>
        </div>
      </div>
    </footer>
  )
}
