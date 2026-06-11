/**
 * Manage Accounts feature — public barrel (the ONLY cross-feature import surface).
 *
 * Route entries in App.tsx lazy-import page files directly for code-splitting;
 * everything else imports from here.
 */

export { default as ManageAccountsPage } from './pages/ManageAccountsPage';

export type { ManagedUser, AssignableRole } from './types';
