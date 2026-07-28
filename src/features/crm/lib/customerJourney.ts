/**
 * Customer journey — the pure derivation behind the customer-centred IA
 * (Kopi Studio Directions handoff, turns 3a/4a: "tools are no longer
 * navigation; they are things you do to a customer").
 *
 * Three steps, in the order the work actually happens:
 *
 *   01 Prospect Profiler  → produces the risk profile everything downstream reads
 *   02 Customer information → the CRM record's own fields
 *   03 Client report       → the generated artifact, gated on 01 + 02
 *
 * Every function here is pure and side-effect free so the Overview queue, the
 * Customers list checklist and the customer detail launcher can all read ONE
 * definition of "where is this customer up to". Divergent per-surface rules are
 * how a checklist starts disagreeing with the page it links to.
 *
 * HONEST-SIGNAL RULES (do not "improve" these into guesses):
 * - The profiler saves ONE row on completion (`public.results` has no partial
 *   state), so step 01 is binary — done or not started. The comps draw a
 *   "step 4 of 7" resume affordance; nothing in the schema can back it, so it
 *   is deliberately not rendered.
 * - Step 03 has no persisted "issued" flag. `done` therefore means *ready to
 *   generate* — the strongest claim the data supports. `locked` is the real
 *   product rule from the comp ("Needs steps 01 and 02"), not decoration.
 */

import { differenceInDays } from 'date-fns';
import { getLocalDateString } from '@/utils/timezoneUtils';

/** The three tools, keyed in chain order. */
export type JourneyStepKey = 'profiler' | 'info' | 'report';

/** Per-step state. `locked` is only ever reachable by `report`. */
export type JourneyStepState = 'done' | 'in-progress' | 'not-started' | 'locked';

/** A customer surfaces on the Overview queue for exactly one headline reason. */
export type AttentionReason = 'quiet' | 'unfinished' | 'review-due';

/** No inbound contact for this many days ⇒ the customer has "gone quiet". */
export const QUIET_DAYS = 14;

/** A review lands on the queue once it is this close (or already past). */
export const REVIEW_WINDOW_DAYS = 30;

export const JOURNEY_STEP_ORDER: readonly JourneyStepKey[] = ['profiler', 'info', 'report'];

export const JOURNEY_STEP_LABEL: Record<JourneyStepKey, string> = {
  profiler: 'Prospect Profiler',
  info: 'Customer information',
  report: 'Client report',
};

/**
 * The customer fields step 02 checks off. Contact counts as satisfied by
 * EITHER an email or a phone — a referral with only a mobile number is a
 * complete contact, and demanding both would park real customers on the queue
 * forever.
 */
export const INFO_CHECK_COUNT = 5;

/** Human names for the five checks, in the order `countInfoChecks` evaluates them. */
export const INFO_CHECK_LABELS = [
  'contact',
  'date of birth',
  'occupation',
  'annual income',
  'next review',
] as const;

/** The fields `deriveJourney` reads — normalised so raw rows and mapped models both fit. */
export interface JourneyInput {
  /** A linked `public.results` row exists and is visible to this viewer. */
  hasProfile: boolean;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  occupation: string | null;
  annualIncome: number | null;
  nextReviewDate: string | null;
}

export interface CustomerJourney {
  steps: Record<JourneyStepKey, JourneyStepState>;
  /** Steps in `done` — the numerator of the list's "n / 3" checklist. */
  completed: number;
  /** How many of the five information checks are filled in. */
  infoFilled: number;
  /** Names of the checks still unfilled — what the launcher asks the user for. */
  missingInfo: string[];
  /** The first step that still needs a human — `null` when the chain is complete. */
  nextStep: JourneyStepKey | null;
}

const filled = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

/** Which of the five checks are satisfied, in `INFO_CHECK_LABELS` order. */
function infoCheckResults(input: JourneyInput): boolean[] {
  return [
    filled(input.email) || filled(input.phone),
    filled(input.dateOfBirth),
    filled(input.occupation),
    input.annualIncome !== null && input.annualIncome > 0,
    filled(input.nextReviewDate),
  ];
}

/** Count the five information checks that are satisfied. */
export function countInfoChecks(input: JourneyInput): number {
  return infoCheckResults(input).filter(Boolean).length;
}

/** Name the checks still unfilled — never a blanket list of all five. */
export function missingInfoChecks(input: JourneyInput): string[] {
  return INFO_CHECK_LABELS.filter((_, index) => !infoCheckResults(input)[index]);
}

/** Resolve one customer's position along the three-step chain. */
export function deriveJourney(input: JourneyInput): CustomerJourney {
  const profiler: JourneyStepState = input.hasProfile ? 'done' : 'not-started';

  const checks = infoCheckResults(input);
  const infoFilled = checks.filter(Boolean).length;
  const missingInfo = INFO_CHECK_LABELS.filter((_, index) => !checks[index]);
  const info: JourneyStepState =
    infoFilled === INFO_CHECK_COUNT ? 'done' : infoFilled === 0 ? 'not-started' : 'in-progress';

  // The comp's rule, verbatim: the report needs steps 01 and 02.
  const report: JourneyStepState = profiler === 'done' && info === 'done' ? 'done' : 'locked';

  const steps = { profiler, info, report };
  const completed = JOURNEY_STEP_ORDER.filter((key) => steps[key] === 'done').length;

  return {
    steps,
    completed,
    infoFilled,
    missingInfo,
    nextStep: JOURNEY_STEP_ORDER.find((key) => steps[key] !== 'done') ?? null,
  };
}

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
  if (!filled(value)) return null;
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) return null;
  const asUtcMidnight = (input: Date | string) => new Date(`${getLocalDateString(input)}T00:00:00Z`);
  return differenceInDays(asUtcMidnight(refDate), asUtcMidnight(parsed));
}

/**
 * The queue rule, straight off the comp: a customer surfaces when there has
 * been no contact for 14 days, a tool in the chain is left incomplete, or a
 * review date is within 30 days. Everything else stays out of the way.
 *
 * Precedence is worst-first — quiet outranks an unfinished chain, which
 * outranks an upcoming review — so one customer occupies exactly one queue
 * section instead of three.
 */
export function deriveAttention({
  lastContactDate,
  addedDate,
  nextReviewDate,
  journey,
}: AttentionInput, refDate: Date): CustomerAttention {
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
