/**
 * Policy mutations — create / update / soft-delete one policy (projections
 * replaced inside the services; every projection error throws into the
 * mutation, corrected legacy bug 4).
 *
 * Child-mutation invalidation contract: `crmClients.detail(clientId)` (covers
 * the policies sub-key) + `crmDashboard.all` (active count + premium tiles).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import { createPolicy, softDeletePolicy, updatePolicy } from '../api/policiesService';
import type { CrmPolicyInput } from '../types';

const SIGN_IN_REQUIRED = 'You must be signed in to manage policies';

export function useCreatePolicy(clientId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CrmPolicyInput) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return createPolicy(clientId, input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Policy added');
    },
    onError: (error: Error) => {
      showError('Failed to add policy', error);
    },
  });
}

export function useUpdatePolicy(clientId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ policyId, input }: { policyId: string; input: CrmPolicyInput }) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return updatePolicy(policyId, input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Policy updated');
    },
    onError: (error: Error) => {
      showError('Failed to update policy', error);
    },
  });
}

export function useSoftDeletePolicy(clientId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (policyId: string) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return softDeletePolicy(policyId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Policy deleted');
    },
    onError: (error: Error) => {
      showError('Failed to delete policy', error);
    },
  });
}
