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
  token: string | null
  user: AuthUser | null
}

let memorySession: AuthSession = {
  token: null,
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
  } catch (e) {
    // ignore decode error
  }

  try {
    const parsed = JSON.parse(str)
    if (parsed && typeof parsed === 'object' && parsed.id && parsed.role) {
      return parsed as AuthUser
    }
  } catch (e) {
    // ignore parse error
  }

  return null
}

export function getAuthSession(): AuthSession {
  if (memorySession.token && memorySession.user) {
    return {
      token: memorySession.token,
      user: memorySession.user,
    }
  }

  let token = safeStorage.getItem('ugbekun_token')
  let userDataStr = safeStorage.getItem('ugbekun_user')

  if (typeof document !== 'undefined') {
    if (!token) {
      const match = document.cookie.match(/(?:^|; )ugbekun_token=([^;]*)/)
      if (match) {
        try {
          token = decodeURIComponent(match[1])
        } catch (e) {}
      }
    }
    if (!userDataStr) {
      const match = document.cookie.match(/(?:^|; )ugbekun_user=([^;]*)/)
      if (match) {
        userDataStr = match[1]
      }
    }
  }

  const user = parseStoredUser(userDataStr)

  if (token && user) {
    memorySession = { token, user }
  }

  return { token: token || null, user }
}

export function setAuthSession(token: string, user: AuthUser): void {
  memorySession = { token, user }
  safeStorage.setItem('ugbekun_token', token)
  safeStorage.setItem('ugbekun_user', JSON.stringify(user))
}

export function clearAuthSession(): void {
  memorySession = { token: null, user: null }
  safeStorage.removeItem('ugbekun_token')
  safeStorage.removeItem('ugbekun_user')
}
