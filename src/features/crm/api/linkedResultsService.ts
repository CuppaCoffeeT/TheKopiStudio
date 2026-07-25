/**
 * Linked profiler results API — crm-owned read of `public.results` for the
 * prospect→client bridge (REPORTS_LINK_PRD P4; merge plan sanctions an
 * own-feature api hitting shared tables — importing profiler's services
 * would be a cross-feature drift error).
 *
 * Legacy results RLS prunes server-side: advisors see their own rows,
 * managers see all, super_admin sees own-only until cutover. A linked but
 * RLS-hidden result therefore resolves to an EMPTY list — indistinguishable
 * from "never converted" by design (the card renders one neutral empty
 * state for both). `results` has no `is_deleted` column, so no soft-delete
 * filter applies here.
 */

import { supabase } from '@/integrations/supabase/client';
import type { LinkedProfilerResult } from '../types';

/**
 * Visible profiling results linked to one client, newest first — bounded to
 * the 10 most recent (a client realistically has one or two).
 */
export async function listLinkedResultsByClient(
  clientId: string,
): Promise<LinkedProfilerResult[]> {
  const { data, error } = await supabase
    .from('results')
    .select('id, prospect_name, disc_primary, disc_secondary, mbti, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

/** One newest-first `results` row as the /dashboard Overview feed reads it. */
export interface RecentProfilerResult {
  id: string;
  prospect_name: string;
  created_at: string;
}

/** The newest saved profiles plus the RLS-visible total behind them. */
export interface RecentProfilerResultsPage {
  rows: RecentProfilerResult[];
  /** Total visible `results` rows — the /dashboard "profiles saved" figure. */
  count: number;
}

/**
 * Newest saved profiling results for the /dashboard "Latest additions" feed
 * (KOPI_STUDIO_REDESIGN_PRD P4). Same crm-owned-read sanction as the linked
 * lookup above: the feed merges CRM clients with profiler results, and
 * importing profiler's `resultsService` from this feature would be a
 * cross-feature drift error.
 *
 * `count: 'exact'` rides along with the page so the Overview's profiler KPI
 * never needs a second round trip.
 */
export async function listRecentResults(limit: number): Promise<RecentProfilerResultsPage> {
  const { data, count, error } = await supabase
    .from('results')
    .select('id, prospect_name, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, limit - 1);
  if (error) throw error;
  return { rows: data ?? [], count: count ?? 0 };
}
