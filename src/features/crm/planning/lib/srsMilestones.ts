/**
 * The SRS projection table, reduced to the rows an advisor actually reads.
 *
 * Split from `srs.ts` (which owns the statutory constants and the projection
 * itself) because this is presentation arithmetic, not scheme rules: nothing
 * here changes a balance or a tax figure, it only decides which of the
 * projected years get a row.
 */

import type { ContributionProjection, ContributionYear } from './srs';

/**
 * The ages the projection table shows — today, every fifth birthday after it,
 * and the first-withdrawal age itself. A 45-year run of rows tells an advisor
 * nothing; five or six milestones tell the story.
 */
export function milestoneAges(currentAge: number, startAge: number): number[] {
  const ages = [currentAge];
  for (let age = Math.ceil(currentAge / 5) * 5; age < startAge; age += 5) {
    if (age > currentAge) ages.push(age);
  }
  if (!ages.includes(startAge)) ages.push(startAge);
  return ages;
}

/**
 * The projected years reduced to the milestone rows.
 *
 * The current age never appears — the projection starts at the year AFTER it,
 * which is what the reference table shows and what the balance column means.
 */
export function milestoneRows(
  projection: ContributionProjection,
  currentAge: number,
  startAge: number,
): ContributionYear[] {
  const wanted = new Set(milestoneAges(currentAge, startAge));
  return projection.years.filter((year) => wanted.has(year.age));
}
