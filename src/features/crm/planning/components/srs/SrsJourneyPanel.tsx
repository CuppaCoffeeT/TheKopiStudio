/**
 * SrsJourneyPanel — both ends of the scheme, reconciled.
 *
 * The one number a customer actually asks for is at the bottom: after paying
 * tax on the way out, was it worth it? A NEGATIVE answer is shown just as
 * plainly as a positive one — a plan that over-contributes and then cannot
 * empty the account inside the window really can hand back more than it saved,
 * and that is the case the advisor is here to catch.
 *
 * No maths here; `buildJourney` produces every figure.
 */

import { SummaryRow, ToolPanel } from '../PlanningAtoms';
import { money, percent } from '../../lib/format';
import type { SrsJourney } from '../../lib/srsJourney';

interface SrsJourneyPanelProps {
  journey: SrsJourney;
  currentAge: number;
  withdrawalAge: number;
  startAge: number;
}

export function SrsJourneyPanel({
  journey, currentAge, withdrawalAge, startAge,
}: SrsJourneyPanelProps) {
  const positive = journey.netTaxBenefit >= 0;

  return (
<ToolPanel label="The whole journey" testId="srs-journey">
  <div className="grid grid-cols-1 gap-x-[22px] gap-y-2 lg:grid-cols-2">
    <div>
      <h3 className="m-0 mb-1 text-[12px] font-semibold text-foreground">
        Paying in · age {currentAge}–{withdrawalAge}
      </h3>
      <SummaryRow label="Total contributions" value={money(journey.totalContributions)} />
      <SummaryRow
        label="Investment returns"
        value={`${money(journey.investmentReturns)} (${percent(journey.returnPercent)})`}
      />
      <SummaryRow label={`Balance at ${withdrawalAge}`} value={money(journey.balanceAtWithdrawalAge)} />
      {journey.deferralYears > 0 && (
        <SummaryRow
          label={`Growth from waiting to ${startAge}`}
          value={money(journey.deferralGrowth)}
        />
      )}
      <SummaryRow
        label="Tax saved contributing"
        value={money(journey.lifetimeTaxSaved)}
        total
        testId="srs-journey-saved"
      />
    </div>

    <div>
      <h3 className="m-0 mb-1 text-[12px] font-semibold text-foreground">
        Taking out · age {startAge}–{journey.windowEndsAt}
      </h3>
      <SummaryRow label="Total withdrawn" value={money(journey.totalWithdrawn)} />
      <SummaryRow label="Tax on withdrawals" value={money(journey.taxOnWithdrawals)} />
      {journey.remainingBalance > 0 && (
        <>
          <SummaryRow label="Left when the window shuts" value={money(journey.remainingBalance)} />
          <SummaryRow label="Tax on the forced payout" value={money(journey.forcedPayoutTax)} />
        </>
      )}
      <SummaryRow
        label="Tax paid withdrawing"
        value={money(journey.totalTaxPaid)}
        total
        testId="srs-journey-paid"
      />
    </div>
  </div>

  <div
    className="mt-[22px] rounded-lg border border-border bg-[color:var(--surface-subtle)] px-[18px] py-4 text-center"
    data-testid="srs-net-benefit"
  >
    <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      Net tax benefit, lifetime
    </p>
    <p
      className={`m-0 mt-1.5 text-[34px] leading-none ${
        positive ? 'text-[color:var(--sage-text)]' : 'text-[color:var(--negative-text)]'
      }`}
      style={{ fontFamily: 'var(--font-pixel)' }}
    >
      {positive ? money(journey.netTaxBenefit) : `−${money(Math.abs(journey.netTaxBenefit))}`}
    </p>
    <p className="m-0 mt-1.5 text-[12px] text-[color:var(--fg-dim)]">
      {money(journey.lifetimeTaxSaved)} saved contributing, less{' '}
      {money(journey.totalTaxPaid)} paid taking it out.
    </p>
  </div>

  <ul
    className="m-0 mt-4 flex list-none flex-col gap-1.5 p-0 text-[12px] leading-[1.6] text-[color:var(--fg-dim)]"
    data-testid="srs-insights"
  >
    <li>
      {positive
        ? `${money(journey.totalContributions)} contributed grows to ${money(journey.balanceAtWithdrawalAge)} by ${withdrawalAge} — a ${percent(journey.returnPercent)} gain — and nets ${money(journey.netTaxBenefit)} of tax either side.`
        : `This plan hands back ${money(Math.abs(journey.netTaxBenefit))} more than it saves. Draw over more years, or contribute less, before the window forces the balance out.`}
    </li>
    <li>
      {journey.deferralYears > 0
        ? `Waiting until ${startAge} earned an extra ${money(journey.deferralGrowth)} tax-free, and moved the window's close to ${journey.windowEndsAt}.`
        : `Starting later than ${withdrawalAge} is still open — the 10-year window only opens on the first dollar out, so the balance keeps compounding until then.`}
    </li>
    <li>
      {journey.remainingBalance > 0
        ? `${money(journey.remainingBalance)} left at the close costs ${money(journey.forcedPayoutTax)} in a single year. Spreading the same money more evenly removes most of it.`
        : 'The account empties inside the window, so nothing is force-paid.'}
    </li>
  </ul>
</ToolPanel>
  );
}
