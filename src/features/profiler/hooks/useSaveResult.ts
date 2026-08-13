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
 * When the payload carries a `client_id` (the wizard was entered from a
 * customer), the id is RE-RESOLVED here before the insert rather than trusted
 * from the URL: `?customerId=` is user-editable, and a foreign or deleted id
 * would otherwise hang a profile off a record its owner cannot read. A
 * requested-but-unlinkable id downgrades to an unlinked save with an explicit
 * toast — never a silent one, and never a failed save: the profile is done
 * work and losing it over a stale URL would be the worse bug.
 *
 * Legacy saved silently and swallowed errors; the port surfaces failures via
 * showError (PRD "legacy bugs fixed").
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import { resolveLinkableClientId } from '../api/convertService';
import type { ProfilerResult, ProfilerResultInsert } from '../types';

export interface SaveResultOutcome {
  /** The saved row — null on the anonymous fire-and-forget path. */
  saved: ProfilerResult | null;
  /** A `?customerId=` came in with this save. */
  linkRequested: boolean;
  /** …and it resolved to a customer this advisor owns, so the row carries it. */
  linked: boolean;
}

export function useSaveResult() {
  const queryClient = useQueryClient();

  return useMutation<SaveResultOutcome, Error, ProfilerResultInsert>({
    mutationFn: async (payload) => {
      const requestedClientId = payload.client_id ?? null;
      const linkedClientId =
        requestedClientId && payload.user_id
          ? await resolveLinkableClientId(requestedClientId, payload.user_id)
          : null;
      const row: ProfilerResultInsert = { ...payload, client_id: linkedClientId };
      const outcome = {
        linkRequested: Boolean(requestedClientId),
        linked: Boolean(linkedClientId),
      };

      if (row.user_id) {
        const { data, error } = await supabase
          .from('results')
          .insert(row)
          .select()
          .single();
        if (error) throw error;
        return { saved: data, ...outcome };
      }
      // Anonymous: fire-and-forget — no .select(), RLS blocks returning rows.
      const { error } = await supabase.from('results').insert(row);
      if (error) throw error;
      return { saved: null, ...outcome };
    },
    onSuccess: ({ saved, linkRequested, linked }) => {
      if (!saved) return;
      if (linked) {
        showSuccess('Profile saved', 'Linked to the customer record — their chain now reads 01 done.');
        // The customer's chain, checklist and queue position all changed.
        queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      } else if (linkRequested) {
        showSuccess(
          'Profile saved to your results',
          'It could not be linked to that customer — open the result and use Convert to client.',
        );
      } else {
        showSuccess('Profile saved to your results');
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.profilerResults.all });
    },
    onError: (error) => {
      showError('Could not save this profile', error);
    },
  });
}
