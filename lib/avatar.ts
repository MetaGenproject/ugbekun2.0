/**
 * Helper to get user profile or student avatar photo URL with default fallback.
 * If photo is not uploaded or missing, returns a clean default avatar image.
 */
export function getAvatarUrl(photoUrl?: string | null, fallbackName: string = 'User'): string {
  if (photoUrl && photoUrl.trim() !== '' && photoUrl !== 'null' && photoUrl !== 'undefined') {
    return photoUrl
  }
  const cleanName = encodeURIComponent(fallbackName.trim() || 'User')
  return `https://ui-avatars.com/api/?name=${cleanName}&background=2563eb&color=ffffff&bold=true`
}
