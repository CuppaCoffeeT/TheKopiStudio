import { cn } from '@/lib/utils';

/**
 * LegendRow — color dot + label + optional value, horizontal wrap.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: Geist Mono 11px label · tabular-nums value.
 */

export interface LegendItem {
  label: React.ReactNode;
  color: string;
  value?: React.ReactNode;
}

interface LegendRowProps extends React.HTMLAttributes<HTMLDivElement> {
  items: LegendItem[];
}

export function LegendRow({ items, className, ...props }: LegendRowProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-3.5 gap-y-1.5', className)}
      {...props}
    >
      {items.map((it, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span
            className="inline-block flex-shrink-0 rounded-sm"
            style={{ width: 8, height: 8, background: it.color }}
          />
          <span className="text-zinc-700 dark:text-zinc-300">{it.label}</span>
          {it.value != null && (
            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
              {it.value}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
