export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginPageClient } from '@/components/login-page-client'
import { resolveServerTenantBranding, buildTenantMetadata } from '@/lib/serverTenantBranding'
import { Loader2 } from 'lucide-react'

function readFirstParam(val: string | string[] | undefined): string | null {
  if (Array.isArray(val)) return val[0] || null
  return val || null
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const resolvedParams = searchParams ? await searchParams : {}
  const tenant = await resolveServerTenantBranding({
    branchId: readFirstParam(resolvedParams?.branchId),
    domain: readFirstParam(resolvedParams?.domain),
    subdomain: readFirstParam(resolvedParams?.subdomain),
  })
  return buildTenantMetadata(
    tenant,
    'Portal Login - School Management System',
    'Sign in to access your institutional school portal'
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#081026] text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </main>
      }
    >
      <LoginPageClient />
    </Suspense>
  )
}
