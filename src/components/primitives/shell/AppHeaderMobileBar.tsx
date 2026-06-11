/**
 * AppHeaderMobileBar — < md layout for AppHeader (52px row).
 *
 * Extracted from AppHeader.tsx (W09 decomposition · ≤200 LOC primitive rule).
 * Visible last breadcrumb segment + universal-search trigger + UserMenu
 * (which folds notifications / theme / view-as on mobile).
 */
import { cn } from '@/lib/utils';
import type { BreadcrumbSegment } from './Breadcrumb';
import { AppHeaderLogo } from './AppHeaderLogo';
import { AppHeaderUserMenu } from './AppHeaderUserMenu';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppHeaderMobileBarProps {
  breadcrumb: BreadcrumbSegment[];
  initial: string;
  userName: string;
  userEmail: string;
  userRole: string;
  onSignOut?: () => void;
  onAccountSettings?: () => void;
  onKeyboardShortcuts?: () => void;
  themeMode?: ThemeMode;
  onThemeChange?: (mode: ThemeMode) => void;
  unreadCount?: number;
  onNotificationsClick?: () => void;
  viewAsSlot?: React.ReactNode;
  /** Already resolved by the parent (default-wired). `undefined` hides. */
  onGlobalSearchClick?: () => void;
  /** When true, this layout is forced regardless of viewport. */
  forceMobile?: boolean;
}

export function AppHeaderMobileBar({
  breadcrumb,
  initial,
  userName,
  userEmail,
  userRole,
  onSignOut,
  onAccountSettings,
  onKeyboardShortcuts,
  themeMode,
  onThemeChange,
  unreadCount,
  onNotificationsClick,
  viewAsSlot,
  onGlobalSearchClick,
  forceMobile = false,
}: AppHeaderMobileBarProps) {
  const last = breadcrumb[breadcrumb.length - 1];

  return (
    <div
      className={cn(
        'h-[52px] flex items-center px-2.5 gap-1.5',
        forceMobile ? 'flex' : 'flex md:hidden',
      )}
    >
      <AppHeaderLogo mobile />
      <div className="h-3.5 w-px bg-[#ececee] dark:bg-[#202024] flex-shrink-0" />
      <div className="flex-1 min-w-0 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
        {last?.label}
      </div>

      {/* Universal-search trigger — touch-discoverable entry on phones/tablets,
          since ⌘/ has no touch equivalent. */}
      {onGlobalSearchClick && (
        <button
          type="button"
          onClick={onGlobalSearchClick}
          aria-label="Search records"
          className="w-9 h-9 rounded-md inline-flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-zinc-600 dark:text-zinc-400">
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
        themeMode={themeMode}
        onThemeChange={onThemeChange}
        unreadCount={unreadCount}
        onNotificationsClick={onNotificationsClick}
        viewAsSlot={viewAsSlot}
      />
    </div>
  );
}
