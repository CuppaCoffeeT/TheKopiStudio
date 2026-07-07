/**
 * DateTimeCell — W07 Phase 2 cell-level primitive.
 *
 * Renders a UTC timestamp as SGT `"20/04/26, 14:30"` via `formatDisplayDateTimeShort`
 * (2026-05-29: switched from spelled-out "20 Apr 2026" so the date format matches the
 * DatePicker default app-wide). Use for audit/log columns where both date and time
 * matter. For date-only, use `<DateCell>`.
 */

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatDisplayDateTimeShort } from '@/utils/timezoneUtils';

export interface DateTimeCellProps {
  value: Date | string | null | undefined;
  fallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function DateTimeCell({
  value,
  fallback = '—',
  className,
  style,
}: DateTimeCellProps) {
  const formatted = value ? formatDisplayDateTimeShort(value) : '';
  return (
    <span
      className={cn('text-[12.5px] text-foreground tabular-nums', className)}
      style={{ fontFamily: 'var(--font-sans)', ...style }}
    >
      {formatted || fallback}
    </span>
  );
}
