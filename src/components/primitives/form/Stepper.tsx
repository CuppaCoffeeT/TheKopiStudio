import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Stepper — horizontal chip-morph step indicator.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-13pEBoyg/project/preview/component-stepper.html
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked (2a): current step = --primary brown with a 3px brown halo. Completed = sage bg
 * + cream check. Upcoming = card cream + hairline border; dim conveyed via --fg-muted text
 * (NOT opacity — opacity-50 violates WCAG AA on the label text and was flagged by axe on
 * /agent/setup, 2026-05-28).
 * Current step's label uses var(--font-sans) medium; others use fg-dim.
 * Step numbers + any mono glyph use var(--font-mono).
 */

export interface StepperStep {
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** Zero-indexed active step. Steps before this are marked completed. */
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div
      className={cn('flex items-center gap-3.5', className)}
      role="list"
      aria-label="Progress"
    >
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isUpcoming = idx > currentStep;

        return (
          <div key={idx} className="contents">
            <div
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
              className="inline-flex items-center gap-1.5"
            >
              {isCompleted && (
                <span className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-[color:var(--brand-sage)] text-[color:var(--cta-primary-fg)]">
                  <Check className="w-3 h-3" strokeWidth={2.4} />
                </span>
              )}
              {isCurrent && (
                <span
                  className={cn(
                    'w-7 h-7 rounded-full inline-flex items-center justify-center',
                    'bg-primary text-primary-foreground font-semibold text-[11.5px]',
                    'shadow-[0_0_0_3px] shadow-primary/25',
                  )}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {idx + 1}
                </span>
              )}
              {isUpcoming && (
                <span
                  className={cn(
                    'w-7 h-7 rounded-full inline-flex items-center justify-center',
                    'bg-card border border-border',
                    'text-muted-foreground text-[11.5px] font-medium',
                  )}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {idx + 1}
                </span>
              )}
              <span
                className={cn(
                  'text-[12.5px] whitespace-nowrap',
                  isCurrent && 'font-medium text-foreground',
                  isCompleted && 'text-muted-foreground',
                  isUpcoming && 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="flex-shrink-0 w-10 h-px bg-border"
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
