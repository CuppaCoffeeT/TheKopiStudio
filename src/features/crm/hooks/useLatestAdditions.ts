/**
 * useLatestAdditions — the /dashboard Overview's data layer (KOPI_STUDIO_
 * REDESIGN_PRD P4): the merged "Latest additions" feed plus the two figures
 * the index KPI cards render.
 *
 * Two RLS-scoped sources, newest first, merged and re-sorted into one table:
 * CRM clients (`clientsService`) and saved profiler results
 * (`linkedResultsService` — the crm-owned read of `public.results`; importing
 * profiler's own service from this feature would be a cross-feature drift
 * error). Each source is gated on the viewer actually holding that module, so
 * a clients-only advisor never fires the results query and vice versa.
 *
 * Both queries reuse the `queryKeys` factory, and the clients key is byte-
 * identical to `useClientsList`'s, so the feed and the client book share one
 * cache entry when the page sizes line up.
 *
 * Row shape + the derived status pill live in `lib/latestAdditions` — pure
 * mappers, no React, so this file stays fetch-and-merge only.
 */

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { getCurrentSingaporeTime } from '@/utils/timezoneUtils';
import { getClientsPaginated } from '../api/clientsService';
import { listRecentResults } from '../api/linkedResultsService';
import {
  CLIENTS_PATH,
  RESULTS_PATH,
  clientToAddition,
  resultToAddition,
} from '../lib/latestAdditions';

export function useLatestAdditions(limit: number) {
  const { modules } = useAuth();
  const hasClients = modules.some((mod) => mod.path === CLIENTS_PATH);
  const hasResults = modules.some((mod) => mod.path === RESULTS_PATH);

  const clients = useQuery({
    queryKey: queryKeys.crmClients.list({ search: '', page: 1, rowsPerPage: limit }),
    queryFn: () => getClientsPaginated({ search: '', page: 1, rowsPerPage: limit }),
    enabled: hasClients,
  });

  const results = useQuery({
    queryKey: queryKeys.crmDashboard.recentResults(limit),
    queryFn: () => listRecentResults(limit),
    enabled: hasResults,
  });

  const clientRows = clients.data?.rows;
  const resultRows = results.data?.rows;

  const rows = useMemo(() => {
    const now = getCurrentSingaporeTime();
    return [
      ...(clientRows ?? []).map((row) => clientToAddition(row, now)),
      ...(resultRows ?? []).map((row) => resultToAddition(row, now)),
    ]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, limit);
  }, [clientRows, resultRows, limit]);

  const newestResult = useMemo(() => {
    const newest = resultRows?.[0];
    return newest ? resultToAddition(newest, getCurrentSingaporeTime()) : null;
  }, [resultRows]);

  // react-query's `refetch` is referentially stable, so both callbacks below
  // keep a stable identity across renders.
  const clientsRefetch = clients.refetch;
  const resultsRefetch = results.refetch;

  const refetch = useCallback(() => {
    if (hasClients) void clientsRefetch();
    if (hasResults) void resultsRefetch();
  }, [hasClients, hasResults, clientsRefetch, resultsRefetch]);

  const refetchResults = useCallback(() => {
    void resultsRefetch();
  }, [resultsRefetch]);

  return {
    rows,
    /**
     * The one derived set of held RECORD modules — the modules that own rows
     * this feed lists. Every /dashboard surface gates on these three flags, so
     * a populated card can never sit above "nothing is granted" copy.
     */
    hasSource: hasClients || hasResults,
    hasClients,
    hasResults,
    isLoading: (hasClients && clients.isLoading) || (hasResults && results.isLoading),
    isError: (hasClients && clients.isError) || (hasResults && results.isError),
    refetch,
    /** `null` until the query resolves — the KPI shows an em dash, never a fake 0. */
    resultCount: results.data?.count ?? null,
    newestResult,
    /**
     * The `/profiler-results` source ALONE. The Profiler KPI card renders one
     * figure from one query, so it needs that query's own loading/error state —
     * the merged-feed flags above smear both sources together and would blank a
     * healthy profiler figure whenever the clients query failed.
     */
    resultsStatus: {
      isLoading: hasResults && results.isLoading,
      isError: hasResults && results.isError,
      refetch: refetchResults,
    },
  };
}
