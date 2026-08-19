/**
 * The SRS planner's three ages, and the rules that bind them.
 *
 *   EARLIEST — the customer's locked-in penalty-free age (62/63/64), fixed by
 *              the date of their FIRST contribution. Never derived, never a
 *              constant; it is a property of the customer.
 *   PLANNED  — when they actually take their first withdrawal. That age or
 *              later. It ends accumulation and opens the 10-year window.
 *   UNTIL    — the last age they contribute. Relief runs right up to the first
 *              withdrawal, so this may sit ABOVE the earliest age — but never
 *              at or past the planned one.
 *
 * Split out of `useSrsPlanner` because the constraints between them are the
 * only stateful logic in that hook; everything else there is a `useMemo` over
 * pure lib functions.
 *
 * The clamps run ON THE EVENT, not in an effect — an effect would fight the
 * advisor's own edits, which is the bug `ClientFormModal` shipped.
 */

import { useState } from 'react';
import { num } from '../lib/fields';
import { SRS_DEFAULT_WITHDRAWAL_AGE } from '../lib/srs';

/** Starting values, from the customer's last saved plan. See `lib/srsSeed.ts`. */
export interface SrsAgeSeed {
  withdrawalAge: string;
  startAge: string;
  contributeUntilAge: string;
}

/**
 * Defaults for a customer who has never saved the planner. `contributeUntilAge`
 * is one year short of the first withdrawal — contributing in the year money
 * comes out is not allowed, so this is the latest legal answer.
 */
export const DEFAULT_SRS_AGES: SrsAgeSeed = {
  withdrawalAge: String(SRS_DEFAULT_WITHDRAWAL_AGE),
  startAge: String(SRS_DEFAULT_WITHDRAWAL_AGE),
  contributeUntilAge: String(SRS_DEFAULT_WITHDRAWAL_AGE - 1),
};

export function useSrsAges(seed: SrsAgeSeed = DEFAULT_SRS_AGES) {
  const [withdrawalAge, setWithdrawalAgeState] = useState(seed.withdrawalAge);
  const [startAge, setStartAgeState] = useState(seed.startAge);
  const [contributeUntilAge, setContributeUntilAge] = useState(seed.contributeUntilAge);

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
   * Changing the locked-in age drags the start age up with it — you cannot
   * begin drawing before your own earliest age.
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

  return {
    withdrawalAge,
    startAge,
    contributeUntilAge,
    setWithdrawalAge,
    setStartAge,
    setContributeUntilAge,
  };
}
