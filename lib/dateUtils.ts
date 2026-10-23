/**
 * Safe Date & Time Helpers for Ugbekun 2.0
 * Provides robust fallbacks for older Android/iOS WebViews that lack ICU
 * full timezone databases (e.g. throwing on timeZone: 'Africa/Lagos').
 *
 * West Africa Time (WAT) is UTC+1 year-round with NO Daylight Saving Time.
 */

/**
 * Returns today's date in YYYY-MM-DD format according to Lagos time (UTC+1).
 */
export function getLagosDateKey(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch (err) {
    // Fallback for older phones where timeZone parameter throws RangeError
    const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
    const lagosTime = new Date(utcTime + 3600000); // UTC+1
    const y = lagosTime.getFullYear();
    const m = String(lagosTime.getMonth() + 1).padStart(2, '0');
    const d = String(lagosTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Formats a readable date string safely
 */
export function formatLagosLongDate(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(`${dateInput.slice(0, 10)}T12:00:00`) : dateInput;
  try {
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Lagos',
    });
  } catch (err) {
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}

/**
 * Returns current Lagos hour (0-23)
 */
export function getLagosHour(date: Date = new Date()): number {
  try {
    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: 'numeric',
      hour12: false,
    }).format(date);
    return Number(formatted);
  } catch (err) {
    const utcHours = date.getUTCHours();
    return (utcHours + 1) % 24;
  }
}
