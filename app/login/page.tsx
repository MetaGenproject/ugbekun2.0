export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginPageClient } from '@/components/login-page-client'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Portal Login - School Management System',
  description: 'Sign in to access your institutional school portal',
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
