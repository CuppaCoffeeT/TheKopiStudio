/**
 * The quote of the day must be a *day*, not a render.
 *
 * The bug this locks: picking with `Math.random()` (or `new Date()` inside the
 * component) reshuffles the quote on every re-render, which is how a daily
 * quote becomes noise. Determinism per SG calendar date is the feature.
 */

import { describe, expect, it } from 'vitest';
import { DAILY_QUOTES, quoteForDate } from '../dailyQuote';

describe('quoteForDate', () => {
  it('returns the same quote for the same date, every time', () => {
    const first = quoteForDate('2026-08-18');
    const again = quoteForDate('2026-08-18');
    expect(again).toEqual(first);
  });

  it('moves on the next day', () => {
    expect(quoteForDate('2026-08-19')).not.toEqual(quoteForDate('2026-08-18'));
  });

  it('deals the deck in order and wraps, so consecutive days never repeat', () => {
    const run = Array.from({ length: DAILY_QUOTES.length }, (_, offset) => {
      const day = new Date(Date.UTC(2026, 7, 18 + offset));
      return quoteForDate(day.toISOString().slice(0, 10)).text;
    });
    expect(new Set(run).size).toBe(DAILY_QUOTES.length);
  });

  it('wraps to the start of the deck rather than running off the end', () => {
    const day = new Date(Date.UTC(2026, 7, 18 + DAILY_QUOTES.length));
    expect(quoteForDate(day.toISOString().slice(0, 10))).toEqual(quoteForDate('2026-08-18'));
  });

  it('carries a non-empty text and attribution for every entry', () => {
    for (const quote of DAILY_QUOTES) {
      expect(quote.text.trim()).not.toBe('');
      expect(quote.attribution.trim()).not.toBe('');
    }
  });

  it('holds no duplicate quotes — a repeat inside one cycle reads as a bug', () => {
    expect(new Set(DAILY_QUOTES.map((quote) => quote.text)).size).toBe(DAILY_QUOTES.length);
  });
});
