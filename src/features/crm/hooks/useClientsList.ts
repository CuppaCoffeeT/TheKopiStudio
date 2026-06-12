/**
 * useClientsList — paginated, searchable client-book query.
 *
 * Keyed via the queryKeys factory only; `keepPreviousData` holds the previous
 * page on screen during page/search transitions (no layout flash — same UX
 * contract as profiler's useResultsList).
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { getClientsPaginated, type ClientsListParams } from '../api/clientsService';

export function useClientsList(params: ClientsListParams) {
  return useQuery({
    queryKey: queryKeys.crmClients.list({
      search: params.search,
      page: params.page,
      rowsPerPage: params.rowsPerPage,
    }),
    queryFn: () => getClientsPaginated(params),
    placeholderData: keepPreviousData,
  });
}
