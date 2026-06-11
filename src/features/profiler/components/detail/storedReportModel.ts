/**
 * storedReportModel — rebuild report inputs from a saved `results` row.
 *
 * Headline scalars (primary/secondary/MBTI) come straight from the stored row
 * — that is the saved record of truth. The scoring replay (`calcProfile` over
 * raw_answers + ticked observations + occupation) feeds ONLY the DISC bars
 * and the MBTI dimension strengths, which is what fixes the legacy fake-3
 * strength bug. Golden-master tests guarantee replay and stored scalars agree
 * for every legacy row; if a row ever disagreed, the stored scalars still win
 * the headline while bars stay replay-derived.
 *
 * Rows with NULL/invalid `raw_answers` (defensive) degrade to a scalar-only
 * model: bars from stored score_d/i/s/c, zero MBTI signals, `scalarOnly` so
 * the page can swap the MBTI card for an info alert.
 */

import type { Json } from '@/integrations/supabase/types';
import type { DiscLetter, ProfilerResult, RawAnswer } from '../../types';
import { calcProfile, type MbtiType, type ProfileResult } from '../../lib/scoring';

const DISC_LETTERS: readonly DiscLetter[] = ['D', 'I', 'S', 'C'];

function isDiscLetter(value: unknown): value is DiscLetter {
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

export interface StoredReportModel {
  /** Report-shaped profile: stored headline scalars + replayed bars/signals. */
  profile: ProfileResult;
  /** True when raw_answers could not be replayed — MBTI dims unavailable. */
  scalarOnly: boolean;
}

export function buildStoredReportModel(row: ProfilerResult): StoredReportModel {
  const answers = parseRawAnswers(row.raw_answers);
  const replayed = answers
    ? calcProfile(answers, trueObservationIds(row.nv_observations), row.occupation ?? '')
    : null;

  return {
    profile: {
      dc: replayed?.dc ?? { D: row.score_d, I: row.score_i, S: row.score_s, C: row.score_c },
      mb: replayed?.mb ?? { E: 0, I: 0, T: 0, F: 0, J: 0, P: 0, S: 0, N: 0 },
      pri: isDiscLetter(row.disc_primary) ? row.disc_primary : (replayed?.pri ?? 'D'),
      sec: isDiscLetter(row.disc_secondary) ? row.disc_secondary : (replayed?.sec ?? 'I'),
      mbs: row.mbti as MbtiType,
      qCount: replayed?.qCount ?? row.questions_answered,
      nvCount: replayed?.nvCount ?? row.observations_count,
      occUsed: replayed?.occUsed ?? row.occupation ?? '',
    },
    scalarOnly: !replayed,
  };
}
