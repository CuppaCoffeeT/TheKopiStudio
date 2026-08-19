/**
 * All SRS planner state, and the three derived models the panels render.
 *
 * The page used to own this. It stopped fitting once the tool grew a locked-in
 * statutory age, a planned start age, and two drawdown strategies — sixteen
 * pieces of form state and a multi-stage derivation is a model, not a page.
 *
 * THE CHAIN IS THE POINT. Contributions run all the way to the PLANNED FIRST
 * WITHDRAWAL — deferring buys both compounding and more years of relief — the
 * drawdown starts from that balance, and the journey reconciles both ends.
 * Contribute more and the drawdown problem gets harder, not easier, which only
 * shows if the stages stay wired together.
 *
 * Everything is a string because everything is an `<input>`; `lib/fields`
 * coerces at the boundary of the pure lib functions. The three ages and the
 * constraints between them live in `useSrsAges` — they are the only stateful
 * logic here; the rest is a `useMemo` over pure functions.
 */

import { useMemo, useState } from 'react';
import type { CrmClient } from '../../types';
import { num, rate } from '../lib/fields';
import { milestoneRows } from '../lib/srsMilestones';
import { projectContributions } from '../lib/srs';
import { srsSeedValues, type PeriodFields } from '../lib/srsSeed';
export type { PeriodFields };
import { buildJourney } from '../lib/srsJourney';
import {
  customWithdrawals,
  equalWithdrawals,
  MAX_WITHDRAWAL_PERIODS,
} from '../lib/srsSchedules';
import { planWithdrawals } from '../lib/srsWithdrawals';
import { useSrsAges } from './useSrsAges';

export type WithdrawalStrategy = 'equal' | 'custom';

export function useSrsPlanner(customer: CrmClient, refYear: number) {
  // Seeds live in lib/srsSeed.ts — "last saved, else the statutory default".
  const init = srsSeedValues(customer, refYear);

  const [currentAge, setCurrentAge] = useState(init.currentAge);
  const [annualIncome, setAnnualIncome] = useState(init.annualIncome);
  const [contributionThisYear, setContributionThisYear] = useState(init.contributionThisYear);
  const [currentBalance, setCurrentBalance] = useState(init.currentBalance);
  const [growthRate, setGrowthRate] = useState(init.growthRate);
  const [annualContribution, setAnnualContribution] = useState(init.annualContribution);

  // The three ages and the constraints between them — see `useSrsAges`.
  const {
    withdrawalAge, startAge, contributeUntilAge,
    setWithdrawalAge, setStartAge, setContributeUntilAge,
  } = useSrsAges(init);

  const [strategy, setStrategy] = useState<WithdrawalStrategy>(init.strategy);
  const [balanceOverride, setBalanceOverride] = useState(init.balanceOverride);
  const [withdrawalYears, setWithdrawalYears] = useState(init.withdrawalYears);
  const [withdrawalGrowth, setWithdrawalGrowth] = useState(init.withdrawalGrowth);
  const [otherIncome, setOtherIncome] = useState(init.otherIncome);
  const [periods, setPeriods] = useState<PeriodFields[]>(init.periods);

  const setPeriod = (index: number, field: keyof PeriodFields, value: string) => {
    setPeriods((current) =>
      current.map((period, i) => (i === index ? { ...period, [field]: value } : period)),
    );
  };

  const projection = useMemo(
    () =>
      projectContributions({
        currentAge: num(currentAge),
        annualIncome: num(annualIncome),
        contributionThisYear: num(contributionThisYear),
        currentBalance: num(currentBalance),
        growthRate: rate(growthRate),
        annualContribution: num(annualContribution),
        contributeUntilAge: num(contributeUntilAge),
        startAge: num(startAge),
      }),
    [
      currentAge,
      annualIncome,
      contributionThisYear,
      currentBalance,
      growthRate,
      annualContribution,
      contributeUntilAge,
      startAge,
    ],
  );

  const milestones = useMemo(
    () => milestoneRows(projection, num(currentAge), num(startAge)),
    [projection, currentAge, startAge],
  );

  // The drawdown starts from the projection unless the advisor overrides it —
  // the link between the two halves is the tool's whole argument. Both are the
  // balance at the FIRST WITHDRAWAL; nothing is compounded between them.
  const balanceAtFirstWithdrawal =
    balanceOverride.trim() === '' ? projection.balanceAtFirstWithdrawal : num(balanceOverride);

  const plan = useMemo(() => {
    const growth = rate(withdrawalGrowth);
    const amounts =
      strategy === 'custom'
        ? customWithdrawals(
            periods.map((period) => ({ amount: num(period.amount), years: num(period.years) })),
          )
        : equalWithdrawals(balanceAtFirstWithdrawal, growth, Math.max(1, num(withdrawalYears)));
    return planWithdrawals({
      startingBalance: balanceAtFirstWithdrawal,
      growthRate: growth,
      otherIncome: num(otherIncome),
      amounts,
      startAge: num(startAge),
    });
  }, [
    balanceAtFirstWithdrawal,
    withdrawalGrowth,
    otherIncome,
    withdrawalYears,
    strategy,
    periods,
    startAge,
  ]);

  const journey = useMemo(
    () =>
      buildJourney({
        currentAge: num(currentAge),
        withdrawalAge: num(withdrawalAge),
        startAge: num(startAge),
        projection,
        plan,
        otherIncome: num(otherIncome),
      }),
    [currentAge, withdrawalAge, startAge, projection, plan, otherIncome],
  );

  /** Last age a contribution is actually made, after the start-age cut-off. */
  const lastContributionAge = Math.min(num(contributeUntilAge), num(startAge) - 1);

  return {
    contribution: {
      values: {
        currentAge, annualIncome, contributionThisYear, currentBalance,
        growthRate, annualContribution, contributeUntilAge, withdrawalAge, startAge,
      },
      setters: {
        setCurrentAge, setAnnualIncome, setContributionThisYear, setCurrentBalance,
        setGrowthRate, setAnnualContribution, setContributeUntilAge, setWithdrawalAge, setStartAge,
      },
    },
    withdrawal: {
      values: { balanceOverride, withdrawalYears, withdrawalGrowth, otherIncome, strategy, periods },
      setters: { setBalanceOverride, setWithdrawalYears, setWithdrawalGrowth, setOtherIncome, setStrategy, setPeriod },
    },
    numbers: {
      currentAge: num(currentAge),
      withdrawalAge: num(withdrawalAge),
      startAge: num(startAge),
      otherIncome: num(otherIncome),
      growthRate: num(growthRate),
      contributionThisYear: num(contributionThisYear),
      lastContributionAge,
      /** Years the pot compounds untouched after the last contribution. */
      idleYears: Math.max(0, num(startAge) - 1 - num(contributeUntilAge)),
      periodCount: MAX_WITHDRAWAL_PERIODS,
    },
    projection,
    milestones,
    plan,
    journey,
    /**
     * Everything the Save button sends. Built here, not in the page: the page
     * never sees the individual strings, and a field added to the hook would
     * otherwise silently stop being saved.
     */
    saveInput: {
      annualIncome,
      currentBalance,
      contributionThisYear,
      annualContribution,
      growthRate,
      contributeUntilAge,
      withdrawalAge,
      strategy,
      balanceOverride,
      startAge,
      withdrawalYears,
      withdrawalGrowth,
      otherIncome,
      // Coerced here so the column stores numbers, not the form's strings.
      periods: periods.map((p) => ({ amount: num(p.amount), years: num(p.years) })),
    },
  };
}
