/**
 * Offline Attendance Queue & Persistence Service
 * Ensures marks entered by teachers are never lost, even if network drops,
 * phone runs low on RAM, or request fails.
 */

import { safeStorage } from './safeStorage'

export interface OfflineAttendanceDraft {
  key: string // classId-sectionId-date
  classId: number
  sectionId: number
  date: string
  records: Record<number, { status: string; remark: string }>
  updatedAt: number
  synced: boolean
}

const STORAGE_PREFIX = 'ugbekun_attendance_draft_'
const PENDING_KEYS_KEY = 'ugbekun_pending_attendance_keys'

export const getAttendanceDraftKey = (classId: number, sectionId: number, date: string): string => {
  return `${classId}_${sectionId}_${date}`
}

/**
 * Save draft marks locally (in localStorage with memory fallback)
 */
export const saveOfflineAttendanceDraft = (
  classId: number,
  sectionId: number,
  date: string,
  records: Record<number, { status: string; remark: string }>
): void => {
  try {
    const key = getAttendanceDraftKey(classId, sectionId, date)
    const draft: OfflineAttendanceDraft = {
      key,
      classId,
      sectionId,
      date,
      records,
      updatedAt: Date.now(),
      synced: false,
    }

    safeStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(draft))

    // Track pending keys for sync
    const pendingKeys = getPendingDraftKeys()
    if (!pendingKeys.includes(key)) {
      pendingKeys.push(key)
      safeStorage.setItem(PENDING_KEYS_KEY, JSON.stringify(pendingKeys))
    }
  } catch (err) {
    console.warn('Failed to save offline attendance draft:', err)
  }
}

/**
 * Retrieve a local draft if available
 */
export const getOfflineAttendanceDraft = (
  classId: number,
  sectionId: number,
  date: string
): OfflineAttendanceDraft | null => {
  try {
    const key = getAttendanceDraftKey(classId, sectionId, date)
    const raw = safeStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!raw) return null
    return JSON.parse(raw) as OfflineAttendanceDraft
  } catch (err) {
    return null
  }
}

/**
 * Mark draft as successfully synced
 */
export const markAttendanceDraftSynced = (
  classId: number,
  sectionId: number,
  date: string
): void => {
  try {
    const key = getAttendanceDraftKey(classId, sectionId, date)
    safeStorage.removeItem(`${STORAGE_PREFIX}${key}`)

    const pendingKeys = getPendingDraftKeys().filter((k) => k !== key)
    safeStorage.setItem(PENDING_KEYS_KEY, JSON.stringify(pendingKeys))
  } catch (err) {
    console.warn('Failed to clean up synced draft:', err)
  }
}

/**
 * Get list of all pending attendance draft keys
 */
export const getPendingDraftKeys = (): string[] => {
  try {
    const raw = safeStorage.getItem(PENDING_KEYS_KEY)
    if (!raw) return []
    return JSON.parse(raw) || []
  } catch (err) {
    return []
  }
}

/**
 * Check if browser is currently online
 */
export const isDeviceOnline = (): boolean => {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine !== false
}
