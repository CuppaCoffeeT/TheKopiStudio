/**
 * AppSidebar — the 2a "Kopi House" primary navigation rail.
 *
 * 200px fixed rail carrying the wordmark, the nav, and — since the top masthead
 * was retired (2026-07-25) — the account footer. Mounted once by
 * `shared/app-shell/DashboardLayout`. It is the ONLY chrome on desktop:
 * identity, navigation and account all live here, which is what leaves the
 * content column as clean as the 2a comps draw it.
 *
 * CUSTOMER-CENTRED IA (2026-07-28, Kopi Studio Directions turn 3a): the rail
 * leads with exactly two destinations — **Overview** and **Customers**. The
 * comp's argument is that the tools are not places: the profiler, the customer
 * information form and the client report are things you do TO a customer, and
 * they are launched from the customer record (`CustomerToolLauncher`), not from
 * navigation. Promoting them to peers of the book is what made the old rail
 * read as a toolbox rather than a workflow.
 *
 * DELIBERATE DEVIATION from the comp: the comp shows only those two items (plus
 * a manager destination). This rail keeps every OTHER granted module reachable
 * under a hairline + muted "More" heading rather than dropping it. Saved
 * profiler results can exist with no customer attached — the public `/profiler`
 * wizard creates exactly that — so deleting `/profiler-results` from the rail
 * would strand real records behind a URL. Demoting expresses the comp's
 * hierarchy claim without losing anything.
 *
 * Nav source of truth: `useAuth().modules` run through `groupModulesByCategory`
 * — the same pair `GlobalCommandPalette` uses — so the rail and ⌘K can never
 * disagree about which modules a user holds. No role strings anywhere
 * (.claude/rules/module-access.md): the two primary items are rendered from the
 * SAME granted-module list, just pulled to the front, so a viewer who does not
 * hold `/clients` simply does not see Customers.
 *
 * Surface: the rail is one step LIGHTER than the page (`--sidebar-background`
 * == card cream `#FAF6EE`), per the 2a comp and KOPI_2A_SPEC → "Layout
 * language". That surface is load-bearing, not decorative: idle items are
 * `--fg-muted` `#7D6B5B`, which clears AA on card cream (4.72) and FAILS on the
 * page cream (4.12) — see the spec's "Open item — muted on page".
 *
 * Responsive: >= lg (1024px) only. Below that the rail is hidden and
 * `AppHeaderMobileBar` serves account + page context, with `AppNavDrawer` — the
 * same `AppSidebarNav` list, slid in from its menu button — serving navigation.
 * (The original 2a note here said "no second drawer is built"; that held only
 * while ⌘K was a hotkey. It was removed 2026-08-05, leaving touch users with no
 * visible way to change module, so the drawer was built on 2026-08-13.)
 *
 * Print: excluded twice over — Tailwind's `print:` variant plus the `.no-print`
 * class that `features/crm/lib/report-print.css` owns — so `/clients/:id/report`
 * prints unchanged.
 */

import { Link } from 'react-router-dom';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarState } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { AppSidebarFooter } from './AppSidebarFooter';
import { AppSidebarNav, FOCUS_RING, HOME_PATH } from './AppSidebarNav';
import { Wordmark } from './Wordmark';

/**
 * Rail width, as the two literal Tailwind classes it produces — Tailwind scans
 * source text, so it can never be computed. Change both together.
 * `SIDEBAR_OFFSET_CLASS` is DashboardLayout's padding on the content pane.
 */
const SIDEBAR_WIDTH_CLASS = 'w-[200px]';
export const SIDEBAR_OFFSET_CLASS = 'lg:pl-[200px]';

/** Chrome-button box shared by the rail's collapse control and the floating
 *  re-open control, so the two read as one affordance in two positions. */
const CHROME_BUTTON = cn(
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground',
  'hover:bg-[color:var(--surface-subtle)] hover:text-[color:var(--brown-text)]',
  'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
  FOCUS_RING,
);

export function AppSidebar() {
  const { user, loading } = useAuth();
  const { railHidden, toggleRail } = useSidebarState();

  // No rail while auth resolves or on the signed-out flash before ProtectedRoute
  // redirects — an empty rail reads as "you have no modules".
  if (loading || !user) return null;

  /**
   * Collapsed: the rail unmounts and leaves one floating control behind. It has
   * to be `lg:` too — below that breakpoint the rail was never showing and the
   * mobile bar's own menu button already owns this job, so a second floating
   * hamburger would sit on top of the page for no reason.
   */
  if (railHidden) {
    return (
      <button
        type="button"
        onClick={toggleRail}
        aria-label="Show navigation"
        aria-expanded={false}
        data-testid="app-sidebar-show"
        className={cn(
          'no-print print:hidden',
          'fixed left-3 top-3 z-40 hidden lg:inline-flex',
          'border border-sidebar-border bg-sidebar shadow-sm',
          CHROME_BUTTON,
        )}
      >
        <PanelLeft className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

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
      <div className="flex flex-none items-start justify-between gap-1 px-[22px] pb-[18px]">
        <Link
          to={HOME_PATH}
          aria-label="The Kopi Studio — Home"
          className={cn('block min-w-0 text-sidebar-foreground', FOCUS_RING)}
        >
          {/* Shared lockup — the mobile bar and the public /profiler chrome render
              the same component, so the three identity surfaces cannot drift. */}
          <Wordmark className="block text-[22px] leading-[1.15]" />
        </Link>

        {/* Hide the rail. iPad landscape and every desktop width get this; iPad
            portrait and phones are below `lg`, where `AppHeaderMobileBar`'s
            menu button already opens `AppNavDrawer` — the behaviour the brief
            asks to keep unchanged there. */}
        <button
          type="button"
          onClick={toggleRail}
          aria-label="Hide navigation"
          aria-expanded
          data-testid="app-sidebar-hide"
          className={cn('-mr-1.5 flex-none', CHROME_BUTTON)}
        >
          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* The nav is the only scroller — the footer stays pinned to the rail's
          bottom edge however long the module list gets. Shared with the < lg
          drawer (`AppNavDrawer`) so the two lists cannot drift. */}
      <AppSidebarNav othersToggleTestId="app-sidebar-others-toggle" className="flex-1" />

      <AppSidebarFooter />
    </aside>
  );
}
