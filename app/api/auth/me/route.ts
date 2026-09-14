import { NextRequest, NextResponse } from 'next/server'
import { applyAuthCookie, AUTH_COOKIE_NAME, getBackendUrl } from '@/lib/serverAuth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json({ success: false, message: 'No token provided.' }, { status: 401 })
  }

  try {
    const response = await fetch(`${getBackendUrl()}/api/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        Cookie: `${AUTH_COOKIE_NAME}=${token}`,
      },
      cache: 'no-store',
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data) {
      const res = NextResponse.json(
        { success: false, message: data?.message || 'Token is invalid or expired.' },
        { status: response.status || 401 }
      )
      if (response.status === 401) applyAuthCookie(res, null)
      return res
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ success: false, message: 'Unable to verify session.' }, { status: 503 })
  }
}
