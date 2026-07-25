/**
 * LatestAdditionsTable — the /dashboard Overview feed (2a comp mockup [0]).
 *
 * A hairline table with NO card wrapper: it sits straight on the page cream
 * under the section head, exactly as KOPI_2A_SPEC → "Archetype — dashboard" §4
 * draws it. Row separators are the repetition hairline `--border-faint`
 * applied as `border-top`, so the header rule and the first row rule never
 * double up.
 *
 * Because the table paints the PAGE ground, every small string here reads
 * `--fg-dim` rather than `--fg-muted` — muted is 4.12:1 on page cream and only
 * clears AA on a card (the spec's own "Open item — muted on page").
 *
 * Interaction split, deliberately: the whole row is clickable for pointers, and
 * the name cell carries the real `<Link>` so keyboard and AT users get a proper
 * control with a brown focus ring instead of a `tabindex`-ed `<tr>`.
 *
 * Purely presentational — the caller owns fetching (`useLatestAdditions`) and
 * supplies the one quiet action the empty state offers.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Badge, ErrorState, LoadingSkeleton } from '@/components/primitives/shell';
import { cn } from '@/lib/utils';
import type { LatestAdditionRow } from '../lib/latestAdditions';

const HEAD_CELL = 'pr-2 pt-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em]';
const BODY_CELL = 'pr-2 py-[11px] pointer-coarse:py-[13px]';

interface LatestAdditionsTableProps {
  rows: readonly LatestAdditionRow[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onOpen: (row: LatestAdditionRow) => void;
  /** The single quiet action the 2a empty state is allowed to offer. */
  emptyAction?: ReactNode;
  testId?: string;
}

export function LatestAdditionsTable({
  rows,
  isLoading,
  isError,
  onRetry,
  onOpen,
  emptyAction,
  testId,
}: LatestAdditionsTableProps) {
  const showBody = rows.length > 0;

  return (
    <div data-testid={testId}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-[color:var(--fg-dim)]">
              <th scope="col" className={HEAD_CELL}>
                Name
              </th>
              <th scope="col" className={HEAD_CELL}>
                Module
              </th>
              <th scope="col" className={HEAD_CELL}>
                Risk
              </th>
              <th scope="col" className={HEAD_CELL}>
                Added
              </th>
              <th scope="col" className={cn(HEAD_CELL, 'pr-0 text-right')}>
                Status
              </th>
            </tr>
          </thead>
          {showBody && (
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onOpen(row)}
                  data-testid={`home-latest-row-${row.id}`}
                  className={cn(
                    'cursor-pointer border-t border-[color:var(--border-faint)]',
                    'text-[color:var(--fg-dim)] transition-colors',
                    'hover:bg-[color:var(--row-hover)] active:bg-[color:var(--tint-pressed)]',
                  )}
                >
                  <td className={cn(BODY_CELL, 'max-w-[220px]')}>
                    <Link
                      to={row.href}
                      onClick={(event) => event.stopPropagation()}
                      className={cn(
                        'block truncate font-medium text-foreground',
                        'focus-visible:outline-2 focus-visible:outline-offset-2',
                        'focus-visible:outline-[color:hsl(var(--ring))]',
                      )}
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className={cn(BODY_CELL, 'whitespace-nowrap')}>{row.module}</td>
                  <td className={cn(BODY_CELL, 'whitespace-nowrap')}>{row.risk}</td>
                  <td className={cn(BODY_CELL, 'whitespace-nowrap')}>{row.addedLabel}</td>
                  <td className="py-[11px] text-right pointer-coarse:py-[13px]">
                    <Badge variant="status" tone={row.statusTone} dot={false}>
                      {row.statusLabel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {isLoading && !showBody && <LoadingSkeleton variant="table-rows" rowCount={3} />}

      {!isLoading && isError && !showBody && (
        <ErrorState
          variant="compact"
          subhead="Latest additions didn't load."
          body="Your newest clients and profiles could not be read. Check your connection and retry."
          onRetry={onRetry}
          className="py-8"
        />
      )}

      {!isLoading && !isError && !showBody && (
        <div
          data-testid="home-latest-empty"
          className="border-t border-border px-4 pt-10 pb-2 text-center"
        >
          <p
            className="text-[20px] italic leading-[1.3]"
            style={{ fontFamily: 'var(--font-pixel)', color: 'var(--fg)' }}
          >
            Your book is empty.
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-[1.6] text-[color:var(--fg-dim)]">
            Add your first client to start tracking profile completeness — new clients and saved
            profiles land here the moment you create them.
          </p>
          {emptyAction && <div className="mt-3.5 flex justify-center">{emptyAction}</div>}
        </div>
      )}
    </div>
  );
}
