import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SystemStatusToastContainer } from '@/components/ui/status-notifier'
import { SchoolBrandingProvider } from '@/lib/schoolBrandingContext'
import { GlobalErrorTracker } from '@/components/common/global-error-tracker'
import './globals.css'

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Ugbekun - School Management System',
  description: 'Modern school management platform with QR attendance, online classes, fees management, exams, and parent/student portals',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
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
          <SystemStatusToastContainer />
          {isVercel && <Analytics />}
        </SchoolBrandingProvider>
      </body>
    </html>
  )
}
