/**
 * QueueStatStrip — the four figures under the Overview greeting.
 *
 * The 4a comp draws these as a compact four-up band, not as the four full KPI
 * cards `KpiIndexCard` builds: on this page the figures are a *summary of the
 * queue below*, so they stay quiet and let the actionable rows carry the weight.
 *
 * Serif numerals sit at 28px, comfortably over the 18px Instrument Serif floor;
 * every label under them is IBM Plex Sans on the ink ladder.
 */

import { cn } from '@/lib/utils';

export interface QueueStat {
  value: number;
  label: string;
  /** Second line — the qualifier the comp prints under the label. */
  hint?: string;
  testId?: string;
}

interface QueueStatStripProps {
  stats: QueueStat[];
  className?: string;
}

export function QueueStatStrip({ stats, className }: QueueStatStripProps) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-[color:var(--border-soft)] lg:grid-cols-4',
        className,
      )}
      data-testid="home-queue-stats"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card px-[18px] py-4" data-testid={stat.testId}>
          <dd
            className="m-0 text-[28px] leading-none text-foreground"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            {stat.value.toLocaleString('en-SG')}
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
