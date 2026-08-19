/**
 * WizardToolHeader — the signed-in advisor's front door to /profiler: the tool
 * header tools 04–06 open with, over the customer picker.
 *
 * Split out of `ProfilerWizardPage` (2026-08-19) when that file crossed the
 * 200-LOC ceiling. The seam is real, not arithmetic: everything here concerns
 * "which customer is this for", a question the wizard below it never asks
 * again, and the page keeps only composition.
 *
 * Rendered on the INTAKE screen only, and only when signed in — see
 * `ProfilerWizardPage` for why. An anonymous visitor gets `IntakeHero` instead.
 *
 * The picker writes `?customerId=&prospect=` through
 * `useWizardController.chooseCustomer`, which is the SAME pair the CRM entry
 * link writes (`crm/lib/profilerEntry`). One entry contract, two doorways.
 */

import {
  ToolCustomerBar,
  ToolPageHeader,
} from '@/components/primitives/tools';
import type { SMSOption } from '@/components/primitives/overlays';
import { toolRouteByKey } from '@/lib/toolRoutes';
import { useOwnCustomerOptions } from '../../hooks/useOwnCustomerOptions';

/** Title + one-line description come from the tool list, like every other tool. */
const PROFILER_TOOL = toolRouteByKey('profiler');

interface WizardToolHeaderProps {
  /** Currently linked customer id, or null when the profile saves unlinked. */
  customerId: string | null;
  /** Takes the whole option because the NAME seeds the intake, not just the id. */
  onChoose: (next: { id: string; name: string } | null) => void;
}

export function WizardToolHeader({ customerId, onChoose }: WizardToolHeaderProps) {
  // Only mounted where the picker is actually on screen, so the query is never
  // parked — an anonymous visitor never renders this component at all.
  const customers = useOwnCustomerOptions(true);
  const options: SMSOption[] = (customers.data ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));

  return (
    <>
      <ToolPageHeader
        index="01"
        title={PROFILER_TOOL.label}
        description={PROFILER_TOOL.description}
        testId="profiler"
      />
      <ToolCustomerBar
        value={customerId}
        onChange={(next) =>
          onChoose(
            next
              ? { id: next, name: options.find((o) => o.value === next)?.label ?? '' }
              : null,
          )
        }
        options={options}
        isLoading={customers.isLoading}
        isError={customers.isError}
        onRetry={() => void customers.refetch()}
        blankHint="No customer chosen — the profile saves unlinked. Pick one to fill the name and file the result on their record."
        chosenHint="The name is filled in, and the finished profile files itself on their record."
        testId="profiler-customer-bar"
      />
    </>
  );
}
