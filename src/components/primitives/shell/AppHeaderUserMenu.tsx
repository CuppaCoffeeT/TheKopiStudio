/**
 * AppHeaderUserMenu — avatar trigger + dropdown (account/shortcuts/sign-out).
 *
 * Two homes since the 2a masthead retirement (2026-07-25):
 *   - `AppSidebarFooter` (>= lg) — the desktop account home. Passes
 *     `side="right"` because the menu is wider than the 200px rail it hangs off.
 *   - `AppHeaderMobileBar` (< lg) — `mobile` folds notifications + view-as into
 *     this dropdown so the 52px bar stays compact.
 *
 * No theme controls: the app is light-pinned (.claude/rules/light-theme.md —
 * "Do NOT add a theme toggle"), so the old ThemeMode block was unreachable.
 */
import { type ComponentPropsWithoutRef } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../overlays/DropdownMenu';

type MenuSide = ComponentPropsWithoutRef<typeof DropdownMenuContent>['side'];
type MenuAlign = ComponentPropsWithoutRef<typeof DropdownMenuContent>['align'];

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
  unreadCount?: number;
  onNotificationsClick?: () => void;
  /** On mobile, view-as-user/impersonation folds into this dropdown. */
  viewAsSlot?: React.ReactNode;
  /** Menu placement. Defaults to the header's `bottom` / `end`; the sidebar
   *  footer passes `right` so a 256px menu clears the 200px rail. */
  side?: MenuSide;
  align?: MenuAlign;
  /** Extra trigger classes — e.g. the rail's full-width, 44px-touch row. */
  className?: string;
  /** Trigger `data-testid`. Overridden per home so the two never collide. */
  testId?: string;
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
  unreadCount,
  onNotificationsClick,
  viewAsSlot,
  side,
  align = 'end',
  className,
  testId = 'app-header-user-menu-trigger',
}: AppHeaderUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Account menu for ${userName}`}
          data-testid={testId}
          className={cn(
            'h-8 rounded-md inline-flex items-center gap-2 cursor-pointer',
            'bg-transparent text-foreground',
            'hover:bg-secondary',
            'active:bg-[color:var(--tint-pressed)]',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'data-[state=open]:bg-secondary',
            showName ? 'pr-2 pl-1' : 'px-1',
            className,
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <span
            className="w-6 h-6 shrink-0 rounded-full inline-flex items-center justify-center font-semibold text-[11px] bg-secondary text-foreground border border-[color:var(--border-soft)]"
            style={{ letterSpacing: '0.02em' }}
          >
            {initial}
          </span>
          {showName && (
            <>
              <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium">
                {userName}
              </span>
              <ChevronDown className="w-2 h-2 shrink-0 text-muted-foreground" strokeWidth={1.3} />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        className={cn(mobile ? 'w-[280px]' : 'w-64')}
      >
        <div className="px-3 pt-2 pb-2.5">
          <div
            className="text-[12.5px] text-foreground"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {userEmail}
          </div>
          <div className="mt-1.5">
            {/* -fg-strong, not --brown-text: this dropdown is a GLASS_SURFACE
                (bg-card/75), so the 10% brown chip wash composites over a
                lightened ground (~#EDE4D8) where --brown-text is 4.47:1. At
                9.5px — the smallest type in the account chrome — that misses AA.
                The deeper step reads 5.76:1 and keeps the soft-brown chip. */}
            <span
              className="inline-block px-1.5 py-0.5 rounded bg-[color:var(--accent-red-soft-bg)] text-[color:var(--accent-red-soft-fg-strong)] uppercase tracking-[0.06em]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 500 }}
            >
              {userRole}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        {/* Mobile-only items — >= lg these live as siblings in the rail footer. */}
        {mobile && viewAsSlot && (
          <div className="px-2 py-1.5 flex items-center justify-between gap-2">
            <span className="text-[11.5px] text-muted-foreground">View as</span>
            {viewAsSlot}
          </div>
        )}
        {mobile && onNotificationsClick && (
          <DropdownMenuItem onClick={onNotificationsClick} icon={<Bell className="w-3 h-3" />}>
            <span className="flex-1">Notifications</span>
            {unreadCount != null && unreadCount > 0 && (
              <span
                className="text-[10px] text-[color:var(--cta-primary-fg)] bg-[color:var(--cta-destructive-bg)] rounded-full px-1.5"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {unreadCount}
              </span>
            )}
          </DropdownMenuItem>
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
