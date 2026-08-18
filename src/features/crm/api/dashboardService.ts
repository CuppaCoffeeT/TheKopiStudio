/**
 * CRM dashboard stats — three bounded selects over the viewer's RLS-visible
 * book, computed client-side with the golden-locked finance math.
 *
 * DOCUMENTED DIVERGENCE (CRM_MODULE_PRD.md): the legacy dashboard's "annual
 * premium" card raw-summed `premium` with no frequency multiplier or ILP
 * percent. This port reuses `summariseClient` (frequency-annualised, ILP
 * scaled by inclusion percent) so the tile matches the report math.
 *
 * Child selects inner-join `clients` and filter `clients.is_deleted` so rows
 * orphaned by a soft-deleted client never count (children keep
 * `is_deleted = false` by design). Follow-up parity: ALL strictly-future
 * follow-ups count — no window — using the legacy `new Date(str) > now`
 * UTC-midnight comparison (see lib/followUps.ts).
 *
 * BLIND SPOT, MADE VISIBLE (2026-08-18): the same ILP scaling that makes the
 * premium figure correct also drops any ILP policy whose inclusion percent is
 * 0 or unset — which is the column default, so it is the common case. The
 * stats now carry `excludedIlp` so the tile can say what it left out instead of
 * printing a total the advisor can tell is too small and cannot explain. Full
 * reasoning in lib/ilpExclusion; full field-by-field provenance in
 * docs/06-operations/CRM_FIGURE_PROVENANCE.md.
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentSingaporeTime } from '@/utils/timezoneUtils';
import { summariseClient } from '../lib/finance';
import { ilpExclusion } from '../lib/ilpExclusion';
import type { CrmDashboardStats } from '../types';

/** Stats selects are bounded — far beyond any single advisor's book. */
const STATS_LIMIT = 5000;

/** The policy columns the premium/active math consumes (snake_case rows). */
export interface StatsPolicyRow {
  premium: number | null;
  frequency: string | null;
  status: string | null;
  is_investment_linked: boolean | null;
  ilp_premium_inclusion_percent: number | null;
}

/** Pure stats math — exported for direct unit coverage. */
export function computeDashboardStats(
  totalClients: number,
  policies: readonly StatsPolicyRow[],
  followUpDates: readonly (string | null)[],
  refDate: Date,
): CrmDashboardStats {
  const mapped = policies.map((row) => ({
    premium: row.premium,
    frequency: row.frequency,
    isInvestmentLinked: row.is_investment_linked,
    ilpPremiumInclusionPercent: row.ilp_premium_inclusion_percent,
  }));
  const { totalAnnualPremium } = summariseClient({ annualIncome: 0, policies: mapped });

  return {
    totalClients,
    activePolicies: policies.filter((row) => row.status === 'Active').length,
    totalAnnualPremium,
    upcomingFollowUps: followUpDates.filter(
      (date) => date && new Date(date).getTime() > refDate.getTime(),
    ).length,
    excludedIlp: ilpExclusion(mapped),
  };
}

/** Fetch the viewer-visible book (RLS-scoped) and compute the four KPI tiles. */
export async function getDashboardStats(): Promise<CrmDashboardStats> {
  const [clientsResult, policiesResult, interactionsResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id')
      .eq('is_deleted', false)
      .limit(STATS_LIMIT),
    supabase
      .from('policies')
      .select(
        'premium, frequency, status, is_investment_linked, ilp_premium_inclusion_percent, clients!inner(is_deleted)',
      )
      .eq('is_deleted', false)
      .eq('clients.is_deleted', false)
      .limit(STATS_LIMIT),
    supabase
      .from('interactions')
      .select('follow_up, clients!inner(is_deleted)')
      .eq('is_deleted', false)
      .eq('clients.is_deleted', false)
      .not('follow_up', 'is', null)
      .limit(STATS_LIMIT),
  ]);
  if (clientsResult.error) throw clientsResult.error;
  if (policiesResult.error) throw policiesResult.error;
  if (interactionsResult.error) throw interactionsResult.error;

  return computeDashboardStats(
    clientsResult.data?.length ?? 0,
    policiesResult.data ?? [],
    (interactionsResult.data ?? []).map((row) => row.follow_up),
    getCurrentSingaporeTime(),
  );
}
