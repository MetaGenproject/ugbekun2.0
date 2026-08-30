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

const SchoolBrandingContext = createContext<SchoolBrandingContextType>({
  branding: defaultBranding,
  isLoading: false,
  refreshBranding: async () => {},
})

export function SchoolBrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<SchoolBrandingData>(defaultBranding)
  const [isLoading, setIsLoading] = useState(true)

  const fetchBranding = async () => {
    try {
      let branchIdParam = ''
      if (typeof window !== 'undefined') {
        const rawUser = localStorage.getItem('ugbekun_user')
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser)
            const targetBranchId = parsed?.branchId || parsed?.branch?.id
            if (targetBranchId) {
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
        if (typeof document !== 'undefined') {
          const root = document.documentElement
          root.style.setProperty('--school-primary', res.data.primaryColor || '#0f172a')
          root.style.setProperty('--school-secondary', res.data.secondaryColor || '#0284c7')
        }
      }
    } catch (err) {
      console.error('[BRANDING] Failed to load school branding:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
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
    <SchoolBrandingContext.Provider value={{ branding, isLoading, refreshBranding: fetchBranding }}>
      {children}
    </SchoolBrandingContext.Provider>
  )
}

export function useSchoolBranding() {
  return useContext(SchoolBrandingContext)
}
