/**
 * Customer tool cards — the pure model behind `CustomerToolLauncher`.
 *
 * Extracted from that component (2026-07-28, W23 LOC ceiling) at the seam that
 * was already there: WHAT each of the three cards says and offers is a decision
 * about the customer's chain, not about markup. Keeping it pure means the
 * copy and the gating can be unit-tested without rendering React.
 *
 * The action a card offers is `null` when there is nothing the viewer can do —
 * a locked report, or another advisor's customer. The component then renders a
 * reason line instead of a control: a clickable lock is a lie.
 */

import {
  INFO_CHECK_COUNT,
  JOURNEY_STEP_ORDER,
  JOURNEY_STEP_LABEL,
  type CustomerJourney,
  type JourneyStepKey,
  type JourneyStepState,
} from './customerJourney';

export interface ToolCardAction {
  label: string;
  /** Discriminator the component maps to a real handler — keeps this file pure. */
  kind: 'start-profiler' | 'view-profile' | 'edit-info' | 'open-report';
}

export interface ToolCard {
  key: JourneyStepKey;
  index: string;
  state: JourneyStepState;
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

/** Which upstream steps the locked report is still waiting on, named. */
function blockingSteps(journey: CustomerJourney): string {
  return JOURNEY_STEP_ORDER.filter((key) => key !== 'report' && journey.steps[key] !== 'done')
    .map((key) => JOURNEY_STEP_LABEL[key])
    .join(' and ');
}

/** Build the three cards, in chain order. */
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
      state: journey.steps.report,
      detail:
        journey.steps.report === 'done'
          ? 'Ready to generate from the policies and balances on file.'
          : 'Needs steps 01 and 02 — the report reads the risk profile and the customer information.',
      action:
        journey.steps.report === 'done' ? { label: 'Open report', kind: 'open-report' } : null,
      reason: `Finish ${blockingSteps(journey)} first`,
    },
  ];
}
