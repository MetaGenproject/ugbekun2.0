const SYSTEM_SUFFIX = 'School Management System'
const DEFAULT_TITLE = `Ugbekun - ${SYSTEM_SUFFIX}`

const PLATFORM_NON_SCHOOL_NAMES = new Set([
  'ugbekun',
  'ugbekun admin portal',
  'ugbekun international academy',
  'metagen academy',
])

/**
 * Normalizes a logo URL so relative paths resolve safely when used in <link rel="icon">.
 */
export function resolveAbsoluteLogoUrl(logoUrl?: string | null): string | null {
  if (!logoUrl) return null
  const trimmed = String(logoUrl).trim()
  if (!trimmed) return null
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed
  }
  const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ugbekun.com').replace(/\/api\/?$/, '')
  if (trimmed.startsWith('/uploads')) {
    return `${backendBase}${trimmed}`
  }
  return trimmed
}

/**
 * Updates browser tab title and favicon(s) in real time for tenant school portals.
 */
export function applyDocumentBranding(params: {
  schoolName?: string | null
  logoUrl?: string | null
  isTenantScoped?: boolean
}) {
  if (typeof document === 'undefined') return

  const cleanName = String(params.schoolName || '').trim()
  const isRealSchool =
    Boolean(params.isTenantScoped) &&
    Boolean(cleanName) &&
    !PLATFORM_NON_SCHOOL_NAMES.has(cleanName.toLowerCase())

  if (!isRealSchool) return

  const targetTitle = `${cleanName} - ${SYSTEM_SUFFIX}`
  if (document.title !== targetTitle) {
    document.title = targetTitle
  }

  const resolvedLogo = resolveAbsoluteLogoUrl(params.logoUrl)
  if (!resolvedLogo) return

  // Update existing <link rel*="icon"> elements in place WITHOUT removing DOM nodes,
  // because React 19 / Next.js manages hoisted <head> link nodes and calling el.remove()
  // causes `removeChild` on null during fiber commit/navigation.
  const existingIcons = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]')
  )

  existingIcons.forEach((el) => {
    if (el.getAttribute('href') !== resolvedLogo) {
      el.setAttribute('href', resolvedLogo)
    }
    el.removeAttribute('sizes')
    el.removeAttribute('type')
  })

  const requiredRels = ['icon', 'shortcut icon', 'apple-touch-icon']
  requiredRels.forEach((rel) => {
    const hasRel = existingIcons.some((el) => el.rel.toLowerCase() === rel)
    if (!hasRel) {
      const link = document.createElement('link')
      link.rel = rel
      link.setAttribute('href', resolvedLogo)
      link.setAttribute('data-tenant-favicon', 'true')
      document.head.appendChild(link)
    }
  })
}

export function getDefaultDocumentTitle() {
  return DEFAULT_TITLE
}
