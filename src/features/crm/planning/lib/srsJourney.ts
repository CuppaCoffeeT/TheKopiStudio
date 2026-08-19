/**
 * The complete SRS journey — accumulation and drawdown reconciled into the one
 * number a customer actually asks for: after paying tax on the way out, was
 * the scheme worth it?
 *
 *   net tax benefit = tax saved contributing − tax paid withdrawing
 *
 * A negative answer is a real answer and the tool must show it: a plan that
 * over-contributes and then cannot empty the account inside the window can
 * genuinely hand back more than it saved. That is the case the advisor is here
 * to catch.
 *
 * Pure — every age and rate is injected, nothing reads the clock.
 */

import type { ContributionProjection } from './srs';
import { annualTaxFreeCeiling } from './srsSchedules';
import type { WithdrawalPlan } from './srsWithdrawals';

export interface SrsJourneyInput {
  currentAge: number;
  /** The customer's locked-in statutory age. */
  withdrawalAge: number;
  /**
   * Age they actually start drawing — the statutory age, or later. The
   * projection already runs to here, so there is no separate deferral figure
   * to fold in; the extra years are simply part of the balance.
   */
  startAge: number;
  projection: ContributionProjection;
  plan: WithdrawalPlan;
  otherIncome: number;
}

export interface SrsJourney {
  /** Accumulation */
  totalContributions: number;
  investmentReturns: number;
  returnPercent: number;
  balanceAtFirstWithdrawal: number;
  /** Years the first withdrawal is pushed past the statutory age. */
  deferralYears: number;
  lifetimeTaxSaved: number;
  /** Drawdown */
  totalWithdrawn: number;
  taxOnWithdrawals: number;
  remainingBalance: number;
  forcedPayoutTax: number;
  totalTaxPaid: number;
  /** The bottom line */
  netTaxBenefit: number;
  /** Headroom */
  annualCeiling: number;
  averagePerYear: number;
  /** Positive when the plan draws MORE than comes out tax-free. */
  overCeilingBy: number;
  windowEndsAt: number;
}

export function buildJourney(input: SrsJourneyInput): SrsJourney {
  const { projection, plan } = input;

  const deferralYears = Math.max(0, input.startAge - input.withdrawalAge);
  const investmentReturns = projection.balanceAtFirstWithdrawal - projection.totalContributed;
  const totalTaxPaid = plan.totalTax + plan.forcedPayoutTax;
  const annualCeiling = annualTaxFreeCeiling(input.otherIncome);

  return {
    totalContributions: projection.totalContributed,
    investmentReturns,
    returnPercent:
      projection.totalContributed > 0
        ? (investmentReturns / projection.totalContributed) * 100
        : 0,
    balanceAtFirstWithdrawal: projection.balanceAtFirstWithdrawal,
    deferralYears,
    lifetimeTaxSaved: projection.lifetimeTaxSaved,
    totalWithdrawn: plan.totalWithdrawn,
    taxOnWithdrawals: plan.totalTax,
    remainingBalance: plan.leavesRemainder ? plan.remainingBalance : 0,
    forcedPayoutTax: plan.forcedPayoutTax,
    totalTaxPaid,
    netTaxBenefit: projection.lifetimeTaxSaved - totalTaxPaid,
    annualCeiling,
    averagePerYear: plan.averagePerYear,
    overCeilingBy: plan.averagePerYear - annualCeiling,
    windowEndsAt: plan.windowEndsAt,
  };
}
