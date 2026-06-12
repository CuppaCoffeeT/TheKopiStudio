/**
 * Report sections [8]/[9] residual math — the LAST inline expressions of the
 * legacy `CPFProjection.jsx` / `RetirementProjection.jsx` (git c09c549) that
 * the P1 extension did not promote, named here so the section components stay
 * formatting-only. New split module (200-LOC ratchet on financeReport.ts /
 * financeReportEconomics.ts), re-exported by the `financeReport` barrel —
 * import from `financeReport`. Imports stay strictly one-way:
 * this file → financeReportEconomics → finance.ts.
 *
 * Oracle-locked: `__tests__/financeReportSections.test.ts` compares every
 * function against expressions copied verbatim from the legacy JSX. All
 * values are RAW — locale formatting (and the legacy per-cell Math.round /
 * unrounded-toLocaleString split) stays in the components.
 */
import { toFloat } from './finance';
import { investedAt6, projectBankTo65 } from './financeReportEconomics';

/** CPFProjection.jsx:111 — the account table's "Current" total row (OA + SA + MA). */
export function cpfCurrentTotal(cpfOA: number, cpfSA: number, cpfMA: number): number {
  return cpfOA + cpfSA + cpfMA;
}

/**
 * CPFProjection.jsx:181-182,188-189 — the FRS/BRS shortfall amount in the RA
 * alert copy (`sums.frs - projectedRA` / `sums.brs - projectedRA`). The UI
 * locale-formats it WITHOUT rounding, exactly like legacy.
 */
export function raShortfall(targetSum: number, projectedRA: number): number {
  return targetSum - projectedRA;
}

/**
 * RetirementProjection.jsx:15,19 — the total retirement sum in the
 * "if invested at 6%" scenario: ILP illustrated value + bank balance
 * compounded at the moderate 6% return (same float operation order as the
 * legacy locals, so the opportunity-cost table replays exactly).
 */
export function totalRetirementIfInvested(
  ilpValueAt65: number,
  balance: number,
  yearsTo65: number,
): number {
  return ilpValueAt65 + investedAt6(balance, yearsTo65);
}

/**
 * RetirementProjection.jsx:167 — the opportunity-cost row's "Total retirement
 * sum" column: the if-invested total MINUS the keep-in-bank total. Legacy
 * subtracts the two precomputed totals (each built as ILP + projected bank),
 * which is float-identical to this composition — do NOT replace with
 * `opportunityCost` (different operation order, last-ulp divergence risk).
 */
export function retirementSumOpportunityCost(
  ilpValueAt65: number,
  balance: number,
  yearsTo65: number,
): number {
  return (
    totalRetirementIfInvested(ilpValueAt65, balance, yearsTo65) -
    (ilpValueAt65 + projectBankTo65(balance, yearsTo65))
  );
}

/**
 * RetirementProjection.jsx:116-121 — the component table's "Current" total
 * row: bank balance + Σ ILP current account values (legacy `parseFloat(v||0)`
 * coercion via toFloat).
 */
export function currentHoldingsTotal(
  balance: number,
  investmentPolicies: Array<{ currentAccountValue?: string | number | null }>,
): number {
  return balance + investmentPolicies.reduce((s, p) => s + toFloat(p.currentAccountValue), 0);
}
