/**
 * SRS corpus — locks the two statutory rules the tool exists to explain:
 * only 50% of a withdrawal is chargeable, and whatever is left when the
 * 10-year window closes is force-paid in ONE year (which is what makes the
 * tax bite).
 */
import { describe, expect, it } from 'vitest';

import { grossTax } from '../singaporeTax';
import {
  projectContributions,
  SRS_EXEMPT_FRACTION,
  SRS_FORCED_PAYOUT_AGE,
  SRS_WITHDRAWAL_AGE,
  SRS_WITHDRAWAL_WINDOW_YEARS,
  taxOnSlice,
} from '../srs';
import { equalWithdrawals, planWithdrawals } from '../srsWithdrawals';

describe('statutory constants', () => {
  it('withdrawals start at 63 and the window closes at 72', () => {
    expect(SRS_WITHDRAWAL_AGE).toBe(63);
    expect(SRS_WITHDRAWAL_WINDOW_YEARS).toBe(10);
    expect(SRS_FORCED_PAYOUT_AGE).toBe(72);
    expect(SRS_EXEMPT_FRACTION).toBe(0.5);
  });
});

describe('taxOnSlice — marginal, not average', () => {
  it('prices a slice at the rate it actually lands in', () => {
    // 20k→30k band is 2%, so a $10,000 slice on top of $20,000 costs $200.
    expect(taxOnSlice(20_000, 10_000)).toBeCloseTo(200, 6);
  });

  it('is free while the slice stays inside the 0% band', () => {
    expect(taxOnSlice(0, 20_000)).toBe(0);
  });

  it('composes — two slices equal one big slice', () => {
    const oneGo = taxOnSlice(50_000, 30_000);
    const twoSteps = taxOnSlice(50_000, 10_000) + taxOnSlice(60_000, 20_000);
    expect(twoSteps).toBeCloseTo(oneGo, 6);
  });
});

describe('projectContributions', () => {
  const base = {
    currentAge: 60,
    annualIncome: 100_000,
    contributionThisYear: 15_300,
    currentBalance: 0,
    growthRate: 0,
    annualContribution: 0,
    contributeUntilAge: 0,
  };

  it('values this year’s contribution at the marginal rate', () => {
    const p = projectContributions(base);
    expect(p.taxSavedThisYear).toBeCloseTo(
      grossTax(100_000) - grossTax(100_000 - 15_300),
      6,
    );
    expect(p.taxSavedThisYear).toBeGreaterThan(0);
  });

  it('runs exactly to age 63 and no further', () => {
    const p = projectContributions({ ...base, currentAge: 60 });
    expect(p.years).toHaveLength(3);
    expect(p.years.at(-1)?.age).toBe(63);
  });

  it('produces no projection years for someone already 63', () => {
    const p = projectContributions({ ...base, currentAge: 63 });
    expect(p.years).toHaveLength(0);
    expect(p.balanceAtWithdrawalAge).toBe(0);
  });

  it('compounds growth then adds the contribution', () => {
    const p = projectContributions({
      ...base,
      currentAge: 62,
      currentBalance: 100_000,
      growthRate: 0.1,
      annualContribution: 10_000,
      contributeUntilAge: 70,
    });
    // One year: 100,000 + 10,000 growth + 10,000 contribution.
    expect(p.balanceAtWithdrawalAge).toBeCloseTo(120_000, 6);
  });

  it('stops contributing after contributeUntilAge but keeps growing', () => {
    const p = projectContributions({
      ...base,
      currentAge: 61,
      currentBalance: 100_000,
      growthRate: 0.1,
      annualContribution: 10_000,
      contributeUntilAge: 62,
    });
    // Age 62: 100,000 + 10,000 + 10,000 = 120,000 (contributing)
    // Age 63: 120,000 + 12,000 + 0        = 132,000 (past the cut-off)
    expect(p.years[0].contribution).toBe(10_000);
    expect(p.years[1].contribution).toBe(0);
    expect(p.balanceAtWithdrawalAge).toBeCloseTo(132_000, 6);
  });

  it('counts a tax saving only in the years it actually contributes', () => {
    const p = projectContributions({
      ...base,
      currentAge: 61,
      annualContribution: 10_000,
      contributeUntilAge: 62,
    });
    expect(p.years[0].taxSaved).toBeGreaterThan(0);
    expect(p.years[1].taxSaved).toBe(0);
  });
});

describe('equalWithdrawals', () => {
  it('empties the account exactly over the chosen span', () => {
    const amounts = equalWithdrawals(100_000, 0, 10);
    expect(amounts).toHaveLength(10);
    expect(amounts.reduce((a, b) => a + b, 0)).toBeCloseTo(100_000, 6);
    // With no growth every year is identical.
    for (const amount of amounts) expect(amount).toBeCloseTo(10_000, 6);
  });

  it('takes more each year when the balance keeps growing', () => {
    const amounts = equalWithdrawals(100_000, 0.05, 10);
    expect(amounts.reduce((a, b) => a + b, 0)).toBeGreaterThan(100_000);
    expect(amounts.at(-1)!).toBeGreaterThan(amounts[0]);
  });
});

describe('planWithdrawals', () => {
  it('exempts half of every withdrawal', () => {
    const plan = planWithdrawals({
      startingBalance: 40_000,
      growthRate: 0,
      otherIncome: 0,
      amounts: [40_000],
    });
    // $40k out: $20k auto-exempt, and the chargeable $20k fits the free room,
    // so the whole withdrawal escapes tax. This is the tool's headline case.
    expect(plan.schedule[0].taxFree).toBeCloseTo(40_000, 6);
    expect(plan.totalTax).toBe(0);
  });

  it('charges once other income has eaten the free room', () => {
    const plan = planWithdrawals({
      startingBalance: 40_000,
      growthRate: 0,
      otherIncome: 20_000,
      amounts: [40_000],
    });
    // Chargeable half is $20,000 stacked on $20,000 of other income.
    expect(plan.totalTax).toBeCloseTo(taxOnSlice(20_000, 20_000), 6);
    expect(plan.schedule[0].taxFree).toBeCloseTo(20_000, 6);
  });

  it('starts the schedule at 63 and counts up', () => {
    const plan = planWithdrawals({
      startingBalance: 30_000,
      growthRate: 0,
      otherIncome: 0,
      amounts: [10_000, 10_000, 10_000],
    });
    expect(plan.schedule.map((y) => y.age)).toEqual([63, 64, 65]);
  });

  it('flags a remainder and prices the forced payout', () => {
    const plan = planWithdrawals({
      startingBalance: 500_000,
      growthRate: 0,
      otherIncome: 0,
      amounts: [10_000],
    });
    expect(plan.leavesRemainder).toBe(true);
    expect(plan.remainingBalance).toBeCloseTo(490_000, 6);
    // Half of the remainder lands in ONE year on top of other income.
    expect(plan.forcedPayoutTax).toBeCloseTo(taxOnSlice(0, 245_000), 6);
    expect(plan.forcedPayoutTax).toBeGreaterThan(0);
  });

  it('reports no remainder and no forced tax once the account is drained', () => {
    const plan = planWithdrawals({
      startingBalance: 100_000,
      growthRate: 0,
      otherIncome: 0,
      amounts: equalWithdrawals(100_000, 0, 10),
    });
    expect(plan.leavesRemainder).toBe(false);
    expect(plan.forcedPayoutTax).toBe(0);
    expect(plan.remainingBalance).toBeCloseTo(0, 6);
  });

  it('never withdraws more than is actually there', () => {
    const plan = planWithdrawals({
      startingBalance: 5_000,
      growthRate: 0,
      otherIncome: 0,
      amounts: [50_000],
    });
    expect(plan.totalWithdrawn).toBeCloseTo(5_000, 6);
    expect(plan.remainingBalance).toBeCloseTo(0, 6);
  });

  it('spreading beats a lump sum — the reason the tool exists', () => {
    const balance = 400_000;
    const lump = planWithdrawals({
      startingBalance: balance,
      growthRate: 0,
      otherIncome: 0,
      amounts: [balance],
    });
    const spread = planWithdrawals({
      startingBalance: balance,
      growthRate: 0,
      otherIncome: 0,
      amounts: equalWithdrawals(balance, 0, 10),
    });
    expect(spread.totalTax).toBeLessThan(lump.totalTax);
    expect(spread.netReceived).toBeGreaterThan(lump.netReceived);
  });

  it('stops early rather than looping on a drained account', () => {
    const plan = planWithdrawals({
      startingBalance: 10_000,
      growthRate: 0,
      otherIncome: 0,
      amounts: [10_000, 10_000, 10_000],
    });
    expect(plan.schedule).toHaveLength(1);
  });
});
