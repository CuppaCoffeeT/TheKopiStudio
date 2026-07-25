/**
 * /dashboard — the Kopi 2a "Overview" (KOPI_STUDIO_REDESIGN_PRD P4).
 *
 * Top to bottom, per the 2a comp's dashboard mockup: the dateline masthead
 * (uppercase kicker carrying one live stat, over the Instrument Serif greeting,
 * closed by a hairline) → the index-numeral KPI cards → the "Latest additions"
 * serif section head with the brown `+ New client` CTA → the hairline feed
 * table, no card wrapper.
 *
 * The module-launcher grid is GONE (user decision, 2026-07-25): the sidebar
 * rail and the ⌘K palette both route by module, so a third launcher was pure
 * duplication. `ModuleCard` / `ModuleSearch` / `CategoryHeader` went with it.
 *
 * Everything on the page is live, RLS-scoped data — the book is empty until
 * the CRM import lands, so each surface has a real empty state instead of
 * sample rows, never a placeholder zero. Each KPI figure carries its own
 * query's loading skeleton and quiet retry line (`OverviewKpiRow`).
 *
 * ONE derived set of held record modules drives the whole page, owned by
 * `useLatestAdditions`: `hasClients` / `hasResults` / `hasSource`, over
 * `/clients` + `/profiler-results` — the only modules that own rows this page
 * lists. The KPI cards, the stats query, the dateline's stat clause, the feed
 * and the nothing-granted line all read that one set, so a populated card can
 * never sit above copy saying nothing is granted. `/crm` is NOT in the set: it
 * grants aggregate figures on its own dashboard, not records here.
 *
 * Testid contract (tests/workflows/crm/dashboard.spec.ts): `home-kpi-row` with
 * `home-kpi-profiler` / `home-kpi-clients` tiles, `home-latest-additions` with
 * `home-latest-row-<id>` rows and `home-latest-empty`, `home-add-client-btn`.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/primitives/shell';
import { GreetingHeader } from '@/components/primitives/dashboard';
import { getSingaporeGreeting } from '@/utils/dashboardHelpers';
import { formatCurrency } from '@/utils/currencyHelper';
import { LatestAdditionsTable } from '../components/LatestAdditionsTable';
import { OverviewKpiRow, type OverviewKpiCard } from '../components/OverviewKpiRow';
import { ClientFormModal } from '../components/modals/ClientFormModal';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useLatestAdditions } from '../hooks/useLatestAdditions';

/** The comp shows a short "top of the book" feed, not a paginated list. */
const FEED_ROWS = 6;

const EM_DASH = '—';

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const { timeOfDay, dateText } = getSingaporeGreeting();

  // The single derived set of held record modules — see the file docblock.
  const feed = useLatestAdditions(FEED_ROWS);
  const statsQuery = useDashboardStats(feed.hasClients);
  const stats = statsQuery.data;

  // Cards are collected in render order; OverviewKpiRow numbers them.
  const cards: OverviewKpiCard[] = [];

  if (feed.hasResults) {
    const count = feed.resultCount;
    cards.push({
      tile: {
        label: 'Prospect Profiler',
        value: count === null ? EM_DASH : count.toLocaleString('en-SG'),
        unit: count === null ? undefined : plural(count, 'profile saved', 'profiles saved'),
        meta: feed.newestResult
          ? `Newest: ${feed.newestResult.name} · ${feed.newestResult.addedLabel}`
          : count === 0
            ? 'No profiles saved yet — run one from the profiler wizard.'
            : undefined,
        onClick: () => navigate('/profiler-results'),
        testId: 'home-kpi-profiler',
      },
      isLoading: feed.resultsStatus.isLoading,
      isError: feed.resultsStatus.isError,
      onRetry: feed.resultsStatus.refetch,
    });
  }

  if (feed.hasClients) {
    cards.push({
      tile: {
        label: 'Clients · CRM',
        value: stats ? stats.totalClients.toLocaleString('en-SG') : EM_DASH,
        unit: stats ? plural(stats.totalClients, 'client', 'clients') : undefined,
        meta: !stats
          ? undefined
          : stats.totalClients === 0
            ? 'No clients yet — add your first to open the book.'
            : `${stats.activePolicies} ${plural(stats.activePolicies, 'active policy', 'active policies')} · ${formatCurrency(stats.totalAnnualPremium)} annual premium`,
        onClick: () => navigate('/clients'),
        testId: 'home-kpi-clients',
      },
      isLoading: statsQuery.isLoading,
      isError: statsQuery.isError,
      onRetry: () => void statsQuery.refetch(),
    });
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 sm:px-10 sm:py-[34px]">
      <div className="mx-auto max-w-5xl">
        <GreetingHeader
          className="mb-[26px]"
          name={profile?.name || user?.email?.split('@')[0] || 'there'}
          dateText={dateText}
          timeOfDay={timeOfDay}
          contextStat={
            stats
              ? `${stats.upcomingFollowUps} ${plural(stats.upcomingFollowUps, 'follow-up', 'follow-ups')} upcoming`
              : undefined
          }
        />

        <OverviewKpiRow cards={cards} />

        {feed.hasSource ? (
          <section aria-labelledby="home-latest-heading">
            <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2.5">
              <h2
                id="home-latest-heading"
                className="text-[22px] leading-tight text-foreground"
                style={{ fontFamily: 'var(--font-pixel)' }}
              >
                Latest additions
              </h2>
              {feed.hasClients && (
                <Button
                  className="flex-none pointer-coarse:min-h-11"
                  onClick={() => setAddOpen(true)}
                  data-testid="home-add-client-btn"
                >
                  + New client
                </Button>
              )}
            </div>

            <LatestAdditionsTable
              testId="home-latest-additions"
              rows={feed.rows}
              isLoading={feed.isLoading}
              isError={feed.isError}
              onRetry={feed.refetch}
              onOpen={(row) => navigate(row.href)}
              emptyAction={
                feed.hasClients ? (
                  <Button
                    variant="outline"
                    className="pointer-coarse:min-h-11"
                    onClick={() => navigate('/clients')}
                  >
                    Go to clients
                  </Button>
                ) : undefined
              }
            />
          </section>
        ) : (
          <p className="text-[13px] leading-[1.6] text-[color:var(--fg-dim)]">
            No record modules are granted to your account yet, so there is nothing to list here. An
            administrator can grant them from Manage accounts.
          </p>
        )}
      </div>

      {feed.hasClients && <ClientFormModal open={addOpen} onOpenChange={setAddOpen} />}
    </div>
  );
}
