/**
 * DetailPageFrame — the one-stop wrapper for heavyweight detail pages.
 *
 * Composes: AppHeaderMobileBar (< lg chrome; >= lg the AppSidebar rail is all
 *           the chrome there is)
 *         + ImpersonationBanner (when impersonating)
 *         + PageShell (breadcrumb + hero + tabs + 2/3 main + 1/3 side-rail).
 *
 * 2026-07-25 (2a "Kopi House"): the top bar is retired, so the breadcrumb moved
 * from chrome into the content column — quiet inline text above the H1, exactly
 * as the 2a Detail comp draws it ("Clients / Marcus Tan"). The `breadcrumb`
 * prop API is unchanged; no page needed editing.
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
 * If anything inside (AppHeaderMobileBar, PageShell, TabNav) changes its prop
 * API, ONLY this file updates. Zero page edits. That's the point — the masthead
 * retirement itself cost no page a single line.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-pageshell.html
 * Related: src/components/DashboardHeader.tsx (the list-page counterpart shim).
 */

import type { ReactNode } from 'react';
import {
  AppHeaderMobileBar,
  Breadcrumb,
  ImpersonationBanner,
  ViewAsSelector,
  type BreadcrumbSegment,
} from '@/components/primitives/shell';
import { useDashboardChrome } from '@/hooks/useDashboardChrome';
import { cn } from '@/lib/utils';
import { PageShell, PageShellHero, type PageShellStatusTone, type PageShellActionBarBreakpoint } from './PageShell';
import { TabNav, type TabNavItem } from './TabNav';

type BreadcrumbInput = string | BreadcrumbSegment;

interface DetailPageFrameProps {
  /** Trail rendered inline above the hero title (and used as the mobile bar's page label).
   *  Strings auto-convert to `BreadcrumbSegment`; last item gets no href. */
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

// Locked: NO back button. Back navigation goes through the inline breadcrumb.
// Adding `backPath` / `backLabel` props here is forbidden per anti-patterns.md.

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
  const chrome = useDashboardChrome();
  const segments = normalizeBreadcrumb(breadcrumb);

  const heroBlock = (
    <PageShellHero
      breadcrumb={<Breadcrumb segments={segments} />}
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
      <AppHeaderMobileBar
        breadcrumb={segments}
        {...chrome.user}
        viewAsSlot={<ViewAsSelector {...chrome.viewAs} />}
        onSignOut={chrome.onSignOut}
      />

      {chrome.impersonation.active && <ImpersonationBanner {...chrome.impersonation.props} />}

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
