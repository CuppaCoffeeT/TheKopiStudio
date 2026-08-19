/**
 * TaxStatsRow — the four headline figures above the tax calculator.
 *
 * Split out of `TaxCalculatorPage` (LOC ceiling) when the page gained its save
 * bar. Pure projection of one `TaxAssessment`: every figure comes from the same
 * result object the panels below read, so a headline can never disagree with
 * the ladder that produced it.
 */

import { ToolStatGrid } from '@/components/primitives/tools';
import type { TaxAssessment } from '../../lib/taxAssessment';
import { RELIEF_CAP } from '../../lib/singaporeTax';
import { money, percent } from '../../lib/format';

export function TaxStatsRow({ assessment }: { assessment: TaxAssessment }) {
  return (
    <ToolStatGrid
      testId="tax-stats"
      stats={[
        {
          label: 'Tax payable',
          value: money(assessment.tax.net),
          hint: `after ${money(assessment.tax.rebate)} rebate`,
          testId: 'tax-stat-payable',
        },
        {
          label: 'Effective rate',
          value: percent(assessment.effectiveRate),
          hint: 'of assessable income',
          testId: 'tax-stat-rate',
        },
        {
          label: 'Reliefs applied',
          value: money(assessment.reliefsApplied),
          hint: assessment.reliefCapHit ? `capped at ${money(RELIEF_CAP)}` : 'under the cap',
          testId: 'tax-stat-reliefs',
        },
        {
          label: 'Tax saved',
          value: money(assessment.taxSaved),
          hint: 'vs no reliefs or donations',
          tone: assessment.taxSaved > 0 ? 'positive' : 'neutral',
          testId: 'tax-stat-saved',
        },
      ]}
    />
  );
}
