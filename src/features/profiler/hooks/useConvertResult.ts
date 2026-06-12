/**
 * useConvertResult — convert a saved result into a client record.
 *
 * Non-atomic retry semantics (REPORTS_LINK_PRD P4): when the client INSERT
 * succeeded but the result link failed, `ConvertLinkError` carries the new
 * client id and it is kept in hook state — the next mutate() calls
 * `relinkResultToClient` with the kept id instead of inserting a duplicate
 * client. Success invalidates the profilerResults detail + lists (the row now
 * carries `client_id`) plus the crmClients lists and crmDashboard family via
 * the SHARED queryKeys factory (not a cross-feature import), then navigates
 * to the new client.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import { ConvertLinkError, convertResultToClient, relinkResultToClient } from '../api/convertService';
import type { ProfilerResult } from '../types';

export function useConvertResult(result: ProfilerResult | null) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);

  return useMutation({
    mutationFn: async () => {
      if (!result) throw new Error('The result is still loading — try again in a moment');
      if (!user) throw new Error('You must be signed in to convert a result');
      if (createdClientId) {
        await relinkResultToClient(result.id, createdClientId);
        return createdClientId;
      }
      return convertResultToClient(result, user.id);
    },
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profilerResults.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.profilerResults.detail(result?.id ?? ''),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess('Client created', 'This result is now linked to the new client record.');
      navigate(`/clients/${clientId}`);
    },
    onError: (error: Error) => {
      if (error instanceof ConvertLinkError) setCreatedClientId(error.createdClientId);
      showError('Failed to convert result', error);
    },
  });
}
