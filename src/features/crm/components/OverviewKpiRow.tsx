/**
 * OverviewKpiRow — the /dashboard Overview's index-numeral KPI row (KOPI_STUDIO_
 * REDESIGN_PRD P4).
 *
 * Each card renders ONE figure from ONE query, so each carries that query's own
 * state: a skeleton while the figure is in flight, and — per KOPI_2A_SPEC →
 * "States → Error" — a quiet row-level failure line plus a single Retry action
 * when it fails. Never a card-flooding panel: the tile keeps its hairline border
 * and card cream, and only the 12.5px meta line turns terracotta
 * (`--negative-text`, the AA variant the raw hue fails at this size).
 *
 * The split is load-bearing, not decoration (2026-07-14 critic blocker, logged
 * in INSURANCE_CRM_REDESIGN_PRD; re-broken by the 2a rebuild and re-fixed
 * 2026-07-25): a figure that fell back to an em dash on BOTH pending and failed
 * made a dead query indistinguishable from a slow one, and offered no way back.
 *
 * A failed tile also drops its `onClick`. An errored card offers exactly one
 * action — Retry — and a nested control inside a `role="button"` tile would
 * otherwise swallow that click into a navigation.
 *
 * Index numerals are POSITIONAL and assigned HERE, over the cards the caller
 * actually passed, so a viewer holding one record module gets "01", never a gap.
 */

import { KpiIndexCard, type KpiIndexCardProps } from '@/components/primitives/dashboard';
import { Button, LoadingSkeleton } from '@/components/primitives/shell';

const EM_DASH = '—';

export interface OverviewKpiCard {
  /** What the tile renders once its query has resolved. */
  tile: Omit<KpiIndexCardProps, 'index'>;
  /** That figure's query is in flight — the slot renders a skeleton. */
  isLoading: boolean;
  /** That figure's query failed — the slot renders the quiet retry line. */
  isError: boolean;
  onRetry: () => void;
}

/** Short line + one action, sized to the meta slot it replaces. */
function KpiRetryLine({ onRetry }: { onRetry: () => void }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1.5">
      <span className="text-[color:var(--negative-text)]">Couldn&rsquo;t load this figure.</span>
      <Button
        variant="ghost"
        size="xs"
        onClick={onRetry}
        className="h-auto px-1.5 py-0.5 text-[12.5px] font-semibold text-[color:var(--brown-text)] underline underline-offset-2 hover:bg-[color:var(--row-hover)] hover:text-[color:var(--brown-text-on-wash)] pointer-coarse:min-h-11"
      >
        Retry
      </Button>
    </span>
  );
}

export function OverviewKpiRow({ cards }: { cards: readonly OverviewKpiCard[] }) {
  if (cards.length === 0) return null;

  return (
    <div
      data-testid="home-kpi-row"
      className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2"
    >
      {cards.map(({ tile, isLoading, isError, onRetry }, position) => {
        if (isLoading) {
          return (
            <LoadingSkeleton
              key={tile.label}
              variant="kpi-tile"
              className="w-full rounded-[var(--card-radius)]"
            />
          );
        }

        const index = String(position + 1).padStart(2, '0');
        if (isError) {
          return (
            <KpiIndexCard
              key={tile.label}
              {...tile}
              index={index}
              value={EM_DASH}
              unit={undefined}
              onClick={undefined}
              meta={<KpiRetryLine onRetry={onRetry} />}
            />
          );
        }

        return <KpiIndexCard key={tile.label} {...tile} index={index} />;
      })}
    </div>
  );
}
