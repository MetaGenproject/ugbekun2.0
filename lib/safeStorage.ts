/**
 * Safe Storage utility with transparent cookie, sessionStorage, and memory fallback.
 * Prevents SecurityError / DOMException crashes in restricted browser environments
 * (e.g., Safari Private Browsing, iOS WebKit restrictions, blocked cookies).
 */
const inMemoryStore: Record<string, string> = {};

const getCookieValue = (key: string): string | null => {
  try {
    if (typeof document === 'undefined' || !document.cookie) return null;

    const prefix = encodeURIComponent(key) + '=';
    const rawCookies = document.cookie.split(';');
    for (let c of rawCookies) {
      const cookie = c.trim();
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
    // 1. Try localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null && val !== '') return val;
      }
    } catch (e) {
      // ignore
    }

    // 2. Try sessionStorage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const val = window.sessionStorage.getItem(key);
        if (val !== null && val !== '') return val;
      }
    } catch (e) {
      // ignore
    }

    // 3. Try document.cookie
    const cookieValue = getCookieValue(key);
    if (cookieValue !== null && cookieValue !== '') return cookieValue;

    // 4. Try inMemoryStore
    if (inMemoryStore[key] && inMemoryStore[key] !== '') {
      return inMemoryStore[key];
    }

    return null;
  },

  setItem(key: string, value: string): void {
    let sanitizedValue = value;

    // Payload size safety: if setting user JSON payload, remove logo data to guarantee compact storage footprint
    if (key === 'ugbekun_user' && value) {
      try {
        const obj = JSON.parse(value);
        if (obj && obj.branch && typeof obj.branch === 'object') {
          delete obj.branch.logo;
        }
        sanitizedValue = JSON.stringify(obj);
      } catch (e) {
        // ignore parse error
      }
    }

    // Always update inMemoryStore first
    inMemoryStore[key] = sanitizedValue;

    // 1. Set localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, sanitizedValue);
      }
    } catch (e) {
      console.warn(`safeStorage.setItem localStorage failed for key "${key}":`, e);
    }

    // 2. Set sessionStorage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, sanitizedValue);
      }
    } catch (e) {
      console.warn(`safeStorage.setItem sessionStorage failed for key "${key}":`, e);
    }

    // 3. Set document.cookie
    try {
      if (typeof document !== 'undefined') {
        const encodedKey = encodeURIComponent(key);
        const encodedVal = encodeURIComponent(sanitizedValue);
        if (encodedKey.length + encodedVal.length <= 3800) {
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          const secureFlag = isSecure ? '; Secure' : '';
          document.cookie = `${encodedKey}=${encodedVal}; path=/; max-age=31536000${secureFlag}`;
        }
      }
    } catch (ce) {
      // ignore cookie failures
    }
  },

  removeItem(key: string): void {
    delete inMemoryStore[key];

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // ignore
    }

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {
      // ignore
    }

    try {
      if (typeof document !== 'undefined') {
        document.cookie = encodeURIComponent(key) + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch (ce) {
      // ignore
    }
  }
};
