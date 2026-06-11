/**
 * useDashboardChrome — shared chrome state for every page that composes
 * `<AppHeader>` directly (replacing the legacy `<DashboardHeader>` shim).
 *
 * Returns the props AppHeader needs, derived from AuthContext + ThemeProvider,
 * plus an impersonation sub-object for rendering `<ImpersonationBanner>`.
 *
 * Usage:
 *   const chrome = useDashboardChrome();
 *   return (
 *     <div className="min-h-screen" style={{ background: 'var(--page-bg, #f4f4f5)' }}>
 *       <AppHeader breadcrumb={[{ label: 'Workspace', href: '/dashboard' }, { label: 'My Page' }]} {...chrome.appHeaderProps} />
 *       {chrome.impersonation.active && <ImpersonationBanner {...chrome.impersonation.props} />}
 *       …page content…
 *     </div>
 *   );
 *
 * Related:
 *  - src/components/primitives/shell/AppHeader.tsx
 *  - src/components/primitives/shell/ImpersonationBanner.tsx
 *  - src/components/DashboardHeader.tsx (legacy shim — this hook extracts its chrome logic)
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/lib/design/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorage } from '@/utils/authStorage';
import { showError, showSuccess } from '@/utils/toastHelper';
import { NotificationsBell } from '@/components/primitives/shell/NotificationsBell';
import { ViewAsSelector } from '@/components/primitives/shell/ViewAsSelector';
import { useViewAs } from '@/hooks/useViewAs';
import { useNotificationsBell } from '@/hooks/useNotificationsBell';

const formatRole = (role: string) =>
  role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export interface DashboardChrome {
  appHeaderProps: {
    userName: string;
    userEmail: string;
    userRole: string;
    viewAsSlot: React.ReactNode;
    notificationsSlot: React.ReactNode;
    themeMode: 'light' | 'dark' | 'system';
    onThemeChange: (m: 'light' | 'dark' | 'system') => void;
    onSignOut: () => Promise<void>;
  };
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
  const { preference, setPreference } = useTheme();
  const { user, profile, isImpersonating, realUser, stopImpersonation } = useAuth();
  const impersonation = useViewAs();
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
    appHeaderProps: {
      userName,
      userEmail,
      userRole,
      viewAsSlot: <ViewAsSelector {...impersonation} />,
      notificationsSlot: <NotificationsBell {...notifications} />,
      themeMode: preference,
      onThemeChange: (m) => setPreference(m),
      onSignOut: handleSignOut,
    },
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
