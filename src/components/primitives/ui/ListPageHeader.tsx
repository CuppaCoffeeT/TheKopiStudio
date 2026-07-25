/**
 * ListPageHeader — the 2a "Kopi House" list masthead.
 *
 * Spec: docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md
 *   → "Archetype — list", header block.
 * Comp: `Kopi Studio Directions.dc.html` option 2a, card [1] "List — CRM clients".
 *
 * One baseline-aligned flex row closed by a `--border-soft` hairline: on the
 * left an uppercase kicker over the serif title with the row count inline; on
 * the right the search field and the brown primary CTA. The controls sit ON the
 * title row — 2a has no separate toolbar strip beneath it.
 *
 * Kicker colour is `--fg-dim`, not `--fg-muted`: this block renders on the page
 * cream where `#7d6b5b` measures 4.12:1 and fails AA at 11px.
 *
 * Extracted from `ListPageFrame` (2026-07-25) to keep both files inside the
 * 200-line ratchet ceiling.
 */

import { type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';
import { SearchInput } from '@/components/primitives/shell/SearchInput';
import { PageTitle } from '@/components/primitives/shell/PageTitle';
import { PageDescription } from '@/components/primitives/shell/PageDescription';

export interface ListPageHeaderProps {
  /** Uppercase kicker above the title — "Clients · CRM". Omitted when unset. */
  kicker?: string;
  title: string;
  description?: string;
  /** Inline row count beside the title. Omit while the count is unknown. */
  count?: ReactNode;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  searchTestId?: string;
  showCommandHint?: boolean;
  primaryAction?: { label: string; onClick: () => void; icon?: ReactNode };
  primaryActionTestId?: string;
  /** False when the page defers the CTA to the mobile FloatingCTA only. */
  showPrimaryAction?: boolean;
}

export function ListPageHeader({
  kicker,
  title,
  description,
  count,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  searchTestId,
  showCommandHint,
  primaryAction,
  primaryActionTestId,
  showPrimaryAction = true,
}: ListPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-5 gap-y-4 border-b border-[color:var(--border-soft)] pb-4">
      <div className="min-w-0">
        {kicker && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--fg-dim)]">
            {kicker}
          </div>
        )}
        <PageTitle className={kicker ? 'mt-1.5' : undefined} count={count}>
          {title}
        </PageTitle>
        {description && <PageDescription>{description}</PageDescription>}
      </div>

      <div className="flex w-full items-center gap-2.5 sm:w-auto sm:shrink-0">
        <SearchInput
          query={searchQuery}
          onQueryChange={onSearchChange}
          placeholder={searchPlaceholder}
          size="md"
          showKbd={showCommandHint}
          clearable={false}
          inputTestId={searchTestId}
          className="w-[220px] max-w-full flex-1 sm:flex-none"
        />
        {primaryAction && showPrimaryAction && (
          <Button
            variant="primary"
            size="md"
            onClick={primaryAction.onClick}
            leadingIcon={primaryAction.icon ?? <Plus className="w-3.5 h-3.5" strokeWidth={1.8} />}
            className="hidden shrink-0 md:inline-flex"
            data-testid={primaryActionTestId}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </header>
  );
}
