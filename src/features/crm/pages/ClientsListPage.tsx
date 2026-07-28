/**
 * ClientsListPage — the customer book (LIST archetype, route /clients).
 *
 * Renamed to **Customers** in the customer-centred IA (Kopi Studio Directions
 * turn 3a): with the tools out of the sidebar this list is one of only two
 * destinations, so it has to say where every customer is up to, not just who
 * they are. The comp's column order is the order the work happens in —
 * Customer · Risk profile · Added · Profiler·Info·Report · Last contact.
 *
 * Server-side paginated + searched via `useClientsList` (ilike name/email,
 * 350 ms debounce, URL-synced page/search); RLS scopes rows (advisor → own,
 * manager/super_admin → all). Rows map through `clientFromRow`.
 *
 * The checklist and the "gone quiet" marker come from `useCustomerSignals`,
 * which looks up ONLY the ids on the current page — the list fetch itself
 * still carries no interactions by design (see lib/decisions.md, P4). Both
 * columns read `lib/customerJourney`, the same ruleset the Overview queue and
 * the customer detail launcher use, so a row can never disagree with the record
 * it opens. While signals are in flight the checklist renders from the client
 * row alone (profiler unknown ⇒ not started), then settles — the alternative,
 * blanking the column, shifts the table under the pointer.
 *
 * `New customer` opens the fork modal, not the form: under this IA the
 * recommended way to create a customer is to profile them.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListPageFrame } from '@/components/primitives/ui/ListPageFrame';
import type { TableHeaderColumn } from '@/components/primitives/ui/TableHeader';
import type { DataTableRow, DataTableVariant } from '@/components/primitives/ui/DataTable';
import { MobileListCard } from '@/components/primitives/ui/MobileListCard';
import { Badge } from '@/components/primitives/shell/Badge';
import { DateCell } from '@/components/primitives/shell/cells/DateCell';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useURLPagination } from '@/hooks/useURLPagination';
import { getCurrentSingaporeTime } from '@/utils/timezoneUtils';
import { sanitizeSearchTerm } from '../api/clientsService';
import type { CustomerSignals } from '../api/customerQueueService';
import { useClientsList } from '../hooks/useClientsList';
import { useCustomerSignals } from '../hooks/useCustomerSignals';
import { clientFromRow } from '../lib/mapping';
import { deriveAttention, deriveJourney, type CustomerJourney } from '../lib/customerJourney';
import { JourneyChecklist } from '../components/JourneyChecklist';
import { AddCustomerChoiceModal } from '../components/modals/AddCustomerChoiceModal';
import { ClientFormModal } from '../components/modals/ClientFormModal';
import type { CrmClient } from '../types';

const ROWS_PER_PAGE = 25;
const PROFILER_PATH = '/profiler';

const COLUMNS: TableHeaderColumn[] = [
  { key: 'name', label: 'Customer', grow: 2 },
  { key: 'risk', label: 'Risk profile', width: 124 },
  { key: 'added', label: 'Added', width: 104 },
  { key: 'progress', label: 'Profiler · Info · Report', width: 168 },
  { key: 'contact', label: 'Last contact', width: 140 },
];

/** A customer row's derived state — journey + how long they have been quiet. */
interface RowState {
  journey: CustomerJourney;
  quietDays: number | null;
  isQuiet: boolean;
  /** False when no interaction was ever logged — the column must not claim one. */
  hasContact: boolean;
}

/** Model numerics are form strings ('' = unset); the journey rules want numbers. */
function toRowState(
  client: CrmClient,
  signals: CustomerSignals | undefined,
  refDate: Date,
): RowState {
  const journey = deriveJourney({
    hasProfile: signals?.hasProfile ?? false,
    email: client.email,
    phone: client.phone,
    dateOfBirth: client.dateOfBirth,
    occupation: client.occupation,
    annualIncome: client.annualIncome === '' ? null : Number(client.annualIncome),
    nextReviewDate: client.nextReviewDate,
  });
  const attention = deriveAttention(
    {
      lastContactDate: signals?.lastContactDate ?? null,
      addedDate: client.createdDate || null,
      nextReviewDate: client.nextReviewDate || null,
      journey,
    },
    refDate,
  );
  return {
    journey,
    quietDays: attention.quietDays,
    isQuiet: attention.isQuiet,
    hasContact: Boolean(signals?.lastContactDate),
  };
}

/**
 * "7 days ago" / "Today" / "Never contacted".
 *
 * The quiet CLOCK falls back to the added date (a customer added three weeks
 * ago with no reply has certainly gone quiet), but this LABEL must not — saying
 * "Today" under a "Last contact" heading for someone who has never been
 * contacted is simply false. The two readings are separated on purpose.
 */
function contactLabel(state: RowState): string {
  if (!state.hasContact) return 'Never contacted';
  const days = state.quietDays;
  if (days === null) return 'Never contacted';
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function buildRow(client: CrmClient, state: RowState, onOpen: () => void): DataTableRow {
  return {
    id: client.id,
    testId: `clients-row-${client.id}`,
    onClick: onOpen,
    cells: [
      {
        key: 'name',
        grow: 2,
        content: (
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{client.name}</span>
            {/* --fg-dim, not --fg-muted: the 2a list row is `surface="bare"` and
                sits on the PAGE cream, where #7D6B5B is 4.12:1 and fails AA.
                `DataRowCells` makes this step for its own `muted` cells; content
                passed INTO a cell has to make it itself. */}
            <span className="truncate text-[11.5px] text-[color:var(--fg-dim)]">
              {client.email || client.phone || 'No contact on file'}
            </span>
          </span>
        ),
      },
      {
        key: 'risk',
        width: 124,
        content: (
          <Badge variant="outline" data-testid={`clients-risk-chip-${client.id}`}>
            {state.journey.steps.profiler === 'done' ? client.riskProfile : 'Not profiled'}
          </Badge>
        ),
      },
      { key: 'added', width: 104, content: <DateCell value={client.createdDate || null} /> },
      {
        key: 'progress',
        width: 168,
        content: (
          <JourneyChecklist journey={state.journey} testId={`clients-progress-${client.id}`} />
        ),
      },
      {
        key: 'contact',
        width: 140,
        content: state.isQuiet ? (
          <Badge tone="danger" data-testid={`clients-quiet-${client.id}`}>
            {contactLabel(state)}
          </Badge>
        ) : (
          <span className="text-[color:var(--fg-dim)]">{contactLabel(state)}</span>
        ),
      },
    ],
  };
}

export default function ClientsListPage() {
  const navigate = useNavigate();
  const { modules } = useAuth();
  const { params, setters } = useURLPagination({ sort: 'created_at', order: 'desc' });
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const canProfile = modules.some((mod) => mod.path === PROFILER_PATH);

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

  const pageIds = useMemo(() => clients.map((c) => c.id), [clients]);
  const { data: signals } = useCustomerSignals(pageIds);

  const rowStates = useMemo(
    () => new Map(clients.map((c) => [c.id, toRowState(c, signals?.[c.id], refDate)])),
    [clients, signals, refDate],
  );

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
    () =>
      clients.map((c) => buildRow(c, rowStates.get(c.id)!, () => navigate(`/clients/${c.id}`))),
    [clients, rowStates, navigate],
  );

  const mobileBody = useMemo(
    () =>
      clients.map((c) => {
        const state = rowStates.get(c.id)!;
        return (
          <MobileListCard
            key={c.id}
            data-testid={`clients-mobile-card-${c.id}`}
            onClick={() => navigate(`/clients/${c.id}`)}
            title={c.name}
            subtitle={c.email || c.occupation || '—'}
            meta={
              <>
                <span>
                  {state.journey.steps.profiler === 'done' ? c.riskProfile : 'Not profiled'}
                </span>
                <JourneyChecklist journey={state.journey} />
              </>
            }
            right={
              state.isQuiet ? (
                <Badge tone="danger">{contactLabel(state)}</Badge>
              ) : (
                <span className="text-[11.5px] text-muted-foreground">
                  {contactLabel(state)}
                </span>
              )
            }
          />
        );
      }),
    [clients, rowStates, navigate],
  );

  const handleClearSearch = () => {
    setSearchInput('');
    setters.setSearch('');
  };

  const handleChoice = (choice: 'profiler' | 'empty') => {
    setChoiceOpen(false);
    if (choice === 'profiler') navigate(PROFILER_PATH);
    else setAddOpen(true);
  };

  return (
    <>
      <ListPageFrame
        title="Customers"
        kicker="Customers"
        description="Everyone in your book, and where each of them is up to."
        primaryAction={{ label: 'New customer', onClick: () => setChoiceOpen(true) }}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search name or email…"
        onClearFilters={params.search ? handleClearSearch : undefined}
        columns={COLUMNS}
        rows={rows}
        variant={variant}
        emptyText="Add your first customer"
        emptySubtext="Your book is empty — profile someone new, or create an empty profile to hold the place."
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
      <AddCustomerChoiceModal
        open={choiceOpen}
        onOpenChange={setChoiceOpen}
        canProfile={canProfile}
        onChoose={handleChoice}
      />
      <ClientFormModal open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
