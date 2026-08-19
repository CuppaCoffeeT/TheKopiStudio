/**
 * AppChromeControls — the two controls that must be reachable from every
 * protected page, whatever the rail is doing: the nav hamburger and the
 * privacy eye.
 *
 * WHY THIS EXISTS (2026-08-19). The eye first lived in the rail footer. That
 * was fine until the rail learned to collapse — and then **hiding the
 * navigation hid the privacy toggle with it**, so on desktop there was no way
 * to unmask a masked page short of showing the rail again. A control that
 * disappears when a *different* control is used is not a control.
 *
 * Both now sit in fixed chrome instead, at the two top corners: hamburger
 * left, eye right. They are siblings of the rail rather than passengers in it,
 * so neither can take the other down.
 *
 * >= lg ONLY. Below that breakpoint `AppHeaderMobileBar` already carries both
 * jobs — its menu button opens `AppNavDrawer` and it renders its own
 * `PrivacyToggle` — and a second floating pair would sit on top of it.
 *
 * The wrapper is `pointer-events-none` with `pointer-events-auto` children, so
 * the empty space between the two corners never eats a click meant for the
 * page underneath.
 */

import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarState } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { PrivacyToggle } from './PrivacyToggle';

/**
 * Chrome-button box. Bordered and painted, unlike the quiet controls inside the
 * rail: these sit directly on the page cream with content behind them, so they
 * need an edge to read as chrome rather than as page furniture.
 */
export const CHROME_BUTTON = cn(
  'inline-flex h-9 w-9 items-center justify-center rounded-md',
  'border border-sidebar-border bg-sidebar text-muted-foreground shadow-sm',
  'transition-colors hover:bg-[color:var(--surface-subtle)] hover:text-[color:var(--brown-text)]',
  'focus-visible:outline-2 focus-visible:outline-[color:hsl(var(--ring))] focus-visible:outline-offset-2',
  'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
);

export function AppChromeControls() {
  const { user, loading } = useAuth();
  const { railHidden, toggleRail } = useSidebarState();

  // Same guard as the rail: nothing while auth resolves, and nothing on the
  // signed-out flash before ProtectedRoute redirects.
  if (loading || !user) return null;

  return (
    <div
      className={cn(
        'no-print print:hidden',
        'pointer-events-none fixed inset-x-0 top-0 z-50 hidden lg:flex',
        'items-start justify-between p-3',
      )}
    >
      {/*
       * The hamburger only appears once the rail is HIDDEN — while it is open,
       * its own header carries the same toggle, and two hamburgers a few
       * hundred pixels apart doing the identical thing is worse than one.
       * `aria-expanded` states which it is either way.
       */}
      {railHidden ? (
        <button
          type="button"
          onClick={toggleRail}
          aria-label="Show navigation"
          aria-expanded={false}
          data-testid="app-sidebar-show"
          className={cn('pointer-events-auto', CHROME_BUTTON)}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <span />
      )}

      <PrivacyToggle
        testId="privacy-toggle-chrome"
        className={cn('pointer-events-auto', CHROME_BUTTON)}
      />
    </div>
  );
}
