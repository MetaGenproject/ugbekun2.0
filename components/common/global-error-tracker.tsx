'use client'

import { useEffect } from 'react'
import { reportClientError } from '@/lib/logger'

/**
 * GlobalErrorTracker
 * Mounts global error listeners on window and catches uncaught exceptions and unhandled
 * promise rejections, reporting them silently to the backend error logs.
 */
export function GlobalErrorTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleError = (event: ErrorEvent) => {
      // Ignore cross-origin script errors or harmless extension errors
      if (!event.message || event.message.includes('Script error.')) return

      reportClientError({
        message: event.message,
        stack: event.error?.stack,
        context: 'WINDOW_UNCAUGHT_ERROR',
        route: window.location.pathname,
        data: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const msg = reason instanceof Error ? reason.message : String(reason || 'Unhandled Promise Rejection')
      const stack = reason instanceof Error ? reason.stack : undefined

      // Filter out benign aborted requests
      if (msg.includes('AbortError') || msg.includes('Failed to fetch')) return

      reportClientError({
        message: `Unhandled Promise Rejection: ${msg}`,
        stack,
        context: 'UNHANDLED_PROMISE_REJECTION',
        route: window.location.pathname,
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}

export default GlobalErrorTracker
