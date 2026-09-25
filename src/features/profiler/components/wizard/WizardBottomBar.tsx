import { cn } from '@/lib/utils';
import { Button } from '@/components/primitives/shell/Button';
import { DISCOVERY_STEP, PITSTOP_STEP } from '../../hooks/useWizardState';

interface WizardBottomBarProps {
  /** Current in-flow step (1..TOTAL_STEPS) — decides the Next label. */
  step: number;
  nextDisabled: boolean;
  onBack: () => void;
  onNext: () => void;
  /** Gated screens only (rapport + discovery): live count for the disabled-Next hint. */
  progressHint: { answered: number; total: number } | null;
  /** Rail on screen (authed ≥ lg) — the fixed bar starts at its 200px edge. */
  railOffset: boolean;
}

/** v6 `go()` button labels: each hand-off names the screen it leads to. */
function nextLabel(step: number): string {
  if (step === DISCOVERY_STEP) return 'Generate Profile →';
  if (step === PITSTOP_STEP) return 'Continue to Discovery →';
  if (step === PITSTOP_STEP - 1) return 'See Quick Read →';
  return 'Next →';
}

/**
 * Fixed bottom action bar for the wizard's in-flow screens. Extracted from
 * `ProfilerWizardPage` (2026-08-05, LOC ratchet) once the disabled-Next
 * explanation gave it logic of its own.
 */
export function WizardBottomBar({
  step,
  nextDisabled,
  onBack,
  onNext,
  progressHint,
  railOffset,
}: WizardBottomBarProps) {
  return (
    <div
      className={cn(
        'print-hide fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]',
        railOffset && 'lg:left-[200px]',
      )}
    >
      {/* Disabled buttons that explain nothing are friction — say what's
          left. aria-live so screen readers hear progress too. */}
      {progressHint !== null && (
        <p
          className="m-0 mx-auto w-full max-w-[42rem] px-4 pt-2 text-center text-[12px] text-[color:var(--fg-dim)]"
          aria-live="polite"
        >
          {progressHint.answered < progressHint.total
            ? `${progressHint.answered} of ${progressHint.total} answered`
            : `All ${progressHint.total} answered`}
        </p>
      )}
      <div className="mx-auto flex w-full max-w-[42rem] gap-2.5 px-4 py-3">
        <Button size="lg" variant="outline" onClick={onBack} data-testid="wizard-back-btn">
          ← Back
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={nextDisabled}
          onClick={onNext}
          data-testid="wizard-next-btn"
        >
          {nextLabel(step)}
        </Button>
      </div>
    </div>
  );
}
