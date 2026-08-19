/**
 * AppSidebarNav — the navigation BANDS, rendered identically by the >= lg rail
 * and the < lg drawer so the two lists can never drift.
 *
 * SHAPE (2026-08-18):
 *
 *   Overview                     ← the work queue; the app's home
 *   Customers                    ← the book
 *   Others ▸                     ← every TOOL, collapsed by default
 *     Prospect Profiler · Tax calculator · SRS planner · Legacy Map ·
 *     Client Report · Portfolio Report · …any other granted module
 *   ─────────────
 *   Account Settings             ← pinned to the bottom
 *
 * The previous shape listed every granted module permanently under a "More"
 * hairline, which made a rail of six-plus peers out of two destinations and a
 * toolbox. Collapsing the toolbox is the point: the two things an advisor
 * navigates BETWEEN stay at eye level, and the things they OPEN are one click
 * away without competing. The group auto-expands whenever the current route is
 * inside it, so the rail can never hide where you are.
 *
 * Source of truth: `useAuth().modules` for what is granted, `lib/toolRoutes`
 * for what the tool entries are called and where they point — no role strings
 * (.claude/rules/module-access.md). Modules NOT covered by a tool entry
 * (Results, CRM Dashboard, Manage Accounts, anything added later) fall into
 * "Others" automatically, so a new module row is never stranded.
 *
 * Row markup + class tokens live in `SidebarItem`; the disclosure lives in
 * `AppSidebarOthers`.
 */

import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarState } from '@/contexts/SidebarContext';
import { groupModulesByCategory, type DashboardModule } from '@/utils/dashboardHelpers';
import { visibleToolRoutes } from '@/lib/toolRoutes';
import { cn } from '@/lib/utils';
import { AppSidebarOthers, type NavEntry } from './AppSidebarOthers';
import { SidebarItem } from './SidebarItem';

export { FOCUS_RING } from './SidebarItem';

/** Always reachable (the `/dashboard` route carries no `modulePath` guard). */
export const HOME_PATH = '/dashboard';
const HOME_LABEL = 'Overview';

/**
 * The customer book. Rendered as the second primary item under its comp name
 * ("Customers") rather than whatever `modules.name` currently says, so the rail,
 * the list page title and the breadcrumb all read the same word.
 */
const CUSTOMERS_PATH = '/clients';
const CUSTOMERS_LABEL = 'Customers';

/** Pinned to the bottom of the rail — a destination you leave your work for. */
const SETTINGS_PATH = '/account-settings';
const SETTINGS_LABEL = 'Account Settings';

interface AppSidebarNavProps {
  /** Fired after any item is chosen — the drawer closes itself on it. */
  onNavigate?: () => void;
  /** Testid for the "Others" disclosure; distinct per home. */
  othersToggleTestId?: string;
  className?: string;
}

export function AppSidebarNav({ onNavigate, othersToggleTestId, className }: AppSidebarNavProps) {
  const { modules } = useAuth();
  const { openOthers } = useSidebarState();
  const { pathname } = useLocation();

  const hasCustomers = useMemo(
    () => modules.some((mod) => mod.path === CUSTOMERS_PATH),
    [modules],
  );
  const hasSettings = useMemo(() => modules.some((mod) => mod.path === SETTINGS_PATH), [modules]);

  /**
   * "Others" = the named tool entries the viewer holds, then every OTHER
   * granted module no band above has claimed. The second half is what keeps a
   * newly-registered module reachable without touching this file.
   */
  const others = useMemo<NavEntry[]>(() => {
    const tools = visibleToolRoutes(modules).map((tool) => ({
      path: tool.path,
      label: tool.label,
    }));
    const claimed = new Set<string>([
      HOME_PATH,
      CUSTOMERS_PATH,
      SETTINGS_PATH,
      ...tools.map((tool) => tool.path),
    ]);
    const rest = groupModulesByCategory(modules as DashboardModule[])
      .flatMap((category) => category.modules)
      .filter((mod) => !claimed.has(mod.path))
      .map((mod) => ({ path: mod.path, label: mod.name }));
    return [...tools, ...rest];
  }, [modules]);

  /**
   * The rail may never hide where you are: landing on a tool by URL, by ⌘K or
   * by a redirect from the old customer sub-route opens the group. Matching on
   * the path PREFIX rather than equality is deliberate — `/profiler-results/:id`
   * and `/tools/tax-calculator?customer=…` both belong to their entry.
   */
  const insideOthers = others.some(
    (entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`),
  );
  useEffect(() => {
    if (insideOthers) openOthers();
  }, [insideOthers, openOthers]);

  return (
    <nav
      aria-label="Primary"
      className={cn('flex min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-contain', className)}
    >
      <SidebarItem to={HOME_PATH} label={HOME_LABEL} end onNavigate={onNavigate} />
      {hasCustomers && (
        <SidebarItem to={CUSTOMERS_PATH} label={CUSTOMERS_LABEL} onNavigate={onNavigate} />
      )}

      <AppSidebarOthers
        entries={others}
        onNavigate={onNavigate}
        toggleTestId={othersToggleTestId}
      />

      {hasSettings && (
        // `mt-auto` pins this to the bottom of the nav's own box. The nav is the
        // rail's flex-1 scroller, so "bottom" means above the account footer,
        // which is where a settings destination belongs — reachable, never in
        // the path of the work.
        <div className="mt-auto pt-[18px]">
          <SidebarItem to={SETTINGS_PATH} label={SETTINGS_LABEL} onNavigate={onNavigate} />
        </div>
      )}
    </nav>
  );
}
