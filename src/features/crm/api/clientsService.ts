/**
 * Clients API — single supabase access layer for `public.clients` (Pattern D
 * RLS: owner OR `view_all_clients` reads, owner-only writes — no role logic
 * client-side).
 *
 * Reads return raw rows (pages map via `clientFromRow`; `user_id` stays
 * available for the read-only-affordance check). Every read filters
 * `.eq('is_deleted', false)`; destructive actions soft-delete.
 *
 * Corrected legacy bug 1 (CRM_MODULE_PRD.md): client edits NEVER write
 * `total_bank_balance` / `last_review_date` — the bank-history recompute in
 * `bankService` owns both derived columns. The ADD form's `totalBankBalance`
 * only seeds the initial history row.
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentSingaporeTime, getLocalDateString } from '@/utils/timezoneUtils';
import { clientToRow } from '../lib/clientMapping';
import type { ClientRow, ClientRowUpdate, CrmClientInput } from '../types';
import { recomputeClientBalance } from './bankService';

export interface ClientsListParams {
  /** Raw search text — sanitized before being embedded in the PostgREST filter. */
  search: string;
  /** 1-based page number. */
  page: number;
  rowsPerPage: number;
}

export interface ClientsPage {
  rows: ClientRow[];
  /** Total matching non-deleted rows (RLS-scoped), for pagination math. */
  count: number;
}

/**
 * Strip characters that are structural in a PostgREST `.or()` filter string
 * (`,` splits conditions, `()` group, `"` quotes values, `\` escapes) and the
 * LIKE wildcards `%`/`_`/`*` so user input can never inject operators or
 * patterns (same contract as profiler's resultsService).
 */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[%_,()\\"*]/g, ' ').replace(/\s+/g, ' ').trim();
}

const SEARCH_COLUMNS = ['name', 'email'] as const;

/** Today's date in Singapore as 'YYYY-MM-DD' (the "Client since" default). */
function todayInSingapore(): string {
  return getLocalDateString(getCurrentSingaporeTime());
}

/**
 * Server-side paginated client list, newest first. Search is server-side
 * (`ilike` across name/email) so pagination counts stay correct.
 */
export async function getClientsPaginated({
  search,
  page,
  rowsPerPage,
}: ClientsListParams): Promise<ClientsPage> {
  const from = (page - 1) * rowsPerPage;
  const to = from + rowsPerPage - 1;

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false);

  const term = sanitizeSearchTerm(search);
  if (term) {
    query = query.or(SEARCH_COLUMNS.map((col) => `${col}.ilike.%${term}%`).join(','));
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { rows: data ?? [], count: count ?? 0 };
}

/** One non-deleted client. `null` when missing, soft-deleted, or RLS-hidden. */
export async function getClientById(id: string): Promise<ClientRow | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Create a client (user_id + created_by stamped; blank "Client since" defaults
 * to today, Singapore calendar). Legacy ADD side-effect, corrected: a positive
 * `totalBankBalance` seeds the initial bank-history row, then the RECOMPUTE
 * writes the derived columns — never a direct `total_bank_balance` write.
 */
export async function createClient(input: CrmClientInput, userId: string): Promise<ClientRow> {
  const base = clientToRow(input);
  const createdDate = base.created_date ?? todayInSingapore();

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...base, created_date: createdDate, user_id: userId, created_by: userId })
    .select()
    .single();
  if (error) throw error;

  const initialBalance = Number(input.totalBankBalance);
  if (initialBalance > 0) {
    const { error: seedError } = await supabase.from('bank_balance_history').insert({
      client_id: data.id,
      user_id: userId,
      created_by: userId,
      date: createdDate,
      balance: initialBalance,
      notes: 'Initial client onboarding',
    });
    if (seedError) throw seedError;
    await recomputeClientBalance(data.id, userId);
  }

  return data;
}

/** Owned by the bank-history recompute, never by the client form. */
const DERIVED_COLUMNS = ['total_bank_balance', 'last_review_date'] as const;

/**
 * Build the UPDATE payload: mapped columns + `updated_by` stamp, with every
 * column owned by something else defensively stripped even if mapping ever
 * drifts. Saving the client form must not be able to blank a customer's SRS
 * balance just because the modal never rendered a field for it.
 *
 * The `tax_`/`srs_` prefixes are matched rather than listed: the planning tools
 * own that whole family (planning/api/planningProfileService.ts), and a column added
 * there should be excluded here the moment it exists, not the next time someone
 * remembers to extend a list.
 */
export function buildClientUpdate(input: CrmClientInput, userId: string): ClientRowUpdate {
  const row: ClientRowUpdate = { ...clientToRow(input), updated_by: userId };
  for (const column of DERIVED_COLUMNS) delete row[column];
  for (const column of Object.keys(row)) {
    if (column.startsWith('tax_') || column.startsWith('srs_')) {
      delete row[column as keyof ClientRowUpdate];
    }
  }
  return row;
}

/** Update an own client. Throws when RLS matched no row (foreign client). */
export async function updateClient(
  id: string,
  input: CrmClientInput,
  userId: string,
): Promise<ClientRow> {
  const { data, error } = await supabase
    .from('clients')
    .update(buildClientUpdate(input, userId))
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('You can only edit your own clients');
  return data;
}

/**
 * Soft-delete a client (`is_deleted = true` + `updated_by`). Child rows stay
 * `is_deleted = false` — they are orphan-hidden by the client filter (PRD
 * soft-delete semantics). `.select('id')` promotes an RLS-blocked 0-row match
 * to an error instead of a phantom success.
 */
export async function softDeleteClient(id: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('clients')
    .update({ is_deleted: true, updated_by: userId })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('You can only delete your own clients');
  }
}
