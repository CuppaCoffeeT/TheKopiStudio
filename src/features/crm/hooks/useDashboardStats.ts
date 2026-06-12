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

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.crmDashboard.stats(),
    queryFn: getDashboardStats,
  });
}
