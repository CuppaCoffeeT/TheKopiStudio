/**
 * The two coercions every CRM mapper shares.
 *
 * Extracted so `mapping.ts` and `clientMapping.ts` cannot drift apart on the
 * one thing they must agree about: how a blank form field becomes a database
 * value, and how a null column becomes a form string.
 */

/** Legacy `toNum` — '' / null / undefined → null, else Number(). */
export const toNum = (v: string | number | null | undefined): number | null =>
  v === '' || v == null ? null : Number(v);

/** Render a nullable numeric column as a form string ('' when unset). */
export const numStr = (v: number | null | undefined, fallback = ''): string =>
  v != null ? String(v) : fallback;
