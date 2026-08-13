/**
 * SrsProjectionPanel — the accumulation table, in milestones.
 *
 * A row per year for twenty-five years is noise an advisor reads past. The
 * reference shows the next round five-year birthday, then every fifth, then
 * the withdrawal age — enough to see the curve bend without the tape.
 *
 * Renders nothing when the customer is already at their withdrawal age; there
 * is no accumulation left to show.
 */

import { ToolPanel } from '../PlanningAtoms';
import { money, percent } from '../../lib/format';
import type { ContributionYear } from '../../lib/srs';

interface SrsProjectionPanelProps {
  rows: ContributionYear[];
  currentAge: number;
  contributeUntilAge: string;
  annualContribution: string;
  growthRate: number;
}

export function SrsProjectionPanel({
  rows, currentAge, contributeUntilAge, annualContribution, growthRate,
}: SrsProjectionPanelProps) {
  if (rows.length === 0) return null;

  return (
    <ToolPanel label="Year-by-year projection" testId="srs-projection">
      <p className="m-0 mb-3 text-[12px] leading-[1.6] text-[color:var(--fg-dim)]">
        Contributing {money(Number(annualContribution) || 0)} a year at {percent(growthRate)}{' '}
        growth, from age {currentAge} to {contributeUntilAge}.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 font-semibold text-foreground">Age</th>
              <th className="py-2 pr-4 text-right font-semibold text-foreground">Balance</th>
              <th className="py-2 text-right font-semibold text-foreground">Cumulative tax saved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.age}
                className="border-b border-[color:var(--border-soft)]"
                data-testid={`srs-projection-row-${row.age}`}
              >
                <td className="py-2 pr-4 text-foreground">{row.age}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-foreground">
                  {money(row.balance)}
                </td>
                <td className="py-2 text-right tabular-nums text-[color:var(--sage-text)]">
                  {money(row.cumulativeTaxSaved)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ToolPanel>
  );
}
