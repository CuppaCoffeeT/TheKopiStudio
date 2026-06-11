/**
 * NotesModal — add/edit meeting notes on the result screen (legacy `openNotes`
 * / `saveNotes`). Notes live in wizard state: they print on the PDF and land
 * in the CSV, and persist to the DB only via the auto-save at generation time
 * (legacy parity — notes edited here AFTER the auto-save are export-only;
 * saved rows get their notes edited on the result detail page instead).
 */

import { useEffect, useState } from 'react';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';
import { Textarea } from '@/components/primitives/form';
import { showSuccess } from '@/utils/toastHelper';

interface NotesModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  notes: string;
  onSave: (notes: string) => void;
}

export function NotesModal({ open, onOpenChange, notes, onSave }: NotesModalProps) {
  const [draft, setDraft] = useState(notes);

  // Re-seed the textarea from saved notes each time the modal opens.
  useEffect(() => {
    if (open) setDraft(notes);
  }, [open, notes]);

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
    showSuccess('Notes saved');
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Meeting notes"
      description="Notes appear on the printed report and in the CSV export."
      size="md"
      testId="result-notes-modal"
      footer={
        <>
          <ModalGhostAction onClick={() => onOpenChange(false)} data-testid="wizard-notes-cancel-btn">
            Cancel
          </ModalGhostAction>
          <ModalPrimaryAction onClick={handleSave} data-testid="notes-save-btn">
            Save notes
          </ModalPrimaryAction>
        </>
      }
    >
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Anything worth remembering about this conversation…"
        minHeight={120}
        aria-label="Meeting notes"
        data-testid="notes-textarea"
      />
    </Modal>
  );
}
