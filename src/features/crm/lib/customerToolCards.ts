/**
 * Customer tool cards — the pure model behind `CustomerToolLauncher`.
 *
 * Extracted from that component (2026-07-28, W23 LOC ceiling) at the seam that
 * was already there: WHAT each card says and offers is a decision about the
 * customer's chain, not about markup. Keeping it pure means the copy and the
 * gating can be unit-tested without rendering React.
 *
 * TWO GROUPS, and the distinction is deliberate:
 *
 * - **The chain (01–03)** — Profiler → Information → Report. These are ORDERED,
 *   and `deriveJourney` still owns each step's done/todo state — but since
 *   2026-08-18 they no longer GATE each other. The report used to be locked
 *   until the two above it were done, which withheld the one artifact an
 *   advisor can put in front of a customer at exactly the moment it is most
 *   useful: the first meeting, where the report's own "Missing information"
 *   list IS the agenda. It now opens at any stage and prints `NIL` for what is
 *   not on file (`lib/reportCompleteness`). The order is still advice; it is no
 *   longer a lock.
 * - **Planning tools (04–06)** — Tax calculator, SRS planner, Legacy Map.
 *   These are always available. They read the customer's record to pre-fill
 *   themselves, but nothing about them is sequenced, and giving them a
 *   `locked` state would imply an order the domain does not have.
 *
 * Folding the planning tools into the journey would have been less code and a
 * worse model: the checklist on the Customers list counts the CHAIN, and a
 * customer is not "2 / 6 complete" because they have not opened a calculator.
 *
 * The action a card offers is `null` when there is nothing the viewer can do —
 * another advisor's customer, or a profiler the viewer isn't granted. The
 * component then renders a reason line instead of a control: a clickable lock
 * is a lie. Card 03 no longer reaches that branch; see the chain note above.
 */

import {
  INFO_CHECK_COUNT,
  JOURNEY_STEP_ORDER,
  JOURNEY_STEP_LABEL,
  type CustomerJourney,
  type JourneyStepKey,
  type JourneyStepState,
} from './customerJourney';

/** Chain states, plus the one the always-available planning tools carry. */
export type ToolCardState = JourneyStepState | 'available';

export type ToolCardKind =
  | 'start-profiler'
  | 'view-profile'
  | 'edit-info'
  | 'open-report'
  | 'open-tax'
  | 'open-srs'
  | 'open-legacy';

export interface ToolCardAction {
  label: string;
  /** Discriminator the component maps to a real handler — keeps this file pure. */
  kind: ToolCardKind;
}

export interface ToolCard {
  key: JourneyStepKey | 'tax' | 'srs' | 'legacy';
  index: string;
  label: string;
  state: ToolCardState;
  detail: string;
  action: ToolCardAction | null;
  /** Shown in place of an action when there is none. */
  reason: string;
}

export interface ToolCardInput {
  journey: CustomerJourney;
  /** A profiler result linked to this customer AND visible to this viewer. */
  hasLinkedResult: boolean;
  /** False for a manager reading another advisor's customer — writes drop out. */
  isOwn: boolean;
  /** True when the viewer holds the `/profiler` module. */
  canProfile: boolean;
}

/** Which upstream steps are still outstanding, named — now a NOTE on the report
 *  card rather than the reason it is locked. */
function pendingSteps(journey: CustomerJourney): string {
  return JOURNEY_STEP_ORDER.filter((key) => key !== 'report' && journey.steps[key] !== 'done')
    .map((key) => JOURNEY_STEP_LABEL[key])
    .join(' and ');
}

/** The three CHAIN cards, in order. Ordered advice — no longer a gate. */
export function buildToolCards({
  journey,
  hasLinkedResult,
  isOwn,
  canProfile,
}: ToolCardInput): ToolCard[] {
  const profilerDone = journey.steps.profiler === 'done';
  const infoDone = journey.steps.info === 'done';
  const missingInfo = INFO_CHECK_COUNT - journey.infoFilled;

  return [
    {
      key: 'profiler',
      index: '01',
      label: JOURNEY_STEP_LABEL.profiler,
      state: journey.steps.profiler,
      detail: profilerDone
        ? 'Risk profile on file — the rest of the record reads from it.'
        : 'First interaction for every new customer. Produces the risk profile the other tools depend on.',
      action:
        profilerDone && hasLinkedResult
          ? { label: 'View profile', kind: 'view-profile' }
          : !profilerDone && canProfile
            ? { label: 'Start profiler', kind: 'start-profiler' }
            : null,
      // Profiled, but the result belongs to another advisor and RLS hid it.
      reason: profilerDone
        ? 'Profile not visible to you'
        : 'The Prospect Profiler is not granted to your account',
    },
    {
      key: 'info',
      index: '02',
      label: JOURNEY_STEP_LABEL.info,
      state: journey.steps.info,
      detail: infoDone
        ? 'Contact, income, dependants and the review date are all on file.'
        : `${missingInfo} of ${INFO_CHECK_COUNT} checks still missing — ${journey.missingInfo.join(', ')}.`,
      action: isOwn
        ? { label: infoDone ? 'Edit information' : 'Complete information', kind: 'edit-info' }
        : null,
      reason: 'Read-only — managed by another advisor',
    },
    {
      key: 'report',
      index: '03',
      label: JOURNEY_STEP_LABEL.report,
      state: journey.steps.report,
      detail:
        journey.steps.report === 'done'
          ? 'Ready to generate from the policies and balances on file.'
          : `Generates now from whatever is on file — anything missing prints NIL. ${pendingSteps(journey)} would fill it in.`,
      // Always offered. `isOwn` is NOT a condition either: reading another
      // advisor's customer is read-only, and a report is a read.
      action: { label: 'Open report', kind: 'open-report' },
      reason: '',
    },
  ];
}

/**
 * The three PLANNING cards. Always available — they pre-fill from whatever the
 * record holds and work with the rest blank, so there is nothing to gate on.
 * Each names what it pre-fills, because that is what makes opening it from the
 * customer worth more than opening a standalone calculator.
 */
export function buildPlanningCards(): ToolCard[] {
  return [
    {
      key: 'tax',
      index: '04',
      label: 'Tax calculator',
      state: 'available',
      detail:
        'Singapore resident income tax, relief by relief. Pre-fills age and income from the record.',
      action: { label: 'Open calculator', kind: 'open-tax' },
      reason: '',
    },
    {
      key: 'srs',
      index: '05',
      label: 'SRS planner',
      state: 'available',
      detail:
        'What contributing saves now, what the 10-year window costs, and whether the two net out.',
      action: { label: 'Open planner', kind: 'open-srs' },
      reason: '',
    },
    {
      key: 'legacy',
      index: '06',
      label: 'Legacy Map',
      state: 'available',
      detail:
        'Who inherits under the plan, against what the Intestate Succession Act would do instead.',
      action: { label: 'Open map', kind: 'open-legacy' },
      reason: '',
    },
  ];
}
