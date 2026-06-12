/**
 * CRM follow-up badge logic — EXACT port of legacy ClientCard.jsx:4-12,31-38
 * (git c09c549), pure and clock-injectable.
 *
 * Legacy comparison semantics are PRESERVED: 'YYYY-MM-DD' strings parse via
 * `new Date(str)` (UTC midnight) and compare against the full `refDate`
 * instant, with day counts via `Math.ceil(diff / 86_400_000)`. So a follow-up
 * dated "today" counts as 0 days (urgent tone) but is only selected as a
 * FUTURE follow-up while `refDate` is still before today's UTC midnight —
 * after that it falls through to `nextReviewDate`. Callers inject `refDate`
 * (the app passes its clock; tests pin instants) — see decisions.md (P2).
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Badge tone — legacy class names kept verbatim (overdue red / urgent amber / upcoming blue). */
export type FollowUpTone = 'overdue' | 'urgent' | 'upcoming';

export interface FollowUpBadge {
  tone: FollowUpTone;
  label: string;
  detail: string;
}

/** Minimal interaction shape consumed here ('' / null followUp = none). */
export interface FollowUpInteraction {
  followUp?: string | null;
}

/** Resolved follow-up for a client: the source date (if any) plus its badge. */
export interface ClientFollowUp {
  date: string | null;
  badge: FollowUpBadge | null;
}

/** Legacy `followUpStatus(dateStr)` — null/'' → no badge. */
export function followUpBadge(
  dateStr: string | null | undefined,
  refDate: Date,
): FollowUpBadge | null {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr).getTime() - refDate.getTime()) / MS_PER_DAY);
  if (days < 0) {
    return { tone: 'overdue', label: 'Overdue follow-up', detail: `${Math.abs(days)} days overdue` };
  }
  if (days <= 7) {
    return { tone: 'urgent', label: 'Upcoming follow-up', detail: `${days} days` };
  }
  return { tone: 'upcoming', label: 'Next follow-up', detail: `${days} days` };
}

/**
 * Legacy `nextFollowUp` memo — earliest interaction follow-up at/after
 * `refDate` (UTC-midnight parse vs full instant, `>=`), else the client's
 * `nextReviewDate`, else null.
 */
export function nextFollowUpDate(
  interactions: readonly FollowUpInteraction[],
  nextReviewDate: string | null | undefined,
  refDate: Date,
): string | null {
  const upcoming = interactions
    .filter((i) => i.followUp && new Date(i.followUp).getTime() >= refDate.getTime())
    .sort((a, b) => new Date(a.followUp).getTime() - new Date(b.followUp).getTime());
  return upcoming.length > 0 ? upcoming[0].followUp : nextReviewDate || null;
}

/** Convenience: source date + badge in one call (what list rows / detail header render). */
export function resolveClientFollowUp(
  interactions: readonly FollowUpInteraction[],
  nextReviewDate: string | null | undefined,
  refDate: Date,
): ClientFollowUp {
  const date = nextFollowUpDate(interactions, nextReviewDate, refDate);
  return { date, badge: followUpBadge(date, refDate) };
}
