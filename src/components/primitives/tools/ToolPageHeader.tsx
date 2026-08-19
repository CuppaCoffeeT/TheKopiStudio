/**
 * ToolPageHeader — breadcrumb, serif title with its index numeral, and one
 * optional trailing action. The front door every tool opens with.
 *
 * HOISTED 2026-08-19 from `features/crm/planning/components/PlanningToolHeader`
 * so the profiler (a separate feature workspace, barred from importing `crm`)
 * can open with the same header the planning tools do. One behavioural change
 * in the move: the hard-wired "Back to customer" button became a generic
 * `action` slot. The planning frame still passes exactly that button; the
 * profiler passes its own, and a tool with nothing to offer passes nothing.
 *
 * The index numeral is one of brown's four sanctioned appearances
 * (.claude/rules/light-theme.md → "Brown discipline"). It rides the RAW brand
 * brown, not `--brown-text`, because at 20px it clears the 18px display floor
 * where the raw hex is a legitimate mark rather than small type.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ToolPageHeaderProps {
  title: string;
  description: string;
  /** The tool's step in the chain, e.g. "01" or "04". */
  index: string;
  testId: string;
  /** Trailing control — "Back to customer", "Start over", or nothing at all. */
  action?: ReactNode;
}

export function ToolPageHeader({
  title,
  description,
  index,
  testId,
  action,
}: ToolPageHeaderProps) {
  return (
    <>
      <nav className="mb-3 text-[12px] text-[color:var(--fg-dim)]" aria-label="Breadcrumb">
        <Link to="/dashboard" className="hover:text-[color:var(--brown-text)]">
          Overview
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{title}</span>
      </nav>

      <div
        className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-5"
        data-testid={`${testId}-header`}
      >
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

        {action}
      </div>
    </>
  );
}
