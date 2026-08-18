/**
 * Prospect Profiler history — what changed between two profiles of the same
 * customer.
 *
 * A profile is never edited in place: running the profiler again inserts a NEW
 * `results` row against the same `client_id`. So the customer's profiler
 * history is the sequence of those rows, and "what changed" is the diff
 * between consecutive ones. This module produces that diff so the activity log
 * can say `DISC profile: S → D` rather than the useless `the profiler was run`.
 *
 * WHY THE RESULT ROW AND NOT THE CUSTOMER RECORD: income and risk profile live
 * on `clients` and are already diffed by `lib/customerActivity` when the
 * information form saves them. Diffing them here too would print the same
 * change twice on one timeline, from two entries, at slightly different
 * timestamps — which reads as two changes.
 *
 * Lives in the PROFILER feature, not the CRM one, even though the CRM renders
 * the result: the diff is a statement about two `results` rows, which is this
 * feature's data, and `useSaveResult` — also here — is what writes it.
 * `ActivityChange` comes from `@/lib/activityLog`, the app-level vocabulary
 * both features share (cross-feature imports are forbidden).
 */

import type { ActivityChange } from '@/lib/activityLog';

/** The fields of a saved profile that are worth a history line. */
export interface ProfileSnapshot {
  discPrimary: string | null;
  discSecondary: string | null;
  mbti: string | null;
  ageRange: string | null;
  occupation: string | null;
  meeting: string | null;
  observationsCount: number | null;
  questionsAnswered: number | null;
}

/** Build a snapshot from a `public.results` row (or anything shaped like one). */
export function snapshotFromResult(row: {
  disc_primary?: string | null;
  disc_secondary?: string | null;
  mbti?: string | null;
  age_range?: string | null;
  occupation?: string | null;
  meeting?: string | null;
  observations_count?: number | null;
  questions_answered?: number | null;
}): ProfileSnapshot {
  return {
    discPrimary: row.disc_primary ?? null,
    discSecondary: row.disc_secondary ?? null,
    mbti: row.mbti ?? null,
    ageRange: row.age_range ?? null,
    occupation: row.occupation ?? null,
    meeting: row.meeting ?? null,
    observationsCount: row.observations_count ?? null,
    questionsAnswered: row.questions_answered ?? null,
  };
}

const FIELDS: readonly { key: keyof ProfileSnapshot; label: string }[] = [
  { key: 'discPrimary', label: 'DISC primary' },
  { key: 'discSecondary', label: 'DISC secondary' },
  { key: 'mbti', label: 'MBTI' },
  { key: 'ageRange', label: 'Age range' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'observationsCount', label: 'Observations' },
  { key: 'questionsAnswered', label: 'Questions answered' },
];

function show(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * The changes between the previous profile and the new one.
 *
 * Pass `null` for `previous` on a first profile: the caller then logs
 * `profile_created` with no diff, because "everything changed from nothing" is
 * a list of every field and says less than the word "created".
 */
export function diffProfiles(
  previous: ProfileSnapshot | null,
  next: ProfileSnapshot,
): ActivityChange[] {
  if (!previous) return [];
  const changes: ActivityChange[] = [];
  for (const { key, label } of FIELDS) {
    const from = show(previous[key]);
    const to = show(next[key]);
    if (from !== to) changes.push({ field: String(key), label, from, to });
  }
  return changes;
}

/** The headline for a re-profile — names the change that matters most. */
export function summariseProfileChanges(changes: readonly ActivityChange[]): string {
  if (changes.length === 0) return 'Profiler run again — no change to the profile';
  const disc = changes.find((change) => change.field === 'discPrimary');
  if (disc) return `Profile changed — DISC primary ${disc.from || 'not set'} → ${disc.to}`;
  return `Profile updated — ${changes.map((change) => change.label).join(', ')}`;
}
