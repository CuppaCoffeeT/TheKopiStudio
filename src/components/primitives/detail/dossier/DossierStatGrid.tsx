/**
 * DossierStatGrid — the 2a detail panel's stat columns.
 *
 * Each cell is an 11px `--fg-muted` label over an Instrument Serif 24px ink
 * value (2px apart), laid out `repeat(4, 1fr)` with a 14px gap on desktop and
 * folded to two columns on narrow viewports. 24px clears the 18px serif floor.
 *
 * Rendered as a `<dl>` so the label/value pairing survives a screen reader.
 *
 * Spec: KOPI_2A_SPEC.md → "Archetype — detail" → Stat panel.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DossierStat {
  label: ReactNode;
  value: ReactNode;
  /** Forwarded as `data-testid` on the value cell. */
  testId?: string;
}

interface DossierStatGridProps {
  stats: DossierStat[];
  /** Columns at >= sm. Default 4 — the comp's `repeat(4, 1fr)`. */
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLUMNS: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

export function DossierStatGrid({ stats, columns = 4, className }: DossierStatGridProps) {
  return (
    <dl className={cn('m-0 grid grid-cols-2 gap-3.5', COLUMNS[columns], className)}>
      {stats.map((stat, i) => (
        <div key={i} className="min-w-0">
          <dt className="text-[11px] leading-snug text-muted-foreground">{stat.label}</dt>
          <dd
            className="m-0 mt-0.5 break-words text-[24px] leading-tight text-foreground"
            style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
            data-testid={stat.testId}
          >
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
