export const AUTH_COOKIE_NAME = 'ugbekun_token'
export const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 8

const PRODUCTION_BACKEND = 'https://ugbekunsmp-backend.onrender.com'

export function getBackendUrl(): string {
  const configured = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL
  if (configured) {
    return configured.replace(/\/$/, '').replace(/\/api$/, '')
  }
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:5001'
  }
  return PRODUCTION_BACKEND
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SEC,
  }
}

export function applyAuthCookie(response: { cookies: { set: Function; delete: Function } }, token?: string | null) {
  if (token) {
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions())
    return
  }
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...getAuthCookieOptions(),
    maxAge: 0,
  })
}
