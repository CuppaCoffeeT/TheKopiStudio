/**
 * CrmKpiGrid — the four book-at-a-glance figures on `/crm`.
 *
 * Split from `CrmDashboardPage` so the page owns loading / error / empty-book
 * branching and this owns the tiles.
 *
 * THREE OF THE FOUR ARE MASKED by the privacy eye — total clients, active
 * policies and annual premium all size the book, which is commercially
 * sensitive over a shoulder. "Upcoming follow-ups" is NOT: it says how much
 * work is due, not how much business there is, and hiding the one actionable
 * number would be masking for its own sake. Every LABEL and subtitle stays
 * readable — the eye hides values, never wayfinding.
 *
 * The premium tile's subtitle NAMES what the figure left out when the ILP rule
 * dropped a policy (`lib/ilpExclusion`). Silence there is what made a correct
 * total read as a wrong one — see docs/06-operations/CRM_FIGURE_PROVENANCE.md.
 */

import { CalendarClock, ShieldCheck, Users, Wallet } from 'lucide-react';
import { KpiTile } from '@/components/primitives/dashboard/KpiTile';
import { describeIlpExclusion } from '../lib/ilpExclusion';
import type { CrmDashboardStats } from '../types';

export function CrmKpiGrid({
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
