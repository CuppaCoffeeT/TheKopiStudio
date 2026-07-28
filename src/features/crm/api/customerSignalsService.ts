/**
 * Customer signals API — the two per-customer facts the Customers list needs
 * that `public.clients` cannot answer on its own: has this customer been
 * profiled, and when were they last contacted.
 *
 * Split from `customerQueueService.ts` (2026-07-28, W23 LOC ceiling) along the
 * scope seam: that service reads the WHOLE book for the Overview queue, this
 * one reads only the ids already on screen. Keeping them apart makes the scope
 * difference impossible to miss at the callsite.
 *
 * `results` is read from this feature on purpose — the merge plan sanctions an
 * own-feature api hitting shared tables, and importing profiler's
 * `resultsService` would be a cross-feature drift error (same sanction as
 * `linkedResultsService`). RLS prunes both sides, so a customer whose profile
 * belongs to another advisor simply reads as un-profiled.
 */

import { supabase } from '@/integrations/supabase/client';

/** Bounded far beyond one page of customers (.claude/rules/query-compliance.md). */
const SIGNALS_LIMIT = 5000;

/** The two per-customer signals the Customers list needs. */
export interface CustomerSignals {
  hasProfile: boolean;
  lastContactDate: string | null;
}

/**
 * Signals for the customers on ONE page of the list — never the whole book.
 * The list is server-side paginated at 25 rows, so this stays a two-select
 * lookup keyed by the ids already on screen rather than a second full scan.
 *
 * An empty `ids` resolves without touching the network: React Query still
 * mounts the hook on the loading/empty renders of the list.
 */
export async function getCustomerSignals(ids: string[]): Promise<Record<string, CustomerSignals>> {
  if (ids.length === 0) return {};

  const [resultsResult, interactionsResult] = await Promise.all([
    supabase.from('results').select('client_id').in('client_id', ids).limit(SIGNALS_LIMIT),
    supabase
      .from('interactions')
      .select('client_id, date')
      .eq('is_deleted', false)
      .in('client_id', ids)
      .order('date', { ascending: false })
      .limit(SIGNALS_LIMIT),
  ]);
  if (resultsResult.error) throw resultsResult.error;
  if (interactionsResult.error) throw interactionsResult.error;

  const signals: Record<string, CustomerSignals> = {};
  for (const id of ids) signals[id] = { hasProfile: false, lastContactDate: null };

  for (const row of resultsResult.data ?? []) {
    if (row.client_id && signals[row.client_id]) signals[row.client_id].hasProfile = true;
  }
  // Newest-first, so the first hit per customer is the latest contact.
  for (const row of interactionsResult.data ?? []) {
    const entry = row.client_id ? signals[row.client_id] : undefined;
    if (entry && entry.lastContactDate === null) entry.lastContactDate = row.date;
  }

  return signals;
}
