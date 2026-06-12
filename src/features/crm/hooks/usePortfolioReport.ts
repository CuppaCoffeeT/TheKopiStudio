/**
 * usePortfolioReport — the /crm-reports book-wide report payload (totals via
 * `summarisePortfolio` — ANNUALISED divergence — plus per-client policy
 * blocks), RLS-scoped to the viewer's book.
 *
 * The fetch + assembly live in `api/portfolioService` (single supabase
 * access layer); the key is the dedicated `crmPortfolio` factory entry.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { getPortfolioReport } from '../api/portfolioService';

export function usePortfolioReport() {
  return useQuery({
    queryKey: queryKeys.crmPortfolio.report(),
    queryFn: getPortfolioReport,
  });
}
