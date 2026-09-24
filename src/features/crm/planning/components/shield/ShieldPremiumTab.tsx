/**
 * Premium tab — what each plan costs at the chosen age, split into what
 * Medisave absorbs and what the client pays in cash.
 */

import { ToolNote } from '@/components/primitives/tools';
import { money, moneyCents } from '../../lib/format';
import type { PlanPremium, ShieldPremium } from '../../lib/shieldPremium';
import { InsurerCard, InsurerMark, ShieldHeading, ShieldTable, type Insurer } from './ShieldAtoms';
import { TD } from './shieldTableClasses';
import { ShieldAgeControl } from './ShieldAgeControl';

interface ShieldPremiumTabProps {
  age: number;
  onAge: (next: number) => void;
  premium: ShieldPremium;
}

const PLAN_LINE: Record<Insurer, string> = {
  singlife: 'Shield Plan 1 + Health Plus Private',
  income: 'Enhanced IncomeShield Preferred + Optima Care',
};

function PlanCard({
  insurer,
  plan,
  riderExact,
  band,
}: {
  insurer: Insurer;
  plan: PlanPremium;
  /** Singlife's rider carries cents; Income's is quoted whole. */
  riderExact: boolean;
  band?: string;
}) {
  const rows: [string, string][] = [
    ['MediShield Life', money(plan.medishield)],
    ['Private plan', money(plan.plan)],
    ['Rider', riderExact ? moneyCents(plan.rider) : money(plan.rider)],
    ['Total premium', riderExact ? moneyCents(plan.total) : money(plan.total)],
    ['Paid from Medisave', money(plan.medisave)],
  ];
  return (
    <InsurerCard insurer={insurer}>
      <p className="m-0 text-[13px] font-semibold text-foreground">
        <InsurerMark insurer={insurer} />
      </p>
      <p className="m-0 mb-3.5 mt-0.5 min-h-[30px] text-[12px] text-muted-foreground">
        {PLAN_LINE[insurer]}
        {band && ` · band ${band}`}
      </p>
      <p
        className="m-0 text-[30px] leading-[1.1] text-foreground"
        style={{ fontFamily: 'var(--font-pixel)' }}
        data-testid={`shield-${insurer}-cash`}
      >
        {moneyCents(plan.cash)}
        <span className="ml-1 font-sans text-[13px] text-[color:var(--fg-dim)]">cash a year</span>
      </p>
      <p className="m-0 mt-0.5 text-[12.5px] text-[color:var(--fg-dim)]">
        {moneyCents(plan.cash / 12)} a month
      </p>
      <dl className="m-0 mt-4 text-[13px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-t border-border py-[5px]">
            <dt className="text-[color:var(--fg-dim)]">{label}</dt>
            <dd className="m-0 font-medium tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </InsurerCard>
  );
}

export function ShieldPremiumTab({ age, onAge, premium }: ShieldPremiumTabProps) {
  const { singlife, income } = premium;
  const gap = income.cash - singlife.cash;

  return (
    <div>
      <ShieldAgeControl age={age} onAge={onAge} />

      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <PlanCard insurer="singlife" plan={singlife} riderExact />
        <PlanCard insurer="income" plan={income} riderExact={false} band={premium.band} />
      </div>

      <p
        className="m-0 mt-4 rounded-lg bg-secondary px-3.5 py-3 text-[13px] text-foreground"
        data-testid="shield-premium-gap"
      >
        {gap > 0 ? (
          <>
            Income costs <b>{moneyCents(gap)}</b> more a year in cash at this age — {moneyCents(gap / 12)} a
            month. Singlife is cheaper at every single age.
          </>
        ) : (
          <>
            Singlife costs <b>{moneyCents(-gap)}</b> more a year in cash at this age.
          </>
        )}
      </p>

      <ShieldHeading>Optional extras</ShieldHeading>
      <ShieldTable>
        <tbody>
          <tr>
            <td className={TD}>Singlife Health Plus with No Claims Discount — 20% off the rider only</td>
            <td className={TD}>
              {moneyCents(singlife.riderWithNcd)} (saves {moneyCents(singlife.rider - singlife.riderWithNcd)})
            </td>
          </tr>
          <tr>
            <td className={TD}>Singlife Cancer Cover Plus II — standalone, cash only, can sit on either plan</td>
            <td className={TD}>
              {premium.cancerCoverPlus ? `${money(premium.cancerCoverPlus)} a year` : 'not available at this age'}
            </td>
          </tr>
        </tbody>
      </ShieldTable>
      <ToolNote>
        Cash figures assume the Medisave account holds enough to cover the Additional Withdrawal Limit.
        Riders on both insurers are cash only. <b>Rates are not guaranteed.</b> Renewability is guaranteed
        for life on both; affordability is not.
      </ToolNote>
    </div>
  );
}
