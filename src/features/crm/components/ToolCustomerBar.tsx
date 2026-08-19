/**
 * ToolCustomerBar (CRM) — the customer picker for tools that read `public.clients`:
 * the tax calculator, the SRS planner, the Legacy Map and the client report.
 *
 * The MARKUP lives in `@/components/primitives/tools` (hoisted 2026-08-19 so
 * the profiler, a feature workspace barred from importing `crm`, could open
 * with the same bar). This file is the CRM half: the own-book query and
 * nothing else.
 *
 * SCOPE: the advisor's OWN customers only — `useOwnClientOptions` filters on
 * `user_id` rather than leaning on RLS, which would put the whole firm's book
 * in a manager's dropdown (lib/lessons.md 2026-08-13: RLS answers *may I read
 * this row*, never *is this row mine*). That boundary is the reason the fetch
 * did NOT move to the shared lane with the markup — each tool family draws it
 * for itself.
 *
 * Behaviour, testids and copy are unchanged from the single-file version; see
 * the primitive's header for why the bar replaced `ToolCustomerPickerModal`
 * and why Clear gets its own real button.
 */

import { ToolCustomerBar as ToolCustomerBarView } from '@/components/primitives/tools';
import type { SMSOption } from '@/components/primitives/overlays';
import { useOwnClientOptions } from '../hooks/useOwnClientOptions';

interface ToolCustomerBarProps {
  /** Currently chosen customer id, or null for the blank tool. */
  value: string | null;
  onChange: (next: string | null) => void;
  /**
   * What the tool does with no customer. Two honest variants, because the
   * tools differ: a calculator is useful blank, a saved plan is not.
   */
  blankHint: string;
  testId?: string;
}

export function ToolCustomerBar({
  value,
  onChange,
  blankHint,
  testId = 'tool-customer-bar',
}: ToolCustomerBarProps) {
  const { data: customers, isLoading, isError, refetch } = useOwnClientOptions(true);

  const options: SMSOption[] = (customers ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));

  return (
    <ToolCustomerBarView
      value={value}
      onChange={onChange}
      options={options}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
      blankHint={blankHint}
      testId={testId}
    />
  );
}
