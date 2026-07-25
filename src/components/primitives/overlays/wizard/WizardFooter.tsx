/**
 * WizardFooter — 4-button row (Cancel ghost · Back ghost · [extraAction] · Next/Submit primary).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-05-23-M2TVjKyQ/project/project/preview/component-wizard-modal.html
 *       (section 04 · "Step-aware footer" — lines ~200-280)
 *
 * Step-aware:
 *  - Hides Back on step 0
 *  - Switches Next → Submit on last step (with `submitLabel` + `isSubmitting` spinner)
 *  - `extraAction` slot rendered between Back and Next/Submit (e.g. supervisor-drafts "Save as Draft")
 *
 * Resubmit CTA stays primary (brown) — NOT destructive — per locked picks v3.
 * Mobile sticky-at-bottom + safe-area inset handled at the parent shell (drawer
 * applies `pb-[env(safe-area-inset-bottom)]` on its outer container).
 */

import type { ReactNode } from 'react';
import { ModalGhostAction, ModalPrimaryAction } from '../Modal';

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  /** Optional. When omitted, no Cancel button renders — X / ESC handle close.
   *  (Unified-draft pattern 2026-05-27: Cancel was redundant with X; Discard
   *  Draft is now a separate destructive action surfaced via `extraAction`.) */
  onCancel?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  /**
   * Optional secondary action rendered between Cancel/Back and Next/Submit
   * (e.g. supervisor-drafts "Save as Draft" button). Render any node — typically
   * `<ModalGhostAction>` to match the visual weight of Cancel.
   */
  extraAction?: ReactNode;
}

export function WizardFooter({
  currentStep,
  totalSteps,
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
}: WizardFooterProps) {
  const isLastStep = currentStep === totalSteps - 1;
  return (
    <>
      {onCancel && (
        <ModalGhostAction onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </ModalGhostAction>
      )}
      {currentStep > 0 && onBack && (
        <ModalGhostAction onClick={onBack} disabled={isSubmitting}>
          Back
        </ModalGhostAction>
      )}
      {extraAction}
      {!isLastStep && onNext && (
        <ModalPrimaryAction onClick={onNext} disabled={nextDisabled || isSubmitting}>
          {nextLabel}
        </ModalPrimaryAction>
      )}
      {isLastStep && onSubmit && (
        <ModalPrimaryAction onClick={onSubmit} disabled={submitDisabled || isSubmitting}>
          {isSubmitting ? 'Updating…' : submitLabel}
        </ModalPrimaryAction>
      )}
    </>
  );
}
