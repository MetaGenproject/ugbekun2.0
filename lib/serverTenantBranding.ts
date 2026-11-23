import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { normalizeTenantHost } from './platformHosts'
import { resolveAbsoluteLogoUrl } from './documentBranding'

export interface ServerTenantBranding {
  branchId: number
  schoolName: string
  logoUrl: string | null
  tagline?: string
  isCustomDomain?: boolean
}

const DEFAULT_ICONS: Metadata['icons'] = {
  icon: [
    { url: '/favicon.ico', sizes: 'any' },
    { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
  ],
  apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  shortcut: '/favicon.ico',
}

/**
 * Resolves school branding on the server during Next.js SSR from tenant headers
 * (injected by middleware) or explicit URL search params.
 * Returns null for central platform hosts without tenant context.
 */
export async function resolveServerTenantBranding(explicit?: {
  branchId?: string | null
  domain?: string | null
  subdomain?: string | null
}): Promise<ServerTenantBranding | null> {
  try {
    const hdrs = await headers()
    const rawHost = hdrs.get('x-tenant-host') || hdrs.get('host') || ''
    const headerSubdomain = hdrs.get('x-tenant-subdomain')
    const headerBranchId = hdrs.get('x-tenant-branch-id')
    const headerDomainParam = hdrs.get('x-tenant-domain-param')
    const hostInfo = normalizeTenantHost(rawHost)

    const branchId = explicit?.branchId?.trim() || headerBranchId?.trim() || null
    const domain = explicit?.domain?.trim() || headerDomainParam?.trim() || null
    const subdomain = explicit?.subdomain?.trim() || headerSubdomain?.trim() || hostInfo.subdomain

    const hasExplicitParam = Boolean(branchId || domain || subdomain)
    if (!hasExplicitParam && !hostInfo.isTenantHost) {
      return null
    }

    const query = new URLSearchParams()
    if (branchId) query.set('branchId', branchId)
    if (subdomain) query.set('subdomain', subdomain)
    if (domain) {
      query.set('domain', domain)
    } else if (!branchId && !subdomain && hostInfo.normalizedHostname) {
      query.set('domain', hostInfo.normalizedHostname)
    }

    const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ugbekun.com').replace(/\/api\/?$/, '')
    const res = await fetch(`${backendBase}/api/public/tenant/branding?${query.toString()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) return null

    const json = await res.json().catch(() => null)
    const data = json?.data
    if (!json?.success || !data || !data.branchId || !data.schoolName) {
      return null
    }

    return {
      branchId: Number(data.branchId),
      schoolName: String(data.schoolName).trim(),
      logoUrl: resolveAbsoluteLogoUrl(data.logoUrl),
      tagline: data.tagline,
      isCustomDomain: Boolean(data.isCustomDomain || hostInfo.isTenantHost),
    }
  } catch {
    return null
  }
}

export function buildTenantMetadata(
  tenant: ServerTenantBranding | null,
  fallbackTitle = 'Ugbekun - School Management System',
  fallbackDescription = 'Modern school management platform with QR attendance, online classes, fees management, exams, and parent/student portals'
): Metadata {
  if (!tenant?.schoolName) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      icons: DEFAULT_ICONS,
    }
  }

  const title = `${tenant.schoolName} - School Management System`
  const description = tenant.tagline || `${tenant.schoolName} - School Management System`
  const icons: Metadata['icons'] = tenant.logoUrl
    ? {
        icon: [{ url: tenant.logoUrl }],
        apple: [{ url: tenant.logoUrl }],
        shortcut: tenant.logoUrl,
      }
    : DEFAULT_ICONS

  return {
    title,
    description,
    icons,
  }
}