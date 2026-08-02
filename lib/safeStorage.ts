/**
 * Lightweight Storage Utility for Ugbekun 2.0 Frontend.
 * Uses standard HTML5 localStorage and sessionStorage with safe try-catch wrappers.
 * Includes an in-memory Map fallback for restricted mobile environments
 * (iOS private browsing, in-app WebViews, Android 8-9 WebView)
 * where localStorage/sessionStorage are both unavailable or quota-limited.
 */

// In-memory fallback — always available for the current page session
const memoryStore = new Map<string, string>();
const AUTH_COOKIE_KEYS = new Set(['ugbekun_token', 'ugbekun_user']);
const WINDOW_NAME_SESSION_KEY = '__ugbekun_window_name_session__';

const getWindowNameStore = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.name;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
};

const setWindowNameStore = (store: Record<string, string>): void => {
  if (typeof window === 'undefined') return;

  try {
    window.name = JSON.stringify(store);
  } catch (e) {
    // ignore window.name write issues
  }
};

const getCookie = (key: string): string | null => {
  if (typeof document === 'undefined') return null;

  try {
    const escapedKey = key.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
    const match = document.cookie.match(new RegExp(`(?:^|; )${escapedKey}=([^;]*)`));
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch (e) {
    return null;
  }
};

const setCookie = (key: string, value: string, maxAgeSeconds = 60 * 60 * 8): void => {
  if (typeof document === 'undefined') return;

  try {
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=None`;
  } catch (e) {
    // ignore cookie write issues
  }
};

const clearCookie = (key: string): void => {
  if (typeof document === 'undefined') return;

  try {
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None`;
  } catch (e) {
    // ignore cookie clearing issues
  }
};

export const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return memoryStore.get(key) ?? null;

    // 1. Try localStorage first
    try {
      if (window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null && val !== '') return val;
      }
    } catch (e) {
      // localStorage blocked (private mode, in-app browser, etc.)
    }

    // 2. Try sessionStorage
    try {
      if (window.sessionStorage) {
        const val = window.sessionStorage.getItem(key);
        if (val !== null && val !== '') return val;
      }
    } catch (e) {
      // sessionStorage blocked
    }

    // 3. Cookie fallback for auth tokens (more reliable on older mobile browsers)
    if (AUTH_COOKIE_KEYS.has(key)) {
      const cookieValue = getCookie(key);
      if (cookieValue !== null && cookieValue !== '') return cookieValue;
    }

    // 4. Window-name fallback (survives full navigation in same tab)
    const windowNameValue = getWindowNameStore()[key];
    if (windowNameValue !== undefined && windowNameValue !== '') return windowNameValue;

    // 5. In-memory fallback (guaranteed for current page session)
    return memoryStore.get(key) ?? null;
  },

  /**
   * Writes to localStorage, sessionStorage, and in-memory store.
   * Returns true if the value was successfully persisted to at least one backend.
   */
  setItem(key: string, value: string): boolean {
    if (typeof window === 'undefined') {
      memoryStore.set(key, value);
      return true;
    }

    let sanitizedValue = value;
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

    let persisted = false;

    // 1. Write to localStorage
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, sanitizedValue);
        // Verify write actually persisted (some browsers silently discard)
        if (window.localStorage.getItem(key) === sanitizedValue) {
          persisted = true;
        }
      }
    } catch (e) {
      // localStorage full or blocked
    }

    // 2. Write to sessionStorage
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, sanitizedValue);
        if (window.sessionStorage.getItem(key) === sanitizedValue) {
          persisted = true;
        }
      }
    } catch (e) {
      // sessionStorage full or blocked
    }

    // 3. Cookie fallback for auth values (older mobile browsers)
    if (AUTH_COOKIE_KEYS.has(key)) {
      try {
        setCookie(key, sanitizedValue);
        const cookieValue = getCookie(key);
        if (cookieValue === sanitizedValue) {
          persisted = true;
        }
      } catch (e) {
        // ignore cookie write issues
      }
    }

    // 4. Persist to window.name so a full redirect to /dashboard keeps the session
    if (AUTH_COOKIE_KEYS.has(key)) {
      const store = getWindowNameStore();
      store[key] = sanitizedValue;
      setWindowNameStore(store);
      persisted = true;
    }

    // 5. Always write to in-memory store as guaranteed fallback
    memoryStore.set(key, sanitizedValue);
    persisted = true;

    return persisted;
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') {
      memoryStore.delete(key);
      return;
    }

    try {
      if (window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // ignore
    }

    try {
      if (window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {
      // ignore
    }

    if (AUTH_COOKIE_KEYS.has(key)) {
      clearCookie(key);
      const store = getWindowNameStore();
      delete store[key];
      setWindowNameStore(store);
    }

    memoryStore.delete(key);
  },

  /**
   * Check if storage is functional (useful for diagnostics).
   * Returns 'localStorage' | 'sessionStorage' | 'memory' | 'none'
   */
  getActiveBackend(): string {
    if (typeof window === 'undefined') return 'memory';

    try {
      const testKey = '__ugbekun_storage_test__';
      window.localStorage.setItem(testKey, '1');
      const ok = window.localStorage.getItem(testKey) === '1';
      window.localStorage.removeItem(testKey);
      if (ok) return 'localStorage';
    } catch (e) {}

    try {
      const testKey = '__ugbekun_storage_test__';
      window.sessionStorage.setItem(testKey, '1');
      const ok = window.sessionStorage.getItem(testKey) === '1';
      window.sessionStorage.removeItem(testKey);
      if (ok) return 'sessionStorage';
    } catch (e) {}

    try {
      const store = getWindowNameStore();
      if (store && Object.keys(store).length > 0) return 'window-name';
    } catch (e) {}

    return 'memory';
  }
};
