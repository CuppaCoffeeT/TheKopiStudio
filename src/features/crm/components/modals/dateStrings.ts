/**
 * Date-string helpers for the CRM form modals. Model dates travel as
 * 'YYYY-MM-DD' strings (the row↔model contract in lib/mapping.ts);
 * conversion to/from the DatePicker's Date goes through timezoneUtils only.
 *
 * Kept separate from shared.tsx so that file only exports components
 * (react-refresh fast-refresh contract).
 */

import {
  getCurrentSingaporeTime,
  getLocalDateString,
  parseFromDatabase,
} from '@/utils/timezoneUtils';

/** Today's date in Singapore as 'YYYY-MM-DD' (form default for date fields). */
export function todayDateString(): string {
  return getLocalDateString(getCurrentSingaporeTime());
}

/** 'YYYY-MM-DD' model string → local-midnight Date for the DatePicker ('' → null). */
export function dateStringToDate(value: string): Date | null {
  return value ? parseFromDatabase(`${value}T00:00:00`) : null;
}

/** DatePicker Date → 'YYYY-MM-DD' model string (null → ''). */
export function dateToDateString(value: Date | null): string {
  return value ? getLocalDateString(value) : '';
}
