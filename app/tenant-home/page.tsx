'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SchoolLandingView, SchoolHomepageData } from '@/components/tenant-home/school-landing-view'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

function TenantHomeContent() {
  const searchParams = useSearchParams()
  const domainParam = searchParams.get('domain')
  const subdomainParam = searchParams.get('subdomain')
  const branchIdParam = searchParams.get('branchId')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [homepageData, setHomepageData] = useState<SchoolHomepageData | null>(null)

  const fetchHomepageData = async () => {
    setLoading(true)
    setError(null)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const query = new URLSearchParams()
      if (domainParam) query.set('domain', domainParam)
      if (subdomainParam) query.set('subdomain', subdomainParam)
      if (branchIdParam) query.set('branchId', branchIdParam)

      // Fallback: If no query param, check current browser hostname
      if (!domainParam && !subdomainParam && !branchIdParam && typeof window !== 'undefined') {
        const host = window.location.hostname
        query.set('domain', host)
      }

      const res = await fetch(`${backendUrl}/api/public/tenant/homepage?${query.toString()}`)
      const json = await res.json()

      if (json.success && json.data) {
        setHomepageData(json.data)
      } else {
        throw new Error(json.message || 'Failed to load school homepage.')
      }
    } catch (err: any) {
      console.error('[TENANT HOME] Fetch error:', err)
      setError(err.message || 'Unable to connect to school portal.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomepageData()
  }, [domainParam, subdomainParam, branchIdParam])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-sm font-semibold text-slate-400 tracking-wide">Loading School Campus Portal...</p>
      </div>
    )
  }

  if (error || !homepageData) {
    return (
      <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">School Portal Not Found</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {error || 'The requested school domain is not currently configured or registered.'}
            </p>
          </div>
          <button
            onClick={fetchHomepageData}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-lg cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    )
  }

  return <SchoolLandingView initialData={homepageData} />
}

export default function TenantHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center text-white space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
          <p className="text-sm font-semibold text-slate-400 tracking-wide">Loading School Campus Portal...</p>
        </div>
      }
    >
      <TenantHomeContent />
    </Suspense>
  )
}
