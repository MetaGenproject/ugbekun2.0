import { NextRequest, NextResponse } from 'next/server'
import { applyAuthCookie, AUTH_COOKIE_NAME, getBackendUrl } from '@/lib/serverAuth'

export async function POST(request: NextRequest) {
  let token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim()
    }
  }

  try {
    if (token) {
      await fetch(`${getBackendUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          Cookie: `${AUTH_COOKIE_NAME}=${token}`,
        },
      }).catch(() => null)
    }
  } catch {
    // still clear the browser cookie
  }

  const res = NextResponse.json({ success: true, message: 'Signed out.' })
  applyAuthCookie(res, null, request)
  return res
}
