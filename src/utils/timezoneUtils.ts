/**
 * Timezone Utilities for Trench Trace Portal
 * 
 * This application operates in Singapore timezone (UTC+8).
 * All dates/times should be handled consistently to prevent data corruption.
 * 
 * CRITICAL RULES:
 * 1. Database stores all TIMESTAMP fields in UTC
 * 2. Frontend displays times in Singapore timezone (UTC+8)
 * 3. User inputs are treated as Singapore local time
 * 4. All conversions must preserve the intended date/time
 */

// Singapore timezone constant
export const SINGAPORE_TIMEZONE = 'Asia/Singapore';
export const SINGAPORE_UTC_OFFSET = 8; // UTC+8

/**
 * Convert a local Singapore datetime to UTC for database storage
 * @param localDateTime - Date object representing Singapore local time
 * @returns ISO string in UTC format for database storage
 */
export const toUTCForDatabase = (localDateTime: Date): string => {
  // The Date object is already in the correct timezone context
  // toISOString() automatically converts to UTC
  return localDateTime.toISOString();
};

/**
 * Convert UTC datetime string from database to Singapore local time
 * @param utcString - UTC datetime string from database
 * @returns Date object in Singapore local time
 */
export const fromUTCToLocal = (utcString: string): Date => {
  // Create Date object from UTC string (JavaScript automatically handles this correctly)
  return new Date(utcString);
};

/**
 * Format datetime for datetime-local input (Singapore local time)
 * @param date - Date object
 * @returns String in YYYY-MM-DDTHH:mm format for datetime-local input
 */
export const formatForDateTimeLocal = (date: Date): string => {
  // Get the date in Singapore timezone
  const singaporeTime = new Date(date.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
  
  const year = singaporeTime.getFullYear();
  const month = String(singaporeTime.getMonth() + 1).padStart(2, '0');
  const day = String(singaporeTime.getDate()).padStart(2, '0');
  const hours = String(singaporeTime.getHours()).padStart(2, '0');
  const minutes = String(singaporeTime.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Parse datetime-local input value to Date object (Singapore local time)
 * @param datetimeLocalValue - Value from datetime-local input (YYYY-MM-DDTHH:mm)
 * @returns Date object representing Singapore local time
 */
export const parseFromDateTimeLocal = (datetimeLocalValue: string): Date => {
  // datetime-local gives us local time without timezone info
  // We need to treat this as Singapore time and create a proper Date object
  
  // Parse the local datetime string
  const [datePart, timePart] = datetimeLocalValue.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date in Singapore timezone
  // Note: month is 0-based in JavaScript Date constructor
  const singaporeDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  return singaporeDate;
};

/**
 * Get date part in Singapore timezone (YYYY-MM-DD format)
 * @param date - Date object or UTC string
 * @returns Date string in YYYY-MM-DD format (Singapore local date)
 */
export const getLocalDateString = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get date in Singapore timezone
  const singaporeTime = new Date(dateObj.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
  
  const year = singaporeTime.getFullYear();
  const month = String(singaporeTime.getMonth() + 1).padStart(2, '0');
  const day = String(singaporeTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format time for display (Singapore local time)
 * @param dateTime - Date object or UTC string
 * @returns Time string in HH:mm format
 */
export const formatDisplayTime = (dateTime: Date | string): string => {
  if (!dateTime) {
    return '';
  }
  
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  // Check if the date is valid
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SINGAPORE_TIMEZONE
  });
};

/**
 * Format time with seconds for display (Singapore local time, HH:mm:ss).
 * Used by event logs / live timelines where second-level precision matters.
 */
export const formatDisplayTimeWithSeconds = (dateTime: Date | string): string => {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: SINGAPORE_TIMEZONE,
  });
};

/**
 * Format date + time for display (Singapore local time)
 * @param dateTime - Date object or UTC string
 * @returns DateTime string in "24 Mar 09:30" format
 */
export const formatDisplayDateTime = (dateTime: Date | string): string => {
  if (!dateTime) {
    return '';
  }

  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;

  if (!dateObj || isNaN(dateObj.getTime())) {
    return '';
  }

  const datePart = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: SINGAPORE_TIMEZONE,
  });
  const timePart = dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SINGAPORE_TIMEZONE,
  });
  return `${datePart} ${timePart}`;
};

/**
 * Format date for display (Singapore local time)
 * @param dateTime - Date object or UTC string
 * @returns Date string in DD format
 */
export const formatDisplayDate = (dateTime: Date | string): string => {
  if (!dateTime) {
    return '';
  }
  
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  // Check if the date is valid
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    day: '2-digit',
    timeZone: SINGAPORE_TIMEZONE
  });
};

/**
 * Get day name (Singapore local time)
 * @param dateTime - Date object or UTC string
 * @returns Day name (e.g., 'Mon', 'Tue')
 */
export const getDisplayDayName = (dateTime: Date | string): string => {
  if (!dateTime) {
    return '';
  }
  
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  // Check if the date is valid
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString('en-GB', {
    weekday: 'short',
    timeZone: SINGAPORE_TIMEZONE
  });
};

/**
 * Get current Singapore time
 *
 * ⚠️ Returns a plain `new Date()` — the instant is correct, but every getter on
 * it (`getHours`, `getFullYear`, …) and every `toLocaleString` without an
 * explicit `timeZone` reads the BROWSER's zone, not SGT. Use it only where an
 * instant is wanted (comparisons, "now" arguments). For anything a user reads
 * or a number derived from the SG calendar, use a `formatDisplay*` helper or
 * `getSingaporeYear()` / `getLocalDateString()`.
 *
 * @returns Date object representing the current instant
 */
export const getCurrentSingaporeTime = (): Date => {
  return new Date();
};

/**
 * Calendar year on the SG clock — e.g. 2026.
 *
 * `new Date().getFullYear()` is browser-local: west of SGT it returns last year
 * for the first hours of 1 January. Used for reference-year math that must
 * match the Singapore calendar (CPF retirement sums, age-from-DOB).
 */
export const getSingaporeYear = (date: Date = new Date()): number => {
  return Number(getLocalDateString(date).slice(0, 4));
};

/**
 * Validate that datetime is in 30-minute increments
 * @param dateTime - Date object to validate
 * @returns boolean indicating if time is valid
 */
export const isValidTimeIncrement = (dateTime: Date): boolean => {
  const minutes = dateTime.getMinutes();
  return minutes === 0 || minutes === 30;
};

/**
 * Create default work time (8:00 AM Singapore time)
 * @param date - Optional date, defaults to today
 * @returns Date object set to 8:00 AM Singapore time
 */
export const createDefaultStartTime = (date?: Date): Date => {
  const baseDate = date || new Date();
  const startTime = new Date(baseDate);
  startTime.setHours(8, 0, 0, 0);
  return startTime;
};

/**
 * Create default end time (17:00 PM Singapore time)
 * @param date - Optional date, defaults to today
 * @returns Date object set to 17:00 PM Singapore time
 */
export const createDefaultEndTime = (date?: Date): Date => {
  const baseDate = date || new Date();
  const endTime = new Date(baseDate);
  endTime.setHours(17, 0, 0, 0);
  return endTime;
};

/**
 * Parse a UTC/ISO timestamp from the database into a Date object.
 * Alias for `new Date(s)` with Date passthrough — the whole point is to have a
 * single sanctioned call site that W12.04 can swap `parseISO` to without
 * asking every caller to think about timezones.
 */
export const parseFromDatabase = (value: Date | string): Date => {
  return typeof value === 'string' ? new Date(value) : value;
};

/**
 * Format month + year in SGT — e.g. "April 2026".
 * Used for payroll period labels and month pickers.
 */
export const formatMonthYear = (dateTime: Date | string): string => {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: SINGAPORE_TIMEZONE,
  });
};

// TODO W08: consolidate with canonical display style once design system lands.
// Today we preserve caller intent; W08 will pick ONE.
export const formatDisplayDateLong = (dateTime: Date | string): string => {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: SINGAPORE_TIMEZONE,
  });
};

// TODO W08: consolidate with canonical display style once design system lands.
export const formatDisplayDateTimeLong = (dateTime: Date | string): string => {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const datePart = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: SINGAPORE_TIMEZONE,
  });
  const timePart = dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SINGAPORE_TIMEZONE,
  });
  return `${datePart}, ${timePart}`;
};

// TODO W08: consolidate with canonical display style once design system lands.
export const formatDisplayDateSlashed = (dateTime: Date | string): string => {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: SINGAPORE_TIMEZONE,
  });
};

// TODO W08: consolidate with canonical display style once design system lands.
export const formatDisplayDateTimeSlashed = (dateTime: Date | string): string => {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const datePart = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: SINGAPORE_TIMEZONE,
  });
  const timePart = dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SINGAPORE_TIMEZONE,
  });
  return `${datePart} ${timePart}`;
};

/**
 * Compact numeric SGT date — "dd/mm/yy" (2-digit year). Canonical display
 * for the design-system date cells/pickers (2026-05-29). Use this over the
 * spelled-out `formatDisplayDateLong` for table/cell date columns.
 */
export const formatDisplayDateShort = (dateTime: Date | string): string => {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: SINGAPORE_TIMEZONE,
  });
};

/** Compact numeric SGT date+time — "dd/mm/yy, HH:mm" (2-digit year). */
export const formatDisplayDateTimeShort = (dateTime: Date | string): string => {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const datePart = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: SINGAPORE_TIMEZONE,
  });
  const timePart = dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SINGAPORE_TIMEZONE,
  });
  return `${datePart}, ${timePart}`;
};

// TODO W08: consolidate with canonical display style once design system lands.
export const formatDisplayDateUS = (dateTime: Date | string): string => {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: SINGAPORE_TIMEZONE,
  });
};

// TODO W08: consolidate with canonical display style once design system lands.
export const formatDisplayDateTimeUS = (dateTime: Date | string): string => {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SINGAPORE_TIMEZONE,
  });
};

// Export timezone constants for use in other files
export const TIMEZONE_CONFIG = {
  timezone: SINGAPORE_TIMEZONE,
  utcOffset: SINGAPORE_UTC_OFFSET,
  displayFormat: 'DD/MM/YYYY HH:mm',
  dateOnlyFormat: 'DD/MM/YYYY'
} as const;