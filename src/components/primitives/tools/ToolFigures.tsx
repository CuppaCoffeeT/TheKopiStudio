/**
 * The tools' two ways of showing a number: the headline tile grid, and one
 * line of a running summary ladder.
 *
 * Split out of `ToolAtoms.tsx` (2026-08-19) when that file crossed the 200-LOC
 * ceiling. They belong together — both are "a figure and the label that says
 * what it counts", both use Instrument Serif for the numeral over IBM Plex Sans
 * for the label, and a tool that shows one usually shows the other (the tax
 * calculator heads with `ToolStatGrid` and closes with a `SummaryRow` ladder).
 *
 * Formatting helpers live beside their own tools — pure functions exported
 * next to components trip `react-refresh/only-export-components`.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ToolStat {
  label: string;
  value: string;
  hint?: string;
  /** `positive` reads sage, `negative` terracotta — fills only, never raw text. */
  tone?: 'neutral' | 'positive' | 'negative';
  testId?: string;
}

const STAT_TONE: Record<NonNullable<ToolStat['tone']>, string> = {
  neutral: 'text-foreground',
  positive: 'text-[color:var(--sage-text)]',
  negative: 'text-[color:var(--negative-text)]',
};

/** The headline figures for a tool — serif numerals over sans labels. */
export function ToolStatGrid({ stats, testId }: { stats: ToolStat[]; testId?: string }) {
  return (
    <dl
      className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-[color:var(--border-soft)] lg:grid-cols-4"
      data-testid={testId}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card px-[18px] py-4" data-testid={stat.testId}>
          <dd
            className={cn('m-0 text-[26px] leading-none', STAT_TONE[stat.tone ?? 'neutral'])}
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            {stat.value}
          </dd>
          <dt className="mt-1.5 text-[12px] font-medium leading-tight text-foreground">
            {stat.label}
          </dt>
          {stat.hint && (
            <p className="m-0 mt-0.5 text-[11.5px] leading-tight text-muted-foreground">
              {stat.hint}
            </p>
          )}
        </div>
      ))}
    </dl>
  );
}

interface SummaryRowProps {
  label: ReactNode;
  value: ReactNode;
  /** Renders the row as the bottom-line total — heavier, hairline above. */
  total?: boolean;
  /** Deduction styling: the value reads as a subtraction. */
  muted?: boolean;
  testId?: string;
}

/** One line of a running summary ladder (assessable → reliefs → chargeable → tax). */
export function SummaryRow({ label, value, total, muted, testId }: SummaryRowProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex items-baseline justify-between gap-4 py-2',
        total && 'mt-1 border-t border-border pt-3',
      )}
    >
      <span
        className={cn(
          'text-[12.5px]',
          total ? 'font-semibold text-foreground' : 'text-[color:var(--fg-dim)]',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'flex-none tabular-nums',
          total ? 'text-[22px] text-foreground' : 'text-[13px]',
          !total && muted && 'text-muted-foreground',
          !total && !muted && 'text-foreground',
        )}
        style={total ? { fontFamily: 'var(--font-pixel)' } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
