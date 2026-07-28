/**
 * useLegacyPlan — the Legacy Map's state and its mutations.
 *
 * Extracted from `LegacyPlannerPage` (W23 LOC ceiling). The page was carrying
 * eight mutation closures alongside its layout; here they sit beside the shape
 * they mutate, and the page reads as the composition it actually is.
 *
 * REFERENTIAL INTEGRITY is the reason these are not just `setState` calls at
 * the callsite: deleting a person must also strip them out of every nomination
 * and allocation, and deleting an asset must drop its nomination and its
 * allocation. A dangling share would silently distribute money to a
 * beneficiary who is no longer in the plan.
 *
 * Ids are issued from a module counter rather than `crypto.randomUUID()` so
 * the ids stay short and readable in test failures. They ARE persisted (the
 * plan is stored whole), so they only need to be unique within one plan —
 * which a monotonic counter guarantees for a single editing session, and a
 * reload re-reads whatever was saved.
 *
 * SEEDING: the caller passes the initial plan and must not change it
 * afterwards. There is deliberately NO re-seed effect — `ClientFormModal`
 * shipped exactly that bug (an `[open, client]` effect that re-fired on a
 * background refetch and silently clobbered in-flight edits; see
 * `ClientDetailPage`'s note). The page therefore waits for the stored plan to
 * settle before mounting the editor at all.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  assetTypeFor,
  RELATIONSHIPS,
  type Asset,
  type Generation,
  type LegacyPlan,
  type Person,
} from './legacy';

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${(idCounter += 1)}`;

export interface LegacyPlanSeed {
  bankBalance: number;
  cpfTotal: number;
}

/** A customer's starting plan — their bank balance and CPF, nothing assumed. */
export function seedPlan({ bankBalance, cpfTotal }: LegacyPlanSeed): LegacyPlan {
  const assets: Asset[] = [];
  if (bankBalance > 0) {
    assets.push({ id: nextId('a'), type: 'cash', name: 'Bank balances', value: bankBalance, growthPct: 1.5 });
  }
  if (cpfTotal > 0) {
    assets.push({ id: nextId('a'), type: 'cpf', name: 'CPF balances', value: cpfTotal, growthPct: 4 });
  }
  return { spouseName: '', people: [], assets, nominations: [], allocations: [] };
}

export function useLegacyPlan(initialPlan: LegacyPlan) {
  const [plan, setPlan] = useState<LegacyPlan>(initialPlan);

  // The last plan known to match storage. Compared structurally rather than by
  // reference: every mutation below builds a new object, so identity would
  // report "dirty" for a change-and-change-back.
  const savedSnapshot = useRef(JSON.stringify(initialPlan));
  const isDirty = JSON.stringify(plan) !== savedSnapshot.current;

  /** Call after a successful save so the plan reads clean again. */
  const markSaved = useCallback((saved: LegacyPlan) => {
    savedSnapshot.current = JSON.stringify(saved);
  }, []);

  const setSpouseName = useCallback((spouseName: string) => {
    setPlan((prev) => ({ ...prev, spouseName }));
  }, []);

  const addPerson = useCallback((generation: Generation) => {
    setPlan((prev) => ({
      ...prev,
      people: [
        ...prev.people,
        {
          id: nextId('p'),
          generation,
          name: '',
          relationship: RELATIONSHIPS[generation][0],
          age: null,
        } satisfies Person,
      ],
    }));
  }, []);

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    setPlan((prev) => ({
      ...prev,
      people: prev.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  /** Removing a person also strips every share they held — no dangling shares. */
  const removePerson = useCallback((id: string) => {
    setPlan((prev) => ({
      ...prev,
      people: prev.people.filter((p) => p.id !== id),
      nominations: prev.nominations.map((n) => ({
        ...n,
        shares: n.shares.filter((s) => s.personId !== id),
      })),
      allocations: prev.allocations.map((a) => ({
        ...a,
        shares: a.shares.filter((s) => s.personId !== id),
      })),
    }));
  }, []);

  const addAsset = useCallback(() => {
    setPlan((prev) => ({
      ...prev,
      assets: [...prev.assets, { id: nextId('a'), type: 'cash', name: '', value: 0, growthPct: 0 }],
    }));
  }, []);

  const updateAsset = useCallback((id: string, patch: Partial<Asset>) => {
    setPlan((prev) => ({
      ...prev,
      assets: prev.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);

  /** Removing an asset drops its nomination and its allocation with it. */
  const removeAsset = useCallback((id: string) => {
    setPlan((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== id),
      nominations: prev.nominations.filter((n) => n.assetId !== id),
      allocations: prev.allocations.filter((a) => a.assetId !== id),
    }));
  }, []);

  /**
   * Give one beneficiary the whole of one asset. Which list it lands in is
   * decided by the asset TYPE, not by the caller: a nominatable asset can only
   * be directed by nomination, and everything else only by the will.
   */
  const assignWholeAsset = useCallback((assetId: string, personId: string) => {
    setPlan((prev) => {
      const type = assetTypeFor(prev.assets.find((a) => a.id === assetId)?.type ?? 'other');
      const key = type.nominatable ? 'nominations' : 'allocations';
      return {
        ...prev,
        [key]: [
          ...prev[key].filter((entry) => entry.assetId !== assetId),
          ...(personId ? [{ assetId, shares: [{ personId, percentage: 100 }] }] : []),
        ],
      };
    });
  }, []);

  const currentAssignee = useCallback(
    (assetId: string): string => {
      const type = assetTypeFor(plan.assets.find((a) => a.id === assetId)?.type ?? 'other');
      const entry = type.nominatable
        ? plan.nominations.find((n) => n.assetId === assetId)
        : plan.allocations.find((a) => a.assetId === assetId);
      return entry?.shares[0]?.personId ?? '';
    },
    [plan],
  );

  /** Everyone who can receive a share — the spouse plus every named person. */
  const beneficiaries = useMemo(
    () => [
      ...(plan.spouseName.trim() ? [{ id: 'spouse', label: plan.spouseName }] : []),
      ...plan.people.filter((p) => p.name.trim()).map((p) => ({ id: p.id, label: p.name })),
    ],
    [plan.spouseName, plan.people],
  );

  return {
    plan,
    isDirty,
    markSaved,
    beneficiaries,
    setSpouseName,
    addPerson,
    updatePerson,
    removePerson,
    addAsset,
    updateAsset,
    removeAsset,
    assignWholeAsset,
    currentAssignee,
  };
}
