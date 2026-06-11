import { useEffect, useState } from 'react';
import { ListPageFrame } from '@/components/primitives/ui/ListPageFrame';
import type { TableHeaderColumn } from '@/components/primitives/ui/TableHeader';
import type { DataTableRow, DataTableVariant } from '@/components/primitives/ui/DataTable';
import type { StatusTab } from '@/components/primitives/ui/StatusTabs';
import { DateCell } from '@/components/primitives/shell/cells/DateCell';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useURLPagination } from '@/hooks/useURLPagination';
import type { UsersListTab } from '../api/usersService';
import { useUsersList } from '../hooks/useUsersList';
import { useRoleSync } from '../hooks/useRoleSync';
import { RoleCell } from '../components/RoleCell';
import { ApprovalCell } from '../components/ApprovalCell';
import { UsersMobileList } from '../components/UsersMobileList';
import type { AssignableRole } from '../types';

/**
 * ManageAccountsPage — approve users & manage roles (LIST archetype).
 *
 * Module-gated to manager/super_admin. Data comes from a direct `users`
 * select (never `get_all_users()`); ALL role/approval mutations flow through
 * the role-sync edge function via useRoleSync. The caller's own row is fully
 * read-only ("This is you").
 */

const COLUMNS: TableHeaderColumn[] = [
  { key: 'name', label: 'Name', grow: 1.1, minWidth: 140 },
  { key: 'email', label: 'Email', grow: 1.3, minWidth: 180 },
  { key: 'role', label: 'Role', width: 250, minWidth: 250 },
  { key: 'approval', label: 'Approved', width: 200, minWidth: 200 },
  { key: 'joined', label: 'Joined', width: 110, minWidth: 110 },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export default function ManageAccountsPage() {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const { params, setters, hasActiveFilters } = useURLPagination({
    tab: 'all',
    order: 'desc',
  });
  const [searchInput, setSearchInput] = useState(params.search);
  const debouncedSearch = useDebounce(searchInput, 350);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    setters.setSearch(debouncedSearch);
  }, [debouncedSearch, setters]);

  const tab: UsersListTab = params.tab === 'pending' ? 'pending' : 'all';
  const usersQuery = useUsersList({
    search: params.search,
    page: params.page,
    rowsPerPage,
    tab,
  });
  const roleSync = useRoleSync();

  const users = usersQuery.data?.users ?? [];
  const totalCount = usersQuery.data?.totalCount ?? 0;
  const pendingCount = usersQuery.data?.pendingCount;
  const busyUserId = roleSync.isPending ? (roleSync.variables?.user_id ?? null) : null;

  const handleRoleChange = (userId: string, role: AssignableRole) =>
    roleSync.mutate({ user_id: userId, role });
  const handleApprove = (userId: string) =>
    roleSync.mutate({ user_id: userId, is_approved: true });

  const tabs: StatusTab[] = [
    { key: 'all', label: 'All', testId: 'manage-accounts-tab-all' },
    {
      key: 'pending',
      label: 'Pending approval',
      count: pendingCount,
      tone: pendingCount && pendingCount > 0 ? 'alert' : 'default',
      testId: 'manage-accounts-tab-pending',
    },
  ];

  const variant: DataTableVariant = usersQuery.isPending
    ? 'loading'
    : usersQuery.isError
      ? 'error'
      : users.length === 0
        ? hasActiveFilters || tab === 'pending'
          ? 'no-results'
          : 'empty'
        : 'default';

  const rows: DataTableRow[] = users.map((row) => {
    const isSelf = row.id === currentUserId;
    const busy = busyUserId === row.id;
    return {
      id: row.id,
      testId: `manage-accounts-row-${row.id}`,
      cells: [
        {
          key: 'name',
          content: <span className="truncate font-medium">{row.name}</span>,
          grow: 1.1,
          minWidth: 140,
        },
        { key: 'email', content: row.email, muted: true, grow: 1.3, minWidth: 180 },
        {
          key: 'role',
          content: (
            <RoleCell
              userId={row.id}
              userName={row.name}
              role={row.role}
              isSelf={isSelf}
              busy={busy}
              onRoleChange={(role) => handleRoleChange(row.id, role)}
              withSelfChip
            />
          ),
          width: 250,
          minWidth: 250,
        },
        {
          key: 'approval',
          content: (
            <ApprovalCell
              userId={row.id}
              isApproved={row.is_approved}
              isSelf={isSelf}
              busy={busy}
              onApprove={() => handleApprove(row.id)}
            />
          ),
          width: 200,
          minWidth: 200,
        },
        {
          key: 'joined',
          content: <DateCell value={row.created_at} />,
          width: 110,
          minWidth: 110,
        },
      ],
    };
  });

  return (
    <ListPageFrame
      title="Manage Accounts"
      description="Approve new sign-ups and manage user roles."
      tabs={tabs}
      activeTab={tab}
      onTabChange={setters.setTab}
      searchQuery={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Search name or email…"
      columns={COLUMNS}
      rows={rows}
      variant={variant}
      density="cozy"
      selectable={false}
      mobileBody={
        variant === 'default' ? (
          <UsersMobileList
            users={users}
            currentUserId={currentUserId}
            busyUserId={busyUserId}
            onRoleChange={handleRoleChange}
            onApprove={handleApprove}
          />
        ) : undefined
      }
      page={params.page}
      totalPages={Math.max(1, Math.ceil(totalCount / rowsPerPage))}
      totalItems={totalCount}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      onPageChange={setters.setPage}
      onRowsPerPageChange={(n) => {
        setRowsPerPage(n);
        setters.setPage(1);
      }}
      tableTestId="manage-accounts-table"
      searchTestId="manage-accounts-search-input"
    />
  );
}
