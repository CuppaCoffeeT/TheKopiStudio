/**
 * Convert service — prospect→client bridge (REPORTS_LINK_PRD P4).
 *
 * Two statements, NO transaction (sanctioned non-atomic v1): INSERT a client
 * from the result's intake fields, then UPDATE `results.client_id`. The
 * profiler feature owns this file even though it writes `public.clients` —
 * the merge plan sanctions an own-feature api hitting shared tables; a
 * cross-feature import of crm's clientsService would be a drift error.
 *
 * Step 2 is own-row RLS gated (results UPDATE policy: auth.uid() = user_id).
 * When it matches 0 rows the client already exists with no linked result —
 * `ConvertLinkError` carries the created client id so the caller can retry
 * with `relinkResultToClient` instead of inserting a duplicate client.
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentSingaporeTime, getLocalDateString } from '@/utils/timezoneUtils';
import type { ProfilerResult } from '../types';

const ORPHAN_MESSAGE =
  'The client record was created, but linking this result to it failed — the client ' +
  'exists without a linked profile. Use "Convert to client" again to retry the link; ' +
  'a duplicate client will not be created.';

/** Step-2 failure: the client row exists, the result link does not. */
export class ConvertLinkError extends Error {
  readonly createdClientId: string;

  constructor(createdClientId: string) {
    super(ORPHAN_MESSAGE);
    this.name = 'ConvertLinkError';
    this.createdClientId = createdClientId;
  }
}

/** Provenance block prepended to the client notes (legacy-auditable origin). */
export function buildProvenanceNotes(result: ProfilerResult): string {
  const provenance = [
    `Converted from profiler result ${result.id.slice(0, 8)}`,
    `Age range: ${result.age_range ?? 'Not specified'}`,
    `DISC ${result.disc_primary}/${result.disc_secondary}`,
    `MBTI ${result.mbti}`,
  ].join(' · ');
  return result.notes ? `${provenance}\n\n${result.notes}` : provenance;
}

/**
 * Link (or re-link) a result to an existing client. Own-row RLS: a 0-row
 * match resolves `null` and is promoted to the orphan-explaining error so
 * the mutation surfaces it instead of phantom-succeeding.
 */
export async function relinkResultToClient(resultId: string, clientId: string): Promise<void> {
  const { data, error } = await supabase
    .from('results')
    .update({ client_id: clientId })
    .eq('id', resultId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(ORPHAN_MESSAGE);
}

/**
 * Convert a profiling result into a client record and link the result to it.
 * Resolves the new client id; throws `ConvertLinkError` (carrying that id)
 * when the insert succeeded but the link did not.
 */
export async function convertResultToClient(
  result: ProfilerResult,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: result.prospect_name,
      occupation: result.occupation,
      notes: buildProvenanceNotes(result),
      user_id: userId,
      created_by: userId,
      created_date: getLocalDateString(getCurrentSingaporeTime()),
    })
    .select('id')
    .single();
  if (error) throw error;

  try {
    await relinkResultToClient(result.id, data.id);
  } catch {
    throw new ConvertLinkError(data.id);
  }
  return data.id;
}
