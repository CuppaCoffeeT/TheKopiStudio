/**
 * SrsWithdrawalsPanel — the "taking out" half of the SRS planner.
 *
 * The opening balance is the projection's balance at the FIRST withdrawal —
 * deferring is priced on the paying-in side, where the years actually belong,
 * so nothing is compounded between the two panels. The advisor can still
 * override the figure to plan from a number they already have.
 *
 * The lever that remains here is STRATEGY: a level annual draw, or up to three
 * custom legs. And the remainder warning is still the panel's reason to exist —
 * it is what tells an advisor the plan does not clear the account before the
 * window shuts.
 */

import { Field, Input } from '@/components/primitives/form';
import { SummaryRow, ToolPanel, ToolSelect } from '../PlanningAtoms';
import { money, percent } from '../../lib/format';
import { SRS_WITHDRAWAL_WINDOW_YEARS } from '../../lib/srs';
import type { WithdrawalPlan } from '../../lib/srsWithdrawals';
import type { PeriodFields, WithdrawalStrategy } from '../../hooks/useSrsPlanner';
import { SrsPeriodFields } from './SrsPeriodFields';

interface Values {
  balanceOverride: string; withdrawalYears: string;
  withdrawalGrowth: string; otherIncome: string;
  strategy: WithdrawalStrategy; periods: PeriodFields[];
}
interface Setters {
  setBalanceOverride: (v: string) => void;
  setWithdrawalYears: (v: string) => void; setWithdrawalGrowth: (v: string) => void;
  setOtherIncome: (v: string) => void; setStrategy: (v: WithdrawalStrategy) => void;
  setPeriod: (index: number, field: keyof PeriodFields, value: string) => void;
}

interface SrsWithdrawalsPanelProps {
  projectedBalance: number;
  /** Age the first withdrawal is planned for — set on the paying-in side. */
  startAge: number;
  values: Values;
  setters: Setters;
  plan: WithdrawalPlan;
}

export function SrsWithdrawalsPanel({
  projectedBalance, startAge, values, setters, plan,
}: SrsWithdrawalsPanelProps) {
  const { balanceOverride, withdrawalYears, withdrawalGrowth, otherIncome, strategy, periods } = values;
  const { setBalanceOverride, setWithdrawalYears, setWithdrawalGrowth, setOtherIncome, setStrategy, setPeriod } = setters;

  return (
<ToolPanel label="Taking out" testId="srs-withdrawals">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <Field label={`Balance at ${startAge}`} hint="Blank = use the projection from paying in">
      <Input type="number" min={0} value={balanceOverride}
        placeholder={String(Math.round(projectedBalance))}
        onChange={(e) => setBalanceOverride(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-withdrawal-balance" />
    </Field>
    <Field label="Growth during drawdown" hint="Percent per year">
      <Input type="number" min={0} step="0.5" value={withdrawalGrowth}
        onChange={(e) => setWithdrawalGrowth(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-withdrawal-growth" />
    </Field>
    <Field label="Other taxable income then" hint="Rent, work, taxable pensions. CPF LIFE is not taxable — leave it out">
      <Input type="number" min={0} value={otherIncome}
        onChange={(e) => setOtherIncome(e.target.value)}
        className="pointer-coarse:text-[16px]" data-testid="srs-other-income" />
    </Field>
    <Field label="Strategy" hint="How the money comes out">
      <ToolSelect
        value={strategy}
        onChange={(next) => setStrategy(next as WithdrawalStrategy)}
        ariaLabel="Withdrawal strategy"
        options={[
          { value: 'equal', label: 'Level annual draw' },
          { value: 'custom', label: 'Custom legs' },
        ]}
        testId="srs-strategy"
      />
    </Field>
    {strategy === 'equal' && (
      <Field label="Spread over" hint={`${SRS_WITHDRAWAL_WINDOW_YEARS} years is the whole window`}>
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
    )}
  </div>

  {strategy === 'custom' && <SrsPeriodFields periods={periods} onChange={setPeriod} />}

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
      closes at {plan.windowEndsAt} is deemed withdrawn in one lump — roughly{' '}
      {money(plan.forcedPayoutTax)} of tax in a single year. Spread the drawdown wider or
      contribute less.
    </p>
  )}
</ToolPanel>
  );
}
