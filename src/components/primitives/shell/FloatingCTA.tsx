import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingCTAProps {
  label: string;
  /** Circular mobile variant (just + icon). Default shows label on tablet+. */
  circle?: boolean;
  /** Show on all viewports. Defaults to `false` — FloatingCTA is MOBILE-ONLY
   *  by design. Desktop pages render an inline `<Button variant="primary">`
   *  in the FilterBar row or page header instead. Opt-in only when the page
   *  genuinely needs a persistent floating action at all widths (rare). */
  allViewports?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * Bottom-right pill — persistent primary action on **mobile** list pages.
 * Hidden on ≥ md by default. 48×48 circle on mobile, 48×auto pill with label.
 * Slate-800 bg, large shadow, sticky above pagination.
 *
 * Caller wraps in a positioned container or uses `fixed` class via `className`.
 * Desktop equivalent: render an inline `<Button variant="primary">` —
 * never show FloatingCTA alongside an inline desktop Button unless `allViewports` is set.
 */
export function FloatingCTA({ label, circle = false, allViewports = false, icon, onClick, className, ...rest }: FloatingCTAProps) {
  return (
    <button
      onClick={onClick}
      aria-label={circle ? label : undefined}
      data-testid={rest['data-testid']}
      className={cn(
        'h-12 inline-flex items-center justify-center gap-2',
        'bg-primary hover:bg-slate-900 dark:hover:bg-white',
        'text-primary-foreground',
        'shadow-[0_10px_24px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.08)]',
        'font-semibold text-[13px] tracking-[0.01em]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:scale-95 transition-transform',
        circle ? 'w-12 rounded-full' : 'px-4.5 rounded-full',
        !allViewports && 'md:hidden',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {icon ?? <Plus className="w-3.5 h-3.5" strokeWidth={1.8} />}
      {!circle && <span>{label}</span>}
    </button>
  );
}
