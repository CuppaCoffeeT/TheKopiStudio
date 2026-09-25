/**
 * "See every month" — all 36 months with a Year subtotal after each twelfth.
 * Native <details>, collapsed by default as in the sheet; scrolls sideways on
 * a phone rather than squeezing six money columns.
 */

import { cn } from '@/lib/utils';
import { money } from '../../lib/format';
import { monthTableRows } from '../../lib/sapProCopy';
import type { SapIllustration } from '../../lib/sapProMath';

const HEADERS = ['Month', 'Base', 'Support', 'Monthly bonus', 'Quarterly bonus', 'Total'];
const CELL = 'border-b border-border px-2 py-[7px] text-right first:text-left whitespace-nowrap';

export function SapProMonthTable({ illustration }: { illustration: SapIllustration }) {
  return (
    <details className="group mt-5" data-testid="sap-pro-table">
      <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        See every month
      </summary>
      <div className="mt-2.5 overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[560px] border-collapse text-[13px] tabular-nums">
          <thead>
            <tr>
              {HEADERS.map((h) => (
                <th key={h} scope="col" className={cn(CELL, 'bg-secondary font-semibold text-[color:var(--fg-dim)]')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthTableRows(illustration).map((row) => (
              <tr
                key={row.key}
                className={cn(row.yearSum && 'font-semibold [&>td]:border-t [&>td]:border-t-foreground')}
                data-testid={row.yearSum ? `sap-pro-table-${row.key}` : undefined}
              >
                <td className={cn(CELL, 'text-foreground')}>{row.label}</td>
                {row.cells.map((value, index) => (
                  <td
                    key={HEADERS[index + 1]}
                    className={cn(CELL, value === 0 ? 'text-muted-foreground' : 'text-foreground')}
                  >
                    {money(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
