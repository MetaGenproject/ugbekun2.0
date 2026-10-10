import { NextRequest, NextResponse } from 'next/server'
import { applyAuthCookie, AUTH_COOKIE_NAME, getBackendUrl } from '@/lib/serverAuth'

export const runtime = 'nodejs'
export const maxDuration = 60

function stripToken(payload: Record<string, unknown>) {
  const { token, ...publicJson } = payload
  return { token: typeof token === 'string' ? token : null, publicJson }
}

async function handleProxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const backendHost = getBackendUrl()
    const path = params.path ? params.path.join('/') : ''
    const searchParams = request.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ''
    const targetUrl = `${backendHost}/api/${path}${queryString}`

    const forwardHeaders: Record<string, string> = {
      Accept: request.headers.get('accept') || '*/*',
    }

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader) {
      forwardHeaders['Authorization'] = authHeader
    } else {
      const tokenCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value
      if (tokenCookie) {
        forwardHeaders['Authorization'] = `Bearer ${tokenCookie}`
      }
    }

    const teacherHeader = request.headers.get('x-admin-teacher-id')
    if (teacherHeader) {
      forwardHeaders['x-admin-teacher-id'] = teacherHeader
    }

    const branchHeader = request.headers.get('x-branch-id')
    if (branchHeader) {
      forwardHeaders['x-branch-id'] = branchHeader
    }

    const rawContentType = request.headers.get('content-type')
    if (rawContentType) {
      forwardHeaders['Content-Type'] = rawContentType.split(',')[0].trim()
    }

    let body: ArrayBuffer | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.arrayBuffer().catch(() => undefined)
      if (body && body.byteLength === 0) body = undefined
    }

    const isIdempotent = request.method === 'GET' || request.method === 'HEAD'
    let response: Response

    const executeFetch = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000)
      try {
        const res = await fetch(targetUrl, {
          method: request.method,
          headers: forwardHeaders,
          body: body && body.byteLength > 0 ? body : undefined,
          signal: controller.signal,
        })
        return res
      } finally {
        clearTimeout(timeoutId)
      }
    }

    try {
      response = await executeFetch()
      // If upstream is cold-starting and returns a 502/503/504 on a GET/HEAD, retry once after a short delay
      if (isIdempotent && (response.status === 502 || response.status === 503 || response.status === 504)) {
        await new Promise((r) => setTimeout(r, 2000))
        response = await executeFetch()
      }
    } catch (initialErr) {
      if (isIdempotent) {
        await new Promise((r) => setTimeout(r, 2000))
        response = await executeFetch()
      } else {
        throw initialErr
      }
    }

    const responseContentType = response.headers.get('content-type') || ''
    const issuesSession = /^(auth\/(login|register|refresh)|onboarding\/.*register)/i.test(path)

    if (responseContentType.includes('application/json')) {
      const jsonOrText = await response.json().catch(() => null)
      if (jsonOrText && typeof jsonOrText === 'object') {
        const { token, publicJson } = stripToken(jsonOrText as Record<string, unknown>)
        // Include token for auth flows so Safari/iOS clients can retain it for Authorization header fallback
        const payloadToSend = issuesSession && token ? { ...publicJson, token } : publicJson
        const nextRes = NextResponse.json(payloadToSend, { status: response.status })
        if (issuesSession && token) {
          applyAuthCookie(nextRes, token, request)
        }
        return nextRes
      }
      return NextResponse.json(jsonOrText ?? { message: 'Empty response.' }, { status: response.status })
    }

    const buf = await response.arrayBuffer()
    const headers = new Headers()
    headers.set('Content-Type', responseContentType || 'application/octet-stream')
    const disposition = response.headers.get('content-disposition')
    if (disposition) headers.set('Content-Disposition', disposition)
    return new NextResponse(buf, { status: response.status, headers })
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
