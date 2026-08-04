import { Suspense } from 'react'
import { Metadata } from 'next'
import { SchoolSubscriptionForm } from '@/components/school-subscription-form'

export const metadata: Metadata = {
  title: 'Sign Up Your School - Ugbekun',
  description: 'Create a new Ugbekun school management account',
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050B1D] text-white">
          <p className="text-sm">Loading registration form...</p>
        </div>
      }
    >
      <SchoolSubscriptionForm />
    </Suspense>
  )
}
