/**
 * Interaction mutations — create / update / soft-delete one interaction
 * (followUp '' → null happens in mapping; a cleared follow-up clears the
 * dashboard count, hence the crmDashboard invalidation).
 *
 * Child-mutation invalidation contract: `crmClients.detail(clientId)` (covers
 * the interactions sub-key) + `crmDashboard.all`.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import {
  createInteraction,
  softDeleteInteraction,
  updateInteraction,
} from '../api/interactionsService';
import type { CrmInteractionInput } from '../types';

const SIGN_IN_REQUIRED = 'You must be signed in to manage interactions';

export function useCreateInteraction(clientId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CrmInteractionInput) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return createInteraction(clientId, input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Interaction logged');
    },
    onError: (error: Error) => {
      showError('Failed to log interaction', error);
    },
  });
}

export function useUpdateInteraction(clientId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CrmInteractionInput }) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return updateInteraction(id, input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Interaction updated');
    },
    onError: (error: Error) => {
      showError('Failed to update interaction', error);
    },
  });
}

export function useSoftDeleteInteraction(clientId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return softDeleteInteraction(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Interaction deleted');
    },
    onError: (error: Error) => {
      showError('Failed to delete interaction', error);
    },
  });
}
