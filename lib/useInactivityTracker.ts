'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { safeStorage } from './safeStorage'
import { refreshAuthSession, redirectExpiredSession, endAuthSession } from './authSession'

export interface InactivityTrackerOptions {
  /**
   * Total milliseconds of user silence before timing out. Default: 30 minutes (1,800,000 ms)
   */
  timeoutMs?: number
  /**
   * Milliseconds before timeout to trigger the warning dialog. Default: 5 minutes (300,000 ms)
   */
  warningDurationMs?: number
  /**
   * Interval for active users to proactively refresh their session token. Default: 10 minutes (600,000 ms)
   */
  heartbeatIntervalMs?: number
  /**
   * When true (e.g. during CBT examination), idle logout is suspended.
   */
  isExempt?: boolean
  /**
   * Callback fired on true timeout.
   */
  onTimeout?: () => void
}

const STORAGE_KEY = 'ugbekun_last_active_time'
const THROTTLE_INTERVAL_MS = 10000 // Throttle DOM event recording to once every 10s

export function useInactivityTracker({
  timeoutMs = 30 * 60 * 1000,
  warningDurationMs = 5 * 60 * 1000,
  heartbeatIntervalMs = 10 * 60 * 1000,
  isExempt = false,
  onTimeout,
}: InactivityTrackerOptions = {}) {
  const [isWarningVisible, setIsWarningVisible] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(Math.round(warningDurationMs / 1000))
  const [internalExamActive, setInternalExamActive] = useState<boolean>(false)
  const lastThrottleRef = useRef<number>(0)
  const isExemptRef = useRef<boolean>(isExempt)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleCbtState = (e: any) => {
      const active = Boolean(e?.detail?.active)
      setInternalExamActive(active)
    }
    window.addEventListener('ugbekun:cbt-active', handleCbtState)
    if ((window as any).__ugbekun_cbt_active) {
      setInternalExamActive(true)
    }
    return () => window.removeEventListener('ugbekun:cbt-active', handleCbtState)
  }, [])

  const effectiveExempt = isExempt || internalExamActive

  useEffect(() => {
    isExemptRef.current = effectiveExempt
    if (effectiveExempt) {
      setIsWarningVisible(false)
    }
  }, [effectiveExempt])

  const getLastActiveTime = useCallback((): number => {
    const raw = safeStorage.getItem(STORAGE_KEY)
    const parsed = Number(raw)
    return isNaN(parsed) || parsed <= 0 ? Date.now() : parsed
  }, [])

  const recordActivity = useCallback(() => {
    const now = Date.now()
    if (now - lastThrottleRef.current < THROTTLE_INTERVAL_MS) {
      return
    }
    lastThrottleRef.current = now
    safeStorage.setItem(STORAGE_KEY, String(now))
    if (isWarningVisible) {
      setIsWarningVisible(false)
      refreshAuthSession().catch(() => null)
    }
  }, [isWarningVisible])

  const extendSession = useCallback(() => {
    const now = Date.now()
    lastThrottleRef.current = now
    safeStorage.setItem(STORAGE_KEY, String(now))
    setIsWarningVisible(false)
    setSecondsRemaining(Math.round(warningDurationMs / 1000))
    refreshAuthSession().catch(() => null)
  }, [warningDurationMs])

  const handleManualLogout = useCallback(async () => {
    setIsWarningVisible(false)
    await endAuthSession()
    redirectExpiredSession('manual')
  }, [])

  // 1. Listen for user DOM interaction events across page
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize timestamp on mount if not set
    if (!safeStorage.getItem(STORAGE_KEY)) {
      safeStorage.setItem(STORAGE_KEY, String(Date.now()))
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    const handleEvent = () => recordActivity()

    events.forEach((evt) => {
      window.addEventListener(evt, handleEvent, { passive: true })
    })

    // Sync across tabs: when another tab updates activity, reset warning here
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setIsWarningVisible(false)
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleEvent)
      })
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [recordActivity])

  // 2. Sliding session token heartbeat: keeps JWT rolling as long as user is active
  useEffect(() => {
    if (typeof window === 'undefined') return

    const heartbeatInterval = setInterval(() => {
      const now = Date.now()
      const lastActive = getLastActiveTime()
      const timeSinceActive = now - lastActive

      // Proactively refresh if user was active recently (or if currently in exempt exam mode)
      if (isExemptRef.current || timeSinceActive < timeoutMs - warningDurationMs) {
        refreshAuthSession().catch(() => null)
      }
    }, heartbeatIntervalMs)

    return () => clearInterval(heartbeatInterval)
  }, [getLastActiveTime, timeoutMs, warningDurationMs, heartbeatIntervalMs])

  // 3. Ticking checker: evaluates idle duration every 1 second
  useEffect(() => {
    if (typeof window === 'undefined') return

    const timer = setInterval(() => {
      if (isExemptRef.current) {
        if (isWarningVisible) setIsWarningVisible(false)
        return
      }

      const now = Date.now()
      const lastActive = getLastActiveTime()
      const idleDuration = now - lastActive
      const warningThreshold = timeoutMs - warningDurationMs

      if (idleDuration >= timeoutMs) {
        // True inactivity timeout reached
        setIsWarningVisible(false)
        if (onTimeout) {
          onTimeout()
        } else {
          redirectExpiredSession('idle_timeout')
        }
      } else if (idleDuration >= warningThreshold) {
        // User entered the warning window (25 mins - 30 mins)
        const msRemaining = Math.max(0, timeoutMs - idleDuration)
        setSecondsRemaining(Math.ceil(msRemaining / 1000))
        setIsWarningVisible(true)
      } else {
        if (isWarningVisible) {
          setIsWarningVisible(false)
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [getLastActiveTime, timeoutMs, warningDurationMs, onTimeout, isWarningVisible])

  return {
    isWarningVisible,
    secondsRemaining,
    extendSession,
    handleManualLogout,
    isExempt,
  }
}
