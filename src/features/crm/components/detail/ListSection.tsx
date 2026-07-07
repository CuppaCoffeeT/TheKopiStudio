/**
 * ListSection — shared card shell for the client-detail child-list tabs
 * (Policies / Interactions / Bank history). Owns the header row (title +
 * derived meta + Add action) and the loading / error / empty surfaces per
 * profiler precedent; tabs render their `<li>` rows as children.
 */

import type { ReactNode } from 'react';
import { Card, CardTitle } from '@/components/primitives/shell/Card';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';

interface ListSectionProps {
  title: string;
  /** Secondary header line, e.g. the derived bank total. */
  meta?: ReactNode;
  /** Header action (Add button) — callers hide it in read-only mode. */
  action?: ReactNode;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  errorSubhead: string;
  errorBody: string;
  retryPath: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptySubtext: string;
  testId: string;
  /** The `<li>` rows. */
  children: ReactNode;
}

export function ListSection({
  title,
  meta,
  action,
  isLoading,
  isError,
  onRetry,
  errorSubhead,
  errorBody,
  retryPath,
  isEmpty,
  emptyTitle,
  emptySubtext,
  testId,
  children,
}: ListSectionProps) {
  return (
    <Card padding="p-0" data-testid={testId}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <CardTitle as="h2">{title}</CardTitle>
          {meta && (
            <div className="mt-1 text-[12.5px] text-muted-foreground">{meta}</div>
          )}
        </div>
        {action}
      </div>

      {isLoading && (
        <div className="p-5" data-testid={`${testId}-loading`}>
          <LoadingSkeleton variant="table-rows" rowCount={4} />
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          subhead={errorSubhead}
          body={errorBody}
          path={retryPath}
          onRetry={onRetry}
          className="rounded-b-2xl"
        />
      )}

      {!isLoading && !isError && isEmpty && (
        <div className="px-6 py-10 text-center" data-testid={`${testId}-empty`}>
          <p className="m-0 text-[14px] font-semibold text-foreground">
            {emptyTitle}
          </p>
          <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            {emptySubtext}
          </p>
        </div>
      )}

      {!isLoading && !isError && !isEmpty && (
        <ul className="m-0 list-none divide-y divide-border p-0">
          {children}
        </ul>
      )}
    </Card>
  );
}
