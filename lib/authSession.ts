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

  try {
    const parsed = JSON.parse(userDataStr)
    if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.role) {
      return null
    }
    return parsed as AuthUser
  } catch (e) {
    return null
  }
}

export function getAuthSession(): AuthSession {
  if (memorySession.token || memorySession.user) {
    return {
      token: memorySession.token,
      user: memorySession.user,
    }
  }

  const token = safeStorage.getItem('ugbekun_token')
  const userDataStr = safeStorage.getItem('ugbekun_user')
  const user = parseStoredUser(userDataStr)

  if (token || user) {
    memorySession = { token, user }
  }

  return memorySession
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
