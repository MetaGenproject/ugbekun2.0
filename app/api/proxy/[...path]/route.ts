import { NextRequest, NextResponse } from 'next/server'

const getBackendUrl = (): string => {
  const rawUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
  return rawUrl.replace(/\/$/, '').replace(/\/api$/, '')
}

async function handleProxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const backendHost = getBackendUrl()
    const path = params.path ? params.path.join('/') : ''
    const searchParams = request.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ''
    const targetUrl = `${backendHost}/api/${path}${queryString}`

    // Copy incoming auth headers
    const incomingHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (lowerKey === 'authorization' || lowerKey === 'x-admin-teacher-id' || lowerKey === 'content-type') {
        incomingHeaders[key] = value
      }
    })

    // If Authorization missing in headers, read from cookie
    if (!incomingHeaders['authorization'] && !incomingHeaders['Authorization']) {
      const tokenCookie = request.cookies.get('ugbekun_token')?.value
      if (tokenCookie) {
        incomingHeaders['Authorization'] = `Bearer ${tokenCookie}`
      }
    }

    let body: any = null
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text().catch(() => null)
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...incomingHeaders,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
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
