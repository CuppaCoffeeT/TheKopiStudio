import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import { Kbd } from './Kbd';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  /** Optional keyboard shortcut shown inside the tooltip (e.g. "⌘R"). */
  shortcut?: string;
}

/**
 * TooltipContent — inverted-contrast pill. Zinc-900 in light, zinc-100 in dark.
 * Optionally shows a Kbd chip inline (e.g. for toolbar hints).
 */
export const TooltipContent = ({
  className,
  sideOffset = 6,
  children,
  shortcut,
  ...props
}: TooltipContentProps) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        'z-50 px-2 py-[5px] rounded-[5px]',
        'inline-flex items-center gap-2',
        'bg-foreground',
        'text-background',
        'text-[11px] whitespace-nowrap',
        'shadow-lg',
        'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
        'data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0',
        'data-[state=delayed-open]:zoom-in-95 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      <span>{children}</span>
      {shortcut && <Kbd invert>{shortcut}</Kbd>}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
);
TooltipContent.displayName = 'TooltipContent';
