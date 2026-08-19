/**
 * What the SRS planner opens on for a given customer.
 *
 * Split out of `useSrsPlanner` when the tool started persisting (2026-08-19):
 * sixteen `useState` initialisers each carrying its own fallback buried the
 * hook's actual subject, which is the four-stage derivation.
 *
 * THE RULE: last saved value, else the statutory default. `''` means this
 * customer has never saved the planner, and the fallback is exactly what the
 * tool opened on before it persisted anything — so adding persistence changed
 * nothing for a customer who has not used it.
 */

import type { CrmClient } from '../../types';
import { seedAge } from './customerSeed';
import { SRS_CAP_CITIZEN, SRS_WITHDRAWAL_WINDOW_YEARS } from './srs';
import { DEFAULT_SRS_AGES } from '../hooks/useSrsAges';

/** One custom period's raw form values. */
export interface PeriodFields {
  amount: string;
  years: string;
}

export const EMPTY_PERIODS: PeriodFields[] = [
  { amount: '60000', years: '5' },
  { amount: '0', years: '0' },
  { amount: '0', years: '0' },
];

const seed = (savedValue: string, fallback: string | number) =>
  savedValue !== '' ? savedValue : String(fallback);

export interface SrsSeedValues {
  currentAge: string;
  annualIncome: string;
  contributionThisYear: string;
  currentBalance: string;
  growthRate: string;
  annualContribution: string;
  contributeUntilAge: string;
  withdrawalAge: string;
  strategy: 'equal' | 'custom';
  balanceOverride: string;
  startAge: string;
  withdrawalYears: string;
  withdrawalGrowth: string;
  otherIncome: string;
  periods: PeriodFields[];
}

export function srsSeedValues(customer: CrmClient, refYear: number): SrsSeedValues {
  const saved = customer.srs;
  return {
    // Age comes from the date of birth, never from a saved copy — one answer to
    // "how old is this customer", so two can never disagree.
    currentAge: String(seedAge(customer.dateOfBirth, refYear)),
    annualIncome: customer.annualIncome || '',
    contributionThisYear: seed(saved.contributionThisYear, SRS_CAP_CITIZEN),
    currentBalance: seed(saved.currentBalance, 0),
    growthRate: seed(saved.growthRate, 4),
    annualContribution: seed(saved.annualContribution, SRS_CAP_CITIZEN),
    contributeUntilAge: seed(saved.contributeUntilAge, DEFAULT_SRS_AGES.contributeUntilAge),
    withdrawalAge: seed(saved.withdrawalAge, DEFAULT_SRS_AGES.withdrawalAge),
    strategy: saved.strategy === 'custom' ? 'custom' : 'equal',
    // No fallback: a blank override MEANS "follow the projection", so never
    // saved and deliberately cleared are the same state here.
    balanceOverride: saved.balanceOverride,
    startAge: seed(saved.startAge, DEFAULT_SRS_AGES.startAge),
    withdrawalYears: seed(saved.withdrawalYears, SRS_WITHDRAWAL_WINDOW_YEARS),
    withdrawalGrowth: seed(saved.withdrawalGrowth, 3),
    otherIncome: seed(saved.otherIncome, 0),
    periods:
      saved.periods && saved.periods.length > 0
        ? saved.periods.map((p) => ({ amount: String(p.amount), years: String(p.years) }))
        : EMPTY_PERIODS,
  };
}
