/**
 * useCustomerActivity — the merged automatic + manual timeline for one
 * customer, and the writer that appends to it.
 *
 * The writer is NOT a `useMutation`. Logging is a side effect of work that has
 * already succeeded: there is no pending state to render, no error to show and
 * nothing to retry — a mutation's whole apparatus would be dead weight, and its
 * `onError` would surface a toast about the audit trail over a save that
 * worked. It does invalidate the timeline query, so an entry written while the
 * Activity tab is open appears without a reload.
 *
 * `ownerId` is the customer's `user_id`, not the viewer's. They are the same
 * for an advisor working their own book and different for a manager — and the
 * RLS policy checks the OWNER, so passing the viewer would silently drop every
 * manager-written row.
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { recordActivity, type ActivityInput } from '@/lib/activityLog';
import { queryKeys } from '@/utils/queryKeys';
import { listCustomerActivity } from '../api/customerActivityService';

export function useCustomerActivity(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.crmClients.activity(clientId ?? ''),
    queryFn: () => listCustomerActivity(clientId as string),
    enabled: Boolean(clientId),
  });
}

/** Everything `recordActivity` needs except the actor, which the hook knows. */
export type LogActivityInput = Omit<ActivityInput, 'actorId'>;

/**
 * A stable `log(...)` for the current user.
 *
 * With no signed-in user there is no actor to stamp, so it records nothing
 * rather than inserting a row RLS would reject.
 */
export function useLogActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const actorId = user?.id;

  return useCallback(
    async (input: LogActivityInput) => {
      if (!actorId) return false;
      const ok = await recordActivity({ ...input, actorId });
      if (ok) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.crmClients.activity(input.clientId),
        });
      }
      return ok;
    },
    [actorId, queryClient],
  );
}
