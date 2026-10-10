'use client'

import { safeStorage } from './safeStorage'

export interface AuthUser {
  id: number
  username: string
  role: number
  roleName: string
  legacyUserId?: number | null
  lastLogin?: string | null
  branch?: {
    id: number
    name: string
    code: string
  } | null
}

interface AuthSession {
  user: AuthUser | null
}

let memorySession: AuthSession = {
  user: null,
}

function parseStoredUser(userDataStr: string | null): AuthUser | null {
  if (!userDataStr) return null

  let str = userDataStr
  try {
    if (str.includes('%')) {
      str = decodeURIComponent(str)
    }
    if (str.includes('%')) {
      str = decodeURIComponent(str)
    }
  } catch {
    // ignore decode error
  }

  try {
    const parsed = JSON.parse(str)
    if (parsed && typeof parsed === 'object' && parsed.id && parsed.role) {
      return parsed as AuthUser
    }
  } catch {
    // ignore parse error
  }

  return null
}

function wipeLegacyTokenStorage() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem('ugbekun_superadmin_token')
    window.sessionStorage.removeItem('ugbekun_superadmin_token')
  } catch {
    // ignore
  }
}

export function getAuthSession(): AuthSession {
  if (memorySession.user) {
    return { user: memorySession.user }
  }

  const user = parseStoredUser(safeStorage.getItem('ugbekun_user'))
  if (user) memorySession = { user }
  return { user }
}

export function setAuthSession(user: AuthUser, token?: string | null): void {
  memorySession = { user }
  wipeLegacyTokenStorage()
  if (token) {
    safeStorage.setItem('ugbekun_token', token)
    safeStorage.setItem('token', token)
  }
  safeStorage.setItem('ugbekun_user', JSON.stringify(user))
}

export function clearAuthSession(): void {
  memorySession = { user: null }
  safeStorage.removeItem('ugbekun_token')
  safeStorage.removeItem('token')
  safeStorage.removeItem('ugbekun_user')
  wipeLegacyTokenStorage()
}

let refreshingSessionPromise: Promise<boolean> | null = null

export async function refreshAuthSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (refreshingSessionPromise) return refreshingSessionPromise

  refreshingSessionPromise = (async () => {
    try {
      const token = safeStorage.getItem('ugbekun_token') || safeStorage.getItem('token')
      const headers: Record<string, string> = {
        Accept: 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers,
        credentials: 'include',
      })

      if (!res.ok) {
        return false
      }

      const data = await res.json().catch(() => null)
      if (data?.success && data?.user) {
        setAuthSession(data.user, data.token || token)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      refreshingSessionPromise = null
    }
  })()

  return refreshingSessionPromise
}

export function isExpiredAuthMessage(status: number, message?: string | null) {
  if (status !== 401) return false
  const text = String(message || '').toLowerCase()
  if (
    text.includes('invalid credentials') ||
    text.includes('incorrect password') ||
    text.includes('username is required')
  ) {
    return false
  }
  return true
}

let endingExpiredSession = false

export function redirectExpiredSession(reason: string = 'session') {
  if (typeof window === 'undefined' || endingExpiredSession) return
  const path = window.location.pathname || ''
  if (path.startsWith('/login') || path.startsWith('/onboarding')) return

  endingExpiredSession = true
  clearAuthSession()
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => null)

  const next = `${path}${window.location.search || ''}`
  const params = new URLSearchParams()
  params.set('reason', reason)
  if (next && next !== '/dashboard') params.set('next', next)
  window.location.replace(`/login?${params.toString()}`)
}

export async function endAuthSession() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  } catch {
    // still clear local session
  }
  clearAuthSession()
}
