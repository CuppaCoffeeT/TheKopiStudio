/**
 * DetailPageFrame — the one-stop wrapper for heavyweight detail pages.
 *
 * Composes: AppHeader (breadcrumb + user menu + theme + impersonation slot)
 *         + ImpersonationBanner (when impersonating)
 *         + PageShell (hero + tabs + 2/3 main + 1/3 side-rail).
 *
 * Pages pass FLAT props — no nested slot-rendering required. Same auth/theme
 * plumbing as the legacy `DashboardHeader` shim, so all 71+ pages inherit
 * chrome fixes without per-page edits.
 *
 * Canonical usage (what every detail page looks like):
 *
 *   <DetailPageFrame
 *     breadcrumb={['Workspace', 'Projects', project.file_number]}
 *     title={`Project ${project.file_number} — ${project.name}`}
 *     recordId={`PRJ-${project.id.slice(0,6)}`}
 *     status={{ tone: 'success', label: 'ACTIVE' }}
 *     meta={['Singapore', `${workEntries.length} entries`, `Updated ${relativeTime}`]}
 *     actions={<><Button variant="ghost">Edit</Button><Button variant="primary">Log</Button></>}
 *     tabs={TABS}
 *     activeTab={tab}
 *     onTabChange={setTab}
 *     sideRail={<ContactsCard ... />}
 *   >
 *     {mainContent}
 *   </DetailPageFrame>
 *
 * If anything inside (AppHeader, PageShell, TabNav) changes its prop API,
 * ONLY this file updates. Zero page edits. That's the point.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-pageshell.html
 * Related: src/components/DashboardHeader.tsx (the list-page counterpart shim).
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorage } from '@/utils/authStorage';
import { showError, showSuccess } from '@/utils/toastHelper';
import {
  AppHeader,
  ImpersonationBanner,
  NotificationsBell,
  ViewAsSelector,
  type BreadcrumbSegment,
} from '@/components/primitives/shell';
import { useViewAs } from '@/hooks/useViewAs';
import { useNotificationsBell } from '@/hooks/useNotificationsBell';
import { cn } from '@/lib/utils';
import { PageShell, PageShellHero, type PageShellStatusTone, type PageShellActionBarBreakpoint } from './PageShell';
import { TabNav, type TabNavItem } from './TabNav';

type BreadcrumbInput = string | BreadcrumbSegment;

interface DetailPageFrameProps {
  /** Trail shown in AppHeader. Strings auto-convert to `BreadcrumbSegment`; last item gets no href. */
  breadcrumb: BreadcrumbInput[];
  /** Hero title. Use the current record label — e.g. `"Project 7463B — Penta-Ocean ATCC"`. */
  title: ReactNode;
  /** Monospace record ID chip under the title (e.g. `"PRJ-7463B"`). */
  recordId?: ReactNode;
  /** Status pill on the hero right. */
  status?: { tone?: PageShellStatusTone; label: ReactNode };
  /** Bullet-separated meta line, e.g. `['Singapore', 'Created 12 Apr', 'Updated 2h ago']`. */
  meta?: ReactNode[];
  /** Trailing action row (ghost + ghost + primary is canonical). */
  actions?: ReactNode;
  /** TabNav items. When provided, a sticky tab row renders below the hero. */
  tabs?: TabNavItem[];
  activeTab?: string;
  onTabChange?: (next: string) => void;
  /** Layout variant — default `withSideRail`. */
  variant?: 'withSideRail' | 'fullWidth';
  /** Right-column side-rail content. Ignored when `variant='fullWidth'`. */
  sideRail?: ReactNode;
  /** Override aside width classes. Default = locked 300px; pass `md:w-auto` when the rail is collapsible and should size to its content. */
  sideRailClassName?: string;
  /** Sticky bottom action bar on mobile (primary + destructive). */
  mobileActionBar?: ReactNode;
  /** Breakpoint below which the mobile action bar is visible. Default `md`; pass `lg` when the body collapses to one column at < lg (so the bottom bar shows on tablet too). */
  actionBarBreakpoint?: PageShellActionBarBreakpoint;
  /** Main content — the page body. */
  children: ReactNode;
  className?: string;
  /** Forwarded to the outermost wrapper div for Playwright targeting. */
  testId?: string;
}

// Locked: NO back button. Back navigation goes through the breadcrumb in AppHeader.
// Adding `backPath` / `backLabel` props here is forbidden per anti-patterns.md.

const formatRole = (role: string) =>
  role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

function normalizeBreadcrumb(input: BreadcrumbInput[]): BreadcrumbSegment[] {
  return input.map((b, i) => {
    if (typeof b === 'string') {
      // Last segment gets no href (current record)
      return i === input.length - 1 ? { label: b } : { label: b, href: '#' };
    }
    return b;
  });
}

export function DetailPageFrame({
  breadcrumb,
  title,
  recordId,
  status,
  meta,
  actions,
  tabs,
  activeTab,
  onTabChange,
  variant = 'withSideRail',
  sideRail,
  sideRailClassName,
  mobileActionBar,
  actionBarBreakpoint = 'md',
  children,
  className,
  testId,
}: DetailPageFrameProps) {
  const navigate = useNavigate();
  const { user, profile, isImpersonating, realUser, stopImpersonation } = useAuth();
  const impersonation = useViewAs();
  const notifications = useNotificationsBell();

  const userName = profile?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = profile?.email || user?.email || '';
  const userRoleRaw = profile?.role || user?.role || '';
  const userRole = formatRole(userRoleRaw);

  const segments = normalizeBreadcrumb(breadcrumb);

  const handleSignOut = async () => {
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

  const heroBlock = (
    <PageShellHero
      title={title}
      recordId={recordId}
      statusTone={status?.tone ?? 'neutral'}
      statusLabel={status?.label}
      meta={meta}
      actions={actions}
      actionBarBreakpoint={actionBarBreakpoint}
    />
  );

  const tabsBlock = tabs && tabs.length > 0 ? (
    <TabNav tabs={tabs} value={activeTab ?? tabs[0]?.value ?? ''} onChange={onTabChange} sticky />
  ) : undefined;

  return (
    <div
      className={cn('min-h-screen', className)}
      style={{ background: 'var(--page-bg, #f0e6d6)' }}
      data-testid={testId}
    >
      <AppHeader
        breadcrumb={segments}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        viewAsSlot={<ViewAsSelector {...impersonation} />}
        notificationsSlot={<NotificationsBell {...notifications} />}
        onSignOut={handleSignOut}
      />

      {isImpersonating && realUser && (
        <ImpersonationBanner
          role={userRole}
          email={userEmail}
          onExit={stopImpersonation}
        />
      )}

      <PageShell
        variant={variant}
        hero={heroBlock}
        tabs={tabsBlock}
        main={children}
        sideRail={sideRail}
        sideRailClassName={sideRailClassName}
        mobileActionBar={mobileActionBar}
        actionBarBreakpoint={actionBarBreakpoint}
      />
    </div>
  );
}

export type { DetailPageFrameProps };
