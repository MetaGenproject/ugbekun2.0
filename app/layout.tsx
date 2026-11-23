import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SystemStatusToastContainer } from '@/components/ui/status-notifier'
import { Toaster } from '@/components/ui/sonner'
import { SchoolBrandingProvider } from '@/lib/schoolBrandingContext'
import { GlobalErrorTracker } from '@/components/common/global-error-tracker'
import { resolveServerTenantBranding, buildTenantMetadata } from '@/lib/serverTenantBranding'
import './globals.css'

const geist = Geist({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveServerTenantBranding()
  return {
    ...buildTenantMetadata(tenant),
    generator: 'v0.app',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isVercel = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL)

  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <head />
      <body className={`${geist.className} font-sans antialiased`} suppressHydrationWarning>
        <SchoolBrandingProvider>
          <GlobalErrorTracker />
          {children}
          <Toaster richColors position="top-right" />
          <SystemStatusToastContainer />
          {isVercel && <Analytics />}
        </SchoolBrandingProvider>
      </body>
    </html>
  )
}
