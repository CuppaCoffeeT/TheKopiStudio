import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * KpiIndexCard — the Kopi 2a "Overview" KPI tile (/dashboard, comp mockup [0]).
 *
 * Shape per KOPI_2A_SPEC → "Archetype — dashboard" §2: uppercase module label
 * left and an Instrument Serif index numeral right on one baseline-aligned row,
 * then the serif 32px figure with its unit inline in 13px sans, then a 12.5px
 * meta line. Card cream, hairline border, radius 12px, padding 20px 22px.
 * The tile rests FLAT — the lift is the cream-on-cream colour step, not a
 * shadow — and only an interactive tile takes the warmed hover shadow plus
 * `--border-hover`.
 *
 * Deliberately NOT `KpiTile`: that primitive carries icons, delta chips,
 * count-up tickers and sparklines for the /crm module dashboard and keeps its
 * own adopters. This one is the quiet-broadsheet variant and stays typographic.
 *
 * The index numeral is the one sanctioned RAW `--brand-brown` text in the app —
 * it sits exactly on the 18px Instrument Serif floor (spec, "Accessibility
 * override"). Label and meta read `--fg-muted`, which clears AA on card cream
 * (4.72) but NOT on the page cream (4.12): render this tile on a card ground.
 *
 * Usage:
 *   <KpiIndexCard label="Clients · CRM" index="02" value="86" unit="clients"
 *                 meta="4 reviews due" onClick={() => navigate('/clients')} />
 */

export interface KpiIndexCardProps {
  /** Uppercase module label, top-left. */
  label: string;
  /** Index numeral, top-right — "01", "02". Decorative; hidden from AT. */
  index: string;
  /** The figure itself, already formatted for display. */
  value: string;
  /** Inline unit after the figure ("clients", "profiles saved"). */
  unit?: string;
  /** 12.5px line under the figure. */
  meta?: ReactNode;
  /** Present → the whole tile is a button (hover lift + brown focus ring). */
  onClick?: () => void;
  /** Forwarded as `data-testid` on the tile root. */
  testId?: string;
  className?: string;
}

export const KpiIndexCard = forwardRef<HTMLDivElement, KpiIndexCardProps>(function KpiIndexCard(
  { label, index, value, unit, meta, onClick, testId, className },
  ref,
) {
  const interactive = typeof onClick === 'function';

  return (
    <div
      ref={ref}
      data-testid={testId}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onClick?.();
            }
          : undefined
      }
      className={cn(
        'border border-border bg-card px-[22px] py-5 shadow-[var(--card-shadow-rest)]',
        interactive &&
          cn(
            'cursor-pointer transition-shadow',
            'hover:border-[color:var(--border-hover)] hover:shadow-[var(--card-shadow-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          ),
        className,
      )}
      style={{ borderRadius: 'var(--card-radius)' }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--fg-muted)]">
          {label}
        </span>
        <span
          aria-hidden
          className="flex-none text-[18px] leading-none"
          style={{ fontFamily: 'var(--font-pixel)', color: 'var(--brand-brown)' }}
        >
          {index}
        </span>
      </div>

      <p
        className="mt-2 mb-0.5 text-[32px] leading-[1.05] tabular-nums"
        style={{ fontFamily: 'var(--font-pixel)', color: 'var(--fg)' }}
      >
        {value}
        {unit && (
          <span
            className="ml-1.5 text-[13px]"
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--fg-muted)' }}
          >
            {unit}
          </span>
        )}
      </p>

      {meta && (
        <p className="text-[12.5px] leading-[1.5] text-[color:var(--fg-muted)]">{meta}</p>
      )}
    </div>
  );
});
