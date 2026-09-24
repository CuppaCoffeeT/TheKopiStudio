/**
 * Compare tab — every benefit line side by side, filterable by area.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BENEFIT_AREAS, BENEFIT_ROWS } from '../../lib/shieldBenefits';
import { InsurerMark, ShieldTable } from './ShieldAtoms';
import { TD, TH } from './shieldTableClasses';

const ALL = 'All';
const CELL = cn(TD, 'whitespace-normal text-left align-top');

export function ShieldCompareTab() {
  const [area, setArea] = useState(ALL);
  const rows = area === ALL ? BENEFIT_ROWS : BENEFIT_ROWS.filter((row) => row.area === area);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by area">
        {[ALL, ...BENEFIT_AREAS].map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === area}
            onClick={() => setArea(option)}
            className={cn(
              'min-h-9 rounded-full border px-3 py-1 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              option === area
                ? 'border-foreground font-semibold text-foreground'
                : 'border-border bg-popover text-[color:var(--fg-dim)] hover:bg-secondary',
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <ShieldTable className="min-w-[680px]">
        <thead>
          <tr>
            <th className={cn(TH, 'w-[22%] text-left')}>Benefit</th>
            <th className={cn(TH, 'w-[27%] text-left')}><InsurerMark insurer="singlife" /></th>
            <th className={cn(TH, 'w-[27%] text-left')}><InsurerMark insurer="income" /></th>
            <th className={cn(TH, 'text-left')}>Why it matters</th>
          </tr>
        </thead>
        <tbody data-testid="shield-compare-rows">
          {rows.map((row) => (
            <tr key={`${row.area}-${row.benefit}`}>
              <td className={cn(CELL, 'font-semibold')}>{row.benefit}</td>
              <td className={CELL}>{row.singlife}</td>
              <td className={CELL}>{row.income}</td>
              <td className={cn(CELL, 'text-[12.5px] text-[color:var(--fg-dim)]')}>{row.why}</td>
            </tr>
          ))}
        </tbody>
      </ShieldTable>
    </div>
  );
}
