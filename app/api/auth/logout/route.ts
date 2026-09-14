import { NextRequest, NextResponse } from 'next/server'
import { applyAuthCookie, AUTH_COOKIE_NAME, getBackendUrl } from '@/lib/serverAuth'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
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
  applyAuthCookie(res, null)
  return res
}
