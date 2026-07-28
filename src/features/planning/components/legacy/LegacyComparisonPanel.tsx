/**
 * LegacyComparisonPanel — the deliverable.
 *
 * Extracted from `LegacyPlannerPage` (W23 LOC ceiling). Everything above it in
 * the tool is data entry; THIS is what the customer is shown: the same people,
 * side by side, under their plan and under the Intestate Succession Act.
 *
 * A beneficiary who receives LESS under the law reads terracotta — that gap is
 * the reason to write a will, and it should be the first thing the eye finds.
 */

import { SummaryRow, ToolPanel } from '../PlanningAtoms';
import { money } from '../../lib/format';
import type { EstateTotals } from '../../lib/legacy';
import type { IsaResult, PlanningGap } from '../../lib/legacyIsa';

interface LegacyComparisonPanelProps {
  totals: EstateTotals;
  isa: IsaResult;
  planned: Record<string, number>;
  gap: PlanningGap;
  nameFor: (personId: string) => string;
}

export function LegacyComparisonPanel({
  totals, isa, planned, gap, nameFor,
}: LegacyComparisonPanelProps) {
  return (
<ToolPanel label="With a plan, versus the law" testId="legacy-comparison">
  <p className="m-0 mb-4 text-[12.5px] leading-[1.6] text-[color:var(--fg-dim)]">
    With no will, the Intestate Succession Act 1967 decides. For this family that is{' '}
    <strong className="font-semibold text-foreground">{isa.rule.number}</strong> —{' '}
    {isa.rule.condition.toLowerCase()}: {isa.rule.distribution.toLowerCase()}.
  </p>

  <div className="overflow-x-auto">
    <table className="w-full min-w-[460px] border-collapse text-[12.5px]">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="py-2 pr-4 font-semibold text-foreground">Beneficiary</th>
          <th className="py-2 pr-4 text-right font-semibold text-foreground">Under the plan</th>
          <th className="py-2 text-right font-semibold text-foreground">Under the law</th>
        </tr>
      </thead>
      <tbody>
        {Array.from(new Set([...Object.keys(planned), ...Object.keys(isa.distribution)])).map(
          (personId) => {
            const withPlan = planned[personId] ?? 0;
            const withoutPlan = isa.distribution[personId] ?? 0;
            return (
              <tr
                key={personId}
                className="border-b border-[color:var(--border-soft)]"
                data-testid={`legacy-compare-${personId}`}
              >
                <td className="py-2 pr-4 text-foreground">{nameFor(personId)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-foreground">{money(withPlan)}</td>
                <td
                  className={
                    withoutPlan < withPlan
                      ? 'py-2 text-right tabular-nums text-[color:var(--negative-text)]'
                      : 'py-2 text-right tabular-nums text-[color:var(--fg-dim)]'
                  }
                >
                  {money(withoutPlan)}
                </td>
              </tr>
            );
          },
        )}
      </tbody>
    </table>
  </div>

  <div className="mt-4 border-t border-border pt-3">
    <SummaryRow label="Directed by the plan" value={money(gap.withPlanning)} />
    <SummaryRow label="Directed by the law" value={money(gap.withoutPlanning)} />
    <SummaryRow
      label="Estate the law would decide"
      value={money(totals.unallocatedTotal)}
      total
      testId="legacy-undirected"
    />
  </div>

  {totals.unallocatedTotal > 0 && (
    <p
      className="m-0 mt-3 rounded-lg border border-border bg-[color:var(--red-soft)] px-3 py-2.5 text-[12px] leading-[1.6] text-[color:var(--negative-text-on-tint)]"
      data-testid="legacy-warning"
    >
      <strong className="font-semibold">{money(totals.unallocatedTotal)} is undirected.</strong>{' '}
      Without a will that share is distributed by {isa.rule.number}, whoever the customer
      intended.
    </p>
  )}
</ToolPanel>
  );
}
