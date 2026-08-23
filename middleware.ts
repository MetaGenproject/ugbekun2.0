import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PLATFORM_HOSTS = [
  'localhost',
  '127.0.0.1',
  'ugbekun.edu.ng',
  'www.ugbekun.edu.ng',
  'ugbekun-beta.vercel.app',
  'www.ugbekun-beta.vercel.app',
  'ugbekun.com',
  'www.ugbekun.com'
]

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostHeader = request.headers.get('host') || ''
  
  // Extract hostname without port
  const hostname = hostHeader.split(':')[0].toLowerCase()

  // Ignore static assets, next internal files, and api routes
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Clone headers to inject tenant metadata
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-host', hostname)

  // Check if current hostname is a known apex platform domain
  const isPlatformApex = PLATFORM_HOSTS.includes(hostname)

  // Check for platform subdomain (e.g. "uiss.ugbekun.edu.ng" or "uiss.localhost")
  let detectedSubdomain: string | null = null
  for (const apex of PLATFORM_HOSTS) {
    if (hostname.endsWith(`.${apex}`)) {
      const sub = hostname.slice(0, hostname.length - apex.length - 1)
      if (sub && sub !== 'www' && sub !== 'app' && sub !== 'api' && sub !== 'admin') {
        detectedSubdomain = sub
        break
      }
    }
  }

  const isCustomDomain = !isPlatformApex && !detectedSubdomain

  if (detectedSubdomain) {
    requestHeaders.set('x-tenant-subdomain', detectedSubdomain)
  }

  // If visitor is accessing the root "/" from a custom domain or school subdomain, rewrite to /tenant-home
  if (url.pathname === '/' && (isCustomDomain || detectedSubdomain)) {
    const rewriteUrl = new URL('/tenant-home', request.url)
    if (detectedSubdomain) {
      rewriteUrl.searchParams.set('subdomain', detectedSubdomain)
    } else if (isCustomDomain) {
      rewriteUrl.searchParams.set('domain', hostname)
    }

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders
      }
    })
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)']
}
