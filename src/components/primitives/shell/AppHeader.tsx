/**
 * AppHeader — glass sticky shell (composition only).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-FmPJtwZw/project/preview/component-header.html
 * Archetype: Session Shell — ui_kits/appbase/Session Shell.html
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Decomposed (W09 ≤200 LOC rule) into siblings:
 *   - AppHeaderLogo · AppHeaderUserMenu · AppHeaderMobileBar · AppHeaderDesktopBar.
 *
 * Locked: sticky top-0 z-30 · glass bg rgba(255,255,255,0.72) / rgba(9,9,11,0.70)
 *         + backdrop-blur-xl saturate-140 · border-bottom #ececee / #202024.
 *         Mobile bar 52px · Desktop bar 56px (set inside each bar).
 */
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { type BreadcrumbSegment } from './Breadcrumb';
import { AppHeaderMobileBar } from './AppHeaderMobileBar';
import { AppHeaderDesktopBar } from './AppHeaderDesktopBar';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppHeaderProps {
  /** Breadcrumb segments — first is typically "Workspace" or "AppBase". */
  breadcrumb: BreadcrumbSegment[];
  userName: string;
  userEmail: string;
  userRole: string;
  /** Used for the avatar initial. Defaults to `userName[0]`. */
  userInitial?: string;
  /** Slot for a view-as-user / impersonation control. Caller renders
   * `<ViewAsSelector {...useViewAs()} />` from `@/components/primitives/shell` here. */
  viewAsSlot?: ReactNode;
  themeMode?: ThemeMode;
  onThemeChange?: (mode: ThemeMode) => void;
  /** Notifications slot — caller renders `<NotificationsBell {...useNotificationsBell()} />`. */
  notificationsSlot?: ReactNode;
  /** Legacy props for the mobile user-menu fallback. */
  unreadCount?: number;
  onNotificationsClick?: () => void;
  /** Command palette (⌘K) — module launcher. Opt-in only. */
  onCmdKClick?: () => void;
  /** Universal record search (⌘/) — opens the cross-entity search palette.
   *  Defaults to dispatching `window.dispatchEvent(new Event('open-global-search'))`
   *  so callers that mount AppHeader directly (e.g. Dashboard) get the button
   *  for free. Pass `null` to explicitly hide; pass a function to override. */
  onGlobalSearchClick?: (() => void) | null;
  onSignOut?: () => void;
  onAccountSettings?: () => void;
  onKeyboardShortcuts?: () => void;
  /** Force the mobile layout regardless of viewport. Both layouts otherwise
   *  render and the `md:` breakpoint toggles visibility. */
  mobile?: boolean;
  className?: string;
}

export function AppHeader({
  breadcrumb,
  userName,
  userEmail,
  userRole,
  userInitial,
  viewAsSlot,
  themeMode = 'system',
  onThemeChange,
  notificationsSlot,
  unreadCount = 0,
  onNotificationsClick,
  onCmdKClick,
  onGlobalSearchClick,
  onSignOut,
  onAccountSettings,
  onKeyboardShortcuts,
  mobile = false,
  className,
}: AppHeaderProps) {
  const initial = userInitial ?? userName.charAt(0).toUpperCase();

  // Default-wire the universal-search trigger so direct <AppHeader> callers
  // (e.g. Dashboard) get the discoverable button without per-page wiring.
  // `null` opts out; a function overrides.
  const resolvedGlobalSearchClick =
    onGlobalSearchClick === null
      ? undefined
      : (onGlobalSearchClick ??
        (() => window.dispatchEvent(new Event('open-global-search'))));

  const sharedUserProps = {
    initial,
    userName,
    userEmail,
    userRole,
    onSignOut,
    onAccountSettings,
    onKeyboardShortcuts,
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 backdrop-blur-xl backdrop-saturate-[1.4]',
        'bg-white/[0.72] dark:bg-zinc-950/70',
        'border-b border-[#ececee] dark:border-[#202024]',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <AppHeaderMobileBar
        {...sharedUserProps}
        breadcrumb={breadcrumb}
        themeMode={themeMode}
        onThemeChange={onThemeChange}
        unreadCount={unreadCount}
        onNotificationsClick={onNotificationsClick}
        viewAsSlot={viewAsSlot}
        onGlobalSearchClick={resolvedGlobalSearchClick}
        forceMobile={mobile}
      />
      <AppHeaderDesktopBar
        {...sharedUserProps}
        breadcrumb={breadcrumb}
        viewAsSlot={viewAsSlot}
        notificationsSlot={notificationsSlot}
        themeMode={themeMode}
        onThemeChange={onThemeChange}
        unreadCount={unreadCount}
        onNotificationsClick={onNotificationsClick}
        onCmdKClick={onCmdKClick}
        onGlobalSearchClick={resolvedGlobalSearchClick}
        forceMobile={mobile}
      />
    </header>
  );
}

/** Bare-wrapper alias for consumers that prefer passing children directly. */
export function AppHeaderWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
