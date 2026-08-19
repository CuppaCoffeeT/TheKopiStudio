/**
 * ToolPageShell — the page surface and measure every tool sits on.
 *
 * Extracted 2026-08-19 from `PlanningToolFrame`, which owned both the STATE
 * (which customer, loading, error) and this container. Only the container is
 * shareable: the profiler resolves its customer through a different contract
 * entirely, but it must land on the same padding, the same cream and the same
 * column as tools 04–06.
 *
 * TWO MEASURES, and the difference is content, not taste:
 *
 * - `wide` (`max-w-5xl`) — the planning tools and the client report. Their
 *   bodies are two-column `1fr 360px` grids: inputs on the left, the summary
 *   ladder pinned right. 5xl is what holds that pair; their actual READING
 *   column inside it is ~640px.
 * - `reading` (`max-w-[42rem]`) — the profiler wizard. One column of prose and
 *   choices, so the wide measure would stretch a four-option radio row to
 *   1024px, a line length none of the other tools actually use either. 42rem
 *   IS the tools' reading column, arrived at from the other direction.
 *
 * `max-w-[42rem]` is Tailwind's OWN stock `2xl`, written as a literal on
 * purpose: `src/index.css` sets `--container-2xl: 1400px` as a leftover v3
 * `container`-plugin shim, and in v4 that variable IS the source for
 * `max-w-2xl`, so the class silently resolves to 1400px. Do not "simplify" it.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ToolPageShellProps {
  children: ReactNode;
  /** Column width — see the header note. Defaults to the two-column tools. */
  measure?: 'wide' | 'reading';
  /**
   * Landmark element. Tools inside `DashboardLayout` inherit its `<main>` and
   * leave this alone; `/profiler` renders outside that layout and must supply
   * the page's own `main` landmark, or axe's `region` rule has nothing to put
   * the content in.
   */
  as?: 'div' | 'main';
  className?: string;
}

const MEASURE_CLASS = {
  wide: 'max-w-5xl',
  reading: 'max-w-[42rem]',
} as const;

export function ToolPageShell({
  children,
  measure = 'wide',
  as: Element = 'div',
  className,
}: ToolPageShellProps) {
  return (
    <Element className={cn('bg-background px-4 py-6 sm:px-10 sm:py-[34px]', className)}>
      <div className={cn('mx-auto', MEASURE_CLASS[measure])}>{children}</div>
    </Element>
  );
}
