/**
 * /clients/:id/srs — Supplementary Retirement Scheme planner.
 *
 * Tool 05 in the customer chain. Two halves, matching the reference tool:
 * paying IN (what it saves now, what it grows to by the age the customer plans
 * to take their first withdrawal) and taking OUT (how much of each withdrawal
 * escapes tax, and what the 10-year window costs if the plan does not empty the
 * account).
 *
 * The halves are CHAINED — the drawdown starts from the projected balance
 * unless the advisor overrides it. That link is the tool's whole argument:
 * contribute more, and the drawdown problem gets harder, not easier. The
 * journey panel closes the loop by netting the tax saved on the way in against
 * the tax paid on the way out.
 *
 * State and derivation live in `useSrsPlanner`. Pre-filled from the customer's
 * date of birth and annual income. Nothing is persisted.
 */

import { currentRefYear } from '../../lib/finance';
import type { CrmClient } from '../../types';
import { useSrsPlanner } from '../hooks/useSrsPlanner';
import { PlanningToolFrame } from '../components/PlanningToolFrame';
import { SrsContributionsPanel } from '../components/srs/SrsContributionsPanel';
import { SrsJourneyPanel } from '../components/srs/SrsJourneyPanel';
import { SrsProjectionPanel } from '../components/srs/SrsProjectionPanel';
import { SrsSchedulePanel } from '../components/srs/SrsSchedulePanel';
import { SrsWithdrawalsPanel } from '../components/srs/SrsWithdrawalsPanel';
import { ToolNote, ToolStatGrid } from '@/components/primitives/tools';
import { money, percent } from '../lib/format';
import { SRS_WITHDRAWAL_WINDOW_YEARS } from '../lib/srs';

function SrsPlanner({ customer, named }: { customer: CrmClient; named: boolean }) {
  const model = useSrsPlanner(customer, currentRefYear());
  const { contribution, withdrawal, numbers, projection, milestones, plan, journey } = model;

  return (
    <div className="flex flex-col gap-[22px]">
      <ToolStatGrid
        testId="srs-stats"
        stats={[
          {
            label: 'Tax saved this year',
            value: money(projection.taxSavedThisYear),
            hint: `on ${money(numbers.contributionThisYear)} in`,
            tone: projection.taxSavedThisYear > 0 ? 'positive' : 'neutral',
            testId: 'srs-stat-saved',
          },
          {
            label: `Balance at ${numbers.startAge}`,
            value: money(projection.balanceAtFirstWithdrawal),
            hint: `${percent(numbers.growthRate)} growth`,
            testId: 'srs-stat-balance',
          },
          {
            label: 'Lifetime tax saved',
            value: money(projection.lifetimeTaxSaved),
            hint: 'across every contribution',
            tone: 'positive',
            testId: 'srs-stat-lifetime',
          },
          {
            label: 'Tax on withdrawal',
            value: money(journey.totalTaxPaid),
            hint: plan.leavesRemainder ? 'includes the forced payout' : 'across the drawdown',
            tone: journey.totalTaxPaid > 0 ? 'negative' : 'positive',
            testId: 'srs-stat-tax',
          },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-2">
        <SrsContributionsPanel
          values={contribution.values}
          setters={contribution.setters}
          projection={projection}
        />

        <SrsWithdrawalsPanel
          projectedBalance={projection.balanceAtFirstWithdrawal}
          startAge={numbers.startAge}
          values={withdrawal.values}
          setters={withdrawal.setters}
          plan={plan}
        />
      </div>

      <SrsProjectionPanel
        rows={milestones}
        currentAge={numbers.currentAge}
        lastContributionAge={numbers.lastContributionAge}
        idleYears={numbers.idleYears}
        startAge={numbers.startAge}
        annualContribution={contribution.values.annualContribution}
        growthRate={numbers.growthRate}
      />

      <SrsSchedulePanel
        plan={plan}
        annualCeiling={journey.annualCeiling}
        overCeilingBy={journey.overCeilingBy}
        otherIncome={numbers.otherIncome}
      />

      <SrsJourneyPanel
        journey={journey}
        currentAge={numbers.currentAge}
        withdrawalAge={numbers.withdrawalAge}
        startAge={numbers.startAge}
      />

      <ToolNote testId="srs-not-saved">
        Withdrawals may begin at the statutory retirement age locked in by the first
        contribution — 62, 63 or 64. Contributions, and their relief, may continue past that
        age right up until the first withdrawal. Half of each withdrawal is chargeable, and
        the {SRS_WITHDRAWAL_WINDOW_YEARS}-year penalty-free window opens on the first
        withdrawal, not on that birthday. Nothing here is saved{named ? ` to ${customer.name}’s record` : ''}.
      </ToolNote>
    </div>
  );
}

export default function SrsPlannerPage() {
  return (
    <PlanningToolFrame
      index="05"
      title="SRS planner"
      description="What contributing saves now, and what taking it out actually costs."
      testId="srs-planner"
      activityTool="srs-planner"
      blankHint="No customer chosen — the planner starts blank. Pick one to pre-fill age and income."
    >
      {/* Keyed on the customer — `useSrsPlanner` seeds its state once. */}
      {(customer, customerId) => (
        <SrsPlanner key={customerId ?? 'blank'} customer={customer} named={Boolean(customerId)} />
      )}
    </PlanningToolFrame>
  );
}
