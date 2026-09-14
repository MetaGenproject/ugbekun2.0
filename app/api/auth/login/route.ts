import { NextRequest, NextResponse } from 'next/server'
import { applyAuthCookie, getBackendUrl } from '@/lib/serverAuth'

export async function POST(request: NextRequest) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 90000)

  try {
    const body = await request.json()
    const targetUrl = `${getBackendUrl()}/api/auth/login`

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json().catch(() => null)

    if (!response.ok || !data) {
      return NextResponse.json(
        { message: data?.message || 'Authentication failed. Invalid username or password.' },
        { status: response.status || 401 }
      )
    }

    const { token, ...publicData } = data
    const res = NextResponse.json(publicData)
    if (token) applyAuthCookie(res, token)
    return res
  } catch (err: any) {
    clearTimeout(timeoutId)

    const isTimeout = err?.name === 'AbortError' || err?.code === 'UND_ERR_CONNECT_TIMEOUT'
    console.error('[Same-Origin Auth Proxy Error]:', err)

    return NextResponse.json(
      {
        message: isTimeout
          ? 'The server is starting up (cold start). Please wait a moment and try again.'
          : 'Network connection error. Server is starting up or unreachable.',
      },
      { status: 503 }
    )
  }
}
