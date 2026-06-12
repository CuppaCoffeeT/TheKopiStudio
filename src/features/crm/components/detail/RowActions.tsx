/**
 * RowActions — per-row Edit / Delete pair for the client-detail child lists.
 * Only rendered on OWN clients (callers gate on read-only mode). 44px touch
 * targets on mobile, compact on desktop.
 */

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  /** Accessible names, e.g. "Edit Term Life policy". */
  editLabel: string;
  deleteLabel: string;
  editTestId: string;
  deleteTestId: string;
}

export function RowActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  editTestId,
  deleteTestId,
}: RowActionsProps) {
  return (
    <span className="ml-auto flex flex-shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 md:min-h-0"
        leadingIcon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
        onClick={onEdit}
        aria-label={editLabel}
        data-testid={editTestId}
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 text-red-700 dark:text-red-400 md:min-h-0"
        leadingIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
        onClick={onDelete}
        aria-label={deleteLabel}
        data-testid={deleteTestId}
      >
        Delete
      </Button>
    </span>
  );
}
