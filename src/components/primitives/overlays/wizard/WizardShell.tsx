/**
 * WizardShell — desktop modal composition for multi-step wizards.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-05-23-M2TVjKyQ/project/project/preview/component-wizard-modal.html
 *
 * Not a new primitive — composes:
 *  - primitive `Modal` (overlays)
 *  - `<WizardStepperHeader>` (chip-band + eyebrow)
 *  - `<WizardFooter>` (step-aware Cancel · Back · Next/Submit)
 *
 * Used by EditTrialTrenchModal (4-step) + EditGeneralWorksModal (3-step) on
 * desktop. Mobile uses `<WizardMobileDrawer>` (same prop API).
 * EditWorkerOTModal does NOT use this (single-form, no Stepper).
 *
 * Locked picks v3: Stepper = animated chip · Resubmit CTA = primary (brown).
 */

import { type ReactNode } from 'react';
import { Modal } from '../Modal';
import { type StepperStep } from '@/components/primitives/form/Stepper';
import { WizardStepperHeader } from './WizardStepperHeader';
import { WizardFooter } from './WizardFooter';

interface WizardShellProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Modal title shown above the stepper. Per step OR fixed. */
  title: ReactNode;
  /** Ordered step labels for the Stepper chips. */
  steps: StepperStep[];
  /** Zero-indexed current step. */
  currentStep: number;
  /** Body content for the current step. */
  children: ReactNode;
  /** Modal width. Wizards typically want `xxl` (800px) for desktop. */
  size?: 'md' | 'lg' | 'xl' | 'xxl';
  /** "Cancel" handler (closes modal). Defaults to `() => onOpenChange(false)`. */
  onCancel?: () => void;
  /** "Back" handler — only rendered when `currentStep > 0`. */
  onBack?: () => void;
  /** "Next" handler — rendered when `currentStep < steps.length - 1`. */
  onNext?: () => void;
  /** Next button label override (e.g. "Next: Edit Services"). */
  nextLabel?: string;
  nextDisabled?: boolean;
  /** "Submit" handler — rendered ONLY on the last step. */
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  /** Optional ReactNode rendered between Cancel/Back and Next/Submit (e.g. "Save as Draft"). */
  extraAction?: ReactNode;
  testId?: string;
}

export function WizardShell({
  open,
  onOpenChange,
  title,
  steps,
  currentStep,
  children,
  size = 'xxl',
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
}: WizardShellProps) {
  // Forward onCancel as-is — when omitted, WizardFooter skips rendering the
  // Cancel button entirely (X / ESC still close via onOpenChange).
  const handleCancel = onCancel;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex flex-col gap-3">
          <div>{title}</div>
          <WizardStepperHeader steps={steps} currentStep={currentStep} />
        </div>
      }
      size={size}
      testId={testId}
      footer={
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
      }
    >
      <div className="max-h-[60vh] overflow-y-auto pr-1">{children}</div>
    </Modal>
  );
}
