/**
 * /clients/:id/srs — Supplementary Retirement Scheme planner.
 *
 * Tool 05 in the customer chain. Two halves, matching the reference tool:
 * paying IN (what it saves now, what it grows to by 63) and taking OUT (how
 * much of each withdrawal escapes tax, and what the 10-year window costs if
 * the plan does not empty the account).
 *
 * The two halves are CHAINED — the withdrawal side starts from the projected
 * balance at 63 unless the advisor overrides it. That link is the tool's whole
 * argument: contribute more, and the drawdown problem gets harder, not easier.
 *
 * Pre-filled from the customer's date of birth and annual income. Nothing is
 * persisted.
 */

import { useMemo, useState } from 'react';
import { Field, Input } from '@/components/primitives/form';
import { Badge } from '@/components/primitives/shell/Badge';
import { currentRefYear } from '@/features/crm/lib/finance';
import type { CrmClient } from '@/features/crm/types';
import { PlanningToolFrame } from '../components/PlanningToolFrame';
import { SrsContributionsPanel } from '../components/srs/SrsContributionsPanel';
import { SrsSchedulePanel } from '../components/srs/SrsSchedulePanel';
import { SrsWithdrawalsPanel } from '../components/srs/SrsWithdrawalsPanel';
import {
  SummaryRow,
  ToolNote,
  ToolPanel,
  ToolSelect,
  ToolStatGrid,
} from '../components/PlanningAtoms';
import { seedAge } from '../lib/customerSeed';
import { money, percent } from '../lib/format';
import {
  projectContributions,
  SRS_CAP_CITIZEN,
  SRS_FORCED_PAYOUT_AGE,
  SRS_WITHDRAWAL_AGE,
  SRS_WITHDRAWAL_WINDOW_YEARS,
} from '../lib/srs';
import { equalWithdrawals, planWithdrawals } from '../lib/srsWithdrawals';

function SrsPlanner({ customer }: { customer: CrmClient }) {
  const refYear = currentRefYear();
  const startingAge = seedAge(customer.dateOfBirth, refYear);

  const [currentAge, setCurrentAge] = useState(() => String(startingAge));
  const [annualIncome, setAnnualIncome] = useState(() => customer.annualIncome || '');
  const [contributionThisYear, setContributionThisYear] = useState(String(SRS_CAP_CITIZEN));
  const [currentBalance, setCurrentBalance] = useState('0');
  const [growthRate, setGrowthRate] = useState('4');
  const [annualContribution, setAnnualContribution] = useState(String(SRS_CAP_CITIZEN));
  const [contributeUntilAge, setContributeUntilAge] = useState('62');

  const [withdrawalYears, setWithdrawalYears] = useState(String(SRS_WITHDRAWAL_WINDOW_YEARS));
  const [withdrawalGrowth, setWithdrawalGrowth] = useState('3');
  const [otherIncome, setOtherIncome] = useState('0');
  const [balanceOverride, setBalanceOverride] = useState('');

  const projection = useMemo(
    () =>
      projectContributions({
        currentAge: Number(currentAge) || 0,
        annualIncome: Number(annualIncome) || 0,
        contributionThisYear: Number(contributionThisYear) || 0,
        currentBalance: Number(currentBalance) || 0,
        growthRate: (Number(growthRate) || 0) / 100,
        annualContribution: Number(annualContribution) || 0,
        contributeUntilAge: Number(contributeUntilAge) || 0,
      }),
    [
      currentAge,
      annualIncome,
      contributionThisYear,
      currentBalance,
      growthRate,
      annualContribution,
      contributeUntilAge,
    ],
  );

  // The withdrawal side starts from the projection unless overridden — the
  // chain between the two halves is the point of the tool.
  const startingBalance =
    balanceOverride.trim() === ''
      ? projection.balanceAtWithdrawalAge
      : Number(balanceOverride) || 0;

  const plan = useMemo(() => {
    const years = Math.max(1, Number(withdrawalYears) || 1);
    const rate = (Number(withdrawalGrowth) || 0) / 100;
    return planWithdrawals({
      startingBalance,
      growthRate: rate,
      otherIncome: Number(otherIncome) || 0,
      amounts: equalWithdrawals(startingBalance, rate, years),
    });
  }, [startingBalance, withdrawalGrowth, otherIncome, withdrawalYears]);

  const overWindow = Number(withdrawalYears) > SRS_WITHDRAWAL_WINDOW_YEARS;

  return (
    <div className="flex flex-col gap-[22px]">
      <ToolStatGrid
        testId="srs-stats"
        stats={[
          {
            label: 'Tax saved this year',
            value: money(projection.taxSavedThisYear),
            hint: `on ${money(Number(contributionThisYear) || 0)} in`,
            tone: projection.taxSavedThisYear > 0 ? 'positive' : 'neutral',
            testId: 'srs-stat-saved',
          },
          {
            label: `Balance at ${SRS_WITHDRAWAL_AGE}`,
            value: money(projection.balanceAtWithdrawalAge),
            hint: `${percent(Number(growthRate) || 0)} growth`,
            testId: 'srs-stat-balance',
          },
          {
            label: 'Lifetime tax saved',
            value: money(projection.lifetimeTaxSaved),
            hint: 'across every contribution',
            tone: 'positive',
            testId: 'srs-stat-lifetime',
          },
          {
            label: 'Tax on withdrawal',
            value: money(plan.totalTax + plan.forcedPayoutTax),
            hint: plan.leavesRemainder ? 'includes forced payout' : 'across the drawdown',
            tone: plan.totalTax + plan.forcedPayoutTax > 0 ? 'negative' : 'positive',
            testId: 'srs-stat-tax',
          },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-2">
        <SrsContributionsPanel
          values={{ currentAge, annualIncome, contributionThisYear, currentBalance, growthRate, annualContribution, contributeUntilAge }}
          setters={{ setCurrentAge, setAnnualIncome, setContributionThisYear, setCurrentBalance, setGrowthRate, setAnnualContribution, setContributeUntilAge }}
          projection={projection}
        />

        <SrsWithdrawalsPanel
          projectedBalance={projection.balanceAtWithdrawalAge}
          values={{ balanceOverride, withdrawalYears, withdrawalGrowth, otherIncome }}
          setters={{ setBalanceOverride, setWithdrawalYears, setWithdrawalGrowth, setOtherIncome }}
          plan={plan}
        />
      </div>

      <SrsSchedulePanel plan={plan} otherIncome={Number(otherIncome) || 0} />

      <ToolNote testId="srs-not-saved">
        Withdrawals may begin at {SRS_WITHDRAWAL_AGE} for current contributors; 50% of each
        withdrawal is chargeable. Nothing here is saved to {customer.name}&rsquo;s record.
      </ToolNote>
    </div>
  );
}

export default function SrsPlannerPage() {
  return (
    <PlanningToolFrame
      index="05"
      title="SRS planner"
      description="What contributing saves now, and what taking it out actually costs."
      testId="srs-planner"
    >
      {(customer) => <SrsPlanner customer={customer} />}
    </PlanningToolFrame>
  );
}
