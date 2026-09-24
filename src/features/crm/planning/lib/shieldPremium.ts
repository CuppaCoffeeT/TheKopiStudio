/**
 * Shield premium arithmetic — what each plan costs at one age next birthday,
 * and how much of it Medisave absorbs.
 *
 * Faithful port of `calc()` in the advisor's `shield-comparison.html`. The
 * Medisave share is MediShield Life in full plus the private plan up to the
 * Additional Withdrawal Limit; riders are cash only on both insurers.
 */

import { CANCER_COVER_PLUS, INCOME_BANDS, SINGLIFE_BASE, SINGLIFE_RIDER } from './shieldRates';

export const SHIELD_MIN_AGE = 1;
export const SHIELD_MAX_AGE = 100;
/** Last entry age on both insurers; above this a policy is renewal only. */
export const SHIELD_LAST_ENTRY_AGE = 75;

export interface PlanPremium {
  /** MediShield Life. */
  medishield: number;
  /** The private Integrated Shield plan. */
  plan: number;
  rider: number;
  total: number;
  /** Paid from Medisave. */
  medisave: number;
  /** Paid in cash after Medisave. */
  cash: number;
}

export interface ShieldPremium {
  /** Income's band label, e.g. "36 to 40". */
  band: string;
  singlife: PlanPremium & { riderWithNcd: number };
  income: PlanPremium;
  cancerCoverPlus: number;
}

/** Clamp any input to a whole age the tables cover. Blank or junk reads as 1. */
export function clampShieldAge(value: number): number {
  return Math.max(SHIELD_MIN_AGE, Math.min(SHIELD_MAX_AGE, Math.round(value) || SHIELD_MIN_AGE));
}

function incomeBand(age: number) {
  let band = INCOME_BANDS[0];
  for (const row of INCOME_BANDS) if (age >= row[0]) band = row;
  return band;
}

export function shieldPremium(rawAge: number): ShieldPremium {
  const age = clampShieldAge(rawAge);
  const [medishield, plan, awl] = SINGLIFE_BASE[age - 1];
  const [rider, riderWithNcd] = SINGLIFE_RIDER[age - 1];
  const [, band, inMedishield, inAwl, inPlan, inRider] = incomeBand(age);

  const slTotal = medishield + plan + rider;
  const slMedisave = medishield + Math.min(plan, awl);
  const inTotal = inMedishield + inPlan + inRider;
  const inMedisave = inMedishield + Math.min(inPlan, inAwl);

  return {
    band,
    singlife: {
      medishield,
      plan,
      rider,
      riderWithNcd,
      total: slTotal,
      medisave: slMedisave,
      cash: slTotal - slMedisave,
    },
    income: {
      medishield: inMedishield,
      plan: inPlan,
      rider: inRider,
      total: inTotal,
      medisave: inMedisave,
      cash: inTotal - inMedisave,
    },
    cancerCoverPlus: CANCER_COVER_PLUS[age - 1],
  };
}

/** The sheet's own opening age, used when no customer (or no usable DOB) is chosen. */
export const SHIELD_DEFAULT_AGE = 36;

/**
 * Age NEXT birthday — what both insurers price on — from `yyyy-mm-dd` strings.
 * `today` is injected (SGT, via `timezoneUtils`) so this stays pure. Returns
 * null when the DOB is missing, unparseable, or lands outside the tables, and
 * the tool then opens on `SHIELD_DEFAULT_AGE`.
 */
export function ageNextBirthday(dob: string | null | undefined, today: string): number | null {
  const born = /^(\d{4})-(\d{2})-(\d{2})/.exec(dob ?? '');
  const now = /^(\d{4})-(\d{2})-(\d{2})/.exec(today);
  if (!born || !now) return null;
  const hadBirthday = `${now[2]}${now[3]}` >= `${born[2]}${born[3]}`;
  const anb = Number(now[1]) - Number(born[1]) - (hadBirthday ? 0 : 1) + 1;
  return anb >= SHIELD_MIN_AGE && anb <= SHIELD_MAX_AGE ? anb : null;
}
