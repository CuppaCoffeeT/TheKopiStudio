import { cn } from '@/lib/utils';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
  /** Inverts colors for use on dark tooltip surfaces. */
  invert?: boolean;
}

/**
 * Keyboard shortcut pill. Mono face (`--font-mono`), hairline border.
 * Used in tooltips, dropdown items, launcher hints.
 */
export function Kbd({ children, className, invert = false }: KbdProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'px-1.5 py-[1px] rounded',
        'text-[10.5px] tracking-wider',
        'border',
        // `invert` is worn on the tooltip panel, which is `bg-foreground` —
        // warm ink #3A2E24. The chip is therefore a lighter warm ink with a
        // cream glyph, never a cool zinc block.
        invert
          ? 'bg-[color:var(--fg-dim)] text-[color:var(--surface)] border-[color:var(--fg-muted)]'
          : 'bg-secondary text-[color:var(--fg-dim)] border-border',
        className
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </span>
  );
}
