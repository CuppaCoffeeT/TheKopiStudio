/**
 * Seeding the planning tools from a customer record.
 *
 * The tools pre-fill from the CRM record, but a record can hold values the
 * tools cannot use. This module is the boundary that turns "whatever is stored"
 * into "something a calculator can start from".
 *
 * WHY THIS EXISTS — a real case, caught in the browser 2026-07-28: the
 * `DatePicker`'s `dd/mm/yy` input reads a two-digit "86" as **2086**, so a
 * customer born in 1986 stores a FUTURE date of birth. `ageFromDOB` is a plain
 * year subtraction (`refYear - birthYear`), so it dutifully returned **−60**,
 * and the tax calculator opened with an age of −60. Every relief band then
 * silently took its lowest branch.
 *
 * `ageFromDOB` is golden-locked by the CRM report's oracle tests and is NOT the
 * place to fix this — a nonsense age is a nonsense INPUT, and inputs are
 * validated at the boundary. The century-inference quirk in `DatePicker` is a
 * separate shared-primitive concern and is left alone deliberately.
 */

import { ageFromDOB } from '@/features/crm/lib/finance';

/** The age used when the record holds nothing usable — matches `ageFromDOB`. */
export const DEFAULT_SEED_AGE = 40;

/** Nobody outside this range is a plausible advice subject. */
export const MIN_SEED_AGE = 16;
export const MAX_SEED_AGE = 100;

/**
 * A usable starting age for a planning tool.
 *
 * Falls back to `DEFAULT_SEED_AGE` for a missing, unparseable or impossible
 * date of birth — including the future-DOB case above, which would otherwise
 * produce a negative age. The advisor can always type the real age; what they
 * must never see is a calculator confidently opened on a nonsense one.
 */
export function seedAge(dob: string | null | undefined, refYear: number): number {
  const age = ageFromDOB(dob, refYear);
  if (!Number.isFinite(age) || age < MIN_SEED_AGE || age > MAX_SEED_AGE) {
    return DEFAULT_SEED_AGE;
  }
  return age;
}

/** A non-negative number from a CRM model's form-string numeric field. */
export function seedAmount(value: string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
