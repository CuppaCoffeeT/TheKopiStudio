/**
 * CRM feature — public barrel (the ONLY cross-feature import surface).
 *
 * Route entries in App.tsx lazy-import page files directly for code-splitting;
 * everything else imports from here. Internal components (modals, tabs, badge)
 * are deliberately NOT exported — they are intra-feature. The lib/finance +
 * lib/financeReport exports are the tested surface the report pages consume.
 */

// P1 — scaffold
export { default as CrmDashboardPage } from './pages/CrmDashboardPage';
export { default as ClientsListPage } from './pages/ClientsListPage';
export { default as ClientDetailPage } from './pages/ClientDetailPage';
export type { CrmDashboardStats } from './types';

export type {
  ClientRow,
  ClientRowInsert,
  ClientRowUpdate,
  PolicyRow,
  PolicyRowInsert,
  PolicyRowUpdate,
  ProjectedCashValueRow,
  ProjectedCashValueRowInsert,
  ProjectedCashValueRowUpdate,
  InteractionRow,
  InteractionRowInsert,
  InteractionRowUpdate,
  BankBalanceRow,
  BankBalanceRowInsert,
  BankBalanceRowUpdate,
} from './types';

// P2 — lib port (finance · report math · follow-ups · row↔model mapping)
export {
  MEDICAL_INFLATION_RATE,
  AVERAGE_CRITICAL_ILLNESS_COST,
  AVERAGE_EARLY_CI_COST,
  BHS_2026,
  RETIREMENT_SUMS,
  currentRefYear,
  ageFromDOB,
  annualisePremium,
  formatCoverage,
  projectCPFTo55,
  retirementSumsFor,
  summariseClient,
} from './lib/finance';
export type {
  RetirementSumRow,
  RetirementSums,
  PremiumPolicyInput,
  CpfProjectionInput,
  CpfProjection,
  SummaryPolicyInput,
  ClientSummaryInput,
  ClientSummary,
} from './lib/finance';

export {
  BANK_INTEREST_RATE,
  DEATH_COVER_INCOME_MULTIPLE,
  CI_COVER_INCOME_MULTIPLE,
  ECI_COVER_INCOME_MULTIPLE,
  CPF_LIFE_PAYOUT_AT_FRS,
  projectBankTo65,
  futureCICost,
  futureECICost,
  analyseCoverageGaps,
  assessRetirementReadiness,
  splitPremiums,
} from './lib/financeReport';
export type {
  CoverageGapInput,
  CoverageGapAnalysis,
  RetirementReadinessInput,
  RetirementReadiness,
  PremiumSplit,
} from './lib/financeReport';

export { followUpBadge, nextFollowUpDate, resolveClientFollowUp } from './lib/followUps';
export type {
  FollowUpTone,
  FollowUpBadge,
  FollowUpInteraction,
  ClientFollowUp,
} from './lib/followUps';

export {
  policyFromRow,
  policyToRow,
  projectionsFromRows,
  projectionsToRows,
  interactionFromRow,
  interactionToRow,
  bankFromRow,
  bankToRow,
} from './lib/mapping';
export {
  clientFromRow,
  clientToRow,
} from './lib/clientMapping';
export type {
  CashValueProjection,
  CrmClient,
  CrmClientInput,
  CrmPolicy,
  CrmPolicyInput,
  CrmInteraction,
  CrmInteractionInput,
  CrmBankRecord,
  CrmBankRecordInput,
} from './types';

// P3 — data layer (api services + query/mutation hooks)
export {
  sanitizeSearchTerm,
  getClientsPaginated,
  getClientById,
  createClient,
  buildClientUpdate,
  updateClient,
  softDeleteClient,
} from './api/clientsService';
export type { ClientsListParams, ClientsPage } from './api/clientsService';
export {
  listPoliciesByClient,
  createPolicy,
  updatePolicy,
  dedupeProjectionRows,
  replaceProjections,
  softDeletePolicy,
} from './api/policiesService';
export {
  listInteractionsByClient,
  createInteraction,
  updateInteraction,
  softDeleteInteraction,
} from './api/interactionsService';
export {
  listBankHistoryByClient,
  recomputeClientBalance,
  createBankRecord,
  updateBankRecord,
  softDeleteBankRecord,
} from './api/bankService';
export { listRecentResults } from './api/linkedResultsService';
export { computeDashboardStats, getDashboardStats } from './api/dashboardService';
export type { StatsPolicyRow } from './api/dashboardService';

export { useClientsList } from './hooks/useClientsList';
export { useClientDetail } from './hooks/useClientDetail';
export { useCreateClient, useUpdateClient, useSoftDeleteClient } from './hooks/useClientMutations';
export { useCreatePolicy, useUpdatePolicy, useSoftDeletePolicy } from './hooks/usePolicyMutations';
export {
  useCreateInteraction,
  useUpdateInteraction,
  useSoftDeleteInteraction,
} from './hooks/useInteractionMutations';
export {
  useCreateBankRecord,
  useUpdateBankRecord,
  useSoftDeleteBankRecord,
} from './hooks/useBankMutations';
export { useDashboardStats } from './hooks/useDashboardStats';

// P2 (reports PRD) — per-client printable report page
export { default as ClientReportPage } from './pages/ClientReportPage';

// P3 (reports PRD) — portfolio report (/crm-reports)
export { default as PortfolioReportPage } from './pages/PortfolioReportPage';
export { summarisePortfolio } from './lib/financeReport';
export type { PortfolioPolicyInput, PortfolioTotals } from './lib/financeReport';
export { assemblePortfolioReport, getPortfolioReport } from './api/portfolioService';
export type {
  PortfolioReportClient,
  PortfolioReportData,
  PortfolioReportPolicy,
} from './api/portfolioService';
export { usePortfolioReport } from './hooks/usePortfolioReport';
