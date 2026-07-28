/**
 * Reading a stored Legacy Map back into a `LegacyPlan`.
 *
 * The plan is persisted as one JSONB document (`public.legacy_plans.plan`), so
 * what comes back is `unknown` as far as the app is concerned. It is not
 * hostile — RLS means it is the advisor's own row — but it IS untyped, and it
 * can legitimately be OLD: written by an earlier build, before a field existed.
 *
 * So this parser is total. Every branch has a fallback, nothing throws, and a
 * document that is partly unreadable yields the readable part rather than an
 * error screen over a plan the advisor spent an hour building. A dropped
 * malformed asset is recoverable; a crashed page is not.
 *
 * `SCHEMA_VERSION` is stamped on write. When the shape changes, bump it and
 * migrate here on read — the column is indexed for exactly that.
 */

import {
  type Allocation,
  type Asset,
  type Generation,
  type LegacyPlan,
  type Nomination,
  type Person,
  type Share,
} from './legacy';

/** Bump when the document shape changes, and migrate in `parseLegacyPlan`. */
export const SCHEMA_VERSION = 1;

const GENERATIONS: readonly Generation[] = ['elders', 'kids', 'grand', 'others'];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** An empty plan — the shape a brand-new customer starts from. */
export function emptyLegacyPlan(): LegacyPlan {
  return { spouseName: '', people: [], assets: [], nominations: [], allocations: [] };
}

function parseShares(raw: unknown): Share[] {
  const shares: Share[] = [];
  for (const entry of arr(raw)) {
    if (!isRecord(entry)) continue;
    const personId = str(entry.personId);
    if (!personId) continue;
    shares.push({ personId, percentage: num(entry.percentage) });
  }
  return shares;
}

function parsePeople(raw: unknown): Person[] {
  const people: Person[] = [];
  for (const entry of arr(raw)) {
    if (!isRecord(entry)) continue;
    const id = str(entry.id);
    if (!id) continue;
    const generation = GENERATIONS.includes(entry.generation as Generation)
      ? (entry.generation as Generation)
      : 'others';
    people.push({
      id,
      generation,
      name: str(entry.name),
      relationship: str(entry.relationship),
      // `age` is optional in the model and unused by the ISA rules; a stored
      // null must stay null rather than becoming 0, which would read as a
      // newborn.
      age: typeof entry.age === 'number' && Number.isFinite(entry.age) ? entry.age : null,
    });
  }
  return people;
}

function parseAssets(raw: unknown): Asset[] {
  const assets: Asset[] = [];
  for (const entry of arr(raw)) {
    if (!isRecord(entry)) continue;
    const id = str(entry.id);
    if (!id) continue;
    assets.push({
      id,
      // An unknown type id resolves to "other" downstream via `assetTypeFor`,
      // so an old type name degrades to an estate asset rather than crashing.
      type: str(entry.type, 'other'),
      name: str(entry.name),
      value: num(entry.value),
      growthPct: num(entry.growthPct),
    });
  }
  return assets;
}

function parseDirections<T extends Nomination | Allocation>(raw: unknown): T[] {
  const out: T[] = [];
  for (const entry of arr(raw)) {
    if (!isRecord(entry)) continue;
    const assetId = str(entry.assetId);
    if (!assetId) continue;
    out.push({ assetId, shares: parseShares(entry.shares) } as T);
  }
  return out;
}

/**
 * Parse a stored document. Total: anything unreadable becomes an empty plan,
 * and anything partly readable keeps what parsed.
 */
export function parseLegacyPlan(raw: unknown): LegacyPlan {
  if (!isRecord(raw)) return emptyLegacyPlan();

  const plan: LegacyPlan = {
    spouseName: str(raw.spouseName),
    people: parsePeople(raw.people),
    assets: parseAssets(raw.assets),
    nominations: parseDirections<Nomination>(raw.nominations),
    allocations: parseDirections<Allocation>(raw.allocations),
  };

  // Referential integrity: a direction pointing at an asset that no longer
  // exists would silently distribute money nowhere. Drop those on read rather
  // than carrying them into the comparison table.
  const assetIds = new Set(plan.assets.map((a) => a.id));
  plan.nominations = plan.nominations.filter((n) => assetIds.has(n.assetId));
  plan.allocations = plan.allocations.filter((a) => assetIds.has(a.assetId));

  return plan;
}

/** True when the plan holds nothing worth saving. */
export function isEmptyLegacyPlan(plan: LegacyPlan): boolean {
  return (
    plan.spouseName.trim() === '' &&
    plan.people.length === 0 &&
    plan.assets.length === 0
  );
}
