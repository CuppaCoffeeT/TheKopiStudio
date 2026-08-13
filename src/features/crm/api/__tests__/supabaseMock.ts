/**
 * Mocked supabase chain for the CRM service unit tests (the PRD-mandated
 * "mocked supabase chain" style — no network, assert builder calls).
 *
 * `createBuilder(result)` returns a thenable that records every chained call
 * (`select`, `eq`, `order`, ...) and resolves to `result` when awaited or
 * terminated with `.single()` / `.maybeSingle()`. Test files vi.mock the
 * supabase client and feed `from` a queue of builders — one per `from()` call
 * the service makes, in order.
 */

import { vi, type Mock } from 'vitest';

export interface BuilderResult {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}

export interface RecordedCall {
  method: string;
  args: unknown[];
}

export interface ChainBuilder {
  calls: RecordedCall[];
  [method: string]: unknown;
}

const CHAIN_METHODS = [
  'select',
  'insert',
  'update',
  'delete',
  'upsert',
  'eq',
  'neq',
  'ilike',
  'or',
  'not',
  'in',
  'gt',
  'gte',
  'lt',
  'lte',
  'is',
  'order',
  'range',
  'limit',
] as const;

/** A chainable, awaitable PostgREST builder double that records its calls. */
export function createBuilder(result: BuilderResult = {}): ChainBuilder {
  const resolved = { data: null, error: null, count: null, ...result };
  const calls: RecordedCall[] = [];
  const builder: ChainBuilder = { calls };

  for (const method of CHAIN_METHODS) {
    builder[method] = vi.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    });
  }
  for (const method of ['single', 'maybeSingle']) {
    builder[method] = vi.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return Promise.resolve(resolved);
    });
  }
  builder.then = (
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(resolved).then(onFulfilled, onRejected);

  return builder;
}

export interface FromQueue {
  /** Table names `from()` received, in call order. */
  tables: string[];
  /** Push the builders the next `from()` calls should return, in order. */
  enqueue: (...builders: ChainBuilder[]) => void;
}

/** Wire the mocked `supabase.from` to a FIFO of builders (one per call). */
export function wireFromQueue(fromMock: Mock): FromQueue {
  const tables: string[] = [];
  const queue: ChainBuilder[] = [];
  fromMock.mockImplementation((table: string) => {
    tables.push(table);
    const next = queue.shift();
    if (!next) throw new Error(`Unexpected supabase.from('${table}') call`);
    return next;
  });
  return { tables, enqueue: (...builders) => queue.push(...builders) };
}

/** All recorded args for one method, in call order. */
export function callsOf(builder: ChainBuilder, method: string): unknown[][] {
  return builder.calls.filter((call) => call.method === method).map((call) => call.args);
}

/** True when `method` was called with exactly `args` (deep equality). */
export function calledWith(builder: ChainBuilder, method: string, ...args: unknown[]): boolean {
  return callsOf(builder, method).some(
    (recorded) => JSON.stringify(recorded) === JSON.stringify(args),
  );
}

/** Asserts the read chain carries the soft-delete filter (PRD: EVERY read). */
export function expectSoftDeleteFilter(builder: ChainBuilder): void {
  if (!calledWith(builder, 'eq', 'is_deleted', false)) {
    throw new Error(
      `Missing .eq('is_deleted', false) — recorded calls: ${JSON.stringify(builder.calls)}`,
    );
  }
}
