/**
 * All SRS planner state, and the four derived models the panels render.
 *
 * The page used to own this. It stopped fitting once the tool grew a locked-in
 * statutory age, a deferral, and two drawdown strategies — sixteen pieces of
 * form state and a four-stage derivation is a model, not a page.
 *
 * THE CHAIN IS THE POINT. Contributions feed the balance at the statutory age;
 * deferring compounds it further; the drawdown starts from THAT; and the
 * journey reconciles both ends. Contribute more and the drawdown problem gets
 * harder, not easier — which only shows if the stages stay wired together.
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
  deferBalance,
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
  const [contributeUntilAge, setContributeUntilAge] = useState(String(SRS_DEFAULT_WITHDRAWAL_AGE));
  const [withdrawalAge, setWithdrawalAgeState] = useState(String(SRS_DEFAULT_WITHDRAWAL_AGE));

  const [strategy, setStrategy] = useState<WithdrawalStrategy>('equal');
  const [balanceOverride, setBalanceOverride] = useState('');
  const [startAge, setStartAge] = useState(String(SRS_DEFAULT_WITHDRAWAL_AGE));
  const [withdrawalYears, setWithdrawalYears] = useState(String(SRS_WITHDRAWAL_WINDOW_YEARS));
  const [withdrawalGrowth, setWithdrawalGrowth] = useState('3');
  const [otherIncome, setOtherIncome] = useState('0');
  const [periods, setPeriods] = useState<PeriodFields[]>(EMPTY_PERIODS);

  /**
   * Changing the statutory age drags the start age up with it — you cannot
   * begin drawing before your own locked-in age. Done on the event, not in an
   * effect: an effect would fight the advisor's own edits to the start age.
   */
  const setWithdrawalAge = (next: string) => {
    setWithdrawalAgeState(next);
    if (Number(startAge) < Number(next)) setStartAge(next);
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
        withdrawalAge: num(withdrawalAge),
      }),
    [
      currentAge,
      annualIncome,
      contributionThisYear,
      currentBalance,
      growthRate,
      annualContribution,
      contributeUntilAge,
      withdrawalAge,
    ],
  );

  const milestones = useMemo(
    () => milestoneRows(projection, num(currentAge), num(withdrawalAge)),
    [projection, currentAge, withdrawalAge],
  );

  // The drawdown starts from the projection unless the advisor overrides it —
  // the link between the two halves is the tool's whole argument.
  const balanceAtStatutoryAge =
    balanceOverride.trim() === '' ? projection.balanceAtWithdrawalAge : num(balanceOverride);

  const deferral = useMemo(
    () =>
      deferBalance(
        balanceAtStatutoryAge,
        rate(withdrawalGrowth),
        num(startAge) - num(withdrawalAge),
      ),
    [balanceAtStatutoryAge, withdrawalGrowth, startAge, withdrawalAge],
  );

  const plan = useMemo(() => {
    const growth = rate(withdrawalGrowth);
    const amounts =
      strategy === 'custom'
        ? customWithdrawals(
            periods.map((period) => ({ amount: num(period.amount), years: num(period.years) })),
          )
        : equalWithdrawals(deferral.balance, growth, Math.max(1, num(withdrawalYears)));
    return planWithdrawals({
      startingBalance: deferral.balance,
      growthRate: growth,
      otherIncome: num(otherIncome),
      amounts,
      startAge: num(startAge),
    });
  }, [deferral.balance, withdrawalGrowth, otherIncome, withdrawalYears, strategy, periods, startAge]);

  const journey = useMemo(
    () =>
      buildJourney({
        currentAge: num(currentAge),
        withdrawalAge: num(withdrawalAge),
        startAge: num(startAge),
        projection,
        plan,
        deferralGrowth: deferral.growth,
        otherIncome: num(otherIncome),
      }),
    [currentAge, withdrawalAge, startAge, projection, plan, deferral.growth, otherIncome],
  );

  return {
    contribution: {
      values: {
        currentAge, annualIncome, contributionThisYear, currentBalance,
        growthRate, annualContribution, contributeUntilAge, withdrawalAge,
      },
      setters: {
        setCurrentAge, setAnnualIncome, setContributionThisYear, setCurrentBalance,
        setGrowthRate, setAnnualContribution, setContributeUntilAge, setWithdrawalAge,
      },
    },
    withdrawal: {
      values: { balanceOverride, startAge, withdrawalYears, withdrawalGrowth, otherIncome, strategy, periods },
      setters: { setBalanceOverride, setStartAge, setWithdrawalYears, setWithdrawalGrowth, setOtherIncome, setStrategy, setPeriod },
    },
    numbers: {
      currentAge: num(currentAge),
      withdrawalAge: num(withdrawalAge),
      startAge: num(startAge),
      otherIncome: num(otherIncome),
      growthRate: num(growthRate),
      contributionThisYear: num(contributionThisYear),
      periodCount: MAX_WITHDRAWAL_PERIODS,
    },
    projection,
    milestones,
    deferral,
    plan,
    journey,
  };
}
