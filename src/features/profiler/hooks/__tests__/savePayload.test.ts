/**
 * Save-payload parity tests — `buildResultInsert` must reproduce the legacy
 * `saveToDb` shape exactly. Replays golden-master rows: feeding a stored
 * row's inputs through scoring + the builder must reproduce every persisted
 * column (incl. FALSE nv entries and TRUE-only observations_count).
 */

import { describe, expect, it } from 'vitest';
import { LEGACY_RESULTS } from '../../lib/__fixtures__/legacy-results';
import { calcProfile } from '../../lib/scoring';
import { buildResultInsert, saveSignature } from '../savePayload';
import { tickedIds, type IntakeInfo } from '../useWizardState';

function intakeFromRow(row: (typeof LEGACY_RESULTS)[number]): IntakeInfo {
  return {
    adv: row.advisor_name,
    name: row.prospect_name,
    age: row.age_range,
    meeting: row.meeting,
    occ: row.occupation,
  };
}

describe('buildResultInsert', () => {
  it.each(LEGACY_RESULTS.map((row) => [row.prospect_name, row] as const))(
    'reproduces the stored legacy row for %s',
    (_name, row) => {
      const profile = calcProfile(row.raw_answers, tickedIds(row.nv_observations), row.occupation);
      const payload = buildResultInsert({
        intake: intakeFromRow(row),
        answers: row.raw_answers,
        nv: row.nv_observations,
        profile,
        notes: row.notes,
        userId: row.user_id,
      });

      expect(payload).toEqual({
        user_id: row.user_id,
        advisor_name: row.advisor_name,
        prospect_name: row.prospect_name,
        age_range: row.age_range,
        occupation: row.occupation,
        meeting: row.meeting,
        disc_primary: row.disc_primary,
        disc_secondary: row.disc_secondary,
        score_d: row.score_d,
        score_i: row.score_i,
        score_s: row.score_s,
        score_c: row.score_c,
        mbti: row.mbti,
        questions_answered: row.questions_answered,
        observations_count: row.observations_count,
        raw_answers: row.raw_answers,
        nv_observations: row.nv_observations,
        notes: row.notes,
      });
    },
  );

  it('keeps FALSE nv entries in the payload but counts TRUE only', () => {
    const row = LEGACY_RESULTS[0];
    const profile = calcProfile(row.raw_answers, tickedIds(row.nv_observations), row.occupation);
    const payload = buildResultInsert({
      intake: intakeFromRow(row),
      answers: row.raw_answers,
      nv: row.nv_observations,
      profile,
      notes: '',
      userId: null,
    });

    const nv = payload.nv_observations as Record<string, boolean>;
    const falseEntries = Object.values(row.nv_observations).filter((v) => v === false).length;
    expect(falseEntries).toBeGreaterThan(0);
    expect(Object.keys(nv)).toEqual(Object.keys(row.nv_observations));
    expect(payload.observations_count).toBe(
      Object.values(row.nv_observations).filter(Boolean).length,
    );
  });

  it('applies legacy intake defaults: blank names, NULL age/occupation', () => {
    const row = LEGACY_RESULTS[0];
    const profile = calcProfile(row.raw_answers, tickedIds(row.nv_observations), '');
    const payload = buildResultInsert({
      intake: { adv: '  ', name: '', age: '', meeting: '1', occ: '  ' },
      answers: row.raw_answers,
      nv: row.nv_observations,
      profile,
      notes: '',
      userId: null,
    });

    expect(payload.user_id).toBeNull();
    expect(payload.advisor_name).toBe('Advisor');
    expect(payload.prospect_name).toBe('Prospect');
    expect(payload.age_range).toBeNull();
    expect(payload.occupation).toBeNull();
    expect(payload.meeting).toBe('1');
  });
});

describe('saveSignature (duplicate-save guard)', () => {
  it('is stable for identical inputs and ignores notes', () => {
    const row = LEGACY_RESULTS[0];
    const intake = intakeFromRow(row);
    const a = saveSignature(intake, row.raw_answers, row.nv_observations);
    const b = saveSignature({ ...intake }, [...row.raw_answers], { ...row.nv_observations });
    expect(a).toBe(b);
  });

  it('changes when an answer or a ticked observation changes', () => {
    const row = LEGACY_RESULTS[0];
    const intake = intakeFromRow(row);
    const base = saveSignature(intake, row.raw_answers, row.nv_observations);

    const changedAnswers = row.raw_answers.map((a, i) => (i === 0 ? { ...a, oi: (a.oi + 1) % 4 } : a));
    expect(saveSignature(intake, changedAnswers, row.nv_observations)).not.toBe(base);

    const tickedId = tickedIds(row.nv_observations)[0];
    const changedNv = { ...row.nv_observations, [tickedId]: false };
    expect(saveSignature(intake, row.raw_answers, changedNv)).not.toBe(base);
  });
});
