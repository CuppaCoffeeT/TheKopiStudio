/**
 * AppSidebarNav — the module list itself, extracted from `AppSidebar` so the
 * >= lg rail and the < lg nav drawer render the SAME items from the SAME
 * source. Split out 2026-08-13, when the drawer was added: two hand-kept copies
 * of this list would drift the moment a module is added, exactly the failure
 * the rail/⌘K shared `groupModulesByCategory` call was written to prevent.
 *
 * Source of truth: `useAuth().modules` — no role strings anywhere
 * (.claude/rules/module-access.md). `/dashboard` is filtered out of the module
 * list because it is rendered explicitly as the "Overview" item.
 *
 * Colour note: idle items are `--fg-muted` `#7D6B5B`, which clears AA on card
 * cream (4.72) and FAILS on page cream (4.12). Both homes paint card cream
 * (`bg-sidebar`) behind this list — a future home on the page ground must
 * re-measure rather than reuse (see KOPI_2A_SPEC → "Open item — muted on page").
 */

import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/utils/queryKeys';
import { groupModulesByCategory, type DashboardModule } from '@/utils/dashboardHelpers';
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

interface SidebarItemProps {
  to: string;
  label: string;
  /** Exact match only — used by Overview so every child route doesn't light it. */
  end?: boolean;
  onNavigate?: () => void;
}

/** All five comp states: idle · hover · pressed · focus · current. Hover text
 *  takes `--brown-text`, not raw brand brown — 13px is under the AA threshold. */
function SidebarItem({ to, label, end, onNavigate }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          ITEM_BASE,
          FOCUS_RING,
          isActive
            ? 'border-l-sidebar-primary bg-[color:var(--surface-subtle)] font-semibold text-sidebar-foreground'
            : cn(
                'border-l-transparent text-muted-foreground',
                'hover:bg-[color:var(--surface-subtle)] hover:text-[color:var(--brown-text)]',
                'active:bg-[color:var(--tint-pressed)]',
              ),
        )
      }
    >
      {label}
    </NavLink>
  );
}

/**
 * Count of modules that exist and are active but that this user has NOT been
 * granted — the honest form of the comp's "+ 3 modules soon" line (PRD resolved
 * decision #5). `/dashboard` is excluded from both sides: every authenticated
 * user can reach it whether or not a grant row exists.
 *
 * Returns 0 until the list resolves, so the affordance never flashes a wrong
 * number and renders nothing at all when the user already holds everything.
 */
function useUngrantedModuleCount(grantedPaths: Set<string>, enabled: boolean): number {
  const { data } = useQuery({
    queryKey: queryKeys.modules.list({ isActive: true, select: 'path' }),
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('modules')
        .select('path')
        .eq('is_active', true)
        .limit(5000);
      if (error) throw error;
      return (rows ?? []).map((row) => row.path);
    },
  });

  return useMemo(
    () => (data ?? []).filter((path) => path !== HOME_PATH && !grantedPaths.has(path)).length,
    [data, grantedPaths],
  );
}

interface AppSidebarNavProps {
  /** Fired after any item is chosen — the drawer closes itself on it. */
  onNavigate?: () => void;
  /**
   * Testid for the "More" divider. The rail claims `app-sidebar-more-heading`;
   * the drawer passes its own, because below lg the rail is `hidden` (present
   * in the DOM, just `display:none`) and an unscoped `getByTestId` would find
   * both copies and trip Playwright's strict mode.
   */
  moreHeadingTestId?: string;
  className?: string;
}

export function AppSidebarNav({ onNavigate, moreHeadingTestId, className }: AppSidebarNavProps) {
  const { user, loading, modules } = useAuth();

  /** Does the viewer hold the customer book? Drives the second primary item. */
  const hasCustomers = useMemo(
    () => modules.some((mod) => mod.path === CUSTOMERS_PATH),
    [modules],
  );

  /**
   * Everything granted that is NOT one of the two primary destinations —
   * demoted under the "More" divider. `/dashboard` is excluded because it is
   * rendered explicitly above, exactly as it always was.
   */
  const secondaryModules = useMemo(
    () =>
      groupModulesByCategory(modules as DashboardModule[])
        .flatMap((category) => category.modules)
        .filter((mod) => mod.path !== HOME_PATH && mod.path !== CUSTOMERS_PATH),
    [modules],
  );

  const grantedPaths = useMemo(() => new Set(modules.map((mod) => mod.path)), [modules]);
  const ungrantedCount = useUngrantedModuleCount(grantedPaths, Boolean(user) && !loading);

  return (
    <nav
      aria-label="Primary"
      className={cn('flex min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-contain', className)}
    >
      <SidebarItem to={HOME_PATH} label={HOME_LABEL} end onNavigate={onNavigate} />
      {hasCustomers && (
        <SidebarItem to={CUSTOMERS_PATH} label={CUSTOMERS_LABEL} onNavigate={onNavigate} />
      )}

      {secondaryModules.length > 0 && (
        <p
          className="mx-[22px] mb-1 mt-[18px] border-t border-sidebar-border pt-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          data-testid={moreHeadingTestId}
        >
          More
        </p>
      )}
      {secondaryModules.map((mod) => (
        <SidebarItem key={mod.path} to={mod.path} label={mod.name} onNavigate={onNavigate} />
      ))}

      {ungrantedCount > 0 && (
        <p className="border-l-2 border-l-transparent px-[22px] py-[9px] text-[13px] text-muted-foreground">
          {`+ ${ungrantedCount} module${ungrantedCount === 1 ? '' : 's'} soon`}
        </p>
      )}
    </nav>
  );
}
