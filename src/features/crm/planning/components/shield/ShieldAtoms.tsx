/**
 * Shield comparison atoms — the pieces every tab of tool 07 repeats.
 *
 * INSURER COLOUR: Singlife = brown, Income = sage, carried ONLY as fills (a
 * dot, a top rule). The source sheet coloured the column-header TEXT, which
 * the Kopi light contract forbids for brown (.claude/rules/light-theme.md →
 * "Brown is punctuation") — the dot beside an ink label does the same job.
 */

import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Insurer = 'singlife' | 'income';

const INSURER_NAME: Record<Insurer, string> = { singlife: 'Singlife', income: 'Income' };

const INSURER_FILL: Record<Insurer, string> = {
  singlife: 'bg-[color:var(--brand-brown)]',
  income: 'bg-[color:var(--brand-sage)]',
};

const INSURER_RULE: Record<Insurer, string> = {
  singlife: 'border-t-[color:var(--brand-brown)]',
  income: 'border-t-[color:var(--brand-sage)]',
};

export function InsurerMark({ insurer, children }: { insurer: Insurer; children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={cn('h-2 w-2 flex-none rounded-full', INSURER_FILL[insurer])} />
      {children ?? INSURER_NAME[insurer]}
    </span>
  );
}

/** A raised card topped with the insurer's colour rule. */
export function InsurerCard({ insurer, children }: { insurer: Insurer; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-t-[3px] border-border bg-card px-[18px] py-4 shadow-[var(--card-shadow-rest)]',
        INSURER_RULE[insurer],
      )}
    >
      {children}
    </div>
  );
}

/** The terracotta-ruled callout for what a client must hear before signing. */
export function ShieldFlag({ children }: { children: ReactNode }) {
  return (
    <div className="my-3 rounded-r-lg border-l-[3px] border-l-[color:var(--brand-terracotta)] bg-card px-4 py-3 text-[13px] leading-[1.6] text-foreground">
      {children}
    </div>
  );
}

export function ShieldHeading({ children }: { children: ReactNode }) {
  return <h3 className="m-0 mb-2 mt-7 text-[14px] font-semibold text-foreground">{children}</h3>;
}

/** Horizontal scroller + table shell. Cell classes: `shieldTableClasses.ts`. */
export function ShieldTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <table className={cn('w-full border-collapse text-[13px] tabular-nums', className)}>{children}</table>
    </div>
  );
}

interface ScenarioProps {
  title: string;
  /** The one-line answer shown while collapsed. */
  summary: string;
  children: ReactNode;
  testId?: string;
}

/** A collapsible worked example — native <details>, so it works without JS state. */
export function ShieldScenario({ title, summary, children, testId }: ScenarioProps) {
  return (
    <details
      data-testid={testId}
      className="group my-3 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--card-shadow-rest)]"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-baseline justify-between gap-3.5 px-4 py-3 [&::-webkit-details-marker]:hidden group-open:border-b group-open:border-border">
        <span className="flex items-baseline gap-2 text-[14px] font-semibold text-foreground">
          <ChevronRight
            aria-hidden="true"
            className="h-3.5 w-3.5 flex-none translate-y-0.5 transition-transform group-open:rotate-90"
          />
          {title}
        </span>
        <span className="text-right text-[12.5px] text-[color:var(--fg-dim)]">{summary}</span>
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  );
}
