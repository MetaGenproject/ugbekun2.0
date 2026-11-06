'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Cloud, Headphones, Landmark, Globe } from 'lucide-react'
import { UgbekunLogo } from '@/components/logo'
import { LoginContainer } from '@/components/login-container'

export interface TenantBranding {
  isCustomDomain?: boolean
  branchId?: number
  branchName?: string
  schoolName?: string
  tagline?: string
  logoUrl?: string | null
  primaryColor?: string
  secondaryColor?: string
  subdomain?: string | null
  customDomain?: string | null
}

export function LoginPageClient() {
  const searchParams = useSearchParams()
  const branchIdParam = searchParams.get('branchId')
  const [branding, setBranding] = useState<TenantBranding | null>(null)
  const [loadingBranding, setLoadingBranding] = useState(true)

  useEffect(() => {
    let isCancelled = false

    async function loadBranding() {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : ''
        const query = new URLSearchParams()
        if (host) query.set('domain', host)
        if (branchIdParam) query.set('branchId', branchIdParam)

        let json: any = null
        try {
          const proxyRes = await fetch(`/api/proxy/public/tenant/branding?${query.toString()}`)
          if (proxyRes.ok) json = await proxyRes.json().catch(() => null)
        } catch {}

        if (!json || !json.success) {
          const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ugbekun.com').replace(/\/api\/?$/, '')
          const res = await fetch(`${backendUrl}/api/public/tenant/branding?${query.toString()}`)
          json = await res.json()
        }

        if (!isCancelled && json?.success && json.data) {
          // If we have an explicit branchId or custom domain/subdomain, apply tenant branding
          if (branchIdParam || json.data.isCustomDomain || json.data.branchId) {
            setBranding(json.data)
          }
        }
      } catch (err) {
        console.warn('Could not resolve tenant branding on login page:', err)
      } finally {
        if (!isCancelled) setLoadingBranding(false)
      }
    }

    loadBranding()

    return () => {
      isCancelled = true
    }
  }, [branchIdParam])

  const isTenantScoped = Boolean(branding && (branchIdParam || branding.isCustomDomain))
  const schoolName = branding?.schoolName || 'Ugbekun'
  const tagline = branding?.tagline || (isTenantScoped ? 'Excellence in Knowledge & Character' : 'Empowering Schools. Connecting Communities. Building Futures.')
  const primaryColor = branding?.primaryColor || '#003da5'
  const secondaryColor = branding?.secondaryColor || '#009ca6'

  return (
    <main className="relative min-h-screen bg-[#081026] text-white overflow-x-hidden flex flex-col justify-between">
      {/* Background Campus Image with Deep Blue Vignette Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-bg.png"
          alt="School Campus Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-100 filter brightness-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#081026]/35 via-[#0B1536]/25 to-[#081026]/45" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full flex-1 flex flex-col justify-between">
        
        {/* Top Centered Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3">
            {isTenantScoped ? (
              <div className="flex items-center gap-3.5 group">
                {branding?.logoUrl ? (
                  <div className="w-14 h-14 rounded-2xl bg-white/10 p-1 border border-white/20 shadow-xl overflow-hidden shrink-0">
                    <img
                      src={branding.logoUrl}
                      alt={schoolName}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl border border-white/20 shrink-0"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {branding?.schoolName?.slice(0, 2).toUpperCase() || 'SC'}
                  </div>
                )}
                <div className="flex flex-col text-left justify-center leading-tight">
                  <span className="text-2xl font-black tracking-tight text-white drop-shadow">
                    {schoolName}
                  </span>
                  <span className="text-xs font-semibold text-cyan-300 tracking-wide">
                    Institutional Management Portal
                  </span>
                </div>
              </div>
            ) : (
              <UgbekunLogo size="lg" />
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-300 tracking-wide drop-shadow">
            {tagline}
          </p>
        </div>

        {/* Center Dual Cards Container */}
        <LoginContainer isTenantScoped={isTenantScoped} />

        {/* Bottom CTA: Sign Up Your School (Only shown on SaaS platform, hidden on tenant-scoped page) */}
        {!isTenantScoped ? (
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-xs text-gray-300 font-medium mb-3">
              Don&apos;t have a school account?
            </p>
            <Link
              href="/subscribe?plan=starter"
              prefetch={false}
              className="inline-flex items-center gap-4 px-6 py-3.5 bg-gradient-to-r from-red-500/15 via-rose-500/15 to-pink-500/15 border border-pink-500/50 hover:border-pink-500/80 rounded-2xl text-white transition-all transform hover:-translate-y-0.5 shadow-xl group max-w-md w-full justify-center"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Landmark size={20} className="text-pink-400" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-white block leading-tight">
                  Sign Up Your School
                </span>
                <span className="text-[11px] text-gray-300">
                  School sign up only
                </span>
              </div>
            </Link>
          </div>
        ) : (
          <div className="text-center mb-6">
            <Link
              href={`/tenant-home?branchId=${branding?.branchId || branchIdParam}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-cyan-300 border border-white/10 transition"
            >
              <Globe size={14} /> Back to {schoolName} Website
            </Link>
          </div>
        )}

        {/* Footer Strip */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-sky-400" />
              <span>Secure & Reliable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cloud size={16} className="text-sky-400" />
              <span>Cloud Based</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Headphones size={16} className="text-purple-400" />
              <span>24/7 Support</span>
            </div>
          </div>

          {/* Copyright: White-labeled when tenant is active */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
            <span>
              &copy; {new Date().getFullYear()} {isTenantScoped ? `${schoolName}. All rights reserved.` : 'Ugbekun School Management System. All rights reserved.'}
            </span>
            {!isTenantScoped && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span>Powered by Metagen Project</span>
                <div className="w-5 h-5 rounded bg-gradient-to-r from-blue-600 to-pink-600 flex items-center justify-center text-white font-bold text-[10px]">
                  M
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}

