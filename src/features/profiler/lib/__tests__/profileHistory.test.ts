/**
 * Prospect Profiler history — the diff between two profiles of one customer.
 *
 * The case that matters: a FIRST profile has no predecessor, and listing every
 * field as "not set → X" would bury the one thing worth saying, which is that
 * the customer now has a profile at all.
 */

import { describe, expect, it } from 'vitest';
import { diffProfiles, snapshotFromResult, summariseProfileChanges } from '../profileHistory';

const row = {
  disc_primary: 'S',
  disc_secondary: 'C',
  mbti: 'ISFJ',
  age_range: '35-44',
  occupation: 'Engineer',
  meeting: '2',
  observations_count: 4,
  questions_answered: 8,
};

describe('diffProfiles', () => {
  it('returns nothing for a first profile — "created" says more than 8 blanks', () => {
    expect(diffProfiles(null, snapshotFromResult(row))).toEqual([]);
  });

  it('reports nothing when a re-profile lands on the same answers', () => {
    expect(diffProfiles(snapshotFromResult(row), snapshotFromResult(row))).toEqual([]);
  });

  it('reports the DISC shift the advisor cares about', () => {
    const changes = diffProfiles(
      snapshotFromResult(row),
      snapshotFromResult({ ...row, disc_primary: 'D' }),
    );
    expect(changes).toEqual([
      { field: 'discPrimary', label: 'DISC primary', from: 'S', to: 'D' },
    ]);
  });

  it('treats a null column as unset rather than as the string "null"', () => {
    const changes = diffProfiles(
      snapshotFromResult({ ...row, mbti: null }),
      snapshotFromResult({ ...row, mbti: 'INTJ' }),
    );
    expect(changes).toEqual([{ field: 'mbti', label: 'MBTI', from: '', to: 'INTJ' }]);
  });
});

describe('summariseProfileChanges', () => {
  it('leads with the DISC change when there is one', () => {
    expect(
      summariseProfileChanges([
        { field: 'occupation', label: 'Occupation', from: 'Engineer', to: 'Architect' },
        { field: 'discPrimary', label: 'DISC primary', from: 'S', to: 'D' },
      ]),
    ).toBe('Profile changed — DISC primary S → D');
  });

  it('says plainly that a re-run changed nothing, rather than saying nothing', () => {
    expect(summariseProfileChanges([])).toBe('Profiler run again — no change to the profile');
  });
});
