/**
 * Result mutations — notes update + delete for one saved result.
 *
 * Both invalidate the whole `profilerResults` family (`.all`) AND the row's
 * `.detail(id)` key so the list and any open detail view refetch together.
 * A notes update that RLS silently blocks (foreign / NULL-owner row) resolves
 * to `null` from the service — promoted to a thrown error here so it surfaces
 * through the standard `showError` path.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import { deleteResult, updateResultNotes } from '../api/resultsService';

export function useUpdateResultNotes(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notes: string) => {
      const row = await updateResultNotes(id, notes);
      if (!row) {
        throw new Error('This result is read-only for your account — notes were not saved.');
      }
      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profilerResults.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profilerResults.detail(id) });
      showSuccess('Notes saved');
    },
    onError: (error: Error) => {
      showError('Failed to save notes', error);
    },
  });
}

export function useDeleteResult(id: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => deleteResult(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profilerResults.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profilerResults.detail(id) });
      showSuccess('Result deleted');
      navigate('/profiler-results');
    },
    onError: (error: Error) => {
      showError('Failed to delete result', error);
    },
  });
}
