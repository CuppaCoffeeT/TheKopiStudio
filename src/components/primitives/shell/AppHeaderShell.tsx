/**
 * AppHeaderShell — page-shell wrapper that bundles AppHeader + ImpersonationBanner
 * + page-bg backdrop + content frame + PageTitle/PageDescription header block.
 * Internalises the ViewAsSelector + NotificationsBell slot fillers (via the
 * `useViewAs` + `useNotificationsBell` connector hooks) +
 * useAuth/sign-out wiring. (Theme is pinned dark navy/gold — no toggle wired.)
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-29-aNOsBrg/project/project/src/AppHeaderShell.jsx
 * Showcase: docs/99-refactor/_system/design/handoffs/2026-04-29-aNOsBrg/project/project/AppHeaderShell.html
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Sibling to: AppHeader (lower-level primitive — visual is owned there).
 * NOT a replacement for: DetailPageFrame · ListPageFrame.
 * IS a replacement for: per-feature <XPageShell> wrappers (Payment, Comms,
 *                       Xero, Payslip inline) and ad-hoc inline AppHeader
 *                       compositions in tool/dashboard/settings pages.
 *
 * Locked: rendered DOM is byte-identical to the hand-wired wrapper modulo
 *         testId / contentClassName overrides. No new tokens. No visual
 *         changes — the primitive is a code-organization win, not a
 *         redesign. Visual changes go to AppHeader, not here.
 */

import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorage } from '@/utils/authStorage';
import { showError, showSuccess } from '@/utils/toastHelper';
import { cn } from '@/lib/utils';
import { AppHeader } from './AppHeader';
import { ImpersonationBanner } from './ImpersonationBanner';
import { NotificationsBell } from './NotificationsBell';
import { PageTitle } from './PageTitle';
import { PageDescription } from './PageDescription';
import { ViewAsSelector } from './ViewAsSelector';
import type { BreadcrumbSegment } from './Breadcrumb';
import { useViewAs } from '@/hooks/useViewAs';
import { useNotificationsBell } from '@/hooks/useNotificationsBell';

const formatRole = (role: string) =>
  role
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');

export interface AppHeaderShellProps {
  /** Page H1 text — rendered inside the standard PageTitle block. */
  title: string;
  /** Optional sub-headline rendered inside PageDescription beneath PageTitle. */
  description?: string;
  /** Page content. */
  children: ReactNode;

  /**
   * Optional breadcrumb override. Defaults to:
   *   [{ label: 'Workspace', href: '/dashboard' }, { label: title }]
   * Override when the page sits deeper than 2 levels.
   */
  breadcrumb?: BreadcrumbSegment[];

  /**
   * Override the default `<ViewAsSelector />` slot filler.
   * - `null` = explicitly hide for super_admin
   * - `ReactNode` = replace with a custom node
   * - `undefined` (default) = render `<ViewAsSelector {...useViewAs()} />`
   *   (the primitive self-guards on non-super_admin, so the slot collapses for non-admins)
   */
  viewAsSlotOverride?: ReactNode | null;

  /**
   * Override the default `<NotificationsBell />` slot filler.
   * - `null` = hide the bell entirely
   * - `ReactNode` = replace with a custom node
   * - `undefined` (default) = render `<NotificationsBell {...useNotificationsBell()} />`
   */
  notificationsSlotOverride?: ReactNode | null;

  /** Replace the standard sign-out flow (supabase.auth.signOut + clearAuthStorage + navigate /login). */
  onSignOutOverride?: () => void | Promise<void>;

  /**
   * Override the default content wrapper class.
   * Default: `max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10`.
   * Pass full-bleed pages (e.g. Dashboard) something like
   * `max-w-none px-4 py-6`.
   */
  contentClassName?: string;

  /** Sets `data-testid` on the inner content `<div>` for Playwright anchors. */
  testId?: string;

  /** Forwarded to AppHeader: ⌘K command-palette trigger handler. */
  onCmdKClick?: () => void;
  /** Forwarded to AppHeader: ⌘/ universal-search trigger. The primitive
   *  default-wires this to dispatch `'open-global-search'`, so no wiring needed
   *  here. Pass `null` to hide the button; pass a function to override. */
  onGlobalSearchClick?: (() => void) | null;
  /** Forwarded to AppHeader: notifications unread count for the mobile fallback. */
  unreadCount?: number;
  /** Forwarded to AppHeader: notifications click handler for the mobile fallback. */
  onNotificationsClick?: () => void;
}

export function AppHeaderShell({
  title,
  description,
  children,
  breadcrumb,
  viewAsSlotOverride,
  notificationsSlotOverride,
  onSignOutOverride,
  contentClassName,
  testId,
  onCmdKClick,
  onGlobalSearchClick,
  unreadCount,
  onNotificationsClick,
}: AppHeaderShellProps) {
  const navigate = useNavigate();
  const { user, profile, isImpersonating, realUser, stopImpersonation } = useAuth();
  const impersonation = useViewAs();
  const notifications = useNotificationsBell();

  const userName = profile?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = profile?.email || user?.email || '';
  const userRole = formatRole(profile?.role || user?.role || '');

  const resolvedBreadcrumb: BreadcrumbSegment[] =
    breadcrumb && breadcrumb.length > 0
      ? breadcrumb
      : [
          { label: 'Workspace', href: '/dashboard' },
          { label: title },
        ];

  const viewAsSlot: ReactNode | undefined =
    viewAsSlotOverride === null
      ? undefined
      : viewAsSlotOverride !== undefined
        ? viewAsSlotOverride
        : <ViewAsSelector {...impersonation} />;

  const notificationsSlot: ReactNode | undefined =
    notificationsSlotOverride === null
      ? undefined
      : notificationsSlotOverride !== undefined
        ? notificationsSlotOverride
        : <NotificationsBell {...notifications} />;

  const handleSignOut = async () => {
    if (onSignOutOverride) {
      await onSignOutOverride();
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) showError('There was an issue signing out. Clearing session anyway.');
      clearAuthStorage();
      showSuccess('Logged out successfully');
      navigate('/login', { replace: true });
    } catch {
      showError('An unexpected error occurred during logout');
    }
  };

  const wrapperClass =
    contentClassName ?? 'max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10';

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg, #f4f4f5)' }}>
      <AppHeader
        breadcrumb={resolvedBreadcrumb}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        viewAsSlot={viewAsSlot}
        notificationsSlot={notificationsSlot}
        onSignOut={handleSignOut}
        onCmdKClick={onCmdKClick}
        onGlobalSearchClick={onGlobalSearchClick}
        unreadCount={unreadCount}
        onNotificationsClick={onNotificationsClick}
      />
      {isImpersonating && realUser && (
        <ImpersonationBanner role={userRole} email={userEmail} onExit={stopImpersonation} />
      )}
      <div data-testid={testId} className={cn(wrapperClass)}>
        <div className="mb-6 sm:mb-8">
          <PageTitle>{title}</PageTitle>
          {description && <PageDescription>{description}</PageDescription>}
        </div>
        {children}
      </div>
    </div>
  );
}
