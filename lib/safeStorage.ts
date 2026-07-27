/**
 * Lightweight Storage Utility for Ugbekun 2.0 Frontend.
 * Uses standard HTML5 localStorage and sessionStorage with safe try-catch wrappers.
 */

export const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;

    try {
      if (window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null && val !== '') return val;
      }
    } catch (e) {
      // ignore
    }

    try {
      if (window.sessionStorage) {
        const val = window.sessionStorage.getItem(key);
        if (val !== null && val !== '') return val;
      }
    } catch (e) {
      // ignore
    }

    return null;
  },

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;

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

    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, sanitizedValue);
      }
    } catch (e) {
      console.warn(`safeStorage localStorage.setItem failed for key "${key}":`, e);
    }

    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, sanitizedValue);
      }
    } catch (e) {
      console.warn(`safeStorage sessionStorage.setItem failed for key "${key}":`, e);
    }
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;

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
  }
};
