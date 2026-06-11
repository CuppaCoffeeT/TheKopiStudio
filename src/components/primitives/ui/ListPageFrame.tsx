/**
 * ListPageFrame — Lego-assembly frame for every list archetype page.
 *
 * Composes AppHeader + ImpersonationBanner + title-row (H1 · description · primary-action)
 *   + StatusTabs + FilterBar + DataTable + Pagination + FloatingCTA (mobile).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTable.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/DataTable.jsx#L388 (PageChrome)
 * Adopters: tracked in DESIGN_CATALOG.md (primary target: CompanyList + 40+ list pages).
 *
 * Locked: renders AppHeader directly (not via DashboardHeader shim) — DashboardHeader's
 * pre-rendered title row lacks a primary-action slot. This is the direct-migration
 * landing surface referenced in DashboardHeader.tsx JSDoc.
 *
 * Chrome plumbing (user/theme/impersonation/sign-out) delegated to `useDashboardChrome`.
 *
 * `floatingCTAOnly=false` (default) renders BOTH an inline desktop primary button
 * next to the H1 AND a mobile FloatingCTA — per archetypes/list.md responsive split.
 */

import { type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardChrome } from '@/hooks/useDashboardChrome';
import { AppHeader } from '@/components/primitives/shell/AppHeader';
import { Button } from '@/components/primitives/shell/Button';
import { ImpersonationBanner } from '@/components/primitives/shell/ImpersonationBanner';
import { FilterBar } from '@/components/primitives/shell/FilterBar';
import { FloatingCTA } from '@/components/primitives/shell/FloatingCTA';
import { PageTitle } from '@/components/primitives/shell/PageTitle';
import { PageDescription } from '@/components/primitives/shell/PageDescription';
import { type BreadcrumbSegment } from '@/components/primitives/shell/Breadcrumb';
import { DataTable, type DataTableRow, type DataTableVariant } from './DataTable';
import { type DataRowDensity } from './DataRow';
import { type TableHeaderColumn } from './TableHeader';
import { Pagination } from './Pagination';
import { StatusTabs, type StatusTab } from './StatusTabs';

export interface ListPageFrameProps {
  title: string;
  description?: string;
  primaryAction?: { label: string; onClick: () => void; icon?: ReactNode };
  /** Optional contextual banner rendered between the title block and the KPI tiles. Use for `<Alert>` warnings tied to the page's data (e.g. "N workers without salary"). */
  banner?: ReactNode;
  /** Optional KPI strip rendered inside the frame, between the title/description block and the StatusTabs/FilterBar. Compose with `<KpiTile>` from `primitives/dashboard`. */
  kpiTiles?: ReactNode;
  tabs?: StatusTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  showCommandHint?: boolean;
  filters?: ReactNode;
  onClearFilters?: () => void;
  onColumnsClick?: () => void;
  onExportClick?: () => void;
  columns: TableHeaderColumn[];
  rows: DataTableRow[];
  variant?: DataTableVariant;
  /** Custom copy for the `empty` variant — forwarded to DataTable (additive, 2026-06-11). */
  emptyText?: string;
  emptySubtext?: string;
  /** Custom copy for the `no-results` variant — forwarded to DataTable (additive, 2026-06-11). */
  noResultsText?: string;
  noResultsSubtext?: string;
  density?: DataRowDensity;
  selectable?: boolean;
  selectState?: 'none' | 'some' | 'all';
  onSelectAllChange?: (checked: boolean) => void;
  onRowSelectedChange?: (id: string | number | undefined, checked: boolean) => void;
  onSort?: (key: string) => void;
  mobileBody?: ReactNode;
  /** Optional inline row-expand renderer — forwarded to DataTable. Caller
   *  flips `row.expanded` to toggle. Pattern adopted by JLTT/GW/OT tables. */
  renderExpanded?: (row: DataTableRow) => ReactNode;
  page: number;
  totalPages: number;
  totalItems: number;
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (n: number) => void;
  /** False by default — render both inline desktop button AND mobile FloatingCTA. */
  floatingCTAOnly?: boolean;
  /** `data-testid` forwarded to DataTable shell — e.g. "quotations-table-body". */
  tableTestId?: string;
  /** `data-testid` forwarded to FilterBar's <input> — e.g. "quotations-search-input". */
  searchTestId?: string;
  /** `data-testid` forwarded to the FilterBar's Export icon button. */
  exportTestId?: string;
  /** `data-testid` forwarded to the FilterBar's Columns icon button. */
  columnsTestId?: string;
  /**
   * `data-testid` shared by the inline desktop primary-action button AND the
   * mobile FloatingCTA. Both are always in the DOM (one hidden per viewport), so
   * a bare `getByTestId(primaryActionTestId)` resolves to TWO nodes — tests must
   * target the visible one (`[data-testid="…"]:visible` or
   * `.filter({ visible: true }).first()`).
   */
  primaryActionTestId?: string;
  /** `data-testid` forwarded to the FilterBar's "Clear" button (rendered when `onClearFilters` set). */
  clearFiltersTestId?: string;
}

export function ListPageFrame({
  title, description, primaryAction,
  kpiTiles,
  tabs, activeTab, onTabChange,
  searchQuery, onSearchChange, searchPlaceholder, showCommandHint,
  filters, onClearFilters, onColumnsClick, onExportClick,
  columns, rows, variant = 'default', density = 'compact',
  emptyText, emptySubtext, noResultsText, noResultsSubtext,
  selectable = true, selectState = 'none', onSelectAllChange, onRowSelectedChange, onSort,
  mobileBody, renderExpanded,
  page, totalPages, totalItems, rowsPerPage, rowsPerPageOptions, onPageChange, onRowsPerPageChange,
  floatingCTAOnly = false,
  tableTestId,
  searchTestId,
  exportTestId,
  columnsTestId,
  primaryActionTestId,
  clearFiltersTestId,
  banner,
}: ListPageFrameProps) {
  const chrome = useDashboardChrome();
  const breadcrumb: BreadcrumbSegment[] = [{ label: 'Workspace', href: '/dashboard' }, { label: title }];

  const pageSize = rowsPerPage ?? 100;
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg, #f4f4f5)' }}>
      <AppHeader breadcrumb={breadcrumb} {...chrome.appHeaderProps} />
      {chrome.impersonation.active && <ImpersonationBanner {...chrome.impersonation.props} />}

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-6">
          <PageTitle>{title}</PageTitle>
          {description && <PageDescription>{description}</PageDescription>}
        </div>

        {banner && <div className="mb-6">{banner}</div>}

        {kpiTiles && (
          <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpiTiles}
          </div>
        )}

        {tabs && tabs.length > 0 && activeTab && onTabChange && (
          <StatusTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} className="mb-4" />
        )}

        <div className="mb-4 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <FilterBar
              query={searchQuery}
              onQueryChange={onSearchChange}
              searchPlaceholder={searchPlaceholder}
              showCommandHint={showCommandHint}
              filters={filters}
              onClearFilters={onClearFilters}
              onColumnsClick={onColumnsClick}
              onExportClick={onExportClick}
              searchTestId={searchTestId}
              exportTestId={exportTestId}
              columnsTestId={columnsTestId}
              clearFiltersTestId={clearFiltersTestId}
            />
          </div>
          {primaryAction && !floatingCTAOnly && (
            <Button
              variant="primary"
              size="md"
              onClick={primaryAction.onClick}
              leadingIcon={primaryAction.icon ?? <Plus className="w-3.5 h-3.5" strokeWidth={1.8} />}
              className="hidden md:inline-flex shrink-0 px-3.5 text-[13px]"
              data-testid={primaryActionTestId}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>

        <DataTable
          density={density}
          variant={variant}
          emptyText={emptyText}
          emptySubtext={emptySubtext}
          noResultsText={noResultsText}
          noResultsSubtext={noResultsSubtext}
          columns={columns}
          rows={rows}
          selectable={selectable}
          selectState={selectState}
          onSelectAllChange={onSelectAllChange}
          onRowSelectedChange={onRowSelectedChange}
          onSort={onSort}
          mobileBody={mobileBody}
          renderExpanded={renderExpanded}
          testId={tableTestId}
          pagination={
            <Pagination
              page={page}
              totalPages={totalPages}
              from={from}
              to={to}
              total={totalItems}
              onPageChange={onPageChange}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={rowsPerPageOptions}
              onRowsPerPageChange={onRowsPerPageChange}
            />
          }
        />

        {primaryAction && (
          <div className="fixed bottom-4 right-4 z-20 md:hidden">
            <FloatingCTA
              label={primaryAction.label}
              onClick={primaryAction.onClick}
              circle
              data-testid={primaryActionTestId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
