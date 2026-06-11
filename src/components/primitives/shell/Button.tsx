import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'destructive' | 'ghost' | 'outline' | 'icon' | 'default' | 'secondary' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'default';

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** Show spinner + disable button during async work. */
  loading?: boolean;
}

function resolveVariant(v: ButtonVariant): Exclude<ButtonVariant, 'default' | 'secondary' | 'link'> {
  if (v === 'default') return 'primary';
  if (v === 'secondary') return 'outline';
  if (v === 'link') return 'ghost';
  return v;
}

function resolveSize(s: ButtonSize): 'xs' | 'sm' | 'md' | 'lg' {
  return s === 'default' ? 'md' : s;
}

/**
 * S-shell Button — formal variant + size spec from W08 Session 3.
 * CTA primary = slate-800 (locked 2026-04-19). Destructive = red-700.
 * Icon variant renders a square button; children are the icon node.
 * All 5 states wired (2026-04-26): cursor-pointer when enabled, hover
 * bg shift, :active darker bg + scale-[0.97] press feedback, disabled
 * cursor-not-allowed + opacity-40 (and scale lock so press doesn't fire),
 * focus-visible red-700 ring with offset.
 *
 * `loading` (added 2026-04-26): replaces leadingIcon with an animated
 * Loader2 spinner, sets aria-busy, and disables the button. Use for
 * async actions so the user gets immediate feedback instead of waiting
 * on a network round-trip with a frozen UI.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant: variantProp = 'primary', size: sizeProp = 'md', leadingIcon, trailingIcon, loading = false, disabled, className, children, type = 'button', ...props },
  ref
) {
  const variant = resolveVariant(variantProp);
  const size = resolveSize(sizeProp);
  const isDisabled = disabled || loading;
  const spinnerSize = { xs: 'h-3 w-3', sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-4 w-4' }[size];
  const effectiveLeadingIcon = loading
    ? <Loader2 className={cn(spinnerSize, 'animate-spin')} aria-hidden="true" />
    : leadingIcon;
  if (variant === 'icon') {
    const iconSize = { xs: 'w-8 h-8', sm: 'w-7 h-7', md: 'w-8 h-8', lg: 'w-11 h-11' }[size];
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          iconSize,
          'rounded-md inline-flex items-center justify-center cursor-pointer transition-transform',
          'bg-transparent text-zinc-700 dark:text-zinc-300',
          'hover:bg-zinc-200 dark:hover:bg-zinc-800',
          'active:scale-[0.94] active:bg-zinc-300 dark:active:bg-zinc-700',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className={cn(spinnerSize, 'animate-spin')} aria-hidden="true" /> : children}
      </button>
    );
  }

  const sizeMap = {
    xs: 'h-8 px-2.5 text-[13px]',
    sm: 'h-7 px-3 text-[12.5px]',
    md: 'h-9 px-4 text-[13px]',
    lg: 'h-11 px-5 text-sm',
  }[size];

  const variantClass = {
    primary: 'bg-slate-800 hover:bg-slate-900 active:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900',
    destructive: 'bg-red-700 hover:bg-red-800 active:bg-red-900 text-white',
    ghost: 'bg-transparent hover:bg-zinc-200 active:bg-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700 text-zinc-700 dark:text-zinc-300',
    outline: 'bg-transparent hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-900 dark:active:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800',
  }[variant];

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        sizeMap,
        variantClass,
        'rounded-md inline-flex items-center gap-2 font-medium whitespace-nowrap cursor-pointer transition-transform',
        'active:scale-[0.97]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      {effectiveLeadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});
