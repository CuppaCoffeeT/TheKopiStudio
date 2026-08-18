/**
 * FollowUpTone → Badge primitive tone — the ONE mapping of the legacy badge
 * tone names (lib/followUps) onto the design-system palette: overdue → danger
 * (red), urgent ≤7 days → warning (amber), upcoming → info (blue). Shared by
 * FollowUpBadge (list rows + detail header) and the ActivityTab follow-up
 * chip so the two surfaces can never drift apart.
 */

import type { BadgeTone } from '@/components/primitives/shell/Badge';
import type { FollowUpTone } from '../lib/followUps';

export const FOLLOW_UP_BADGE_TONES: Record<FollowUpTone, BadgeTone> = {
  overdue: 'danger',
  urgent: 'warning',
  upcoming: 'info',
};
