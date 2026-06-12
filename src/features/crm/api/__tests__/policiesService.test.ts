/**
 * policiesService unit tests (mocked supabase chain) — corrected legacy bug 4:
 * projections replace de-dups by age (keep-LAST), inserts sorted, surfaces
 * every error; soft-deleting a policy cascades to its projections; reads
 * carry the soft-delete filter.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CrmPolicyInput, PolicyRow, ProjectedCashValueRow } from '../../types';
import {
  createPolicy,
  dedupeProjectionRows,
  listPoliciesByClient,
  replaceProjections,
  softDeletePolicy,
  updatePolicy,
} from '../policiesService';
import {
  calledWith,
  callsOf,
  createBuilder,
  expectSoftDeleteFilter,
  wireFromQueue,
  type FromQueue,
} from './supabaseMock';

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }));

const input = {
  type: 'Whole Life',
  provider: 'Great Eastern',
  policyNumber: 'WL-100',
  premium: '250',
  frequency: 'Monthly',
  coverageAmount: '500000',
  tpdCoverage: '500000',
  tpdSameAsDeath: true,
  criticalIllnessCoverage: '100000',
  ciNotes: '',
  earlyCriticalIllnessCoverage: '0',
  eciNotes: '',
  startDate: '2024-01-01',
  endDate: '',
  status: 'Active',
  hasCashValue: true,
  currentCashValue: '12000',
  projectedCashValue: [
    { age: 65, value: '200000' },
    { age: 55, value: '100000' },
    { age: 65, value: '210000' },
  ],
  isInvestmentLinked: false,
  currentAccountValue: '',
  investmentAllocation: '',
  illustratedValueAge55: '',
  illustratedValueAge65: '',
  ilpPremiumInclusionPercent: '0',
  isHospitalization: false,
  hospitalType: 'Private',
  integratedShieldCPF: '',
  integratedShieldCash: '',
  riderCash: '',
} satisfies CrmPolicyInput;

let from: FromQueue;
beforeEach(() => {
  fromMock.mockReset();
  from = wireFromQueue(fromMock);
});

describe('listPoliciesByClient', () => {
  it('filters soft-deleted rows on BOTH reads and embeds age-sorted projections', async () => {
    const policies = createBuilder({
      data: [{ id: 'p1', type: 'Whole Life' }, { id: 'p2', type: 'Term Life' }] as PolicyRow[],
    });
    const projections = createBuilder({
      data: [
        { id: 'v1', policy_id: 'p1', age: 65, value: 210000 },
        { id: 'v2', policy_id: 'p1', age: 55, value: 100000 },
      ] as ProjectedCashValueRow[],
    });
    from.enqueue(policies, projections);

    const models = await listPoliciesByClient('client-1');

    expectSoftDeleteFilter(policies);
    expectSoftDeleteFilter(projections);
    expect(calledWith(policies, 'order', 'created_at', { ascending: true })).toBe(true);
    expect(calledWith(policies, 'limit', 1000)).toBe(true);
    expect(calledWith(projections, 'in', 'policy_id', ['p1', 'p2'])).toBe(true);
    expect(models[0].projectedCashValue).toEqual([
      { age: 55, value: '100000' },
      { age: 65, value: '210000' },
    ]);
    expect(models[1].projectedCashValue).toEqual([]);
  });

  it('skips the projections read for an empty book', async () => {
    from.enqueue(createBuilder({ data: [] }));
    expect(await listPoliciesByClient('client-1')).toEqual([]);
    expect(from.tables).toEqual(['policies']);
  });
});

describe('replaceProjections', () => {
  it('de-dups by age keeping the LAST entry and inserts sorted by age', async () => {
    expect(dedupeProjectionRows(input.projectedCashValue)).toEqual([
      { age: 55, value: 100000 },
      { age: 65, value: 210000 },
    ]);

    const remove = createBuilder({ data: [{ id: 'v1' }] });
    const insert = createBuilder({});
    from.enqueue(remove, insert);

    await replaceProjections('p1', input.projectedCashValue, 'user-1');

    expect(callsOf(remove, 'delete')).toHaveLength(1);
    expect(calledWith(remove, 'eq', 'policy_id', 'p1')).toBe(true);
    expect(calledWith(remove, 'select', 'id')).toBe(true);
    expect(callsOf(insert, 'insert')[0][0]).toEqual([
      { age: 55, value: 100000, policy_id: 'p1', user_id: 'user-1', created_by: 'user-1' },
      { age: 65, value: 210000, policy_id: 'p1', user_id: 'user-1', created_by: 'user-1' },
    ]);
  });

  it('skips the insert when no projections remain', async () => {
    from.enqueue(createBuilder({ data: [] }));
    await replaceProjections('p1', [], 'user-1');
    expect(from.tables).toEqual(['projected_cash_values']);
  });

  it('throws the delete error before inserting, and throws the insert error', async () => {
    from.enqueue(createBuilder({ error: new Error('delete blocked') }));
    await expect(replaceProjections('p1', input.projectedCashValue, 'user-1')).rejects.toThrow(
      'delete blocked',
    );
    expect(from.tables).toEqual(['projected_cash_values']);

    fromMock.mockReset();
    from = wireFromQueue(fromMock);
    from.enqueue(createBuilder({ data: [] }), createBuilder({ error: new Error('unique collision') }));
    await expect(replaceProjections('p1', input.projectedCashValue, 'user-1')).rejects.toThrow(
      'unique collision',
    );
  });
});

describe('createPolicy / updatePolicy', () => {
  it('stamps identity on create, then replaces projections', async () => {
    const insert = createBuilder({ data: { id: 'p1' } });
    from.enqueue(insert, createBuilder({ data: [] }), createBuilder({}));

    await createPolicy('client-1', input, 'user-1');

    expect(from.tables).toEqual(['policies', 'projected_cash_values', 'projected_cash_values']);
    const payload = callsOf(insert, 'insert')[0][0] as Record<string, unknown>;
    expect(payload.client_id).toBe('client-1');
    expect(payload.user_id).toBe('user-1');
    expect(payload.created_by).toBe('user-1');
  });

  it('throws on an RLS-blocked update without touching projections', async () => {
    from.enqueue(createBuilder({ data: null }));
    await expect(updatePolicy('p1', input, 'user-1')).rejects.toThrow(
      'You can only edit your own policies',
    );
    expect(from.tables).toEqual(['policies']);
  });
});

describe('softDeletePolicy', () => {
  it('soft-deletes the policy AND its projections', async () => {
    const policy = createBuilder({ data: [{ id: 'p1' }] });
    const projections = createBuilder({});
    from.enqueue(policy, projections);

    await softDeletePolicy('p1', 'user-1');

    expect(calledWith(policy, 'update', { is_deleted: true, updated_by: 'user-1' })).toBe(true);
    expect(calledWith(projections, 'update', { is_deleted: true, updated_by: 'user-1' })).toBe(true);
    expect(calledWith(projections, 'eq', 'policy_id', 'p1')).toBe(true);
  });

  it('throws on a phantom (0-row) delete and leaves projections alone', async () => {
    from.enqueue(createBuilder({ data: [] }));
    await expect(softDeletePolicy('p1', 'user-1')).rejects.toThrow(
      'You can only delete your own policies',
    );
    expect(from.tables).toEqual(['policies']);
  });
});
