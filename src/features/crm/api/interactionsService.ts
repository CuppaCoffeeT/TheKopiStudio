/**
 * Interactions API — single supabase access layer for `public.interactions`
 * (Pattern D RLS). Reads return `CrmInteraction` models, newest first; the
 * `followUp` '' → null coercion lives in `interactionToRow` (the `date`
 * column rejects '' — legacy InteractionFormModal contract). Every read
 * filters `.eq('is_deleted', false)`; destructive actions soft-delete.
 */

import { supabase } from '@/integrations/supabase/client';
import { interactionFromRow, interactionToRow } from '../lib/mapping';
import type { CrmInteraction, CrmInteractionInput, InteractionRow } from '../types';

/** Per-client child lists are bounded; one client's log never nears this. */
const CHILD_LIMIT = 1000;

/**
 * Non-deleted interactions for one client, newest first (timeline order) —
 * (date DESC, created_at DESC, id DESC) so same-day entries resolve by
 * insertion recency with a stable id tiebreak.
 */
export async function listInteractionsByClient(clientId: string): Promise<CrmInteraction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_deleted', false)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(CHILD_LIMIT);
  if (error) throw error;
  return (data ?? []).map(interactionFromRow);
}

/** Create an interaction (user_id + created_by stamped; followUp '' → null). */
export async function createInteraction(
  clientId: string,
  input: CrmInteractionInput,
  userId: string,
): Promise<InteractionRow> {
  const { data, error } = await supabase
    .from('interactions')
    .insert({ ...interactionToRow(input), client_id: clientId, user_id: userId, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Update an own interaction (updated_by stamped). Throws when RLS matched no row. */
export async function updateInteraction(
  id: string,
  input: CrmInteractionInput,
  userId: string,
): Promise<InteractionRow> {
  const { data, error } = await supabase
    .from('interactions')
    .update({ ...interactionToRow(input), updated_by: userId })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('You can only edit your own interactions');
  return data;
}

/**
 * Soft-delete one interaction (`is_deleted = true` + `updated_by`).
 * `.select('id')` promotes an RLS-blocked 0-row match to an error.
 */
export async function softDeleteInteraction(id: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('interactions')
    .update({ is_deleted: true, updated_by: userId })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('You can only delete your own interactions');
  }
}
