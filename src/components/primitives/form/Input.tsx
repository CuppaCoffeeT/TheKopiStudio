import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Input — text/number field with optional prefix, suffix, leading-icon slots.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: focus ring red-700 never silent; border red-700 on error/focus; prefix/suffix mono-font.
 *
 * Compat: when no prefix/suffix/leadingIcon slots are used, renders a bare
 * styled `<input>` so it works inside shadcn `<FormControl>`/Radix Slot
 * cloneElement (which forwards id/aria/ref to the first rendered element).
 * When any slot is used, wraps in a bordered `<div>` container.
 */

export type InputSize = 'md' | 'lg';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: InputSize;
  error?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  mono?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    error = false,
    prefix,
    suffix,
    leadingIcon,
    mono = false,
    className,
    containerClassName,
    disabled,
    readOnly,
    ...props
  },
  ref
) {
  const heightCls = size === 'lg'
    ? 'h-12 text-[15px] pointer-coarse:text-[16px]'
    : 'h-10 text-[14px] pointer-coarse:text-[16px]';
  const hasSlots = !!prefix || !!suffix || !!leadingIcon || !!readOnly;

  // Bare mode — no slots. One <input> is the root; Slot/FormControl forwarding works.
  if (!hasSlots) {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border transition-[box-shadow,border-color] duration-150',
          heightCls,
          'px-3',
          error
            ? 'border-red-700 dark:border-red-400'
            : 'border-zinc-300 dark:border-zinc-700',
          !disabled && !error && 'hover:border-zinc-400 dark:hover:border-zinc-600',
          !error && 'focus:border-red-700 dark:focus:border-red-400 focus:ring-[3px] focus:ring-red-700/15 dark:focus:ring-red-400/25',
          error && 'focus:ring-[3px] focus:ring-red-700/15 dark:focus:ring-red-400/25',
          disabled ? 'bg-zinc-100 dark:bg-zinc-900 opacity-80 cursor-not-allowed' : 'bg-white dark:bg-zinc-950',
          'text-zinc-900 dark:text-zinc-50',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
          'outline-none',
          mono && 'tabular-nums',
          className,
        )}
        style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)' }}
        {...props}
      />
    );
  }

  // Slot mode — wraps in decorated container for prefix/suffix/leadingIcon/readOnly badge.
  return (
    <div
      className={cn(
        'w-full flex items-center rounded-lg overflow-hidden border transition-[box-shadow,border-color] duration-150',
        heightCls,
        error
          ? 'border-red-700 dark:border-red-400'
          : 'border-zinc-300 dark:border-zinc-700',
        !disabled && !readOnly && !error && 'hover:border-zinc-400 dark:hover:border-zinc-600',
        !error &&
          'focus-within:border-red-700 dark:focus-within:border-red-400 focus-within:ring-[3px] focus-within:ring-red-700/15 dark:focus-within:ring-red-400/25',
        error &&
          'focus-within:ring-[3px] focus-within:ring-red-700/15 dark:focus-within:ring-red-400/25',
        disabled || readOnly
          ? 'bg-zinc-100 dark:bg-zinc-900'
          : 'bg-white dark:bg-zinc-950',
        disabled && 'opacity-80 cursor-not-allowed',
        containerClassName,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {leadingIcon && (
        <span className="inline-flex items-center justify-center pl-3 text-zinc-500 dark:text-zinc-400 flex-shrink-0">
          {leadingIcon}
        </span>
      )}
      {prefix && (
        <span
          className={cn(
            'h-full inline-flex items-center px-2.5 flex-shrink-0',
            'text-zinc-500 dark:text-zinc-400',
            'border-r border-zinc-200 dark:border-zinc-800',
            'bg-zinc-50 dark:bg-zinc-900',
          )}
          style={{ fontFamily: 'var(--font-mono)', fontSize: size === 'lg' ? 14 : 13 }}
        >
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          'flex-1 min-w-0 h-full px-3 bg-transparent outline-none',
          'text-zinc-900 dark:text-zinc-50',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
          disabled && 'cursor-not-allowed',
          mono && 'tabular-nums',
          className,
        )}
        style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)' }}
        {...props}
      />
      {readOnly && (
        <span
          className="px-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex-shrink-0"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.08em' }}
        >
          readonly
        </span>
      )}
      {suffix && (
        <span
          className={cn(
            'h-full inline-flex items-center px-2.5 flex-shrink-0',
            'text-zinc-500 dark:text-zinc-400',
            'border-l border-zinc-200 dark:border-zinc-800',
            'bg-zinc-50 dark:bg-zinc-900',
          )}
          style={{ fontFamily: 'var(--font-mono)', fontSize: size === 'lg' ? 14 : 13 }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
});
