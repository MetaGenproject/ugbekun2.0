import { NextRequest, NextResponse } from 'next/server'

// Production backend URL — Render.com deployment
const PRODUCTION_BACKEND = 'https://ugbekunsmp-backend.onrender.com'

const getBackendUrl = (): string => {
  // Explicit env override takes priority
  if (process.env.BACKEND_API_URL) {
    return process.env.BACKEND_API_URL.replace(/\/$/, '').replace(/\/api$/, '')
  }
  // NEXT_PUBLIC_API_URL — skip if it points to localhost (dev only)
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '').replace(/\/api$/, '')
  }
  // Production Render.com fallback
  return PRODUCTION_BACKEND
}

async function handleProxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const backendHost = getBackendUrl()
    const path = params.path ? params.path.join('/') : ''
    const searchParams = request.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ''
    const targetUrl = `${backendHost}/api/${path}${queryString}`

    // Build clean forwarded headers without duplicates
    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
    }

    // Copy authorization header or fall back to cookie
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader) {
      forwardHeaders['Authorization'] = authHeader
    } else {
      const tokenCookie = request.cookies.get('ugbekun_token')?.value
      if (tokenCookie) {
        forwardHeaders['Authorization'] = `Bearer ${tokenCookie}`
      }
    }

    // Forward x-admin-teacher-id if present
    const teacherHeader = request.headers.get('x-admin-teacher-id')
    if (teacherHeader) {
      forwardHeaders['x-admin-teacher-id'] = teacherHeader
    }

    let body: any = null
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text().catch(() => null)
    }

    // Forward single, clean Content-Type header
    const rawContentType = request.headers.get('content-type')
    if (rawContentType) {
      forwardHeaders['Content-Type'] = rawContentType.split(',')[0].trim()
    } else if (body) {
      forwardHeaders['Content-Type'] = 'application/json'
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: body || undefined,
    })

    const responseData = await response.text().catch(() => '')
    let jsonOrText: any = responseData
    try {
      jsonOrText = JSON.parse(responseData)
    } catch (e) {
      // plain text
    }

    if (typeof jsonOrText === 'object' && jsonOrText !== null) {
      return NextResponse.json(jsonOrText, { status: response.status })
    }

    return new NextResponse(responseData, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'text/plain' },
    })
  } catch (err: any) {
    console.error('[Proxy Handler Error]:', err)
    return NextResponse.json({ message: 'Proxy request failed.' }, { status: 502 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleProxyRequest(request, resolvedParams)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleProxyRequest(request, resolvedParams)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleProxyRequest(request, resolvedParams)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleProxyRequest(request, resolvedParams)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleProxyRequest(request, resolvedParams)
}
