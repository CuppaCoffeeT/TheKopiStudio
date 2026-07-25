/**
 * AppHeaderShell — page-shell wrapper for tool / dashboard / settings pages:
 * page-bg backdrop + ImpersonationBanner + content frame + PageTitle /
 * PageDescription block.
 *
 * 2026-07-25 (2a "Kopi House"): the horizontal masthead it was named after is
 * gone. `AppSidebar` is the whole chrome at >= lg — including the account
 * footer that now owns the bell, ViewAs and sign-out — and `AppHeaderMobileBar`
 * stands in below that. The name is kept: every tool page imports it and the
 * prop API is unchanged for all props that still have somewhere to go.
 *
 * Breadcrumb is CONTENT now, not chrome — quiet inline text above the H1, per
 * the 2a Detail comp. It renders ONLY when a page passes one explicitly: the
 * two-segment default (`Workspace / <title>`) would just repeat the H1 sitting
 * directly beneath it, and no 2a comp puts a crumb over a dashboard or list.
 *
 * Sibling to: AppHeaderMobileBar (the < lg bar) · AppSidebar (the >= lg rail).
 * NOT a replacement for: DetailPageFrame · ListPageFrame.
 * IS a replacement for: per-feature <XPageShell> wrappers (Payment, Comms,
 *                       Xero, Payslip inline) and ad-hoc inline chrome
 *                       compositions in tool/dashboard/settings pages.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useDashboardChrome } from '@/hooks/useDashboardChrome';
import { AppHeaderMobileBar } from './AppHeaderMobileBar';
import { Breadcrumb, type BreadcrumbSegment } from './Breadcrumb';
import { ImpersonationBanner } from './ImpersonationBanner';
import { PageTitle } from './PageTitle';
import { PageDescription } from './PageDescription';
import { ViewAsSelector } from './ViewAsSelector';

export interface AppHeaderShellProps {
  /** Page H1 text — rendered inside the standard PageTitle block. */
  title: string;
  /** Optional sub-headline rendered inside PageDescription beneath PageTitle. */
  description?: string;
  /** Page content. */
  children: ReactNode;

  /**
   * Optional breadcrumb. Passing one renders it inline above the H1 and labels
   * the mobile bar. Omitting it falls back to
   * `[{ label: 'Workspace', href: '/dashboard' }, { label: title }]` for the
   * mobile bar only — nothing inline, since that just repeats the H1.
   */
  breadcrumb?: BreadcrumbSegment[];

  /**
   * Override the impersonation control folded into the mobile account menu.
   * - `null` = explicitly hide for super_admin
   * - `ReactNode` = replace with a custom node
   * - `undefined` (default) = render `<ViewAsSelector {...chrome.viewAs} />`
   *   (the primitive self-guards on non-super_admin, so the slot collapses for non-admins)
   */
  viewAsSlotOverride?: ReactNode | null;

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

  /** Forwarded to the mobile bar: search trigger. Default-wired there to open
   *  the ⌘K module palette; pass `null` to hide the button. */
  onGlobalSearchClick?: (() => void) | null;
  /** Forwarded to the mobile bar: notifications unread count for the account menu. */
  unreadCount?: number;
  /** Forwarded to the mobile bar: notifications click handler for the account menu. */
  onNotificationsClick?: () => void;
}

export function AppHeaderShell({
  title,
  description,
  children,
  breadcrumb,
  viewAsSlotOverride,
  onSignOutOverride,
  contentClassName,
  testId,
  onGlobalSearchClick,
  unreadCount,
  onNotificationsClick,
}: AppHeaderShellProps) {
  const chrome = useDashboardChrome();

  const hasInlineBreadcrumb = Boolean(breadcrumb && breadcrumb.length > 0);
  const barBreadcrumb: BreadcrumbSegment[] =
    breadcrumb && breadcrumb.length > 0
      ? breadcrumb
      : [{ label: 'Workspace', href: '/dashboard' }, { label: title }];

  const viewAsSlot: ReactNode | undefined =
    viewAsSlotOverride === null
      ? undefined
      : viewAsSlotOverride !== undefined
        ? viewAsSlotOverride
        : <ViewAsSelector {...chrome.viewAs} />;

  const handleSignOut = async () => {
    if (onSignOutOverride) {
      await onSignOutOverride();
      return;
    }
    await chrome.onSignOut();
  };

  const wrapperClass =
    contentClassName ?? 'max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10';

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg, #f0e6d6)' }}>
      <AppHeaderMobileBar
        breadcrumb={barBreadcrumb}
        {...chrome.user}
        viewAsSlot={viewAsSlot}
        onSignOut={handleSignOut}
        onGlobalSearchClick={onGlobalSearchClick}
        unreadCount={unreadCount}
        onNotificationsClick={onNotificationsClick}
      />
      {chrome.impersonation.active && <ImpersonationBanner {...chrome.impersonation.props} />}
      <div data-testid={testId} className={cn(wrapperClass)}>
        <div className="mb-6 sm:mb-8">
          {hasInlineBreadcrumb && <Breadcrumb segments={barBreadcrumb} className="mb-4" />}
          <PageTitle>{title}</PageTitle>
          {description && <PageDescription>{description}</PageDescription>}
        </div>
        {children}
      </div>
    </div>
  );
}
