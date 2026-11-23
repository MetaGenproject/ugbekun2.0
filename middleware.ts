import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { normalizeTenantHost } from './lib/platformHosts'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostHeader = request.headers.get('host') || ''

  // Ignore static assets, next internal files, and api routes
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const {
    rawHostname,
    normalizedHostname,
    subdomain: detectedSubdomain,
    isCustomDomain,
  } = normalizeTenantHost(hostHeader)

  // Clone headers to inject tenant metadata for SSR metadata & branding
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-host', normalizedHostname)
  requestHeaders.set('x-tenant-raw-host', rawHostname)

  const queryBranchId = url.searchParams.get('branchId')
  const queryDomain = url.searchParams.get('domain')
  const querySubdomain = url.searchParams.get('subdomain') || detectedSubdomain

  if (queryBranchId) requestHeaders.set('x-tenant-branch-id', queryBranchId)
  if (queryDomain) requestHeaders.set('x-tenant-domain-param', queryDomain)
  if (querySubdomain) {
    requestHeaders.set('x-tenant-subdomain', querySubdomain)
  }

  // If visitor is accessing the root "/" from a custom domain, school subdomain, or with explicit query params, rewrite to /tenant-home
  const hasTenantParam = url.searchParams.has('branchId') || url.searchParams.has('domain') || url.searchParams.has('subdomain')
  if (url.pathname === '/' && (isCustomDomain || detectedSubdomain || hasTenantParam)) {
    const rewriteUrl = new URL('/tenant-home', request.url)
    if (detectedSubdomain) {
      rewriteUrl.searchParams.set('subdomain', detectedSubdomain)
    } else if (isCustomDomain) {
      rewriteUrl.searchParams.set('domain', normalizedHostname)
    }

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders
      }
    })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif|css|js|woff2?|map)$).*)',
  ],
}

