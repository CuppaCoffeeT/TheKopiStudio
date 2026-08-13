/**
 * AppNavDrawer — the < lg stand-in for the rail: the same module list, slid in
 * from the left behind `AppHeaderMobileBar`'s menu button.
 *
 * Added 2026-08-13. The 2a decision that "no second drawer is built" held only
 * as long as the ⌘K palette was a real navigation affordance; once the hotkey
 * was removed (2026-08-05) the palette was reachable ONLY from a magnifying
 * glass, which reads as "search this page", not "go somewhere else". Touch users
 * had no visible way to change module. The palette stays — it is the fast path
 * once you know it — and this is the discoverable one.
 *
 * Renders `AppSidebarNav`, the same component the rail renders, so the two can
 * never list different modules.
 *
 * Surface: card cream (`bg-sidebar`), matching the rail rather than the page —
 * the nav's idle `--fg-muted` items only clear AA on that ground.
 *
 * Left-side sheet, not the bottom `Drawer` primitive: this mirrors the rail it
 * replaces, and the vaul bottom sheet is reserved for quick actions
 * (.claude/rules/mobile-web.md §1).
 */

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AppSidebarNav } from './AppSidebarNav';
import { Wordmark } from './Wordmark';

interface AppNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppNavDrawer({ open, onOpenChange }: AppNavDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        data-testid="app-nav-drawer"
        className={cn(
          'flex w-[264px] flex-col gap-0 border-r border-sidebar-border bg-sidebar p-0',
          'pt-[22px]',
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {/* Radix requires a title on every dialog. The wordmark IS the title
            here, so the accessible name rides on it rather than on a second
            visible heading the comp doesn't draw. */}
        <SheetTitle className="flex-none px-[22px] pb-[18px] font-normal text-sidebar-foreground">
          <Wordmark className="block text-[22px] leading-[1.15]" />
        </SheetTitle>

        <AppSidebarNav
          onNavigate={() => onOpenChange(false)}
          moreHeadingTestId="app-nav-drawer-more-heading"
          className="flex-1"
        />
      </SheetContent>
    </Sheet>
  );
}
