/**
 * clientsService unit tests (mocked supabase chain) — corrected legacy bug 1:
 * client writes never touch the derived balance columns; ADD seeds the
 * initial bank-history row then recomputes; every read carries the
 * soft-delete filter.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CrmClientInput } from '../../types';
import {
  buildClientUpdate,
  createClient,
  getClientById,
  getClientsPaginated,
  softDeleteClient,
  updateClient,
} from '../clientsService';
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

const input: CrmClientInput = {
  name: 'Tan Mei Ling',
  email: 'mei@example.sg',
  phone: '91234567',
  dateOfBirth: '1986-04-12',
  occupation: 'Engineer',
  annualIncome: '120000',
  riskProfile: 'Moderate',
  notes: '',
  createdDate: '',
  lastReviewDate: '2026-01-01',
  nextReviewDate: '2026-09-01',
  reviewFrequency: 'Annual',
  totalBankBalance: '5000',
  cpfOA: '',
  cpfSA: '',
  cpfMA: '',
};

let from: FromQueue;
beforeEach(() => {
  fromMock.mockReset();
  from = wireFromQueue(fromMock);
});

describe('getClientsPaginated', () => {
  it('filters soft-deleted rows, sanitizes search, and bounds the page', async () => {
    const builder = createBuilder({ data: [], count: 0 });
    from.enqueue(builder);

    await getClientsPaginated({ search: '100%, sure', page: 2, rowsPerPage: 25 });

    expectSoftDeleteFilter(builder);
    expect(calledWith(builder, 'or', 'name.ilike.%100 sure%,email.ilike.%100 sure%')).toBe(true);
    expect(calledWith(builder, 'order', 'created_at', { ascending: false })).toBe(true);
    expect(calledWith(builder, 'range', 25, 49)).toBe(true);
  });

  it('skips the or() filter when the sanitized term is empty', async () => {
    const builder = createBuilder({ data: [], count: 0 });
    from.enqueue(builder);

    await getClientsPaginated({ search: '%%%', page: 1, rowsPerPage: 10 });

    expect(callsOf(builder, 'or')).toHaveLength(0);
    expectSoftDeleteFilter(builder);
  });
});

describe('getClientById', () => {
  it('reads one non-deleted row via maybeSingle', async () => {
    const builder = createBuilder({ data: { id: 'client-1' } });
    from.enqueue(builder);

    await getClientById('client-1');

    expect(calledWith(builder, 'eq', 'id', 'client-1')).toBe(true);
    expectSoftDeleteFilter(builder);
    expect(callsOf(builder, 'maybeSingle')).toHaveLength(1);
  });
});

describe('createClient', () => {
  it('stamps identity, defaults created_date, seeds history, then recomputes', async () => {
    const insertClient = createBuilder({ data: { id: 'client-1' } });
    const seedHistory = createBuilder({});
    const latestFetch = createBuilder({ data: { balance: 5000, date: '2026-06-11' } });
    const recomputeUpdate = createBuilder({ data: [{ id: 'client-1' }] });
    from.enqueue(insertClient, seedHistory, latestFetch, recomputeUpdate);

    await createClient(input, 'user-1');

    expect(from.tables).toEqual(['clients', 'bank_balance_history', 'bank_balance_history', 'clients']);
    const clientPayload = callsOf(insertClient, 'insert')[0][0] as Record<string, unknown>;
    expect(clientPayload.user_id).toBe('user-1');
    expect(clientPayload.created_by).toBe('user-1');
    expect(clientPayload.created_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect('total_bank_balance' in clientPayload).toBe(false);
    expect('last_review_date' in clientPayload).toBe(false);

    expect(callsOf(seedHistory, 'insert')[0][0]).toEqual({
      client_id: 'client-1',
      user_id: 'user-1',
      created_by: 'user-1',
      date: clientPayload.created_date,
      balance: 5000,
      notes: 'Initial client onboarding',
    });
  });

  it('keeps an explicit created_date and skips seeding at zero balance', async () => {
    const insertClient = createBuilder({ data: { id: 'client-2' } });
    from.enqueue(insertClient);

    await createClient({ ...input, createdDate: '2025-01-15', totalBankBalance: '' }, 'user-1');

    expect(from.tables).toEqual(['clients']);
    const payload = callsOf(insertClient, 'insert')[0][0] as Record<string, unknown>;
    expect(payload.created_date).toBe('2025-01-15');
  });
});

describe('updateClient', () => {
  it('strips total_bank_balance and last_review_date from the payload', () => {
    const payload = buildClientUpdate({ ...input, totalBankBalance: '99999' }, 'user-1');

    expect('total_bank_balance' in payload).toBe(false);
    expect('last_review_date' in payload).toBe(false);
    expect(payload.updated_by).toBe('user-1');
    expect(payload.name).toBe('Tan Mei Ling');
  });

  it('sends the stripped payload and throws when RLS matches no row', async () => {
    const updateOk = createBuilder({ data: { id: 'client-1' } });
    from.enqueue(updateOk);
    await updateClient('client-1', input, 'user-1');
    const sent = callsOf(updateOk, 'update')[0][0] as Record<string, unknown>;
    expect('total_bank_balance' in sent).toBe(false);
    expect('last_review_date' in sent).toBe(false);
    expect(calledWith(updateOk, 'eq', 'id', 'client-1')).toBe(true);

    from.enqueue(createBuilder({ data: null }));
    await expect(updateClient('client-1', input, 'user-1')).rejects.toThrow(
      'You can only edit your own clients',
    );
  });
});

describe('softDeleteClient', () => {
  it('sets is_deleted + updated_by and verifies via select(id)', async () => {
    const builder = createBuilder({ data: [{ id: 'client-1' }] });
    from.enqueue(builder);

    await softDeleteClient('client-1', 'user-1');

    expect(calledWith(builder, 'update', { is_deleted: true, updated_by: 'user-1' })).toBe(true);
    expect(calledWith(builder, 'select', 'id')).toBe(true);
  });

  it('throws on a phantom (0-row) delete', async () => {
    from.enqueue(createBuilder({ data: [] }));
    await expect(softDeleteClient('client-1', 'user-1')).rejects.toThrow(
      'You can only delete your own clients',
    );
  });
});
