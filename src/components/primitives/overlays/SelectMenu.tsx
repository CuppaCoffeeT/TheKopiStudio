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
 * changes. Tokens: red-700 focus ring · slate-800 highlight · glass content.
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
  md: 'h-10 text-[14px]',
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
        'bg-white dark:bg-zinc-950',
        'border-zinc-300 dark:border-zinc-700',
        'text-zinc-900 dark:text-zinc-50',
        'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        'hover:border-zinc-400 dark:hover:border-zinc-600',
        'focus:outline-none focus:border-red-700 dark:focus:border-red-400 focus:ring-[3px] focus:ring-red-700/15 dark:focus:ring-red-400/25',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'data-[placeholder]:text-zinc-400',
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
        'px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-zinc-500',
        className,
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
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
        'text-[13px] text-zinc-800 dark:text-zinc-100',
        'outline-none',
        'focus:bg-zinc-100 dark:focus:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        'data-[state=checked]:font-medium',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5 text-slate-800 dark:text-slate-100" />
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
      className={cn('-mx-1 my-1 h-px bg-zinc-200 dark:bg-zinc-800', className)}
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
