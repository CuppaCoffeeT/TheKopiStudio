/**
 * JourneyChecklist — the "Profiler · Info · Report" progress marks.
 *
 * Three dots read left to right in the order work actually happens, followed by
 * the `n / 3` figure. Shared by the Customers list column and the customer
 * detail header so both read the same shape from the same `deriveJourney`
 * result; the comp draws it as a compact glyph row, not a progress bar.
 *
 * Colour is the 2a semantic set, dots only (raw sage/terracotta are sanctioned
 * as FILLS — the `n / 3` text beside them stays on the ink ladder, since 11.5px
 * brand hues would fail AA; see .claude/rules/light-theme.md).
 *
 * The `n / 3` reads `--fg-dim` #5D4F3F, NOT `--fg-muted`. This component renders
 * on the bare list row and on the Overview queue row — both sit straight on the
 * PAGE cream, where #7D6B5B measures 4.12:1 and fails AA. That is the same call
 * `DataRowCells` already makes for its own `muted` cells on `surface="bare"`;
 * putting raw `text-muted-foreground` in cell CONTENT bypasses that guard, which
 * is exactly how this shipped an axe `serious` on first run.
 */

import { cn } from '@/lib/utils';
import {
  JOURNEY_STEP_LABEL,
  JOURNEY_STEP_ORDER,
  type CustomerJourney,
  type JourneyStepState,
} from '../lib/customerJourney';

/** Dot fill per state — locked reads as an unfilled hairline ring, never grey-out. */
const DOT_CLASS: Record<JourneyStepState, string> = {
  done: 'bg-[color:var(--brand-sage)] border-[color:var(--brand-sage)]',
  'in-progress': 'bg-[color:var(--brand-brown)] border-[color:var(--brand-brown)]',
  'not-started': 'bg-transparent border-border',
  locked: 'bg-transparent border-border',
};

const STATE_WORD: Record<JourneyStepState, string> = {
  done: 'done',
  'in-progress': 'in progress',
  'not-started': 'not started',
  locked: 'locked',
};

interface JourneyChecklistProps {
  journey: CustomerJourney;
  /** Hide the trailing `n / 3` where the surrounding row already counts. */
  showCount?: boolean;
  className?: string;
  testId?: string;
}

export function JourneyChecklist({
  journey,
  showCount = true,
  className,
  testId,
}: JourneyChecklistProps) {
  // One sentence for assistive tech — three bare dots say nothing out loud.
  const summary = JOURNEY_STEP_ORDER.map(
    (key) => `${JOURNEY_STEP_LABEL[key]} ${STATE_WORD[journey.steps[key]]}`,
  ).join(', ');

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} data-testid={testId}>
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        {JOURNEY_STEP_ORDER.map((key) => (
          <span
            key={key}
            title={`${JOURNEY_STEP_LABEL[key]} — ${STATE_WORD[journey.steps[key]]}`}
            className={cn('h-2 w-2 rounded-full border', DOT_CLASS[journey.steps[key]])}
          />
        ))}
      </span>
      {showCount && (
        <span className="text-[11.5px] tabular-nums text-[color:var(--fg-dim)]">
          {journey.completed} / {JOURNEY_STEP_ORDER.length}
        </span>
      )}
      <span className="sr-only">{summary}</span>
    </span>
  );
}
