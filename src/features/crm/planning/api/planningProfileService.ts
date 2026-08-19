/**
 * Planning-profile persistence — the `tax_*` and `srs_*` columns on
 * `public.clients`.
 *
 * WHY COLUMNS AND NOT A RUN TABLE. What the tax calculator and the SRS planner
 * collect are customer FACTS — an SRS balance, a drawdown age, which reliefs
 * this person can claim. They belong beside `cpf_oa` and `annual_income`, and
 * they are what the tool pre-fills from next time. The history of who changed
 * them and when is already kept, once, in `customer_activity`.
 *
 * WHY A SEPARATE SERVICE. `clientsService` writes the client FORM. These
 * columns are not on that form, so letting the form's payload touch them would
 * mean a customer's saved SRS balance could be blanked by someone editing
 * their phone number. Same split, and the same reason, as the bank-history
 * recompute owning `total_bank_balance`. `buildClientUpdate` strips both sets.
 *
 * OWNERSHIP, guarded in the UI. `clients` is owner-write under RLS, so a
 * manager viewing another advisor's customer gets a 0-row update rather than a
 * silent success — which the `.select()` below promotes to a real error. The
 * pages ALSO gate the Save button on `isOwn`, so the manager never gets that
 * far; this is the backstop, not the gate. Same arrangement as
 * `legacyPlansService`.
 *
 * PARTIAL BY DESIGN. Each function writes only its own tool's columns. Saving
 * the tax calculator must leave the SRS figures exactly as they were.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { ClientRowUpdate, SavedReliefState, SavedWithdrawalPeriod } from '../../types';

/** What the tax calculator sends when the advisor clicks Save. */
export interface TaxProfileInput {
  /** Written through to `clients.annual_income` — the calculator's income field IS that column. */
  annualIncome: string;
  employmentType: string;
  otherIncome: string;
  donations: string;
  useFedr: boolean;
  fedrRate: string;
  reliefs: SavedReliefState;
}

/** What the SRS planner sends when the advisor clicks Save. */
export interface SrsProfileInput {
  annualIncome: string;
  currentBalance: string;
  contributionThisYear: string;
  annualContribution: string;
  growthRate: string;
  contributeUntilAge: string;
  withdrawalAge: string;
  strategy: string;
  balanceOverride: string;
  startAge: string;
  withdrawalYears: string;
  withdrawalGrowth: string;
  otherIncome: string;
  periods: SavedWithdrawalPeriod[];
}

/** Form string → numeric column. '' means "cleared", which is null, not 0. */
const toNum = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

/** Form string → integer column, for the age/year fields. */
const toInt = (value: string): number | null => {
  const n = toNum(value);
  return n === null ? null : Math.round(n);
};

async function writeProfile(
  clientId: string,
  userId: string,
  patch: ClientRowUpdate,
  what: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('clients')
    .update({ ...patch, updated_by: userId })
    .eq('id', clientId)
    .select('id');
  if (error) throw error;
  // RLS matching no row is not an error to Postgres — it is an empty result.
  // Without this the advisor sees a success toast for a save that never landed.
  if (!data || data.length === 0) {
    throw new Error(`You can only save ${what} to your own customers`);
  }
}

/** Save the tax calculator's figures onto the customer. */
export async function saveTaxProfile(
  clientId: string,
  input: TaxProfileInput,
  userId: string,
): Promise<void> {
  await writeProfile(
    clientId,
    userId,
    {
      annual_income: toNum(input.annualIncome),
      tax_employment_type: input.employmentType || null,
      tax_other_income: toNum(input.otherIncome),
      tax_donations: toNum(input.donations),
      tax_use_fedr: input.useFedr,
      tax_fedr_rate: toNum(input.fedrRate),
      // Structurally Json (booleans and numbers under string keys); the parser
      // in `clientMapping` is what guards the shape on the way back out.
      tax_reliefs: input.reliefs as unknown as Json,
      tax_saved_at: new Date().toISOString(),
    },
    'a tax calculation',
  );
}

/** Save the SRS planner's figures onto the customer. */
export async function saveSrsProfile(
  clientId: string,
  input: SrsProfileInput,
  userId: string,
): Promise<void> {
  await writeProfile(
    clientId,
    userId,
    {
      annual_income: toNum(input.annualIncome),
      srs_current_balance: toNum(input.currentBalance),
      srs_contribution_this_year: toNum(input.contributionThisYear),
      srs_annual_contribution: toNum(input.annualContribution),
      srs_growth_rate: toNum(input.growthRate),
      srs_contribute_until_age: toInt(input.contributeUntilAge),
      srs_withdrawal_age: toInt(input.withdrawalAge),
      srs_withdrawal_strategy: input.strategy || null,
      srs_balance_override: toNum(input.balanceOverride),
      srs_withdrawal_start_age: toInt(input.startAge),
      srs_withdrawal_years: toInt(input.withdrawalYears),
      srs_withdrawal_growth: toNum(input.withdrawalGrowth),
      srs_withdrawal_other_income: toNum(input.otherIncome),
      srs_withdrawal_periods: input.periods as unknown as Json,
      srs_saved_at: new Date().toISOString(),
    },
    'an SRS plan',
  );
}
