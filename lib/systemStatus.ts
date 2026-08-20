/**
 * System Error, Status & User Feedback Centralized System
 * Maps operational states to standard visual presets across Ugbekun applications.
 */

export type SystemStatusType =
  | 'PROCESSING'
  | 'SUCCESS'
  | 'ACTION_SUCCESS'
  | 'UNABLE'
  | 'MISSING_INFO'
  | 'SERVER_ERROR'
  | 'DUPLICATE'
  | 'PERMISSION_DENIED'

export interface SystemStatusPayload {
  id?: string
  type: SystemStatusType
  title: string
  message?: string
  durationMs?: number
}

export interface StatusPresetConfig {
  title: string
  badgeBg: string
  badgeText: string
  borderColor: string
  bgColor: string
  textColor: string
  iconType: 'spinner' | 'check' | 'sparkles' | 'alert' | 'help' | 'server' | 'copy' | 'lock'
}

export const SYSTEM_STATUS_PRESETS: Record<SystemStatusType, StatusPresetConfig> = {
  PROCESSING: {
    title: 'Processing...',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50/95',
    textColor: 'text-blue-900',
    iconType: 'spinner',
  },
  SUCCESS: {
    title: 'Successfully completed.',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50/95',
    textColor: 'text-emerald-900',
    iconType: 'check',
  },
  ACTION_SUCCESS: {
    title: 'Action completed successfully.',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50/95',
    textColor: 'text-emerald-900',
    iconType: 'sparkles',
  },
  UNABLE: {
    title: 'Unable to complete request.',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-200',
    bgColor: 'bg-rose-50/95',
    textColor: 'text-rose-900',
    iconType: 'alert',
  },
  MISSING_INFO: {
    title: 'Required information missing.',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50/95',
    textColor: 'text-amber-900',
    iconType: 'help',
  },
  SERVER_ERROR: {
    title: 'Connection/server error.',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    borderColor: 'border-red-300',
    bgColor: 'bg-red-50/95',
    textColor: 'text-red-950',
    iconType: 'server',
  },
  DUPLICATE: {
    title: 'Duplicate record.',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    borderColor: 'border-orange-200',
    bgColor: 'bg-orange-50/95',
    textColor: 'text-orange-900',
    iconType: 'copy',
  },
  PERMISSION_DENIED: {
    title: 'Permission denied.',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50/95',
    textColor: 'text-purple-900',
    iconType: 'lock',
  },
}

// Event bus dispatch target
const SYSTEM_STATUS_EVENT = 'ugbekun_system_status'

export function showSystemStatus(payload: SystemStatusPayload) {
  if (typeof window === 'undefined') return
  const preset = SYSTEM_STATUS_PRESETS[payload.type]
  const finalPayload: SystemStatusPayload = {
    id: payload.id || Math.random().toString(36).substring(2, 9),
    type: payload.type,
    title: payload.title || preset.title,
    message: payload.message,
    durationMs: payload.durationMs ?? (payload.type === 'PROCESSING' ? 0 : 4500),
  }

  window.dispatchEvent(
    new CustomEvent(SYSTEM_STATUS_EVENT, { detail: finalPayload })
  )
}

export function resolveHttpStatus(status: number, customMessage?: string): SystemStatusPayload {
  switch (status) {
    case 400:
      return {
        type: 'MISSING_INFO',
        title: 'Required information missing.',
        message: customMessage || 'Please verify all required fields and try again.',
      }
    case 403:
      return {
        type: 'PERMISSION_DENIED',
        title: 'Permission denied.',
        message: customMessage || 'You do not have access rights to perform this operation.',
      }
    case 409:
      return {
        type: 'DUPLICATE',
        title: 'Duplicate record.',
        message: customMessage || 'A record with this information already exists in the system.',
      }
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: 'SERVER_ERROR',
        title: 'Connection/server error.',
        message: customMessage || 'The backend server experienced an error. Please try again.',
      }
    default:
      return {
        type: 'UNABLE',
        title: 'Unable to complete request.',
        message: customMessage || `Request failed with status ${status}.`,
      }
  }
}
