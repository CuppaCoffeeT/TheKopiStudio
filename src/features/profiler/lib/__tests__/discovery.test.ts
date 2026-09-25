/**
 * Prototype v6 port (2026-09-25) — the guarantees the port leans on.
 *
 * (a) Answer identity survives the v6 reshuffle: every question keeps one
 *     option per DISC letter, and every stored answer in the 8 live legacy
 *     rows — saved under the (17) option order — still names an option with
 *     the SAME MBTI pole when looked up by (qi, d). This is why pre-v6 rows
 *     need no migration (content/questions.ts header).
 * (b) calcInterim — the pit stop's read: rapport answers only (never the money
 *     anchor), same tie order as calcProfile, confidence from the top-two gap.
 * (c) Storage — tracks ride raw_answers[7]; pre-v6 rows read back as null.
 * (d) The derived copy (combined read, tailored follow-up, game plan).
 */
import { describe, expect, it } from 'vitest';

import type { DiscLetter, DiscoveryTracks, RawAnswer } from '../../types';
import { LEGACY_RESULTS } from '../__fixtures__/legacy-results';
import { DISCOVERY_AXES, MONEY_ANCHOR_QI, QS, RAPPORT_BATCHES, TRACK_COPY, TRACK_KEYS } from '../content';
import {
  answeredTrackCount,
  calcInterim,
  combinedRead,
  gamePlan,
  readStoredDiscovery,
  tailoredFollowUp,
  withTracks,
} from '../discovery';

const TRACKS: DiscoveryTracks = { temperament: 'Anxious', openness: 'Familiar', horizon: 'Present', decision: 'Deliberate' };

function pick(qi: number, d: DiscLetter): RawAnswer {
  const oi = QS[qi].opts.findIndex((o) => o.d === d);
  return { oi, d, mb: QS[qi].opts[oi].mb };
}

describe('(a) answer identity across the v6 reshuffle', () => {
  it('every question has exactly one option per DISC letter', () => {
    for (const q of QS) expect(q.opts.map((o) => o.d).sort()).toEqual(['C', 'D', 'I', 'S']);
  });

  it.each(LEGACY_RESULTS.map((row) => [row.prospect_name, row] as const))(
    'every stored answer of %s maps by (qi, d) to an option with the same MBTI pole',
    (_name, row) => {
      row.raw_answers.forEach((answer, qi) => {
        const option = QS[qi].opts.find((o) => o.d === answer.d);
        expect(option?.mb).toEqual(answer.mb);
      });
    },
  );

  it('rapport covers Q0–6 in two batches; the money anchor is Q7', () => {
    expect(RAPPORT_BATCHES.flat()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(MONEY_ANCHOR_QI).toBe(7);
    expect(QS).toHaveLength(8);
  });
});

describe('(b) calcInterim', () => {
  it('ignores the money anchor', () => {
    const answers: Array<RawAnswer | null> = new Array(8).fill(null);
    answers[MONEY_ANCHOR_QI] = pick(MONEY_ANCHOR_QI, 'S');
    expect(calcInterim(answers, [], '').dc).toEqual({ D: 0, I: 0, S: 0, C: 0 });
  });

  it('scores rapport +2, ticks +1, occupation nudge; ties D > I > S > C', () => {
    const answers: Array<RawAnswer | null> = [pick(0, 'I'), pick(1, 'S'), null, null, null, null, null, null];
    const read = calcInterim(answers, ['a3'], '');
    expect(read.dc).toEqual({ D: 0, I: 2, S: 3, C: 0 });
    expect(read.pri).toBe('S');
    expect(read.sec).toBe('I');
    expect(calcInterim(new Array(8).fill(null), [], 'Engineer').pri).toBe('C');
    expect(calcInterim(new Array(8).fill(null), [], '').pri).toBe('D');
  });

  it('confidence: gap ≥4 clear, ≥2 fairly clear, else still forming', () => {
    const d = (n: number): Array<RawAnswer | null> =>
      [0, 1, 2, 3, 4, 5, 6, 7].map((qi) => (qi < n ? pick(qi, 'D') : null));
    expect(calcInterim(d(2), [], '').conf).toBe('clear');
    expect(calcInterim(d(1), [], '').conf).toBe('fairly clear');
    expect(calcInterim(d(0), [], '').conf).toBe('still forming');
  });
});

describe('(c) storage in raw_answers[7]', () => {
  const answers = QS.map((_, qi) => pick(qi, 'C'));

  it('attaches complete tracks to the money anchor only, and reads them back', () => {
    const saved = withTracks(answers, TRACKS);
    expect(saved[MONEY_ANCHOR_QI]).toEqual({ ...answers[MONEY_ANCHOR_QI], tracks: TRACKS });
    saved.slice(0, MONEY_ANCHOR_QI).forEach((a) => expect(a).not.toHaveProperty('tracks'));
    expect(readStoredDiscovery(saved)).toEqual({ tracks: TRACKS, worry: 'C' });
  });

  it('does not attach incomplete tracks', () => {
    const saved = withTracks(answers, { temperament: 'Calm' });
    expect(saved[MONEY_ANCHOR_QI]).not.toHaveProperty('tracks');
    expect(answeredTrackCount({ temperament: 'Calm' })).toBe(1);
  });

  it('pre-v6 rows and malformed tracks read back as null', () => {
    for (const row of LEGACY_RESULTS) {
      expect(readStoredDiscovery(row.raw_answers)).toEqual({ tracks: null, worry: null });
    }
    const bad = [...answers];
    bad[MONEY_ANCHOR_QI] = { ...answers[MONEY_ANCHOR_QI], tracks: { ...TRACKS, horizon: 'Calm' } as never };
    expect(readStoredDiscovery(bad).tracks).toBeNull();
    expect(readStoredDiscovery(null).tracks).toBeNull();
  });
});

describe('(d) derived copy', () => {
  it('content covers every letter and every pole', () => {
    for (const key of TRACK_KEYS) {
      const axis = DISCOVERY_AXES[key];
      expect(Object.keys(axis.frames).sort()).toEqual(['C', 'D', 'I', 'S']);
      expect(axis.opts.map((o) => o.v)).toEqual([axis.left, axis.right]);
      expect(TRACK_COPY[axis.left].so).toBeTruthy();
      expect(TRACK_COPY[axis.right].msg).toBeTruthy();
    }
  });

  it('combinedRead picks the anchor from temperament × openness', () => {
    const text = (t: DiscoveryTracks) => combinedRead(t).map((s) => s.text).join('');
    expect(text(TRACKS)).toBe(
      'Careful and wants it simple — a prove-it-is-safe-in-plain-language prospect. Lead with protection and certainty. Frame it around what it does for them now. Do not push to close today — set the next meeting before you part.',
    );
    const bold = combinedRead({ temperament: 'Calm', openness: 'Curious', horizon: 'Future', decision: 'Decisive' });
    expect(bold.find((s) => s.strong)?.text).toBe('real strategy');
  });

  it('tailoredFollowUp echoes the money worry', () => {
    expect(tailoredFollowUp('S', TRACKS)).toBe(
      'Was thinking about what you shared — about making sure the family is okay if anything happens to you. I have put something together around exactly that — focused on what it does for you right now. No rush at all — take your time with it. When you are ready, I will walk you through it clearly.',
    );
    expect(tailoredFollowUp(null, TRACKS)).toMatch(/^Was thinking about our conversation\./);
  });

  it('gamePlan opens with their own words', () => {
    expect(gamePlan('D', TRACKS).openWith).toBe(
      '"Last time you mentioned not missing the window — I built this around exactly that."',
    );
    expect(gamePlan(null, { ...TRACKS, decision: 'Decisive' }).pace).toMatch(/^Be ready to complete same-day/);
  });
});
