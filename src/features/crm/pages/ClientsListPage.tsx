/**
 * ClientsListPage — client book (LIST archetype, route /clients).
 *
 * P1 scaffold: real ListPageFrame with the production column set and
 * URL-synced search/pagination. The book is empty until the data layer (P3)
 * and the CRM import land, so the table renders the empty/no-results states;
 * P3 swaps the empty `rows` for the crmClients list hook output and P4 adds
 * the Add Client primary action, mobile cards and follow-up badge cells.
 */

import { ListPageFrame } from '@/components/primitives/ui/ListPageFrame';
import type { TableHeaderColumn } from '@/components/primitives/ui/TableHeader';
import type { DataTableRow, DataTableVariant } from '@/components/primitives/ui/DataTable';
import { useURLPagination } from '@/hooks/useURLPagination';

const ROWS_PER_PAGE = 25;

const COLUMNS: TableHeaderColumn[] = [
  { key: 'name', label: 'Name', grow: 2 },
  { key: 'email', label: 'Email', grow: 2 },
  { key: 'phone', label: 'Phone', width: 128 },
  { key: 'risk', label: 'Risk profile', width: 112 },
  { key: 'nextReview', label: 'Next review', width: 112 },
  { key: 'followUp', label: 'Follow-up', width: 112 },
];

export default function ClientsListPage() {
  const { params, setters } = useURLPagination({ sort: 'name', order: 'asc' });

  // P3 replaces with the crmClients list hook (bounded, is_deleted filtered).
  const rows: DataTableRow[] = [];
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));

  const variant: DataTableVariant =
    rows.length === 0 ? (params.search ? 'no-results' : 'empty') : 'default';

  return (
    <ListPageFrame
      title="Clients"
      description="Client book — policies, reviews and balances."
      searchQuery={params.search}
      onSearchChange={setters.setSearch}
      searchPlaceholder="Search name or email…"
      onClearFilters={params.search ? () => setters.setSearch('') : undefined}
      columns={COLUMNS}
      rows={rows}
      variant={variant}
      emptyText="Add your first client"
      emptySubtext="Your book is empty — the CRM data import will populate it, or add clients here once it lands."
      noResultsText={`No matches for "${params.search}"`}
      noResultsSubtext="Try a different name or email."
      selectable={false}
      page={params.page}
      totalPages={totalPages}
      totalItems={totalItems}
      rowsPerPage={ROWS_PER_PAGE}
      onPageChange={setters.setPage}
      tableTestId="clients-table"
      searchTestId="clients-search"
      clearFiltersTestId="clients-clear-search"
    />
  );
}
