/**
 * AppSidebarNav — the navigation list itself, extracted from `AppSidebar` so
 * the >= lg rail and the < lg nav drawer render the SAME items from the SAME
 * source. Split out 2026-08-13, when the drawer was added: two hand-kept copies
 * of this list would drift the moment a module is added, exactly the failure
 * the rail/⌘K shared `groupModulesByCategory` call was written to prevent.
 *
 * SHAPE (2026-08-18): three bands, not one flat list.
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
 * toolbox. Collapsing the toolbox is the whole point: the two things an advisor
 * navigates BETWEEN stay at eye level, and the things they OPEN are one click
 * away without competing for attention. The group auto-expands whenever the
 * current route is inside it, so the rail can never hide where you are.
 *
 * Source of truth: `useAuth().modules` for what is granted, `lib/toolRoutes`
 * for what the tool entries are called and where they point — no role strings
 * anywhere (.claude/rules/module-access.md). Modules NOT covered by a tool
 * entry (Results, CRM Dashboard, Manage Accounts, anything added later) fall
 * into "Others" automatically, so a new module row is never stranded.
 *
 * Colour note: idle items are `--fg-muted` `#7D6B5B`, which clears AA on card
 * cream (4.72) and FAILS on page cream (4.12). Both homes paint card cream
 * (`bg-sidebar`) behind this list — a future home on the page ground must
 * re-measure rather than reuse (see KOPI_2A_SPEC → "Open item — muted on page").
 */

import { useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarState } from '@/contexts/SidebarContext';
import { groupModulesByCategory, type DashboardModule } from '@/utils/dashboardHelpers';
import { visibleToolRoutes } from '@/lib/toolRoutes';
import { cn } from '@/lib/utils';

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

/** Visible brown focus ring, inset by design — an outer ring collides with the
 *  rail's right hairline (KOPI_2A_SPEC → "Sidebar items"). */
export const FOCUS_RING = cn(
  'focus-visible:outline-2 focus-visible:outline-[color:hsl(var(--sidebar-ring))]',
  'focus-visible:outline-offset-[-2px]',
);

/**
 * Shared item box. `border-l-2` sits on every item — including idle ones — so
 * nothing shifts horizontally when the active marker appears.
 * `pointer-coarse:min-h-11` lifts the 36px comp row to the 44px touch floor on
 * coarse pointers (.claude/rules/mobile-web.md §5).
 */
const ITEM_BASE = cn(
  'flex items-center border-l-2 px-[22px] py-[9px] text-[13px] leading-[1.4]',
  'transition-colors pointer-coarse:min-h-11',
);

const IDLE = cn(
  'border-l-transparent text-muted-foreground',
  'hover:bg-[color:var(--surface-subtle)] hover:text-[color:var(--brown-text)]',
  'active:bg-[color:var(--tint-pressed)]',
);

const ACTIVE = 'border-l-sidebar-primary bg-[color:var(--surface-subtle)] font-semibold text-sidebar-foreground';

interface SidebarItemProps {
  to: string;
  label: string;
  /** Exact match only — used by Overview so every child route doesn't light it. */
  end?: boolean;
  /** Tool entries sit one step in from their group heading. */
  nested?: boolean;
  onNavigate?: () => void;
}

/** All five comp states: idle · hover · pressed · focus · current. Hover text
 *  takes `--brown-text`, not raw brand brown — 13px is under the AA threshold. */
function SidebarItem({ to, label, end, nested, onNavigate }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(ITEM_BASE, FOCUS_RING, nested && 'pl-[34px]', isActive ? ACTIVE : IDLE)
      }
    >
      {label}
    </NavLink>
  );
}

/** One entry in the collapsed "Others" group. */
interface NavEntry {
  path: string;
  label: string;
}

interface AppSidebarNavProps {
  /** Fired after any item is chosen — the drawer closes itself on it. */
  onNavigate?: () => void;
  /**
   * Testid for the "Others" disclosure. The rail claims
   * `app-sidebar-others-toggle`; the drawer passes its own, because below lg
   * the rail is `hidden` (present in the DOM, just `display:none`) and an
   * unscoped `getByTestId` would find both copies and trip Playwright's strict
   * mode.
   */
  othersToggleTestId?: string;
  className?: string;
}

export function AppSidebarNav({ onNavigate, othersToggleTestId, className }: AppSidebarNavProps) {
  const { modules } = useAuth();
  const { othersOpen, toggleOthers, openOthers } = useSidebarState();
  const { pathname } = useLocation();

  const hasCustomers = useMemo(
    () => modules.some((mod) => mod.path === CUSTOMERS_PATH),
    [modules],
  );
  const hasSettings = useMemo(() => modules.some((mod) => mod.path === SETTINGS_PATH), [modules]);

  /**
   * "Others" = the named tool entries the viewer holds, then every OTHER
   * granted module that no band above has already claimed. The second half is
   * what keeps a newly-registered module reachable without touching this file.
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

      {others.length > 0 && (
        <>
          <button
            type="button"
            onClick={toggleOthers}
            aria-expanded={othersOpen}
            aria-controls="app-sidebar-others"
            data-testid={othersToggleTestId}
            className={cn(
              ITEM_BASE,
              FOCUS_RING,
              IDLE,
              'mt-[18px] w-full justify-between gap-2 text-left',
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">Others</span>
            <ChevronRight
              aria-hidden="true"
              className={cn(
                'h-3.5 w-3.5 flex-none transition-transform',
                othersOpen && 'rotate-90',
              )}
            />
          </button>

          {/* Kept mounted-when-open rather than hidden-when-closed: a collapsed
              group must not hold focusable links a keyboard can tab into. */}
          {othersOpen && (
            <div id="app-sidebar-others" className="flex flex-col gap-0.5">
              {others.map((entry) => (
                <SidebarItem
                  key={entry.path}
                  to={entry.path}
                  label={entry.label}
                  nested
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </>
      )}

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
