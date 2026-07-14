/**
 * /dashboard home — module launcher + CRM widgets (INSURANCE_CRM_REDESIGN_PRD P3).
 *
 * Composition: GreetingHeader hero · ModuleSearch filter · CategoryHeader
 * sections of ModuleCards from `useAuth().modules` (the /dashboard card itself
 * is filtered out) · KPI row (only when the user holds the /crm module) ·
 * client-progress widget (only with /clients or /crm) — derived completeness %
 * per client + "Profiled" badge from one batched `results.client_id` lookup.
 *
 * Testid contract (tests/workflows/crm/dashboard.spec.ts): the grid keeps
 * data-testid="home-module-grid" and each card "home-module-tile-<path>".
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Banknote, CalendarClock, ChevronRight, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorage } from '@/utils/authStorage';
import { showError, showSuccess } from '@/utils/toastHelper';
import { queryKeys } from '@/utils/queryKeys';
import { getModuleIcon } from '@/lib/iconLookup';
import { getCurrentSingaporeTime } from '@/utils/timezoneUtils';
import { getFormattedDate, groupModulesByCategory } from '@/utils/dashboardHelpers';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  LoadingSkeleton,
  NoResultsState,
} from '@/components/primitives/shell';
import {
  CategoryHeader,
  GreetingHeader,
  KpiTile,
  ModuleCard,
  ModuleSearch,
} from '@/components/primitives/dashboard';
import { Progress } from '@/components/primitives/form';
import { getProfiledClientIds } from '../api/linkedResultsService';
import { useClientsList } from '../hooks/useClientsList';
import { useDashboardStats } from '../hooks/useDashboardStats';
import type { ClientRow } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeOfDayInSingapore(): 'morning' | 'afternoon' | 'evening' {
  const hour = getCurrentSingaporeTime().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

/**
 * Key profile fields for the completeness bar (PRD Resolved Decision #3):
 * % non-empty over name / email / phone / DOB / occupation / annual income /
 * risk profile + the two review dates. Raw row values (not `clientFromRow`)
 * so mapper defaults like 'Moderate' don't inflate the score.
 */
const COMPLETENESS_FIELDS = [
  'name',
  'email',
  'phone',
  'date_of_birth',
  'occupation',
  'annual_income',
  'risk_profile',
  'last_review_date',
  'next_review_date',
] as const satisfies readonly (keyof ClientRow)[];

function clientCompleteness(row: ClientRow): number {
  const filled = COMPLETENESS_FIELDS.filter((field) => {
    const value = row[field];
    return value != null && String(value).trim() !== '';
  }).length;
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

/** Widget page size — a bounded "top of the book" list, newest first. */
const PROGRESS_WIDGET_ROWS = 8;

// ---------------------------------------------------------------------------
// KPI row (gated on /crm module)
// ---------------------------------------------------------------------------

function CrmKpiRow() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {['clients', 'policies', 'premium', 'follow-ups'].map((key) => (
          <LoadingSkeleton key={key} variant="kpi-tile" className="w-full" />
        ))}
      </div>
    );
  }
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="home-kpi-row">
      <KpiTile label="Total clients" value={stats.totalClients} icon={Users} testId="home-kpi-total-clients" />
      <KpiTile
        label="Active policies"
        value={stats.activePolicies}
        icon={ShieldCheck}
        testId="home-kpi-active-policies"
      />
      <KpiTile
        label="Annual premium"
        value={stats.totalAnnualPremium}
        prefix="$"
        icon={Banknote}
        testId="home-kpi-annual-premium"
      />
      <KpiTile
        label="Upcoming follow-ups"
        value={stats.upcomingFollowUps}
        icon={CalendarClock}
        alert={stats.upcomingFollowUps > 0}
        testId="home-kpi-follow-ups"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client-progress widget (gated on /clients or /crm module)
// ---------------------------------------------------------------------------

function ClientProgressWidget() {
  const navigate = useNavigate();
  const { data: page, isLoading } = useClientsList({
    search: '',
    page: 1,
    rowsPerPage: PROGRESS_WIDGET_ROWS,
  });

  const rows = useMemo(() => page?.rows ?? [], [page?.rows]);
  const clientIds = useMemo(() => rows.map((row) => row.id), [rows]);

  const { data: profiledIds } = useQuery({
    queryKey: queryKeys.crmClients.profiledFlags(clientIds),
    queryFn: () => getProfiledClientIds(clientIds),
    enabled: clientIds.length > 0,
  });

  return (
    <Card data-testid="home-client-progress">
      <CardHeader>
        <CardTitle as="h2">Client profile progress</CardTitle>
        <CardDescription>
          Data completeness across your newest clients — tap a row to open the client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {['a', 'b', 'c'].map((key) => (
              <LoadingSkeleton key={key} variant="text" className="h-11 w-full" />
            ))}
          </div>
        )}

        {!isLoading && rows.length === 0 && (
          <div data-testid="home-client-progress-empty">
            <NoResultsState />
          </div>
        )}

        {!isLoading && rows.length > 0 && (
          <ul className="m-0 list-none space-y-1 p-0">
            {rows.map((row) => {
              const pct = clientCompleteness(row);
              return (
                <li key={row.id}>
                  <Button
                    variant="ghost"
                    className="h-auto min-h-11 w-full justify-start px-3 py-2.5 text-left"
                    onClick={() => navigate(`/clients/${row.id}`)}
                    data-testid={`home-client-progress-row-${row.id}`}
                  >
                    <span className="flex w-full items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="mb-1 flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {row.name || row.email || 'Unnamed client'}
                          </span>
                          {profiledIds?.has(row.id) && (
                            <Badge variant="status" tone="success" dot={false}>
                              Profiled
                            </Badge>
                          )}
                        </span>
                        <Progress
                          size="sm"
                          tone={pct === 100 ? 'success' : 'active'}
                          value={pct}
                          aria-label={`Profile ${pct}% complete`}
                        />
                      </span>
                      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {pct}%
                      </span>
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {!isLoading && (page?.count ?? 0) > PROGRESS_WIDGET_ROWS && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/clients')}
              data-testid="home-client-progress-view-all"
            >
              View all {page?.count} clients
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { user, profile, modules } = useAuth();
  const [search, setSearch] = useState('');

  const hasCrm = modules.some((m) => m.path === '/crm');
  const hasClients = modules.some((m) => m.path === '/clients');

  const launcherModules = useMemo(() => {
    const term = search.trim().toLowerCase();
    return modules.filter(
      (m) =>
        m.path !== '/dashboard' &&
        (!term ||
          m.name.toLowerCase().includes(term) ||
          m.description.toLowerCase().includes(term)),
    );
  }, [modules, search]);

  const categoryGroups = useMemo(
    () => groupModulesByCategory(launcherModules),
    [launcherModules],
  );

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) showError('There was an issue signing out. Clearing session anyway.');
      clearAuthStorage();
      showSuccess('Logged out successfully');
      navigate('/login', { replace: true });
    } catch {
      showError('An unexpected error occurred during logout');
    }
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <GreetingHeader
            name={profile?.name || user?.email?.split('@')[0] || 'there'}
            role={formatRole(profile?.role || '')}
            dateText={getFormattedDate()}
            timeOfDay={timeOfDayInSingapore()}
          />
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>

        {hasCrm && <CrmKpiRow />}

        <div className="space-y-5">
          <ModuleSearch value={search} onChange={setSearch} />

          <div className="space-y-6" data-testid="home-module-grid">
            {categoryGroups.length === 0 && (
              <NoResultsState
                query={search.trim() || undefined}
                onClearSearch={() => setSearch('')}
              />
            )}
            {categoryGroups.map((group) => (
              <section key={group.key}>
                <CategoryHeader
                  label={group.label}
                  icon={getModuleIcon(group.icon)}
                  count={group.modules.length}
                  chevron={false}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.modules.map((mod) => (
                    <div
                      key={mod.path}
                      data-testid={`home-module-tile${mod.path.replace(/\//g, '-')}`}
                    >
                      <ModuleCard
                        name={mod.name}
                        description={mod.description}
                        icon={getModuleIcon(mod.icon_name)}
                        showPin={false}
                        onClick={() => navigate(mod.path)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {(hasCrm || hasClients) && <ClientProgressWidget />}
      </div>
    </div>
  );
}
