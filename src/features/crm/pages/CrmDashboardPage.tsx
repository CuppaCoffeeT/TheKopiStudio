/**
 * CrmDashboardPage — book-at-a-glance KPIs (DASHBOARD archetype, route /crm).
 *
 * P1 scaffold: real AppHeaderShell frame + the four KpiTiles on a typed
 * empty-stats object (all zeros — the live tables are empty until the data
 * import lands). P3 replaces EMPTY_STATS with the crmDashboard stats hook;
 * the "annual premium" tile uses the CORRECT annualised formula, not the
 * mislabeled legacy raw sum (CRM_MODULE_PRD.md research findings).
 */

import { useNavigate } from 'react-router-dom';
import { CalendarClock, ShieldCheck, Users, Wallet } from 'lucide-react';
import { AppHeaderShell } from '@/components/primitives/shell/AppHeaderShell';
import { KpiTile } from '@/components/primitives/dashboard/KpiTile';
import type { CrmDashboardStats } from '../types';

/** Zero-state shown until the P3 stats hook lands (book is empty pre-import). */
const EMPTY_STATS: CrmDashboardStats = {
  totalClients: 0,
  activePolicies: 0,
  totalAnnualPremium: 0,
  upcomingFollowUps: 0,
};

export default function CrmDashboardPage() {
  const navigate = useNavigate();
  const stats = EMPTY_STATS;

  return (
    <AppHeaderShell
      title="CRM Dashboard"
      description="Your book at a glance — clients, policies, premiums and follow-ups."
      testId="crm-dashboard"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Total clients"
          value={stats.totalClients}
          icon={Users}
          subtitle="Clients in your book"
          onClick={() => navigate('/clients')}
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
    </AppHeaderShell>
  );
}
