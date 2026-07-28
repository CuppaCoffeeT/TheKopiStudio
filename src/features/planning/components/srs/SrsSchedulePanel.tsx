/**
 * SrsSchedulePanel — the year-by-year drawdown table.
 *
 * Extracted from `SrsPlannerPage` (W23 LOC ceiling). Renders nothing when the
 * plan has no years, so the page can mount it unconditionally.
 *
 * The zero-other-income note is the tool's headline advice: $40,000 a year
 * comes out entirely free — half statutorily exempt, half inside the $20,000
 * zero band.
 */

import { Badge } from '@/components/primitives/shell/Badge';
import { ToolPanel } from '../PlanningAtoms';
import { money } from '../../lib/format';
import type { WithdrawalPlan } from '../../lib/srsWithdrawals';

export function SrsSchedulePanel({
  plan, otherIncome,
}: { plan: WithdrawalPlan; otherIncome: number }) {
  if (plan.schedule.length === 0) return null;
  return (
      <ToolPanel label="Withdrawal schedule" testId="srs-schedule">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[520px] border-collapse text-[12.5px]">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="py-2 pr-4 font-semibold text-foreground">Age</th>
          <th className="py-2 pr-4 text-right font-semibold text-foreground">Withdrawal</th>
          <th className="py-2 pr-4 text-right font-semibold text-foreground">Tax-free</th>
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
            <td className="py-2 pr-4 text-right tabular-nums text-[color:var(--sage-text)]">{money(year.taxFree)}</td>
            <td className="py-2 pr-4 text-right tabular-nums text-foreground">{money(year.tax)}</td>
            <td className="py-2 text-right tabular-nums text-[color:var(--fg-dim)]">{money(year.endBalance)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {otherIncome === 0 && (
    <p className="m-0 mt-3 flex items-center gap-2 text-[12px] text-[color:var(--fg-dim)]">
      <Badge tone="success" dot={false}>Max tax-free</Badge>
      With no other income, $40,000 a year comes out entirely tax-free — half exempt, half
      inside the $20,000 zero band.
    </p>
  )}
</ToolPanel>
  );
}
