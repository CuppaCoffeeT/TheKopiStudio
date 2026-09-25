/**
 * Discovery-phase logic — pure ports of prototype v6's `calcInterim`,
 * `combinedRead`, `tailoredFU` and `gamePlanHTML` (2026-09-25).
 *
 * v6 inserted a PIT STOP after rapport + observations (a provisional DISC read
 * that decides how the money talk is worded) and a DISCOVERY screen (the money
 * anchor, Q7, plus four binary tracks). None of this touches the final score:
 * `calcProfile` is unchanged and still golden-master locked. The tracks are
 * extra reads the report steers by.
 *
 * STORAGE: `public.results` is legacy-shape frozen, so the tracks ride
 * `raw_answers[7]` — the money anchor's own slot, answered on the same screen
 * (`withTracks` / `readStoredDiscovery`). Rows saved before v6, or by the legacy
 * app, simply have none and the report omits the track sections.
 */

import type { DiscLetter, DiscoveryTracks, RawAnswer, TrackKey } from '../types';
import { DISCOVERY_AXES, MONEY_ANCHOR_QI, MONEY_WORRY, TRACK_KEYS } from './content';
import { calcProfile, type DiscScores } from './scoring';

export type InterimConfidence = 'clear' | 'fairly clear' | 'still forming';

/** The pit stop's provisional read. */
export interface InterimRead {
  dc: DiscScores;
  pri: DiscLetter;
  sec: DiscLetter;
  conf: InterimConfidence;
}

/**
 * v6 `calcInterim`: the occupation nudge, the RAPPORT answers (Q0–6, not the
 * money anchor) and the ticked observations — i.e. `calcProfile` over the
 * rapport slice, with the same D > I > S > C tie order. Confidence is the gap
 * between the top two letters.
 */
export function calcInterim(
  answers: ReadonlyArray<RawAnswer | null>,
  observations: readonly string[],
  occupation: string,
): InterimRead {
  const { dc, pri, sec } = calcProfile(answers.slice(0, MONEY_ANCHOR_QI), observations, occupation);
  const gap = dc[pri] - dc[sec];
  return { dc, pri, sec, conf: gap >= 4 ? 'clear' : gap >= 2 ? 'fairly clear' : 'still forming' };
}

function isPole(key: TrackKey, value: unknown): boolean {
  const axis = DISCOVERY_AXES[key];
  return value === axis.left || value === axis.right;
}

/** Validates a stored or in-progress tracks object. */
export function isDiscoveryTracks(value: unknown): value is DiscoveryTracks {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return TRACK_KEYS.every((key) => isPole(key, candidate[key]));
}

/** Number of tracks answered so far (0–4). */
export function answeredTrackCount(tracks: Partial<DiscoveryTracks>): number {
  return TRACK_KEYS.filter((key) => isPole(key, tracks[key])).length;
}

/** The answer array as saved: the money anchor's slot carries the tracks. */
export function withTracks(
  answers: ReadonlyArray<RawAnswer | null>,
  tracks: Partial<DiscoveryTracks>,
): Array<RawAnswer | null> {
  return answers.map((answer, qi) =>
    qi === MONEY_ANCHOR_QI && answer && isDiscoveryTracks(tracks) ? { ...answer, tracks } : answer,
  );
}

/** What a saved row knows about its discovery phase (nulls for pre-v6 rows). */
export function readStoredDiscovery(answers: ReadonlyArray<RawAnswer | null> | null): {
  tracks: DiscoveryTracks | null;
  worry: DiscLetter | null;
} {
  const anchor = answers?.[MONEY_ANCHOR_QI] ?? null;
  const tracks = anchor && isDiscoveryTracks(anchor.tracks) ? anchor.tracks : null;
  return { tracks, worry: tracks && anchor ? anchor.d : null };
}

/** A sentence fragment; `strong` marks v6's bolded phrase. */
export interface ReadSegment {
  text: string;
  strong?: boolean;
}

/** v6 `combinedRead`: one paragraph across all four tracks. */
export function combinedRead(t: DiscoveryTracks): ReadSegment[] {
  const anxious = t.temperament === 'Anxious';
  const familiar = t.openness === 'Familiar';
  const anchor: ReadSegment[] =
    anxious && familiar
      ? [{ text: 'Careful and wants it simple — a ' }, { text: 'prove-it-is-safe-in-plain-language', strong: true }, { text: ' prospect.' }]
      : anxious
        ? [{ text: 'Cautious but intellectually curious — wants to ' }, { text: 'understand the safety', strong: true }, { text: ', not just be told.' }]
        : familiar
          ? [{ text: 'Relaxed about money but prefers the ' }, { text: 'simple proven route', strong: true }, { text: ' — do not overcomplicate.' }]
          : [{ text: 'Comfortable with risk and complexity — you can bring the ' }, { text: 'real strategy', strong: true }, { text: ', they will engage.' }];
  const steer = [
    anxious ? 'Lead with protection and certainty.' : 'Lead with the plan and the upside — they can take it.',
    t.horizon === 'Present' ? 'Frame it around what it does for them now.' : 'Frame it around the 10-20 year picture.',
    t.decision === 'Deliberate'
      ? 'Do not push to close today — set the next meeting before you part.'
      : 'They can decide at the table — be ready to act same-day.',
  ];
  return [...anchor, { text: ` ${steer.join(' ')}` }];
}

/** v6 `tailoredFU`: echoes their own money worry, framed by horizon + decision. */
export function tailoredFollowUp(worry: DiscLetter | null, t: DiscoveryTracks): string {
  const opener = worry
    ? `Was thinking about what you shared — about ${MONEY_WORRY[worry].echo}.`
    : 'Was thinking about our conversation.';
  const middle =
    t.horizon === 'Present'
      ? ' I have put something together around exactly that — focused on what it does for you right now.'
      : ' I have put something together around exactly that, mapped out properly for the long run.';
  const ending =
    t.decision === 'Deliberate'
      ? ' No rush at all — take your time with it. When you are ready, I will walk you through it clearly.'
      : ' It is ready to go — if it makes sense when you see it, we can settle it the same day. When works for you?';
  return opener + middle + ending;
}

export interface GamePlan {
  prepare: string;
  showFirst: string;
  pace: string;
  openWith: string;
}

/** v6 `gamePlanHTML`: the Meeting 2 game plan. */
export function gamePlan(worry: DiscLetter | null, t: DiscoveryTracks): GamePlan {
  return {
    prepare:
      t.openness === 'Familiar'
        ? 'One simple plan, printed. Keep alternatives off the table — options overwhelm, one clear path works.'
        : 'Main plan plus one interesting alternative — they will enjoy comparing, and it builds trust.',
    showFirst:
      t.temperament === 'Anxious'
        ? 'The floor before the ceiling — what is guaranteed, what is protected. Growth talk only after they feel settled.'
        : 'Go straight to the plan and the trade-offs. Do not over-reassure — treat them as capable.',
    pace:
      t.decision === 'Deliberate'
        ? 'Do not aim to close this meeting. Aim for full clarity, then set meeting 3 before you part.'
        : 'Be ready to complete same-day — bring the paperwork, know the process end to end.',
    openWith: worry
      ? `"Last time you mentioned ${MONEY_WORRY[worry].short} — I built this around exactly that."`
      : '"I built this around what you shared last time."',
  };
}
