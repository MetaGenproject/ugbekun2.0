/**
 * Centralized Cache Buster Utility for Ugbekun 2.0 Frontend
 * Prevents browser and proxy stale caching for API requests, dynamic images, and media assets.
 */

/**
 * Appends a cache busting timestamp or version parameter (_cb) to any given URL string.
 * Accurately handles existing query parameters, relative/absolute URLs, and hash fragments.
 * 
 * @param url The target URL string
 * @param customToken Optional custom version string or timestamp
 * @returns The cache-busted URL string
 */
export function appendCacheBuster(url: string, customToken?: string | number): string {
  if (!url) return '';
  
  // Skip data URLs or blob URLs
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const token = customToken !== undefined ? String(customToken) : Date.now().toString();

  try {
    // If it's a full valid URL with protocol
    if (url.includes('://')) {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('_cb', token);
      return parsedUrl.toString();
    }

    // Handle relative or absolute paths
    const [baseAndQuery, hash] = url.split('#');
    const [basePath, queryString] = baseAndQuery.split('?');

    const searchParams = new URLSearchParams(queryString || '');
    searchParams.set('_cb', token);

    const newQuery = searchParams.toString();
    const newUrl = `${basePath}?${newQuery}`;
    return hash ? `${newUrl}#${hash}` : newUrl;
  } catch (err) {
    // Fallback simple string append
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_cb=${token}`;
  }
}

/**
 * Generates standard anti-caching HTTP request headers.
 */
export function getCacheBustingHeaders(): Record<string, string> {
  // Query parameter _cb=timestamp handles 100% of cache-busting without triggering CORS preflight header blocks
  return {};
}

/**
 * Helper to clear local storage cache or application caches on demand.
 */
export function clearClientAppCache(): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear application specific cache keys if any
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('temp_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('[CacheBuster] Failed to clear localStorage cache:', e);
  }
}
