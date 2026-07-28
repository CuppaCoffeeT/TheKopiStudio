/**
 * Shared presentation atoms for the three planning tools.
 *
 * All three answer the same shape of question — "here are your inputs, here is
 * the number that falls out" — so they share the summary ladder, the stat
 * tiles and the money formatting rather than each inventing their own.
 *
 * Formatting lives in `../lib/format` — pure functions exported beside
 * components trip `react-refresh/only-export-components`.
 */

import type { ReactNode } from 'react';
import {
  SelectMenu,
  SelectMenuContent,
  SelectMenuItem,
  SelectMenuTrigger,
  SelectMenuValue,
} from '@/components/primitives/overlays/SelectMenu';
import { cn } from '@/lib/utils';

interface ToolPanelProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
}

/** A cream panel with the 2a uppercase tracked label. */
export function ToolPanel({ label, children, className, testId }: ToolPanelProps) {
  return (
    <section
      data-testid={testId}
      className={cn(
        'rounded-xl border border-border bg-card px-[22px] py-5 shadow-[var(--card-shadow-rest)]',
        className,
      )}
    >
      <h2 className="m-0 mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </h2>
      {children}
    </section>
  );
}

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

export interface ToolSelectOption {
  value: string;
  label: string;
}

interface ToolSelectProps {
  value: string;
  onChange: (next: string) => void;
  options: ToolSelectOption[];
  /** Required — these selects sit inside `Field`, which renders no <label>. */
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  testId?: string;
}

/**
 * The tools' dropdown.
 *
 * Wraps `SelectMenu` (Radix) rather than the native `Select`, which
 * `no-restricted-imports` bans app-wide — native OS dropdown chrome cannot be
 * themed to the 2a palette. Collapsing the five-part composition into one
 * options-array call keeps the tool pages readable; they use selects in five
 * places between them.
 */
export function ToolSelect({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  className,
  testId,
}: ToolSelectProps) {
  return (
    <SelectMenu value={value} onValueChange={onChange}>
      <SelectMenuTrigger aria-label={ariaLabel} className={className} data-testid={testId}>
        <SelectMenuValue placeholder={placeholder} />
      </SelectMenuTrigger>
      <SelectMenuContent>
        {options.map((option) => (
          <SelectMenuItem key={option.value} value={option.value}>
            {option.label}
          </SelectMenuItem>
        ))}
      </SelectMenuContent>
    </SelectMenu>
  );
}

/** A quiet note under a tool — assumptions, caveats, statutory references. */
export function ToolNote({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <p
      className="m-0 mt-[22px] text-[12px] leading-[1.6] text-[color:var(--fg-dim)]"
      data-testid={testId}
    >
      {children}
    </p>
  );
}
