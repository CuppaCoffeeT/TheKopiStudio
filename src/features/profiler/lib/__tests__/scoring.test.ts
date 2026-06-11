/**
 * Golden-master + quirk-corpus lock for the ported profiler scoring/export.
 *
 * (a) Golden master — replays all 8 live `public.results` rows (fixtures in
 *     `lib/__fixtures__/legacy-results.ts`) through `calcProfile` and asserts
 *     the stored scores, DISC primary/secondary and MBTI are reproduced
 *     EXACTLY.
 * (b) Tie-break corpus — explicit D > I > S > C and E/S/T/J `>=` semantics.
 * (c) Occupation corpus — the 7 legacy regex buckets incl. every preserved
 *     quirk (trailing-space tokens, bare 'care' substring, unescaped dot in
 *     `self.employ`, bucket stacking).
 * (d) CSV — frozen legacy column order/headers; comma/quote round-trip.
 */
import { describe, expect, it } from 'vitest';

import type { RawAnswer } from '../../types';
import { LEGACY_RESULTS } from '../__fixtures__/legacy-results';
import { NVG } from '../content';
import { buildCsv, type ProfileCsvRow } from '../export';
import { calcProfile, occNudge, type DiscScores, type MbtiSignals } from '../scoring';

/** Stored `nv_observations` objects include FALSE entries — score TRUE ids only. */
function trueObservationIds(nvObservations: Record<string, boolean>): string[] {
  return Object.keys(nvObservations).filter((id) => nvObservations[id]);
}

function zeroDisc(): DiscScores {
  return { D: 0, I: 0, S: 0, C: 0 };
}

function zeroMbti(): MbtiSignals {
  return { E: 0, I: 0, T: 0, F: 0, J: 0, P: 0, S: 0, N: 0 };
}

function nudge(occupation: string): { disc: DiscScores; mbti: MbtiSignals } {
  const disc = zeroDisc();
  const mbti = zeroMbti();
  occNudge(disc, mbti, occupation);
  return { disc, mbti };
}

function answer(
  d: RawAnswer['d'],
  k: RawAnswer['mb']['k'],
  v: RawAnswer['mb']['v'],
): RawAnswer {
  return { oi: 0, d, mb: { k, v } };
}

/** Minimal RFC-4180 row parser used to prove quoted fields round-trip. */
function parseCsvRow(row: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"') {
        if (row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ── (a) GOLDEN MASTER ──

describe('golden master — replay of all 8 live legacy result rows', () => {
  it('covers all 8 live rows', () => {
    expect(LEGACY_RESULTS).toHaveLength(8);
  });

  it.each(LEGACY_RESULTS.map((row) => [row.prospect_name, row] as const))(
    'reproduces stored scores, DISC order and MBTI for %s',
    (_prospect, row) => {
      const result = calcProfile(
        row.raw_answers,
        trueObservationIds(row.nv_observations),
        row.occupation ?? '',
      );
      expect(result.dc.D).toBe(row.score_d);
      expect(result.dc.I).toBe(row.score_i);
      expect(result.dc.S).toBe(row.score_s);
      expect(result.dc.C).toBe(row.score_c);
      expect(result.pri).toBe(row.disc_primary);
      expect(result.sec).toBe(row.disc_secondary);
      expect(result.mbs).toBe(row.mbti);
      expect(result.qCount).toBe(row.questions_answered);
      expect(result.nvCount).toBe(row.observations_count);
    },
  );
});

describe('NVG observation ids (scoring lookup source)', () => {
  it('exposes 53 uniquely-mapped observation ids', () => {
    const items = NVG.flatMap((group) => group.items);
    expect(items).toHaveLength(53);
    expect(new Set(items.map((item) => item.id)).size).toBe(53);
  });
});

// ── (b) TIE-BREAK CORPUS ──

describe('tie-breaks — explicit D > I > S > C and E/S/T/J', () => {
  it('all-zero input gives primary D, secondary I, MBTI ESTJ', () => {
    const result = calcProfile(new Array(8).fill(null), [], '');
    expect(result.dc).toEqual(zeroDisc());
    expect(result.pri).toBe('D');
    expect(result.sec).toBe('I');
    expect(result.mbs).toBe('ESTJ');
    expect(result.qCount).toBe(0);
    expect(result.nvCount).toBe(0);
    expect(result.occUsed).toBe('');
  });

  it('engineered D==I tie keeps D first', () => {
    const result = calcProfile([answer('D', 'EI', 'E'), answer('I', 'EI', 'I')], [], '');
    expect(result.dc.D).toBe(2);
    expect(result.dc.I).toBe(2);
    expect(result.pri).toBe('D');
    expect(result.sec).toBe('I');
  });

  it('four-way tie ranks D > I > S > C', () => {
    const result = calcProfile(
      [answer('D', 'EI', 'E'), answer('I', 'EI', 'E'), answer('S', 'EI', 'E'), answer('C', 'EI', 'E')],
      [],
      '',
    );
    expect(result.pri).toBe('D');
    expect(result.sec).toBe('I');
  });

  it('S==C secondary tie keeps S before C', () => {
    const result = calcProfile([answer('D', 'EI', 'E')], ['a3', 'a4'], '');
    expect(result.dc).toEqual({ D: 2, I: 0, S: 1, C: 1 });
    expect(result.pri).toBe('D');
    expect(result.sec).toBe('S');
  });

  it('MBTI dimension ties all favour E, S, T, J', () => {
    const result = calcProfile(
      [
        answer('D', 'EI', 'E'),
        answer('D', 'EI', 'I'),
        answer('D', 'SN', 'S'),
        answer('D', 'SN', 'N'),
        answer('D', 'TF', 'T'),
        answer('D', 'TF', 'F'),
        answer('D', 'JP', 'J'),
        answer('D', 'JP', 'P'),
      ],
      [],
      '',
    );
    expect(result.mbs).toBe('ESTJ');
  });
});

// ── (c) OCCUPATION CORPUS — legacy quirks preserved ──

describe('occupation nudge corpus', () => {
  it("'IT Manager' stacks buckets 1+5: C+3 D+1, T+2 I+1 (case-insensitive)", () => {
    const { disc, mbti } = nudge('IT Manager');
    expect(disc).toEqual({ D: 1, I: 0, S: 0, C: 3 });
    expect(mbti).toEqual({ E: 0, I: 1, T: 2, F: 0, J: 0, P: 0, S: 0, N: 0 });
  });

  it("'career coach' hits bucket 4 via the bare 'care' substring", () => {
    const { disc, mbti } = nudge('career coach');
    expect(disc).toEqual({ D: 0, I: 0, S: 2, C: 0 });
    expect(mbti).toEqual({ E: 0, I: 1, T: 0, F: 1, J: 0, P: 0, S: 0, N: 0 });
  });

  it("'it' alone does NOT match (trailing-space token 'it ')", () => {
    const { disc, mbti } = nudge('it');
    expect(disc).toEqual(zeroDisc());
    expect(mbti).toEqual(zeroMbti());
  });

  it("'md' alone does NOT match (trailing-space token 'md ')", () => {
    const { disc, mbti } = nudge('md');
    expect(disc).toEqual(zeroDisc());
    expect(mbti).toEqual(zeroMbti());
  });

  it("'md office' matches bucket 2 ('md ' as prefix of a longer string)", () => {
    const { disc, mbti } = nudge('md office');
    expect(disc).toEqual({ D: 2, I: 0, S: 0, C: 0 });
    expect(mbti).toEqual({ E: 1, I: 0, T: 1, F: 0, J: 0, P: 0, S: 0, N: 0 });
  });

  it("'self-employed' matches via the unescaped dot in self.employ", () => {
    const { disc, mbti } = nudge('self-employed');
    expect(disc).toEqual({ D: 1, I: 1, S: 0, C: 0 });
    expect(mbti).toEqual({ E: 1, I: 0, T: 0, F: 0, J: 0, P: 0, S: 0, N: 0 });
  });

  it("'selfXemploy' also matches the unescaped dot (quirk preserved)", () => {
    const { disc, mbti } = nudge('selfXemploy');
    expect(disc).toEqual({ D: 1, I: 1, S: 0, C: 0 });
    expect(mbti.E).toBe(1);
  });

  it("'photographer' hits bucket 3 via 'photog'", () => {
    const { disc, mbti } = nudge('photographer');
    expect(disc).toEqual({ D: 0, I: 2, S: 0, C: 0 });
    expect(mbti).toEqual({ E: 1, I: 0, T: 0, F: 0, J: 0, P: 0, S: 0, N: 1 });
  });

  it('empty string is a no-op', () => {
    const { disc, mbti } = nudge('');
    expect(disc).toEqual(zeroDisc());
    expect(mbti).toEqual(zeroMbti());
  });

  it('calcProfile records the occupation it factored in (occUsed)', () => {
    const result = calcProfile([], [], 'Engineer');
    expect(result.dc.C).toBe(2);
    expect(result.occUsed).toBe('Engineer');
  });
});

// ── (d) CSV EXPORT ──

describe('CSV export — frozen legacy format, fixed escaping', () => {
  const row: ProfileCsvRow = {
    date: '2026-06-11',
    advisor: 'Sky',
    prospect: 'Tan, Wei Jie',
    age: '26-30',
    occupation: 'Sales, Regional',
    meeting: '1',
    discPrimary: 'D',
    discSecondary: 'I',
    mbti: 'ESTJ',
    scoreD: 10,
    scoreI: 7,
    scoreS: 3,
    scoreC: 2,
    questions: 8,
    observations: 5,
    notes: 'Said "maybe", bring spouse',
  };

  it('keeps the exact legacy column order and header strings', () => {
    const [header] = buildCsv(row).split('\n');
    expect(header).toBe(
      'Date,Advisor,Prospect,Age,Occupation,Meeting,DISC Primary,DISC Secondary,MBTI,Score D,Score I,Score S,Score C,Questions,Observations,Notes',
    );
  });

  it('quotes all text fields and leaves numeric fields bare', () => {
    const [, data] = buildCsv(row).split('\n');
    expect(data).toBe(
      '"2026-06-11","Sky","Tan, Wei Jie","26-30","Sales, Regional","1","D","I","ESTJ",10,7,3,2,8,5,"Said ""maybe"", bring spouse"',
    );
  });

  it('comma-containing text fields round-trip through a CSV parse', () => {
    const [, data] = buildCsv(row).split('\n');
    const fields = parseCsvRow(data);
    expect(fields).toHaveLength(16);
    expect(fields[2]).toBe('Tan, Wei Jie');
    expect(fields[4]).toBe('Sales, Regional');
    expect(fields[15]).toBe('Said "maybe", bring spouse');
  });
});
