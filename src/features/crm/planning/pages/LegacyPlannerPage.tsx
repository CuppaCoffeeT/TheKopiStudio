/**
 * /clients/:id/legacy-planner — the Legacy Map.
 *
 * Tool 06 in the customer chain. The tool exists to show ONE gap: what the
 * customer thinks happens to their estate, versus what the Intestate
 * Succession Act 1967 actually does if they die without a will.
 *
 * Structure follows the reference: build the family, list the assets, decide
 * who gets what, then read the comparison. The comparison is the deliverable —
 * everything above it is data entry.
 *
 * This page is composition only: `useLegacyPlan` owns the state and its
 * referential integrity, `lib/legacy` + `lib/legacyIsa` own the maths, and the
 * three panels own the markup.
 *
 * PERSISTENCE: none yet. The plan lives in page state for the length of the
 * conversation, and the page says so. Storing it needs a `legacy_plans` table;
 * wiring a Save button before that exists would be a button that loses data.
 * When the table lands this page grows a save mutation and nothing else
 * changes — the plan is already a plain serialisable object.
 */

import { useMemo } from 'react';
import { currentRefYear } from '../../lib/finance';
import type { CrmClient } from '../../types';
import { PlanningToolFrame } from '../components/PlanningToolFrame';
import { LegacyAssetsPanel } from '../components/legacy/LegacyAssetsPanel';
import { LegacyComparisonPanel } from '../components/legacy/LegacyComparisonPanel';
import { LegacyFamilyPanel } from '../components/legacy/LegacyFamilyPanel';
import { ToolNote, ToolStatGrid } from '../components/PlanningAtoms';
import { seedAge, seedAmount } from '../lib/customerSeed';
import { money } from '../lib/format';
import { estateTotals, plannedDistribution, projectEstate, SPOUSE_ID } from '../lib/legacy';
import { calculateIsaDistribution, planningGap } from '../lib/legacyIsa';
import { useLegacyPlan } from '../lib/useLegacyPlan';

/** The age the estate projection reports at — a full life-expectancy horizon. */
const PROJECTION_AGE = 85;

function LegacyPlanner({ customer }: { customer: CrmClient }) {
  const currentAge = seedAge(customer.dateOfBirth, currentRefYear());

  const legacy = useLegacyPlan({
    bankBalance: seedAmount(customer.totalBankBalance),
    cpfTotal:
      seedAmount(customer.cpfOA) + seedAmount(customer.cpfSA) + seedAmount(customer.cpfMA),
  });
  const { plan } = legacy;

  const totals = useMemo(() => estateTotals(plan), [plan]);
  const isa = useMemo(() => calculateIsaDistribution(plan), [plan]);
  const planned = useMemo(() => plannedDistribution(plan), [plan]);
  const gap = useMemo(() => planningGap(plan), [plan]);

  const nameFor = (personId: string) =>
    personId === SPOUSE_ID
      ? plan.spouseName || 'Spouse'
      : (plan.people.find((p) => p.id === personId)?.name ?? 'Unnamed');

  return (
    <div className="flex flex-col gap-[22px]">
      <ToolStatGrid
        testId="legacy-stats"
        stats={[
          { label: 'Total estate', value: money(totals.totalEstate), testId: 'legacy-stat-total' },
          {
            label: 'Passes by nomination',
            value: money(totals.nominatedTotal),
            hint: 'outside the will',
            testId: 'legacy-stat-nominated',
          },
          {
            label: 'Unallocated',
            value: money(totals.unallocatedTotal),
            hint: totals.unallocatedTotal > 0 ? 'the law decides this' : 'fully directed',
            tone: totals.unallocatedTotal > 0 ? 'negative' : 'positive',
            testId: 'legacy-stat-unallocated',
          },
          {
            label: `Estate at ${PROJECTION_AGE}`,
            value: money(projectEstate(plan, currentAge, PROJECTION_AGE)),
            hint: `from age ${currentAge}`,
            testId: 'legacy-stat-projected',
          },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-2">
        <LegacyFamilyPanel
          plan={plan}
          onSpouseName={legacy.setSpouseName}
          onAddPerson={legacy.addPerson}
          onUpdatePerson={legacy.updatePerson}
          onRemovePerson={legacy.removePerson}
        />
        <LegacyAssetsPanel
          plan={plan}
          beneficiaries={legacy.beneficiaries}
          onAddAsset={legacy.addAsset}
          onUpdateAsset={legacy.updateAsset}
          onRemoveAsset={legacy.removeAsset}
          onAssign={legacy.assignWholeAsset}
          currentAssignee={legacy.currentAssignee}
        />
      </div>

      <LegacyComparisonPanel
        totals={totals}
        isa={isa}
        planned={planned}
        gap={gap}
        nameFor={nameFor}
      />

      <ToolNote testId="legacy-not-saved">
        This map is not saved yet — it lives for the length of this conversation. Nominated assets
        (CPF, insurance) pass outside the estate and survive intestacy; everything else is governed
        by the will, or by the Act. Not legal advice.
      </ToolNote>
    </div>
  );
}

export default function LegacyPlannerPage() {
  return (
    <PlanningToolFrame
      index="06"
      title="Legacy Map"
      description="Who actually inherits — and what the law would do instead."
      testId="legacy-planner"
    >
      {(customer) => <LegacyPlanner customer={customer} />}
    </PlanningToolFrame>
  );
}
