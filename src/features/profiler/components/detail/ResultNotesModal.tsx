/**
 * ResultNotesModal — edit the advisor notes of a saved result.
 *
 * Dumb component: the mutation lives in `hooks/useResultMutations.ts` (page
 * calls the hook and passes `saving`/`onSave` down). The textarea re-seeds
 * from the stored notes every time the modal opens, so a cancelled edit never
 * leaks into the next session.
 */

import { useEffect, useState } from 'react';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';
import { Textarea } from '@/components/primitives/form/Textarea';

interface ResultNotesModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  prospectName: string;
  initialNotes: string;
  saving: boolean;
  onSave: (notes: string) => void;
}

export function ResultNotesModal({
  open,
  onOpenChange,
  prospectName,
  initialNotes,
  saving,
  onSave,
}: ResultNotesModalProps) {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (open) setNotes(initialNotes);
  }, [open, initialNotes]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit notes"
      description={`Private notes on ${prospectName} — saved with this result.`}
      testId="result-detail-notes-modal"
      footer={
        <>
          <ModalGhostAction
            data-testid="result-detail-notes-cancel-btn"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </ModalGhostAction>
          <ModalPrimaryAction
            data-testid="result-detail-notes-save-btn"
            disabled={saving}
            onClick={() => onSave(notes)}
          >
            {saving ? 'Saving…' : 'Save notes'}
          </ModalPrimaryAction>
        </>
      }
    >
      <Textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="What stood out, objections raised, next steps…"
        minHeight={120}
        maxHeight={260}
        disabled={saving}
        data-testid="result-detail-notes-textarea"
      />
    </Modal>
  );
}
