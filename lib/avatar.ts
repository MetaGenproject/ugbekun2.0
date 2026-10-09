const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

/**
 * Helper to get user profile or student avatar photo URL with default fallback.
 * Supports Cloudinary CDN URLs, local server /uploads/ paths, and default initials fallback.
 */
export function getAvatarUrl(photoUrl?: string | null, fallbackName: string = 'User'): string {
  if (photoUrl && photoUrl.trim() !== '' && photoUrl !== 'null' && photoUrl !== 'undefined') {
    const trimmed = photoUrl.trim()
    if (trimmed.startsWith('/uploads/')) {
      return `${BACKEND_BASE}${trimmed}`
    }
    return trimmed
  }
  const cleanName = encodeURIComponent(fallbackName.trim() || 'User')
  return `https://ui-avatars.com/api/?name=${cleanName}&background=2563eb&color=ffffff&bold=true`
}
