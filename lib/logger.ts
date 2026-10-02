/**
 * Ugbekun 2.0 - Frontend Structured Logger & Telemetry Reporter
 * Provides consistent console output in development and dispatches client error telemetry
 * to the backend logs directory so engineering can diagnose issues without checking locally.
 */

const RECENT_ERROR_CACHE = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 4000;

function getApiEndpoint(): string {
  if (typeof window !== 'undefined') {
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/+$/, '');
  }
  return (process.env.BACKEND_API_URL || 'http://localhost:5001/api').replace(/\/+$/, '');
}

function getUserContext(): { userId?: string | number; role?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const rawUser = localStorage.getItem('ugbekun_user') || localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      return {
        userId: parsed.id || parsed.userId || parsed.sub,
        role: parsed.role || parsed.type,
      };
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Sends a client error payload to the backend error log asynchronously.
 */
export function reportClientError(payload: {
  message: string;
  stack?: string;
  componentStack?: string;
  context?: string;
  route?: string;
  data?: any;
}) {
  if (typeof window === 'undefined') return;

  const key = `${payload.message}::${payload.route || window.location.pathname}`;
  const now = Date.now();
  const lastSent = RECENT_ERROR_CACHE.get(key) || 0;
  if (now - lastSent < DEDUPLICATION_WINDOW_MS) {
    return; // Skip duplicate spam
  }
  RECENT_ERROR_CACHE.set(key, now);

  // Clean old cache entries
  if (RECENT_ERROR_CACHE.size > 50) {
    for (const [k, timestamp] of RECENT_ERROR_CACHE.entries()) {
      if (now - timestamp > 60000) RECENT_ERROR_CACHE.delete(k);
    }
  }

  const { userId, role } = getUserContext();
  const body = JSON.stringify({
    message: payload.message,
    stack: payload.stack,
    componentStack: payload.componentStack,
    route: payload.route || window.location.pathname,
    url: window.location.href,
    userAgent: navigator.userAgent,
    userId,
    role,
    timestamp: new Date().toISOString(),
    data: payload.data,
  });

  const targetUrl = `${getApiEndpoint()}/telemetry/client-error`;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(targetUrl, blob);
      if (sent) return;
    }

    fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Avoid recursive error logging on network failure
    });
  } catch {
    // Ignore telemetry send failure
  }
}

export const logger = {
  debug(context: string, message: string, data?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`%c[DEBUG]%c [${context}] ${message}`, 'color: #06b6d4; font-weight: bold;', 'color: inherit;', data || '');
    }
  },

  info(context: string, message: string, data?: any) {
    console.info(`%c[INFO]%c [${context}] ${message}`, 'color: #3b82f6; font-weight: bold;', 'color: inherit;', data || '');
  },

  warn(context: string, message: string, data?: any) {
    console.warn(`%c[WARN]%c [${context}] ${message}`, 'color: #f59e0b; font-weight: bold;', 'color: inherit;', data || '');
  },

  error(context: string, message: string, error?: any, data?: any) {
    const errorObj = error instanceof Error ? error : (typeof error === 'string' ? new Error(error) : undefined);
    const stack = errorObj?.stack || (error?.stack ? String(error.stack) : undefined);
    const errMessage = errorObj?.message || (error ? String(error) : message);

    console.error(`%c[ERROR]%c [${context}] ${message}`, 'color: #ef4444; font-weight: bold;', 'color: inherit;', error || '', data || '');

    reportClientError({
      message: `${message}: ${errMessage}`,
      stack,
      context,
      data,
    });
  },
};

export default logger;
