import { Drawer as VaulDrawer } from 'vaul';
import { cn } from '@/lib/utils';
import { GLASS_BACKDROP } from './shared';

export const DrawerRoot = VaulDrawer.Root;
export const DrawerTrigger = VaulDrawer.Trigger;
export const DrawerClose = VaulDrawer.Close;

/**
 * Mobile-first bottom sheet (vaul). Use this for **quick actions** — type
 * chooser, filter sheet, photo-source picker, action menu.
 *
 * For long multi-step forms, do NOT use this primitive — `position: fixed`
 * bottom drawers fight with iOS Safari's soft keyboard. Use the wizard
 * shell instead (see `WizardMobileDrawer`, which is internally a fullscreen
 * Radix Dialog despite the legacy name). Pattern reference:
 * `docs/01-system-architecture/MOBILE_WEB_STANDARDS.md` standard #1.
 *
 * Grab-handle pulses on first paint to teach the swipe gesture (per LOCKED_PICKS v2).
 */
export const DrawerContent = ({
  className,
  children,
  handlePulse = true,
  ...props
}: React.ComponentPropsWithoutRef<typeof VaulDrawer.Content> & {
  handlePulse?: boolean;
}) => (
  <VaulDrawer.Portal>
    <VaulDrawer.Overlay className={cn('fixed inset-0 z-50', GLASS_BACKDROP)} />
    <VaulDrawer.Content
      className={cn(
        'fixed left-0 right-0 bottom-0 z-50',
        'rounded-t-2xl overflow-hidden',
        'bg-white dark:bg-zinc-950',
        'border-t border-x border-zinc-200 dark:border-zinc-800',
        'shadow-[0_-12px_40px_rgba(24,24,27,0.12)]',
        'dark:shadow-[0_-12px_40px_rgba(0,0,0,0.45)]',
        'flex flex-col max-h-[90dvh]',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      <div className="relative flex justify-center pt-2.5 pb-0.5">
        <span className="h-1.5 w-10 rounded-full bg-zinc-400 dark:bg-zinc-600 relative">
          {handlePulse && (
            <>
              <span
                aria-hidden
                className="absolute -inset-1.5 rounded-full border-[1.5px] border-zinc-500/35 dark:border-zinc-500/25 animate-[ping_1.4s_ease-out_infinite]"
              />
              <span
                aria-hidden
                className="absolute -inset-2.5 rounded-full border-[1.5px] border-zinc-500/20 dark:border-zinc-500/15 animate-[ping_1.4s_ease-out_0.4s_infinite]"
              />
            </>
          )}
        </span>
      </div>
      {children}
    </VaulDrawer.Content>
  </VaulDrawer.Portal>
);
DrawerContent.displayName = 'DrawerContent';

/** Title row — renders in Geist Pixel Square crisp + optional counter. */
export const DrawerHeader = ({
  title,
  subtitle,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) => (
  <div className="px-4.5 pb-3 pt-1">
    <VaulDrawer.Title
      className="text-[20px] text-zinc-900 dark:text-zinc-50 block"
      style={{
        fontFamily: 'var(--font-pixel)',
        letterSpacing: '-0.01em',
        WebkitFontSmoothing: 'none',
      }}
    >
      {title}
    </VaulDrawer.Title>
    {subtitle && (
      <VaulDrawer.Description className="text-[11px] text-zinc-500 mt-0.5 block">
        {subtitle}
      </VaulDrawer.Description>
    )}
  </div>
);

export const DrawerFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4.5 py-3.5 border-t border-zinc-100 dark:border-zinc-900 flex gap-2.5 items-center bg-white dark:bg-zinc-950">
    {children}
  </div>
);
