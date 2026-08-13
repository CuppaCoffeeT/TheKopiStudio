/**
 * useDashboardChrome — the one place account / impersonation chrome is wired,
 * wherever that chrome is homed.
 *
 * Since the 2a masthead retirement (2026-07-25) there are three consumers:
 *   - `AppSidebarFooter` — the >= lg account home, pinned to the bottom of the
 *     200px rail.
 *   - `AppHeaderMobileBar` — the < lg fallback, rendered by ListPageFrame /
 *     DetailPageFrame / AppHeaderShell, and by DashboardHomePage, which
 *     composes none of them.
 *   - `ImpersonationBanner` — rendered by those same frames.
 *
 * It returns connector PROP BAGS rather than pre-rendered slots, so each home
 * places its own overlays: the rail opens them to its right, the mobile bar
 * folds view-as into the account dropdown.
 *
 * Theme is pinned light by ThemeProvider (.claude/rules/light-theme.md), so no
 * theme props exist here.
 *
 * Related:
 *  - src/components/primitives/shell/AppSidebarFooter.tsx
 *  - src/components/primitives/shell/AppHeaderMobileBar.tsx
 *  - src/components/primitives/shell/ImpersonationBanner.tsx
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorage } from '@/utils/authStorage';
import { showError, showSuccess } from '@/utils/toastHelper';
import type { NotificationsBellProps } from '@/components/primitives/shell/NotificationsBell';
import type { ViewAsSelectorProps } from '@/components/primitives/shell/ViewAsSelector';
import { useViewAs } from '@/hooks/useViewAs';
import { useNotificationsBell } from '@/hooks/useNotificationsBell';

const formatRole = (role: string) =>
  role
    .split('_')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');

export interface DashboardChrome {
  /** Identity for the account menu — spread straight into `<AppHeaderUserMenu>`. */
  user: {
    initial: string;
    userName: string;
    userEmail: string;
    userRole: string;
  };
  /** Prop bag for `<ViewAsSelector>` (self-guards for non-super_admin). */
  viewAs: ViewAsSelectorProps;
  /** Prop bag for `<NotificationsBell>`. */
  notifications: NotificationsBellProps;
  onSignOut: () => Promise<void>;
  impersonation: {
    active: boolean;
    props: {
      role: string;
      email: string;
      onExit: () => void;
    };
  };
}

export function useDashboardChrome(): DashboardChrome {
  const navigate = useNavigate();
  const { user, profile, isImpersonating, realUser, stopImpersonation } = useAuth();
  const viewAs = useViewAs();
  const notifications = useNotificationsBell();

  const userName = profile?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = profile?.email || user?.email || '';
  const userRole = formatRole(profile?.role || user?.role || '');

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showError('There was an issue signing out. Clearing session anyway.');
      }
      clearAuthStorage();
      showSuccess('Logged out successfully');
      navigate('/login', { replace: true });
    } catch {
      showError('An unexpected error occurred during logout');
    }
  };

  return {
    user: {
      initial: userName.charAt(0).toUpperCase(),
      userName,
      userEmail,
      userRole,
    },
    viewAs,
    notifications,
    onSignOut: handleSignOut,
    impersonation: {
      active: !!(isImpersonating && realUser),
      props: {
        role: userRole,
        email: userEmail,
        onExit: stopImpersonation,
      },
    },
  };
}
