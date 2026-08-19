/**
 * AppSidebarNav — the navigation BANDS, rendered identically by the >= lg rail
 * and the < lg drawer so the two lists can never drift.
 *
 * SHAPE (2026-08-19):
 *
 *   Overview                     ← the work queue; the app's home
 *   Customers                    ← the book
 *   TOOLS                        ← every tool, listed, never collapsed
 *     Prospect Profiler · Tax calculator · SRS planner · Legacy Map ·
 *     Client Report
 *   Others ▸                     ← only what no band above claimed
 *   ─────────────
 *   Account Settings             ← pinned to the bottom
 *
 * Two destinations stay at eye level; the toolbox sits under its own heading
 * below them, spelled out. 2026-08-18 had collapsed the tools into "Others" on
 * the argument that a rail of six-plus peers buries the two destinations — the
 * heading is what settles that instead: the tools are visibly a GROUP rather
 * than five more peers, so they can be read without being opened. "Others"
 * survives as the catch-all and still auto-expands when the route is inside it,
 * so the rail can never hide where you are.
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

import { useEffect, useId, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarState } from '@/contexts/SidebarContext';
import { groupModulesByCategory, type DashboardModule } from '@/utils/dashboardHelpers';
import { visibleToolRoutes } from '@/lib/toolRoutes';
import { cn } from '@/lib/utils';
import { AppSidebarOthers, type NavEntry } from './AppSidebarOthers';
import { BAND_LABEL, SidebarItem } from './SidebarItem';

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
  /** Per-instance — this nav is mounted TWICE below lg (the rail is hidden,
   *  not unmounted, while the drawer is open), and a hard-coded id would be
   *  duplicated in the document. */
  const toolsLabelId = useId();

  const hasCustomers = useMemo(
    () => modules.some((mod) => mod.path === CUSTOMERS_PATH),
    [modules],
  );
  const hasSettings = useMemo(() => modules.some((mod) => mod.path === SETTINGS_PATH), [modules]);

  /** The named tools this viewer holds, in `toolRoutes` order. */
  const tools = useMemo<NavEntry[]>(
    () => visibleToolRoutes(modules).map((tool) => ({ path: tool.path, label: tool.label })),
    [modules],
  );

  /**
   * "Others" = every granted module no band above has claimed. This is what
   * keeps a newly-registered module reachable without touching this file.
   */
  const others = useMemo<NavEntry[]>(() => {
    const claimed = new Set<string>([
      HOME_PATH,
      CUSTOMERS_PATH,
      SETTINGS_PATH,
      ...tools.map((tool) => tool.path),
    ]);
    return groupModulesByCategory(modules as DashboardModule[])
      .flatMap((category) => category.modules)
      .filter((mod) => !claimed.has(mod.path))
      .map((mod) => ({ path: mod.path, label: mod.name }));
  }, [modules, tools]);

  /**
   * The rail may never hide where you are: landing on a collapsed module by URL
   * or by ⌘K opens the group. Matching on the path PREFIX rather than equality
   * is deliberate — `/profiler-results/:id` belongs to its entry. (The tools no
   * longer need this: their band is always open.)
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

      {tools.length > 0 && (
        // A labelled group, not a bare run of links: the heading is what lets
        // five tools sit open under two destinations without reading as seven
        // peers, and `aria-labelledby` gives a screen reader the same grouping
        // the eye gets. The heading is static — there is nothing to toggle.
        <div
          role="group"
          aria-labelledby={toolsLabelId}
          className="mt-[18px] flex flex-col gap-0.5"
        >
          <p id={toolsLabelId} className={BAND_LABEL}>
            Tools
          </p>
          {tools.map((tool) => (
            <SidebarItem
              key={tool.path}
              to={tool.path}
              label={tool.label}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </div>
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
