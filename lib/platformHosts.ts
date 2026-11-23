export const PLATFORM_APEX_HOSTS = [
  'localhost',
  '127.0.0.1',
  'ugbekun.edu.ng',
  'www.ugbekun.edu.ng',
  'ugbekun-beta.vercel.app',
  'www.ugbekun-beta.vercel.app',
  'ugbekun.com',
  'www.ugbekun.com',
  'app.ugbekun.com',
  'www.app.ugbekun.com',
  'ugbekun-frontend.abj.pipeops.app',
] as const

const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin'])

export function normalizeTenantHost(hostHeader?: string | null): {
  rawHostname: string
  normalizedHostname: string
  isPlatformApex: boolean
  subdomain: string | null
  isCustomDomain: boolean
  isTenantHost: boolean
} {
  const rawHostname = String(hostHeader || '')
    .split(':')[0]
    .trim()
    .toLowerCase()

  const isPlatformApex = (PLATFORM_APEX_HOSTS as readonly string[]).includes(rawHostname)
  const normalizedHostname =
    !isPlatformApex && rawHostname.startsWith('www.') ? rawHostname.slice(4) : rawHostname

  let subdomain: string | null = null
  for (const apex of PLATFORM_APEX_HOSTS) {
    if (normalizedHostname.endsWith(`.${apex}`)) {
      const sub = normalizedHostname.slice(0, normalizedHostname.length - apex.length - 1)
      if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
        subdomain = sub
        break
      }
    }
  }

  const isCustomDomain = Boolean(normalizedHostname) && !isPlatformApex && !subdomain
  const isTenantHost = Boolean(subdomain || isCustomDomain)

  return {
    rawHostname,
    normalizedHostname,
    isPlatformApex,
    subdomain,
    isCustomDomain,
    isTenantHost,
  }
}

