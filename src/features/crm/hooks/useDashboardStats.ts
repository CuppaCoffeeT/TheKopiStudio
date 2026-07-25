/**
 * useDashboardStats — the four CRM KPI tiles (totalClients / activePolicies /
 * totalAnnualPremium / upcomingFollowUps), RLS-scoped to the viewer's book.
 *
 * The fetch + math live in `api/dashboardService` (single supabase access
 * layer); the premium figure is the CORRECTED annualised formula — see the
 * documented divergence note there.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { getDashboardStats } from '../api/dashboardService';

/**
 * @param enabled `false` parks the query — the /dashboard Overview reads these
 *   stats at page level and must not fetch for a viewer who does not hold the
 *   `/clients` module. `CrmDashboardPage` leaves the default `true`: its own
 *   `/crm` route guard has already established access by the time it renders.
 */
export function useDashboardStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.crmDashboard.stats(),
    queryFn: getDashboardStats,
    enabled,
  });
}
