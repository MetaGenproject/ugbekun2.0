/**
 * Safe Storage utility with transparent cookie and sessionStorage fallback.
 * Prevents SecurityError / DOMException crashes in restricted browser environments
 * (e.g., Safari Private Browsing, blocked cookies, inside sandboxed iframes).
 */
const inMemoryStore: Record<string, string> = {};

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;

  try {
    if (window.localStorage) return window.localStorage;
  } catch (e) {
    // ignore and fall back
  }

  try {
    if (window.sessionStorage) return window.sessionStorage;
  } catch (e) {
    // ignore and fall back
  }

  return null;
};

const getCookieValue = (key: string): string | null => {
  try {
    if (typeof document === 'undefined') return null;

    const prefix = encodeURIComponent(key) + '=';
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      if (cookie.indexOf(prefix) === 0) {
        return decodeURIComponent(cookie.substring(prefix.length));
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
};

export const safeStorage = {
  getItem(key: string): string | null {
    const storage = getStorage();

    try {
      if (storage) {
        const val = storage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      console.warn(`safeStorage.getItem failed for key "${key}":`, e);
    }

    const cookieValue = getCookieValue(key);
    if (cookieValue !== null) return cookieValue;

    if (inMemoryStore[key] !== undefined) {
      return inMemoryStore[key];
    }

    return null;
  },

  setItem(key: string, value: string): void {
    const storage = getStorage();

    try {
      if (storage) {
        storage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`safeStorage.setItem failed for key "${key}":`, e);
    }

    try {
      if (typeof document !== 'undefined') {
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const secureFlag = isSecure ? '; Secure' : '';
        document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value) + '; path=/; max-age=31536000; SameSite=Lax' + secureFlag;
      }
    } catch (ce) {
      // ignore cookie failures
    }

    inMemoryStore[key] = value;
  },

  removeItem(key: string): void {
    const storage = getStorage();

    try {
      if (storage) {
        storage.removeItem(key);
      }
    } catch (e) {
      console.warn(`safeStorage.removeItem failed for key "${key}":`, e);
    }

    try {
      if (typeof document !== 'undefined') {
        document.cookie = encodeURIComponent(key) + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch (ce) {
      // ignore cookie failures
    }

    delete inMemoryStore[key];
  }
};
