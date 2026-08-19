/**
 * The tool-owned half of the client model — what the tax calculator and the SRS
 * planner save onto a customer (2026-08-19).
 *
 * Split out of `types.ts` at the ownership seam, not just for length: these are
 * the only client fields the client FORM never edits. `clientToRow` does not
 * write them and `buildClientUpdate` strips them; they are written solely by
 * `planning/api/planningProfileService.ts` and read back as the tools'
 * pre-fill. Numerics stay form STRINGS, matching the rest of the client model
 * ('' = unset).
 *
 * Reasoning for storing these as columns rather than a per-run snapshot table:
 * planning/decisions.md, 2026-08-19.
 */

/** One relief's saved state. Structurally the planner's `ReliefEntry`. */
export interface SavedReliefEntry {
  on: boolean;
  quantity: number;
  manualAmount: number;
}

/** Relief state as stored in `clients.tax_reliefs`, keyed by relief id. */
export type SavedReliefState = Record<string, SavedReliefEntry>;

/** One custom SRS drawdown period, as stored in `clients.srs_withdrawal_periods`. */
export interface SavedWithdrawalPeriod {
  amount: number;
  years: number;
}

/**
 * What the tax calculator last saved against the customer.
 *
 * Age and gross income are deliberately absent: they are `dateOfBirth` and
 * `annualIncome`, already columns, and duplicating them is how two answers to
 * "how old is this customer" come to disagree.
 */
export interface CrmClientTaxProfile {
  /** '' · 'employed' · 'selfEmployed'. '' = never saved. */
  employmentType: string;
  otherIncome: string;
  donations: string;
  useFedr: boolean;
  /** Fixed-expense-deduction rate as a FRACTION ('0.6'), matching the input. */
  fedrRate: string;
  /** Null until the calculator is first saved — that is what makes the tool fall back to its defaults. */
  reliefs: SavedReliefState | null;
  /** ISO timestamp of the last save, '' = never. */
  savedAt: string;
}

/** What the SRS planner last saved against the customer. */
export interface CrmClientSrsProfile {
  currentBalance: string;
  contributionThisYear: string;
  annualContribution: string;
  /** Percent ('4' = 4%), matching the input. */
  growthRate: string;
  contributeUntilAge: string;
  withdrawalAge: string;
  /** '' · 'equal' · 'custom'. '' = never saved. */
  strategy: string;
  balanceOverride: string;
  startAge: string;
  withdrawalYears: string;
  /** Percent ('3' = 3%). */
  withdrawalGrowth: string;
  otherIncome: string;
  periods: SavedWithdrawalPeriod[] | null;
  savedAt: string;
}
