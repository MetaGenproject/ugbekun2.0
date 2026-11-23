'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { normalizeTenantHost } from '@/lib/platformHosts'
import { applyDocumentBranding } from '@/lib/documentBranding'

export interface SchoolBrandingData {
  branchId: number
  branchCode: string
  branchName: string
  schoolName: string
  tagline: string
  address: string
  phone: string
  email: string
  whatsappNo: string | null
  website: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  twitterUrl: string | null
  linkedinUrl: string | null
  youtubeUrl: string | null
  logoUrl: string | null
  principalSignatureUrl: string | null
  primaryColor: string
  secondaryColor: string
  idCardTheme: string
  academicSession: string
  currentTerm: string
  currencySymbol: string
}

interface SchoolBrandingContextType {
  branding: SchoolBrandingData
  isLoading: boolean
  refreshBranding: () => Promise<void>
}

export const UGBEKUN_ADMIN_BRANDING: SchoolBrandingData = {
  branchId: 0,
  branchCode: 'UGB',
  branchName: 'Ugbekun Admin Portal',
  schoolName: 'Ugbekun Admin Portal',
  tagline: 'SaaS Platform Management & Control Center',
  address: '',
  phone: '',
  email: 'admin@ugbekun.com',
  whatsappNo: null,
  website: 'https://ugbekun.com',
  facebookUrl: null,
  instagramUrl: null,
  twitterUrl: null,
  linkedinUrl: null,
  youtubeUrl: null,
  logoUrl: null,
  principalSignatureUrl: null,
  primaryColor: '#0b1739',
  secondaryColor: '#e11d48',
  idCardTheme: 'EMERALD_MODERN',
  academicSession: '2025/2026',
  currentTerm: 'Active Session',
  currencySymbol: '₦',
}

const defaultBranding: SchoolBrandingData = {
  branchId: 1,
  branchCode: 'UG',
  branchName: 'School Dashboard',
  schoolName: 'Ugbekun International Academy',
  tagline: 'Excellence in Knowledge & Character',
  address: '',
  phone: '',
  email: '',
  whatsappNo: null,
  website: null,
  facebookUrl: null,
  instagramUrl: null,
  twitterUrl: null,
  linkedinUrl: null,
  youtubeUrl: null,
  logoUrl: null,
  principalSignatureUrl: null,
  primaryColor: '#0f172a',
  secondaryColor: '#0284c7',
  idCardTheme: 'EMERALD_MODERN',
  academicSession: '2025/2026',
  currentTerm: 'First Term',
  currencySymbol: '₦',
}

const CACHE_KEY = 'ugbekun_school_branding_cache'

const SchoolBrandingContext = createContext<SchoolBrandingContextType>({
  branding: defaultBranding,
  isLoading: false,
  refreshBranding: async () => {},
})

export function SchoolBrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<SchoolBrandingData>(defaultBranding)
  const [isLoading, setIsLoading] = useState(true)

  const applyColors = (primary?: string, secondary?: string) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (primary) root.style.setProperty('--school-primary', primary)
      if (secondary) root.style.setProperty('--school-secondary', secondary)
    }
  }

  const fetchBranding = async (attempt = 1, maxRetries = 2): Promise<void> => {
    try {
      let branchIdParam = ''
      let hasExplicitUrlTenant = false
      let isAuthenticatedSchoolUser = false
      let hostInfo = normalizeTenantHost('')
      const urlQuery = new URLSearchParams()

      if (typeof window !== 'undefined') {
        hostInfo = normalizeTenantHost(window.location.hostname)
        const sp = new URLSearchParams(window.location.search)
        const qBranch = sp.get('branchId')
        const qDomain = sp.get('domain')
        const qSub = sp.get('subdomain') || hostInfo.subdomain

        if (qBranch) {
          urlQuery.set('branchId', qBranch)
          hasExplicitUrlTenant = true
        }
        if (qDomain) {
          urlQuery.set('domain', qDomain)
          hasExplicitUrlTenant = true
        } else if (hostInfo.isTenantHost && hostInfo.normalizedHostname) {
          urlQuery.set('domain', hostInfo.normalizedHostname)
        }
        if (qSub) {
          urlQuery.set('subdomain', qSub)
          hasExplicitUrlTenant = true
        }

        const rawUser = localStorage.getItem('ugbekun_user')
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser)
            const role = Number(parsed?.role)
            // Superadmin belongs to the entire SaaS platform, not a school branch
            if (role === 1 && !hasExplicitUrlTenant && !hostInfo.isTenantHost) {
              setBranding(UGBEKUN_ADMIN_BRANDING)
              applyColors(UGBEKUN_ADMIN_BRANDING.primaryColor, UGBEKUN_ADMIN_BRANDING.secondaryColor)
              setIsLoading(false)
              return
            }
            const targetBranchId = parsed?.branchId || parsed?.branch?.id
            if (targetBranchId && role !== 1) {
              isAuthenticatedSchoolUser = true
              // Parents: do not pin branding to a stale parent/HQ branchId.
              if (role !== 6) {
                branchIdParam = `?branchId=${targetBranchId}`
              }
            }
          } catch {
            // ignore parse error
          }
        }
      }

      const isTenantScoped = hasExplicitUrlTenant || hostInfo.isTenantHost || isAuthenticatedSchoolUser
      let resolved: SchoolBrandingData | null = null

      if ((hasExplicitUrlTenant || hostInfo.isTenantHost) && urlQuery.toString()) {
        const tenantRes = await apiSlice
          .get<{ success: boolean; data: any }>(`${endpoints.public.branding}?${urlQuery.toString()}`)
          .catch(() => null)
        if (tenantRes?.success && tenantRes?.data?.branchId) {
          resolved = { ...defaultBranding, ...tenantRes.data }
        }
      }

      if (!resolved) {
        const res = await apiSlice.get<{ success: boolean; data: SchoolBrandingData }>(
          `${endpoints.public.schoolInfo}${branchIdParam}`
        )
        if (res?.data) {
          resolved = res.data
        }
      }

      if (resolved) {
        setBranding(resolved)
        applyColors(resolved.primaryColor, resolved.secondaryColor)
        applyDocumentBranding({
          schoolName: resolved.schoolName,
          logoUrl: resolved.logoUrl,
          isTenantScoped,
        })
        if (typeof window !== 'undefined' && resolved.branchId > 0) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(resolved))
          } catch {
            // ignore quota errors
          }
        }
      }
    } catch (err) {
      if (attempt <= maxRetries) {
        const backoffMs = attempt * 2500
        console.warn(`[BRANDING] Upstream waking up (attempt ${attempt}/${maxRetries}), retrying in ${backoffMs}ms...`)
        setTimeout(() => {
          fetchBranding(attempt + 1, maxRetries)
        }, backoffMs)
        return
      }
      console.warn('[BRANDING] Failed to load latest school branding, using cached/default:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 1. Immediately hydrate from localStorage cache if available to prevent layout flash
    if (typeof window !== 'undefined') {
      try {
        const hostInfo = normalizeTenantHost(window.location.hostname)
        const sp = new URLSearchParams(window.location.search)
        const qBranch = sp.get('branchId')
        const hasUrlTenant = Boolean(qBranch || sp.get('domain') || sp.get('subdomain') || hostInfo.isTenantHost)

        let isSchoolUser = false
        const rawUser = localStorage.getItem('ugbekun_user')
        if (rawUser) {
          const parsedUser = JSON.parse(rawUser)
          const role = Number(parsedUser?.role)
          if (role === 1 && !hasUrlTenant) {
            setBranding(UGBEKUN_ADMIN_BRANDING)
            applyColors(UGBEKUN_ADMIN_BRANDING.primaryColor, UGBEKUN_ADMIN_BRANDING.secondaryColor)
            setIsLoading(false)
            return
          }
          if (role !== 1 && (parsedUser?.branchId || parsedUser?.branch?.id)) {
            isSchoolUser = true
          }
        }
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          const matchesQueryBranch = !qBranch || String(parsed?.branchId) === String(qBranch)
          if (
            parsed &&
            typeof parsed === 'object' &&
            parsed.schoolName &&
            parsed.schoolName !== 'MetaGen Academy' &&
            matchesQueryBranch &&
            !hostInfo.isTenantHost
          ) {
            setBranding((prev) => ({ ...prev, ...parsed }))
            applyColors(parsed.primaryColor, parsed.secondaryColor)
            if (isSchoolUser || qBranch) {
              applyDocumentBranding({
                schoolName: parsed.schoolName,
                logoUrl: parsed.logoUrl,
                isTenantScoped: true,
              })
            }
          }
        }
      } catch {
        // ignore cache read error
      }
    }

    // 2. Fetch fresh branding from backend
    fetchBranding()

    const handleUpdate = () => {
      fetchBranding()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('branch-settings-updated', handleUpdate)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('branch-settings-updated', handleUpdate)
      }
    }
  }, [])

  return (
    <SchoolBrandingContext.Provider value={{ branding, isLoading, refreshBranding: () => fetchBranding(1, 1) }}>
      {children}
    </SchoolBrandingContext.Provider>
  )
}

export function useSchoolBranding() {
  return useContext(SchoolBrandingContext)
}
