/**
 * ListPageFrame — Lego-assembly frame for every list archetype page.
 *
 * Composes ImpersonationBanner + ListPageHeader (kicker · title · count ·
 *   search · primary CTA) + StatusTabs + FilterBar (filters only) +
 *   ListPageTable (bare DataTable + Pagination) + FloatingCTA (mobile).
 *
 * Spec: docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md
 * Comp: `Kopi Studio Directions.dc.html` option 2a, card [1] "List — CRM clients".
 * Adopters: ClientsListPage · ResultsListPage · ManageAccountsPage (DESIGN_CATALOG.md).
 *
 * 2026-07-25 (2a "Kopi House"): no top bar. `AppSidebar` carries identity, nav
 * and account at >= lg; `AppHeaderMobileBar` stands in below that. No inline
 * breadcrumb either — the 2a List comp opens straight on kicker + title — so
 * the trail is built here only to label the mobile bar.
 *
 * Also 2a: search + CTA moved ON to the title row (FilterBar keeps only the
 * filter popovers and the columns/export/clear controls, and is skipped when
 * there are none), and the table lost its card wrapper so the rows sit straight
 * on the page cream.
 *
 * Chrome plumbing (user/impersonation/sign-out) delegated to `useDashboardChrome`.
 *
 * `floatingCTAOnly=false` (default) renders BOTH an inline desktop primary button
 * next to the H1 AND a mobile FloatingCTA — per archetypes/list.md responsive split.
 */

import { type ReactNode } from 'react';
import { useDashboardChrome } from '@/hooks/useDashboardChrome';
import { AppHeaderMobileBar } from '@/components/primitives/shell/AppHeaderMobileBar';
import { ImpersonationBanner } from '@/components/primitives/shell/ImpersonationBanner';
import { FilterBar } from '@/components/primitives/shell/FilterBar';
import { FloatingCTA } from '@/components/primitives/shell/FloatingCTA';
import { ViewAsSelector } from '@/components/primitives/shell/ViewAsSelector';
import { type BreadcrumbSegment } from '@/components/primitives/shell/Breadcrumb';
import { type DataTableStateAction } from './DataTable';
import { ListPageHeader } from './ListPageHeader';
import { ListPageTable, type ListPageTableProps } from './ListPageTable';
import { StatusTabs, type StatusTab } from './StatusTabs';

export interface ListPageFrameProps extends ListPageTableProps {
  title: string;
  /** Uppercase kicker above the title (2a) — e.g. "Clients · CRM". */
  kicker?: string;
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
  /** False by default — render both inline desktop button AND mobile FloatingCTA. */
  floatingCTAOnly?: boolean;
  /** `data-testid` forwarded to the title-row search `<input>` — e.g. "quotations-search-input". */
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

export function ListPageFrame(props: ListPageFrameProps) {
  const {
    title, kicker, description, primaryAction, banner, kpiTiles,
    tabs, activeTab, onTabChange,
    searchQuery, onSearchChange, searchPlaceholder, showCommandHint,
    filters, onClearFilters, onColumnsClick, onExportClick,
    variant = 'default', totalItems, floatingCTAOnly = false,
    searchTestId, exportTestId, columnsTestId, primaryActionTestId, clearFiltersTestId,
  } = props;
  const chrome = useDashboardChrome();
  const breadcrumb: BreadcrumbSegment[] = [{ label: 'Workspace', href: '/dashboard' }, { label: title }];

  // The inline count is a fact about the loaded page — suppress it while the
  // count is still unknown rather than flashing a "0".
  const countKnown = variant !== 'loading' && variant !== 'error';
  // FilterBar now carries only the filter popovers + columns/export/clear;
  // search lives on the title row, so an otherwise-empty bar is not rendered.
  const hasFilterRow = !!(filters || onClearFilters || onColumnsClick || onExportClick);
  // 2a allows exactly ONE quiet action per state: undo the search that found
  // nothing, or — on a genuinely empty list — the page's own create action.
  const stateAction: DataTableStateAction | undefined =
    variant === 'no-results' && onClearFilters
      ? { label: 'Clear search', onClick: onClearFilters }
      : variant === 'empty' && primaryAction
        ? { label: primaryAction.label, onClick: primaryAction.onClick }
        : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeaderMobileBar
        breadcrumb={breadcrumb}
        {...chrome.user}
        viewAsSlot={<ViewAsSelector {...chrome.viewAs} />}
        onSignOut={chrome.onSignOut}
      />
      {chrome.impersonation.active && <ImpersonationBanner {...chrome.impersonation.props} />}

      <div className="max-w-8xl mx-auto px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        {/* Entrance stagger (2026-08-05 motion pass): header → chrome → table,
            ~70ms apart, once per mount. Collapsed by prefers-reduced-motion. */}
        <div className="motion-rise">
        <ListPageHeader
          kicker={kicker}
          title={title}
          description={description}
          count={countKnown ? totalItems.toLocaleString('en-SG') : undefined}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          searchTestId={searchTestId}
          showCommandHint={showCommandHint}
          primaryAction={primaryAction}
          primaryActionTestId={primaryActionTestId}
          showPrimaryAction={!floatingCTAOnly}
        />
        </div>

        {banner && <div className="mb-8 motion-rise motion-rise-2">{banner}</div>}

        {kpiTiles && (
          <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 motion-rise motion-rise-2">
            {kpiTiles}
          </div>
        )}

        {tabs && tabs.length > 0 && activeTab && onTabChange && (
          <StatusTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} className="mb-5 motion-rise motion-rise-3" />
        )}

        {hasFilterRow && (
          <FilterBar
            className="mb-5 motion-rise motion-rise-3"
            showSearch={false}
            query={searchQuery}
            onQueryChange={onSearchChange}
            filters={filters}
            onClearFilters={onClearFilters}
            onColumnsClick={onColumnsClick}
            onExportClick={onExportClick}
            exportTestId={exportTestId}
            columnsTestId={columnsTestId}
            clearFiltersTestId={clearFiltersTestId}
          />
        )}

        <div className="motion-rise motion-rise-4">
          <ListPageTable {...props} stateAction={stateAction} />
        </div>

        {primaryAction && (
          <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-20 md:hidden">
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
