/**
 * Portfolio-report math — port of the legacy portfolio builder
 * (CrmApp.jsx:109-132 `handleGeneratePortfolioReport`) and the Reports.jsx
 * financial-summary averages (Reports.jsx:70-86, git c09c549), promoted from
 * inline JSX per REPORTS_LINK_PRD.md P3. Split module of the `financeReport`
 * barrel (200-LOC ratchet) — import from `financeReport`; imports are
 * strictly one-way: this file → finance.ts.
 *
 * DOCUMENTED DIVERGENCE (REPORTS_LINK_PRD.md research findings · lib/
 * decisions.md): the legacy portfolio `totalPremium` RAW-summed `premium`
 * per stored frequency yet labeled the row "annual". This port reuses
 * `summariseClient` (frequency-annualised, ILP scaled by inclusion percent)
 * so the portfolio table matches the dashboard KPI tile and the client
 * report. The UI must render an "(annualised)" footnote on the premium rows.
 *
 * Averages keep the legacy 0-when-no-clients guard (Reports.jsx:73,82); the
 * legacy `Math.round(...).toLocaleString()` wrappers are display formatting
 * and stay in components — everything here returns RAW values.
 */
import { summariseClient, type SummaryPolicyInput } from './finance';

/** A policy as the portfolio math consumes it — summary fields + `status`. */
export interface PortfolioPolicyInput extends SummaryPolicyInput {
  status?: string | null;
}

export interface PortfolioTotals {
  /** CrmApp.jsx:125 — non-deleted clients visible to the viewer (RLS-scoped). */
  totalClients: number;
  /** CrmApp.jsx:109 — every policy across the book, regardless of status. */
  totalPolicies: number;
  /** CrmApp.jsx:110-113 — policies with status 'Active'. */
  activePolicies: number;
  /** ANNUALISED premium total (divergence — legacy raw-summed per frequency). */
  totalAnnualPremium: number;
  /** CrmApp.jsx:118-121 — Σ coverageAmount across the book. */
  totalCoverage: number;
  /** Reports.jsx:70-77 — annualised premium / clients; 0 when the book is empty. */
  avgAnnualPremiumPerClient: number;
  /** Reports.jsx:79-86 — coverage / clients; 0 when the book is empty. */
  avgCoveragePerClient: number;
}

/**
 * Book-wide totals for the /crm-reports portfolio report. `policies` is the
 * flattened list across every visible client; `totalClients` comes from the
 * clients query (a client with zero policies still counts — legacy parity).
 */
export function summarisePortfolio(
  totalClients: number,
  policies: readonly PortfolioPolicyInput[],
): PortfolioTotals {
  const { totalAnnualPremium, totalCoverage } = summariseClient({
    annualIncome: 0,
    policies: [...policies],
  });

  return {
    totalClients,
    totalPolicies: policies.length,
    activePolicies: policies.filter((p) => p.status === 'Active').length,
    totalAnnualPremium,
    totalCoverage,
    avgAnnualPremiumPerClient: totalClients > 0 ? totalAnnualPremium / totalClients : 0,
    avgCoveragePerClient: totalClients > 0 ? totalCoverage / totalClients : 0,
  };
}
