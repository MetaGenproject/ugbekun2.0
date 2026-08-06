'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import to avoid SSR + useSearchParams suspend issues on old mobile browsers
const SchoolSubscriptionForm = dynamic(
  () => import('@/components/school-subscription-form').then((m) => ({ default: m.SchoolSubscriptionForm })),
  { ssr: false }
)

function SubscribeFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#081026',
        gap: '16px',
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 500 }}>Loading registration form…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<SubscribeFallback />}>
      <SchoolSubscriptionForm />
    </Suspense>
  )
}
