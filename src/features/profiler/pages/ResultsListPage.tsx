/**
 * ResultsListPage — saved profiling results history (LIST archetype).
 *
 * Server-side paginated + searched via `getResultsPaginated`; RLS scopes the
 * rows (advisor → own, manager → all incl. NULL-owner legacy rows — those get
 * an "Unclaimed" badge). Row click opens the result detail; delete lives on
 * the detail page only.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListPageFrame } from '@/components/primitives/ui/ListPageFrame';
import type { TableHeaderColumn } from '@/components/primitives/ui/TableHeader';
import type { DataTableRow, DataTableVariant } from '@/components/primitives/ui/DataTable';
import { MobileListCard } from '@/components/primitives/ui/MobileListCard';
import { DateCell } from '@/components/primitives/shell/cells/DateCell';
import { StatusBadge } from '@/components/primitives/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';
import { useURLPagination } from '@/hooks/useURLPagination';
import { sanitizeSearchTerm } from '../api/resultsService';
import { useResultsList } from '../hooks/useResultsList';
import { DiscChip } from '../components/DiscChip';
import { meetingLabel } from '../lib/meeting';
import type { DiscLetter, ProfilerResult } from '../types';

const ROWS_PER_PAGE = 25;

const COLUMNS: TableHeaderColumn[] = [
  { key: 'date', label: 'Date', width: 88 },
  { key: 'prospect', label: 'Prospect', grow: 2 },
  { key: 'advisor', label: 'Advisor', grow: 2 },
  { key: 'disc', label: 'DISC', width: 112 },
  { key: 'mbti', label: 'MBTI', width: 64 },
  { key: 'meeting', label: 'Meeting', width: 112 },
];

function AdvisorCell({ result }: { result: ProfilerResult }) {
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="truncate">{result.advisor_name}</span>
      {result.user_id === null && (
        <StatusBadge variant="draft" className="shrink-0">
          unclaimed
        </StatusBadge>
      )}
    </span>
  );
}

function buildRow(result: ProfilerResult, onOpen: () => void): DataTableRow {
  return {
    id: result.id,
    testId: `results-row-${result.id}`,
    onClick: onOpen,
    cells: [
      { key: 'date', width: 88, content: <DateCell value={result.created_at} /> },
      {
        key: 'prospect',
        grow: 2,
        content: <span className="font-medium">{result.prospect_name}</span>,
      },
      { key: 'advisor', grow: 2, content: <AdvisorCell result={result} /> },
      {
        key: 'disc',
        width: 112,
        content: (
          <DiscChip
            primary={result.disc_primary as DiscLetter}
            secondary={result.disc_secondary as DiscLetter}
          />
        ),
      },
      { key: 'mbti', width: 64, content: result.mbti, mono: true },
      { key: 'meeting', width: 112, content: meetingLabel(result.meeting), muted: true },
    ],
  };
}

export default function ResultsListPage() {
  const navigate = useNavigate();
  const { params, setters } = useURLPagination({ sort: 'created_at', order: 'desc' });

  const [searchInput, setSearchInput] = useState(params.search);
  const debouncedSearch = useDebounce(searchInput, 350);
  useEffect(() => {
    setters.setSearch(debouncedSearch);
  }, [debouncedSearch, setters]);

  const { data, isLoading, isError } = useResultsList({
    search: params.search,
    page: params.page,
    rowsPerPage: ROWS_PER_PAGE,
  });

  const results = useMemo(() => data?.rows ?? [], [data]);
  const totalItems = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));

  // A term the server-side sanitizer strips to nothing (e.g. "***") applies no
  // filter, so render it exactly like an empty search rather than "no matches".
  const effectiveSearch = sanitizeSearchTerm(params.search);
  const variant: DataTableVariant = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : results.length === 0
        ? effectiveSearch
          ? 'no-results'
          : 'empty'
        : 'default';

  const rows = useMemo(
    () => results.map((r) => buildRow(r, () => navigate(`/profiler-results/${r.id}`))),
    [results, navigate],
  );

  const mobileBody = useMemo(
    () =>
      results.map((r) => (
        <MobileListCard
          key={r.id}
          data-testid={`results-mobile-card-${r.id}`}
          onClick={() => navigate(`/profiler-results/${r.id}`)}
          title={r.prospect_name}
          subtitle={r.advisor_name}
          meta={
            <>
              <DateCell value={r.created_at} />
              <span>{r.mbti}</span>
              <span>{meetingLabel(r.meeting, 'short')}</span>
              {r.user_id === null && <StatusBadge variant="draft">unclaimed</StatusBadge>}
            </>
          }
          right={
            <DiscChip
              primary={r.disc_primary as DiscLetter}
              secondary={r.disc_secondary as DiscLetter}
            />
          }
        />
      )),
    [results, navigate],
  );

  const handleClearSearch = () => {
    setSearchInput('');
    setters.setSearch('');
  };

  return (
    <ListPageFrame
      title="Results"
      description="Saved profiling results and communication playbooks."
      searchQuery={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Search prospect, advisor, DISC or MBTI…"
      onClearFilters={params.search ? handleClearSearch : undefined}
      columns={COLUMNS}
      rows={rows}
      variant={variant}
      emptyText="No results yet — run a profile"
      emptySubtext="Profiles generated in the wizard appear here."
      noResultsText={`No matches for "${params.search}"`}
      noResultsSubtext="Try a different prospect, advisor, DISC letter or MBTI type."
      selectable={false}
      mobileBody={mobileBody}
      page={params.page}
      totalPages={totalPages}
      totalItems={totalItems}
      rowsPerPage={ROWS_PER_PAGE}
      onPageChange={setters.setPage}
      tableTestId="results-table"
      searchTestId="results-search"
      clearFiltersTestId="results-clear-search"
    />
  );
}
