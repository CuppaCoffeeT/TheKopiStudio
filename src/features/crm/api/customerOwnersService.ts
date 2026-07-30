/**
 * Customer owners API — resolves the OWNING ADVISOR's name for the customers on
 * one page of the Customers list.
 *
 * Same scope discipline as `customerSignalsService`: it looks up only the owner
 * ids already on screen, never the whole book. The Customers list is
 * server-side paginated, so a page carries at most `ROWS_PER_PAGE` clients and
 * therefore a handful of distinct owners — this stays a single `.in()` select.
 *
 * Only called for viewers who hold `view_all_clients`; a solo advisor owns
 * every row they can see, so the column (and this lookup) never mount for them.
 * `public.users` is world-readable to authenticated users (RLS `users_select`
 * = true), so a foreign owner's name resolves even though their CUSTOMERS are
 * RLS-hidden from a plain advisor.
 */

import { supabase } from '@/integrations/supabase/client';

/** Bounded far beyond one page of owners (.claude/rules/query-compliance.md). */
const OWNERS_LIMIT = 5000;

/** The display facts the Advisor column needs for one owner. */
export interface CustomerOwner {
  name: string;
  email: string;
}

/**
 * Owner name/email keyed by user id, for the distinct owner ids passed in.
 * Duplicates and blanks are collapsed before the query; an empty input
 * resolves without a network call (the hook still mounts on empty renders).
 */
export async function getCustomerOwners(
  ownerIds: string[],
): Promise<Record<string, CustomerOwner>> {
  const unique = [...new Set(ownerIds)].filter(Boolean);
  if (unique.length === 0) return {};

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', unique)
    .limit(OWNERS_LIMIT);
  if (error) throw error;

  const owners: Record<string, CustomerOwner> = {};
  for (const row of data ?? []) {
    owners[row.id] = { name: row.name ?? '', email: row.email ?? '' };
  }
  return owners;
}
