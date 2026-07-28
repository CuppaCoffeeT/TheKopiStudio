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
 *
 * The companion half — *does that position mean they need me now?* — lives in
 * `customerAttention.ts` (the queue rule). One ruleset, two files.
 */

/** The three tools, keyed in chain order. */
export type JourneyStepKey = 'profiler' | 'info' | 'report';

/** Per-step state. `locked` is only ever reachable by `report`. */
export type JourneyStepState = 'done' | 'in-progress' | 'not-started' | 'locked';

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
