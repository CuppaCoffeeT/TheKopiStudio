/**
 * Policies API — single supabase access layer for `public.policies` +
 * `public.projected_cash_values` (Pattern D RLS; UNIQUE(policy_id, age) on
 * projections).
 *
 * Corrected legacy bug 4 (CRM_MODULE_PRD.md): the legacy delete-then-reinsert
 * of projections swallowed every error. `replaceProjections` verifies the
 * delete via `.select('id')`, de-dups the incoming rows by age (keep-LAST, so
 * the user's later edit wins against UNIQUE(policy_id, age)), inserts sorted
 * by age, and THROWS every error to the mutation.
 *
 * Reads return `CrmPolicy` models (projections embedded, sorted by age) —
 * ownership checks live on the parent client row.
 */

import { supabase } from '@/integrations/supabase/client';
import { policyFromRow, policyToRow, projectionsToRows } from '../lib/mapping';
import type {
  CashValueProjection,
  CrmPolicy,
  CrmPolicyInput,
  PolicyRow,
  ProjectedCashValueRow,
} from '../types';

/** Per-client child lists are bounded; one client's policies never near this. */
const CHILD_LIMIT = 1000;

/** Non-deleted policies for one client, oldest first, with their projections. */
export async function listPoliciesByClient(clientId: string): Promise<CrmPolicy[]> {
  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(CHILD_LIMIT);
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: projections, error: projectionsError } = await supabase
    .from('projected_cash_values')
    .select('*')
    .in('policy_id', rows.map((row) => row.id))
    .eq('is_deleted', false)
    .limit(CHILD_LIMIT);
  if (projectionsError) throw projectionsError;

  const byPolicy = new Map<string, ProjectedCashValueRow[]>();
  for (const projection of projections ?? []) {
    const group = byPolicy.get(projection.policy_id) ?? [];
    group.push(projection);
    byPolicy.set(projection.policy_id, group);
  }
  return rows.map((row) => policyFromRow(row, byPolicy.get(row.id) ?? []));
}

/** Create a policy (user_id + created_by stamped), then persist its projections. */
export async function createPolicy(
  clientId: string,
  input: CrmPolicyInput,
  userId: string,
): Promise<PolicyRow> {
  const { data, error } = await supabase
    .from('policies')
    .insert({ ...policyToRow(input), client_id: clientId, user_id: userId, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  await replaceProjections(data.id, input.projectedCashValue, userId);
  return data;
}

/** Update an own policy (updated_by stamped), then replace its projections. */
export async function updatePolicy(
  policyId: string,
  input: CrmPolicyInput,
  userId: string,
): Promise<PolicyRow> {
  const { data, error } = await supabase
    .from('policies')
    .update({ ...policyToRow(input), updated_by: userId })
    .eq('id', policyId)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('You can only edit your own policies');
  await replaceProjections(policyId, input.projectedCashValue, userId);
  return data;
}

/** De-dup by age keeping the LAST entry (user's later edit wins), sorted by age. */
export function dedupeProjectionRows(
  projections: readonly CashValueProjection[],
): Array<{ age: number; value: number }> {
  const byAge = new Map<number, number>();
  for (const { age, value } of projectionsToRows(projections)) {
    byAge.set(age, value);
  }
  return [...byAge.entries()]
    .sort(([a], [b]) => a - b)
    .map(([age, value]) => ({ age, value }));
}

/**
 * Replace ALL projections of a policy. The delete is a HARD delete on purpose
 * (and ignores `is_deleted`): UNIQUE(policy_id, age) would collide with any
 * leftover row on reinsert. `.select('id')` verifies the delete executed (RLS
 * no-ops surface as data, real failures throw); the insert error throws too.
 */
export async function replaceProjections(
  policyId: string,
  projections: readonly CashValueProjection[],
  userId: string,
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('projected_cash_values')
    .delete()
    .eq('policy_id', policyId)
    .select('id');
  if (deleteError) throw deleteError;

  const rows = dedupeProjectionRows(projections).map((projection) => ({
    ...projection,
    policy_id: policyId,
    user_id: userId,
    created_by: userId,
  }));
  if (rows.length === 0) return;

  const { error: insertError } = await supabase.from('projected_cash_values').insert(rows);
  if (insertError) throw insertError;
}

/**
 * Soft-delete a policy AND its projections (the projections have no client
 * filter to orphan-hide behind, unlike direct children of a client).
 */
export async function softDeletePolicy(policyId: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('policies')
    .update({ is_deleted: true, updated_by: userId })
    .eq('id', policyId)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('You can only delete your own policies');
  }

  const { error: projectionsError } = await supabase
    .from('projected_cash_values')
    .update({ is_deleted: true, updated_by: userId })
    .eq('policy_id', policyId);
  if (projectionsError) throw projectionsError;
}
