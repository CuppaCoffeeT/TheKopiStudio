/**
 * SrsContributionsPanel — the "paying in" half of the SRS planner.
 *
 * Extracted from `SrsPlannerPage` (W23 LOC ceiling). Fully controlled; the
 * page owns the state and the `projectContributions` call, so this file has no
 * maths at all.
 */

import { Field, Input } from '@/components/primitives/form';
import { SummaryRow, ToolPanel } from '../PlanningAtoms';
import { money, percent } from '../../lib/format';
import { SRS_CAP_CITIZEN, SRS_WITHDRAWAL_AGE, type ContributionProjection } from '../../lib/srs';

interface Values {
  currentAge: string; annualIncome: string; contributionThisYear: string;
  currentBalance: string; growthRate: string; annualContribution: string; contributeUntilAge: string;
}
interface Setters {
  setCurrentAge: (v: string) => void; setAnnualIncome: (v: string) => void;
  setContributionThisYear: (v: string) => void; setCurrentBalance: (v: string) => void;
  setGrowthRate: (v: string) => void; setAnnualContribution: (v: string) => void;
  setContributeUntilAge: (v: string) => void;
}

export function SrsContributionsPanel({
  values, setters, projection,
}: { values: Values; setters: Setters; projection: ContributionProjection }) {
  const { currentAge, annualIncome, contributionThisYear, currentBalance, growthRate, annualContribution, contributeUntilAge } = values;
  const { setCurrentAge, setAnnualIncome, setContributionThisYear, setCurrentBalance, setGrowthRate, setAnnualContribution, setContributeUntilAge } = setters;

  return (
<ToolPanel label="Paying in" testId="srs-contributions">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <Field label="Current age">
      <Input type="number" min={18} max={62} value={currentAge}
        onChange={(e) => setCurrentAge(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-age" />
    </Field>
    <Field label="Chargeable income" hint="Before the SRS deduction">
      <Input type="number" min={0} value={annualIncome}
        onChange={(e) => setAnnualIncome(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-income" />
    </Field>
    <Field label="Contribution this year" hint={`Cap ${money(SRS_CAP_CITIZEN)} for citizens/PRs`}>
      <Input type="number" min={0} value={contributionThisYear}
        onChange={(e) => setContributionThisYear(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-contribution" />
    </Field>
    <Field label="Current SRS balance">
      <Input type="number" min={0} value={currentBalance}
        onChange={(e) => setCurrentBalance(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-balance" />
    </Field>
    <Field label="Growth rate" hint="Percent per year">
      <Input type="number" min={0} step="0.5" value={growthRate}
        onChange={(e) => setGrowthRate(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-growth" />
    </Field>
    <Field label="Contribution each future year">
      <Input type="number" min={0} value={annualContribution}
        onChange={(e) => setAnnualContribution(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-annual" />
    </Field>
    <Field label="Contribute until age">
      <Input type="number" min={18} max={62} value={contributeUntilAge}
        onChange={(e) => setContributeUntilAge(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-until" />
    </Field>
  </div>

  <div className="mt-4 border-t border-[color:var(--border-soft)] pt-3">
    <SummaryRow label="Tax without SRS" value={money(projection.taxWithoutSrs)} />
    <SummaryRow label="Tax with SRS" value={money(projection.taxWithSrs)} />
    <SummaryRow
      label="Effective rate"
      value={`${percent(projection.effectiveRateBefore, 2)} → ${percent(projection.effectiveRateAfter, 2)}`}
    />
    <SummaryRow label="Total contributed" value={money(projection.totalContributed)} />
    <SummaryRow
      label={`Balance at ${SRS_WITHDRAWAL_AGE}`}
      value={money(projection.balanceAtWithdrawalAge)}
      total
      testId="srs-projected-balance"
    />
  </div>
</ToolPanel>
  );
}
