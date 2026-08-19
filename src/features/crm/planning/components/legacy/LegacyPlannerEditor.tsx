/**
 * LegacyPlannerEditor — the Legacy Map itself, once a plan is in hand.
 *
 * Split from `LegacyPlannerPage` (W23 LOC ceiling) at the loader/editor seam.
 * The page decides WHICH plan to open; this owns editing it and saving it back.
 *
 * It is mounted only after the stored plan has settled, and seeds from a
 * `useState` initialiser inside `useLegacyPlan`. `initialPlan` must therefore
 * be treated as mount-time only — there is deliberately no re-seed effect, for
 * the reason recorded in `decisions.md` (the ClientFormModal clobber bug).
 *
 * Save is hidden entirely when the customer belongs to another advisor: RLS
 * would let a manager write a plan row owned by themselves, which the owning
 * advisor could then never read.
 */

import { useMemo } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';
import { formatDisplayDateTimeLong } from '@/utils/timezoneUtils';
import { currentRefYear } from '../../../lib/finance';
import type { CrmClient } from '../../../types';
import { ToolNote, ToolStatGrid } from '@/components/primitives/tools';
import { useSaveLegacyPlan } from '../../hooks/useLegacyPlanStore';
import { seedAge } from '../../lib/customerSeed';
import { money } from '../../lib/format';
import {
  estateTotals,
  plannedDistribution,
  projectEstate,
  SPOUSE_ID,
  type LegacyPlan,
} from '../../lib/legacy';
import { calculateIsaDistribution, planningGap } from '../../lib/legacyIsa';
import { useLegacyPlan } from '../../lib/useLegacyPlan';
import { LegacyAssetsPanel } from './LegacyAssetsPanel';
import { LegacyComparisonPanel } from './LegacyComparisonPanel';
import { LegacyFamilyPanel } from './LegacyFamilyPanel';

/** The age the estate projection reports at — a full life-expectancy horizon. */
const PROJECTION_AGE = 85;

interface LegacyPlannerProps {
  customer: CrmClient;
  customerId: string;
  /** False when a manager is reading another advisor's customer. */
  isOwn: boolean;
  initialPlan: LegacyPlan;
  /** When this customer's plan was last saved, if ever. */
  savedAt: string | null;
}

export function LegacyPlannerEditor({ customer, customerId, isOwn, initialPlan, savedAt }: LegacyPlannerProps) {
  const currentAge = seedAge(customer.dateOfBirth, currentRefYear());
  const legacy = useLegacyPlan(initialPlan);
  const save = useSaveLegacyPlan(customerId);
  const { plan } = legacy;

  const totals = useMemo(() => estateTotals(plan), [plan]);
  const isa = useMemo(() => calculateIsaDistribution(plan), [plan]);
  const planned = useMemo(() => plannedDistribution(plan), [plan]);
  const gap = useMemo(() => planningGap(plan), [plan]);

  const nameFor = (personId: string) =>
    personId === SPOUSE_ID
      ? plan.spouseName || 'Spouse'
      : (plan.people.find((p) => p.id === personId)?.name ?? 'Unnamed');

  const handleSave = () => {
    save.mutate(plan, { onSuccess: () => legacy.markSaved(plan) });
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[12px] text-[color:var(--fg-dim)]" data-testid="legacy-save-state">
          {!isOwn
            ? 'Read-only — this customer belongs to another advisor.'
            : legacy.isDirty
              ? 'Unsaved changes.'
              : savedAt
                ? `Saved ${formatDisplayDateTimeLong(savedAt)}.`
                : 'Not saved yet.'}
        </p>
        {isOwn && (
          <Button
            className="flex-none pointer-coarse:min-h-11"
            onClick={handleSave}
            loading={save.isPending}
            disabled={!legacy.isDirty}
            leadingIcon={<Save className="h-3.5 w-3.5" aria-hidden="true" />}
            data-testid="legacy-save-btn"
          >
            Save legacy map
          </Button>
        )}
      </div>

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

      <ToolNote testId="legacy-disclaimer">
        Nominated assets (CPF, insurance) pass outside the estate and survive intestacy; everything
        else is governed by the will, or by the Act. Not legal advice.
      </ToolNote>
    </div>
  );
}
