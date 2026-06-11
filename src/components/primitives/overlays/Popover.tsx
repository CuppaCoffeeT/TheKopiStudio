import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { GLASS_SURFACE } from './shared';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  /** Render a small glass arrow anchored to the trigger. Matches S2 spec. */
  withArrow?: boolean;
}

/**
 * PopoverContent — glass-surface overlay content.
 *
 * Spec: docs/99-refactor/_system/design/session-02-overlays/export/appbase/project/overlays/OverlayPrimitives.jsx
 *   - glass surface (bg-white/72, backdrop-blur-12, saturate-140)
 *   - optional arrow via `<PopoverPrimitive.Arrow>` — pass `withArrow` to enable
 *   - always Portal'd → safe inside `<Modal>` / `<DrawerRoot>`
 */
export const PopoverContent = ({
  className,
  align = 'start',
  sideOffset = 6,
  withArrow = false,
  children,
  ...props
}: PopoverContentProps) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[12rem] rounded-lg p-1',
        GLASS_SURFACE,
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
        'data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      {children}
      {withArrow && (
        <PopoverPrimitive.Arrow
          width={10}
          height={5}
          className="fill-white/75 dark:fill-zinc-950/75"
        />
      )}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
);
PopoverContent.displayName = 'PopoverContent';
