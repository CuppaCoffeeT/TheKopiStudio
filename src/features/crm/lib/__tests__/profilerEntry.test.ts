/**
 * profilerEntry unit tests — the CRM→profiler entry contract.
 *
 * `customerId` is the half that shipped missing: without it the saved result
 * carries no `client_id`, and the customer keeps reading "Never profiled" on
 * the Overview queue after being profiled. Assert it is always present.
 */

import { describe, expect, it } from 'vitest';
import { profilerHrefFor } from '../profilerEntry';

describe('profilerHrefFor', () => {
  it('carries BOTH the name and the customer id', () => {
    const params = new URL(
      profilerHrefFor({ id: 'client-uuid-1', name: 'Sky Tan' }),
      'https://app.test',
    ).searchParams;

    expect(params.get('prospect')).toBe('Sky Tan');
    expect(params.get('customerId')).toBe('client-uuid-1');
  });

  it('encodes names that would otherwise break the query string', () => {
    const href = profilerHrefFor({ id: 'client-uuid-2', name: 'Tan & Sons / 陈' });

    expect(href).not.toContain(' ');
    expect(new URL(href, 'https://app.test').searchParams.get('prospect')).toBe('Tan & Sons / 陈');
  });
});
