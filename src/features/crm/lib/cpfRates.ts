/**
 * Statutory CPF rates — contribution rate and account allocation by age.
 *
 * Split from `cpfContributions.ts` (W23 LOC ceiling) along the obvious seam:
 * these are LOOKUP TABLES published by CPF, while that file is the simulation
 * that consumes them. When CPF revises its rates, this is the only file that
 * changes.
 *
 * Values are the reference CRM's own (official 2026 data), kept verbatim — a
 * "corrected" rate that disagrees with the advisor's spreadsheet costs more
 * trust than it buys.
 */

/** Ordinary Wage ceiling — contributions are computed on capped monthly pay. */
export const MONTHLY_SALARY_CAP = 8_000;

/** Total (employer + employee) CPF contribution rate for an age. */
export function cpfContributionRate(age: number): number {
  if (age <= 55) return 0.37;
  if (age <= 60) return 0.34;
  if (age <= 65) return 0.25;
  if (age <= 70) return 0.165;
  return 0.125;
}

/**
 * How a contribution splits across accounts. Above 55 the `sa` share becomes
 * `ra` (Retirement Account) — modelled for completeness, though a projection
 * that runs TO 55 never reaches those bands.
 */
export interface CpfAllocation {
  oa: number;
  sa: number;
  ma: number;
  /** True once the SA share is really going to the Retirement Account. */
  toRetirementAccount: boolean;
}

export function cpfAllocation(age: number): CpfAllocation {
  if (age <= 35) return { oa: 0.6217, sa: 0.1621, ma: 0.2162, toRetirementAccount: false };
  if (age <= 45) return { oa: 0.5677, sa: 0.1891, ma: 0.2432, toRetirementAccount: false };
  if (age <= 50) return { oa: 0.5136, sa: 0.2162, ma: 0.2702, toRetirementAccount: false };
  if (age <= 55) return { oa: 0.4055, sa: 0.3108, ma: 0.2837, toRetirementAccount: false };
  if (age <= 60) return { oa: 0.353, sa: 0.3382, ma: 0.3088, toRetirementAccount: true };
  if (age <= 65) return { oa: 0.14, sa: 0.44, ma: 0.42, toRetirementAccount: true };
  if (age <= 70) return { oa: 0.0607, sa: 0.303, ma: 0.6363, toRetirementAccount: true };
  return { oa: 0.08, sa: 0.08, ma: 0.84, toRetirementAccount: true };
}

