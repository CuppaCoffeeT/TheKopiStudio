import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { cn } from '@/lib/utils';
import { GLASS_SURFACE } from './shared';
import { Kbd } from './Kbd';

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;

export const ContextMenuContent = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
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
    </ContextMenuPrimitive.Content>
  </ContextMenuPrimitive.Portal>
);
ContextMenuContent.displayName = 'ContextMenuContent';

interface ContextMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> {
  icon?: React.ReactNode;
  shortcut?: string;
  destructive?: boolean;
}

export const ContextMenuItem = ({
  icon,
  shortcut,
  destructive = false,
  className,
  children,
  ...props
}: ContextMenuItemProps) => (
  <ContextMenuPrimitive.Item
    className={cn(
      'flex items-center gap-2 px-2 py-1.5 rounded-[5px]',
      'text-xs cursor-pointer outline-none select-none',
      destructive
        ? 'text-[color:var(--negative-text)] focus:bg-[color:var(--red-soft)] hover:bg-[color:var(--red-soft)]'
        : 'text-foreground focus:bg-secondary hover:bg-secondary',
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
  </ContextMenuPrimitive.Item>
);
ContextMenuItem.displayName = 'ContextMenuItem';

export const ContextMenuSeparator = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>) => (
  <ContextMenuPrimitive.Separator
    className={cn('h-px my-1 -mx-1 bg-border', className)}
    {...props}
  />
);
ContextMenuSeparator.displayName = 'ContextMenuSeparator';
