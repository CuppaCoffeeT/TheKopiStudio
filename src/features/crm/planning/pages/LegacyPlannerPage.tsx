/**
 * /tools/legacy-planner — the Legacy Map.
 *
 * Tool 06 in the customer chain. The tool exists to show ONE gap: what the
 * customer thinks happens to their estate, versus what the Intestate
 * Succession Act 1967 actually does if they die without a will.
 *
 * Structure follows the reference: build the family, list the assets, decide
 * who gets what, then read the comparison. The comparison is the deliverable —
 * everything above it is data entry.
 *
 * This page is composition only: `useLegacyPlan` owns the editing state and its
 * referential integrity, `useStoredLegacyPlan` / `useSaveLegacyPlan` own
 * persistence, `lib/legacy` + `lib/legacyIsa` own the maths, and the three
 * panels own the markup.
 *
 * MOUNT ORDER MATTERS: the editor is not rendered until the stored plan has
 * settled, and it seeds from a `useState` initialiser. There is deliberately no
 * re-seed effect — `ClientFormModal` shipped exactly that bug, where an
 * `[open, client]` effect re-fired on a background refetch and silently
 * clobbered in-flight edits. Waiting costs one skeleton and removes the whole
 * class of problem.
 *
 * A customer with no saved plan seeds from their record instead (bank balance +
 * CPF as starting assets), so the first visit is never a blank page.
 */

import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import type { CrmClient } from '../../types';
import { PlanningToolFrame } from '../components/PlanningToolFrame';
import { LegacyPlannerEditor } from '../components/legacy/LegacyPlannerEditor';
import { useStoredLegacyPlan } from '../hooks/useLegacyPlanStore';
import { seedAmount } from '../lib/customerSeed';
import { seedPlan } from '../lib/useLegacyPlan';

/**
 * Loads the saved plan, then mounts the editor once.
 *
 * The `key` remounts the editor when the customer changes, so a stale plan can
 * never survive a navigation between two customers' maps.
 */
function LegacyPlannerLoader({
  customer,
  customerId,
  isOwn,
}: {
  customer: CrmClient;
  customerId: string;
  isOwn: boolean;
}) {
  const stored = useStoredLegacyPlan(customerId);

  if (stored.isLoading) {
    return (
      <div data-testid="legacy-plan-loading">
        <LoadingSkeleton variant="table-rows" rowCount={5} />
      </div>
    );
  }

  if (stored.isError) {
    // Deliberately NOT falling back to a seeded plan: editing from a blank map
    // and saving would overwrite whatever is stored. Refusing to open is the
    // safe failure.
    return (
      <ErrorState
        variant="compact"
        subhead="The saved legacy map didn't load."
        body="Opening it now could overwrite what is stored, so the map stays closed. Check your connection and try again."
        onRetry={() => void stored.refetch()}
      />
    );
  }

  // No stored plan → seed from the customer's record, so the first visit opens
  // with their bank balance and CPF already listed rather than a blank page.
  const initialPlan =
    stored.data?.plan ??
    seedPlan({
      bankBalance: seedAmount(customer.totalBankBalance),
      cpfTotal:
        seedAmount(customer.cpfOA) + seedAmount(customer.cpfSA) + seedAmount(customer.cpfMA),
    });

  return (
    <LegacyPlannerEditor
      key={customerId}
      customer={customer}
      customerId={customerId}
      isOwn={isOwn}
      initialPlan={initialPlan}
      savedAt={stored.data?.updatedAt ?? null}
    />
  );
}

export default function LegacyPlannerPage() {
  return (
    <PlanningToolFrame
      index="06"
      title="Legacy Map"
      description="Who actually inherits — and what the law would do instead."
      testId="legacy-planner"
      // The ONLY tool that insists on a customer: its plan is persisted against
      // one (`legacy_plans.client_id`), so a blank map has nowhere to be saved.
      requiresCustomer
      blankHint="The Legacy Map is saved against a customer — pick one above to open or start their map."
    >
      {(customer, customerId, isOwn) => (
        <LegacyPlannerLoader
          customer={customer}
          customerId={customerId as string}
          isOwn={isOwn}
        />
      )}
    </PlanningToolFrame>
  );
}
