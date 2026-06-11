/**
 * UsersMobileList — < md card body for the Manage Accounts DataTable.
 *
 * One MobileListCard per user: name (+ "This is you" chip) · email · joined
 * date, with the role select and approval action stacked in the right slot at
 * lg sizes (≥44px touch targets per mobile rules).
 */

import { MobileListCard } from '@/components/primitives/ui/MobileListCard';
import { Chip } from '@/components/primitives/shell/Chip';
import { DateCell } from '@/components/primitives/shell/cells/DateCell';
import type { AssignableRole, ManagedUser } from '../types';
import { RoleCell } from './RoleCell';
import { ApprovalCell } from './ApprovalCell';

export interface UsersMobileListProps {
  users: ManagedUser[];
  currentUserId: string | null;
  busyUserId: string | null;
  onRoleChange: (userId: string, role: AssignableRole) => void;
  onApprove: (userId: string) => void;
}

export function UsersMobileList({
  users,
  currentUserId,
  busyUserId,
  onRoleChange,
  onApprove,
}: UsersMobileListProps) {
  return (
    <>
      {users.map((user) => {
        const isSelf = user.id === currentUserId;
        const busy = busyUserId === user.id;
        return (
          <MobileListCard
            key={user.id}
            data-testid={`manage-accounts-card-${user.id}`}
            title={
              <span className="inline-flex items-center gap-2">
                <span className="truncate">{user.name}</span>
                {isSelf && (
                  <Chip size="sm" disabled data-testid="manage-accounts-self-chip-mobile">
                    This is you
                  </Chip>
                )}
              </span>
            }
            subtitle={user.email}
            meta={
              <span>
                Joined <DateCell value={user.created_at} className="text-[11px]" />
              </span>
            }
            right={
              <div className="flex flex-col items-end gap-2">
                <RoleCell
                  userId={user.id}
                  userName={user.name}
                  role={user.role}
                  isSelf={isSelf}
                  busy={busy}
                  onRoleChange={(role) => onRoleChange(user.id, role)}
                  size="lg"
                />
                <ApprovalCell
                  userId={user.id}
                  isApproved={user.is_approved}
                  isSelf={isSelf}
                  busy={busy}
                  onApprove={() => onApprove(user.id)}
                  buttonSize="lg"
                />
              </div>
            }
          />
        );
      })}
    </>
  );
}
