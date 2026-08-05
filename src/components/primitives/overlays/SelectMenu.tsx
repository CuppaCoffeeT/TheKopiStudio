/**
 * SelectMenu — compositional Radix Select with AppBase tokens.
 *
 * Ships the shadcn-compatible API surface:
 *   <SelectMenu value onValueChange>
 *     <SelectMenuTrigger><SelectMenuValue placeholder="..." /></SelectMenuTrigger>
 *     <SelectMenuContent>
 *       <SelectMenuItem value="a">A</SelectMenuItem>
 *     </SelectMenuContent>
 *   </SelectMenu>
 *
 * Also re-exported under the shadcn names (`Select`, `SelectTrigger`,
 * `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`,
 * `SelectSeparator`) so existing adopters can swap imports with zero prop
 * changes. Tokens: brown focus outline (`--cta-primary-bg`) · brown-tinted row
 * highlight · cream glass content.
 */

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { GLASS_SURFACE } from './shared';

export const SelectMenu = SelectPrimitive.Root;
export const SelectMenuGroup = SelectPrimitive.Group;
export const SelectMenuValue = SelectPrimitive.Value;

export type SelectMenuSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<SelectMenuSize, string> = {
  sm: 'h-8 text-[13px]',
  md: 'h-10 pointer-coarse:h-11 text-[14px]',
  lg: 'h-12 text-[15px]',
};

type SelectMenuTriggerProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
  size?: SelectMenuSize;
};

export const SelectMenuTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectMenuTriggerProps
>(function SelectMenuTrigger({ className, children, size = 'md', ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-lg border px-3 cursor-pointer',
        SIZE_CLASSES[size],
        'bg-card',
        'border-border',
        'text-foreground',
        'placeholder:text-muted-foreground',
        'hover:border-[color:var(--border-hover)]',
        // The trigger renders a <button>, so it takes the 2a button focus rule —
        // a 2px brown outline. A low-alpha halo alone measures ~1.2:1 and is
        // effectively invisible on cream.
        'focus:border-ring',
        'focus-visible:outline-2 focus-visible:outline-[color:var(--cta-primary-bg)] focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'data-[placeholder]:text-muted-foreground',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectMenuScrollUpButton = forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(function SelectMenuScrollUpButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronUp className="h-3.5 w-3.5" />
    </SelectPrimitive.ScrollUpButton>
  );
});

export const SelectMenuScrollDownButton = forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(function SelectMenuScrollDownButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronDown className="h-3.5 w-3.5" />
    </SelectPrimitive.ScrollDownButton>
  );
});

export const SelectMenuContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectMenuContent({ className, children, position = 'popper', ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg',
          GLASS_SURFACE,
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        style={{ fontFamily: 'var(--font-sans)' }}
        {...props}
      >
        <SelectMenuScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectMenuScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectMenuLabel = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectMenuLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    />
  );
});

export const SelectMenuItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectMenuItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded py-1.5 pl-7 pr-2',
        'text-[13px] text-foreground',
        'outline-none',
        // Same contract as DropdownMenuItem: an inset brown ring carries
        // keyboard focus, --row-selected (12%) marks it, --row-hover (6%) marks
        // hover — a flat tint on cream is only ~1.1:1 and reads as nothing.
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        'focus:bg-[color:var(--row-selected)] hover:bg-[color:var(--row-hover)]',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        'data-[state=checked]:font-medium',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5 text-[color:var(--brown-text)]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

export const SelectMenuSeparator = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectMenuSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
});

// Shadcn-compat re-exports so legacy callsites migrate via import swap only.
export {
  SelectMenu as Select,
  SelectMenuTrigger as SelectTrigger,
  SelectMenuValue as SelectValue,
  SelectMenuContent as SelectContent,
  SelectMenuItem as SelectItem,
  SelectMenuGroup as SelectGroup,
  SelectMenuLabel as SelectLabel,
  SelectMenuSeparator as SelectSeparator,
};
