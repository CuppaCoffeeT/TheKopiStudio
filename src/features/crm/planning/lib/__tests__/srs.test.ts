/**
 * SRS corpus — locks the statutory rules the tool exists to explain:
 * the withdrawal age is the customer's own locked-in one (62/63/64), only 50%
 * of a withdrawal is chargeable, and whatever is left when the 10-year window
 * closes is force-paid in ONE year (which is what makes the tax bite).
 *
 * The window is counted from the FIRST withdrawal, not from the statutory age.
 * Deferring is therefore a lever, not a rounding detail, and it gets its own
 * cases below — including the two things it buys: more compounding AND more
 * years of relief, because contributions run until the first withdrawal.
 */
import { describe, expect, it } from 'vitest';

import { grossTax } from '../singaporeTax';
import {
  forcedPayoutAge,
  milestoneAges,
  milestoneRows,
  projectContributions,
  SRS_DEFAULT_WITHDRAWAL_AGE,
  SRS_EXEMPT_FRACTION,
  SRS_STATUTORY_AGES,
  SRS_WITHDRAWAL_WINDOW_YEARS,
  taxOnSlice,
} from '../srs';
import {
  annualTaxFreeCeiling,
  customWithdrawals,
  equalWithdrawals,
} from '../srsSchedules';
import { planWithdrawals } from '../srsWithdrawals';
import { buildJourney } from '../srsJourney';

describe('statutory constants', () => {
  it('offers the three locked-in withdrawal ages', () => {
    expect(SRS_STATUTORY_AGES).toEqual([62, 63, 64]);
    expect(SRS_DEFAULT_WITHDRAWAL_AGE).toBe(63);
    expect(SRS_WITHDRAWAL_WINDOW_YEARS).toBe(10);
    expect(SRS_EXEMPT_FRACTION).toBe(0.5);
  });

  it('closes the window ten years after the FIRST withdrawal, not the birthday', () => {
    expect(forcedPayoutAge(63)).toBe(72);
    expect(forcedPayoutAge(62)).toBe(71);
    // Deferring to 67 pushes the close out with it — the whole point.
    expect(forcedPayoutAge(67)).toBe(76);
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
    startAge: 63,
  };

  it('values this year’s contribution at the marginal rate', () => {
    const p = projectContributions(base);
    expect(p.taxSavedThisYear).toBeCloseTo(
      grossTax(100_000) - grossTax(100_000 - 15_300),
      6,
    );
    expect(p.taxSavedThisYear).toBeGreaterThan(0);
  });

  it('runs to the planned first withdrawal and no further', () => {
    const p = projectContributions({ ...base, currentAge: 60 });
    expect(p.years).toHaveLength(3);
    expect(p.years.at(-1)?.age).toBe(63);
  });

  it('stops at 62 for someone drawing at their earlier locked-in age', () => {
    const p = projectContributions({ ...base, currentAge: 60, startAge: 62 });
    expect(p.years).toHaveLength(2);
    expect(p.years.at(-1)?.age).toBe(62);
  });

  it('runs PAST the statutory age when the first withdrawal is deferred', () => {
    // The point of the rebuild: the years between the locked-in age and the
    // first withdrawal belong to accumulation, not to a separate deferral step.
    const p = projectContributions({ ...base, currentAge: 60, startAge: 67 });
    expect(p.years).toHaveLength(7);
    expect(p.years.at(-1)?.age).toBe(67);
  });

  it('produces no projection years for someone already at their start age', () => {
    const p = projectContributions({ ...base, currentAge: 63 });
    expect(p.years).toHaveLength(0);
    expect(p.balanceAtFirstWithdrawal).toBe(0);
  });

  it('compounds growth then adds the contribution', () => {
    const p = projectContributions({
      ...base,
      currentAge: 62,
      startAge: 64,
      currentBalance: 100_000,
      growthRate: 0.1,
      annualContribution: 10_000,
      contributeUntilAge: 70,
    });
    // Age 63: 100,000 + 10,000 growth + 10,000 contribution = 120,000
    // Age 64: 120,000 + 12,000 growth + 0 (the withdrawal year) = 132,000
    expect(p.years[0].balance).toBeCloseTo(120_000, 6);
    expect(p.balanceAtFirstWithdrawal).toBeCloseTo(132_000, 6);
  });

  it('keeps contributing past the statutory age, right up to the withdrawal', () => {
    // Locked in at 63 but drawing at 67: 62–66 all contribute, because relief
    // runs until the first dollar comes out. This was unrepresentable before.
    const p = projectContributions({
      ...base,
      currentAge: 61,
      startAge: 67,
      annualContribution: 10_000,
      contributeUntilAge: 70,
    });
    expect(p.years.filter((y) => y.contribution > 0).map((y) => y.age)).toEqual([
      62, 63, 64, 65, 66,
    ]);
  });

  it('never contributes in the year the first withdrawal is taken', () => {
    const p = projectContributions({
      ...base,
      currentAge: 61,
      startAge: 65,
      annualContribution: 10_000,
      contributeUntilAge: 90,
    });
    expect(p.years.at(-1)?.age).toBe(65);
    expect(p.years.at(-1)?.contribution).toBe(0);
    expect(p.years.at(-1)?.taxSaved).toBe(0);
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
    expect(p.balanceAtFirstWithdrawal).toBeCloseTo(132_000, 6);
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

  it('runs a cumulative tax-saved total across the projected years', () => {
    const p = projectContributions({
      ...base,
      currentAge: 60,
      annualContribution: 10_000,
      contributeUntilAge: 70,
    });
    const perYear = p.years[0].taxSaved;
    // 61 and 62 contribute; 63 is the withdrawal year and cannot.
    expect(p.years.at(-1)?.cumulativeTaxSaved).toBeCloseTo(perYear * 2, 6);
    // The cumulative column covers FUTURE years only — this year's saving is
    // the headline stat and would be double-counted in the table.
    expect(p.lifetimeTaxSaved).toBeCloseTo(
      p.taxSavedThisYear + (p.years.at(-1)?.cumulativeTaxSaved ?? 0),
      6,
    );
  });
});

describe('milestones', () => {
  it('takes today, every fifth birthday, then the first-withdrawal age', () => {
    expect(milestoneAges(40, 63)).toEqual([40, 45, 50, 55, 60, 63]);
  });

  it('never repeats the start age when it is already a multiple of five', () => {
    const ages = milestoneAges(41, 65);
    expect(ages.filter((age) => age === 65)).toHaveLength(1);
  });

  it('drops the current age from the rows — the projection starts a year later', () => {
    const projection = projectContributions({
      currentAge: 40,
      annualIncome: 100_000,
      contributionThisYear: 0,
      currentBalance: 100_000,
      growthRate: 0.04,
      annualContribution: 0,
      contributeUntilAge: 0,
      startAge: 63,
    });
    const rows = milestoneRows(projection, 40, 63);
    expect(rows.map((row) => row.age)).toEqual([45, 50, 55, 60, 63]);
  });
});

describe('equalWithdrawals — a LEVEL payment', () => {
  it('empties the account exactly over the chosen span', () => {
    const amounts = equalWithdrawals(100_000, 0, 10);
    expect(amounts).toHaveLength(10);
    expect(amounts.reduce((a, b) => a + b, 0)).toBeCloseTo(100_000, 6);
    for (const amount of amounts) expect(amount).toBeCloseTo(10_000, 6);
  });

  it('pays the SAME amount every year even while the balance grows', () => {
    const amounts = equalWithdrawals(100_000, 0.05, 10);
    for (const amount of amounts) expect(amount).toBeCloseTo(amounts[0], 6);
    // Growth means the level payment exceeds a tenth of the opening balance.
    expect(amounts[0]).toBeGreaterThan(10_000);
  });

  it('still drains the account when growth is credited before each draw', () => {
    const plan = planWithdrawals({
      startingBalance: 250_000,
      growthRate: 0.03,
      otherIncome: 0,
      amounts: equalWithdrawals(250_000, 0.03, 10),
      startAge: 63,
    });
    expect(plan.remainingBalance).toBeCloseTo(0, 4);
    expect(plan.leavesRemainder).toBe(false);
  });
});

describe('customWithdrawals', () => {
  it('flattens legs into a year-by-year series, in order', () => {
    expect(
      customWithdrawals([
        { amount: 60_000, years: 2 },
        { amount: 20_000, years: 3 },
      ]),
    ).toEqual([60_000, 60_000, 20_000, 20_000, 20_000]);
  });

  it('ignores a leg with no years', () => {
    expect(customWithdrawals([{ amount: 60_000, years: 0 }])).toEqual([]);
  });

  it('is capped at the statutory window by the plan, however long the legs are', () => {
    const amounts = customWithdrawals([{ amount: 10_000, years: 40 }]);
    const plan = planWithdrawals({
      startingBalance: 1_000_000,
      growthRate: 0,
      otherIncome: 0,
      amounts,
      startAge: 63,
    });
    expect(plan.schedule).toHaveLength(SRS_WITHDRAWAL_WINDOW_YEARS);
  });
});

describe('annualTaxFreeCeiling', () => {
  it('is $40,000 with no other taxable income', () => {
    expect(annualTaxFreeCeiling(0)).toBe(40_000);
  });

  it('falls two dollars for every dollar of other income', () => {
    expect(annualTaxFreeCeiling(5_000)).toBe(30_000);
  });

  it('bottoms out at zero once the zero-rate band is used up', () => {
    expect(annualTaxFreeCeiling(20_000)).toBe(0);
    expect(annualTaxFreeCeiling(90_000)).toBe(0);
  });
});

describe('planWithdrawals', () => {
  const at63 = { startAge: 63 };

  it('exempts half of every withdrawal', () => {
    const plan = planWithdrawals({
      startingBalance: 40_000,
      growthRate: 0,
      otherIncome: 0,
      amounts: [40_000],
      ...at63,
    });
    // $40k out: $20k auto-exempt, and the chargeable $20k fits the free room,
    // so the whole withdrawal escapes tax. This is the tool's headline case.
    expect(plan.schedule[0].taxFree).toBeCloseTo(40_000, 6);
    expect(plan.schedule[0].taxedPortion).toBeCloseTo(0, 6);
    expect(plan.totalTax).toBe(0);
  });

  it('charges once other income has eaten the free room', () => {
    const plan = planWithdrawals({
      startingBalance: 40_000,
      growthRate: 0,
      otherIncome: 20_000,
      amounts: [40_000],
      ...at63,
    });
    // Chargeable half is $20,000 stacked on $20,000 of other income.
    expect(plan.totalTax).toBeCloseTo(taxOnSlice(20_000, 20_000), 6);
    expect(plan.schedule[0].taxFree).toBeCloseTo(20_000, 6);
    expect(plan.schedule[0].taxedPortion).toBeCloseTo(20_000, 6);
  });

  it('counts the schedule from the age drawing actually starts', () => {
    const plan = planWithdrawals({
      startingBalance: 30_000,
      growthRate: 0,
      otherIncome: 0,
      amounts: [10_000, 10_000, 10_000],
      startAge: 67,
    });
    expect(plan.schedule.map((y) => y.age)).toEqual([67, 68, 69]);
    expect(plan.windowEndsAt).toBe(76);
  });

  it('flags a remainder and prices the forced payout', () => {
    const plan = planWithdrawals({
      startingBalance: 500_000,
      growthRate: 0,
      otherIncome: 0,
      amounts: [10_000],
      ...at63,
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
      ...at63,
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
      ...at63,
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
      ...at63,
    });
    const spread = planWithdrawals({
      startingBalance: balance,
      growthRate: 0,
      otherIncome: 0,
      amounts: equalWithdrawals(balance, 0, 10),
      ...at63,
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
      ...at63,
    });
    expect(plan.schedule).toHaveLength(1);
  });

  it('averages the draw across the years it actually pays out', () => {
    const plan = planWithdrawals({
      startingBalance: 60_000,
      growthRate: 0,
      otherIncome: 0,
      amounts: [30_000, 30_000],
      ...at63,
    });
    expect(plan.yearsDrawn).toBe(2);
    expect(plan.averagePerYear).toBeCloseTo(30_000, 6);
  });
});

describe('buildJourney', () => {
  const projectionInput = {
    currentAge: 40,
    annualIncome: 120_000,
    contributionThisYear: 15_300,
    currentBalance: 30_000,
    growthRate: 0.04,
    annualContribution: 15_300,
    contributeUntilAge: 62,
    startAge: 63,
  };
  const projection = projectContributions(projectionInput);

  function journeyFor(amounts: number[]) {
    const plan = planWithdrawals({
      startingBalance: projection.balanceAtFirstWithdrawal,
      growthRate: 0.03,
      otherIncome: 0,
      amounts,
      startAge: 63,
    });
    return buildJourney({
      currentAge: 40,
      withdrawalAge: 63,
      startAge: 63,
      projection,
      plan,
      otherIncome: 0,
    });
  }

  it('nets tax saved contributing against tax paid withdrawing', () => {
    const journey = journeyFor(equalWithdrawals(projection.balanceAtFirstWithdrawal, 0.03, 10));
    expect(journey.netTaxBenefit).toBeCloseTo(
      journey.lifetimeTaxSaved - journey.totalTaxPaid,
      6,
    );
    expect(journey.lifetimeTaxSaved).toBeGreaterThan(0);
  });

  it('separates contributions from the returns they earned', () => {
    const journey = journeyFor(equalWithdrawals(projection.balanceAtFirstWithdrawal, 0.03, 10));
    expect(journey.totalContributions + journey.investmentReturns).toBeCloseTo(
      journey.balanceAtFirstWithdrawal,
      6,
    );
    expect(journey.returnPercent).toBeGreaterThan(0);
  });

  it('folds the forced payout into the tax paid — the case that can go negative', () => {
    // A single small draw leaves nearly everything to be force-paid in one year.
    const journey = journeyFor([10_000]);
    expect(journey.remainingBalance).toBeGreaterThan(0);
    expect(journey.forcedPayoutTax).toBeGreaterThan(0);
    expect(journey.totalTaxPaid).toBeCloseTo(
      journey.taxOnWithdrawals + journey.forcedPayoutTax,
      6,
    );
    expect(journey.netTaxBenefit).toBeLessThan(journey.lifetimeTaxSaved);
  });

  it('reports the ceiling and how far over it the plan draws', () => {
    const journey = journeyFor(equalWithdrawals(projection.balanceAtFirstWithdrawal, 0.03, 10));
    expect(journey.annualCeiling).toBe(40_000);
    expect(journey.overCeilingBy).toBeCloseTo(journey.averagePerYear - 40_000, 6);
  });

  it('counts deferred years and moves the window close with them', () => {
    const deferred = projectContributions({ ...projectionInput, startAge: 67 });
    const plan = planWithdrawals({
      startingBalance: deferred.balanceAtFirstWithdrawal,
      growthRate: 0.03,
      otherIncome: 0,
      amounts: [10_000],
      startAge: 67,
    });
    const journey = buildJourney({
      currentAge: 40,
      withdrawalAge: 63,
      startAge: 67,
      projection: deferred,
      plan,
      otherIncome: 0,
    });
    expect(journey.deferralYears).toBe(4);
    expect(journey.windowEndsAt).toBe(76);
  });

  it('prices the deferred years INSIDE the projection, not as a bolt-on', () => {
    // Deferring is worth more than four years of compounding on its own: with
    // the contribution cut-off above the statutory age it also buys four more
    // years of contributions and their relief.
    const deferred = projectContributions({
      ...projectionInput,
      contributeUntilAge: 66,
      startAge: 67,
    });
    expect(deferred.balanceAtFirstWithdrawal).toBeGreaterThan(
      projection.balanceAtFirstWithdrawal,
    );
    expect(deferred.lifetimeTaxSaved).toBeGreaterThan(projection.lifetimeTaxSaved);
  });
});
