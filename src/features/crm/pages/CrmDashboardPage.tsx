/**
 * CrmDashboardPage — book-at-a-glance KPIs (DASHBOARD archetype, route /crm).
 *
 * Four KpiTiles from `useDashboardStats` (RLS-scoped to the viewer's book).
 * The "Annual premium" tile is the CORRECT annualised figure (frequency
 * multiplier + ILP inclusion percent) — a documented divergence from the
 * mislabeled legacy raw sum (CRM_MODULE_PRD.md research findings). An empty
 * book swaps the quick-link card for an "Add your first client" CTA; the
 * portfolio-report quick action belongs to the NEXT PRD and is omitted.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, Contact, ShieldCheck, Users, Wallet } from 'lucide-react';
import { AppHeaderShell } from '@/components/primitives/shell/AppHeaderShell';
import { Button } from '@/components/primitives/shell/Button';
import { Card, CardDescription, CardTitle } from '@/components/primitives/shell/Card';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { KpiTile } from '@/components/primitives/dashboard/KpiTile';
import { useDashboardStats } from '../hooks/useDashboardStats';
import type { CrmDashboardStats } from '../types';

function KpiGrid({ stats, onClientsClick }: { stats: CrmDashboardStats; onClientsClick: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        label="Total clients"
        value={stats.totalClients}
        icon={Users}
        subtitle="Clients in your book"
        onClick={onClientsClick}
        testId="crm-kpi-total-clients"
      />
      <KpiTile
        label="Active policies"
        value={stats.activePolicies}
        icon={ShieldCheck}
        subtitle="Policies with Active status"
        testId="crm-kpi-active-policies"
      />
      <KpiTile
        label="Annual premium"
        value={stats.totalAnnualPremium}
        prefix="$"
        icon={Wallet}
        subtitle="Annualised across the book"
        testId="crm-kpi-annual-premium"
      />
      <KpiTile
        label="Upcoming follow-ups"
        value={stats.upcomingFollowUps}
        icon={CalendarClock}
        subtitle="Scheduled after today"
        testId="crm-kpi-upcoming-follow-ups"
      />
    </div>
  );
}

/** Empty book — the import has not landed yet, or the advisor is starting fresh. */
function EmptyBookCard({ onAddClick }: { onAddClick: () => void }) {
  return (
    <Card className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle as="h2">No clients yet</CardTitle>
        <CardDescription className="mt-1.5">
          Your book is empty — add your first client to start tracking policies, reviews and
          balances. The CRM data import will also populate it once it lands.
        </CardDescription>
      </div>
      <Button
        variant="primary"
        size="lg"
        onClick={onAddClick}
        leadingIcon={<Contact className="h-4 w-4" strokeWidth={1.8} />}
        className="shrink-0"
        data-testid="crm-add-first-client-btn"
      >
        Go to clients
      </Button>
    </Card>
  );
}

/** Quick link into the client book (LIST page owns search/CRUD). */
function ClientsQuickLinkCard({ onOpen }: { onOpen: () => void }) {
  return (
    <Card
      interactive
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className="mt-6 flex min-h-[44px] items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
      data-testid="crm-quick-link-clients"
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <Contact className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
        <span>
          <CardTitle as="h2">Clients</CardTitle>
          <CardDescription className="mt-0.5">
            Open the client book — search, reviews, policies and balances.
          </CardDescription>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.8} />
    </Card>
  );
}

export default function CrmDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();
  const goToClients = () => navigate('/clients');

  return (
    <AppHeaderShell
      title="CRM Dashboard"
      description="Your book at a glance — clients, policies, premiums and follow-ups."
      testId="crm-dashboard"
    >
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="crm-dashboard-loading">
          {['clients', 'policies', 'premium', 'follow-ups'].map((key) => (
            <LoadingSkeleton key={key} variant="kpi-tile" className="w-full" />
          ))}
        </div>
      )}

      {isError && !stats && (
        <ErrorState
          subhead="STATS UNAVAILABLE"
          body="The dashboard stats could not be loaded. Check your connection and retry."
          path="/crm"
          onRetry={() => refetch()}
        />
      )}

      {stats && (
        <>
          <KpiGrid stats={stats} onClientsClick={goToClients} />
          {stats.totalClients === 0 ? (
            <EmptyBookCard onAddClick={goToClients} />
          ) : (
            <ClientsQuickLinkCard onOpen={goToClients} />
          )}
        </>
      )}
    </AppHeaderShell>
  );
}
