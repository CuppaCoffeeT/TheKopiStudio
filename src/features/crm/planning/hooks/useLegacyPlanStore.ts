/**
 * Legacy Map persistence — load one customer's saved plan, and save it back.
 *
 * Separate from `lib/useLegacyPlan`, which owns the in-browser plan and its
 * referential integrity. This is the storage half: the query, the mutation and
 * the ownership rule. Keeping them apart means the editing model stays pure
 * and testable without a network.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import { getLegacyPlan, saveLegacyPlan } from '../api/legacyPlansService';
import type { LegacyPlan } from '../lib/legacy';

const SIGN_IN_REQUIRED = 'You must be signed in to save a legacy map';

/** The customer's stored plan. `data` is `null` when they have none yet. */
export function useStoredLegacyPlan(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.crmClients.legacyPlan(clientId ?? ''),
    queryFn: () => getLegacyPlan(clientId as string),
    enabled: Boolean(clientId),
  });
}

/**
 * Save the plan for one customer.
 *
 * Invalidates only this customer's plan key — the Legacy Map is not summarised
 * anywhere else, so there is no list or dashboard figure to refresh. That is
 * deliberately narrower than the client-mutation contract, which fans out to
 * lists and the dashboard because those DO read client rows.
 */
export function useSaveLegacyPlan(clientId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plan: LegacyPlan) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return saveLegacyPlan(clientId, plan, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.legacyPlan(clientId) });
      showSuccess('Legacy map saved');
    },
    onError: (error: Error) => {
      showError('Failed to save the legacy map', error);
    },
  });
}
