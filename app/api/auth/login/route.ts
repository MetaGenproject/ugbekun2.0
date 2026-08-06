import { NextRequest, NextResponse } from 'next/server'

// Determine backend URL for server-side proxy calls
const getBackendUrl = (): string => {
  const rawUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
  return rawUrl.replace(/\/$/, '').replace(/\/api$/, '')
}

const getLoginTargetUrl = (): string => {
  const backendHost = getBackendUrl()
  return `${backendHost}/api/auth/login`
}

export async function POST(request: NextRequest) {
  // 30-second timeout — prevents hanging on Render.com cold-start
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const body = await request.json()
    const targetUrl = getLoginTargetUrl()

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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

    // Create successful response with same-origin session cookies for mobile browser compatibility
    const res = NextResponse.json(data)
    const token = data.token
    const userJson = JSON.stringify(data.user)

    if (token) {
      res.cookies.set('ugbekun_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 Days
        path: '/',
      })
    }

    if (userJson) {
      // Store raw JSON — NextResponse.cookies already URL-encodes internally
      res.cookies.set('ugbekun_user', userJson, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 Days
        path: '/',
      })
    }

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
