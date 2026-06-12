/**
 * Portfolio-report API — two bounded selects over the viewer's RLS-visible
 * book (advisor = own clients, manager/super_admin = all via
 * view_all_clients), assembled into the /crm-reports report payload.
 *
 * Mirrors dashboardService: the policy select inner-joins `clients` and
 * filters `clients.is_deleted` so rows orphaned by a soft-deleted client
 * never appear (children keep `is_deleted = false` by design). All money
 * math comes from `lib/financeReport` (`summarisePortfolio` — the
 * PRD-documented ANNUALISED divergence from the legacy raw premium sum);
 * this layer only fetches, groups and renames columns.
 *
 * Clients sort by name (case-insensitive server collation) — a deliberate
 * presentation choice for a printable book-wide report; the legacy report
 * used insertion order.
 */

import { supabase } from '@/integrations/supabase/client';
import { summarisePortfolio, type PortfolioTotals } from '../lib/financeReport';

/** Report selects are bounded — far beyond any single advisor's book. */
const REPORT_LIMIT = 5000;

/** One policy line in a per-client portfolio table (raw row values renamed). */
export interface PortfolioReportPolicy {
  id: string;
  type: string;
  provider: string;
  policyNumber: string;
  /** RAW per-frequency amount — rendered "X/frequency" per legacy Reports.jsx:147-149. */
  premium: number;
  frequency: string;
  coverageAmount: number;
  status: string;
}

/** One client block in the report (facts table + policy table). */
export interface PortfolioReportClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  occupation: string;
  annualIncome: number;
  riskProfile: string;
  policies: PortfolioReportPolicy[];
}

export interface PortfolioReportData {
  totals: PortfolioTotals;
  clients: PortfolioReportClient[];
}

interface ClientSelectRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  occupation: string | null;
  annual_income: number | null;
  risk_profile: string | null;
}

interface PolicySelectRow {
  id: string;
  client_id: string;
  type: string | null;
  provider: string | null;
  policy_number: string | null;
  premium: number | null;
  frequency: string | null;
  coverage_amount: number | null;
  status: string | null;
  is_investment_linked: boolean | null;
  ilp_premium_inclusion_percent: number | null;
}

function policyFromSelectRow(row: PolicySelectRow): PortfolioReportPolicy {
  return {
    id: row.id,
    type: row.type ?? '',
    provider: row.provider ?? '',
    policyNumber: row.policy_number ?? '',
    premium: row.premium ?? 0,
    frequency: row.frequency ?? 'Annual',
    coverageAmount: row.coverage_amount ?? 0,
    status: row.status ?? '',
  };
}

/** Pure assembly — exported for direct unit coverage without a supabase mock. */
export function assemblePortfolioReport(
  clientRows: readonly ClientSelectRow[],
  policyRows: readonly PolicySelectRow[],
): PortfolioReportData {
  const byClient = new Map<string, PortfolioReportPolicy[]>();
  for (const row of policyRows) {
    const list = byClient.get(row.client_id) ?? [];
    list.push(policyFromSelectRow(row));
    byClient.set(row.client_id, list);
  }

  const totals = summarisePortfolio(
    clientRows.length,
    policyRows.map((row) => ({
      premium: row.premium,
      frequency: row.frequency,
      coverageAmount: row.coverage_amount,
      status: row.status,
      isInvestmentLinked: row.is_investment_linked,
      ilpPremiumInclusionPercent: row.ilp_premium_inclusion_percent,
    })),
  );

  return {
    totals,
    clients: clientRows.map((row) => ({
      id: row.id,
      name: row.name ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      occupation: row.occupation ?? '',
      annualIncome: row.annual_income ?? 0,
      riskProfile: row.risk_profile ?? '',
      policies: byClient.get(row.id) ?? [],
    })),
  };
}

/** Fetch the full visible book (clients + policies) and build the report. */
export async function getPortfolioReport(): Promise<PortfolioReportData> {
  const [clientsResult, policiesResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, email, phone, occupation, annual_income, risk_profile')
      .eq('is_deleted', false)
      .order('name', { ascending: true })
      .limit(REPORT_LIMIT),
    supabase
      .from('policies')
      .select(
        'id, client_id, type, provider, policy_number, premium, frequency, coverage_amount, status, is_investment_linked, ilp_premium_inclusion_percent, clients!inner(is_deleted)',
      )
      .eq('is_deleted', false)
      .eq('clients.is_deleted', false)
      .limit(REPORT_LIMIT),
  ]);
  if (clientsResult.error) throw clientsResult.error;
  if (policiesResult.error) throw policiesResult.error;

  return assemblePortfolioReport(clientsResult.data ?? [], policiesResult.data ?? []);
}
