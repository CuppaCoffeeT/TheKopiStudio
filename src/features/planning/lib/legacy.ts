/**
 * Legacy Map — estate composition, nominations, and what the law would do if
 * there were no will. Ported from the `legacy_planner_v3` reference.
 *
 * THE POINT OF THE TOOL is the gap between two columns: what the customer
 * thinks happens to their estate, and what the Intestate Succession Act 1967
 * (s.7) actually does if they die without a will. Everything here exists to
 * make that comparison honest.
 *
 * TWO KINDS OF ASSET, and the distinction is load-bearing:
 * - **Nominatable** (CPF, life insurance) pass by NOMINATION, outside the
 *   estate. A will cannot touch them, and neither can the ISA.
 * - **Everything else** falls into the estate and is distributed by the will,
 *   or — with no will — by the ISA.
 *
 * CPF is additionally `forced`: it can ONLY pass by nomination. With no CPF
 * nomination it goes to the Public Trustee, not into the estate. That is why
 * `forced` is a separate flag from `nominatable`.
 *
 * Pure throughout; the caller supplies the reference age so a saved plan
 * re-renders identically later.
 */

/** What an asset is, and how it passes on death. */
export interface AssetType {
  id: string;
  label: string;
  /** Can pass by nomination, outside the estate. */
  nominatable: boolean;
  /** Nomination is the ONLY route — never falls into the estate (CPF). */
  forced: boolean;
  /** Shown on the nomination control, e.g. "CPF Nomination". */
  nominationLabel?: string;
}

export const ASSET_TYPES: readonly AssetType[] = [
  { id: 'cash', label: 'Cash / Bank', nominatable: false, forced: false },
  { id: 'cpf', label: 'CPF', nominatable: true, forced: true, nominationLabel: 'CPF Nomination' },
  { id: 'property', label: 'Property', nominatable: false, forced: false },
  { id: 'investment', label: 'Investments', nominatable: false, forced: false },
  { id: 'insurance', label: 'Life Insurance', nominatable: true, forced: false, nominationLabel: 'Insurance Nomination' },
  { id: 'srs', label: 'SRS', nominatable: false, forced: false },
  { id: 'business', label: 'Business', nominatable: false, forced: false },
  { id: 'other', label: 'Other', nominatable: false, forced: false },
];

export function assetTypeFor(id: string): AssetType {
  return ASSET_TYPES.find((type) => type.id === id) ?? ASSET_TYPES[ASSET_TYPES.length - 1];
}

/** Which generation band a beneficiary sits in — drives the map's layout. */
export type Generation = 'elders' | 'kids' | 'grand' | 'others';

export const GENERATION_LABEL: Record<Generation, string> = {
  elders: 'Elders',
  kids: 'Children',
  grand: 'Grandchildren',
  others: 'Others',
};

/** Relationship options per generation. The ISA reads these strings. */
export const RELATIONSHIPS: Record<Generation, readonly string[]> = {
  elders: ['Father', 'Mother', 'Father-in-law', 'Mother-in-law', 'Grandparent'],
  kids: ['Son', 'Daughter'],
  grand: ['Grandson', 'Granddaughter'],
  others: ['Brother', 'Sister', 'Charity', 'Friend', 'Trustee', 'Other'],
};

export interface Person {
  id: string;
  generation: Generation;
  name: string;
  relationship: string;
  age: number | null;
}

export interface Asset {
  id: string;
  /** An `ASSET_TYPES` id. */
  type: string;
  name: string;
  value: number;
  /** Annual growth as a PERCENTAGE (2.5 = 2.5%), matching the reference's input. */
  growthPct: number;
}

/** One beneficiary's share of one asset, as a percentage of that asset. */
export interface Share {
  personId: string;
  percentage: number;
}

/** Nomination on a nominatable asset — beneficiaries and their percentages. */
export interface Nomination {
  assetId: string;
  shares: Share[];
}

/** Will allocation on a non-nominated asset. */
export interface Allocation {
  assetId: string;
  shares: Share[];
}

export interface LegacyPlan {
  spouseName: string;
  people: Person[];
  assets: Asset[];
  nominations: Nomination[];
  allocations: Allocation[];
}

/** The synthetic id the spouse carries — they are not in the `people` list. */
export const SPOUSE_ID = 'spouse';

const sumShares = (shares: Share[]): number =>
  shares.reduce((total, share) => total + share.percentage, 0);

/**
 * Is this asset actually nominated? A nomination with no beneficiaries, or one
 * summing to zero, is NOT a nomination — the asset still falls to the estate
 * (or, for CPF, to the Public Trustee).
 */
export function isNominated(plan: LegacyPlan, assetId: string): boolean {
  const nomination = plan.nominations.find((n) => n.assetId === assetId);
  if (!nomination) return false;
  return nomination.shares.length > 0 && sumShares(nomination.shares) > 0;
}

export interface EstateTotals {
  /** Every asset, nominated or not. */
  totalEstate: number;
  /** Assets passing by nomination — outside the will and outside the ISA. */
  nominatedTotal: number;
  /** Assets the will (or the ISA) actually governs. */
  distributableTotal: number;
  /** Distributable value covered by a will allocation summing to 100%. */
  allocatedTotal: number;
  /** Distributable value with no (or incomplete) allocation. */
  unallocatedTotal: number;
}

export function estateTotals(plan: LegacyPlan): EstateTotals {
  let totalEstate = 0;
  let nominatedTotal = 0;
  let distributableTotal = 0;
  let allocatedTotal = 0;

  for (const asset of plan.assets) {
    totalEstate += asset.value;
    if (isNominated(plan, asset.id)) {
      nominatedTotal += asset.value;
      continue;
    }
    distributableTotal += asset.value;
    const allocation = plan.allocations.find((a) => a.assetId === asset.id);
    const pct = allocation ? Math.min(sumShares(allocation.shares), 100) : 0;
    allocatedTotal += (asset.value * pct) / 100;
  }

  return {
    totalEstate,
    nominatedTotal,
    distributableTotal,
    allocatedTotal,
    unallocatedTotal: distributableTotal - allocatedTotal,
  };
}

/** Dollar amount each beneficiary receives under the CURRENT plan. */
export function plannedDistribution(plan: LegacyPlan): Record<string, number> {
  const result: Record<string, number> = {};
  const credit = (personId: string, amount: number) => {
    result[personId] = (result[personId] ?? 0) + amount;
  };

  for (const asset of plan.assets) {
    const nominated = isNominated(plan, asset.id);
    const source = nominated
      ? plan.nominations.find((n) => n.assetId === asset.id)
      : plan.allocations.find((a) => a.assetId === asset.id);
    if (!source) continue;
    for (const share of source.shares) {
      credit(share.personId, (asset.value * share.percentage) / 100);
    }
  }
  return result;
}

/** Compound one asset forward. `growthPct` is a percentage, not a fraction. */
export function projectAsset(asset: Asset, years: number): number {
  return asset.value * Math.pow(1 + asset.growthPct / 100, Math.max(years, 0));
}

/** Whole-estate value at a future age. */
export function projectEstate(plan: LegacyPlan, currentAge: number, targetAge: number): number {
  const years = Math.max(targetAge - currentAge, 0);
  return plan.assets.reduce((total, asset) => total + projectAsset(asset, years), 0);
}
