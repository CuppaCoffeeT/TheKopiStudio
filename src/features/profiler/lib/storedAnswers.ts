/**
 * storedAnswers — parse a saved `results` row's JSON columns back into the
 * wizard's shapes. Moved out of `components/detail/storedReportModel.ts`
 * (2026-09-25) when the CSV export began reading raw_answers too — `lib/` must
 * not import from `components/`.
 */

import type { Json } from '@/integrations/supabase/types';
import type { DiscLetter, RawAnswer } from '../types';

const DISC_LETTERS: readonly DiscLetter[] = ['D', 'I', 'S', 'C'];

export function isDiscLetter(value: unknown): value is DiscLetter {
  return typeof value === 'string' && (DISC_LETTERS as readonly string[]).includes(value);
}

function isRawAnswer(value: unknown): value is RawAnswer {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<RawAnswer>;
  return (
    isDiscLetter(candidate.d) &&
    typeof candidate.mb === 'object' &&
    candidate.mb !== null &&
    typeof candidate.mb.v === 'string'
  );
}

/** Stored raw_answers parsed back to the wizard answer array; null when absent/invalid. */
export function parseRawAnswers(rawAnswers: Json | null): Array<RawAnswer | null> | null {
  if (!Array.isArray(rawAnswers) || rawAnswers.length === 0) return null;
  const parsed = rawAnswers.map((entry) => (isRawAnswer(entry) ? entry : null));
  return parsed.some(Boolean) ? parsed : null;
}

/** Ids ticked TRUE in a stored nv_observations object (FALSE entries persist by design). */
export function trueObservationIds(nvObservations: Json | null): string[] {
  if (
    typeof nvObservations !== 'object' ||
    nvObservations === null ||
    Array.isArray(nvObservations)
  ) {
    return [];
  }
  return Object.keys(nvObservations).filter((id) => nvObservations[id] === true);
}
