/**
 * WizardMobileDrawer — fullscreen mobile form modal (Radix Dialog inset-0).
 *
 * Despite the legacy name, this is NOT a bottom drawer. Long forms on mobile
 * are a poor fit for bottom drawers — focus-driven keyboard interactions push
 * `position: fixed` drawers off-screen and `dvh`/Visual-Viewport workarounds
 * just compound the symptom. iOS HIG + Material Design both prescribe
 * fullscreen modals for complex multi-step forms. See
 * `docs/01-system-architecture/MOBILE_WEB_STANDARDS.md` standard #1.
 *
 * Pattern:
 *   - `<DialogPrimitive.Content>` is `fixed inset-0` — fills the layout viewport.
 *   - The OS keyboard takes part of the bottom; the browser scrolls the focused
 *     input into view inside our inner `overflow-y-auto` body. No JS keyboard
 *     handling, no Visual Viewport gymnastics — same pattern iOS Mail, Notes,
 *     and Settings use.
 *   - Header / scrollable body / footer are stacked via flex column.
 *
 * Prop API is unchanged from the prior vaul implementation so the ~12 adopters
 * (`AddWorkEntryTTFlow`, `AddOTEntryWorkFlow`, `EditTrialTrenchModal`, etc.)
 * don't need to be touched.
 */

import { type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { type StepperStep } from '@/components/primitives/form/Stepper';
import { WizardStepperHeader } from './WizardStepperHeader';
import { WizardFooter } from './WizardFooter';
import { GLASS_BACKDROP } from '../shared';

interface WizardMobileDrawerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: ReactNode;
  /** Optional subtitle under the title. */
  subtitle?: ReactNode;
  steps: StepperStep[];
  currentStep: number;
  children: ReactNode;
  onCancel?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  /** Optional ReactNode rendered between Cancel/Back and Next/Submit (e.g. "Save as Draft"). */
  extraAction?: ReactNode;
  testId?: string;
}

export function WizardMobileDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  steps,
  currentStep,
  children,
  onCancel,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  onSubmit,
  submitLabel = 'Submit',
  submitDisabled = false,
  isSubmitting = false,
  extraAction,
  testId,
}: WizardMobileDrawerProps) {
  // Forward onCancel as-is — when omitted, WizardFooter skips Cancel button.
  const handleCancel = onCancel;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={`fixed inset-0 z-50 ${GLASS_BACKDROP} data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0`}
        />
        <DialogPrimitive.Content
          data-testid={testId}
          className="fixed inset-0 z-50 flex flex-col bg-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {/* Header — title is caller-rendered (typically includes its own back-arrow); we add the stepper */}
          <div
            className="flex-shrink-0 px-4.5 pt-3 pb-2 border-b border-border"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <DialogPrimitive.Title
              className="text-[20px] leading-tight text-foreground block"
              style={{
                fontFamily: 'var(--font-pixel)',
                letterSpacing: '-0.01em',
                WebkitFontSmoothing: 'none',
              }}
            >
              {title}
            </DialogPrimitive.Title>
            {subtitle && (
              <DialogPrimitive.Description className="text-[11px] text-muted-foreground mt-0.5 block">
                {subtitle}
              </DialogPrimitive.Description>
            )}
            <div className="mt-2">
              <WizardStepperHeader steps={steps} currentStep={currentStep} compact />
            </div>
          </div>

          {/* Scrollable body — owns its own overflow so the OS keyboard can scroll the focused input into view inside it. */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4.5 py-3">
            {children}
          </div>

          {/* Footer — safe-area bottom padding for iPhone home-indicator */}
          <div
            className="flex-shrink-0 px-4.5 py-3 border-t border-border flex flex-wrap gap-2 bg-card"
            style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}
          >
            <WizardFooter
              currentStep={currentStep}
              totalSteps={steps.length}
              onCancel={handleCancel}
              onBack={onBack}
              onNext={onNext}
              nextLabel={nextLabel}
              nextDisabled={nextDisabled}
              onSubmit={onSubmit}
              submitLabel={submitLabel}
              submitDisabled={submitDisabled}
              isSubmitting={isSubmitting}
              extraAction={extraAction}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
