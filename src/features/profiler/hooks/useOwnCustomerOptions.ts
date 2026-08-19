/**
 * useOwnCustomerOptions — id + name of the viewer's OWN customers, for the
 * profiler's customer bar.
 *
 * Shares `queryKeys.crmClients.ownOptions` with the CRM's picker on purpose:
 * it is the same list, so both should hit one cache entry and both should
 * refresh when a customer is added. Only the query FUNCTION is the profiler's
 * own (see `api/customerOptionsService` for why it may not be imported).
 *
 * The advisor id is part of the key because the list is `user_id`-filtered
 * rather than RLS-scoped, and impersonation swaps `useAuth().user` without a
 * remount — a shared key would serve the previous advisor's book from cache.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { getOwnCustomerOptions } from '../api/customerOptionsService';

/**
 * @param enabled `false` parks the query. The wizard only shows the picker on
 *   the intake screen for a signed-in advisor, and an anonymous visitor has no
 *   book at all — neither should cost a fetch.
 */
export function useOwnCustomerOptions(enabled = true) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.crmClients.ownOptions(userId ?? 'anonymous'),
    queryFn: () => getOwnCustomerOptions(userId as string),
    enabled: enabled && Boolean(userId),
  });
}
