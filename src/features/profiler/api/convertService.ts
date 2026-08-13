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
 *
 * It also owns the two READS that keep the bridge from duplicating people:
 * `findClientByName` (does this customer already exist? — asked BEFORE the
 * insert) and `resolveLinkableClientId` (may this save link to the customer
 * the URL named?). Both scope to the caller's OWN book: `clients_select`
 * lets a manager read the whole firm, but linking someone else's customer to
 * your result would put a profile on their record that their own RLS then
 * hides from them.
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

/** The identity fields the duplicate check and the link check read back. */
export interface LinkableClient {
  id: string;
  name: string;
}

/**
 * The customer this result would duplicate, or null. Matched on the trimmed
 * name, case-insensitively, within the caller's own non-deleted book —
 * `results` carries no email, so the name IS the only identity signal the
 * profiler holds. Deliberately NOT fuzzy: "Sky Tan" and "Sky Tan" merge,
 * "S Tan" does not, and the caller always confirms before either branch runs.
 */
export async function findClientByName(
  name: string,
  userId: string,
): Promise<LinkableClient | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .ilike('name', trimmed.replace(/[%_]/g, ' '))
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * Confirm a `?customerId=` is a customer this saver may link to, resolving
 * the id back or null. Null is not an error — the wizard saves the profile
 * unlinked and says so, which beats failing a completed profile over a stale
 * or hand-edited URL.
 */
export async function resolveLinkableClientId(
  clientId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
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
