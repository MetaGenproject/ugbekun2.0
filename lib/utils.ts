import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely resolves a photo URL. If photo is a legacy hash, empty, or placeholder like 'defualt.png',
 * returns null so UI renders the fallback initials avatar instead of firing a broken request.
 */
export function getValidPhotoUrl(photo?: string | null): string | null {
  if (!photo) return null
  const clean = String(photo).trim()
  if (
    !clean ||
    clean === 'defualt.png' ||
    clean === 'default.png' ||
    clean === 'placeholder.jpg' ||
    clean === 'null' ||
    clean === 'undefined'
  ) {
    return null
  }
  // Must be an absolute http/https URL, a data URI, or a static public asset starting with '/'
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image/')) {
    return clean
  }
  if (clean.startsWith('/') && !clean.includes('..')) {
    return clean
  }
  // Legacy unhosted filename (e.g. '86e33473b8d478d84467314df88b6ae1.jpg')
  return null
}

