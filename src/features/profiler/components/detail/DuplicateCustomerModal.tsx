/**
 * DuplicateCustomerModal — the fork "Convert to client" takes when a customer
 * of this name is ALREADY in the advisor's book.
 *
 * Why it exists: convert used to INSERT unconditionally, so profiling a
 * customer you already had produced a second record — the profile landed on
 * the new one while the original kept reading "never profiled" on the
 * Overview queue forever. Linking is offered first because that is the case
 * that actually happens; creating a second record stays available (two real
 * people do share a name) but is never the default and never automatic.
 *
 * Dumb component — the mutation and the duplicate state live in
 * `hooks/useConvertResult`, held by the page.
 */

import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';

interface DuplicateCustomerModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  prospectName: string;
  /** The existing customer's display name — may differ in case from the result. */
  existingName: string;
  converting: boolean;
  onLink: () => void;
  onCreateAnyway: () => void;
}

export function DuplicateCustomerModal({
  open,
  onOpenChange,
  prospectName,
  existingName,
  converting,
  onLink,
  onCreateAnyway,
}: DuplicateCustomerModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="You already have this customer"
      description={`${existingName} is already in your book. Link this profile to them instead of adding a second record?`}
      testId="result-detail-duplicate-modal"
      onInteractOutside={(event) => {
        if (converting) event.preventDefault();
      }}
      onEscapeKeyDown={(event) => {
        if (converting) event.preventDefault();
      }}
      footer={
        <>
          <ModalGhostAction
            data-testid="result-detail-duplicate-cancel-btn"
            disabled={converting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </ModalGhostAction>
          <ModalGhostAction
            data-testid="result-detail-duplicate-create-btn"
            disabled={converting}
            onClick={onCreateAnyway}
          >
            Create a separate customer
          </ModalGhostAction>
          <ModalPrimaryAction
            data-testid="result-detail-duplicate-link-btn"
            disabled={converting}
            onClick={onLink}
          >
            {converting ? 'Linking…' : `Link to ${existingName}`}
          </ModalPrimaryAction>
        </>
      }
    >
      <ul className="m-0 list-disc space-y-1 pl-5 text-[13px] text-muted-foreground">
        <li>
          Linking puts this risk profile on the record you already have — their chain reads step 01
          done and they drop off the Overview queue.
        </li>
        <li>
          Creating a separate customer leaves {prospectName} unprofiled on the existing record. Pick
          it only when these really are two different people.
        </li>
      </ul>
    </Modal>
  );
}
