/**
 * useCustomerQueue — the Overview action queue, RLS-scoped to the viewer's book.
 *
 * The fetch + the in-memory join live in `api/customerQueueService`; the rules
 * that decide who surfaces live in `lib/customerJourney`. This hook is only the
 * React Query wiring.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { getCustomerQueue } from '../api/customerQueueService';

/**
 * @param enabled `false` parks the query — /dashboard renders for viewers who
 *   do not hold `/clients`, and a queue over a book they cannot read would be
 *   an empty state that looks like "you are all caught up".
 */
export function useCustomerQueue(enabled = true) {
  return useQuery({
    queryKey: queryKeys.crmDashboard.customerQueue(),
    queryFn: getCustomerQueue,
    enabled,
  });
}
