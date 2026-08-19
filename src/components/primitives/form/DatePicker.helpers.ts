/**
 * DatePicker.helpers — types + pure date utilities (no React).
 */

export type DatePickerSize = 'sm' | 'md' | 'lg';
export type DatePickerMode = 'single' | 'range';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sun-first

export type DatePickerFormat = 'long' | 'short';

/** `long` → "dd MMM yyyy" (default · SG locale). `short` → "dd/mm/yy" (compact numeric). */
export function formatDisplay(d: Date | null | undefined, format: DatePickerFormat = 'long'): string {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  if (format === 'short') {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }
  return `${dd} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Slashed numeric format used to seed the typeable input on focus. `short` → 2-digit year. */
export function formatSlashed(d: Date | null | undefined, short = false): string {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yr = short ? String(d.getFullYear()).slice(-2) : String(d.getFullYear());
  return `${dd}/${mm}/${yr}`;
}

/**
 * Widest sensible year window for a picker that wasn't told one.
 *
 * Was a hardcoded 2020–2030, which made the year dropdown unable to reach any
 * birth year (see the 2026-08-19 lesson) and, once the real year left the
 * window, left the `<select>` with no matching option at all. Now relative to
 * the SG year so it can't go stale: a century back for dates of birth, half a
 * century forward for policy end dates.
 */
export const DEFAULT_YEARS_BACK = 100;
export const DEFAULT_YEARS_FORWARD = 50;

/**
 * Resolve a 2-digit year to a full year, pivoting on `maxYear`.
 *
 * `yy` first reads as 20yy; if that lands past the picker's own upper bound it
 * reads as 19yy instead. So a DOB field (upper bound = today) turns `86` into
 * 1986, while a policy field (upper bound decades out) keeps `30` as 2030.
 */
export function resolveTwoDigitYear(yy: number, maxYear: number): number {
  const asTwentyFirst = 2000 + yy;
  return asTwentyFirst > maxYear ? 1900 + yy : asTwentyFirst;
}

/**
 * Parse a user-typed date string into a Date (local, midnight) or null.
 * Accepts dd/mm/yyyy with `/ - .` separators, plus bare digit runs
 * (ddmmyyyy · ddmmyy). 2-digit years pivot on `maxYear` (see
 * `resolveTwoDigitYear`). Rejects impossible dates (e.g. 31/02/2026) via a
 * round-trip check.
 */
export function parseTypedDate(input: string, maxYear = 2000 + DEFAULT_YEARS_FORWARD): Date | null {
  const s = input.trim();
  if (!s) return null;

  let day: number, month: number, year: number;
  const m = s.match(/^(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{2,4})$/);
  if (m) {
    day = Number(m[1]);
    month = Number(m[2]);
    year = Number(m[3]);
    // A 1- or 2-digit group is a short year; 3-4 digits are already absolute.
    if (m[3].length <= 2) year = resolveTwoDigitYear(year, maxYear);
  } else {
    const digits = s.replace(/\D/g, '');
    if (digits.length === 8) {
      day = Number(digits.slice(0, 2));
      month = Number(digits.slice(2, 4));
      year = Number(digits.slice(4, 8));
    } else if (digits.length === 6) {
      day = Number(digits.slice(0, 2));
      month = Number(digits.slice(2, 4));
      year = resolveTwoDigitYear(Number(digits.slice(4, 6)), maxYear);
    } else {
      return null;
    }
  }

  if (year < 100) year = resolveTwoDigitYear(year, maxYear);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null; // overflowed (e.g. 31 Feb)
  }
  return d;
}

export function sameDay(a: Date | null | undefined, b: Date | null | undefined) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
