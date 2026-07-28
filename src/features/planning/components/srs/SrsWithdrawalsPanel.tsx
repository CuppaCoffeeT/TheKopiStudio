/**
 * SrsWithdrawalsPanel — the "taking out" half of the SRS planner.
 *
 * Extracted from `SrsPlannerPage` (W23 LOC ceiling). The remainder warning is
 * the panel's reason to exist: it is what tells an advisor the drawdown plan
 * does not actually clear the account before the window shuts.
 */

import { Field, Input } from '@/components/primitives/form';
import { SummaryRow, ToolPanel, ToolSelect } from '../PlanningAtoms';
import { money, percent } from '../../lib/format';
import {
  SRS_FORCED_PAYOUT_AGE,
  SRS_WITHDRAWAL_AGE,
  SRS_WITHDRAWAL_WINDOW_YEARS,
} from '../../lib/srs';
import type { WithdrawalPlan } from '../../lib/srsWithdrawals';

interface Values {
  balanceOverride: string; withdrawalYears: string; withdrawalGrowth: string; otherIncome: string;
}
interface Setters {
  setBalanceOverride: (v: string) => void; setWithdrawalYears: (v: string) => void;
  setWithdrawalGrowth: (v: string) => void; setOtherIncome: (v: string) => void;
}

export function SrsWithdrawalsPanel({
  projectedBalance, values, setters, plan,
}: { projectedBalance: number; values: Values; setters: Setters; plan: WithdrawalPlan }) {
  const { balanceOverride, withdrawalYears, withdrawalGrowth, otherIncome } = values;
  const { setBalanceOverride, setWithdrawalYears, setWithdrawalGrowth, setOtherIncome } = setters;
  const projection = { balanceAtWithdrawalAge: projectedBalance };
  const overWindow = Number(withdrawalYears) > SRS_WITHDRAWAL_WINDOW_YEARS;

  return (
<ToolPanel label="Taking out" testId="srs-withdrawals">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <Field
      label={`Balance at ${SRS_WITHDRAWAL_AGE}`}
      hint="Blank = use the projection"
    >
      <Input type="number" min={0} value={balanceOverride}
        placeholder={String(Math.round(projection.balanceAtWithdrawalAge))}
        onChange={(e) => setBalanceOverride(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-withdrawal-balance" />
    </Field>
    <Field label="Spread over" hint={`${SRS_WITHDRAWAL_WINDOW_YEARS} years is penalty-free`}>
      <ToolSelect
        value={withdrawalYears}
        onChange={setWithdrawalYears}
        ariaLabel="Spread withdrawals over"
        options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
          value: String(n),
          label: `${n} year${n === 1 ? '' : 's'}`,
        }))}
        testId="srs-withdrawal-years"
      />
    </Field>
    <Field label="Growth during drawdown" hint="Percent per year">
      <Input type="number" min={0} step="0.5" value={withdrawalGrowth}
        onChange={(e) => setWithdrawalGrowth(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-withdrawal-growth" />
    </Field>
    <Field label="Other income then" hint="Eats the tax-free room first">
      <Input type="number" min={0} value={otherIncome}
        onChange={(e) => setOtherIncome(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-other-income" />
    </Field>
  </div>

  <div className="mt-4 border-t border-[color:var(--border-soft)] pt-3">
    <SummaryRow label="Total withdrawn" value={money(plan.totalWithdrawn)} />
    <SummaryRow label="Growth during drawdown" value={money(plan.totalGrowth)} />
    <SummaryRow label="Actually tax-free" value={money(plan.totalTaxFree)} />
    <SummaryRow label="Tax paid" value={money(plan.totalTax)} />
    <SummaryRow label="Effective rate" value={percent(plan.effectiveTaxRate, 2)} />
    <SummaryRow
      label="Net received"
      value={money(plan.netReceived)}
      total
      testId="srs-net-received"
    />
  </div>

  {plan.leavesRemainder && (
    <p
      className="m-0 mt-3 rounded-lg border border-border bg-[color:var(--red-soft)] px-3 py-2.5 text-[12px] leading-[1.6] text-[color:var(--negative-text-on-tint)]"
      data-testid="srs-remainder-warning"
    >
      <strong className="font-semibold">{money(plan.remainingBalance)} would be left.</strong>{' '}
      Anything still in the account when the {SRS_WITHDRAWAL_WINDOW_YEARS}-year window
      closes at {SRS_FORCED_PAYOUT_AGE} is deemed withdrawn in one lump — roughly{' '}
      {money(plan.forcedPayoutTax)} of tax in a single year. Spread the drawdown wider or
      contribute less.
    </p>
  )}

  {overWindow && (
    <p className="m-0 mt-3 text-[12px] text-[color:var(--negative-text)]">
      Beyond {SRS_WITHDRAWAL_WINDOW_YEARS} years the penalty-free window has closed.
    </p>
  )}
</ToolPanel>
  );
}
