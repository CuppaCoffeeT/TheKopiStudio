/**
 * useOwnClientOptions — id + name of the viewer's OWN customers, for the
 * Overview tool-shortcut picker.
 *
 * Own-book only by explicit `user_id` filter, not by RLS — see
 * `getOwnClientOptions` for why the two are not the same boundary here. The
 * advisor id is part of the query key for the same reason `useCustomerQueue`
 * keys on it: impersonation swaps `useAuth().user` mid-session.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { getOwnClientOptions } from '../api/clientOptionsService';

/**
 * @param enabled `false` parks the query until the picker is actually opened —
 *   the whole book is a wasted fetch on a page the advisor may never launch a
 *   tool from.
 */
export function useOwnClientOptions(enabled = true) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.crmClients.ownOptions(userId ?? 'anonymous'),
    queryFn: () => getOwnClientOptions(userId as string),
    enabled: enabled && Boolean(userId),
  });
}
