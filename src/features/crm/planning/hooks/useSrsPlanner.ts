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
import { seedAge } from '../lib/customerSeed';
import { num, rate } from '../lib/fields';
import { milestoneRows } from '../lib/srsMilestones';
import {
  projectContributions,
  SRS_CAP_CITIZEN,
  SRS_WITHDRAWAL_WINDOW_YEARS,
} from '../lib/srs';
import { buildJourney } from '../lib/srsJourney';
import {
  customWithdrawals,
  equalWithdrawals,
  MAX_WITHDRAWAL_PERIODS,
} from '../lib/srsSchedules';
import { planWithdrawals } from '../lib/srsWithdrawals';
import { useSrsAges } from './useSrsAges';

export type WithdrawalStrategy = 'equal' | 'custom';

/** One custom period's raw form values. */
export interface PeriodFields {
  amount: string;
  years: string;
}

const EMPTY_PERIODS: PeriodFields[] = [
  { amount: '60000', years: '5' },
  { amount: '0', years: '0' },
  { amount: '0', years: '0' },
];

export function useSrsPlanner(customer: CrmClient, refYear: number) {
  const [currentAge, setCurrentAge] = useState(() => String(seedAge(customer.dateOfBirth, refYear)));
  const [annualIncome, setAnnualIncome] = useState(() => customer.annualIncome || '');
  const [contributionThisYear, setContributionThisYear] = useState(String(SRS_CAP_CITIZEN));
  const [currentBalance, setCurrentBalance] = useState('0');
  const [growthRate, setGrowthRate] = useState('4');
  const [annualContribution, setAnnualContribution] = useState(String(SRS_CAP_CITIZEN));

  // The three ages and the constraints between them — see `useSrsAges`.
  const {
    withdrawalAge, startAge, contributeUntilAge,
    setWithdrawalAge, setStartAge, setContributeUntilAge,
  } = useSrsAges();

  const [strategy, setStrategy] = useState<WithdrawalStrategy>('equal');
  const [balanceOverride, setBalanceOverride] = useState('');
  const [withdrawalYears, setWithdrawalYears] = useState(String(SRS_WITHDRAWAL_WINDOW_YEARS));
  const [withdrawalGrowth, setWithdrawalGrowth] = useState('3');
  const [otherIncome, setOtherIncome] = useState('0');
  const [periods, setPeriods] = useState<PeriodFields[]>(EMPTY_PERIODS);

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
  };
}
