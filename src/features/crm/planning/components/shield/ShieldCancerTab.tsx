/**
 * Cancer tab — the one line item that differs between the plans on cancer:
 * outpatient cancer drug treatment. Four worked scenarios, with and without
 * Cancer Cover Plus II paying after the Shield plan.
 */

import { ToolNote } from '@/components/primitives/tools';
import { cn } from '@/lib/utils';
import { money } from '../../lib/format';
import { cancerOutcome } from '../../lib/shieldClaims';
import { CANCER_SCENARIOS } from '../../lib/shieldScenarios';
import { InsurerMark, ShieldScenario, ShieldTable } from './ShieldAtoms';
import { TD, TH, TOTAL_ROW } from './shieldTableClasses';

export function ShieldCancerTab() {
  return (
    <div>
      <ShieldTable>
        <caption className="pb-2 text-left text-[13px] text-[color:var(--fg-dim)]">
          How much each pays for outpatient cancer drugs on the Cancer Drug List, per month
        </caption>
        <tbody>
          <tr>
            <td className={TD}><InsurerMark insurer="singlife" /></td>
            <td className={cn(TD, 'whitespace-normal text-left')}>5 × the MediShield Life claim limit, plus a flat $10,000</td>
          </tr>
          <tr>
            <td className={TD}><InsurerMark insurer="income" /></td>
            <td className={cn(TD, 'whitespace-normal text-left')}>
              5 × the limit from the base plan, plus 18 × from Optima — 23 × in total
            </td>
          </tr>
        </tbody>
      </ShieldTable>
      <ToolNote>
        The MediShield Life claim limit is not the drug price. MOH sets it from post-subsidy bills, so a
        private bill runs higher. On the September 2026 list the median limit is $2,000 a month, so
        Singlife covers $20,000 and Income $46,000.
      </ToolNote>

      <div className="mt-4">
        {CANCER_SCENARIOS.map((s) => {
          const sl = cancerOutcome(s, false);
          const inc = cancerOutcome(s, true);
          const rows: [string, number, number, boolean?][] = [
            ['Treatment costs for the year', s.cost, s.cost],
            ['The plan covers, per month', sl.cover, inc.cover],
            ['The plan pays', sl.plan, inc.plan],
            ['Client pays', sl.client, inc.client, true],
            ['If they also hold Cancer Cover Plus II, it adds', sl.topUp, inc.topUp],
            ['Client pays with the top-up', sl.clientWithTopUp, inc.clientWithTopUp, true],
          ];
          return (
            <ShieldScenario
              key={s.title}
              title={s.title}
              summary={`${money(s.cost)} a year · client pays ${money(sl.client)} / ${money(inc.client)}`}
            >
              <ShieldTable>
                <thead>
                  <tr>
                    <th className={TH} />
                    <th className={TH}><InsurerMark insurer="singlife" /></th>
                    <th className={TH}><InsurerMark insurer="income" /></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, a, b, total]) => (
                    <tr key={label} className={total ? TOTAL_ROW : undefined}>
                      <td className={TD}>{label}</td>
                      <td className={TD}>{money(a)}</td>
                      <td className={TD}>{money(b)}</td>
                    </tr>
                  ))}
                </tbody>
              </ShieldTable>
              <ToolNote>{s.note}</ToolNote>
            </ShieldScenario>
          );
        })}
      </div>

      <ToolNote>
        Cancer Cover Plus II is assumed to pay after the Shield plan, because Shield claims for outpatient
        cancer drugs are e-filed by the hospital and paid direct while the top-up is a manual submission.
        On that order it adds nothing on the first three scenarios — the plan brings the monthly bill
        below the top-up’s own deductible before it can trigger.
      </ToolNote>
    </div>
  );
}
