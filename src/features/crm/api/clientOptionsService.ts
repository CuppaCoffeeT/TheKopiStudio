/**
 * Client OPTIONS — the id+name list behind the Overview tool-shortcut picker.
 *
 * Deliberately its own module rather than another export on `clientsService`:
 * every read in that file is RLS-scoped and returns whatever the viewer may
 * see, while this one draws a different, narrower boundary. Keeping them apart
 * makes the distinction visible at the import site — and stops the next reader
 * from "consolidating" the picker onto `getClientsPaginated`.
 */

import { supabase } from '@/integrations/supabase/client';

/** The two fields a customer picker needs. */
export interface ClientOption {
  id: string;
  name: string;
}

/**
 * id + name of the advisor's OWN customers, A–Z.
 *
 * `.eq('user_id', userId)` is NOT redundant with RLS. Pattern D lets a manager
 * (or any `view_all_clients` holder) READ the whole firm's book, so an
 * RLS-only query would put other advisors' customers in this dropdown. The
 * shortcut is a personal launcher on a personal work queue — the same own-book
 * boundary `getCustomerQueue` draws, for the same reason (lib/lessons.md
 * 2026-08-13: RLS answers *may I read this row*, never *is this row mine*).
 *
 * `.limit(5000)` is the dropdown bound from query-compliance.md (PostgREST
 * silently caps at 1,000 otherwise); the picker filters client-side from there,
 * so no keystroke costs a round trip.
 */
export async function getOwnClientOptions(userId: string): Promise<ClientOption[]> {
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
