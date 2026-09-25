/**
 * The average month of the chosen year as a sum — base + support + monthly
 * bonus = per month — with the quarterly bonus shown beside it, since it lands
 * once a quarter rather than every month.
 */

import { cn } from '@/lib/utils';
import { money } from '../../lib/format';
import { averageMonth, bonusLabel, equationTitle, quarterText } from '../../lib/sapProCopy';
import type { SapTier, SapYear } from '../../lib/sapProMath';
import { CHOICE_BASE, CHOICE_OFF, CHOICE_ON, SERIES_RULE, type SapSeries } from './sapProSeries';

interface SapProEquationProps {
  years: readonly SapYear[];
  year: number;
  onYear: (next: number) => void;
  tier: SapTier;
  custom: boolean;
  rate: number;
}

const SERIF = { fontFamily: 'var(--font-pixel)' };

function Term({ series, value, label, testId }: { series: SapSeries; value: number; label: string; testId: string }) {
  return (
    <div className={cn('rounded-lg border-t-[5px] bg-secondary px-3 py-3.5', SERIES_RULE[series])} data-testid={testId}>
      <div className="text-[26px] leading-none text-foreground tabular-nums" style={SERIF}>
        {money(value)}
      </div>
      <div className="mt-1.5 text-[12.5px] leading-tight text-[color:var(--fg-dim)]">{label}</div>
    </div>
  );
}

const Op = ({ children }: { children: string }) => (
  <div className="hidden self-center text-[22px] font-semibold text-muted-foreground sm:block" aria-hidden="true">
    {children}
  </div>
);

export function SapProEquation({ years, year, onYear, tier, custom, rate }: SapProEquationProps) {
  const eq = averageMonth(years[year - 1]);

  return (
    <section
      className="rounded-xl border border-border bg-card px-[22px] py-5 shadow-[var(--card-shadow-rest)]"
      data-testid="sap-pro-equation"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="m-0 text-[18px] font-semibold text-foreground" data-testid="sap-pro-eq-title">
          {equationTitle(custom, year)}
        </h2>
        <div className="inline-flex gap-1" role="group" aria-label="Year">
          {[1, 2, 3].map((y) => (
            <button
              key={y}
              type="button"
              aria-pressed={y === year}
              onClick={() => onYear(y)}
              className={cn(CHOICE_BASE, 'min-h-11 rounded-full px-3.5 text-[13.5px]', y === year ? CHOICE_ON : CHOICE_OFF)}
              data-testid={`sap-pro-year-${y}`}
            >
              Year {y}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.2fr]">
        <Term series="base" value={eq.base} label="Base commission" testId="sap-pro-eq-base" />
        <Op>+</Op>
        <Term series="support" value={eq.support} label="Income support" testId="sap-pro-eq-support" />
        <Op>+</Op>
        <Term series="bonus" value={eq.bonus} label={bonusLabel(tier, year)} testId="sap-pro-eq-bonus" />
        <Op>=</Op>
        <div className="col-span-2 rounded-lg bg-foreground px-3 py-3.5 text-background sm:col-span-1" data-testid="sap-pro-eq-total">
          <div className="text-[26px] leading-none tabular-nums" style={SERIF}>
            {money(eq.total)}
          </div>
          <div className="mt-1.5 text-[12.5px] leading-tight text-background/80">Per month</div>
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-dashed border-[color:var(--chart-ramp-3)] p-3.5"
        data-testid="sap-pro-quarter"
      >
        <p className="m-0 text-[13px] text-[color:var(--fg-dim)]">{quarterText(eq.quarterBase, rate)}</p>
        <p className="m-0 text-[22px] text-foreground tabular-nums" style={SERIF}>
          {money(eq.quarterly)}
        </p>
      </div>
    </section>
  );
}
