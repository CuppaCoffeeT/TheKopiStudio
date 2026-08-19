/**
 * PlanningToolHeader — breadcrumb, serif title with its index numeral, and the
 * back-to-customer button.
 *
 * Split from `PlanningToolFrame` so that file is about STATE (which customer,
 * loading, error, blank-vs-chosen) and this is about the header block.
 *
 * "Back to customer" only renders once there IS a customer to go back to.
 * Reached from navigation with none, the button used to point at `/clients` and
 * read as "Back" to a page you had never been on.
 */

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';

interface PlanningToolHeaderProps {
  title: string;
  description: string;
  /** The tool's step in the chain, e.g. "04". */
  index: string;
  testId: string;
  /** Null when no customer is chosen — the back button is then omitted. */
  customerId: string | null;
  onBack: (customerId: string) => void;
}

export function PlanningToolHeader({
  title,
  description,
  index,
  testId,
  customerId,
  onBack,
}: PlanningToolHeaderProps) {
  return (
    <>
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
            <span className="mr-2 text-[20px] text-[color:var(--brand-brown)]" aria-hidden="true">
              {index}
            </span>
            {title}
          </h1>
          <p className="m-0 mt-1.5 text-[12.5px] leading-[1.6] text-[color:var(--fg-dim)]">
            {description}
          </p>
        </div>

        {customerId && (
          <Button
            variant="outline"
            className="flex-none pointer-coarse:min-h-11"
            leadingIcon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => onBack(customerId)}
            data-testid={`${testId}-back`}
          >
            Back to customer
          </Button>
        )}
      </div>
    </>
  );
}
