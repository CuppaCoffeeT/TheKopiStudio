/**
 * Client mutations — create / update / soft-delete one client.
 *
 * Invalidation contract (CRM_MODULE_PRD.md P3): client mutations invalidate
 * the `crmClients` lists, the row's `detail(id)` family (which covers the
 * child sub-keys) and `crmDashboard.all`. The signed-in user id stamps
 * `user_id`/`created_by`/`updated_by` in the services; an unauthenticated
 * call throws into the standard `showError` path.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import { createClient, softDeleteClient, updateClient } from '../api/clientsService';
import type { CrmClientInput } from '../types';

const SIGN_IN_REQUIRED = 'You must be signed in to manage clients';

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CrmClientInput) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return createClient(input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Client added');
    },
    onError: (error: Error) => {
      showError('Failed to add client', error);
    },
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CrmClientInput) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return updateClient(id, input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Client updated');
    },
    onError: (error: Error) => {
      showError('Failed to update client', error);
    },
  });
}

/** Soft-deletes the client, then returns to the list (mirrors profiler delete). */
export function useSoftDeleteClient(id: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return softDeleteClient(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Client deleted');
      navigate('/clients');
    },
    onError: (error: Error) => {
      showError('Failed to delete client', error);
    },
  });
}
