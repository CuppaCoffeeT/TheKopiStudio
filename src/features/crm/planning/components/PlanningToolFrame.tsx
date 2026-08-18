/**
 * PlanningToolFrame — the shell every planning tool renders inside.
 *
 * ROUTE SHAPE CHANGED 2026-08-18. The tools used to be sub-routes of a customer
 * (`/clients/:id/tax-calculator`) and read `useParams().id`, which made them
 * unreachable from navigation without first answering "which customer?" in a
 * modal. They are now top-level `/tools/*` routes and read `?customer=<id>`,
 * with `ToolCustomerBar` asking that question INSIDE the page — optional,
 * changeable, and clearable back to a blank tool. The old customer sub-routes
 * redirect here (see `src/App.tsx`), so links and bookmarks keep working.
 *
 * A tool therefore has TWO valid states, and both are first class:
 *
 * - **Customer chosen** — the record loads and `children` receives the real
 *   model. Same behaviour as before.
 * - **No customer** — `children` receives a BLANK model, so a calculator opens
 *   as a scratch pad. Tools that cannot mean anything without a customer set
 *   `requiresCustomer` and get a prompt instead of a blank form; the Legacy Map
 *   is the only one, because its plan is PERSISTED against a customer row and
 *   there is nowhere to save a plan for nobody.
 *
 * Loading / error / not-found stay here so the tools remain pure calculators.
 * `children` is only called once the page has something coherent to render.
 */

import type { ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';
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
   */
  children: (customer: CrmClient, customerId: string | null, isOwn: boolean) => ReactNode;
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
    <div className="bg-background px-4 py-6 sm:px-10 sm:py-[34px]">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-3 text-[12px] text-[color:var(--fg-dim)]" aria-label="Breadcrumb">
          <Link to="/dashboard" className="hover:text-[color:var(--brown-text)]">
            Overview
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{title}</span>
        </nav>

        <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-0">
            <h1
              className="m-0 text-[38px] leading-[1.1] tracking-[-0.018em] text-foreground"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              <span
                className="mr-2 text-[20px] text-[color:var(--brand-brown)]"
                aria-hidden="true"
              >
                {index}
              </span>
              {title}
            </h1>
            <p className="m-0 mt-1.5 text-[12.5px] leading-[1.6] text-[color:var(--fg-dim)]">
              {description}
            </p>
          </div>

          {/* Only offered once there is a customer to go back TO. Reached from
              navigation with no customer, this button pointed at `/clients`
              and read as "Back" to a page you were never on. */}
          {model && customerId && (
            <Button
              variant="outline"
              className="flex-none pointer-coarse:min-h-11"
              leadingIcon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={() => navigate(`/clients/${customerId}`)}
              data-testid={`${testId}-back`}
            >
              Back to customer
            </Button>
          )}
        </div>

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
            {children(model ?? BLANK_CUSTOMER, model ? customerId : null, model ? isOwn : true)}
          </div>
        )}
      </div>
    </div>
  );
}
