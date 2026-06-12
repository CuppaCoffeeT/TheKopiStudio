/**
 * ClientsListPage — client book (LIST archetype, route /clients).
 *
 * Server-side paginated + searched via `useClientsList` (ilike name/email,
 * 350 ms debounce, URL-synced page/search); RLS scopes rows (advisor → own,
 * manager/super_admin → all). Rows map through `clientFromRow`; the follow-up
 * column badges `next_review_date` ONLY — the list fetch carries no
 * interactions by design (see lib/decisions.md, P4). Row click opens the
 * client detail; Add client opens the shared ClientFormModal in create mode.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListPageFrame } from '@/components/primitives/ui/ListPageFrame';
import type { TableHeaderColumn } from '@/components/primitives/ui/TableHeader';
import type { DataTableRow, DataTableVariant } from '@/components/primitives/ui/DataTable';
import { MobileListCard } from '@/components/primitives/ui/MobileListCard';
import { Badge } from '@/components/primitives/shell/Badge';
import { DateCell } from '@/components/primitives/shell/cells/DateCell';
import { useDebounce } from '@/hooks/useDebounce';
import { useURLPagination } from '@/hooks/useURLPagination';
import { getCurrentSingaporeTime } from '@/utils/timezoneUtils';
import { sanitizeSearchTerm } from '../api/clientsService';
import { useClientsList } from '../hooks/useClientsList';
import { clientFromRow } from '../lib/mapping';
import { FollowUpBadge } from '../components/FollowUpBadge';
import { ClientFormModal } from '../components/modals/ClientFormModal';
import type { CrmClient } from '../types';

const ROWS_PER_PAGE = 25;

const COLUMNS: TableHeaderColumn[] = [
  { key: 'name', label: 'Name', grow: 2 },
  { key: 'email', label: 'Email', grow: 2 },
  { key: 'phone', label: 'Phone', width: 128 },
  { key: 'risk', label: 'Risk profile', width: 124 },
  { key: 'nextReview', label: 'Next review', width: 112 },
  { key: 'followUp', label: 'Follow-up', width: 132 },
];

function buildRow(client: CrmClient, refDate: Date, onOpen: () => void): DataTableRow {
  return {
    id: client.id,
    testId: `clients-row-${client.id}`,
    onClick: onOpen,
    cells: [
      { key: 'name', grow: 2, content: <span className="font-medium">{client.name}</span> },
      { key: 'email', grow: 2, content: client.email || '—', muted: true },
      { key: 'phone', width: 128, content: client.phone || '—', mono: true },
      {
        key: 'risk',
        width: 124,
        content: (
          <Badge variant="outline" data-testid={`clients-risk-chip-${client.id}`}>
            {client.riskProfile}
          </Badge>
        ),
      },
      {
        key: 'nextReview',
        width: 112,
        content: <DateCell value={client.nextReviewDate || null} />,
      },
      {
        key: 'followUp',
        width: 132,
        content: (
          <FollowUpBadge
            date={client.nextReviewDate || null}
            refDate={refDate}
            testId={`clients-follow-up-${client.id}`}
          />
        ),
      },
    ],
  };
}

export default function ClientsListPage() {
  const navigate = useNavigate();
  const { params, setters } = useURLPagination({ sort: 'created_at', order: 'desc' });
  const [addOpen, setAddOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(params.search);
  const debouncedSearch = useDebounce(searchInput, 350);
  useEffect(() => {
    setters.setSearch(debouncedSearch);
  }, [debouncedSearch, setters]);

  const { data, isLoading, isError } = useClientsList({
    search: params.search,
    page: params.page,
    rowsPerPage: ROWS_PER_PAGE,
  });

  const refDate = useMemo(() => getCurrentSingaporeTime(), []);
  const clients = useMemo(() => (data?.rows ?? []).map(clientFromRow), [data]);
  const totalItems = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));

  // A term the server-side sanitizer strips to nothing (e.g. "***") applies no
  // filter, so render it exactly like an empty search rather than "no matches".
  const effectiveSearch = sanitizeSearchTerm(params.search);
  const variant: DataTableVariant = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : clients.length === 0
        ? effectiveSearch
          ? 'no-results'
          : 'empty'
        : 'default';

  const rows = useMemo(
    () => clients.map((c) => buildRow(c, refDate, () => navigate(`/clients/${c.id}`))),
    [clients, refDate, navigate],
  );

  const mobileBody = useMemo(
    () =>
      clients.map((c) => (
        <MobileListCard
          key={c.id}
          data-testid={`clients-mobile-card-${c.id}`}
          onClick={() => navigate(`/clients/${c.id}`)}
          title={c.name}
          subtitle={c.email || c.occupation || '—'}
          meta={
            <>
              {c.phone && <span>{c.phone}</span>}
              <span>{c.riskProfile}</span>
              <DateCell value={c.nextReviewDate || null} />
            </>
          }
          right={<FollowUpBadge date={c.nextReviewDate || null} refDate={refDate} fallback={null} />}
        />
      )),
    [clients, refDate, navigate],
  );

  const handleClearSearch = () => {
    setSearchInput('');
    setters.setSearch('');
  };

  return (
    <>
      <ListPageFrame
        title="Clients"
        description="Client book — policies, reviews and balances."
        primaryAction={{ label: 'Add client', onClick: () => setAddOpen(true) }}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search name or email…"
        onClearFilters={params.search ? handleClearSearch : undefined}
        columns={COLUMNS}
        rows={rows}
        variant={variant}
        emptyText="Add your first client"
        emptySubtext="Your book is empty — add a client here, or wait for the CRM data import to populate it."
        noResultsText={`No matches for "${params.search}"`}
        noResultsSubtext="Try a different name or email."
        selectable={false}
        mobileBody={mobileBody}
        page={params.page}
        totalPages={totalPages}
        totalItems={totalItems}
        rowsPerPage={ROWS_PER_PAGE}
        onPageChange={setters.setPage}
        tableTestId="clients-table"
        searchTestId="clients-search"
        clearFiltersTestId="clients-clear-search"
        primaryActionTestId="clients-add-client-btn"
      />
      <ClientFormModal open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
