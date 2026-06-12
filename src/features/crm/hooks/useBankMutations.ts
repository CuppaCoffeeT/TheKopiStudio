/**
 * Bank-balance history mutations — create / update / soft-delete one record.
 * Every service call ends with `recomputeClientBalance` (corrected legacy
 * bugs 2+3), so the client row's derived `total_bank_balance` /
 * `last_review_date` are fresh by the time `detail(clientId)` refetches.
 *
 * Child-mutation invalidation contract: `crmClients.detail(clientId)` (covers
 * the bank-history sub-key AND the client row) + `crmDashboard.all`.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import { createBankRecord, softDeleteBankRecord, updateBankRecord } from '../api/bankService';
import type { CrmBankRecordInput } from '../types';

const SIGN_IN_REQUIRED = 'You must be signed in to manage bank records';

export function useCreateBankRecord(clientId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CrmBankRecordInput) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return createBankRecord(clientId, input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Bank balance recorded');
    },
    onError: (error: Error) => {
      showError('Failed to record bank balance', error);
    },
  });
}

export function useUpdateBankRecord(clientId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CrmBankRecordInput }) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return updateBankRecord(id, clientId, input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Bank record updated');
    },
    onError: (error: Error) => {
      showError('Failed to update bank record', error);
    },
  });
}

export function useSoftDeleteBankRecord(clientId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error(SIGN_IN_REQUIRED);
      return softDeleteBankRecord(id, clientId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Bank record deleted');
    },
    onError: (error: Error) => {
      showError('Failed to delete bank record', error);
    },
  });
}
