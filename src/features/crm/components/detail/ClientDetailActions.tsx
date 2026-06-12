/**
 * ClientDetailActions — Edit client / soft-Delete on OWN clients only.
 * Manager/super_admin viewing another advisor's client (RLS `view_all_clients`)
 * get a read-only hint instead — mirrors profiler's ResultDetailActions; RLS
 * enforces ownership server-side regardless.
 *
 * Rendered twice by ClientDetailPage: in the DetailPageFrame hero (desktop)
 * and in the sticky mobile action bar (`mobile`, 44px targets).
 */

import { Lock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';

interface ClientDetailActionsProps {
  isOwn: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  mobile?: boolean;
}

function ReadOnlyHint({ mobile }: { mobile?: boolean }) {
  return (
    <span
      className={
        mobile
          ? 'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 text-zinc-600 dark:text-zinc-400'
          : 'inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400'
      }
      style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.04em' }}
      title="Only the advisor who owns a client can edit or delete the record."
      data-testid="clients-detail-readonly-hint"
    >
      <Lock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
      Read-only — managed by another advisor
    </span>
  );
}

export function ClientDetailActions({
  isOwn,
  deleting,
  onEdit,
  onDelete,
  mobile = false,
}: ClientDetailActionsProps) {
  const size = mobile ? 'lg' : 'md';
  const grow = mobile ? 'flex-1' : undefined;

  return (
    <div
      className={mobile ? 'flex w-full flex-wrap items-center gap-2' : 'flex items-center gap-2'}
      data-testid={mobile ? 'clients-detail-actions-mobile' : 'clients-detail-actions'}
    >
      {!isOwn && <ReadOnlyHint mobile={mobile} />}
      {isOwn && (
        <>
          <Button
            variant="ghost"
            size={size}
            className={`text-red-700 dark:text-red-400 ${grow ?? ''}`}
            leadingIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={onDelete}
            loading={deleting}
            data-testid={`clients-detail-delete-btn${mobile ? '-mobile' : ''}`}
          >
            Delete
          </Button>
          <Button
            variant="primary"
            size={size}
            className={grow}
            leadingIcon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={onEdit}
            data-testid={`clients-detail-edit-btn${mobile ? '-mobile' : ''}`}
          >
            Edit client
          </Button>
        </>
      )}
    </div>
  );
}
