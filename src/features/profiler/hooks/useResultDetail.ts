/**
 * useResultDetail — fetch one saved profiling result by id.
 *
 * `data === null` after a successful fetch means the row does not exist OR is
 * not visible to this user under the legacy RLS — the page renders not-found
 * for both (indistinguishable by design; RLS hides foreign rows entirely).
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { getResultById } from '../api/resultsService';

export function useResultDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profilerResults.detail(id ?? ''),
    queryFn: () => getResultById(id as string),
    enabled: Boolean(id),
  });
}
