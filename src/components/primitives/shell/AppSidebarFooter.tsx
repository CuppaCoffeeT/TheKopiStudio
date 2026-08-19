/**
 * AppSidebarFooter — account controls pinned to the bottom of the 2a rail.
 *
 * The 2a comps only mock the content column, so they never say where the user
 * menu, notifications bell and ViewAs selector live — they only establish that
 * nothing sits above the content. Homing them here is the coherent resolution:
 * the rail becomes the single home for identity, navigation AND account, and
 * the content column is left exactly as the comps draw it.
 *
 * Nothing is rebuilt. `AppHeaderUserMenu`, `NotificationsBell` and
 * `ViewAsSelector` are the same primitives the retired masthead used, wired by
 * the same connector hooks through `useDashboardChrome`.
 *
 * The privacy eye briefly lived here (2026-08-18) and moved OUT again the next
 * day: collapsing the rail took the eye with it, leaving a masked page with no
 * way to unmask. It now sits in `AppChromeControls`, which the rail cannot
 * take down with it.
 *
 * Placement: overlays open with `side="right"`. They are 256–320px wide against
 * a 200px rail, so the header's `bottom` placement would be collision-shoved
 * across the rail instead of clearing it.
 *
 * Quiet by default — muted label, brown on hover, visible brown focus ring
 * (inherited from each primitive), 44px rows on coarse pointers
 * (.claude/rules/mobile-web.md §5).
 */

import { useDashboardChrome } from '@/hooks/useDashboardChrome';
import { AppHeaderUserMenu } from './AppHeaderUserMenu';
import { NotificationsBell } from './NotificationsBell';
import { ViewAsSelector } from './ViewAsSelector';

export function AppSidebarFooter() {
  const chrome = useDashboardChrome();

  return (
    <div
      data-testid="app-sidebar-footer"
      // px-[18px] + the trigger's own pl-1 lands the avatar on the nav items'
      // 22px gutter, so identity and navigation share one left edge.
      className="mt-auto flex flex-none flex-col gap-1 border-t border-sidebar-border px-[18px] pt-[14px]"
    >
      <AppHeaderUserMenu
        {...chrome.user}
        showName
        onSignOut={chrome.onSignOut}
        side="right"
        align="end"
        testId="app-sidebar-user-menu-trigger"
        className="w-full pointer-coarse:min-h-11"
      />

      <div className="flex items-center gap-1 pl-1 pointer-coarse:[&_button]:min-h-11 pointer-coarse:[&_button]:min-w-11">
        <NotificationsBell {...chrome.notifications} side="right" align="end" />
        <ViewAsSelector {...chrome.viewAs} side="right" align="end" />
      </div>
    </div>
  );
}
