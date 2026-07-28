/**
 * useDetailJourney — the customer detail page's chain state.
 *
 * Extracted from `ClientDetailPage` (W23 LOC ceiling). The page was deriving
 * the journey inline alongside its tabs, actions and three modals; here the
 * derivation sits on its own where the reasoning about it can live.
 *
 * The launcher's states come from the SAME ruleset the Overview queue and the
 * Customers list checklist read (`lib/customerJourney`), so this page can never
 * disagree with the row that opened it.
 *
 * `linkedResults` is RLS-pruned: a profile owned by another advisor reads as
 * un-profiled, deliberately indistinguishable from never-profiled (the
 * REPORTS_LINK_PRD neutral-empty-state rule).
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deriveJourney, type CustomerJourney } from '../lib/customerJourney';
import type { CrmClient, LinkedProfilerResult } from '../types';

const PROFILER_PATH = '/profiler';

export interface DetailJourney {
  /** Null until the customer resolves. */
  journey: CustomerJourney | null;
  /** Newest linked profiler result visible to this viewer, if any. */
  newestLinkedResult: LinkedProfilerResult | null;
  /** True when the viewer holds the `/profiler` module. */
  canProfile: boolean;
}

export function useDetailJourney(
  model: CrmClient | null,
  linkedResults: LinkedProfilerResult[] | undefined,
): DetailJourney {
  const { modules } = useAuth();
  const newestLinkedResult = linkedResults?.[0] ?? null;

  const journey = useMemo(
    () =>
      model
        ? deriveJourney({
            hasProfile: Boolean(newestLinkedResult),
            email: model.email,
            phone: model.phone,
            dateOfBirth: model.dateOfBirth,
            occupation: model.occupation,
            annualIncome: model.annualIncome === '' ? null : Number(model.annualIncome),
            nextReviewDate: model.nextReviewDate,
          })
        : null,
    [model, newestLinkedResult],
  );

  return {
    journey,
    newestLinkedResult,
    canProfile: modules.some((mod) => mod.path === PROFILER_PATH),
  };
}
