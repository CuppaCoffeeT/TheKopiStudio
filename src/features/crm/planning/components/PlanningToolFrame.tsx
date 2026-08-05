/**
 * PlanningToolFrame — the shell every planning tool renders inside.
 *
 * The three tools are CUSTOMER-SCOPED by design (customer-centred IA, Kopi
 * Studio Directions turn 3a): each one opens against a specific customer,
 * pre-filled from their record, and its breadcrumb leads back to them. That is
 * why this frame loads the customer itself rather than taking one as a prop —
 * a tool reached by URL must resolve the same customer the launcher would.
 *
 * Loading / error / not-found are handled here so the three tools stay pure
 * calculators. `children` is only called once a customer has actually
 * resolved, so a tool never has to render a null customer.
 *
 * Route shape: `/clients/:id/<tool>` — shares modulePath `/clients` with the
 * list and detail (the `/clients/:id/report` sub-route precedent), so the
 * tools need no module rows of their own.
 */

import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { NoResultsState } from '@/components/primitives/shell/NoResultsState';
import { useAuth } from '@/contexts/AuthContext';
import { useClientDetail } from '../../hooks/useClientDetail';
import { clientFromRow } from '../../lib/clientMapping';
import type { CrmClient } from '../../types';

interface PlanningToolFrameProps {
  /** Serif page title, e.g. "Tax calculator". */
  title: string;
  /** One line under the title saying what the tool does. */
  description: string;
  /** Index numeral shown beside the title — the tool's step in the chain. */
  index: string;
  testId: string;
  /**
   * Rendered only once the customer has resolved. `isOwn` is false when a
   * manager is reading another advisor's customer — the Legacy Map uses it to
   * hide Save, because `legacy_plans` RLS would happily let a manager create a
   * row the owning advisor could never read.
   */
  children: (customer: CrmClient, customerId: string, isOwn: boolean) => ReactNode;
}

export function PlanningToolFrame({
  title,
  description,
  index,
  testId,
  children,
}: PlanningToolFrameProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { client } = useClientDetail(id);

  const row = client.data ?? null;
  const model = row ? clientFromRow(row) : null;
  const isOwn = Boolean(row && user && row.user_id === user.id);

  return (
    <div className="min-h-dvh bg-background px-4 py-6 sm:px-10 sm:py-[34px]">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-3 text-[12px] text-[color:var(--fg-dim)]" aria-label="Breadcrumb">
          <Link to="/dashboard" className="hover:text-[color:var(--brown-text)]">
            Overview
          </Link>
          <span className="mx-1.5">/</span>
          <Link to="/clients" className="hover:text-[color:var(--brown-text)]">
            Customers
          </Link>
          <span className="mx-1.5">/</span>
          {model && id ? (
            <Link to={`/clients/${id}`} className="hover:text-[color:var(--brown-text)]">
              {model.name}
            </Link>
          ) : (
            <span>Customer</span>
          )}
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{title}</span>
        </nav>

        <div className="mb-[26px] flex items-end justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <h1 className="m-0 text-[38px] leading-[1.1] tracking-[-0.018em] text-foreground" style={{ fontFamily: 'var(--font-pixel)' }}>
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
              {model && (
                <>
                  {' '}
                  Pre-filled from <strong className="font-semibold">{model.name}</strong>&rsquo;s
                  record — edit anything here without changing it.
                </>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            className="flex-none pointer-coarse:min-h-11"
            leadingIcon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => navigate(id ? `/clients/${id}` : '/clients')}
            data-testid={`${testId}-back`}
          >
            Back to customer
          </Button>
        </div>

        {client.isLoading && (
          <div data-testid={`${testId}-loading`}>
            <LoadingSkeleton variant="table-rows" rowCount={5} />
          </div>
        )}

        {client.isError && (
          <ErrorState
            variant="compact"
            subhead="This customer didn't load."
            body="The record could not be read. Check your connection and try again."
            onRetry={() => void client.refetch()}
          />
        )}

        {!client.isLoading && !client.isError && !model && (
          <div data-testid={`${testId}-not-found`}>
            <NoResultsState query={id} />
          </div>
        )}

        {model && id && <div data-testid={testId}>{children(model, id, isOwn)}</div>}
      </div>
    </div>
  );
}
