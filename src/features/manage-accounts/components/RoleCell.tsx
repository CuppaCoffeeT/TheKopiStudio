/**
 * RoleCell — per-row role SelectMenu (advisor / manager / super_admin).
 *
 * Disabled on the caller's own row (paired with the "This is you" Chip) and
 * while a role-sync mutation for this row is in flight. Selecting the current
 * role is a no-op — only actual changes hit the edge function.
 */

import {
  SelectMenu,
  SelectMenuContent,
  SelectMenuItem,
  SelectMenuTrigger,
  SelectMenuValue,
  type SelectMenuSize,
} from '@/components/primitives/overlays/SelectMenu';
import { Chip } from '@/components/primitives/shell/Chip';
import type { AssignableRole } from '../types';
import { ASSIGNABLE_ROLES, ROLE_LABELS, isAssignableRole } from '../lib/roleLabels';

export interface RoleCellProps {
  userId: string;
  userName: string;
  role: string;
  isSelf: boolean;
  busy: boolean;
  onRoleChange: (role: AssignableRole) => void;
  /** sm on desktop table rows; lg on mobile cards (≥44px touch target). */
  size?: SelectMenuSize;
  /** Render the "This is you" Chip beside the select (desktop role column). */
  withSelfChip?: boolean;
}

export function RoleCell({
  userId,
  userName,
  role,
  isSelf,
  busy,
  onRoleChange,
  size = 'sm',
  withSelfChip = false,
}: RoleCellProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <SelectMenu
        value={isAssignableRole(role) ? role : undefined}
        onValueChange={(value) => {
          if (value !== role && isAssignableRole(value)) onRoleChange(value);
        }}
        disabled={isSelf || busy}
      >
        <SelectMenuTrigger
          size={size}
          className="w-[140px] shrink-0"
          aria-label={`Role for ${userName}`}
          data-testid={`manage-accounts-role-select-${userId}`}
        >
          <SelectMenuValue placeholder="Select role" />
        </SelectMenuTrigger>
        <SelectMenuContent>
          {ASSIGNABLE_ROLES.map((assignable) => (
            <SelectMenuItem
              key={assignable}
              value={assignable}
              data-testid={`manage-accounts-role-option-${assignable.replace('_', '-')}`}
            >
              {ROLE_LABELS[assignable]}
            </SelectMenuItem>
          ))}
        </SelectMenuContent>
      </SelectMenu>
      {withSelfChip && isSelf && (
        <Chip size="sm" disabled data-testid="manage-accounts-self-chip">
          This is you
        </Chip>
      )}
    </div>
  );
}
