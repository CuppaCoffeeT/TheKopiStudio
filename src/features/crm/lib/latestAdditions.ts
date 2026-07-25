/**
 * Row shape + mappers for the /dashboard Overview's "Latest additions" feed.
 *
 * Pure functions only — no queries, no React. `hooks/useLatestAdditions` owns
 * the fetching and merging; this module owns what a merged row LOOKS like, so
 * both sources produce one comparable shape.
 *
 * Status is DERIVED, never stored: a client with no email is an error row, an
 * incompletely filled client is an in-progress row, and everything else is
 * complete. A saved profiling result is complete by construction — the wizard
 * only writes a row once the run finishes.
 */

import { subDays } from 'date-fns';
import { formatDisplayDateLong, getLocalDateString } from '@/utils/timezoneUtils';
import type { RecentProfilerResult } from '../api/linkedResultsService';
import type { ClientRow } from '../types';

/**
 * The two RECORD modules the Overview sources from — one place, because these
 * strings are both the row hrefs here AND the module gates the hook derives its
 * held-module set from. `/crm` is deliberately not one of them: it grants
 * aggregate figures on its own dashboard, not rows this feed can list.
 */
export const CLIENTS_PATH = '/clients';
export const RESULTS_PATH = '/profiler-results';

/** Status-pill tone → Badge tone: sage complete · brown in-progress · terracotta error. */
type LatestAdditionTone = 'success' | 'warning' | 'danger';

export interface LatestAdditionRow {
  id: string;
  name: string;
  /** Which module the record belongs to — the comp's MODULE column. */
  module: string;
  /** Risk profile, or an em dash where the record carries none. */
  risk: string;
  /** ISO timestamp, used only for the merge sort. */
  addedAt: string;
  /** "Today" / "Yesterday" / "18 Jul 2026", all in SGT. */
  addedLabel: string;
  statusLabel: string;
  statusTone: LatestAdditionTone;
  href: string;
}

/**
 * The profile fields the in-progress pill counts. `name` is excluded — it is
 * required at creation, so it would inflate every score by one.
 */
const PROFILE_FIELDS = [
  'email',
  'phone',
  'date_of_birth',
  'occupation',
  'annual_income',
  'risk_profile',
  'last_review_date',
  'next_review_date',
] as const satisfies readonly (keyof ClientRow)[];

function filledFieldCount(row: ClientRow): number {
  return PROFILE_FIELDS.filter((field) => {
    const value = row[field];
    return value != null && String(value).trim() !== '';
  }).length;
}

/** SGT-relative day label — the comp's "Today" / "Yesterday" / "18 Jul". */
function addedDayLabel(iso: string, now: Date): string {
  const day = getLocalDateString(iso);
  if (day === getLocalDateString(now)) return 'Today';
  if (day === getLocalDateString(subDays(now, 1))) return 'Yesterday';
  return formatDisplayDateLong(iso);
}

export function clientToAddition(row: ClientRow, now: Date): LatestAdditionRow {
  const filled = filledFieldCount(row);
  const hasEmail = !!row.email?.trim();
  return {
    id: row.id,
    name: row.name || row.email || 'Unnamed client',
    module: 'CRM',
    risk: row.risk_profile?.trim() || '—',
    addedAt: row.created_at,
    addedLabel: addedDayLabel(row.created_at, now),
    statusLabel: !hasEmail
      ? 'Missing email'
      : filled < PROFILE_FIELDS.length
        ? `${filled} of ${PROFILE_FIELDS.length} fields`
        : 'Complete',
    statusTone: !hasEmail ? 'danger' : filled < PROFILE_FIELDS.length ? 'warning' : 'success',
    href: `${CLIENTS_PATH}/${row.id}`,
  };
}

export function resultToAddition(row: RecentProfilerResult, now: Date): LatestAdditionRow {
  return {
    id: row.id,
    name: row.prospect_name || 'Unnamed prospect',
    module: 'Profiler',
    // `results` carries a behavioural profile (DISC/MBTI), never a risk profile.
    risk: '—',
    addedAt: row.created_at,
    addedLabel: addedDayLabel(row.created_at, now),
    statusLabel: 'Complete',
    statusTone: 'success',
    href: `${RESULTS_PATH}/${row.id}`,
  };
}
