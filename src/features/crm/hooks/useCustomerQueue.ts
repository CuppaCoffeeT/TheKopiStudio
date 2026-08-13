/**
 * useCustomerQueue — the Overview action queue, scoped to the viewer's OWN book.
 *
 * The fetch + the in-memory join live in `api/customerQueueService`; the rules
 * that decide who surfaces live in `lib/customerJourney`. This hook is only the
 * React Query wiring.
 *
 * The advisor id is part of the query key, not just the filter — impersonation
 * swaps `useAuth().user` mid-session, and a shared key would have served the
 * previous advisor's queue from cache.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { getCustomerQueue } from '../api/customerQueueService';

/**
 * @param enabled `false` parks the query — /dashboard renders for viewers who
 *   do not hold `/clients`, and a queue over a book they cannot read would be
 *   an empty state that looks like "you are all caught up".
 */
export function useCustomerQueue(enabled = true) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.crmDashboard.customerQueue(userId ?? 'anonymous'),
    queryFn: () => getCustomerQueue(userId as string),
    enabled: enabled && Boolean(userId),
  });
}
