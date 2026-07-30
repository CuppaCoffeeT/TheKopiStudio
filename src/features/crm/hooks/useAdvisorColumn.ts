/**
 * useAdvisorColumn — everything the Customers list's Advisor column needs, in
 * one place: whether to show it, the resulting column set, and the owning
 * advisor's name per client.
 *
 * Shown only to viewers who can see other advisors' books (`view_all_clients`);
 * a solo advisor owns every visible row, so the column would just repeat their
 * own name and is hidden. Owner ids come from the RAW client rows (the mapped
 * model drops `user_id`), and names resolve through `useCustomerOwners` — a
 * page-scoped id lookup that leaves the golden list query untouched. The
 * viewer's own customers read "You" rather than their name.
 */

import { useMemo } from 'react';
import type { TableHeaderColumn } from '@/components/primitives/ui/TableHeader';
import { useAuth } from '@/contexts/AuthContext';
import { customerColumns } from '../components/customerRowModel';
import type { ClientRow } from '../types';
import { useCustomerOwners } from './useCustomerOwners';

export interface AdvisorColumn {
  showAdvisor: boolean;
  columns: TableHeaderColumn[];
  /** clientId → advisor name ("You" / name / email / null). Empty when hidden. */
  advisorNames: Map<string, string | null>;
}

export function useAdvisorColumn(rows: ClientRow[] | undefined): AdvisorColumn {
  const { user, hasCapability } = useAuth();
  const showAdvisor = hasCapability('view_all_clients');

  const columns = useMemo(() => customerColumns(showAdvisor), [showAdvisor]);
  const ownerByClient = useMemo(
    () => new Map((rows ?? []).map((r) => [r.id, r.user_id])),
    [rows],
  );
  const ownerIds = useMemo(() => [...ownerByClient.values()], [ownerByClient]);
  const { data: owners } = useCustomerOwners(showAdvisor ? ownerIds : []);

  const advisorNames = useMemo(() => {
    const map = new Map<string, string | null>();
    if (!showAdvisor) return map;
    for (const [clientId, ownerId] of ownerByClient) {
      map.set(
        clientId,
        user && ownerId === user.id
          ? 'You'
          : owners?.[ownerId]?.name || owners?.[ownerId]?.email || null,
      );
    }
    return map;
  }, [showAdvisor, ownerByClient, owners, user]);

  return { showAdvisor, columns, advisorNames };
}
