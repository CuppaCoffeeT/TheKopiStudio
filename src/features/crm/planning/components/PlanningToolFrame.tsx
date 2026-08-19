/**
 * PlanningToolFrame — the shell every planning tool renders inside.
 *
 * ROUTE SHAPE CHANGED 2026-08-18: the tools moved from `/clients/:id/<tool>` to
 * top-level `/tools/*` and read `?customer=<id>`, with `ToolCustomerBar` asking
 * "which customer?" INSIDE the page — optional, changeable, clearable. The old
 * sub-routes redirect (src/App.tsx). Reasoning: planning/decisions.md.
 *
 * A tool has TWO valid states, both first class:
 *
 * - **Customer chosen** — the record loads; `children` gets the real model.
 * - **No customer** — `children` gets a BLANK model, so a calculator opens as a
 *   scratch pad. A tool whose output is PERSISTED sets `requiresCustomer` and
 *   gets a prompt instead; the Legacy Map is the only one, because there is
 *   nowhere to save a plan for nobody.
 *
 * Loading / error / not-found stay here so the tools remain pure calculators.
 */

import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';
import { ToolPageHeader, ToolPageShell } from '@/components/primitives/tools';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { NoResultsState } from '@/components/primitives/shell/NoResultsState';
import { useAuth } from '@/contexts/AuthContext';
import type { ActivityTool } from '@/lib/activityLog';
import { CUSTOMER_PARAM } from '@/lib/toolRoutes';
import { useClientDetail } from '../../hooks/useClientDetail';
import { useLogToolOpen } from '../../hooks/useLogToolOpen';
import { clientFromRow } from '../../lib/clientMapping';
import { EMPTY_CLIENT } from '../../components/modals/client/clientFormModel';
import { ToolCustomerBar } from '../../components/ToolCustomerBar';
import type { CrmClient } from '../../types';

/** The scratch-pad model. Reuses the form's blank so a newly added client
 *  column can never be missing here — TypeScript enforces the shape once. */
const BLANK_CUSTOMER: CrmClient = { ...EMPTY_CLIENT, id: '' };

interface PlanningToolFrameProps {
  /** Serif page title, e.g. "Tax calculator". */
  title: string;
  /** One line under the title saying what the tool does. */
  description: string;
  /** Index numeral shown beside the title — the tool's step in the chain. */
  index: string;
  testId: string;
  /** Which tool this is, for the customer's activity log. */
  activityTool: ActivityTool;
  /** What the tool is worth with no customer chosen — shown beside the picker. */
  blankHint: string;
  /**
   * Set by a tool whose output is PERSISTED against a customer. Such a tool
   * renders a prompt rather than a blank form: offering an editor with nowhere
   * to save is worse than asking one question.
   */
  requiresCustomer?: boolean;
  /**
   * Rendered once the page has a coherent model — the real customer, or
   * `BLANK_CUSTOMER` when none is chosen and the tool allows it. `customerId`
   * is null in the blank case, which is how a tool tells the two apart.
   * `isOwn` is false when a manager is reading another advisor's customer.
   * `ownerId` is the customer's `user_id` — what a tool that WRITES must stamp,
   * since RLS checks the owner and never the viewer.
   */
  children: (
    customer: CrmClient,
    customerId: string | null,
    isOwn: boolean,
    ownerId: string | null,
  ) => ReactNode;
}

export function PlanningToolFrame({
  title,
  description,
  index,
  testId,
  activityTool,
  blankHint,
  requiresCustomer = false,
  children,
}: PlanningToolFrameProps) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const customerId = params.get(CUSTOMER_PARAM) || null;
  const { client } = useClientDetail(customerId ?? undefined);

  const row = client.data ?? null;
  const model = row ? clientFromRow(row) : null;
  const isOwn = Boolean(row && user && row.user_id === user.id);

  // The customer's timeline records that their numbers were pulled up here.
  // Fires once the record has resolved, so a mistyped `?customer=` logs nothing.
  useLogToolOpen(
    activityTool,
    `${title} opened`,
    model ? customerId : null,
    row?.user_id ?? null,
  );

  /**
   * `replace: false` — stepping between customers is real navigation, so Back
   * should walk it. Clearing drops the param entirely rather than leaving
   * `?customer=`, which would read as "a customer, unnamed".
   */
  const chooseCustomer = (next: string | null) => {
    const updated = new URLSearchParams(params);
    if (next) updated.set(CUSTOMER_PARAM, next);
    else updated.delete(CUSTOMER_PARAM);
    setParams(updated);
  };

  const loading = Boolean(customerId) && client.isLoading;
  const failed = Boolean(customerId) && client.isError;
  const notFound = Boolean(customerId) && !client.isLoading && !client.isError && !model;

  return (
    <ToolPageShell>
      <ToolPageHeader
          title={title}
          description={description}
          index={index}
          testId={testId}
          /* "Back to customer" only renders once there IS a customer to go back
             to. Reached from navigation with none, the button used to point at
             `/clients` and read as "Back" to a page you had never been on. */
          action={
            model && customerId ? (
              <Button
                variant="outline"
                className="flex-none pointer-coarse:min-h-11"
                leadingIcon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => navigate(`/clients/${customerId}`)}
                data-testid={`${testId}-back`}
              >
                Back to customer
              </Button>
            ) : null
          }
        />

        <ToolCustomerBar
          value={customerId}
          onChange={chooseCustomer}
          blankHint={blankHint}
          testId={`${testId}-customer-bar`}
        />

        {loading && (
          <div data-testid={`${testId}-loading`}>
            <LoadingSkeleton variant="table-rows" rowCount={5} />
          </div>
        )}

        {failed && (
          <ErrorState
            variant="compact"
            subhead="This customer didn't load."
            body="The record could not be read. Check your connection and try again."
            onRetry={() => void client.refetch()}
          />
        )}

        {notFound && (
          <div data-testid={`${testId}-not-found`}>
            <NoResultsState query={customerId ?? ''} />
          </div>
        )}

        {!customerId && requiresCustomer && (
          <p
            className="text-[13px] leading-[1.6] text-[color:var(--fg-dim)]"
            data-testid={`${testId}-needs-customer`}
          >
            {blankHint}
          </p>
        )}

        {!loading && !failed && !notFound && (model || !requiresCustomer) && (
          <div data-testid={testId}>
            {children(
              model ?? BLANK_CUSTOMER,
              model ? customerId : null,
              model ? isOwn : true,
              model ? (row?.user_id ?? null) : null,
            )}
          </div>
        )}
    </ToolPageShell>
  );
}
