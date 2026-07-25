/**
 * AppHeaderDesktopBar — ≥ md layout for AppHeader (56px row).
 *
 * Extracted from AppHeader.tsx (W09 decomposition · ≤200 LOC primitive rule).
 * Cluster order per Session Shell spec: Logo + Breadcrumb · ⌘/ pill · ⌘K pill ·
 * Bell · ViewAs · Theme · UserMenu.
 */
import { Bell, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumb, type BreadcrumbSegment } from './Breadcrumb';
import { AppHeaderLogo } from './AppHeaderLogo';
import { AppHeaderUserMenu } from './AppHeaderUserMenu';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../overlays/DropdownMenu';
import { Kbd } from '../overlays/Kbd';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppHeaderDesktopBarProps {
  breadcrumb: BreadcrumbSegment[];
  initial: string;
  userName: string;
  userEmail: string;
  userRole: string;
  viewAsSlot?: React.ReactNode;
  notificationsSlot?: React.ReactNode;
  themeMode?: ThemeMode;
  onThemeChange?: (mode: ThemeMode) => void;
  unreadCount?: number;
  onNotificationsClick?: () => void;
  onCmdKClick?: () => void;
  /** Already resolved by the parent (default-wired). `undefined` hides. */
  onGlobalSearchClick?: () => void;
  onSignOut?: () => void;
  onAccountSettings?: () => void;
  onKeyboardShortcuts?: () => void;
  /** When true, this layout is hidden regardless of viewport. */
  forceMobile?: boolean;
}

const SEARCH_PILL_CLASS = cn(
  'inline-flex items-center gap-2 h-7 px-2.5 rounded-md',
  'border border-border',
  'text-muted-foreground',
  'hover:bg-secondary hover:border-[color:var(--border-hover)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
);

const ICON_BUTTON_CLASS =
  'w-8 h-8 rounded-md inline-flex items-center justify-center text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function SearchIconSvg() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" className="text-muted-foreground">
      <circle cx="4.5" cy="4.5" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M7 7 L9.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function AppHeaderDesktopBar({
  breadcrumb,
  initial,
  userName,
  userEmail,
  userRole,
  viewAsSlot,
  notificationsSlot,
  themeMode = 'system',
  onThemeChange,
  unreadCount = 0,
  onNotificationsClick,
  onCmdKClick,
  onGlobalSearchClick,
  onSignOut,
  onAccountSettings,
  onKeyboardShortcuts,
  forceMobile = false,
}: AppHeaderDesktopBarProps) {
  const ThemeIcon = themeMode === 'dark' ? Moon : themeMode === 'light' ? Sun : Monitor;

  return (
    <div
      className={cn(
        'h-14 items-center px-5 gap-5',
        forceMobile ? 'hidden' : 'hidden md:flex',
      )}
    >
      <div className="inline-flex items-center gap-[18px]">
        <AppHeaderLogo />
        <div className="h-4 w-px bg-[color:var(--border-soft)]" />
        <Breadcrumb segments={breadcrumb} />
      </div>

      <div className="flex-1" />

      {/* ⌘/ universal record search — default-wired upstream. */}
      {onGlobalSearchClick && (
        <button
          type="button"
          onClick={onGlobalSearchClick}
          aria-label="Search records"
          className={SEARCH_PILL_CLASS}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <SearchIconSvg />
          <span className="text-[11.5px]">Search records</span>
          <Kbd className="ml-1.5">⌘/</Kbd>
        </button>
      )}

      {/* ⌘K module launcher — explicit opt-in only. */}
      {onCmdKClick && (
        <button onClick={onCmdKClick} className={SEARCH_PILL_CLASS} style={{ fontFamily: 'var(--font-mono)' }}>
          <SearchIconSvg />
          <span className="text-[11.5px]">Search</span>
          <Kbd className="ml-1.5">⌘K</Kbd>
        </button>
      )}

      <div className="inline-flex items-center gap-1.5">
        {notificationsSlot ?? (
          <button onClick={onNotificationsClick} aria-label="Notifications" className={cn('relative', ICON_BUTTON_CLASS)}>
            <Bell className="w-4 h-4" strokeWidth={1.3} />
            {unreadCount > 0 && (
              <span className="absolute top-[3px] right-[3px] w-[7px] h-[7px] rounded-full bg-primary ring-[1.5px] ring-background" />
            )}
          </button>
        )}

        {viewAsSlot}

        {onThemeChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Theme" className={ICON_BUTTON_CLASS}>
                <ThemeIcon className="w-4 h-4" strokeWidth={1.3} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem icon={<Sun className="w-3 h-3" />} onClick={() => onThemeChange('light')}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem icon={<Moon className="w-3 h-3" />} onClick={() => onThemeChange('dark')}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem icon={<Monitor className="w-3 h-3" />} onClick={() => onThemeChange('system')}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="w-1.5" />

        <AppHeaderUserMenu
          initial={initial}
          showName
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          onSignOut={onSignOut}
          onAccountSettings={onAccountSettings}
          onKeyboardShortcuts={onKeyboardShortcuts}
        />
      </div>
    </div>
  );
}
