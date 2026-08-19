/**
 * Locks the century pivot in `parseTypedDate`.
 *
 * Written for the 2026-08-19 fix: the parser used to add 2000 to every
 * two-digit year, so a date of birth typed `15/03/86` stored 2086-03-15 and
 * the tax calculator opened on age −60.
 */
import { describe, expect, it } from 'vitest';
import { parseTypedDate, resolveTwoDigitYear } from '../DatePicker.helpers';

const iso = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null;

describe('resolveTwoDigitYear', () => {
  it('reads 20xx while it fits under the upper bound', () => {
    expect(resolveTwoDigitYear(30, 2076)).toBe(2030);
    expect(resolveTwoDigitYear(1, 2026)).toBe(2001);
  });

  it('falls back to 19xx once 20xx would overshoot the bound', () => {
    expect(resolveTwoDigitYear(86, 2026)).toBe(1986);
    expect(resolveTwoDigitYear(30, 2026)).toBe(1930);
  });

  it('treats the bound itself as in range', () => {
    expect(resolveTwoDigitYear(26, 2026)).toBe(2026);
  });
});

describe('parseTypedDate', () => {
  it('pivots a typed birth year into the 1900s for a DOB-bounded field', () => {
    expect(iso(parseTypedDate('15/03/86', 2026))).toBe('1986-03-15');
    expect(iso(parseTypedDate('150386', 2026))).toBe('1986-03-15');
  });

  it('leaves a four-digit year exactly as typed', () => {
    expect(iso(parseTypedDate('15/03/1986', 2026))).toBe('1986-03-15');
    expect(iso(parseTypedDate('15/03/2086', 2100))).toBe('2086-03-15');
  });

  it('keeps near-future two-digit years in the 2000s on a wide field', () => {
    expect(iso(parseTypedDate('01/01/30', 2076))).toBe('2030-01-01');
  });

  it('accepts dash and dot separators', () => {
    expect(iso(parseTypedDate('15-03-86', 2026))).toBe('1986-03-15');
    expect(iso(parseTypedDate('15.03.86', 2026))).toBe('1986-03-15');
  });

  it('still rejects impossible and unparseable input', () => {
    expect(parseTypedDate('31/02/2026', 2076)).toBeNull();
    expect(parseTypedDate('15/13/86', 2026)).toBeNull();
    expect(parseTypedDate('abc', 2026)).toBeNull();
    expect(parseTypedDate('', 2026)).toBeNull();
    expect(parseTypedDate('12345', 2026)).toBeNull();
  });
});
