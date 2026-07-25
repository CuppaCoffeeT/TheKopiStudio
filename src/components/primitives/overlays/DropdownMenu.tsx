import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { GLASS_SURFACE } from './shared';
import { Kbd } from './Kbd';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/** Glass-surface dropdown content — Portal'd, safe inside Dialog. */
export const DropdownMenuContent = ({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[12rem] rounded-lg p-1',
        GLASS_SURFACE,
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPrimitive.Portal>
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  icon?: React.ReactNode;
  shortcut?: string;
  destructive?: boolean;
}

/**
 * DropdownMenuItem — leading icon slot + label + optional keyboard shortcut.
 * `destructive` flips to the AA-safe terracotta (`--negative-text`) for terminal
 * actions (Delete, Sign out).
 */
export const DropdownMenuItem = ({
  icon,
  shortcut,
  destructive = false,
  className,
  children,
  ...props
}: DropdownMenuItemProps) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      'flex items-center gap-2 px-2 py-1.5 rounded-[5px]',
      'text-xs cursor-pointer outline-none select-none',
      // A tint fill alone is ~1.1:1 against the cream menu surface, so keyboard
      // focus gets its own inset brown ring and the deeper --row-selected fill;
      // hover stays on the lighter --row-hover so the two states differ.
      'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
      destructive
        ? 'text-[color:var(--negative-text)] focus:bg-[color:var(--red-soft)] hover:bg-[color:var(--red-soft)]'
        : 'text-foreground focus:bg-[color:var(--row-selected)] hover:bg-[color:var(--row-hover)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
      className
    )}
    style={{ fontFamily: 'var(--font-sans)' }}
    {...props}
  >
    {icon !== undefined && (
      <span
        className={cn(
          'w-3.5 text-center text-xs',
          destructive ? 'text-[color:var(--negative-text)]' : 'text-muted-foreground'
        )}
      >
        {icon}
      </span>
    )}
    <span className="flex-1">{children}</span>
    {shortcut && <Kbd>{shortcut}</Kbd>}
  </DropdownMenuPrimitive.Item>
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuLabel = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) => (
  <DropdownMenuPrimitive.Label
    className={cn(
      'px-2 py-1.5 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground',
      className
    )}
    style={{ fontFamily: 'var(--font-sans)' }}
    {...props}
  />
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) => (
  <DropdownMenuPrimitive.Separator
    className={cn('h-px my-1 -mx-1 bg-border', className)}
    {...props}
  />
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
