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
 * CTA primary = gold (--cta-primary-bg, 1a Masthead 2026-07-21): hover
 * --cta-primary-bg-hover, active --cta-primary-bg-active, text --cta-primary-fg.
 * Secondary/ghost = cream text, hairline border or none, hover card bg.
 * Destructive = red-700.
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
          'bg-transparent text-muted-foreground',
          'hover:bg-card hover:text-[color:var(--fg-dim)]',
          'active:scale-[0.94] active:bg-secondary',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
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
    md: 'h-9 px-4 text-[12.5px]',
    lg: 'h-11 px-5 text-sm',
  }[size];

  const variantClass = {
    primary:
      'bg-[var(--cta-primary-bg)] hover:bg-[var(--cta-primary-bg-hover)] active:bg-[var(--cta-primary-bg-active)] text-[color:var(--cta-primary-fg)] font-semibold',
    destructive: 'bg-red-700 hover:bg-red-800 active:bg-red-900 text-white',
    ghost: 'bg-transparent hover:bg-card active:bg-secondary text-[color:var(--fg-dim)]',
    outline: 'bg-transparent hover:bg-card active:bg-secondary text-[color:var(--fg-dim)] border border-border',
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
        'rounded-lg inline-flex items-center gap-2 font-medium whitespace-nowrap cursor-pointer transition-transform',
        'active:scale-[0.97]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
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
