/**
 * The full tax assessment — assessable income down to tax payable.
 *
 * Split from `taxReliefs.ts` (W23 LOC ceiling) along the seam that was already
 * there: that file is the CATALOGUE (what reliefs exist), this one is the
 * CALCULATION (what they come to for one person).
 *
 * `assessTax` is the single entry point the page calls. It is pure: the caller
 * supplies age and employment type, so an assessment attached to a customer
 * report renders identically a year later.
 */

import {
  cpfEmployedRelief,
  computeTax,
  DONATION_MULTIPLIER,
  earnedIncomeRelief,
  RELIEF_CAP,
  seMedisaveRelief,
  wmcrFixed,
  wmcrPercentage,
  type TaxPayable,
} from './singaporeTax';
import { RELIEFS, type ReliefDefinition } from './taxReliefs';

export type EmploymentType = 'employed' | 'selfEmployed';

/** Per-relief user state: on/off, how many dependants, and any typed amount. */
export interface ReliefEntry {
  on: boolean;
  quantity: number;
  manualAmount: number;
}

export type ReliefState = Record<string, ReliefEntry>;

/** Every relief in its default state — auto reliefs on, the rest off. */
export function defaultReliefState(): ReliefState {
  const state: ReliefState = {};
  for (const relief of RELIEFS) {
    state[relief.id] = {
      on: relief.defaultOn === true,
      quantity: 1,
      manualAmount: 0,
    };
  }
  return state;
}

export interface TaxAssessmentInput {
  age: number;
  employment: EmploymentType;
  /** Employment income, or gross trade receipts when self-employed. */
  grossIncome: number;
  /** Rental, royalties and anything else not earned from work. */
  otherIncome: number;
  /** Self-employed only: claim the Fixed Expense Deduction Ratio instead of actuals. */
  useFedr: boolean;
  /** FEDR percentage as a fraction (0.6 = 60% of gross deducted). */
  fedrRate: number;
  /** Cash donations to approved IPCs — deducted at 2.5×. */
  donations: number;
  reliefs: ReliefState;
}

export interface ReliefLine {
  id: string;
  name: string;
  amount: number;
  /** True when this relief's own statutory cap bit. */
  capped: boolean;
  /** False when the relief does not apply to this employment type. */
  applicable: boolean;
}

export interface TaxAssessment {
  /** Employment/trade income after any FEDR deduction. */
  earnedIncome: number;
  fedrDeduction: number;
  assessableIncome: number;
  lines: ReliefLine[];
  /** Sum of every claimed relief, BEFORE the $80,000 cap. */
  totalReliefsClaimed: number;
  /** What actually reduces income — `min(claimed, 80_000)`. */
  reliefsApplied: number;
  reliefCapHit: boolean;
  donationDeduction: number;
  chargeableIncome: number;
  tax: TaxPayable;
  /** Effective rate against assessable income, as a percentage. */
  effectiveRate: number;
  /** Tax that would be payable with no reliefs and no donations. */
  taxWithoutReliefs: TaxPayable;
  /** How much the reliefs and donations are worth. Never negative. */
  taxSaved: number;
}

/** Resolve ONE relief's amount for the given inputs. */
function reliefAmount(
  relief: ReliefDefinition,
  entry: ReliefEntry,
  input: TaxAssessmentInput,
  earnedIncome: number,
): { amount: number; capped: boolean } {
  switch (relief.kind) {
    case 'auto':
      if (relief.id === 'eir') return { amount: earnedIncomeRelief(input.age, earnedIncome), capped: false };
      if (relief.id === 'cpfEmp') return { amount: cpfEmployedRelief(input.age, earnedIncome), capped: false };
      if (relief.id === 'cpfSE') {
        const se = seMedisaveRelief(input.age, earnedIncome);
        return { amount: se.amount, capped: se.capped };
      }
      return { amount: 0, capped: false };
    case 'fixed':
      return { amount: relief.standardAmount ?? 0, capped: false };
    case 'quantity':
      return { amount: (relief.standardAmount ?? 0) * entry.quantity, capped: false };
    case 'wmcrFixed':
      return { amount: wmcrFixed(entry.quantity), capped: false };
    case 'wmcrPercentage':
      return { amount: wmcrPercentage(entry.quantity, earnedIncome), capped: false };
    case 'manual': {
      const typed = Math.max(entry.manualAmount, 0);
      if (relief.cap !== undefined && typed > relief.cap) return { amount: relief.cap, capped: true };
      return { amount: typed, capped: false };
    }
  }
}

/** Does this relief apply at all, given the employment type? */
export function reliefApplies(relief: ReliefDefinition, employment: EmploymentType): boolean {
  if (relief.employedOnly && employment !== 'employed') return false;
  if (relief.selfEmployedOnly && employment !== 'selfEmployed') return false;
  return true;
}

/** The whole assessment, top to bottom. */
export function assessTax(input: TaxAssessmentInput): TaxAssessment {
  const selfEmployed = input.employment === 'selfEmployed';
  const fedrDeduction = selfEmployed && input.useFedr ? input.grossIncome * input.fedrRate : 0;
  const earnedIncome = Math.max(input.grossIncome - fedrDeduction, 0);
  const assessableIncome = earnedIncome + input.otherIncome;

  const lines: ReliefLine[] = RELIEFS.map((relief) => {
    const entry = input.reliefs[relief.id] ?? { on: false, quantity: 1, manualAmount: 0 };
    const applicable = reliefApplies(relief, input.employment);
    if (!applicable || !entry.on) {
      return { id: relief.id, name: relief.name, amount: 0, capped: false, applicable };
    }
    const { amount, capped } = reliefAmount(relief, entry, input, earnedIncome);
    return { id: relief.id, name: relief.name, amount, capped, applicable };
  });

  const totalReliefsClaimed = lines.reduce((sum, line) => sum + line.amount, 0);
  const reliefsApplied = Math.min(totalReliefsClaimed, RELIEF_CAP);
  const donationDeduction = Math.max(input.donations, 0) * DONATION_MULTIPLIER;

  const chargeableIncome = Math.max(assessableIncome - reliefsApplied - donationDeduction, 0);
  const tax = computeTax(chargeableIncome);
  const taxWithoutReliefs = computeTax(assessableIncome);

  return {
    earnedIncome,
    fedrDeduction,
    assessableIncome,
    lines,
    totalReliefsClaimed,
    reliefsApplied,
    reliefCapHit: totalReliefsClaimed > RELIEF_CAP,
    donationDeduction,
    chargeableIncome,
    tax,
    effectiveRate: assessableIncome > 0 ? (tax.net / assessableIncome) * 100 : 0,
    taxWithoutReliefs,
    taxSaved: Math.max(taxWithoutReliefs.net - tax.net, 0),
  };
}
