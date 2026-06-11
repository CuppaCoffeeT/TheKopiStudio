/**
 * ApprovalCell — approval StatusBadge plus an Approve primary action on
 * pending rows. Approve flows through role-sync (`is_approved: true`); the
 * per-row loading state rides the Button's spinner.
 */

import { StatusBadge } from '@/components/primitives/StatusBadge';
import { Button } from '@/components/primitives/shell/Button';
import type { ButtonSize } from '@/components/primitives/shell/Button';

export interface ApprovalCellProps {
  userId: string;
  isApproved: boolean;
  isSelf: boolean;
  busy: boolean;
  onApprove: () => void;
  /** sm on desktop table rows; lg on mobile cards (≥44px touch target). */
  buttonSize?: ButtonSize;
}

export function ApprovalCell({
  userId,
  isApproved,
  isSelf,
  busy,
  onApprove,
  buttonSize = 'sm',
}: ApprovalCellProps) {
  if (isApproved) {
    return <StatusBadge variant="accepted">Approved</StatusBadge>;
  }

  return (
    <div className="flex items-center gap-2">
      <StatusBadge variant="sent">Pending</StatusBadge>
      {!isSelf && (
        <Button
          variant="primary"
          size={buttonSize}
          loading={busy}
          onClick={onApprove}
          data-testid={`manage-accounts-approve-btn-${userId}`}
        >
          Approve
        </Button>
      )}
    </div>
  );
}
