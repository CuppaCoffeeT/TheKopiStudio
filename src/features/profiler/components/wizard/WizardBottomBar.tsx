import { cn } from '@/lib/utils';
import { Button } from '@/components/primitives/shell/Button';

interface WizardBottomBarProps {
  /** Sticky Back/Next bar for the in-flow screens (1..TOTAL_STEPS). */
  isLastStep: boolean;
  nextDisabled: boolean;
  onBack: () => void;
  onNext: () => void;
  /** Shown on question screens only: live count for the disabled-Next hint. */
  answeredInBatch: number | null;
  /** Rail on screen (authed ≥ lg) — the fixed bar starts at its 200px edge. */
  railOffset: boolean;
}

/**
 * Fixed bottom action bar for the wizard's in-flow screens. Extracted from
 * `ProfilerWizardPage` (2026-08-05, LOC ratchet) once the disabled-Next
 * explanation gave it logic of its own.
 */
export function WizardBottomBar({
  isLastStep,
  nextDisabled,
  onBack,
  onNext,
  answeredInBatch,
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
      {answeredInBatch !== null && (
        <p
          className="m-0 mx-auto w-full max-w-[42rem] px-4 pt-2 text-center text-[12px] text-[color:var(--fg-dim)]"
          aria-live="polite"
        >
          {answeredInBatch < 4 ? `${answeredInBatch} of 4 answered` : 'All 4 answered'}
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
          {isLastStep ? 'Generate Profile →' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
