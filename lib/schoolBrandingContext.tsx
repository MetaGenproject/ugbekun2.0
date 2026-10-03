'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

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
      if (typeof window !== 'undefined') {
        const rawUser = localStorage.getItem('ugbekun_user')
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser)
            const role = Number(parsed?.role)
            const targetBranchId = parsed?.branchId || parsed?.branch?.id
            // Parents: do not pin branding to a stale parent/HQ branchId.
            // The children overview header uses the selected child's school.
            if (targetBranchId && role !== 6) {
              branchIdParam = `?branchId=${targetBranchId}`
            }
          } catch {
            // ignore parse error
          }
        }
      }

      const res = await apiSlice.get<{ success: boolean; data: SchoolBrandingData }>(
        `${endpoints.public.schoolInfo}${branchIdParam}`
      )
      if (res?.data) {
        setBranding(res.data)
        applyColors(res.data.primaryColor, res.data.secondaryColor)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(res.data))
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
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed && typeof parsed === 'object' && parsed.schoolName) {
            setBranding((prev) => ({ ...prev, ...parsed }))
            applyColors(parsed.primaryColor, parsed.secondaryColor)
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
