/**
 * ConvertFlow — the whole prospect→client convert interaction, as one unit.
 *
 * Two modals in sequence, never stacked: the confirm, then the duplicate fork
 * that only appears when `findClientByName` matched a customer already in the
 * advisor's book. The confirm hides itself the moment a duplicate is found,
 * so the advisor answers one question at a time.
 *
 * Extracted from `ResultDetailPage` (2026-08-13) when the fork pushed that
 * page over the 200-LOC ceiling — at the seam that was already there: the
 * page owns the record, the tabs and the other three dialogs; this owns the
 * convert decision. The mutation still lives in the PAGE's `useConvertResult`
 * so its keyed-retry state and its found duplicate survive a modal close.
 */

import type { useConvertResult } from '../../hooks/useConvertResult';
import { ConvertResultModal } from './ConvertResultModal';
import { DuplicateCustomerModal } from './DuplicateCustomerModal';

interface ConvertFlowProps {
  /** The confirm modal's visibility — the duplicate fork governs its own. */
  open: boolean;
  onOpenChange: (next: boolean) => void;
  prospectName: string;
  convert: ReturnType<typeof useConvertResult>;
}

export function ConvertFlow({ open, onOpenChange, prospectName, convert }: ConvertFlowProps) {
  const duplicate = convert.duplicate;

  return (
    <>
      <ConvertResultModal
        open={open && !duplicate}
        onOpenChange={onOpenChange}
        prospectName={prospectName}
        converting={convert.isPending}
        onConfirm={() => convert.mutate({ mode: 'auto' })}
      />
      {duplicate && (
        <DuplicateCustomerModal
          open
          onOpenChange={(next) => {
            if (next) return;
            convert.dismissDuplicate();
            onOpenChange(false);
          }}
          prospectName={prospectName}
          existingName={duplicate.name}
          converting={convert.isPending}
          onLink={() => convert.linkToExisting(duplicate.id)}
          onCreateAnyway={() => convert.createAnyway()}
        />
      )}
    </>
  );
}
