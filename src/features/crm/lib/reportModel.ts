/**
 * The client report's derived figures, in one place.
 *
 * Split from `ClientReportPage` so the page is about ROUTING (which customer,
 * loading, errors, the picker) and this is about WIRING lib together. It does
 * no arithmetic of its own — every number comes from `finance` /
 * `financeReport`, which the oracle tests golden-lock. The one exception is
 * `yearsTo55`, which is age subtraction, not money (`ClientReportModal.jsx:65`).
 *
 * Pure, so the report's figures can be asserted without rendering React.
 */

import { ageFromDOB, currentRefYear, summariseClient, toFloat } from './finance';
import { assessRetirementReadiness, heroTotals } from './financeReport';
import type { CrmClient, CrmPolicy } from '../types';

export interface ReportModel {
  refYear: number;
  currentAge: number;
  summary: ReturnType<typeof summariseClient>;
  hero: ReturnType<typeof heroTotals>;
  readiness: ReturnType<typeof assessRetirementReadiness>;
}

/** Everything the canvas needs, derived from one customer and their policies. */
export function buildReportModel(client: CrmClient, policies: CrmPolicy[]): ReportModel {
  const refYear = currentRefYear();
  const currentAge = ageFromDOB(client.dateOfBirth || null, refYear);
  const yearsTo55 = Math.max(0, 55 - currentAge);

  return {
    refYear,
    currentAge,
    summary: summariseClient({ annualIncome: client.annualIncome, policies }),
    hero: heroTotals(
      {
        dateOfBirth: client.dateOfBirth || null,
        totalBankBalance: client.totalBankBalance,
        policies,
      },
      refYear,
    ),
    readiness: assessRetirementReadiness(
      {
        dob: client.dateOfBirth || null,
        yearsTo55,
        cpfOA: toFloat(client.cpfOA),
        cpfSA: toFloat(client.cpfSA),
        cpfMA: toFloat(client.cpfMA),
      },
      refYear,
    ),
  };
}
