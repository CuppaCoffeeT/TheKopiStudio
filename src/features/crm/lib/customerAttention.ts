/**
 * Customer attention — the QUEUE RULE half of the customer-centred IA.
 *
 * Split from `customerJourney.ts` (2026-07-28, W23 LOC ceiling) along the
 * seam that was already there: that file answers *where is this customer in
 * the chain?*, this one answers *does that mean they need me now?*. They stay
 * adjacent and are still ONE ruleset conceptually — the Overview queue, the
 * Customers list and the customer detail launcher import from both, and
 * neither question may be re-derived locally by a page.
 *
 * The rule, straight off the comp: a customer surfaces when there has been no
 * contact for 14 days, a tool in the chain is left incomplete, or a review date
 * is within 30 days. Everything else stays out of the way.
 */

import { differenceInDays } from 'date-fns';
import { getLocalDateString } from '@/utils/timezoneUtils';
import { JOURNEY_STEP_ORDER, type CustomerJourney } from './customerJourney';

/** A customer surfaces on the Overview queue for exactly one headline reason. */
export type AttentionReason = 'quiet' | 'unfinished' | 'review-due';

/** No inbound contact for this many days ⇒ the customer has "gone quiet". */
export const QUIET_DAYS = 14;

/** A review lands on the queue once it is this close (or already past). */
export const REVIEW_WINDOW_DAYS = 30;

/** What `deriveAttention` needs on top of the journey. */
export interface AttentionInput {
  /** Newest interaction date (`interactions.date`), or null when never contacted. */
  lastContactDate: string | null;
  /** Falls back to this when there has never been an interaction. */
  addedDate: string | null;
  nextReviewDate: string | null;
  journey: CustomerJourney;
}

export interface CustomerAttention {
  /** Whole days since the last contact (or since the customer was added). */
  quietDays: number | null;
  isQuiet: boolean;
  /** Days until the next review — negative once it has lapsed. */
  reviewInDays: number | null;
  isReviewDue: boolean;
  hasUnfinishedWork: boolean;
  /** Null when the customer needs nothing — the queue leaves them out of the way. */
  reason: AttentionReason | null;
}

/**
 * Whole SINGAPORE CALENDAR DAYS between a date column and the reference instant.
 *
 * Both sides are collapsed to their SG calendar date before the subtraction, so
 * the answer is the one a human would give: a review on 10 Aug read at 02:30 on
 * 28 Jul is "13 days", not the 12.9 that instant subtraction truncates to. The
 * same collapse makes the elapsed direction exact rather than off-by-one, and
 * makes both directions independent of what time of day the page is opened.
 *
 * `date` columns ('YYYY-MM-DD') and `timestamptz` columns both go through
 * `getLocalDateString`, so `created_at` late on a Singapore evening counts as
 * that Singapore day rather than the UTC one.
 */
function daysSince(value: string | null, refDate: Date): number | null {
  if (!value || value.trim().length === 0) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const asUtcMidnight = (input: Date | string) => new Date(`${getLocalDateString(input)}T00:00:00Z`);
  return differenceInDays(asUtcMidnight(refDate), asUtcMidnight(parsed));
}

/**
 * Resolve whether — and why — a customer belongs on the queue.
 *
 * Precedence is worst-first: quiet outranks an unfinished chain, which outranks
 * an upcoming review. One customer therefore occupies exactly one queue section
 * instead of three, and the figures across the top never double-count.
 */
export function deriveAttention(
  { lastContactDate, addedDate, nextReviewDate, journey }: AttentionInput,
  refDate: Date,
): CustomerAttention {
  const quietDays = daysSince(lastContactDate ?? addedDate, refDate);
  const isQuiet = quietDays !== null && quietDays >= QUIET_DAYS;

  const reviewDaysAgo = daysSince(nextReviewDate, refDate);
  // `daysSince` counts backwards from the reference date; flip it so a future
  // review reads as a positive countdown.
  const reviewInDays = reviewDaysAgo === null ? null : -reviewDaysAgo;
  const isReviewDue = reviewInDays !== null && reviewInDays <= REVIEW_WINDOW_DAYS;

  const hasUnfinishedWork = journey.completed < JOURNEY_STEP_ORDER.length;

  const reason: AttentionReason | null = isQuiet
    ? 'quiet'
    : hasUnfinishedWork
      ? 'unfinished'
      : isReviewDue
        ? 'review-due'
        : null;

  return { quietDays, isQuiet, reviewInDays, isReviewDue, hasUnfinishedWork, reason };
}

/** One line explaining why a customer is on the queue, for the row's subtitle. */
export function describeAttention(
  attention: CustomerAttention,
  journey: CustomerJourney,
): string {
  if (attention.reason === 'quiet') {
    const days = attention.quietDays ?? 0;
    return `No contact logged for ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (attention.reason === 'unfinished') {
    if (journey.steps.profiler !== 'done') return 'Never profiled — no risk profile on file';
    if (journey.steps.info !== 'done') {
      return `Customer information incomplete · missing ${journey.missingInfo.join(', ')}`;
    }
    return 'Report not generated yet';
  }
  if (attention.reason === 'review-due') {
    const days = attention.reviewInDays ?? 0;
    if (days < 0) return `Review lapsed ${Math.abs(days)} days ago`;
    if (days === 0) return 'Review due today';
    return `Review due in ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  return '';
}
