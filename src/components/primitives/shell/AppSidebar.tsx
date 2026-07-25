/**
 * AppSidebar — the 2a "Kopi House" primary navigation rail.
 *
 * 200px fixed rail carrying the wordmark, one nav item per granted module, and
 * — since the top masthead was retired (2026-07-25) — the account footer.
 * Mounted once by `shared/app-shell/DashboardLayout`. It is the ONLY chrome on
 * desktop: identity, navigation and account all live here, which is what leaves
 * the content column as clean as the 2a comps draw it.
 *
 * Nav source of truth: `useAuth().modules` run through `groupModulesByCategory`
 * — the same pair `GlobalCommandPalette` uses — so the rail and ⌘K can never
 * disagree about which modules a user holds. No role strings anywhere
 * (.claude/rules/module-access.md). `/dashboard` is filtered out of the module
 * list because it is rendered explicitly as the "Overview" item, exactly as
 * `DashboardHomePage` filters it out of the launcher grid.
 *
 * Surface: the rail is one step LIGHTER than the page (`--sidebar-background`
 * == card cream `#FAF6EE`), per the 2a comp and KOPI_2A_SPEC → "Layout
 * language". That surface is load-bearing, not decorative: idle items are
 * `--fg-muted` `#7D6B5B`, which clears AA on card cream (4.72) and FAILS on the
 * page cream (4.12) — see the spec's "Open item — muted on page".
 *
 * Responsive: >= lg (1024px) only. Below that the rail is hidden and
 * `AppHeaderMobileBar` serves navigation + account — no second drawer is built.
 *
 * Print: excluded twice over — Tailwind's `print:` variant plus the `.no-print`
 * class that `features/crm/lib/report-print.css` owns — so `/clients/:id/report`
 * prints unchanged.
 */

import { useMemo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/utils/queryKeys';
import { groupModulesByCategory, type DashboardModule } from '@/utils/dashboardHelpers';
import { cn } from '@/lib/utils';
import { AppSidebarFooter } from './AppSidebarFooter';
import { Wordmark } from './Wordmark';

/**
 * Rail width, as the two literal Tailwind classes it produces — Tailwind scans
 * source text, so it can never be computed. Change both together.
 * `SIDEBAR_OFFSET_CLASS` is DashboardLayout's padding on the content pane.
 */
const SIDEBAR_WIDTH_CLASS = 'w-[200px]';
export const SIDEBAR_OFFSET_CLASS = 'lg:pl-[200px]';

/** Always reachable (the `/dashboard` route carries no `modulePath` guard). */
const HOME_PATH = '/dashboard';
const HOME_LABEL = 'Overview';

/** Visible brown focus ring, inset by design — an outer ring collides with the
 *  rail's right hairline (KOPI_2A_SPEC → "Sidebar items"). */
const FOCUS_RING = cn(
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
}

/** All five comp states: idle · hover · pressed · focus · current. Hover text
 *  takes `--brown-text`, not raw brand brown — 13px is under the AA threshold. */
function SidebarItem({ to, label, end }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
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

export function AppSidebar() {
  const { user, loading, modules } = useAuth();

  const navModules = useMemo(
    () =>
      groupModulesByCategory(modules as DashboardModule[])
        .flatMap((category) => category.modules)
        .filter((mod) => mod.path !== HOME_PATH),
    [modules],
  );

  const grantedPaths = useMemo(() => new Set(modules.map((mod) => mod.path)), [modules]);
  const ungrantedCount = useUngrantedModuleCount(grantedPaths, Boolean(user) && !loading);

  // No rail while auth resolves or on the signed-out flash before ProtectedRoute
  // redirects — an empty rail reads as "you have no modules".
  if (loading || !user) return null;

  return (
    <aside
      data-testid="app-sidebar"
      className={cn(
        'no-print print:hidden',
        'fixed inset-y-0 left-0 z-40 hidden lg:flex lg:flex-col',
        SIDEBAR_WIDTH_CLASS,
        'overflow-hidden border-r border-sidebar-border bg-sidebar py-[22px]',
      )}
    >
      <Link
        to={HOME_PATH}
        aria-label="The Kopi Studio — Home"
        className={cn('block flex-none px-[22px] pb-[18px] text-sidebar-foreground', FOCUS_RING)}
      >
        {/* Shared lockup — the mobile bar and the public /profiler chrome render
            the same component, so the three identity surfaces cannot drift. */}
        <Wordmark className="block text-[22px] leading-[1.15]" />
      </Link>

      {/* The nav is the only scroller — the footer stays pinned to the rail's
          bottom edge however long the module list gets. */}
      <nav
        aria-label="Primary"
        className="flex min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-contain"
      >
        <SidebarItem to={HOME_PATH} label={HOME_LABEL} end />
        {navModules.map((mod) => (
          <SidebarItem key={mod.path} to={mod.path} label={mod.name} />
        ))}

        {ungrantedCount > 0 && (
          <p className="border-l-2 border-l-transparent px-[22px] py-[9px] text-[13px] text-muted-foreground">
            {`+ ${ungrantedCount} module${ungrantedCount === 1 ? '' : 's'} soon`}
          </p>
        )}
      </nav>

      <AppSidebarFooter />
    </aside>
  );
}
