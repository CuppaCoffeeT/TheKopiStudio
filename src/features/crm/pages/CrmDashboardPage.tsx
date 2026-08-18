/**
 * CrmDashboardPage — book-at-a-glance KPIs (DASHBOARD archetype, route /crm).
 *
 * Four KpiTiles from `useDashboardStats` (RLS-scoped to the viewer's book).
 * The "Annual premium" tile is the CORRECT annualised figure (frequency
 * multiplier + ILP inclusion percent) — a documented divergence from the
 * mislabeled legacy raw sum (CRM_MODULE_PRD.md research findings). An empty
 * book swaps the quick-link cards for an "Add your first client" CTA; a
 * non-empty book shows two quick actions — the client book and the
 * /crm-reports portfolio report (REPORTS_LINK_PRD.md P3).
 *
 * PRIVACY (2026-08-18): three of the four figures are masked by default —
 * total clients, active policies and annual premium all size the book, which is
 * commercially sensitive over a shoulder. "Upcoming follow-ups" is NOT masked:
 * it says how much work is due, not how much business there is, and hiding the
 * one actionable number on the page would be masking for the sake of it. Every
 * LABEL and subtitle stays readable — the eye hides values, never wayfinding.
 * The eye itself is in the app chrome (rail footer / mobile bar), because one
 * switch governing five surfaces should have one control.
 */

import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  Contact,
  FileText,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AppHeaderShell } from '@/components/primitives/shell/AppHeaderShell';
import { Button } from '@/components/primitives/shell/Button';
import { Card, CardDescription, CardTitle } from '@/components/primitives/shell/Card';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { KpiTile } from '@/components/primitives/dashboard/KpiTile';
import { useMask } from '@/contexts/MaskContext';
import { describeIlpExclusion } from '../lib/ilpExclusion';
import { useDashboardStats } from '../hooks/useDashboardStats';
import type { CrmDashboardStats } from '../types';

function KpiGrid({
  stats,
  masked,
  onClientsClick,
}: {
  stats: CrmDashboardStats;
  masked: boolean;
  onClientsClick: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        label="Total clients"
        value={stats.totalClients}
        icon={Users}
        subtitle="Clients in your book"
        masked={masked}
        onClick={onClientsClick}
        testId="crm-kpi-total-clients"
      />
      <KpiTile
        label="Active policies"
        value={stats.activePolicies}
        icon={ShieldCheck}
        subtitle="Policies with Active status"
        masked={masked}
        testId="crm-kpi-active-policies"
      />
      <KpiTile
        label="Annual premium"
        value={stats.totalAnnualPremium}
        prefix="$"
        icon={Wallet}
        // The subtitle NAMES what the figure left out when the ILP rule
        // dropped something (lib/ilpExclusion). Silence there is what makes a
        // correct total read as a wrong one.
        subtitle={
          stats.excludedIlp.count > 0
            ? `Annualised across the book · ${describeIlpExclusion(stats.excludedIlp)}`
            : 'Annualised across the book'
        }
        masked={masked}
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
    <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
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

interface QuickLinkCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onOpen: () => void;
  testId: string;
}

/** Quick-action card — keyboard-activatable navigation shortcut. */
function QuickLinkCard({ icon: Icon, title, description, onOpen, testId }: QuickLinkCardProps) {
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
      className="flex min-h-[44px] items-center justify-between gap-4 active:translate-y-0 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      data-testid={testId}
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
        <span>
          <CardTitle as="h2">{title}</CardTitle>
          <CardDescription className="mt-0.5">{description}</CardDescription>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
    </Card>
  );
}

export default function CrmDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();
  const { masked } = useMask();
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
          variant="compact"
          subhead="The dashboard stats didn't load."
          body="Your book could not be read. Check your connection and retry."
          onRetry={() => refetch()}
        />
      )}

      {stats && (
        <div className="space-y-6">
          <KpiGrid stats={stats} masked={masked} onClientsClick={goToClients} />
          {stats.totalClients === 0 ? (
            <EmptyBookCard onAddClick={goToClients} />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <QuickLinkCard
                icon={Contact}
                title="Clients"
                description="Open the client book — search, reviews, policies and balances."
                onOpen={goToClients}
                testId="crm-quick-link-clients"
              />
              <QuickLinkCard
                icon={FileText}
                title="Generate portfolio report"
                description="Book-wide financial summary — stats, annualised premiums and per-client policies, print-ready."
                onOpen={() => navigate('/crm-reports')}
                testId="crm-quick-link-portfolio-report"
              />
            </div>
          )}
        </div>
      )}
    </AppHeaderShell>
  );
}
