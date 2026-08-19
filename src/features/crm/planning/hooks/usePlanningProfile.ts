/**
 * Save mutations for the two planning tools that now write back.
 *
 * Both follow `useUpdateClient`'s contract rather than inventing one: stamp the
 * signed-in user, invalidate `lists()` + `detail(id)` + the dashboard, toast
 * through `showSuccess`/`showError`, and drop a `customer_activity` line so the
 * customer's timeline shows the save next to the "tool opened" that preceded
 * it.
 *
 * The activity entry carries no `changes` diff, deliberately. A tax
 * calculation is a dozen figures moving together — "Tax calculator saved" is
 * the event an advisor scanning a timeline wants, and nineteen relief rows
 * under it is noise. The columns themselves are the current state; this is the
 * record that it was set.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import { useLogActivity } from '../../hooks/useCustomerActivity';
import {
  saveSrsProfile,
  saveTaxProfile,
  type SrsProfileInput,
  type TaxProfileInput,
} from '../api/planningProfileService';

const SIGN_IN_REQUIRED = 'You must be signed in to save to a customer';

/**
 * @param clientId the customer being saved to
 * @param ownerId  the customer's `user_id` — RLS checks the OWNER, not the viewer
 */
function usePlanningSave<TInput>(
  clientId: string | null,
  ownerId: string | null,
  write: (clientId: string, input: TInput, userId: string) => Promise<void>,
  activity: { tool: 'tax-calculator' | 'srs-planner'; summary: string; toast: string },
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async (input: TInput) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      if (!clientId) throw new Error('Choose a customer before saving');
      await write(clientId, input, user.id);
      if (ownerId) {
        void logActivity({
          clientId,
          ownerId,
          type: 'tool_saved',
          tool: activity.tool,
          summary: activity.summary,
        });
      }
    },
    onSuccess: () => {
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(clientId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess(activity.toast);
    },
    onError: (error: Error) => {
      showError('Not saved', error);
    },
  });
}

export function useSaveTaxProfile(clientId: string | null, ownerId: string | null) {
  return usePlanningSave<TaxProfileInput>(clientId, ownerId, saveTaxProfile, {
    tool: 'tax-calculator',
    summary: 'Tax calculation saved to the record',
    toast: 'Saved to customer',
  });
}

export function useSaveSrsProfile(clientId: string | null, ownerId: string | null) {
  return usePlanningSave<SrsProfileInput>(clientId, ownerId, saveSrsProfile, {
    tool: 'srs-planner',
    summary: 'SRS plan saved to the record',
    toast: 'Saved to customer',
  });
}
