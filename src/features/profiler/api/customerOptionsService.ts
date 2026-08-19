/**
 * Customer OPTIONS for the profiler's own `ToolCustomerBar` — id + name of the
 * advisor's own book, so a signed-in advisor can pick who they are profiling
 * instead of only arriving pre-linked from the CRM.
 *
 * TWIN OF `features/crm/api/clientOptionsService.getOwnClientOptions`, and
 * deliberately so. The profiler is its own feature workspace and may not import
 * from `crm` (.dependency-cruiser `no-cross-feature-imports`) — the same reason
 * `convertService` writes `public.clients` through its own module rather than
 * borrowing the CRM's. Keeping the QUERY here while sharing the query KEY
 * (`queryKeys.crmClients.ownOptions`) is the deliberate split: one cache entry
 * for both pickers, so adding a customer in the CRM invalidates this list too,
 * without either feature importing the other.
 *
 * If a third consumer ever appears, hoist the pair — not before. Two callers
 * of a nine-line query is cheaper than putting the customer record in a shared
 * lane (planning/decisions.md 2026-07-28).
 */

import { supabase } from '@/integrations/supabase/client';

/** The two fields a customer picker needs. */
export interface ProfilerCustomerOption {
  id: string;
  name: string;
}

/**
 * id + name of the advisor's OWN customers, A–Z.
 *
 * `.eq('user_id', userId)` is NOT redundant with RLS. Pattern D lets a manager
 * (or any `view_all_clients` holder) READ the whole firm's book, so an
 * RLS-only query would put other advisors' customers in this dropdown — and
 * the profiler would then offer to link a result to a customer the advisor
 * does not own, which the results update policy would refuse at save time
 * (crm/lib/lessons.md 2026-08-13: RLS answers *may I read this row*, never
 * *is this row mine*).
 *
 * `.limit(5000)` is the dropdown bound from query-compliance.md (PostgREST
 * silently caps at 1,000 otherwise); the picker filters client-side from there,
 * so no keystroke costs a round trip.
 */
export async function getOwnCustomerOptions(userId: string): Promise<ProfilerCustomerOption[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('name', { ascending: true })
    .limit(5000);
  if (error) throw error;
  return data ?? [];
}
