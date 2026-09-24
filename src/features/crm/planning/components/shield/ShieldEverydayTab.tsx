/**
 * Everyday claims tab — the claims most clients actually make, then the same
 * bills taken off panel.
 */

import { ToolNote } from '@/components/primitives/tools';
import { money } from '../../lib/format';
import { everydayClaim, offPanelClaim } from '../../lib/shieldClaims';
import { EVERYDAY_SCENARIOS, OFF_PANEL_SCENARIOS } from '../../lib/shieldScenarios';
import { InsurerMark, ShieldFlag, ShieldHeading, ShieldScenario, ShieldTable } from './ShieldAtoms';
import { TD, TH, TOTAL_ROW } from './shieldTableClasses';

export function ShieldEverydayTab() {
  return (
    <div>
      <ShieldFlag>
        <b>The deductible is annual, not per claim.</b> The first modest procedure of the year often gets
        little or nothing back. A second one in the same year costs the client a fraction of the first.
      </ShieldFlag>
      <ShieldFlag>
        <b>A standalone A&amp;E visit is covered by neither plan.</b> It only becomes claimable when it
        leads to an admission. Clients routinely assume otherwise and find out at the counter.
      </ShieldFlag>

      {EVERYDAY_SCENARIOS.map((s) => {
        const { singlife, income } = everydayClaim(s);
        return (
          <ShieldScenario
            key={s.title}
            title={s.title}
            summary={`client pays ${money(singlife.client)} / ${money(income.client)}`}
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
                <tr><td className={TD}>Hospital bill</td><td className={TD}>{money(s.bill)}</td><td className={TD}>{money(s.bill)}</td></tr>
                <tr><td className={TD}>Annual deductible</td><td className={TD}>{money(s.singlifeDeductible)}</td><td className={TD}>{money(s.incomeDeductible)}</td></tr>
                <tr><td className={TD}>The plan pays</td><td className={TD}>{money(singlife.plan)}</td><td className={TD}>{money(income.plan)}</td></tr>
                <tr className={TOTAL_ROW}><td className={TD}>Client pays</td><td className={TD}>{money(singlife.client)}</td><td className={TD}>{money(income.client)}</td></tr>
              </tbody>
            </ShieldTable>
            <ToolNote>{s.note}</ToolNote>
          </ShieldScenario>
        );
      })}

      <ShieldHeading>When the doctor is off panel</ShieldHeading>
      <p className="m-0 max-w-[68ch] text-[13px] leading-[1.6] text-[color:var(--fg-dim)]">
        Singlife charges 5% whoever the doctor is. Income charges 8% once you leave its panel, but keeps
        the $6,000 yearly cap on its Extended Panel — doctors who sit on another insurer’s shield panel.
        Below roughly $75,000 of claimable bill, Singlife costs less; above it, Income’s Extended Panel
        does.
      </p>

      {OFF_PANEL_SCENARIOS.map(({ title, bill }) => {
        const c = offPanelClaim(bill);
        return (
          <ShieldScenario key={title} title={title} summary={`${money(bill)} bill`}>
            <ShieldTable>
              <thead>
                <tr>
                  <th className={TH} />
                  <th className={TH}><InsurerMark insurer="singlife">Singlife, any provider</InsurerMark></th>
                  <th className={TH}><InsurerMark insurer="income">Income, Extended Panel</InsurerMark></th>
                  <th className={TH}><InsurerMark insurer="income">Income, any provider</InsurerMark></th>
                </tr>
              </thead>
              <tbody>
                <tr><td className={TD}>Co-payment rate</td><td className={TD}>5%</td><td className={TD}>8%</td><td className={TD}>8%</td></tr>
                <tr><td className={TD}>Yearly cap on it</td><td className={TD}>none</td><td className={TD}>$6,000</td><td className={TD}>none</td></tr>
                <tr><td className={TD}>The plan pays</td><td className={TD}>{money(c.singlife.plan)}</td><td className={TD}>{money(c.incomeExtended.plan)}</td><td className={TD}>{money(c.incomeAny.plan)}</td></tr>
                <tr className={TOTAL_ROW}><td className={TD}>Client pays</td><td className={TD}>{money(c.singlife.client)}</td><td className={TD}>{money(c.incomeExtended.client)}</td><td className={TD}>{money(c.incomeAny.client)}</td></tr>
              </tbody>
            </ShieldTable>
          </ShieldScenario>
        );
      })}

      <ToolNote>
        Going off panel also halves Singlife’s annual limit, from $2m to $1m. Income’s $1.5m does not move.
      </ToolNote>
    </div>
  );
}
