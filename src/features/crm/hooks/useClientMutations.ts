/**
 * Client mutations — create / update / soft-delete one client.
 *
 * Invalidation contract (CRM_MODULE_PRD.md P3): client mutations invalidate
 * the `crmClients` lists, the row's `detail(id)` family (which covers the
 * child sub-keys) and `crmDashboard.all`. The signed-in user id stamps
 * `user_id`/`created_by`/`updated_by` in the services; an unauthenticated
 * call throws into the standard `showError` path.
 *
 * HISTORY (2026-08-18): an update also writes a `customer_activity` entry
 * carrying the field-level diff. It is done HERE rather than in the form that
 * calls it, for two reasons: every caller of `useUpdateClient` gets the history
 * for free, and the "before" state is already sitting in the React Query cache
 * under `detail(id)` — reading it here means the form does not have to hold a
 * second copy of the record just to describe what it changed.
 *
 * Nothing is logged when the diff is empty. Opening the form and pressing Save
 * without touching a field is not an event, and a timeline that records it
 * teaches people to stop reading the timeline.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import { createClient, softDeleteClient, updateClient } from '../api/clientsService';
import { clientFromRow } from '../lib/clientMapping';
import { diffClient, summariseChanges } from '../lib/customerActivity';
import { useLogActivity } from './useCustomerActivity';
import type { ClientRow, CrmClientInput } from '../types';

const SIGN_IN_REQUIRED = 'You must be signed in to manage clients';

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async (input: CrmClientInput) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      const row = await createClient(input, user.id);
      // The first entry on every customer's timeline, so the log starts where
      // the record does rather than at whatever was edited first.
      void logActivity({
        clientId: row.id,
        ownerId: row.user_id,
        type: 'customer_created',
        summary: 'Customer record created',
      });
      return row;
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
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async (input: CrmClientInput) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      // Read the "before" from the cache BEFORE the write lands. The detail
      // query is what the open form was seeded from, so this is exactly the
      // state the advisor was looking at when they made the change.
      const before = queryClient.getQueryData<ClientRow | null>(
        queryKeys.crmClients.detail(id),
      );
      const row = await updateClient(id, input, user.id);

      const changes = before ? diffClient(clientFromRow(before), clientFromRow(row)) : [];
      if (changes.length > 0) {
        void logActivity({
          clientId: id,
          ownerId: row.user_id,
          type: 'info_updated',
          summary: summariseChanges(changes),
          changes,
        });
      }
      return row;
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
