import { useState } from 'react';
import { ListPageFrame } from '@/components/primitives/ui/ListPageFrame';
import type { TableHeaderColumn } from '@/components/primitives/ui/TableHeader';

/**
 * ManageAccountsPage — approve users & manage roles (LIST archetype).
 *
 * Module-gated to manager/super_admin (advisor carries an explicit
 * is_granted=false deny marker in role_modules).
 *
 * P1 scaffold stub: renders the real ListPageFrame with the final column set
 * and an honest empty state. The users query (direct select, never
 * get_all_users) and role-sync mutations land in Phase P5.
 */

const COLUMNS: TableHeaderColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'approval', label: 'Approval' },
  { key: 'joined', label: 'Joined' },
];

export default function ManageAccountsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ListPageFrame
      title="Manage Accounts"
      description="Approve new sign-ups and manage user roles."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search name, email or role…"
      columns={COLUMNS}
      rows={[]}
      variant="empty"
      selectable={false}
      page={1}
      totalPages={1}
      totalItems={0}
      onPageChange={() => undefined}
      tableTestId="manage-accounts-table"
      searchTestId="manage-accounts-search-input"
    />
  );
}
