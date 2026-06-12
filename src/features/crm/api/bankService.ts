/**
 * Bank-balance history API — single supabase access layer for
 * `public.bank_balance_history` (Pattern D RLS: owner writes, owner OR
 * `view_all_clients` reads).
 *
 * Corrected legacy bugs 2+3 (CRM_MODULE_PRD.md research findings): EVERY
 * mutation here ends with `recomputeClientBalance(clientId, userId)` — the legacy app
 * copied the touched record's balance onto the client (wrong for backdated
 * edits) and never recomputed after deletes. `clients.total_bank_balance` and
 * `clients.last_review_date` are DERIVED columns owned exclusively by the
 * recompute; rows are addressed by id, never array index.
 */

import { supabase } from '@/integrations/supabase/client';
import { bankFromRow, bankToRow } from '../lib/mapping';
import type { BankBalanceRow, CrmBankRecord, CrmBankRecordInput } from '../types';

/** Per-client child lists are bounded; a single client's history never nears this. */
const CHILD_LIMIT = 1000;

/** Non-deleted history for one client, oldest first (chart/table order). */
export async function listBankHistoryByClient(clientId: string): Promise<CrmBankRecord[]> {
  const { data, error } = await supabase
    .from('bank_balance_history')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_deleted', false)
    .order('date', { ascending: true })
    .limit(CHILD_LIMIT);
  if (error) throw error;
  return (data ?? []).map(bankFromRow);
}

/**
 * Recompute the client's derived balance columns from the LATEST non-deleted
 * history row — latest by (date DESC, created_at DESC, id DESC) so same-day
 * entries resolve by insertion recency with a stable id tiebreak. Zero rows →
 * total 0 and `last_review_date` null. The acting user is stamped as
 * `updated_by` on the derived-column write. Every error is thrown to the caller.
 */
export async function recomputeClientBalance(clientId: string, userId: string): Promise<void> {
  const { data: latest, error: fetchError } = await supabase
    .from('bank_balance_history')
    .select('balance, date')
    .eq('client_id', clientId)
    .eq('is_deleted', false)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from('clients')
    .update({
      total_bank_balance: latest ? latest.balance : 0,
      last_review_date: latest ? latest.date : null,
      updated_by: userId,
    })
    .eq('id', clientId)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Balance recompute could not update this client');
  }
}

/** Insert one history row (user_id + created_by stamped), then recompute. */
export async function createBankRecord(
  clientId: string,
  input: CrmBankRecordInput,
  userId: string,
): Promise<BankBalanceRow> {
  const { data, error } = await supabase
    .from('bank_balance_history')
    .insert({ ...bankToRow(input), client_id: clientId, user_id: userId, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  await recomputeClientBalance(clientId, userId);
  return data;
}

/** Update one history row BY ID (updated_by stamped), then recompute. */
export async function updateBankRecord(
  id: string,
  clientId: string,
  input: CrmBankRecordInput,
  userId: string,
): Promise<BankBalanceRow> {
  const { data, error } = await supabase
    .from('bank_balance_history')
    .update({ ...bankToRow(input), updated_by: userId })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('You can only edit your own bank records');
  await recomputeClientBalance(clientId, userId);
  return data;
}

/**
 * Soft-delete one history row BY ID, then recompute (corrected bug 3 — the
 * legacy delete left the client total stale). `.select('id')` promotes an
 * RLS-blocked 0-row match to an error instead of a phantom success.
 */
export async function softDeleteBankRecord(
  id: string,
  clientId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('bank_balance_history')
    .update({ is_deleted: true, updated_by: userId })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('You can only delete your own bank records');
  }
  await recomputeClientBalance(clientId, userId);
}
