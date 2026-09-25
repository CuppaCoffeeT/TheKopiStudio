/**
 * The three years side by side: one stacked bar each (base · monthly bonus ·
 * quarterly · support, scaled to the best year), its total and the breakdown
 * in words; then the 3-year total, the month table and the fine print.
 *
 * Plain flex bars, as the sheet drew them — a stacked bar of four segments
 * needs no chart library, and every figure is printed beside it anyway.
 */

import { cn } from '@/lib/utils';
import { money } from '../../lib/format';
import { barWidths, grandTotal, yearNote } from '../../lib/sapProCopy';
import type { SapIllustration, SapTier } from '../../lib/sapProMath';
import { SapProMonthTable } from './SapProMonthTable';
import { SAP_SERIES, SERIES_FILL } from './sapProSeries';

interface SapProYearsProps {
  illustration: SapIllustration;
  tier: SapTier;
  onNotes: () => void;
}

const SERIF = { fontFamily: 'var(--font-pixel)' };

export function SapProYears({ illustration, tier, onNotes }: SapProYearsProps) {
  const { years } = illustration;
  const widths = barWidths(years);

  return (
    <section
      className="rounded-xl border border-border bg-card px-[22px] py-5 shadow-[var(--card-shadow-rest)]"
      aria-label="Three years"
      data-testid="sap-pro-years"
    >
      <ul className="m-0 mb-3.5 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0 text-[12.5px] text-[color:var(--fg-dim)]">
        {SAP_SERIES.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-1.5">
            <i aria-hidden="true" className={cn('inline-block h-3 w-3 rounded-[3px]', SERIES_FILL[s.key])} />
            {s.label}
          </li>
        ))}
      </ul>

      {years.map((y, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_auto] items-center gap-x-3.5 gap-y-2 border-b border-border py-3.5 last:border-b-0 sm:grid-cols-[90px_1fr_130px]"
          data-testid={`sap-pro-year-row-${i + 1}`}
        >
          <div className="text-[15px] font-semibold text-foreground">
            Year {i + 1}
            <small className="block text-[12px] font-normal text-[color:var(--fg-dim)]">{yearNote(i, tier)}</small>
          </div>
          <div
            className="order-3 col-span-2 flex h-[30px] overflow-hidden rounded-lg bg-secondary sm:order-none sm:col-span-1"
            role="img"
            aria-label={`Year ${i + 1} total ${money(y.total)}`}
          >
            {SAP_SERIES.map((s, k) => (
              <div
                key={s.key}
                className={cn('h-full transition-[width] duration-200 motion-reduce:transition-none', SERIES_FILL[s.key])}
                style={{ width: widths[i][k] }}
              />
            ))}
          </div>
          <div className="text-right text-[24px] leading-none text-foreground tabular-nums" style={SERIF} data-testid={`sap-pro-year-total-${i + 1}`}>
            {money(y.total)}
          </div>
          <p className="order-4 col-span-2 m-0 text-[12.5px] text-[color:var(--fg-dim)] sm:order-none sm:col-start-2">
            Base {money(y.base)} · Monthly bonus {money(y.bonus)} · Quarterly bonus {money(y.quarterly)} · Support{' '}
            {money(y.support)}
          </p>
        </div>
      ))}

      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2 border-t-2 border-foreground pt-4">
        <span className="text-[14px] font-semibold text-foreground">Total over 3 years</span>
        <span className="text-[36px] leading-none text-foreground tabular-nums" style={SERIF} data-testid="sap-pro-grand">
          {money(grandTotal(years))}
        </span>
      </div>

      <SapProMonthTable illustration={illustration} />

      <p className="m-0 mt-4 text-[12.5px] leading-[1.6] text-[color:var(--fg-dim)]">
        Illustration only. Figures are not guaranteed and depend on actual production, scheme conditions and company
        approval.{' '}
        <button
          type="button"
          onClick={onNotes}
          className="text-[color:var(--brown-text)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="sap-pro-to-notes"
        >
          Read the scheme notes
        </button>
        .
      </p>
    </section>
  );
}
