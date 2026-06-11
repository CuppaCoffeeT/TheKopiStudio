/**
 * Manage Accounts feature — public barrel (the ONLY cross-feature import surface).
 *
 * Route entries in App.tsx lazy-import page files directly for code-splitting;
 * everything else imports from here.
 */

export { default as ManageAccountsPage } from './pages/ManageAccountsPage';

export type { ManagedUser, AssignableRole } from './types';

export { getUsersPaginated } from './api/usersService';
export type { UsersListParams, UsersListResult, UsersListTab } from './api/usersService';

export { useUsersList } from './hooks/useUsersList';
export { useRoleSync } from './hooks/useRoleSync';
export type { RoleSyncInput, RoleSyncResponse } from './hooks/useRoleSync';

export { ASSIGNABLE_ROLES, ROLE_LABELS, isAssignableRole } from './lib/roleLabels';
