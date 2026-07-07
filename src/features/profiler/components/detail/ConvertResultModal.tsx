/**
 * ConvertResultModal — confirm dialog for the prospect→client convert.
 *
 * Dumb component (mutation lives in `hooks/useConvertResult`, held by the
 * page so its keyed-retry state survives modal close/reopen). Stays open
 * during the mutation — a step-2 link failure keeps the retry affordance in
 * front of the advisor; outside-click/ESC/Cancel are blocked while converting.
 */

import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';

interface ConvertResultModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  prospectName: string;
  converting: boolean;
  onConfirm: () => void;
}

export function ConvertResultModal({
  open,
  onOpenChange,
  prospectName,
  converting,
  onConfirm,
}: ConvertResultModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Convert to client"
      description={`Adds ${prospectName} to your client book and links this result to the new record.`}
      testId="result-detail-convert-modal"
      onInteractOutside={(event) => {
        if (converting) event.preventDefault();
      }}
      onEscapeKeyDown={(event) => {
        if (converting) event.preventDefault();
      }}
      footer={
        <>
          <ModalGhostAction
            data-testid="result-detail-convert-cancel-btn"
            disabled={converting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </ModalGhostAction>
          <ModalPrimaryAction
            data-testid="result-detail-convert-confirm-btn"
            disabled={converting}
            onClick={onConfirm}
          >
            {converting ? 'Converting…' : 'Create client'}
          </ModalPrimaryAction>
        </>
      }
    >
      <ul className="m-0 list-disc space-y-1 pl-5 text-[13px] text-muted-foreground">
        <li>Creates a client named {prospectName} with the prospect&apos;s occupation.</li>
        <li>
          The client&apos;s notes start with a provenance line (result id, age range, DISC, MBTI)
          followed by your saved notes.
        </li>
        <li>The communication-style card on the client record links back to this playbook.</li>
      </ul>
    </Modal>
  );
}
