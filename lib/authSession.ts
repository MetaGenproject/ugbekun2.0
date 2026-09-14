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
  safeStorage.removeItem('ugbekun_token')
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem('token')
    window.sessionStorage.removeItem('token')
    window.localStorage.removeItem('ugbekun_superadmin_token')
    window.sessionStorage.removeItem('ugbekun_superadmin_token')
  } catch {
    // ignore
  }
  try {
    document.cookie = 'ugbekun_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
  } catch {
    // ignore leftover JS cookies; the httpOnly session cookie cannot be read here
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

export function setAuthSession(user: AuthUser, _ignoredToken?: string): void {
  memorySession = { user }
  wipeLegacyTokenStorage()
  safeStorage.setItem('ugbekun_user', JSON.stringify(user))
}

export function clearAuthSession(): void {
  memorySession = { user: null }
  wipeLegacyTokenStorage()
  safeStorage.removeItem('ugbekun_user')
}

let endingExpiredSession = false

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

export function redirectExpiredSession() {
  if (typeof window === 'undefined' || endingExpiredSession) return
  const path = window.location.pathname || ''
  if (path.startsWith('/login') || path.startsWith('/onboarding')) return

  endingExpiredSession = true
  clearAuthSession()
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => null)

  const next = `${path}${window.location.search || ''}`
  const params = new URLSearchParams()
  params.set('reason', 'session')
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
