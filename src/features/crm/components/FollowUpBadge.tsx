/**
 * FollowUpBadge — the red/amber/blue follow-up pill (legacy ClientCard badge).
 *
 * Pure presenter over `lib/followUps.followUpBadge`: overdue → danger (red),
 * urgent (≤7 days) → warning (amber), upcoming → info (blue) on the Badge
 * primitive. The rendered text is the legacy detail string ("3 days overdue" /
 * "5 days") with the legacy label as the tooltip. Callers resolve the source
 * date themselves (list rows pass `next_review_date`; the detail header passes
 * `resolveClientFollowUp(...).date`) so this stays a dumb date→pill mapping.
 */

import type { ReactNode } from 'react';
import { Badge } from '@/components/primitives/shell/Badge';
import { getCurrentSingaporeTime } from '@/utils/timezoneUtils';
import { followUpBadge } from '../lib/followUps';
import { FOLLOW_UP_BADGE_TONES } from './followUpTone';

export interface FollowUpBadgeProps {
  /** 'YYYY-MM-DD' source date (interaction follow-up or next review). Null-safe. */
  date: string | null | undefined;
  /** Injectable clock for tests; defaults to the Singapore "now". */
  refDate?: Date;
  /** Rendered when there is no source date. Defaults to an em-dash. */
  fallback?: ReactNode;
  className?: string;
  /** Forwarded as `data-testid` on the badge (or the fallback span). */
  testId?: string;
}

export function FollowUpBadge({ date, refDate, fallback = '—', className, testId }: FollowUpBadgeProps) {
  const badge = followUpBadge(date, refDate ?? getCurrentSingaporeTime());

  if (!badge) {
    return (
      <span className={className} data-testid={testId}>
        {fallback}
      </span>
    );
  }

  return (
    <Badge
      tone={FOLLOW_UP_BADGE_TONES[badge.tone]}
      title={badge.label}
      className={className}
      data-testid={testId}
    >
      {badge.detail}
    </Badge>
  );
}
