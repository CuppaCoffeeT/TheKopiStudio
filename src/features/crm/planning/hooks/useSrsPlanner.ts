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
 * Everything is a string because everything is an `<input>`; the coercion to
 * numbers happens once, here, at the boundary of the pure lib functions.
 */

import { useMemo, useState } from 'react';
import type { CrmClient } from '../../types';
import { seedAge } from '../lib/customerSeed';
import {
  milestoneRows,
  projectContributions,
  SRS_CAP_CITIZEN,
  SRS_DEFAULT_WITHDRAWAL_AGE,
  SRS_WITHDRAWAL_WINDOW_YEARS,
} from '../lib/srs';
import { buildJourney } from '../lib/srsJourney';
import {
  customWithdrawals,
  equalWithdrawals,
  MAX_WITHDRAWAL_PERIODS,
} from '../lib/srsSchedules';
import { planWithdrawals } from '../lib/srsWithdrawals';

export type WithdrawalStrategy = 'equal' | 'custom';

/** One custom period's raw form values. */
export interface PeriodFields {
  amount: string;
  years: string;
}

const num = (value: string) => Number(value) || 0;
const rate = (value: string) => num(value) / 100;

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
  // One year short of the first withdrawal — contributing in the year money
  // comes out is not allowed, so the default is the latest legal answer.
  const [contributeUntilAge, setContributeUntilAge] = useState(
    String(SRS_DEFAULT_WITHDRAWAL_AGE - 1),
  );
  const [withdrawalAge, setWithdrawalAgeState] = useState(String(SRS_DEFAULT_WITHDRAWAL_AGE));
  const [startAge, setStartAgeState] = useState(String(SRS_DEFAULT_WITHDRAWAL_AGE));

  const [strategy, setStrategy] = useState<WithdrawalStrategy>('equal');
  const [balanceOverride, setBalanceOverride] = useState('');
  const [withdrawalYears, setWithdrawalYears] = useState(String(SRS_WITHDRAWAL_WINDOW_YEARS));
  const [withdrawalGrowth, setWithdrawalGrowth] = useState('3');
  const [otherIncome, setOtherIncome] = useState('0');
  const [periods, setPeriods] = useState<PeriodFields[]>(EMPTY_PERIODS);

  /**
   * Contributions must stop before the first withdrawal, so raising the start
   * age is free but lowering it drags the contribution cut-off down with it.
   *
   * Only fires for a start age at or past the locked-in one. The reference
   * clamps on every keystroke, which eats the field while a two-digit age is
   * half typed ("6" would push the cut-off to 5); ignoring implausible values
   * costs nothing, since `projectContributions` refuses to contribute in or
   * after the withdrawal year regardless.
   */
  const clampContributeUntil = (firstWithdrawalAge: number, floor: number) => {
    if (firstWithdrawalAge < floor) return;
    setContributeUntilAge((current) =>
      num(current) > firstWithdrawalAge - 1 ? String(firstWithdrawalAge - 1) : current,
    );
  };

  /**
   * Changing the statutory age drags the start age up with it — you cannot
   * begin drawing before your own locked-in age. Done on the event, not in an
   * effect: an effect would fight the advisor's own edits to the start age.
   */
  const setWithdrawalAge = (next: string) => {
    setWithdrawalAgeState(next);
    const floor = num(next);
    const first = Math.max(num(startAge), floor);
    if (first !== num(startAge)) setStartAgeState(String(first));
    clampContributeUntil(first, floor);
  };

  const setStartAge = (next: string) => {
    setStartAgeState(next);
    clampContributeUntil(num(next), num(withdrawalAge));
  };

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
