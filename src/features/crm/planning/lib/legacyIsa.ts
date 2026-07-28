/**
 * Intestate Succession Act 1967, s.7 — what the law does with an estate when
 * there is no will.
 *
 * Split from `legacy.ts` (W23 LOC ceiling) along the seam that was already
 * there: that file models the estate, this one models the statute. The two are
 * read together by the Legacy Map's comparison panel, which is the whole point
 * of the tool — the gap between the plan and the default.
 */

import {
  estateTotals,
  isNominated,
  plannedDistribution,
  SPOUSE_ID,
  type LegacyPlan,
  type Person,
} from './legacy';

export interface IsaRule {
  number: string;
  condition: string;
  distribution: string;
}

/**
 * The nine rules, in statutory order. Rules 8 and 9 are reachable in the law
 * but not modelled from the people list — the tool does not collect aunts,
 * uncles or "no relatives at all", so the fallback lands on Rule 9.
 */
export const ISA_RULES: readonly IsaRule[] = [
  { number: 'Rule 1', condition: 'Spouse only (no children, no parents)', distribution: '100% to spouse' },
  { number: 'Rule 2', condition: 'Spouse + children', distribution: '50% spouse, 50% split equally among children' },
  { number: 'Rule 3', condition: 'Children only (no spouse)', distribution: '100% split equally among children (per stirpes)' },
  { number: 'Rule 4', condition: 'Spouse + parent(s), no children', distribution: '50% spouse, 50% split equally among parents' },
  { number: 'Rule 5', condition: 'Parent(s) only', distribution: '100% split equally among parents' },
  { number: 'Rule 6', condition: 'Siblings only', distribution: '100% split equally among siblings (per stirpes)' },
  { number: 'Rule 7', condition: 'Grandparents only', distribution: '100% split equally among grandparents' },
  { number: 'Rule 8', condition: 'Aunts & uncles only', distribution: '100% split equally' },
  { number: 'Rule 9', condition: 'No qualifying relatives', distribution: '100% to the Government (bona vacantia)' },
];

const named = (person: Person): boolean => person.name.trim().length > 0;

export interface IsaResult {
  rule: IsaRule;
  /** Beneficiary id → dollar amount. Empty under Rule 9. */
  distribution: Record<string, number>;
  /** What the ISA actually governs — nominated assets are excluded. */
  distributable: number;
}

/**
 * Apply the ISA to the estate the law would actually reach.
 *
 * Only BIOLOGICAL/ADOPTIVE parents count under the Act — in-laws and
 * grandparents are excluded from the "parents" test even though the tool files
 * them all under Elders. Siblings live under Others. Getting this wrong would
 * silently hand the estate to the wrong branch of the family, which is the one
 * mistake this tool exists to prevent.
 */
export function calculateIsaDistribution(plan: LegacyPlan): IsaResult {
  const distributable = plan.assets
    .filter((asset) => !isNominated(plan, asset.id))
    .reduce((total, asset) => total + asset.value, 0);

  const hasSpouse = plan.spouseName.trim().length > 0;
  const kids = plan.people.filter((p) => p.generation === 'kids' && named(p));
  const parents = plan.people.filter(
    (p) => p.generation === 'elders' && named(p) && /^(Father|Mother)$/.test(p.relationship),
  );
  const siblings = plan.people.filter(
    (p) => p.generation === 'others' && named(p) && /^(Brother|Sister)$/.test(p.relationship),
  );
  const grandparents = plan.people.filter(
    (p) => p.generation === 'elders' && named(p) && p.relationship === 'Grandparent',
  );

  const distribution: Record<string, number> = {};
  const splitEqually = (people: Person[], amount: number) => {
    const each = amount / people.length;
    for (const person of people) distribution[person.id] = each;
  };

  // First match wins — the rules are mutually exclusive in statutory order.
  if (hasSpouse && kids.length === 0 && parents.length === 0) {
    distribution[SPOUSE_ID] = distributable;
    return { rule: ISA_RULES[0], distribution, distributable };
  }
  if (hasSpouse && kids.length > 0) {
    distribution[SPOUSE_ID] = distributable * 0.5;
    splitEqually(kids, distributable * 0.5);
    return { rule: ISA_RULES[1], distribution, distributable };
  }
  if (!hasSpouse && kids.length > 0) {
    splitEqually(kids, distributable);
    return { rule: ISA_RULES[2], distribution, distributable };
  }
  if (hasSpouse && kids.length === 0 && parents.length > 0) {
    distribution[SPOUSE_ID] = distributable * 0.5;
    splitEqually(parents, distributable * 0.5);
    return { rule: ISA_RULES[3], distribution, distributable };
  }
  if (!hasSpouse && kids.length === 0 && parents.length > 0) {
    splitEqually(parents, distributable);
    return { rule: ISA_RULES[4], distribution, distributable };
  }
  if (!hasSpouse && kids.length === 0 && parents.length === 0 && siblings.length > 0) {
    splitEqually(siblings, distributable);
    return { rule: ISA_RULES[5], distribution, distributable };
  }
  if (
    !hasSpouse &&
    kids.length === 0 &&
    parents.length === 0 &&
    siblings.length === 0 &&
    grandparents.length > 0
  ) {
    splitEqually(grandparents, distributable);
    return { rule: ISA_RULES[6], distribution, distributable };
  }
  return { rule: ISA_RULES[8], distribution, distributable };
}



export interface PlanningGap {
  /** Total reaching the people the customer actually named. */
  withPlanning: number;
  /** Total those same people receive if the ISA runs instead. */
  withoutPlanning: number;
  /** Positive when planning helps the named beneficiaries. */
  difference: number;
}

/**
 * The headline comparison: what the named beneficiaries get under the plan
 * versus under intestacy. Nominated assets count on BOTH sides — a nomination
 * survives intestacy, which is exactly why nominating matters.
 */
export function planningGap(plan: LegacyPlan): PlanningGap {
  const planned = plannedDistribution(plan);
  const isa = calculateIsaDistribution(plan);
  const nominatedTotal = estateTotals(plan).nominatedTotal;

  const withPlanning = Object.values(planned).reduce((sum, value) => sum + value, 0);
  const withoutPlanning =
    Object.values(isa.distribution).reduce((sum, value) => sum + value, 0) + nominatedTotal;

  return { withPlanning, withoutPlanning, difference: withPlanning - withoutPlanning };
}
