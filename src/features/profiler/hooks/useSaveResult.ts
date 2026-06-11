/**
 * useSaveResult — persists a generated profile to `public.results`.
 *
 * Fires automatically on result generation (legacy behavior), with the two
 * RLS-dictated paths:
 *  - Authenticated: insert with `user_id` + `.select().single()` (policy
 *    `auth.uid()=user_id` allows the read-back) → success toast + invalidate
 *    the results list.
 *  - Anonymous: `user_id` NULL, fire-and-forget `.insert()` WITHOUT
 *    `.select()` — anon has no SELECT path, return=representation would 403.
 *
 * Legacy saved silently and swallowed errors; the port surfaces failures via
 * showError (PRD "legacy bugs fixed").
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import type { ProfilerResult, ProfilerResultInsert } from '../types';

export function useSaveResult() {
  const queryClient = useQueryClient();

  return useMutation<ProfilerResult | null, Error, ProfilerResultInsert>({
    mutationFn: async (payload) => {
      if (payload.user_id) {
        const { data, error } = await supabase
          .from('results')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      // Anonymous: fire-and-forget — no .select(), RLS blocks returning rows.
      const { error } = await supabase.from('results').insert(payload);
      if (error) throw error;
      return null;
    },
    onSuccess: (saved) => {
      if (saved) {
        showSuccess('Profile saved to your results');
        queryClient.invalidateQueries({ queryKey: queryKeys.profilerResults.all });
      }
    },
    onError: (error) => {
      showError('Could not save this profile', error);
    },
  });
}
