/**
 * threadDateFormat — full SGT date + time so the thread row shows the exact
 * moment a message landed (e.g. "20 Apr 2026, 09:30") instead of a relative
 * "3d ago" hint that hides the absolute time.
 */
import { formatDisplayDateTimeLong } from '@/utils/timezoneUtils';

export function formatThreadDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return formatDisplayDateTimeLong(dateStr);
}
