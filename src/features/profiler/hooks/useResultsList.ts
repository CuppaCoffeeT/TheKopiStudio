/**
 * useResultsList — paginated, searchable saved-results query.
 *
 * Keyed via the queryKeys factory only; `keepPreviousData` holds the previous
 * page on screen during page/search transitions (no layout flash, per
 * query-compliance pagination UX rule).
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { getResultsPaginated, type ResultsListParams } from '../api/resultsService';

export function useResultsList(params: ResultsListParams) {
  return useQuery({
    queryKey: queryKeys.profilerResults.list({
      search: params.search,
      page: params.page,
      rowsPerPage: params.rowsPerPage,
    }),
    queryFn: () => getResultsPaginated(params),
    placeholderData: keepPreviousData,
  });
}
