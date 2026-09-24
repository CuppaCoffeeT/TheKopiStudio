/**
 * By-age tab — cash outlay after Medisave at every age 1–100, with the chosen
 * age shaded and scrolled into view when the tab opens.
 */

import { useEffect, useMemo, useRef } from 'react';
import { ToolNote } from '@/components/primitives/tools';
import { cn } from '@/lib/utils';
import { money, moneyCents } from '../../lib/format';
import { SHIELD_LAST_ENTRY_AGE, SHIELD_MAX_AGE, shieldPremium } from '../../lib/shieldPremium';
import { InsurerMark, ShieldTable } from './ShieldAtoms';
import { TD, TH } from './shieldTableClasses';

const AGES = Array.from({ length: SHIELD_MAX_AGE }, (_, index) => index + 1);

export function ShieldByAgeTab({ age }: { age: number }) {
  const rows = useMemo(() => AGES.map((a) => ({ age: a, premium: shieldPremium(a) })), []);
  const selected = useRef<HTMLTableRowElement>(null);

  // Radix mounts tab content on activation, so this runs each time the tab opens.
  useEffect(() => {
    selected.current?.scrollIntoView({ block: 'center' });
  }, [age]);

  return (
    <div>
      <ShieldTable>
        <thead>
          <tr>
            <th className={TH}>Age</th>
            <th className={TH}><InsurerMark insurer="singlife">Singlife total</InsurerMark></th>
            <th className={TH}><InsurerMark insurer="singlife">Singlife cash</InsurerMark></th>
            <th className={TH}><InsurerMark insurer="income">Income total</InsurerMark></th>
            <th className={TH}><InsurerMark insurer="income">Income cash</InsurerMark></th>
            <th className={TH}>Income costs more by</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ age: rowAge, premium }) => (
            <tr
              key={rowAge}
              ref={rowAge === age ? selected : undefined}
              className={cn(rowAge === age && 'bg-secondary font-semibold')}
              aria-current={rowAge === age ? 'true' : undefined}
            >
              <td className={TD}>
                {rowAge}
                {rowAge > SHIELD_LAST_ENTRY_AGE && (
                  <span className="ml-1.5 rounded-full bg-secondary px-2 py-0.5 text-[11.5px] font-normal text-[color:var(--fg-dim)]">
                    renewal
                  </span>
                )}
              </td>
              <td className={TD}>{moneyCents(premium.singlife.total)}</td>
              <td className={TD}>{moneyCents(premium.singlife.cash)}</td>
              <td className={TD}>{money(premium.income.total)}</td>
              <td className={TD}>{money(premium.income.cash)}</td>
              <td className={TD}>{moneyCents(premium.income.cash - premium.singlife.cash)}</td>
            </tr>
          ))}
        </tbody>
      </ShieldTable>
      <ToolNote>
        Shaded row is the age you set. Ages 76 and above are renewal only — last entry age is 75 next
        birthday on both.
      </ToolNote>
    </div>
  );
}
