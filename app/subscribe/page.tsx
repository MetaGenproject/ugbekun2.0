import { Suspense } from 'react'
import { Metadata } from 'next'
import { SchoolSubscriptionForm } from '@/components/school-subscription-form'

export const metadata: Metadata = {
  title: 'School Subscription - Ugbekun',
  description: 'Register your school on the Ugbekun SaaS platform',
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-foreground/60 text-sm">Loading subscription form...</p>
        </div>
      }
    >
      <SchoolSubscriptionForm />
    </Suspense>
  )
}
