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
 *
 * HISTORY (2026-08-18): a LINKED save also writes the customer's activity log
 * — `profile_created` the first time, `profile_updated` afterwards carrying the
 * field-level diff against the previous profile (`DISC primary: S → D`). The
 * previous row is read BEFORE the insert, so the new profile cannot be its own
 * predecessor.
 *
 * It writes through `@/lib/activityLog`, not through the CRM feature:
 * `.dependency-cruiser.cjs` forbids cross-feature imports, and the log is
 * written by two features, so it lives one level up where both can see it.
 * The write is fire-and-forget — a profile that saved must never report failure
 * because its history entry did not.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { recordActivity } from '@/lib/activityLog';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import { resolveLinkableClientId } from '../api/convertService';
import { diffProfiles, snapshotFromResult, summariseProfileChanges } from '../lib/profileHistory';
import type { ProfilerResult, ProfilerResultInsert } from '../types';

export interface SaveResultOutcome {
  /** The saved row — null on the anonymous fire-and-forget path. */
  saved: ProfilerResult | null;
  /** A `?customerId=` came in with this save. */
  linkRequested: boolean;
  /** …and it resolved to a customer this advisor owns, so the row carries it. */
  linked: boolean;
}

/**
 * The customer's most recent profile before this one, or null on a first
 * profile. Bounded to one row; failure resolves to null rather than throwing —
 * a history lookup must not be able to fail a save.
 */
async function readPreviousProfile(clientId: string) {
  const { data, error } = await supabase
    .from('results')
    .select('disc_primary, disc_secondary, mbti, age_range, occupation, meeting, observations_count, questions_answered')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return snapshotFromResult(data);
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
        // Read the customer's previous profile BEFORE inserting, or the new row
        // becomes its own predecessor and every diff comes out empty.
        const previous = linkedClientId ? await readPreviousProfile(linkedClientId) : null;

        const { data, error } = await supabase
          .from('results')
          .insert(row)
          .select()
          .single();
        if (error) throw error;

        if (linkedClientId) {
          const changes = diffProfiles(previous, snapshotFromResult(data));
          void recordActivity({
            clientId: linkedClientId,
            // `resolveLinkableClientId` only returns an id this user OWNS, so
            // the owner and the actor are necessarily the same person here.
            ownerId: row.user_id,
            actorId: row.user_id,
            type: previous ? 'profile_updated' : 'profile_created',
            tool: 'prospect-profiler',
            summary: previous
              ? summariseProfileChanges(changes)
              : 'Prospect Profiler completed — risk profile on file',
            changes,
          });
        }

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
