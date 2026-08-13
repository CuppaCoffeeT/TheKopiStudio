/**
 * SrsContributionsPanel — the "paying in" half of the SRS planner.
 *
 * Fully controlled; `useSrsPlanner` owns the state and the
 * `projectContributions` call, so this file has no maths at all.
 *
 * The withdrawal age is an INPUT, not a constant: it is locked in at the
 * statutory retirement age that applied when the customer made their FIRST
 * contribution, so two customers of the same age can have different ones.
 */

import { Field, Input } from '@/components/primitives/form';
import { SummaryRow, ToolPanel, ToolSelect } from '../PlanningAtoms';
import { money, percent } from '../../lib/format';
import { SRS_CAP_CITIZEN, SRS_STATUTORY_AGES, type ContributionProjection } from '../../lib/srs';

interface Values {
  currentAge: string; annualIncome: string; contributionThisYear: string;
  currentBalance: string; growthRate: string; annualContribution: string;
  contributeUntilAge: string; withdrawalAge: string;
}
interface Setters {
  setCurrentAge: (v: string) => void; setAnnualIncome: (v: string) => void;
  setContributionThisYear: (v: string) => void; setCurrentBalance: (v: string) => void;
  setGrowthRate: (v: string) => void; setAnnualContribution: (v: string) => void;
  setContributeUntilAge: (v: string) => void; setWithdrawalAge: (v: string) => void;
}

/**
 * What fixes each statutory age — the date of the customer's FIRST
 * contribution. Kept terse so the option does not wrap in the half-width
 * trigger; the full sentence is the field's hint.
 */
const AGE_HINTS: Record<number, string> = {
  62: 'before 1 Jul 2022',
  63: 'before 1 Jul 2026',
  64: 'from 1 Jul 2026',
};

export function SrsContributionsPanel({
  values, setters, projection,
}: { values: Values; setters: Setters; projection: ContributionProjection }) {
  const { currentAge, annualIncome, contributionThisYear, currentBalance, growthRate, annualContribution, contributeUntilAge, withdrawalAge } = values;
  const { setCurrentAge, setAnnualIncome, setContributionThisYear, setCurrentBalance, setGrowthRate, setAnnualContribution, setContributeUntilAge, setWithdrawalAge } = setters;

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
    <Field label="Contribute until age" hint="Contributions must stop once withdrawals start">
      <Input type="number" min={18} max={75} value={contributeUntilAge}
        onChange={(e) => setContributeUntilAge(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-until" />
    </Field>
    <Field
      label="Withdrawal age"
      hint="Set by the date of the first contribution — it never moves afterwards"
    >
      <ToolSelect
        value={withdrawalAge}
        onChange={setWithdrawalAge}
        ariaLabel="Penalty-free withdrawal age"
        options={SRS_STATUTORY_AGES.map((age) => ({
          value: String(age),
          label: `${age} — ${AGE_HINTS[age]}`,
        }))}
        testId="srs-withdrawal-age"
      />
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
      label={`Balance at ${withdrawalAge}`}
      value={money(projection.balanceAtWithdrawalAge)}
      total
      testId="srs-projected-balance"
    />
  </div>
</ToolPanel>
  );
}
