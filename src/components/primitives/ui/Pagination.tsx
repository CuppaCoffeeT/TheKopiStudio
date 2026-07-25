/**
 * Pagination — first · prev · page numbers · next · last, with a "1–100 of 487" range label.
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 12px 14px padding · border-top · surface bg · en-dash range label · 5-page window + ellipsis + last.
 * 2a (2026-07-25): figures are IBM Plex Sans + `tabular-nums` — the comp carries no mono stack, and
 * tabular figures already fix the column widths. Bare list pages pass `className="bg-transparent px-0"`
 * so the footer rule alone closes the table off the page ground.
 */

import { cn } from '@/lib/utils';
import { PageBtn } from './PageBtn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  className?: string;
  /** Current rows-per-page value. When provided with `onRowsPerPageChange`, renders
   *  a "Rows per page · N ▾" native select in the footer. */
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
  onRowsPerPageChange?: (rows: number) => void;
  /** Testid for "Next page" button. */
  nextTestId?: string;
  /** Testid for "Previous page" button. */
  prevTestId?: string;
  /** Testid for "First page" button. */
  firstTestId?: string;
  /** Testid for "Last page" button. */
  lastTestId?: string;
}

function DoubleChev({ dir, disabled, onClick, testId }: { dir: 'l' | 'r'; disabled?: boolean; onClick?: () => void; testId?: string }) {
  return (
    <PageBtn disabled={disabled} onClick={onClick} aria-label={dir === 'l' ? 'First page' : 'Last page'} data-testid={testId}>
      <svg
        width="12"
        height="10"
        viewBox="0 0 14 10"
        style={{ transform: dir === 'l' ? 'rotate(180deg)' : 'none' }}
        aria-hidden
      >
        <path
          d="M3 2 L6 5 L3 8 M7.5 2 L10.5 5 L7.5 8"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </PageBtn>
  );
}

function SingleChev({ dir, disabled, onClick, testId }: { dir: 'l' | 'r'; disabled?: boolean; onClick?: () => void; testId?: string }) {
  return (
    <PageBtn disabled={disabled} onClick={onClick} aria-label={dir === 'l' ? 'Previous page' : 'Next page'} data-testid={testId}>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        style={{ transform: dir === 'l' ? 'rotate(180deg)' : 'none' }}
        aria-hidden
      >
        <path
          d="M3.5 2 L6.5 5 L3.5 8"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </PageBtn>
  );
}

/**
 * Build a 5-page sliding window around the current page, clamped to [1, totalPages].
 */
function buildPageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  start = Math.max(1, end - 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  page,
  totalPages,
  from,
  to,
  total,
  onPageChange,
  loading = false,
  className,
  rowsPerPage,
  rowsPerPageOptions = [50, 100, 200],
  onRowsPerPageChange,
  nextTestId,
  prevTestId,
  firstTestId,
  lastTestId,
}: PaginationProps) {
  const showRowsPerPage = rowsPerPage != null && onRowsPerPageChange != null;
  const atFirst = page <= 1;
  const atLast = page >= totalPages;
  const pages = buildPageWindow(page, totalPages);
  const showEllipsis = totalPages > 5 && pages[pages.length - 1] < totalPages - 0;
  const showLast = showEllipsis && pages[pages.length - 1] < totalPages;

  return (
    <div
      className={cn(
        'flex items-center gap-[6px] px-[14px] py-3',
        'bg-card',
        'border-t border-border',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      role="navigation"
      aria-label="Pagination"
    >
      <span
        className="text-[12px] text-[color:var(--fg-dim)]"
        style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}
      >
        {from}&ndash;{to} of {total.toLocaleString('en-SG')}
      </span>
      <div className="flex-1" />
      {showRowsPerPage && (
        <label
          className="inline-flex items-center gap-1.5 mr-2 text-[11.5px] text-[color:var(--fg-dim)]"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <span>Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange?.(Number(e.target.value))}
            aria-label="Rows per page"
            className="h-7 pl-2 pr-6 rounded-md bg-card border border-border text-[12px] text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}
          >
            {rowsPerPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      )}
      {loading && (
        <span
          className="inline-flex items-center gap-[6px] mr-2 text-[11px] text-[color:var(--fg-dim)]"
        >
          <span
            aria-hidden
            className="inline-block w-[10px] h-[10px] rounded-full border-[1.5px] border-border border-t-primary animate-spin"
          />
          Loading&hellip;
        </span>
      )}
      <DoubleChev dir="l" disabled={atFirst} onClick={() => onPageChange?.(1)} testId={firstTestId} />
      <SingleChev dir="l" disabled={atFirst} onClick={() => onPageChange?.(page - 1)} testId={prevTestId} />
      {pages.map((p) => (
        <PageBtn key={p} active={p === page} onClick={() => onPageChange?.(p)}>
          {p}
        </PageBtn>
      ))}
      {showEllipsis && (
        <span
          className="px-[2px] text-[12px] text-[color:var(--fg-dim)]"
          aria-hidden
        >
          &hellip;
        </span>
      )}
      {showLast && (
        <PageBtn active={page === totalPages} onClick={() => onPageChange?.(totalPages)}>
          {totalPages}
        </PageBtn>
      )}
      <SingleChev dir="r" disabled={atLast} onClick={() => onPageChange?.(page + 1)} testId={nextTestId} />
      <DoubleChev dir="r" disabled={atLast} onClick={() => onPageChange?.(totalPages)} testId={lastTestId} />
    </div>
  );
}
