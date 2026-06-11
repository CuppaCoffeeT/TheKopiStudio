/**
 * Account Settings feature — public barrel (the ONLY cross-feature import surface).
 *
 * Route entries in App.tsx lazy-import page files directly for code-splitting;
 * everything else imports from here.
 */

export { default as AccountSettingsPage } from './pages/AccountSettingsPage';

export type {
  AccountUser,
  AccountSettingsTab,
  AccountProfile,
  UpdateSelfInput,
} from './types';
