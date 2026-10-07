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

export function getAuthCookieOptions(request?: any) {
  let isSecure = process.env.NODE_ENV === 'production'
  if (request) {
    const proto = request.headers?.get?.('x-forwarded-proto') || request.nextUrl?.protocol
    if (proto) {
      if (process.env.NODE_ENV === 'production') {
        isSecure = true
      } else {
        isSecure = proto === 'https:' || proto === 'https'
      }
    }
  }

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SEC,
  }
}

export function applyAuthCookie(
  response: { cookies: { set: Function; delete: Function } },
  token?: string | null,
  request?: any
) {
  const cookieOpts = getAuthCookieOptions(request)
  if (token) {
    response.cookies.set(AUTH_COOKIE_NAME, token, cookieOpts)
    return
  }
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...cookieOpts,
    maxAge: 0,
  })
}
