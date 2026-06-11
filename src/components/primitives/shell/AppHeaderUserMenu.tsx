/**
 * AppHeaderUserMenu — avatar trigger + dropdown (account/shortcuts/sign-out).
 *
 * Extracted from AppHeader.tsx (W09 decomposition · ≤200 LOC primitive rule).
 * Mobile variant folds notifications / theme / view-as into this dropdown so
 * the mobile bar stays compact; desktop variant keeps them as sibling buttons.
 */
import { Bell, ChevronDown, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../overlays/DropdownMenu';

type ThemeMode = 'light' | 'dark' | 'system';

export interface AppHeaderUserMenuProps {
  initial: string;
  showName: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
  onSignOut?: () => void;
  onAccountSettings?: () => void;
  onKeyboardShortcuts?: () => void;
  mobile?: boolean;
  themeMode?: ThemeMode;
  onThemeChange?: (mode: ThemeMode) => void;
  unreadCount?: number;
  onNotificationsClick?: () => void;
  /** On mobile, view-as-user/impersonation folds into this dropdown. */
  viewAsSlot?: React.ReactNode;
}

export function AppHeaderUserMenu({
  initial,
  showName,
  userName,
  userEmail,
  userRole,
  onSignOut,
  onAccountSettings,
  onKeyboardShortcuts,
  mobile = false,
  themeMode,
  onThemeChange,
  unreadCount,
  onNotificationsClick,
  viewAsSlot,
}: AppHeaderUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Account menu for ${userName}`}
          data-testid="app-header-user-menu-trigger"
          className={cn(
            'h-8 rounded-md inline-flex items-center gap-2 cursor-pointer',
            'bg-transparent text-zinc-900 dark:text-zinc-50',
            'hover:bg-zinc-200 dark:hover:bg-zinc-800',
            'active:bg-zinc-300 dark:active:bg-zinc-700',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
            'data-[state=open]:bg-zinc-200 dark:data-[state=open]:bg-zinc-800',
            showName ? 'pr-2 pl-1' : 'px-1',
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <span
            className="w-6 h-6 rounded-full inline-flex items-center justify-center font-semibold text-[11px] bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
            style={{ letterSpacing: '0.02em' }}
          >
            {initial}
          </span>
          {showName && (
            <>
              <span className="text-[13px] font-medium">{userName}</span>
              <ChevronDown className="w-2 h-2 text-zinc-500" strokeWidth={1.3} />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn(mobile ? 'w-[280px]' : 'w-64')}>
        <div className="px-3 pt-2 pb-2.5">
          <div
            className="text-[12.5px] text-zinc-900 dark:text-zinc-50"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {userEmail}
          </div>
          <div className="mt-1.5">
            <span
              className="inline-block px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 uppercase tracking-[0.06em]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 500 }}
            >
              {userRole}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        {/* Mobile-only items — on desktop these live as separate header buttons. */}
        {mobile && viewAsSlot && (
          <div className="px-2 py-1.5 flex items-center justify-between gap-2">
            <span className="text-[11.5px] text-zinc-600 dark:text-zinc-400">View as</span>
            {viewAsSlot}
          </div>
        )}
        {mobile && onNotificationsClick && (
          <DropdownMenuItem onClick={onNotificationsClick} icon={<Bell className="w-3 h-3" />}>
            <span className="flex-1">Notifications</span>
            {unreadCount != null && unreadCount > 0 && (
              <span
                className="text-[10px] text-white bg-red-700 dark:bg-red-400 dark:text-zinc-950 rounded-full px-1.5"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {unreadCount}
              </span>
            )}
          </DropdownMenuItem>
        )}
        {mobile && onThemeChange && (
          <>
            <DropdownMenuItem icon={<Sun className="w-3 h-3" />} onClick={() => onThemeChange('light')}>
              Theme · Light
            </DropdownMenuItem>
            <DropdownMenuItem icon={<Moon className="w-3 h-3" />} onClick={() => onThemeChange('dark')}>
              Theme · Dark
            </DropdownMenuItem>
            <DropdownMenuItem icon={<Monitor className="w-3 h-3" />} onClick={() => onThemeChange('system')}>
              Theme · System
            </DropdownMenuItem>
          </>
        )}
        {onAccountSettings && (
          <DropdownMenuItem onClick={onAccountSettings}>Account settings</DropdownMenuItem>
        )}
        {onKeyboardShortcuts && (
          <DropdownMenuItem onClick={onKeyboardShortcuts} shortcut="⌘/">
            Keyboard shortcuts
          </DropdownMenuItem>
        )}
        {onSignOut && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} destructive>
              Sign out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
