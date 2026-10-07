import { NextRequest, NextResponse } from 'next/server'
import { applyAuthCookie, AUTH_COOKIE_NAME, getBackendUrl } from '@/lib/serverAuth'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  let token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  // Support Authorization header fallback for Safari / iOS when cookies are blocked or delayed
  if (!token) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim()
    }
  }

  if (!token) {
    return NextResponse.json({ success: false, message: 'No token provided.' }, { status: 401 })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 45000)

  try {
    const response = await fetch(`${getBackendUrl()}/api/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        Cookie: `${AUTH_COOKIE_NAME}=${token}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const data = await response.json().catch(() => null)
    if (!response.ok || !data) {
      const res = NextResponse.json(
        { success: false, message: data?.message || 'Token is invalid or expired.' },
        { status: response.status || 401 }
      )
      if (response.status === 401) applyAuthCookie(res, null, request)
      return res
    }
    const res = NextResponse.json(data)
    // If the token was verified from Authorization header and cookie was missing, re-apply cookie
    if (token && !request.cookies.get(AUTH_COOKIE_NAME)?.value) {
      applyAuthCookie(res, token, request)
    }
    return res
  } catch {
    clearTimeout(timeoutId)
    return NextResponse.json({ success: false, message: 'Unable to verify session.' }, { status: 503 })
  }
}
