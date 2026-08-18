/**
 * Customer activity — the pure model behind the automatic history log.
 *
 * WHAT THIS REPLACED (2026-08-18): "Add interaction", a form the advisor had to
 * remember to fill in after doing something the app had just watched them do.
 * Everything the system can observe now records itself: a profile saved, the
 * information edited, a tool opened, a report generated. What the system
 * CANNOT observe — that you met someone for coffee, what they said — stays a
 * manual entry, because inventing it would be worse than asking.
 *
 * That split is why `interactions` survives rather than being replaced. It is
 * also load-bearing elsewhere: `interactions.date` is what "no contact in 14
 * days" counts from, and inferring contact from "the advisor opened a
 * calculator" would quietly reset that clock without anyone having spoken.
 *
 * DIFFS. An edit records WHAT CHANGED, field by field, as display strings —
 * `Annual income: $4,500 → $5,000`. Storing the rendered strings rather than
 * the raw values is deliberate: this is a record of what the advisor saw,
 * and re-deriving the formatting of 2026 in 2031 is not something a history
 * table should have to do.
 *
 * The WRITE side and its vocabulary live in `@/lib/activityLog`, one level up,
 * because the profiler feature writes to the same log and `.dependency-cruiser`
 * forbids cross-feature imports. This module is the CRM-specific half: which
 * client fields are worth a history line, and how an entry reads.
 */

import type { ActivityChange, ActivityTool, ActivityType } from '@/lib/activityLog';
import type { CrmClient } from '../types';

export type { ActivityChange, ActivityTool, ActivityType };

/** One row of the timeline, mapped out of the DB row. */
export interface CustomerActivityEntry {
  id: string;
  type: ActivityType | string;
  tool: ActivityTool | string | null;
  summary: string;
  changes: ActivityChange[];
  occurredAt: string;
  actorId: string | null;
  /** Display name of whoever did it, resolved by the service. */
  actorName: string | null;
  /** True for a row that came from `interactions`, not `customer_activity`. */
  manual: boolean;
  /** Manual entries only — the note the advisor typed. */
  notes?: string;
  /**
   * Manual entries only — the DATE the advisor said the contact happened,
   * which is not the same as `occurredAt` (when the row was written). Logging
   * last Tuesday's call today must print last Tuesday.
   */
  loggedDate?: string;
}

/** Human label per tool — one name per tool, app-wide. */
export const ACTIVITY_TOOL_LABEL: Record<string, string> = {
  'prospect-profiler': 'Prospect Profiler',
  'tax-calculator': 'Tax calculator',
  'srs-planner': 'SRS planner',
  'legacy-map': 'Legacy Map',
  'client-report': 'Client Report',
  'portfolio-report': 'Portfolio Report',
};

/**
 * The client fields worth a history entry, in the order they read on the form.
 *
 * NOT every column. `created_date` and the derived `totalBankBalance` /
 * `lastReviewDate` are written by the system, and logging "the system changed
 * what the system computes" is noise that would bury the two lines an advisor
 * actually wants to see. Money fields are marked so they print with a `$`.
 */
const TRACKED_FIELDS: readonly { key: keyof CrmClient; label: string; money?: boolean }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'dateOfBirth', label: 'Date of birth' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'annualIncome', label: 'Annual income', money: true },
  { key: 'riskProfile', label: 'Risk profile' },
  { key: 'nextReviewDate', label: 'Next review' },
  { key: 'reviewFrequency', label: 'Review frequency' },
  { key: 'cpfOA', label: 'CPF OA', money: true },
  { key: 'cpfSA', label: 'CPF SA', money: true },
  { key: 'cpfMA', label: 'CPF MA', money: true },
  { key: 'personalInvestmentValue', label: 'Personal investments', money: true },
  { key: 'notes', label: 'Notes' },
];

/** `4500` → `$4,500`; blank stays blank so "nothing → something" reads right. */
function displayValue(raw: unknown, money: boolean | undefined): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
  const text = String(raw).trim();
  if (text === '') return '';
  if (!money) return text;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? `$${parsed.toLocaleString('en-SG')}` : text;
}

/**
 * What changed between two versions of a customer record.
 *
 * Returns `[]` when nothing tracked moved — the caller must then log NOTHING.
 * A timeline that says "information updated" on every Save, including the ones
 * where the advisor opened the form and closed it, teaches people to ignore it.
 */
export function diffClient(
  before: Partial<CrmClient>,
  after: Partial<CrmClient>,
): ActivityChange[] {
  const changes: ActivityChange[] = [];
  for (const { key, label, money } of TRACKED_FIELDS) {
    const from = displayValue(before[key], money);
    const to = displayValue(after[key], money);
    if (from !== to) changes.push({ field: String(key), label, from, to });
  }
  return changes;
}

/** One-line summary for an edit, naming the fields when there are few enough. */
export function summariseChanges(changes: readonly ActivityChange[]): string {
  if (changes.length === 0) return 'Customer information updated';
  if (changes.length <= 3) {
    return `${changes.map((change) => change.label).join(', ')} updated`;
  }
  return `${changes.length} fields updated`;
}

/** `$4,500 → $5,000`, with a word standing in for an empty side. */
export function formatChange(change: ActivityChange): string {
  const from = change.from === '' ? 'not set' : change.from;
  const to = change.to === '' ? 'cleared' : change.to;
  return `${from} → ${to}`;
}
