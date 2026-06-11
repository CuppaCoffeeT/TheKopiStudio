/**
 * DateCell — W07 Phase 2 cell-level primitive.
 *
 * Table-cell wrapper that renders a UTC timestamp as Singapore local time using
 * `timezoneUtils.formatDisplayDateShort` — the project's canonical "20/04/26"
 * (dd/mm/yy) display (2026-05-29: switched from spelled-out "20 Apr 2026" so the
 * cell date format matches the DatePicker default app-wide). One source of truth
 * for cell-level date formatting across every DataTable.
 *
 * Rules this enforces:
 *   - `.claude/rules/timezone.md` — SGT UTC+8 display
 *   - Never calls raw `date-fns.format()` on display paths
 *
 * Consume from a DataTable column:
 *   ```tsx
 *   { accessorKey: 'created_at', cell: (ctx) => <DateCell value={ctx.getValue()} /> }
 *   ```
 */

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatDisplayDateShort } from '@/utils/timezoneUtils';

export interface DateCellProps {
  /** UTC ISO string or `Date` from the database. Null-safe. */
  value: Date | string | null | undefined;
  /** Rendered when `value` is empty / invalid. Defaults to an em-dash. */
  fallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function DateCell({
  value,
  fallback = '—',
  className,
  style,
}: DateCellProps) {
  const formatted = value ? formatDisplayDateShort(value) : '';
  return (
    <span
      className={cn('text-[12.5px] text-zinc-800 dark:text-zinc-200 tabular-nums', className)}
      style={{ fontFamily: 'var(--font-sans)', ...style }}
    >
      {formatted || fallback}
    </span>
  );
}
