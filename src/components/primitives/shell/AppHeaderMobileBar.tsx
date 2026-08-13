/**
 * AppHeaderMobileBar — the only horizontal app bar left in the product.
 *
 * The 2a "Kopi House" comps show no top bar at all: the rail is the whole
 * chrome. `AppSidebar` only exists at >= lg, so below that this 52px bar keeps
 * identity, page context, module navigation (through the ⌘K palette, which has
 * no touch equivalent otherwise) and the account menu reachable. It absorbed
 * the sticky glass `<header>` from the retired `AppHeader` wrapper — there is
 * no desktop counterpart any more.
 *
 * Breakpoint: `lg:hidden`, matched to the rail. It used to be `md:hidden`,
 * which left 768–1023px with neither rail nor bar.
 *
 * Homed by the three archetype frames (ListPageFrame · DetailPageFrame ·
 * AppHeaderShell) AND, since 2026-08-13, by `DashboardHomePage` directly —
 * that page composes no frame, so it was the one route in the app with no
 * navigation at all below lg. Any future page that skips the frames must
 * render this bar itself.
 *
 * Navigation lives on the LEADING menu button, which opens `AppNavDrawer` (the
 * rail's own module list). The trailing search icon still opens the ⌘K palette
 * — the fast path once you know it — but it is no longer the only way off the
 * page: a magnifying glass reads as "search this page", not "go elsewhere".
 *
 * Locked: 52px row · sticky top-0 z-30 · glass card cream @ 72%
 * (`bg-card/[0.72]`) + backdrop-blur-xl saturate-140 · bottom hairline
 * `--border`. Excluded from print twice over (Tailwind `print:` + the
 * `.no-print` class `features/crm/lib/report-print.css` owns), like the rail.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useScrolled } from '@/hooks/useScrolled';
import type { BreadcrumbSegment } from './Breadcrumb';
import { AppHeaderLogo } from './AppHeaderLogo';
import { AppHeaderUserMenu } from './AppHeaderUserMenu';
import { AppNavDrawer } from './AppNavDrawer';

interface AppHeaderMobileBarProps {
  /** Page trail. Only the last segment is shown — it is the page label here. */
  breadcrumb: BreadcrumbSegment[];
  initial: string;
  userName: string;
  userEmail: string;
  userRole: string;
  onSignOut?: () => void;
  onAccountSettings?: () => void;
  onKeyboardShortcuts?: () => void;
  unreadCount?: number;
  onNotificationsClick?: () => void;
  /** Impersonation control — folded into the account dropdown at this width. */
  viewAsSlot?: React.ReactNode;
  /**
   * Search trigger. Default-wires to the ⌘K module palette
   * (`open-command-palette`, listened for by `GlobalCommandPalette`), which is
   * the touch equivalent of the rail: below lg there is no other way to reach
   * another module. It used to dispatch `open-global-search`, an event nothing
   * has ever listened for. Pass `null` to hide the button.
   */
  onGlobalSearchClick?: (() => void) | null;
  className?: string;
}

const ICON_BUTTON_CLASS = cn(
  // 44px floor — this bar only exists on touch-sized viewports (< lg).
  'w-11 h-11 rounded-md inline-flex items-center justify-center text-muted-foreground',
  'hover:bg-secondary hover:text-[color:var(--brown-text)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
);

export function AppHeaderMobileBar({
  breadcrumb,
  initial,
  userName,
  userEmail,
  userRole,
  onSignOut,
  onAccountSettings,
  onKeyboardShortcuts,
  unreadCount,
  onNotificationsClick,
  viewAsSlot,
  onGlobalSearchClick,
  className,
}: AppHeaderMobileBarProps) {
  const last = breadcrumb[breadcrumb.length - 1];
  const scrolled = useScrolled();
  const [navOpen, setNavOpen] = useState(false);

  const resolvedGlobalSearchClick =
    onGlobalSearchClick === null
      ? undefined
      : (onGlobalSearchClick ??
        (() => window.dispatchEvent(new Event('open-command-palette'))));

  return (
    <header
      className={cn(
        'no-print print:hidden lg:hidden',
        'sticky top-0 z-30 backdrop-blur-xl backdrop-saturate-[1.4]',
        'bg-card/[0.72] border-b border-border',
        'transition-shadow duration-300 ease-[var(--motion-ease-out-expo)]',
        scrolled && 'shadow-[var(--card-shadow-hover)]',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="flex h-[52px] items-center gap-1.5 px-2.5">
        {/* Leading position, before the wordmark — the one place a touch user
            looks for navigation. The search icon opens the module palette, but
            a magnifying glass reads as "search this page", so it cannot be the
            only way off the page. */}
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={navOpen}
          data-testid="app-header-mobile-menu"
          className={ICON_BUTTON_CLASS}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            {[4.5, 9, 13.5].map((y) => (
              <path
                key={y}
                d={`M2.5 ${y} H15.5`}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </button>
        <AppNavDrawer open={navOpen} onOpenChange={setNavOpen} />

        <AppHeaderLogo />
        <div className="h-3.5 w-px flex-shrink-0 bg-[color:var(--border-soft)]" />
        <div className="min-w-0 flex-1 truncate text-[13px] font-medium text-muted-foreground">
          {last?.label}
        </div>

        {resolvedGlobalSearchClick && (
          <button
            type="button"
            onClick={resolvedGlobalSearchClick}
            aria-label="Search modules"
            data-testid="app-header-mobile-search"
            className={ICON_BUTTON_CLASS}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M10.5 10.5 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <AppHeaderUserMenu
          initial={initial}
          showName={false}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          onSignOut={onSignOut}
          onAccountSettings={onAccountSettings}
          onKeyboardShortcuts={onKeyboardShortcuts}
          mobile
          unreadCount={unreadCount}
          onNotificationsClick={onNotificationsClick}
          viewAsSlot={viewAsSlot}
          className="pointer-coarse:min-h-11"
        />
      </div>
    </header>
  );
}
