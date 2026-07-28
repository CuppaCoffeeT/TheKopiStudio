/**
 * useCustomerSignals — journey signals for the customers on the CURRENT page of
 * the Customers list (profiled? last contacted when?).
 *
 * Deliberately id-keyed rather than book-wide: the list is server-side
 * paginated, so a whole-book scan on every page change would be the exact
 * silent-truncation trap `.claude/rules/query-compliance.md` exists to stop.
 *
 * `placeholderData: keepPreviousData` holds the previous page's checklist while
 * the next page's signals land, so the column does not flash empty and shift
 * the table under the pointer.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { getCustomerSignals } from '../api/customerQueueService';

export function useCustomerSignals(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.crmClients.signals(ids),
    queryFn: () => getCustomerSignals(ids),
    enabled: ids.length > 0,
    placeholderData: keepPreviousData,
  });
}
