import { useState } from 'react';
import { ListPageFrame } from '@/components/primitives/ui/ListPageFrame';
import type { TableHeaderColumn } from '@/components/primitives/ui/TableHeader';

/**
 * ResultsListPage — saved profiling results history (LIST archetype).
 *
 * P1 scaffold stub: renders the real ListPageFrame with the final column set
 * and an honest empty state. Data wiring (own/all rows per role, debounced
 * search, useURLPagination) lands in Phase P4.
 */

const COLUMNS: TableHeaderColumn[] = [
  { key: 'date', label: 'Date' },
  { key: 'prospect', label: 'Prospect' },
  { key: 'advisor', label: 'Advisor' },
  { key: 'disc', label: 'DISC' },
  { key: 'mbti', label: 'MBTI' },
  { key: 'meeting', label: 'Meeting' },
];

export default function ResultsListPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ListPageFrame
      title="Results"
      description="Saved profiling results and communication playbooks."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search prospect, advisor, DISC or MBTI…"
      columns={COLUMNS}
      rows={[]}
      variant="empty"
      selectable={false}
      page={1}
      totalPages={1}
      totalItems={0}
      onPageChange={() => undefined}
      tableTestId="profiler-results-table"
      searchTestId="profiler-results-search-input"
    />
  );
}
