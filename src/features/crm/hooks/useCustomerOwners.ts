/**
 * useCustomerOwners — owning-advisor names for the customers on the CURRENT
 * page of the Customers list.
 *
 * Sibling of `useCustomerSignals`: id-keyed, page-scoped, and `keepPreviousData`
 * so the Advisor column holds the previous page's names while the next page's
 * land rather than flashing dashes and shifting the table.
 *
 * The caller passes `[]` when the Advisor column is hidden (viewer lacks
 * `view_all_clients`), so the query simply stays disabled for solo advisors.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { getCustomerOwners } from '../api/customerOwnersService';

export function useCustomerOwners(ownerIds: string[]) {
  return useQuery({
    queryKey: queryKeys.crmClients.owners(ownerIds),
    queryFn: () => getCustomerOwners(ownerIds),
    enabled: ownerIds.length > 0,
    placeholderData: keepPreviousData,
  });
}
