/**
 * TaxSummaryPanel — the assessment ladder, from assessable income to tax due.
 *
 * Extracted from `TaxCalculatorPage` (W23 LOC ceiling). Reads ONE `assessTax`
 * result and renders it; no figure is recomputed here, so the ladder can never
 * disagree with the relief rows beside it.
 */

import { SummaryRow, ToolNote, ToolPanel } from '../PlanningAtoms';
import { money, moneyNegative } from '../../lib/format';
import { RELIEF_CAP } from '../../lib/singaporeTax';
import type { TaxAssessment } from '../../lib/taxAssessment';

export function TaxSummaryPanel({ assessment }: { assessment: TaxAssessment }) {
  return (
<ToolPanel label="Assessment" className="lg:sticky lg:top-6" testId="tax-summary">
  <SummaryRow
    label="Assessable income"
    value={money(assessment.assessableIncome)}
    testId="tax-summary-assessable"
  />
  <SummaryRow
    label="Less reliefs"
    value={moneyNegative(assessment.reliefsApplied)}
    muted
    testId="tax-summary-reliefs"
  />
  {assessment.reliefCapHit && (
    <p
      className="m-0 py-1 text-[11.5px] text-[color:var(--negative-text)]"
      data-testid="tax-summary-cap"
    >
      Relief cap reached — {money(assessment.totalReliefsClaimed)} claimed,{' '}
      {money(RELIEF_CAP)} allowed.
    </p>
  )}
  <SummaryRow
    label="Less donations"
    value={moneyNegative(assessment.donationDeduction)}
    muted
    testId="tax-summary-donations"
  />
  <SummaryRow
    label="Chargeable income"
    value={money(assessment.chargeableIncome)}
    testId="tax-summary-chargeable"
  />
  <SummaryRow label="Gross tax" value={money(assessment.tax.gross)} />
  <SummaryRow
    label="Less rebate"
    value={moneyNegative(assessment.tax.rebate)}
    muted
  />
  <SummaryRow
    label="Tax payable"
    value={money(assessment.tax.net)}
    total
    testId="tax-summary-net"
  />

  <ToolNote>
    YA 2025/2026 resident rates. Personal reliefs are capped at {money(RELIEF_CAP)} in
    total; the rebate is 60% of gross tax up to $200. Figures are an estimate for
    discussion — IRAS assesses the return.
  </ToolNote>
</ToolPanel>
  );
}
