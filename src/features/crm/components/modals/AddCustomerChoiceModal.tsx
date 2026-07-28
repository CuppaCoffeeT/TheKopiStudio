/**
 * AddCustomerChoiceModal — the "two ways to add someone" fork (Kopi Studio
 * Directions turn 4a, "New customer now forks into *start with the profiler* or
 * *create an empty profile*").
 *
 * Under the customer-centred IA a customer is normally CREATED BY PROFILING
 * THEM — that is the live-first-meeting path and it is the recommended one. The
 * empty profile exists for the referral you have not met yet: a name to hold
 * the place, which then sits under Unfinished work until the profiler is run.
 *
 * Presentation only. The caller owns both destinations, so this component never
 * navigates and never writes.
 *
 * The profiler card is hidden — not disabled — for a viewer who does not hold
 * `/profiler`: offering a route their guard would refuse is worse than not
 * offering it. With the card hidden the modal still earns its place, because the
 * empty-profile explanation is what tells them why the record starts locked.
 */

import { FileUser, UserSearch } from 'lucide-react';
import { ChoiceCards, type ChoiceCardOption } from '@/components/primitives/overlays/ChoiceCards';
import { Modal, ModalGhostAction } from '@/components/primitives/overlays/Modal';

export type AddCustomerChoice = 'profiler' | 'empty';

interface AddCustomerChoiceModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** True when the viewer holds `/profiler` — hides the profiler card when false. */
  canProfile: boolean;
  onChoose: (choice: AddCustomerChoice) => void;
}

export function AddCustomerChoiceModal({
  open,
  onOpenChange,
  canProfile,
  onChoose,
}: AddCustomerChoiceModalProps) {
  const options: ChoiceCardOption[] = [
    ...(canProfile
      ? [
          {
            key: 'profiler' satisfies AddCustomerChoice,
            icon: UserSearch,
            accent: 'brown' as const,
            variant: 'primary' as const,
            title: 'Start with the Prospect Profiler',
            description:
              'For a live first meeting. Name and contact are captured up front, and the risk profile comes out at the end.',
            testId: 'crm-add-customer-choice-profiler',
          },
        ]
      : []),
    {
      key: 'empty' satisfies AddCustomerChoice,
      icon: FileUser,
      accent: 'muted' as const,
      title: 'Create an empty profile',
      description:
        'Just a name to hold the place — a referral you have not met yet. Appears under Unfinished work until the profiler is run.',
      testId: 'crm-add-customer-choice-empty',
    },
  ];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add a customer"
      description="How do you want to begin?"
      testId="crm-add-customer-choice-modal"
      footer={<ModalGhostAction onClick={() => onOpenChange(false)}>Cancel</ModalGhostAction>}
    >
      <ChoiceCards options={options} onSelect={(key) => onChoose(key as AddCustomerChoice)} />
      <p className="m-0 text-[12px] leading-[1.6] text-muted-foreground">
        Either way, the client report stays locked until a risk profile exists and the customer's
        information is complete.
      </p>
    </Modal>
  );
}
