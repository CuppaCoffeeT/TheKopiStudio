/**
 * SrsSchedulePanel — the year-by-year drawdown table.
 *
 * The TAXED PORTION is the column that changed the tool: an advisor does not
 * need to be told how much came out free, they need to see the years where
 * something did not. A year with nothing taxed says "None" in sage; every
 * other year states the number it is taxed on.
 *
 * The closing row is the forced payout — what the window shutting actually
 * costs, on the same ladder as the years above it.
 *
 * Renders nothing when the plan has no years, so the page can mount it
 * unconditionally.
 */

import { ToolPanel } from '@/components/primitives/tools';
import { money } from '../../lib/format';
import type { WithdrawalPlan } from '../../lib/srsWithdrawals';

interface SrsSchedulePanelProps {
  plan: WithdrawalPlan;
  /** The most that can come out in a year with no tax at all. */
  annualCeiling: number;
  /** Positive when the plan averages MORE than that ceiling. */
  overCeilingBy: number;
  otherIncome: number;
}

export function SrsSchedulePanel({
  plan, annualCeiling, overCeilingBy, otherIncome,
}: SrsSchedulePanelProps) {
  if (plan.schedule.length === 0) return null;
  const first = plan.schedule[0].age;
  const last = plan.schedule.at(-1)!.age;

  return (
<ToolPanel
  label={`Withdrawal schedule — age ${first}–${last}`}
  testId="srs-schedule"
>
  <div className="overflow-x-auto">
    <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="py-2 pr-4 font-semibold text-foreground">Age</th>
          <th className="py-2 pr-4 text-right font-semibold text-foreground">Withdrawal</th>
          <th className="py-2 pr-4 text-right font-semibold text-foreground">Taxed portion</th>
          <th className="py-2 pr-4 text-right font-semibold text-foreground">Tax</th>
          <th className="py-2 text-right font-semibold text-foreground">Balance left</th>
        </tr>
      </thead>
      <tbody>
        {plan.schedule.map((year) => (
          <tr
            key={year.age}
            className="border-b border-[color:var(--border-soft)]"
            data-testid={`srs-schedule-row-${year.age}`}
          >
            <td className="py-2 pr-4 text-foreground">{year.age}</td>
            <td className="py-2 pr-4 text-right tabular-nums text-foreground">{money(year.withdrawal)}</td>
            <td
              className={
                year.taxedPortion < 1
                  ? 'py-2 pr-4 text-right tabular-nums text-[color:var(--sage-text)]'
                  : 'py-2 pr-4 text-right tabular-nums text-foreground'
              }
            >
              {year.taxedPortion < 1 ? 'None' : money(year.taxedPortion)}
            </td>
            <td className="py-2 pr-4 text-right tabular-nums text-foreground">{money(year.tax)}</td>
            <td className="py-2 text-right tabular-nums text-[color:var(--fg-dim)]">{money(year.endBalance)}</td>
          </tr>
        ))}
        <tr data-testid="srs-schedule-close">
          <td className="py-2 pr-4 font-semibold text-foreground">{plan.windowEndsAt}</td>
          <td className="py-2 pr-4 text-right text-[color:var(--fg-dim)]" colSpan={4}>
            {plan.leavesRemainder ? (
              <span className="text-[color:var(--negative-text)]">
                Window shuts — {money(plan.remainingBalance)} force-paid, about{' '}
                {money(plan.forcedPayoutTax)} of tax in that one year.
              </span>
            ) : (
              <span className="text-[color:var(--sage-text)]">
                Window shuts with the account already empty — nothing force-paid.
              </span>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p
    className="m-0 mt-3 text-[12px] leading-[1.6] text-[color:var(--fg-dim)]"
    data-testid="srs-ceiling-note"
  >
    {annualCeiling > 0 ? (
      <>
        <strong className="font-semibold text-foreground">
          Tax-free ceiling {money(annualCeiling)} a year.
        </strong>{' '}
        {otherIncome === 0
          ? 'With no other taxable income the first $40,000 drawn each year is untaxed — half exempt, half inside the $20,000 zero-rate band.'
          : `With ${money(otherIncome)} of other taxable income the ceiling drops to ${money(annualCeiling)}.`}{' '}
        This plan averages {money(plan.averagePerYear)} a year
        {overCeilingBy > 0
          ? ` — ${money(overCeilingBy)} over, which is what the ${money(plan.totalTax)} tax bill is. Stretch it wider or draw less.`
          : ' — inside the ceiling, so these withdrawals cost nothing.'}
      </>
    ) : (
      <>
        <strong className="font-semibold text-foreground">No tax-free room.</strong>{' '}
        {money(otherIncome)} of other taxable income already uses up the $20,000 zero-rate
        band. Half of every withdrawal is still exempt, but the other half is taxed from the
        first dollar.
      </>
    )}
  </p>
</ToolPanel>
  );
}
