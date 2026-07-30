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
 * Because a manager/super_admin sees the whole book, the table grows an
 * **Advisor** column so they can tell whose customer each row is — gated on the
 * `view_all_clients` capability, so a solo advisor (every row is theirs) never
 * sees it. Owner names resolve through `useCustomerOwners`, a page-scoped id
 * lookup that mirrors `useCustomerSignals`; the golden list query is untouched.
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
import type { DataTableVariant } from '@/components/primitives/ui/DataTable';
import { MobileListCard } from '@/components/primitives/ui/MobileListCard';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useURLPagination } from '@/hooks/useURLPagination';
import { getCurrentSingaporeTime } from '@/utils/timezoneUtils';
import { sanitizeSearchTerm } from '../api/clientsService';
import { useClientsList } from '../hooks/useClientsList';
import { useCustomerSignals } from '../hooks/useCustomerSignals';
import { useAdvisorColumn } from '../hooks/useAdvisorColumn';
import { clientFromRow } from '../lib/clientMapping';
import { JourneyChecklist } from '../components/JourneyChecklist';
import {
  buildCustomerRow,
  contactCell,
  riskLabel,
  toRowState,
} from '../components/customerRowModel';
import { AddCustomerChoiceModal } from '../components/modals/AddCustomerChoiceModal';
import { ClientFormModal } from '../components/modals/ClientFormModal';

const ROWS_PER_PAGE = 25;
const PROFILER_PATH = '/profiler';

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

  // Advisor column (whether to show it, the column set, per-client owner name).
  const { showAdvisor, columns, advisorNames } = useAdvisorColumn(data?.rows);

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
      clients.map((c) =>
        buildCustomerRow(
          c,
          rowStates.get(c.id)!,
          () => navigate(`/clients/${c.id}`),
          showAdvisor ? { name: advisorNames.get(c.id) ?? null } : undefined,
        ),
      ),
    [clients, rowStates, navigate, showAdvisor, advisorNames],
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
                {showAdvisor && <span>{advisorNames.get(c.id) ?? '—'}</span>}
                <span>{riskLabel(c, state)}</span>
                <JourneyChecklist journey={state.journey} />
              </>
            }
            right={contactCell(c, state)}
          />
        );
      }),
    [clients, rowStates, navigate, showAdvisor, advisorNames],
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
        columns={columns}
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
