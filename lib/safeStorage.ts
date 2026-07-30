/**
 * Lightweight Storage Utility for Ugbekun 2.0 Frontend.
 * Uses standard HTML5 localStorage and sessionStorage with safe try-catch wrappers.
 * Includes an in-memory Map fallback for restricted mobile environments
 * (iOS private browsing, in-app WebViews, Android 8-9 WebView)
 * where localStorage/sessionStorage are both unavailable or quota-limited.
 */

// In-memory fallback — always available for the current page session
const memoryStore = new Map<string, string>();

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

    // 3. In-memory fallback (guaranteed for current page session)
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

    // 3. Always write to in-memory store as guaranteed fallback
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

    return 'memory';
  }
};
