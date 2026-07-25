/**
 * WizardStepperHeader — eyebrow `Step N of M · {label}` + primitive Stepper chip-band.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-05-23-M2TVjKyQ/project/project/preview/component-wizard-modal.html
 *       (section 02 · "Stepper chip-band" — lines ~110-180)
 *
 * Mobile: pass `compact` prop to collapse chip+label to dots-only (chips render
 * as 8×8 dots, no labels). Used by `<WizardMobileDrawer>`.
 *
 * Tokens: brown active chip (`bg-primary`) + brown halo · sage completed
 * (`--brand-sage`) · `--border` upcoming. Light-pinned, no dark arm. Compact
 * dots mirror the full primitive Stepper's colours exactly.
 */

import { Stepper, type StepperStep } from '@/components/primitives/form/Stepper';
import { cn } from '@/lib/utils';

interface WizardStepperHeaderProps {
  steps: StepperStep[];
  currentStep: number;
  /** Mobile dots-only mode — collapses chip labels. Default desktop with labels. */
  compact?: boolean;
  className?: string;
}

export function WizardStepperHeader({
  steps,
  currentStep,
  compact = false,
  className,
}: WizardStepperHeaderProps) {
  const labelForStep = steps[currentStep]?.label ?? '';
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p
        className="text-[10.5px] uppercase tracking-widest text-muted-foreground"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Step {currentStep + 1} of {steps.length} · <span className="text-foreground font-medium normal-case tracking-normal">{labelForStep}</span>
      </p>
      {compact ? (
        <div className="flex items-center gap-1.5" role="list" aria-label="Progress">
          {steps.map((_, idx) => (
            <span
              key={idx}
              role="listitem"
              aria-current={idx === currentStep ? 'step' : undefined}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                idx < currentStep && 'bg-[color:var(--brand-sage)]',
                idx === currentStep && 'bg-primary ring-2 ring-primary/30',
                idx > currentStep && 'bg-border',
              )}
            />
          ))}
        </div>
      ) : (
        <Stepper steps={steps} currentStep={currentStep} />
      )}
    </div>
  );
}
