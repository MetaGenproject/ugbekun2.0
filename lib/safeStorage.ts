/**
 * Safe Storage utility with transparent cookie fallback.
 * Prevents SecurityError / DOMException crashes in restricted browser environments
 * (e.g., Safari Private Browsing, blocked cookies, inside sandboxed iframes).
 */
const inMemoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      console.warn(`safeStorage.getItem failed for key "${key}":`, e);
    }
    
    // Cookie fallback
    try {
      if (typeof document !== 'undefined') {
        const prefix = encodeURIComponent(key) + "=";
        const cookies = document.cookie.split('; ');
        for (let i = 0; i < cookies.length; i++) {
          if (cookies[i].indexOf(prefix) === 0) {
            return decodeURIComponent(cookies[i].substring(prefix.length));
          }
        }
      }
    } catch (ce) {}

    // Memory fallback (for extremely restricted environments)
    if (inMemoryStore[key] !== undefined) {
      return inMemoryStore[key];
    }
    
    return null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`safeStorage.setItem failed for key "${key}":`, e);
    }

    // Always mirror/fallback to cookies
    try {
      if (typeof document !== 'undefined') {
        const isSecure = window.location.protocol === 'https:';
        const secureFlag = isSecure ? '; Secure' : '';
        document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + "; path=/; max-age=31536000; SameSite=Lax" + secureFlag;
      }
    } catch (ce) {}

    // Always mirror to in-memory store
    inMemoryStore[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`safeStorage.removeItem failed for key "${key}":`, e);
    }

    try {
      if (typeof document !== 'undefined') {
        document.cookie = encodeURIComponent(key) + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      }
    } catch (ce) {}

    delete inMemoryStore[key];
  }
};
