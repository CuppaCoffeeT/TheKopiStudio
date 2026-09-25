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
 * The replay reads each answer's stored `d` + `mb`, never its `oi`, so it is
 * indifferent to the v6 option reshuffle (content/questions.ts header). The v6
 * discovery tracks come back from `raw_answers[7]` when the row has them; rows
 * saved before v6 (or by the legacy app) get `tracks: null` and the report
 * leaves the track sections out.
 *
 * Rows with NULL/invalid `raw_answers` (defensive) degrade to a scalar-only
 * model: bars from stored score_d/i/s/c, zero MBTI signals, `scalarOnly` so
 * the page can swap the MBTI card for an info alert.
 */

import type { DiscLetter, DiscoveryTracks, ProfilerResult } from '../../types';
import { calcProfile, type MbtiType, type ProfileResult } from '../../lib/scoring';
import { isDiscLetter, parseRawAnswers, trueObservationIds } from '../../lib/storedAnswers';
import { readStoredDiscovery } from '../../lib/discovery';

export interface StoredReportModel {
  /** Report-shaped profile: stored headline scalars + replayed bars/signals. */
  profile: ProfileResult;
  /** True when raw_answers could not be replayed — MBTI dims unavailable. */
  scalarOnly: boolean;
  /** v6 discovery tracks; null for rows saved before v6. */
  tracks: DiscoveryTracks | null;
  /** DISC letter of the money-anchor answer (only alongside tracks). */
  worry: DiscLetter | null;
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
    ...readStoredDiscovery(answers),
  };
}
